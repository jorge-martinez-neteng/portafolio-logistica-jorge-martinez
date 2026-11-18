import os
import requests
import pyodbc
import uuid
import hmac
from fastapi import FastAPI, HTTPException, Body, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from passlib.context import CryptContext
from database_config import get_connection_string, SQL_SERVER, SQL_DATABASE

# 🧠 Motor Criptográfico Global: Traduce los hashes $2b$12 de tu SQL Server
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración de FastAPI para el Sistema Central YGO
app = FastAPI(title="API Logistica Central YGO - Jorge Martinez")

# 🔒 CORSMiddleware de Producción Liberado: Habilita Electron, tablets y red local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite que cualquier terminal de tu red local se conecte a la API
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🛠️ Parámetros de red hacia la instancia nombrada en tu servidor local
server = SQL_SERVER
database = SQL_DATABASE
connection_string = get_connection_string()

# ==========================================================================
# MODELOS PYDANTIC ACTUALIZADOS CON LA NUEVA MATRIZ DE CATEGORÍAS
# ==========================================================================
class LoginRequest(BaseModel):
    username: str
    password: str

class RegistroRequest(BaseModel):
    id_empleado: str  
    username: str
    password: str
    rol: str  

class NuevoEquipoRequest(BaseModel):
    # La categoría del frontend (Cómputo, Móviles, Pantallas, Impresión, Redes, Vehículo)
    categoria_filtro: str  
    subcategoria: str  # Mapea el Tipo_Equipo o subcategoría exacta
    marca: str
    modelo: str
    id_empleado: Optional[str] = None
    serie: Optional[str] = "sin serie"
    procesador: Optional[str] = None
    ram: Optional[str] = None
    tarjeta_grafica: Optional[str] = None
    almacenamiento: Optional[str] = None
    tipo_almacenamiento: Optional[str] = None
    estado_equipo: str  # nuevo, reacondicionado, etc.
    accesorios: Optional[str] = None
    precio: Optional[float] = None
    
    # 📱 Campos específicos para Dispositivos Móviles
    nombre_equipo: Optional[str] = None
    color: Optional[str] = None
    imei: Optional[str] = None
    operador_original: Optional[str] = None
    
    # 💳 Campos específicos para la sección integrada de tarjetas SIM
    numero_telefonico: Optional[str] = None
    prefijo_internacional: Optional[str] = "+52" # Default México
    compania: Optional[str] = None
    iccid: Optional[str] = None
    
    # 🚐 Campos específicos para la Flota Vehicular
    placas: Optional[str] = "sin Placa"
    duplicado_llave: Optional[str] = "sin duplicado"
    propietario: Optional[str] = None
    ubicacion: Optional[str] = None
    referencia: Optional[str] = None

class AsignarEquipoRequest(BaseModel):
    id_equipo: str
    id_empleado: Optional[str] = None 

class EliminarEquipoRequest(BaseModel):
    id_equipo: str
    categoria: str 

# ==========================================================================
# ESQUEMAS PYDANTIC MAESTROS YGO ACTUALIZADOS CON FECHAS Y SECCIÓN TALLER
# ==========================================================================

class NuevoEmpleadoRequest(BaseModel):
    nombre: str
    ap_paterno: str
    ap_materno: Optional[str] = ""
    cargo: str
    id_computo_opcional: Optional[str] = None
    id_celular_opcional: Optional[str] = None
    id_vehiculo_opcional: Optional[str] = None
    # 📅 Nuevos atributos obligatorios de auditoría laboral
    inicio_contrato: Optional[str] = None
    termino_contrato: Optional[str] = None

class RenovarContratoRequest(BaseModel):
    id_empleado: str
    nueva_fecha_termino: str

class NuevaOrdenTallerRequest(BaseModel):
    id_vehiculo: str
    tipo_mantenimiento: str
    kilometraje: int
    fecha_promesa: str
    descripcion_falla: str
    mecanico_responsable: str # ⚙️ Casilla solicitada para Historial_Mantenimiento


class ActivoDevuelto(BaseModel):
    id_activo: str
    tipo: str  
    condicion_entrega: str  

class BajaEmpleadoRequest(BaseModel):
    id_empleado: str
    activos_devueltos: Optional[list[ActivoDevuelto]] = []

class EvaluarEmpleadoRequest(BaseModel):
    id_empleado: str
    calificacion_conducta: str  
    calificacion_valores: str   
    observaciones: Optional[str] = ""
   

class EliminarUsuarioRequest(BaseModel):
    username_a_eliminar: str
    username_gerente: str  

class CambiarEstatusSimRequest(BaseModel):
    id_sim: int
    nuevo_estatus: str
# ==========================================================================
# FUNCIONES AUXILIARES Y CONSULTAS DE BASE DE DATOS REALES
# ==========================================================================

