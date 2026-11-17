# analitica_ia_local.py
import json
import pyodbc
import requests
from datetime import datetime
from database_config import get_connection_string

# 📡 Conexión exacta a tu instancia de SQL Server 2019 en tu máquina/servidor
CONNECTION_STRING = get_connection_string()

# 🧠 Configuración local del motor de inferencia Ollama
OLLAMA_ENDPOINT = "http://localhost:11434/api/generate"
MODELO_LLM_LOCAL = "qwen2.5:1.5b" # Modelo ultra-ligero y rápido para entornos sin tarjetas gráficas pesadas

def extraer_metricas_operativas():
    """Consulta la base de datos local y extrae los resúmenes de rendimiento de la jornada."""
    conn = pyodbc.connect(CONNECTION_STRING)
    cursor = conn.cursor()
    
    # Extraer el volumen total e incidencias consolidadas por zona logistica
    cursor.execute("""
        SELECT 
            ISNULL(Z.Nombre_Zona, 'Sin Clasificar') AS Zona,
            COUNT(O.ID_Orden) AS Total_Envios,
            SUM(CASE WHEN O.Estado_Logistico = 'Incidencia' THEN 1 ELSE 0 END) AS Total_Incidencias,
            SUM(O.Cantidad_Paquetes) AS Total_Paquetes
        FROM dbo.Ordenes_Delivery O
        LEFT JOIN dbo.Zonas_Logisticas Z ON O.ID_Zona = Z.ID_Zona
        GROUP BY Z.Nombre_Zona
    """)
    
    filas = cursor.fetchall()
    
    resumen = []
    for fila in filas:
        resumen.append({
            "zona_logistica": fila[0],
            "total_guias": fila[1],
            "incidencias_reportadas": fila[2],
            "volumen_paquetes": fila[3]
        })
        
    cursor.close()
    conn.close()
    return resumen

def generar_minuta_predictiva_ia():
    """Toma las métricas de SQL Server y genera una minuta estratégica usando el LLM de Ollama local."""
    print(f"🧠 [{datetime.now().strftime('%T')}] Extrayendo datos para inferencia local de IA...")
    
    datos_jornada = extraer_metricas_operativas()
    
    if not datos_jornada:
        return "ℹ️ No hay suficiente historial de órdenes para procesar la analítica predictiva hoy."
        
    # Construcción estructurada del Prompt con tus datos reales unificados
    contexto_prompt = (
        "Actúa como un experto en Dirección Logística y Cadena de Suministro. "
        "Analiza el siguiente resumen en formato JSON de la operación local de hoy y proporciona una minuta gerencial "
        "ultra-concisa (máximo 3 párrafos). Identifica la zona con más incidencias y da una recomendación de mejora.\n\n"
        f"Datos de la operación real YGO:\n{json.dumps(datos_jornada, indent=2)}\n\n"
        "Responde en español de manera profesional y directa."
    )
    
    payload = {
        "model": MODELO_LLM_LOCAL,
        "prompt": contexto_prompt,
        "stream": False
    }
    
    try:
        print(f"⚡ Solicitando reporte analítico al modelo local '{MODELO_LLM_LOCAL}' vía Ollama...")
        response = requests.post(OLLAMA_ENDPOINT, json=payload, timeout=30)
        
        if response.status_code == 200:
            resultado_ia = response.json().get("response", "")
            print("✅ Reporte estratégico de IA Local generado de forma exitosa.")
            return resultado_ia
        else:
            return f"⚠️ No se pudo comunicar con Ollama. Código HTTP: {response.status_code}. Verifica que Ollama esté corriendo."
            
    except Exception as e:
        return f"❌ Fallo de comunicación local con Ollama: {str(e)}. Recuerda ejecutar 'ollama run {MODELO_LLM_LOCAL}' en tu consola."
