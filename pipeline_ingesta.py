# pipeline_ingesta.py
import os
import glob
import pyodbc
import duckdb
import pandas as pd
from datetime import datetime

# 📡 Parámetros de red exactos hacia tu instancia local SQL Server
SERVER = '10.0.0.1\\COMPAC'  
DATABASE = 'BD_Inventario_YGO'
USERNAME = <removed>
PASSWORD = <removed>
CONNECTION_STRING = (
    f'DRIVER={{ODBC Driver 18 for SQL Server}};'
    f'SERVER={SERVER};DATABASE={DATABASE};'
    f'UID={USERNAME};PWD={PASSWORD};'
    f'Encrypt=no;TrustServerCertificate=yes;'
)

# 📂 Directorio de almacenamiento temporal local
BRONZE_DIR = "./storage/bronze"
os.makedirs(BRONZE_DIR, exist_ok=True)

def procesar_ingesta_medallon():
    """
    Lee archivos inestables en Bronce, aplica 'union_by_name' en Capa Plata 
    usando DuckDB, mapea los campos dinámicamente y los persiste en SQL Server (Oro).
    """
    print(f"🔄 [{datetime.now().strftime('%T')}] Iniciando pipeline multicanal YGO...")
    
    archivos_excel = glob.glob(os.path.join(BRONZE_DIR, "*.xlsx"))
    archivos_csv = glob.glob(os.path.join(BRONZE_DIR, "*.csv"))
    todos_los_archivos = archivos_excel + archivos_csv
    
    if not todos_los_archivos:
        print("ℹ️ Directorio Bronce vacío. Sin archivos nuevos para procesar.")
        return {"status": "empty", "message": "No hay archivos en la bandeja de entrada local."}
        
    try:
        # Iniciar motor en memoria DuckDB
        con_duck = duckdb.connect(database=':memory:')
        
        # Unificar dinámicamente si hay mezclas de CSVs
        if archivos_csv:
            orders_df = con_duck.execute("""
                SELECT * FROM read_csv_auto('./storage/bronze/*.csv', union_by_name=True, all_varchar=True)
            """).df()
        # Unificación robusta mediante Pandas para archivos de Excel mutables
        else:
            dfs = [pd.read_excel(f).astype(str) for f in archivos_excel]
            orders_df = pd.concat(dfs, ignore_index=True, sort=False)
            con_duck.register('vista_plata', orders_df)
            orders_df = con_duck.execute("SELECT * FROM vista_plata").df()
            
        print(f"📦 Capa Plata unificada. Columnas procesadas: {list(orders_df.columns)}")
        
        # Mapeo inteligente de encabezados mutables (Variaciones comunes de clientes)
        columnas_lower = [col.lower() for col in orders_df.columns]
        
        def detectar_columna(posibles_nombres):
            for nombre in posibles_nombres:
                if nombre.lower() in columnas_lower:
                    return orders_df.columns[columnas_lower.index(nombre.lower())]
            return None

        col_id = detectar_columna(['id', 'id_orden', 'sku', 'orden', 'reference', 'numero', 'id_pedido'])
        col_cliente = detectar_columna(['cliente', 'id_cliente', 'proveedor', 'empresa', 'owner', 'marca'])
        col_guia = detectar_columna(['guia', 'no_guia', 'tracking', 'numero_guia', 'guía'])
        col_direccion = detectar_columna(['direccion', 'dirección', 'destino', 'address', 'calle', 'domicilio'])
        col_paquetes = detectar_columna(['cantidad', 'paquetes', 'bultos', 'piezas', 'qty', 'count'])
        col_prioridad = detectar_columna(['prioridad', 'priority', 'tipo_servicio', 'sla'])
        col_destinatario = detectar_columna(['destinatario', 'nombre', 'contacto', 'recibe', 'cliente_final'])

        # Persistencia en Capa Oro (SQL Server 2019)
        conn_sql = pyodbc.connect(CONNECTION_STRING)
        cursor = conn_sql.cursor()
        registros_correctos = 0
        
        for _, fila in orders_df.iterrows():
            id_orden = str(fila[col_id]).strip() if col_id else f"YGO-{datetime.now().strftime('%y%m%d%H%M%S%f')}"
            id_cliente = str(fila[col_cliente]).strip().upper() if col_cliente else "CLIENTE_DESCONOCIDO"
            no_guia = str(fila[col_guia]).strip() if col_guia else f"GUI-{datetime.now().strftime('%M%S%f')}"
            direccion = str(fila[col_direccion]).strip() if col_direccion else "Sin dirección registrada"
            destinatario = str(fila[col_destinatario]).strip() if col_destinatario else "S/D"
            prioridad = str(fila[col_prioridad]).strip() if col_prioridad else "Media"
            
            try:
                cantidad = int(float(fila[col_paquetes])) if col_paquetes and pd.notna(fila[col_paquetes]) else 1
            except ValueError:
                cantidad = 1
                
            # Registrar al Cliente Logístico de forma automática en su catálogo maestro para evitar quiebres de FK
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM dbo.Clientes_Logiticos WHERE ID_Cliente = ?)
                BEGIN
                    INSERT INTO dbo.Clientes_Logiticos (ID_Cliente, Razon_Social, Estatus)
                    VALUES (?, ?, 'Activo')
                END
            """, (id_cliente, id_cliente, id_cliente))
            
            # Insertar en la tabla transaccional controlando duplicados por ID de Orden
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM dbo.Ordenes_Delivery WHERE ID_Orden = ?)
                BEGIN
                    INSERT INTO dbo.Ordenes_Delivery (
                        ID_Orden, ID_Cliente, No_Guia, Destinatario, Direccion_Limpia, 
                        Cantidad_Paquetes, Prioridad, Estado_Logistico, Fecha_Ingreso
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Recibido', GETDATE())
                END
            """, (id_orden, id_orden, id_cliente, no_guia, destinatario, direccion, cantidad, prioridad))
            
            registros_correctos += 1
            
        conn_sql.commit()
        cursor.close()
        conn_sql.close()
        
        # Purgado y limpieza preventiva mensual/operativa de archivos locales procesados
        for archivo in todos_los_archivos:
            try:
                os.remove(archivo)
            except Exception:
                pass
                
        print(f"🔒 [{datetime.now().strftime('%T')}] Pipeline completado. {registros_correctos} órdenes inyectadas en la Capa Oro.")
        return {"status": "success", "processed": registros_correctos}
        
    except Exception as e:
        print(f"❌ Error en el Pipeline de Ingesta Medallón: {str(e)}")
        return {"status": "error", "message": str(e)}