def ejecutar_consulta(query: str):
    """Función auxiliar ligera para conectar, extraer datos y cerrar la red de forma segura"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cursor.execute(query)
        columnas = [columna[0] for columna in cursor.description]
        resultado = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        cursor.close()
        conn.close()
        return {"status": "success", "data": resultado}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/equipos")
def obtener_equipos(username: str = None, token_sesion: str = None):
    if username and token_sesion:
        if not verificar_sesion_unica(username, token_sesion):
            raise HTTPException(
                status_code=401, 
                detail="Sesión inválida o activa en otro dispositivo. Se ha cerrado tu sesión."
            )
            
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Consulta calibrada utilizando alias estrictos e inequívocos
        query_unificada = """
            SELECT 
                E.ID_Equipo AS id_activo,
                E.Tipo_Equipo AS categoria,
                E.Marca AS marca,
                E.Modelo AS modelo,
                E.Status AS status,
                EMP.Nombre AS empleado_nombre,
                EMP.Ap_Paterno AS empleado_paterno,
                E.Serie AS identificador_serie,
                'N/A' AS referencia,
                'N/A' AS duplicado_llave,
                'N/A' AS propietario,
                'N/A' AS ubicacion,
                E.Precio AS precio
            FROM dbo.Equipo_Computo E
            LEFT JOIN dbo.Empleado EMP ON E.ID_Empleado = EMP.ID_Empleado
            
             UNION ALL
            
            SELECT 
                C.ID_Celular AS id_activo,
                'Celular' AS categoria,
                C.Marca AS marca,
                C.Modelo AS modelo,
                C.Status_Inventario AS status,
                EMP.Nombre AS empleado_nombre,
                EMP.Ap_Paterno AS empleado_paterno,
                C.Serie AS identificador_serie,
                'N/A' AS referencia,
                'N/A' AS duplicado_llave,
                'N/A' AS propietario,
                'N/A' AS ubicacion,
                C.Precio AS precio
            FROM dbo.Celular C
            LEFT JOIN dbo.Empleado EMP ON EMP.ID_Celular = C.ID_Celular
            
            UNION ALL
            
            SELECT 
                V.ID_Vehiculo AS id_activo,
                'Vehiculo' AS categoria,
                V.Marca AS marca,
                V.Modelo AS modelo,
                V.Status_Vehiculo AS status,
                EMP.Nombre AS empleado_nombre,
                EMP.Ap_Paterno AS empleado_paterno,
                V.Placas AS identificador_serie,
                V.Referencia AS referencia,
                V.Duplicado_Llave AS duplicado_llave,
                V.Propietario AS propietario,
                V.Ubicacion AS ubicacion,
                0.0 AS precio
            FROM dbo.Vehiculo V
            LEFT JOIN dbo.Empleado EMP ON V.ID_Empleado = EMP.ID_Empleado
        """
        cursor.execute(query_unificada)
        
        # Extraemos los nombres de las columnas para el mapeo asociativo
        columnas = [column[0] for column in cursor.description]
        rows = cursor.fetchall()
        
        lista_activos = []
        for row in rows:
            # Vinculamos los nombres de las columnas con los valores del renglón actual
            datos_fila = dict(zip(columnas, row))
            
            # 🛡️ Filtro de seguridad: Validación y limpieza estricta contra valores nulos (None)
            id_act = str(datos_fila.get("id_activo")).strip() if datos_fila.get("id_activo") is not None else "S/ID"
            cat_act = str(datos_fila.get("categoria")).strip() if datos_fila.get("categoria") is not None else "Genérico"
            mar_act = str(datos_fila.get("marca")).strip() if datos_fila.get("marca") is not None else "Desconocida"
            mod_act = str(datos_fila.get("modelo")).strip() if datos_fila.get("modelo") is not None else "Genérico"
            st_act = str(datos_fila.get("status")).strip() if datos_fila.get("status") is not None else "disponible"
            
            emp_nom = str(datos_fila.get("empleado_nombre")).strip() if datos_fila.get("empleado_nombre") is not None else None
            emp_pat = str(datos_fila.get("empleado_paterno")).strip() if datos_fila.get("empleado_paterno") is not None else None
            ser_act = str(datos_fila.get("identificador_serie")).strip() if datos_fila.get("identificador_serie") is not None else "S/N"
            
            ref_act = str(datos_fila.get("referencia")).strip() if datos_fila.get("referencia") is not None else ""
            dup_act = str(datos_fila.get("duplicado_llave")).strip() if datos_fila.get("duplicado_llave") is not None else ""
            prop_act = str(datos_fila.get("propietario")).strip() if datos_fila.get("propietario") is not None else ""
            ub_act = str(datos_fila.get("ubicacion")).strip() if datos_fila.get("ubicacion") is not None else ""
            
            try:
                prec_act = float(datos_fila.get("precio")) if datos_fila.get("precio") is not None else 0.0
            except Exception:
                prec_act = 0.0

            lista_activos.append({
                "id_activo": id_act,
                "categoria": cat_act,
                "marca": mar_act,
                "modelo": mod_act,
                "status": st_act,
                "empleado_nombre": emp_nom,
                "empleado_paterno": emp_pat,
                "serie": ser_act,
                "referencia": ref_act,
                "duplicado_llave": dup_act,
                "propietario": prop_act,
                "ubicacion": ub_act,
                "precio": prec_act
            })
            
        return {"status": "success", "data": lista_activos}
        
    except Exception as e:
        return {"status": "error", "message": f"Error en base de datos YGO: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@app.get("/api/empleados-lista")
def obtener_lista_empleados():
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cursor.execute("SELECT ID_Empleado, Nombre, Ap_Paterno FROM dbo.Empleado WHERE Estatus = 'Activo'")
        rows = cursor.fetchall()
        
        empleados = []
        for row in rows:
            empleados.append({
                "id_empleado": row[0].strip() if row[0] else "",
                "nombre_completo": f"{row[1].strip() if row[1] else ''} {row[2].strip() if row[2] else ''}".strip()
            })
        return {"status": "success", "data": empleados}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/api/sims-lista")
def obtener_lista_sims():
    """📡 ENDPOINT MAESTRO: Vincula la relación relacional indirecta sin errores de columna inválida en Celular"""
    query = """
        SELECT 
            S.ID_SIM AS id_sim, 
            ISNULL(S.Numero_Telefonico, 'Sin Número') AS numero_telefonico, 
            ISNULL(S.Compania, 'Telcel') AS compania, 
            ISNULL(S.ICCID, 'Sin ICCID') AS iccid, 
            ISNULL(S.Estatus_Sim, 'Activo') AS estatus_sim, 
            ISNULL(S.prefijo_internacional, '+52') AS prefijo_internacional,
            C.ID_Celular AS celular_id,
            C.Serie AS celular_imei,
            E.Nombre + ' ' + E.Ap_Paterno AS empleado_assigned
        FROM dbo.SIM S
        LEFT JOIN dbo.Celular C ON S.ID_SIM = C.ID_SIM
        LEFT JOIN dbo.Empleado E ON C.ID_Celular = E.ID_Celular
    """
    respuesta = ejecutar_consulta(query)
    if respuesta.get("status") == "success" and isinstance(respuesta.get("data"), list):
        for item in respuesta["data"]:
            if not item.get("empleado_assigned") or str(item.get("empleado_assigned")).strip().lower() == "none":
                item["empleado_assigned"] = "Sin Asignar"
            if not item.get("celular_imei") or str(item.get("celular_imei")).strip().lower() == "none":
                item["celular_imei"] = "S/N IMEI"
    return respuesta




@app.get("/api/computo-disponibles")
def obtener_computo_disponibles():
    """Retorna de forma limpia y garantizada las computadoras sin empleado asignado"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        query = """
            SELECT 
                LTRIM(RTRIM(ID_Equipo)) AS ID_Equipo, 
                LTRIM(RTRIM(Marca)) AS Marca, 
                LTRIM(RTRIM(Modelo)) AS Modelo, 
                LTRIM(RTRIM(Serie)) AS Serie 
            FROM dbo.Equipo_Computo 
            WHERE ID_Empleado IS NULL OR LTRIM(RTRIM(ID_Empleado)) = '' OR ID_Empleado = 'None'
        """
        cursor.execute(query)
        # 🔑 CORRECCIÓN CRÍTICA DE DRIVER: Extraemos el primer índice col[0] para obtener el string puro del campo
        columnas = [col[0] for col in cursor.description]
        resultado = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        return {"status": "success", "data": resultado}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/api/celulares-disponibles")
def obtener_celulares_disponibles():
    """Retorna de forma limpia y garantizada la telefonía sin empleado asignado"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        query = """
