import pyodbc

server = '10.0.0.1\\COMPAC'
database = 'BD_Inventario_YGO'
username = <removed>
password = <removed>
connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=no;TrustServerCertificate=yes;'


try:
    print("🔄 Iniciando diagnóstico de infraestructura...")
    print(f"📡 Conectando al servidor central [{server}]...")
    
    
    conn = pyodbc.connect(connection_string)
    cursor = conn.cursor()
    print("✅ ¡Conexión TCP/IP exitosa desde Python!")
    
    print(f"\n📊 Inspeccionando metadatos de la base de datos: '{database}'...")
    
    cursor.execute("""
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
    """)
    
    tablas = cursor.fetchall()
    
    print(f"\n📂 Se encontraron {len(tablas)} tablas existentes actualmente:")
    print("-" * 50)
    if len(tablas) == 0:
        print("ℹ️ La base de datos está completamente vacía (Lista para recibir requerimientos).")
    else:
        for fila in tablas:
            print(f"🔹 Tabla encontrada: {fila[0]}")
    print("-" * 50)
    
    cursor.close()
    conn.close()
    print("\n🔒 Canal de comunicación cerrado de forma segura. ¡Estación de desarrollo validada!")

except Exception as e:
    print("\n❌ Error de infraestructura o comunicación de red:")
    print(e)




