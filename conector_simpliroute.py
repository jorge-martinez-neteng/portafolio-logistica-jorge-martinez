# conector_simpliroute.py
import os
import json
import pyodbc
import requests
from datetime import datetime

# Intentar cargar las variables de entorno locales desde el archivo .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 📡 Parámetros de red exactos hacia tu instancia local SQL Server 2019
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

# ======================================================================
# 🔑 EXTRACCIÓN SEGURA Y AUTOMATIZADA DE LA API KEY (PASO 4 COMPLETADO)
# ======================================================================
# Lee la credencial desde el archivo .env privado. Si no se encuentra, 
# recurre al modo de respaldo controlado de simulación local.
SIMPLIROUTE_API_KEY = os.getenv("SIMPLIROUTE_API_KEY", "***REMOVED***")
SIMPLIROUTE_BASE_URL = "https://simpliroute.com"

def obtener_headers_simpliroute():
    return {
        "Authorization": f"Token {SIMPLIROUTE_API_KEY}",
        "Content-Type": "application/json"
    }

def obtener_visitas_simpliroute(fecha_str=None):
    """
    Obtiene las visitas del día desde SimpliRoute mediante GET.
    Maneja 404 y fechas sin rutas de forma segura devolviendo arreglo vacío sin simulaciones.
    """
    if not fecha_str:
        fecha_str = datetime.now().strftime("%Y-%m-%d")
        
    url = f"{SIMPLIROUTE_BASE_URL}/v1/routes/visits/?created_at={fecha_str}"
    headers = obtener_headers_simpliroute()
    
    try:
        res = requests.get(url, headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, dict):
                return data
            elif isinstance(data, list):
                return {"count": len(data), "next": None, "previous": None, "results": data}
        else:
            print(f"⚠️ [SIMPLIROUTE GET] Status HTTP {res.status_code} para fecha {fecha_str}")
            return {"count": 0, "next": None, "previous": None, "results": []}
    except Exception as e:
        print(f"❌ [SIMPLIROUTE GET] Error: {str(e)}")
        return {"count": 0, "next": None, "previous": None, "results": []}

def obtener_vehiculos_simpliroute(fecha_str=None):
    """
    Obtiene la lista de vehículos y su estado de ruta del día desde SimpliRoute.
    """
    if not fecha_str:
        fecha_str = datetime.now().strftime("%Y-%m-%d")
        
    url_rutas = f"{SIMPLIROUTE_BASE_URL}/v1/routes/vehicles/?planned_date={fecha_str}"
    url_flota = f"{SIMPLIROUTE_BASE_URL}/v1/fleet/vehicles/"
    headers = obtener_headers_simpliroute()
    
    vehiculos = []
    try:
        res = requests.get(url_rutas, headers=headers, timeout=8)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list):
                vehiculos = data
            elif isinstance(data, dict) and "results" in data:
                vehiculos = data["results"]
        else:
            res_flota = requests.get(url_flota, headers=headers, timeout=8)
            if res_flota.status_code == 200:
                data_flota = res_flota.json()
                vehiculos = data_flota if isinstance(data_flota, list) else data_flota.get("results", [])
    except Exception as e:
        print(f"❌ [SIMPLIROUTE VEHICULOS] Error: {str(e)}")
        
    return vehiculos

def obtener_eventos_simpliroute(fecha_str=None):
    """
    Extrae eventos recientes desde las visitas de SimpliRoute.
    """
    visitas_data = obtener_visitas_simpliroute(fecha_str)
    visitas = visitas_data.get("results", [])
    
    eventos = []
    for v in visitas:
        status = v.get("status", "pending")
        if status in ["completed", "failed"]:
            eventos.append({
                "id": v.get("id"),
                "titulo": v.get("title", "Visita"),
                "direccion": v.get("address", ""),
                "status": status,
                "driver": v.get("driver", "No asignado"),
                "vehicle": v.get("vehicle", "No asignado"),
                "checkout_time": v.get("checkout_time") or v.get("estimated_time_arrival") or "Sin registro"
            })
    return eventos

# ======================================================================

def sincronizar_zona_con_simpliroute(id_zona_logistica):
    """
    Saca las órdenes consolidadas de la zona en SQL Server, arma el payload unificado
    inter-cliente y envía las paradas de distribución a la API externa de Simpliroute.
    """
    print(f"🚚 [{datetime.now().strftime('%T')}] Extrayendo carga consolidada para {id_zona_logistica}...")
    
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    
    # Cruzar las órdenes clasificadas por zona mezclando todos los clientes en el mismo viaje virtual
    cursor.execute("""
        SELECT ID_Orden, ID_Cliente, No_Guia, Destinatario, Direccion_Limpia, Cantidad_Paquetes, Prioridad
        FROM dbo.Ordenes_Delivery
        WHERE Estado_Logistico = 'Clasificado' AND ID_Zona = ?
    """, (id_zona_logistica,))
    
    paquetes_zona = cursor.fetchall()
    
    if not paquetes_zona:
        print(f"ℹ️ Sin paquetes pendientes para despacho en la zona: {id_zona_logistica}")
        cursor.close()
        conn.close()
        return {"status": "empty", "message": "No hay órdenes listas en esta zona geográfica."}
        
    headers = {
        "Authorization": f"Token {SIMPLIROUTE_API_KEY}",
        "Content-Type": "application/json"
    }
    
    paradas_sincronizadas = 0
    modo_simulacion = (SIMPLIROUTE_API_KEY == "CONFIGURAR_API_KEY_AQUI")
    
    for paquete in paquetes_zona:
        id_orden, id_cliente, no_guia, destinatario, direccion, cantidad, prioridad = paquete
        
        payload_visita = {
            "title": f"Guía: {no_guia} | {id_cliente}",
            "address": direccion,
            "description": f"Destinatario: {destinatario} | Paquetes: {cantidad} | Ref ERP: {id_orden}",
            "window_start": "09:00:00",
            "window_end": "18:00:00",
            "load": float(cantidad),
            "priority": 1 if prioridad.lower() in ["alta", "urgente", "high"] else 2,
            "tracking_identifier": id_orden
        }
        
        try:
            if modo_simulacion:
                status_codigo = 201
                response_json = {"id": 88888, "status": "simulated_success_local"}
            else:
                response = requests.post(SIMPLIROUTE_BASE_URL, data=json.dumps(payload_visita), headers=headers, timeout=12)
                status_codigo = response.status_code
                response_json = response.json() if status_codigo == 201 else {}

            if status_codigo == 201:
                cursor.execute("""
                    UPDATE dbo.Ordenes_Delivery
                    SET Estado_Logistico = 'En Bodega'
                    WHERE ID_Orden = ?
                """, (id_orden,))
                paradas_sincronizadas += 1
            else:
                print(f"⚠️ Simpliroute rechazó la órden {id_orden}. Código de error HTTP: {status_codigo}")
                
        except Exception as e:
            print(f"❌ Error de red en el canal de salida hacia la API: {str(e)}")
            
    conn.commit()
    cursor.close()
    conn.close()
    
    prefijo_msg = "[MODO SIMULACIÓN]" if modo_simulacion else "[LIVE API]"
    print(f"🏁 {prefijo_msg} Sincronización concluida. {paradas_sincronizadas} visitas creadas en Simpliroute.")
    return {"status": "success", "synced": paradas_sincronizadas, "mode": prefijo_msg}