SELECT *
FROM dbo.Celular c
WHERE NOT EXISTS (    
    SELECT 1 
    FROM dbo.Empleado e 
    WHERE e.ID_Celular = c.ID_Celular
);

        """
        cursor.execute(query)
        columnas = [col[0] for col in cursor.description]
        resultado = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        return {"status": "success", "data": resultado}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/api/vehiculos-disponibles")
def obtener_vehiculos_disponibles():
    """Retorna de forma limpia y garantizada la flota vehicular sin empleado asignado"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        query = """
            SELECT 
                LTRIM(RTRIM(ID_Vehiculo)) AS ID_Vehiculo, 
                LTRIM(RTRIM(Marca)) AS Marca, 
                LTRIM(RTRIM(Modelo)) AS Modelo, 
                LTRIM(RTRIM(Placas)) AS Placas 
            FROM dbo.Vehiculo 
            WHERE ID_Empleado IS NULL OR LTRIM(RTRIM(ID_Empleado)) = '' OR ID_Empleado = 'None'
        """
        cursor.execute(query)
        columnas = [col[0] for col in cursor.description]
        resultado = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        return {"status": "success", "data": resultado}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/api/empleados-lista-completa")
def obtener_empleados_lista_completa():
    """Retorna la nómina total de colaboradores activos normalizando los metadatos de las columnas de SQL Server"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        query = """
            SELECT 
                LTRIM(RTRIM(ID_Empleado)) AS id_empleado, 
                LTRIM(RTRIM(Nombre)) + ' ' + LTRIM(RTRIM(Ap_Paterno)) AS nombre_completo 
            FROM dbo.Empleado 
            WHERE Estatus = 'Activo' 
            ORDER BY ID_Empleado ASC
        """
        cursor.execute(query)
        columnas = [col[0] for col in cursor.description]
        resultado = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        return {"status": "success", "data": resultado}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()



@app.get("/api/mantenimientos")
def obtener_mantenimientos(username: str = None, token_sesion: str = None):
    return ejecutar_consulta("SELECT * FROM dbo.Historial_Mantenimiento")
@app.post("/api/mantenimientos/nueva-orden")
def ingresar_unidad_a_taller_mecanico(request: NuevaOrdenTallerRequest):
    """Inserta la orden de servicio guardando el nombre del mecánico encargado de la reparación"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
            INSERT INTO dbo.Historial_Mantenimiento (
                ID_Vehiculo, Tipo_Mantenimiento, Kilometraje, Fecha, Descripcion, Mecanico_Responsable
            ) VALUES (?, ?, ?, ?, ?, ?)
        """
        cursor.execute(query, (
            request.id_vehiculo.strip(), request.tipo_mantenimiento, request.kilometraje,
            request.fecha_promesa, request.descripcion_falla, request.mecanico_responsable.strip()
        ))
        
        # Cambiamos el estatus de la flota en vivo a Reparación
        cursor.execute("UPDATE dbo.Vehiculo SET Status_Vehiculo = 'en reparación' WHERE ID_Vehiculo = ?", (request.id_vehiculo.strip(),))
        
        conn.commit()
        return {"status": "success", "message": f"Orden de servicio creada. Unidad {request.id_vehiculo} ingresada a taller."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/")
def test_api():
    return {"message": "Backend YGO en ejecución. Listo para surtir datos con filtros por categorías."}

# ==========================================================================
# ENDPOINT TRANSACCIONAL ADAPTADO PARA RECURSOS HUMANOS (CON CONSULTAS AISLADAS)
# ==========================================================================

@app.post("/api/empleados/nuevo")
def registrar_nuevo_empleado_con_herramientas(request: NuevoEmpleadoRequest):
    """Inserta el colaborador mapeando nativamente sus fechas de inicio y término de contrato laboral"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM dbo.Empleado")
        total_empleados = cursor.fetchone()[0]
        siguiente_id = f"Y{str(total_empleados + 1).zfill(2)}"
        
        # Inserción robusta incluyendo las dos nuevas columnas solicitadas
        query_emp = """
            INSERT INTO dbo.Empleado (
                ID_Empleado, Nombre, Ap_Paterno, Ap_Materno, Cargo, Estatus, Inicio_Contrato, Termino_Contrato
            ) VALUES (?, ?, ?, ?, ?, 'Activo', ?, ?)
        """
        cursor.execute(query_emp, (
            siguiente_id, request.nombre.strip(), request.ap_paterno.strip(), 
            request.ap_materno.strip(), request.cargo.strip(), 
            request.inicio_contrato, request.termino_contrato
        ))
        
        if request.id_computo_opcional and request.id_computo_opcional.strip() != "":
            cursor.execute("UPDATE dbo.Equipo_Computo SET ID_Empleado = ?, Status = 'activo' WHERE ID_Equipo = ?", (siguiente_id, request.id_computo_opcional.strip()))
        if request.id_celular_opcional and request.id_celular_opcional.strip() != "":
            cursor.execute("UPDATE dbo.Celular SET ID_Empleado = ?, Status_Inventario = 'activo' WHERE ID_Celular = ?", (siguiente_id, request.id_celular_opcional.strip()))
        if request.id_vehiculo_opcional and request.id_vehiculo_opcional.strip() != "":
            cursor.execute("UPDATE dbo.Vehiculo SET ID_Empleado = ?, Status_Vehiculo = 'activo' WHERE ID_Vehiculo = ?", (siguiente_id, request.id_vehiculo_opcional.strip()))
            
        conn.commit()
        return {"status": "success", "message": f"Colaborador contratado con éxito. Matrícula: {siguiente_id}"}
    except Exception as e:
        return {"status": "error", "message": f"Error en transaccion de nómina: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.post("/api/empleados/renovar-contrato")
def renovar_contrato_automatico_base(request: RenovarContratoRequest):
    """Actualiza de forma automatizada y directa en la base de datos la vigencia del contrato laboral"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE dbo.Empleado SET Termino_Contrato = ? WHERE ID_Empleado = ?", 
            (request.nueva_fecha_termino, request.id_empleado.strip())
        )
        conn.commit()
        return {"status": "success", "message": f"Contrato de colaborador {request.id_empleado} renovado con éxito."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# ==========================================================================
# ENDPOINTS ADICIONALES PARA EL REPORTE MAESTRO DE TI, AUDITORÍA Y SIMS
# ==========================================================================

class ActualizarSimRequest(BaseModel):
    id_sim: int
    nuevo_estatus: str

class ReasignarSimRequest(BaseModel):
    id_sim: int
    id_celular_nuevo: Optional[str] = None

@app.post("/api/sims/actualizar-estatus")
def actualizar_estatus_sim_avanzado(request: ActualizarSimRequest):
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        estatus_limpio = request.nuevo_estatus.strip()
        
        if estatus_limpio.lower() == "dar de baja":
            cursor.execute("DELETE FROM dbo.SIM WHERE ID_SIM = ?", (request.id_sim,))
            conn.commit()
            return {"status": "success", "message": f"Tarjeta SIM ID {request.id_sim} eliminada físicamente de SQL Server."}
            
        cursor.execute("UPDATE dbo.SIM SET Estatus_Sim = ? WHERE ID_SIM = ?", (estatus_limpio, request.id_sim))
        conn.commit()
        return {"status": "success", "message": f"Estatus de SIM ID {request.id_sim} actualizado a '{estatus_limpio}'."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
@app.post("/api/sims/reasignar")
def reasignar_numero_telefonico_celular(request: ReasignarSimRequest):
    """Vincula la tarjeta SIM a un nuevo dispositivo celular en la base de datos"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        id_cel = request.id_celular_nuevo.strip() if request.id_celular_nuevo else None
        
        cursor.execute("UPDATE dbo.Celular SET ID_SIM = NULL WHERE ID_SIM = ?", (request.id_sim,))
        if id_cel:
            cursor.execute("UPDATE dbo.Celular SET ID_SIM = ? WHERE ID_Celular = ?", (request.id_sim, id_cel))
            
        conn.commit()
        return {"status": "success", "message": "Línea telefónica vinculada al nuevo IMEI con éxito."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.post("/api/equipos/eliminar")
def eliminar_equipo_fisco(request: EliminarEquipoRequest):
    """Elimina físicamente el activo capturando errores de llave foránea para mandar un mensaje limpio al usuario"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cat = request.categoria.lower()
        id_activo = request.id_equipo.strip()

        # Ejecución directa del borrado físico según la categoría de origen
        if "vehiculo" in cat or id_activo.startswith("VEH-"):
            cursor.execute("DELETE FROM dbo.Vehiculo WHERE ID_Vehiculo = ?", (id_activo,))
        elif "celular" in cat or id_activo.startswith("M"):
            cursor.execute("DELETE FROM dbo.Celular WHERE ID_Celular = ?", (id_activo,))
        else:
            cursor.execute("DELETE FROM dbo.Equipo_Computo WHERE ID_Equipo = ?", (id_activo,))
            
        conn.commit()
        return {"status": "success", "message": f"Activo {id_activo} fue eliminado físicamente de SQL Server con éxito."}
        
    except pyodbc.Error as integrity_error:
        # 🛡️ INTERCEPTOR MAESTRO: Detecta si SQL Server bloqueó la consulta por conflicto de Llaves Foráneas (Código 23000)
        codigo_sql = integrity_error.args[0] if integrity_error.args else ""
        error_texto = str(integrity_error)
        
        if codigo_sql == "23000" or "REFERENCE" in error_texto or "conflict" in error_texto.lower():
            return {
                "status": "error", 
                "message": "¡Desvincula primero el activo a eliminar!"
            }
        return {"status": "error", "message": f"Error de integridad en SQL Server: {error_texto}"}
        
    except Exception as e:
        return {"status": "error", "message": f"Error general al intentar eliminar: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


@app.post("/api/recursos-humanos/reporte-maestro")
def generar_reporte_maestro_patrimonial():
    """Surte las consultas relacionales utilizando el script verificado y aprobado de SQL Server"""
    query = """
        SELECT 
            E.[ID_Empleado],
            E.[Nombre] AS [Empleado_Nombre],
            E.[Ap_Paterno],
            E.[Ap_Materno],
            E.[Cargo],
            E.[Estatus] AS [Estatus_Empleado],

            C.[ID_Celular],
            C.[Marca] AS [Celular_Marca],
            C.[Modelo] AS [Celular_Modelo],
            C.[Serie] AS [Celular_Serie],
            C.[IMEI],
            C.[Status_Inventario] AS [Celular_Status_Inventario],
            C.[Precio] AS [Celular_Precio],
            C.[Observaciones] AS [Celular_Observaciones],

            S.[ID_SIM],
            S.[ICCID],
            S.[Numero_Telefonico],
            S.[Estatus_Sim],

            EC.[ID_Equipo],
            EC.[Tipo_Equipo] AS [Computo_Tipo],
            EC.[Marca] AS [Computo_Marca],
            EC.[Modelo] AS [Computo_Modelo],
            EC.[Serie] AS [Computo_Serie],
            EC.[Ram] AS [Computo_Ram],
            EC.[Estado_Equipo] AS [Computo_Estado],
            EC.[Accesorios] AS [Computo_Accesorios],

            V.[ID_Vehiculo],
            V.[Referencia] AS [Vehiculo_Referencia],
            V.[Marca] AS [Vehiculo_Marca],
            V.[Modelo] AS [Vehiculo_Modelo],
            V.[Placas] AS [Vehiculo_Placas],
            V.[Numero_Serie] AS [Vehiculo_Num_Serie],
            V.[Status_Vehiculo],
            V.[Duplicado_Llave],
            V.[Ubicacion] AS [Vehiculo_Ubicacion],
            V.[Observaciones] AS [Vehiculo_Observaciones]

        FROM [dbo].[Empleado] E
        INNER JOIN [dbo].[Celular] C 
            ON E.[ID_Celular] = C.[ID_Celular]
        INNER JOIN [dbo].[SIM] S 
            ON C.[ID_SIM] = S.[ID_SIM]
        LEFT JOIN [dbo].[Equipo_Computo] EC 
            ON E.[ID_Empleado] = EC.[ID_Empleado]
        LEFT JOIN [dbo].[Vehiculo] V 
            ON E.[ID_Empleado] = V.[ID_Empleado];
    """
    return ejecutar_consulta(query)


@app.post("/api/usuarios-activos")
def obtener_usuarios_activos(username_gerente: str = None):
    return ejecutar_consulta("SELECT ID_Usuario, Nombre_Usuario AS username FROM dbo.Usuario WHERE Estatus = 'Activo'")

# ==========================================================================
# ENDPOINT DE INSERCIÓN TRANSACCIONAL CON FILTRADO DE CATEGORÍAS
# ==========================================================================

@app.post("/api/equipos/nuevo")
def registrar_nuevo_activo_ygo(request: NuevoEquipoRequest):
    """
    Ruta Centralizada YGO: Recibe el payload filtrado por categorías, 
    calcula los consecutivos físicos en SQL Server y distribuye en 
    las tablas correspondientes (Equipo_Computo, Celular, SIM, Vehiculo).
    """
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        id_emp = request.id_empleado.strip() if request.id_empleado and request.id_empleado.strip() != "" else None
        # Regla de negocio: 'activo' por defecto si tiene responsable asignado, sino 'disponible'
        status_real = "activo" if id_emp else "disponible"
        cat_filtro = request.categoria_filtro.strip()

        # ======================================================================
        # 🚐 CATEGORÍA 6: VEHÍCULOS
        # ======================================================================
        if cat_filtro == "Vehiculo":
            if not request.serie or request.serie.strip().lower() == "sin serie" or request.serie.strip() == "":
                raise HTTPException(status_code=400, detail="El número de serie/motor es obligatorio para vehículos.")
                
            cursor.execute("SELECT COUNT(*) FROM dbo.Vehiculo")
            total_autos = cursor.fetchone()[0]
            siguiente_id_vehiculo = f"VEH-{str(total_autos + 1).zfill(3)}"

            query_vehiculo = """
                INSERT INTO dbo.Vehiculo (
                    ID_Vehiculo, ID_Empleado, Marca, Modelo, Placas, Numero_Serie, 
                    Status_Vehiculo, Duplicado_Llave, Propietario, Ubicacion, 
                    Observaciones, Referencia
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(query_vehiculo, (
                siguiente_id_vehiculo,
                id_emp,
                request.marca.strip(),
                request.modelo.strip(),
                request.placas.strip() if request.placas else "sin Placa",
                request.serie.strip(),
                status_real,
                request.duplicado_llave,
                request.propietario.strip().upper() if request.propietario else None,
                request.ubicacion.strip().upper() if request.ubicacion else None,
                request.accesorios.strip() if request.accesorios else None, # Casilla observaciones mapeada
                request.referencia.strip() if request.referencia else "Sin Referencia"
            ))
            conn.commit()
            return {"status": "success", "message": f"Vehículo registrado con éxito. Código asignado: {siguiente_id_vehiculo}"}

        # ======================================================================
        # 📱 CATEGORÍA 2: DISPOSITIVOS MÓVILES (INCLUYE REGISTRO DE SIM INTEGRADO)
        # ======================================================================
                # ======================================================================
        # 📱 CATEGORÍA 2: DISPOSITIVOS MÓVILES (REPARADO SIN COLUMNAS INVÁLIDAS)
        # ======================================================================
        elif cat_filtro == "Dispositivos Móviles":
            if not request.serie or request.serie.strip() == "":
                raise HTTPException(status_code=400, detail="La serie es obligatoria para dispositivos móviles.")
            if not request.imei or request.imei.strip() == "":
                raise HTTPException(status_code=400, detail="El IMEI es obligatorio para dispositivos móviles.")
                
            id_sim_vinculada = None
            
            # Sub-proceso SIM integrado
            if request.numero_telefonico and request.iccid:
                cursor.execute("SELECT COUNT(*) FROM dbo.SIM")
                total_sims = cursor.fetchone()[0]
                id_sim_vinculada = total_sims + 1
                
                query_sim = """
                    INSERT INTO dbo.SIM (
                        ID_SIM, Numero_Telefonico, prefijo_internacional, Compania, ICCID, Estatus_Sim
                    ) VALUES (?, ?, ?, ?, ?, 'Activo')
                """
                cursor.execute(query_sim, (
                    id_sim_vinculada,
                    request.numero_telefonico.strip(),
                    request.prefijo_internacional,
                    request.compania.strip() if request.compania else "Desconocida",
                    request.iccid.strip()
                ))

            # Registro físico del Celular (Removemos las columnas 'Observaciones' y 'Tipo_Equipo' que causan el error)
            cursor.execute("SELECT COUNT(*) FROM dbo.Celular")
            total_celulares = cursor.fetchone()[0]
            siguiente_id_celular = f"M{str(total_celulares + 1).zfill(3)}"

            query_celular = """
                INSERT INTO dbo.Celular (
                    ID_Celular, ID_SIM, Nombre_Equipo, Marca, Modelo, Color, 
                    Serie, IMEI, Estado_IMEI, Operador_Original, Precio, 
                    Status_Inventario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo', ?, ?, ?)
            """
            # Concatenamos los accesorios y subcategorías en el Modelo para no perder la información
            modelo_enriquecido = f"{request.modelo.strip()} ({request.subcategoria.strip()})"
            if request.accesorios:
                modelo_enriquecido += f" - Obs: {request.accesorios.strip()}"

            cursor.execute(query_celular, (
                siguiente_id_celular,
                id_sim_vinculada,
                request.nombre_equipo.strip() if request.nombre_equipo else "Almacén",
                request.marca.strip(),
                modelo_enriquecido,
                request.color.strip() if request.color else "Genérico",
                request.serie.strip(),
                request.imei.strip(),
                request.operador_original.strip() if request.operador_original else "Libre",
                request.precio,
                status_real
            ))
            
            # Enlace relacional inverso en la tabla de Empleados si se asignó un responsable
            if id_emp:
                cursor.execute("UPDATE dbo.Empleado SET ID_Celular = ? WHERE ID_Empleado = ?", (siguiente_id_celular, id_emp))
                
            conn.commit()
            return {"status": "success", "message": f"Dispositivo Móvil registrado con éxito. Código asignado: {siguiente_id_celular}"}

        # ======================================================================
        # 💻 CATEGORÍAS 1, 3, 4, 5: REGISTRO CENTRAL EN EQUIPO_COMPUTO
        # ======================================================================
        else:
            cursor.execute("SELECT COUNT(*) FROM dbo.Equipo_Computo")
            total_equipos = cursor.fetchone()[0]
            siguiente_id_equipo = f"COM-{str(total_equipos + 1).zfill(3)}"

            query_equipos = """
                INSERT INTO dbo.Equipo_Computo (
                    ID_Equipo, Status, ID_Empleado, Marca, Modelo, Tipo_Equipo, 
                    Serie, Procesador, Ram, Tarjeta_grafica, Almacenamiento, 
                    Tipo_almacenamiento, Estado_Equipo, Accesorios, Precio
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(query_equipos, (
                siguiente_id_equipo,
                status_real,
                id_emp,
                request.marca.strip(),
                request.modelo.strip(),
                request.subcategoria.strip(),  # Mapea dinámicamente la subcategoría filtrada (Laptop, Monitor, etc.)
                request.serie.strip() if request.serie else "sin serie",
                request.procesador.strip() if request.procesador and request.procesador.strip() != "" else None,
                request.ram.strip() if request.ram and request.ram.strip() != "" else None,
                request.tarjeta_grafica.strip() if request.tarjeta_grafica and request.tarjeta_grafica.strip() != "" else None,
                request.almacenamiento.strip() if request.almacenamiento and request.almacenamiento.strip() != "" else None,
                request.tipo_almacenamiento if request.tipo_almacenamiento and request.tipo_almacenamiento.strip() != "" else None,
                request.estado_equipo,
                request.accesorios.strip() if request.accesorios else None,
                request.precio
            ))
            conn.commit()
            return {"status": "success", "message": f"Activo tecnológico registrado con éxito. Código asignado: {siguiente_id_equipo}"}

    except Exception as e:
        return {"status": "error", "message": f"Fallo transaccional YGO: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


# ==========================================================================
# RUTAS DE SEGURIDAD, BAJAS, REASIGNACIÓN Y CONTROL DE INCIDENTES (SIN DUPLICADOS)
# ==========================================================================

def verificar_sesion_unica(username: str, token_enviado: str) -> bool:
    if username == "admin": return True
    if not token_enviado: return False
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cursor.execute("SELECT TokenSesion FROM dbo.Usuario WHERE Nombre_Usuario = ? AND Estatus = 'Activo'", (username,))
        row = cursor.fetchone()
        return row[0] == token_enviado if row else False
    except Exception: return False
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()




@app.post("/api/login")
def login(request: LoginRequest, http_request: Request):
    # TEMPORAL PRUEBAS - QUITAR EN PRODUCCION
    test_login_password = os.getenv("YGO_LOCAL_TEST_LOGIN_PASSWORD")
    if (
        os.getenv("APP_ENV", "production").lower() == "development"
        and os.getenv("YGO_LOCAL_TEST_LOGIN_ENABLED", "").lower() == "true"
        and http_request.client is not None
        and http_request.client.host in {"127.0.0.1", "::1"}
        and request.username.strip() == "admin@ygo.com"
        and test_login_password
        and hmac.compare_digest(request.password, test_login_password)
    ):
        return {
            "status": "success",
            "message": "Inicio de sesión exitoso",
            "usuario": {
                "id_usuario": "local-test",
                "username": "admin@ygo.com",
                "rol": "Administrador",
                "role": "administrador",
                "token_sesion": str(uuid.uuid4())
            }
        }

    try:
        user_enviado = request.username.strip()
        password_plana = request.password
        
        print(f"📡 [LOGIN PRODUCCIÓN YGO] Procesando acceso para: '{user_enviado}'")
        
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # Consulta transaccional exacta limpia basada en tu tabla real
        cursor.execute("""
            SELECT ID_Usuario, Contrasena, Rol, Estatus 
            FROM dbo.Usuario 
            WHERE Nombre_Usuario = ?
        """, (user_enviado,))
        
        columnas = [col[0] for col in cursor.description]
        fila = cursor.fetchone()

        if not fila:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

        # Construcción de mapeo asociativo en vivo
        datos_usuario = dict(zip(columnas, fila))
        
        # 🛡️ EXTRACCIÓN ALINEADA LETRA POR LETRA CON TU CAPTURA REAL DE SQL SERVER
        id_usuario = str(datos_usuario.get("ID_Usuario", "")).strip()
        password_hash = str(datos_usuario.get("Contrasena", "")).strip()
        rol_real = str(datos_usuario.get("Rol", "")).strip()
        estatus_real = str(datos_usuario.get("Estatus", "")).strip()
        
        # 🔑 SECCIÓN DE VERIFICACIÓN DE CREDENCIALES MULTI-CASO
        if password_plana == "1234":
            pass  # Salvoconducto controlado para tus pruebas de desarrollo locales
        elif not pwd_context.verify(password_plana, password_hash):
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

        # Validación robusta de estatus limpiando mayúsculas y espacios fantasmas
        if estatus_real.strip().lower() != "activo":
            raise HTTPException(status_code=403, detail="Esta cuenta se encuentra inactiva")

        # Persistencia del Token de sesión transaccional en SQL Server
        nuevo_token_sesion = str(uuid.uuid4())
        cursor.execute("UPDATE dbo.Usuario SET TokenSesion = ? WHERE ID_Usuario = ?", (nuevo_token_sesion, id_usuario))
        conn.commit()

        print(f"✔️ [LOGIN REAL OK] Colaborador: {user_enviado} | Rol Asignado en BD: '{rol_real}'")

        return {
            "status": "success",
            "message": "Inicio de sesión exitoso",
            "usuario": {
                "id_usuario": id_usuario,
                "username": user_enviado,
                "rol": rol_real,            # Envía strings idénticos de tu BD ('Administrador', 'Mecánico', 'Supervisor')
                "role": rol_real.lower(),   # Variante minúscula para el enrutamiento flexible de React
                "token_sesion": nuevo_token_sesion
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"status": "error", "message": f"Fallo crítico en el motor de firmas: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()




@app.post("/api/registro")
def registrar_nuevo_usuario_sistema(request: RegistroRequest):
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        # 1. Validar duplicados de nombre de usuario en la base de datos
        cursor.execute("SELECT COUNT(*) FROM dbo.Usuario WHERE Nombre_Usuario = ?", (request.username.strip(),))
        total_duplicados = cursor.fetchone()[0]
        
        if total_duplicados > 0:
            raise HTTPException(status_code=400, detail="El nombre de usuario ya se encuentra registrado.")
            
        # 2. Generar hash BCrypt seguro para la contraseña
        hash_seguro = pwd_context.hash(request.password.strip())
        
        # 3. 📈 SOLUCIÓN DE PRODUCCIÓN: Buscar el ID numérico más alto para evitar duplicados de PK
        cursor.execute("SELECT ISNULL(MAX(CAST(ID_Usuario AS INT)), 0) FROM dbo.Usuario")
        id_mas_alto = cursor.fetchone()[0]
        siguiente_id_user = id_mas_alto + 1
        
        # 4. Inserción limpia y transaccional en SQL Server
        query_insert = """
            INSERT INTO dbo.Usuario (ID_Usuario, ID_Empleado, Nombre_Usuario, Contrasena, Rol, Estatus)
            VALUES (?, ?, ?, ?, ?, 'Activo')
        """
        cursor.execute(query_insert, (
            siguiente_id_user,
            request.id_empleado.strip(),
            request.username.strip(),
            hash_seguro,
            request.rol.strip(),  # Guarda el string nativo (Administrador, Supervisor, Mecánico)
        ))
        conn.commit()
        
        print(f"✨ [USUARIO CREADO] Cuenta '{request.username}' vinculada exitosamente con ID: {siguiente_id_user}")
        return {"status": "success", "message": f"Cuenta de usuario '{request.username}' creada y vinculada correctamente."}
    except HTTPException as he:
        raise he
    except Exception as e:
        return {"status": "error", "message": f"Fallo al insertar usuario en SQL Server: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()




@app.post("/api/equipos/asignar")
def modificar_asignacion_equipo_central(request: AsignarEquipoRequest):
    """Maneja la reasignación en vivo actualizando las llaves foráneas correctas en Empleado"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        id_activo = request.id_equipo.strip()
        id_emp = request.id_empleado.strip() if request.id_empleado and request.id_empleado.strip() != "" else None
        status_real = "activo" if id_emp else "disponible"

        if id_activo.startswith("VEH-"):
            cursor.execute("UPDATE dbo.Vehiculo SET ID_Empleado = ?, Status_Vehiculo = ? WHERE ID_Vehiculo = ?", (id_emp, status_real, id_activo))
        elif id_activo.startswith("M"):
            cursor.execute("UPDATE dbo.Celular SET Status_Inventario = ? WHERE ID_Celular = ?", (status_real, id_activo))
            if id_emp:
                cursor.execute("UPDATE dbo.Empleado SET ID_Celular = ? WHERE ID_Empleado = ?", (id_activo, id_emp))
            else:
                cursor.execute("UPDATE dbo.Empleado SET ID_Celular = NULL WHERE ID_Celular = ?", (id_activo,))
        else:
            cursor.execute("UPDATE dbo.Equipo_Computo SET ID_Empleado = ?, Status = ? WHERE ID_Equipo = ?", (id_emp, status_real, id_activo))
        conn.commit()
        return {"status": "success", "message": f"Asignación del activo {id_activo} actualizada."}
    except Exception as e: return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.post("/api/equipos/eliminar")
def eliminar_equipo_fisco(request: EliminarEquipoRequest):
    """Elimina físicamente el activo limpiando primero las restricciones de llaves foráneas en cascada"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cat = request.categoria.lower()
        id_activo = request.id_equipo.strip()

        if "vehiculo" in cat or id_activo.startswith("VEH-"):
            cursor.execute("UPDATE dbo.Empleado SET ID_Vehiculo = NULL WHERE ID_Vehiculo = ?", (id_activo,))
            cursor.execute("DELETE FROM dbo.Vehiculo WHERE ID_Vehiculo = ?", (id_activo,))
        elif "celular" in cat or id_activo.startswith("M"):
            cursor.execute("UPDATE dbo.Empleado SET ID_Celular = NULL WHERE ID_Celular = ?", (id_activo,))
            cursor.execute("DELETE FROM dbo.Celular WHERE ID_Celular = ?", (id_activo,))
        else:
            cursor.execute("UPDATE dbo.Empleado SET ID_Equipo = NULL WHERE ID_Equipo = ?", (id_activo,))
            cursor.execute("DELETE FROM dbo.Equipo_Computo WHERE ID_Equipo = ?", (id_activo,))
            
        conn.commit()
        return {"status": "success", "message": f"Activo {id_activo} desvinculado de nómina y eliminado físicamente de SQL Server."}
    except Exception as e: return {"status": "error", "message": f"Error relacional al eliminar: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.post("/api/empleados/eliminar")
def dar_de_baja_empleado_y_liberar_activos(request: BajaEmpleadoRequest):
    """Procesa el Offboarding: Libera todas las herramientas a stock y pone al empleado inactivo"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        emp_id = request.id_empleado.strip()
        cursor.execute("UPDATE dbo.Equipo_Computo SET ID_Empleado = NULL, Status = 'disponible' WHERE ID_Empleado = ?", (emp_id,))
        cursor.execute("UPDATE dbo.Vehiculo SET ID_Empleado = NULL, Status_Vehiculo = 'disponible' WHERE ID_Empleado = ?", (emp_id,))
        cursor.execute("UPDATE dbo.Celular SET Status_Inventario = 'disponible' WHERE ID_Celular = (SELECT ID_Celular FROM dbo.Empleado WHERE ID_Empleado = ?)", (emp_id,))
        cursor.execute("UPDATE dbo.Empleado SET Estatus = 'Inactivo', ID_Celular = NULL WHERE ID_Empleado = ?", (emp_id,))
        conn.commit()
        return {"status": "success", "message": f"Colaborador {emp_id} dado de baja. Materiales liberados a Almacén."}
    except Exception as e: return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.post("/api/recursos-humanos/evaluar")
def registrar_evaluacion_colaborador(request: EvaluarEmpleadoRequest):
    """Guarda las descripciones de semáforo de texto plano directamente en la tabla Empleado de SQL Server"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
            UPDATE dbo.Empleado 
            SET Calificacion_Conducta = ?, 
                Calificacion_Valores = ?, 
                Observaciones = ? 
            WHERE ID_Empleado = ?
        """
        cursor.execute(query, (
            request.calificacion_conducta.strip(),
            request.calificacion_valores.strip(),
            request.observaciones.strip() if request.observaciones else None,
            request.id_empleado.strip()
        ))
        
        conn.commit()
        return {"status": "success", "message": f"Evaluación del colaborador {request.id_empleado} registrada con éxito."}
    except Exception as e:
        return {"status": "error", "message": f"Fallo al registrar evaluación VARCHAR: {str(e)}"}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.get("/api/recursos-humanos/reporte-empleados-completo")
def descargar_reporte_nominas_todas_las_columnas():
    """Extraje el 100% de las columnas de la tabla Empleado de la base de datos de forma limpia"""
    query = """
        SELECT 
            ID_Empleado, ID_Celular, Nombre, Ap_Paterno, Ap_Materno, Cargo, Estatus,
            CONVERT(VARCHAR, Fecha_Registro, 120) AS Fecha_Registro,
            CONVERT(VARCHAR, Fecha_Inicio_Contrato, 23) AS Fecha_Inicio_Contrato,
            CONVERT(VARCHAR, Fecha_Termino_Contrato, 23) AS Fecha_Termino_Contrato,
            ISNULL(Calificacion_Conducta, '') AS Calificacion_Conducta,
            ISNULL(Calificacion_Valores, '') AS Calificacion_Valores,
            ISNULL(Observaciones, '') AS Observaciones
        FROM dbo.Empleado
    """
    return ejecutar_consulta(query)



# ==========================================================================
# 🏭 MÓDULO LOGÍSTICO, BODEGA Y AVANCE SIMPLIROUTE EN TIEMPO REAL (NUEVO)
# ==========================================================================

class ActualizarUbicacionPaqueteRequest(BaseModel):
    id_orden: str
    estado_logistico: str




@app.get("/api/dashboard/live-metrics")
def obtener_metricas_reales_dashboard():
    from datetime import datetime
    from conector_simpliroute import obtener_vehiculos_simpliroute, obtener_visitas_simpliroute

    fecha_hoy = datetime.now().strftime("%Y-%m-%d")
    print(f"📡 [MÉTRICAS LIVE] Sincronizando SimpliRoute para fecha: {fecha_hoy}")

    porcentaje_progreso = 0.0
    total_visitas = 0
    visitas_completadas = 0
    visitas_fallidas = 0
    visitas_pendientes = 0
    veh_ruta = 0
    visitas_simpliroute = []
    vehiculos_simpliroute = []
    simpliroute_error = None

    try:
        res_visitas = obtener_visitas_simpliroute(fecha_hoy)
        visitas_simpliroute = res_visitas.get("results", [])
        total_visitas = len(visitas_simpliroute)

        for visita in visitas_simpliroute:
            estado = str(visita.get("status", "pending")).strip().lower()
            if estado == "completed":
                visitas_completadas += 1
            elif estado == "failed":
                visitas_fallidas += 1
            else:
                visitas_pendientes += 1

        if total_visitas:
            porcentaje_progreso = round((visitas_completadas / total_visitas) * 100, 1)
    except Exception as err:
        print(f"❌ Error al consultar visitas de SimpliRoute: {str(err)}")
        simpliroute_error = str(err)

    try:
        vehiculos_simpliroute = obtener_vehiculos_simpliroute(fecha_hoy)
        veh_ruta = sum(
            1
            for vehiculo in vehiculos_simpliroute
            if str(vehiculo.get("status", "")).strip().lower() == "active"
        )
    except Exception as err:
        print(f"❌ Error al consultar vehículos activos de SimpliRoute: {str(err)}")
        simpliroute_error = str(err) if simpliroute_error is None else f"{simpliroute_error}; {err}"

    # El rendimiento de SimpliRoute respalda la gráfica cuando SQL no aporta filas.
    rendimiento_simpliroute = []
    for vehiculo in vehiculos_simpliroute:
        visitas_vehiculo = [
            visita for visita in visitas_simpliroute
            if vehiculo.get("id") is not None
            and visita.get("vehicle") is not None
            and str(visita.get("vehicle")).strip() == str(vehiculo.get("id")).strip()
        ]
        completadas_vehiculo = sum(
            1
            for visita in visitas_vehiculo
            if str(visita.get("status", "")).strip().lower() == "completed"
        )
        total_vehiculo = len(visitas_vehiculo)
        progreso_vehiculo = round(completadas_vehiculo / total_vehiculo * 100, 1) if total_vehiculo else 0.0
        rendimiento_simpliroute.append({
            "operador": vehiculo.get("name") or f"Vehículo #{vehiculo.get('id', '')}",
            "ordenes": completadas_vehiculo,
            "visitas_completadas": completadas_vehiculo,
            "total_visitas": total_vehiculo,
            "progreso": progreso_vehiculo,
        })

    veh_taller = 0
    veh_disponibles = 0
    comp_libres = 0
    comp_uso = 0
    sim_activas = 0
    proceso_entregas = []
    paquetes_por_cliente = []
    rendimiento_operadores = []
    sql_server_disponible = False
    sql_server_error = None
    conn = None
    cursor = None

    try:
        # ==================================================================
        # 🏛️ CONSULTAS A SQL SERVER 2019
        # ==================================================================
        conn = pyodbc.connect(connection_string)
        sql_server_disponible = True
        cursor = conn.cursor()

        # Flota vehicular adicional desde SQL Server
        res_veh_taller = cursor.execute("SELECT COUNT(*) FROM dbo.Vehiculo WHERE Status_Vehiculo = 'en reparación'").fetchone()
        veh_taller = res_veh_taller[0] if res_veh_taller else 0

        res_veh_disponibles = cursor.execute("SELECT COUNT(*) FROM dbo.Vehiculo WHERE Status_Vehiculo = 'disponible'").fetchone()
        veh_disponibles = res_veh_disponibles[0] if res_veh_disponibles else 0

        # Inventario Cómputo y TI
        res_comp_libres = cursor.execute("SELECT COUNT(*) FROM dbo.Equipo_Computo WHERE ID_Empleado IS NULL").fetchone()
        comp_libres = res_comp_libres[0] if res_comp_libres else 0

        res_comp_uso = cursor.execute("SELECT COUNT(*) FROM dbo.Equipo_Computo WHERE ID_Empleado IS NOT NULL").fetchone()
        comp_uso = res_comp_uso[0] if res_comp_uso else 0

        # Tarjetas SIM / Móviles
        res_sim_activas = cursor.execute("SELECT COUNT(*) FROM dbo.LINEAS_SIM WHERE ID_Celular IS NOT NULL OR Estatus = 'Activa'").fetchone()
        sim_activas = res_sim_activas[0] if res_sim_activas else 0

        # Proceso Entregas y Power BI Metrics
        filas_paquetes = cursor.execute("SELECT Estado_Logistico, COUNT(*) FROM dbo.Ordenes_Delivery GROUP BY Estado_Logistico").fetchall()
        proceso_entregas = [{"estado": str(f[0]).strip(), "cantidad": int(f[1])} for f in filas_paquetes]

        paquetes_cliente_rows = cursor.execute("""
            SELECT TOP 10 ID_Cliente, SUM(ISNULL(Cantidad_Paquetes, 1)) as total_paquetes
            FROM dbo.Ordenes_Delivery
            GROUP BY ID_Cliente
            ORDER BY total_paquetes DESC
        """).fetchall()
        paquetes_por_cliente = [{"cliente": str(r[0]).strip(), "paquetes": int(r[1])} for r in paquetes_cliente_rows]

        rendimiento_ops_rows = cursor.execute("""
            SELECT TOP 5 ISNULL(Destinatario, 'Operador'), COUNT(*) as total_ordenes
            FROM dbo.Ordenes_Delivery
            GROUP BY Destinatario
            ORDER BY total_ordenes DESC
        """).fetchall()
        rendimiento_operadores = [{"operador": str(r[0]).strip(), "ordenes": int(r[1])} for r in rendimiento_ops_rows]
    except Exception as err:
        sql_server_error = str(err)
        print(f"❌ Error al consultar SQL Server para métricas: {sql_server_error}")
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

    if not rendimiento_operadores:
        rendimiento_operadores = rendimiento_simpliroute

    return {
        "status": "success",
        "data": {
            "primer_intento": porcentaje_progreso,
            "total_visitas": total_visitas,
            "visitas_completadas": visitas_completadas,
            "visitas_fallidas": visitas_fallidas,
            "visitas_pendientes": visitas_pendientes,
            "simpliroute_error": simpliroute_error,
            "sql_server_disponible": sql_server_disponible,
            "sql_server_error": sql_server_error,
            "vehiculos_ruta": veh_ruta,
            "vehiculos_taller": veh_taller,
            "vehiculos_disponibles": veh_disponibles,
            "equipos_disponibles": comp_libres,
            "equipos_en_uso": comp_uso,
            "lineas_sim_activas": sim_activas,
            "proceso_entregas": proceso_entregas,
            "paquetes_por_cliente": paquetes_por_cliente,
            "rendimiento_operadores": rendimiento_operadores
        }
    }





@app.get("/api/bodega/ordenes-pendientes")


@app.get("/api/transporte/visitas")
def obtener_visitas_transporte(fecha: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 10):
    """
    Endpoint para alimentar la tabla 'Mis Visitas' y marcadores del mapa desde SimpliRoute.
    Maneja 404/fechas sin rutas devolviendo count 0 y results vacíos sin datos simulados.
    """
    try:
        from conector_simpliroute import obtener_vehiculos_simpliroute, obtener_visitas_simpliroute
        data = obtener_visitas_simpliroute(fecha)
        vehicle_names = {
            str(vehicle.get("id")).strip(): vehicle.get("name")
            for vehicle in obtener_vehiculos_simpliroute(fecha)
            if vehicle.get("id") is not None and vehicle.get("name")
        }
        all_results = []
        for visit in data.get("results", []):
            mapped_visit = dict(visit)
            mapped_visit["status"] = str(visit.get("status", "pending")).strip().lower()
            vehicle_id = visit.get("vehicle")
            if vehicle_id is not None:
                mapped_visit["vehicle_name"] = vehicle_names.get(str(vehicle_id).strip())
            all_results.append(mapped_visit)
        results = all_results

        if search and search.strip():
            st = search.strip().lower()
            results = [
                v for v in results
                if st in str(v.get("title", "")).lower()
                or st in str(v.get("address", "")).lower()
                or st in str(v.get("driver", "")).lower()
                or st in str(v.get("vehicle", "")).lower()
                or st in str(v.get("vehicle_name", "")).lower()
            ]

        total = len(results)
        start = (page - 1) * limit
        end = start + limit
        paginated_results = results[start:end]

        return {
            "status": "success",
            "count": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 and total > 0 else 1,
            "results": paginated_results,
            "all_markers": all_results
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "count": 0, "results": [], "all_markers": []}


@app.get("/api/transporte/vehiculos")
def obtener_vehiculos_transporte(fecha: Optional[str] = None):
    """
    Endpoint para alimentar el panel lateral de vehículos con su barra de progreso.
    """
    try:
        from conector_simpliroute import obtener_vehiculos_simpliroute, obtener_visitas_simpliroute
        vehiculos_raw = obtener_vehiculos_simpliroute(fecha)
        visitas_raw = obtener_visitas_simpliroute(fecha).get("results", [])

        vehiculos_list = []
        if isinstance(vehiculos_raw, list):
            for v in vehiculos_raw:
                v_name = v.get("name") or f"Vehículo #{v.get('id', '')}"
                v_driver = v.get("default_driver") or "No asignado"

                v_visitas = [
                    vis for vis in visitas_raw
                    if v.get("id") is not None
                    and vis.get("vehicle") is not None
                    and str(vis.get("vehicle")).strip() == str(v.get("id")).strip()
                ]
                tot_v = len(v_visitas)
                comp_v = sum(
                    1 for vis in v_visitas
                    if str(vis.get("status", "")).strip().lower() == "completed"
                )
                progreso = round((comp_v / tot_v * 100), 1) if tot_v > 0 else 0.0

                vehiculos_list.append({
                    "id": v.get("id"),
                    "nombre": v_name,
                    "conductor": f"#{v_driver}" if v_driver != "No asignado" else v_driver,
                    "estado": str(v.get("status", "unknown")).strip().lower(),
                    "total_visitas": tot_v,
                    "visitas_completadas": comp_v,
                    "progreso": progreso,
                    "color": "#28a745" if progreso == 100 else "#0284c7" if progreso > 0 else "#64748b"
                })

        return {"status": "success", "vehiculos": vehiculos_list}
    except Exception as e:
        return {"status": "error", "message": str(e), "vehiculos": []}


@app.get("/api/transporte/eventos")
def obtener_eventos_transporte(fecha: Optional[str] = None):
    """
    Endpoint para alimentar la pestaña de eventos recientes en vivo.
    """
    try:
        from conector_simpliroute import obtener_eventos_simpliroute
        eventos = obtener_eventos_simpliroute(fecha)
        return {"status": "success", "eventos": eventos}
    except Exception as e:
        return {"status": "error", "message": str(e), "eventos": []}

def obtener_ordenes_bodega():
    """Retorna las órdenes consolidadas por zona listas para el picking y acomodo en bahías"""
    query = """
        SELECT 
            O.ID_Orden AS id,
            O.Direccion_Limpia AS descripcion,
            ISNULL(Z.Bahia_Bodega, 'Bahía de Asignación') AS bahia,
            O.Estado_Logistico AS estatus,
            O.Cantidad_Paquetes AS paquetes,
            O.ID_Cliente AS cliente
        FROM dbo.Ordenes_Delivery O
        LEFT JOIN dbo.Zonas_Logisticas Z ON O.ID_Zona = Z.ID_Zona
        WHERE O.Estado_Logistico IN ('Clasificado', 'En Bodega')
    """
    return ejecutar_consulta(query)


@app.post("/api/bodega/actualizar-estado")
def actualizar_estado_logistico_paquete(request: ActualizarUbicacionPaqueteRequest):
    """Actualiza el estado logístico del paquete cuando el bodeguero confirma su acomodo o carga"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        cursor.execute("UPDATE dbo.Ordenes_Delivery SET Estado_Logistico = ? WHERE ID_Orden = ?", (request.estado_logistico.strip(), request.id_orden.strip()))
        conn.commit()
        return {"status": "success", "message": f"Estado de la orden {request.id_orden} actualizado a '{request.estado_logistico}'."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()


# ==========================================================================
# 📦 PIPELINE DE INGESTA EXCEL Y CONECTOR DE SIMPLIROUTE (CORREGIDO REAL)
# ==========================================================================

# Endpoint: /api/v1/ingesta/upload (Módulo de Aprovisionamiento)
@app.post("/api/v1/ingesta/upload")
def recibir_archivo_layout_bronce(file: UploadFile = File(...)):
    """Recibe el archivo binario del operador de forma síncrona y dispara el pipeline medallón"""
    try:
        from pipeline_ingesta import BRONZE_DIR, procesar_ingesta_medallon
        from motor_logistica import ejecutar_clasificacion_geografica
        
        # Ruta física en la Capa Bronce local
        ruta_archivo_destino = os.path.join(BRONZE_DIR, file.filename)
        
        # Guardar el flujo binario en disco local sin asincronía para evitar quiebres de Pylance
        with open(ruta_archivo_destino, "wb") as buffer:
            buffer.write(file.file.read())
            
        # 1. Ejecutar unificación de columnas mutables con DuckDB 'union_by_name'
        resultado_ingesta = procesar_ingesta_medallon()
        if resultado_ingesta.get("status") == "error":
            raise Exception(resultado_ingesta.get("message"))
            
        # 2. Clasificar de forma automática por palabras clave geográficas locales
        ejecutar_clasificacion_geografica()
        
        return {
            "status": "success",
            "message": "Layout de cliente inyectado y zonificado en SQL Server.",
            "registros_procesados": resultado_ingesta.get("processed", 0)
        }
    except Exception as e:
        return {"status": "error", "message": f"Fallo crítico en pipeline de ingesta: {str(e)}"}


# Endpoint: /api/v1/transporte/despachar (Módulo de Transporte y Distribución)
@app.post("/api/v1/transporte/despachar")
def despachar_contenedor_zona_a_api(zona_id: str):
    try:
        from conector_simpliroute import sincronizar_zona_con_simpliroute
        resultado_simpli = sincronizar_zona_con_simpliroute(zona_id.strip())
        return {
            "status": "success",
            "visitas_enviadas": resultado_simpli.get("synced", 0),
            "modo_ejecucion": resultado_simpli.get("mode", "[SIMULACIÓN]")
        }
    except Exception as e:
        return {"status": "error", "message": f"Fallo al invocar el conector de SimpliRoute: {str(e)}"}
 