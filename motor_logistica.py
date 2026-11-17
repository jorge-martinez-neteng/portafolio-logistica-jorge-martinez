# motor_logistica.py
import re
import pyodbc
from datetime import datetime
from database_config import get_connection_string

# 📡 Parámetros de red exactos hacia tu instancia local SQL Server
CONNECTION_STRING = get_connection_string()

# Matriz corporativa de reglas geográficas por palabras clave locales
DICCIONARIO_ZONAS = {
    'ZONA_NORTE_1': ['satelite', 'satélite', 'naucalpan', 'atizapan', 'atizapán', 'tlalnepantla', 'izcalli'],
    'ZONA_CENTRO_1': ['reforma', 'polanco', 'cuauhtemoc', 'cuauhtémoc', 'centro', 'roma', 'condesa', 'juarez'],
    'ZONA_SUR_1': ['coyoacan', 'coyoacán', 'san angel', 'san ángel', 'tlalpan', 'xochimilco', 'pedregal'],
    'ZONA_ORIENTE_1': ['aeropuerto', 'iztapalapa', 'nezahualcoyotl', 'neza', 'venustiano carranza', 'chalco']
}

def garantizar_catalogo_zonas():
    """Garantiza la existencia estructural de las zonas y bahías físicas en SQL Server"""
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    
    zonas_infraestructura = [
        ('ZONA_NORTE_1', 'Zona Norte / Satélite', 'Bahía A-1 (Rampa Norte)'),
        ('ZONA_CENTRO_1', 'Zona Centro / Reforma', 'Bahía B-1 (Despacho General)'),
        ('ZONA_SUR_1', 'Zona Sur / Coyoacán', 'Bahía A-3 (Contenedor Sur)'),
        ('ZONA_ORIENTE_1', 'Zona Oriente / Aeropuerto', 'Bahía C-2 (Rampa Oriente)')
    ]
    
    for id_zona, nombre, bahia in zonas_infraestructura:
        cursor.execute("""
            IF NOT EXISTS (SELECT 1 FROM dbo.Zonas_Logisticas WHERE ID_Zona = ?)
            BEGIN
                INSERT INTO dbo.Zonas_Logisticas (ID_Zona, Nombre_Zona, Bahia_Bodega, Fecha_Registro)
                VALUES (?, ?, ?, GETDATE())
            END
        """, (id_zona, nombre, bahia))
        
    conn.commit()
    cursor.close()
    conn.close()

def ejecutar_clasificacion_geografica():
    """
    Analiza las direcciones entrantes en estado 'Recibido', asigna la zona 
    interna y unifica la carga de forma agnóstica al proveedor.
    """
    garantizar_catalogo_zonas()
    print(f"🧠 [{datetime.now().strftime('%T')}] Ejecutando motor de consolidación inter-cliente...")
    
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    
    # Seleccionar solo paquetes recién ingresados por el pipeline
    cursor.execute("""
        SELECT ID_Orden, Direccion_Limpia, ID_Cliente 
        FROM dbo.Ordenes_Delivery 
        WHERE Estado_Logistico = 'Recibido' AND ID_Zona IS NULL
    """)
    filas_pendientes = cursor.fetchall()
    
    if not filas_pendientes:
        print("ℹ️ Carga consolidada. No se encontraron paquetes pendientes de zonificación.")
        cursor.close()
        conn.close()
        return {"status": "success", "processed_packages": 0}
        
    paquetes_ruteados = 0
    
    for id_orden, direccion, id_cliente in filas_pendientes:
        # Zona comodín o de contingencia asignada por defecto si no hace match
        zona_match = 'ZONA_NORTE_1' 
        direccion_normalizada = direccion.lower()
        
        hizo_match = False
        for zona_id, tokens in DICCIONARIO_ZONAS.items():
            for token in tokens:
                # Búsqueda por token exacto para evitar falsos positivos en las calles
                if re.search(r'\b' + re.escape(token) + r'\b', direccion_normalizada):
                    zona_match = zona_id
                    hizo_match = True
                    break
            if hizo_match:
                break
                
        # Transición relacional de estado logístico a 'Clasificado'
        cursor.execute("""
            UPDATE dbo.Ordenes_Delivery
            SET ID_Zona = ?, Estado_Logistico = 'Clasificado'
            WHERE ID_Orden = ?
        """, (zona_match, id_orden))
        
        paquetes_ruteados += 1
        print(f"📌 Paquete {id_orden} de [{id_cliente}] consolidado en -> {zona_match}")
        
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"🏁 Motor finalizado de manera local. {paquetes_ruteados} paquetes asignados a bahías físicas.")
    return {"status": "success", "processed_packages": paquetes_ruteados}
