import pyodbc
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API Logística Central - Jorge Martínez")

# 🔒 CORSMiddleware: Permite que tu React (puerto 5173) lea de forma segura este Backend (puerto 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Dirección oficial de tu Frontend React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🛠️ 1. Configuración de parámetros de tu red local hacia la instancia nombrada
server = '10.0.0.1\\COMPAC'  
database = 'BD_Inventario_YGO'
username = <removed>
password = '***REMOVED***'  # 👈 COLOCA AQUÍ LA CONTRASEÑA REAL DE TU SERVIDOR

connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=no;TrustServerCertificate=yes;'

def ejecutar_consulta(query: str):
    """Función auxiliar ligera para conectar, extraer datos y cerrar la red de forma segura"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cursor.execute(query)
        
        # Obtener los nombres de las columnas reales de la tabla
        columnas = [columna[0] for columna in cursor.description]
        
        # Formatear las filas como un diccionario clave-valor para React
        resultado = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        return {"status": "success", "data": resultado}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# 📡 RUTA 1: Obtener registros de la tabla 'Equipo_Computo'
@app.get("/api/equipos")
def obtener_equipos():
    # Cambia 'Equipo_Computo' por la sintaxis exacta de tu tabla si es necesario
    return ejecutar_consulta("SELECT * FROM Equipo_Computo")


# 📡 RUTA 2: Obtener registros de la tabla 'Correo_Electronico'
@app.get("/api/correos")
def obtener_correos():
    return ejecutar_consulta("SELECT * FROM Correo_Electronico")


# 📡 RUTA 3: Obtener registros de la tabla 'Historial_Mantenimiento'
@app.get("/api/mantenimientos")
def obtener_mantenimientos():
    return ejecutar_consulta("SELECT * FROM Historial_Mantenimiento")


# 🌐 RUTA RAÍZ: Test de Vida de la API
@app.get("/")
def test_api():
    return {"message": "Micro-Backend de Jorge Martínez en ejecución. Listo para surtir datos a React."}
