import React, { useState } from "react";
import { API_BASE_URL } from "./config/api";
import TablaInventario from "./components/TablaInventario";
import Login from "./components/Login";
import RegistroUsuario from "./components/RegistroUsuario";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import PerfilUsuario from "./components/PerfilUsuario";
import DashboardInicio from "./components/DashboardInicio";
import TransporteDistribucion from "./components/TransporteDistribucion";
import Aprovisionamiento from "./components/Aprovisionamiento";
import GestionAlmacen from "./components/GestionAlmacen";
import MantenimientoVehicular from "./components/MantenimientoVehicular";
import FormulariosInventario from "./components/FormulariosInventario";
import FormulariosPersonal from "./components/FormulariosPersonal";

function App() {
  const [sincronizando, setSincronizando] = useState(false);
  const [descargandoInventario, setDescargandoInventario] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState(
    "Conexión de forma remota Servidor local\\YGO.",
  );
  const [datosServidor, setDatosServidor] = useState([]);

  // Inicialización inteligente: busca primero si se marcó "recordar equipo" o si solo se refrescó la pestaña con F5
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    const sesionPersistente = localStorage.getItem("usuario_sesion");
    const sesionPestana = sessionStorage.getItem("usuario_sesion");

    if (sesionPersistente) return JSON.parse(sesionPersistente);
    if (sesionPestana) return JSON.parse(sesionPestana);
    return null;
  });

  const [vistaActual, setVistaActual] = useState("inicio");

  // FUNCIÓN SENIOR: Se encarga de limpiar de raíz el almacenamiento al cerrar sesión
  const manejarCerrarSesion = () => {
    localStorage.removeItem("usuario_sesion");
    sessionStorage.removeItem("usuario_sesion");
    setUsuarioLogueado(null);
    setVistaActual("inicio");
  };

  // ACTIVACIÓN DEL TEMPORIZADOR DE 30 MINUTOS DE INACTIVIDAD
  // Si pasa este tiempo sin que el usuario interactúe, llamará a manejarCerrarSesion de forma automática
  useSessionTimeout(!!usuarioLogueado, manejarCerrarSesion, 30);

  const manejarSincronizacion = async () => {
    setSincronizando(true);
    setMensajeEstado(
      "🔄 Conectando con la base de datos remota... Extrayendo registros de Equipo_Computo...",
    );

    try {
      // 1. Extraemos de forma segura el usuario y token actual del estado para enviarlos a FastAPI
      const userParam = usuarioLogueado
        ? encodeURIComponent(usuarioLogueado.username)
        : "";
      const tokenParam =
        usuarioLogueado && usuarioLogueado.token_sesion
          ? encodeURIComponent(usuarioLogueado.token_sesion)
          : "";

      // 2. Pasamos los parámetros en la URL tal como los configuramos en las rutas de Python
      const respuesta = await fetch(
        `${API_BASE_URL}/api/equipos?username=${userParam}&token_sesion=${tokenParam}`,
      );

      // 3. CAPTURA SENIOR: Si el backend responde 401, significa que otra computadora inició sesión con esta cuenta
      if (respuesta.status === 401) {
        alert(
          "⚠️ Tu sesión ha sido invalidada porque esta cuenta se abrió en otro dispositivo.",
        );
        manejarCerrarSesion(); // Expulsión automática e inmediata al Login
        return;
      }

      const resultado = await respuesta.json();

      if (resultado.status === "success") {
        setDatosServidor(resultado.data);
        if (resultado.data.length === 0) {
          setMensajeEstado(
            "✔️ Conexión exitosa con el servidor 'Equipo_Computo' se encuentra vacía (0 registros).",
          );
        } else {
          setMensajeEstado(
            `✔️ Éxito de red. Se extrajeron ${resultado.data.length} registros reales desde el servidor.`,
          );
        }
      } else {
        setMensajeEstado(`❌ Error en base de datos: ${resultado.message}`);
      }
    } catch (error) {
      setMensajeEstado(
        "❌ Error crítico de red: No se pudo establecer comunicación con el Backend (Port 8000).",
      );
    } finally {
      setSincronizando(false);
    }
  };

  const handleDescargarInventario = async () => {
    setDescargandoInventario(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventario/completo`);
      const resultado = await response.json();
      if (!response.ok || resultado.status !== "success") {
        throw new Error(
          resultado.detail ||
            resultado.message ||
            "No se pudo consultar el inventario.",
        );
      }

      const registros = resultado.data;
      if (!Array.isArray(registros) || registros.length === 0) {
        throw new Error("No hay activos disponibles para descargar.");
      }

      const columnas = [
        ...new Set(registros.flatMap((registro) => Object.keys(registro))),
      ];
      const convertirCeldaCsv = (valor) => {
        const texto =
          valor === null || valor === undefined
            ? ""
            : typeof valor === "object"
              ? JSON.stringify(valor)
              : String(valor);
        return `"${texto.replace(/"/g, '""')}"`;
      };
      const filasCsv = [
        columnas,
        ...registros.map((registro) =>
          columnas.map((columna) => registro[columna]),
        ),
      ];
      const contenidoCsv = `\uFEFF${filasCsv
        .map((fila) => fila.map(convertirCeldaCsv).join(","))
        .join("\r\n")}`;
      const archivo = new Blob([contenidoCsv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `inventario_completo_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      alert(`⚠️ Error al descargar el inventario: ${error.message}`);
    } finally {
      setDescargandoInventario(false);
    }
  };

  return (
    <>
      {!usuarioLogueado ? (
        <Login
          onLoginSuccess={(user, rememberMe) => {
            if (rememberMe) {
              localStorage.setItem("usuario_sesion", JSON.stringify(user));
            } else {
              sessionStorage.setItem("usuario_sesion", JSON.stringify(user));
            }
            setUsuarioLogueado(user);
          }}
        />
      ) : (
        <div className="dashboard-container">
          <div className="header-card">
            <h1>Sistema Central YGO</h1>
            <p style={{ marginBottom: "16px" }}>Estación de trabajo YGO.</p>
            {/* ==========================================================================
               BARRA DE ACCIONES DE SESIÓN Y CONTROL DE ROLES (NIVEL 1)
               ========================================================================== */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              {/* 👑 VALIDACIÓN RBAC MEJORADA PARA ADMINISTRADOR (Línea 142 de App.jsx) */}
              {(usuarioLogueado?.rol?.toLowerCase() === "administrador" ||
                usuarioLogueado?.role?.toLowerCase() === "administrador") && (
                <button
                  onClick={() =>
                    setVistaActual(
                      vistaActual === "registro" ? "inicio" : "registro",
                    )
                  }
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {vistaActual === "registro"
                    ? "📋 Ver Dashboard"
                    : "➕ Registrar Nuevo Usuario"}
                </button>
              )}

              <button
                onClick={() =>
                  setVistaActual(vistaActual === "perfil" ? "inicio" : "perfil")
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {vistaActual === "perfil" ? "📋 Ver Dashboard" : "⚙️ Mi Perfil"}
              </button>

              <button
                onClick={manejarCerrarSesion}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🔒 Cerrar Sesión
              </button>
            </div>

            {/* 🎛️ BARRA DE NAVEGACIÓN ORIGINAL INTERACTIVA CON RESALTE ACTIVO */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setVistaActual("inicio")}
                className="btn-compact"
                style={{
                  backgroundColor:
                    vistaActual === "inicio" ? "#0284c7" : "#ffffff",
                  color: vistaActual === "inicio" ? "#ffffff" : "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: vistaActual === "inicio" ? "700" : "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🏠 Inicio
              </button>

              <button
                onClick={() => setVistaActual("aprovisionamiento")}
                className="btn-compact"
                style={{
                  backgroundColor:
                    vistaActual === "aprovisionamiento" ? "#0284c7" : "#ffffff",
                  color:
                    vistaActual === "aprovisionamiento" ? "#ffffff" : "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight:
                    vistaActual === "aprovisionamiento" ? "700" : "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📦 Aprovisionamiento
              </button>

              <button
                onClick={() => setVistaActual("inventarios")}
                className="btn-compact"
                style={{
                  backgroundColor:
                    vistaActual === "inventarios" ? "#0284c7" : "#ffffff",
                  color: vistaActual === "inventarios" ? "#ffffff" : "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: vistaActual === "inventarios" ? "700" : "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📋 Control de Inventarios
              </button>

              <button
                onClick={() => setVistaActual("almacen")}
                className="btn-compact"
                style={{
                  backgroundColor:
                    vistaActual === "almacen" ? "#0284c7" : "#ffffff",
                  color: vistaActual === "almacen" ? "#ffffff" : "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: vistaActual === "almacen" ? "700" : "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🏭 Gestión de Almacén
              </button>

              <button
                onClick={() => setVistaActual("transporte")}
                className="btn-compact"
                style={{
                  backgroundColor:
                    vistaActual === "transporte" ? "#0284c7" : "#ffffff",
                  color: vistaActual === "transporte" ? "#ffffff" : "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: vistaActual === "transporte" ? "700" : "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🚚 Transporte y Distribución
              </button>

              <button
                onClick={() => setVistaActual("mantenimiento")}
                className="btn-compact"
                style={{
                  backgroundColor:
                    vistaActual === "mantenimiento" ? "#0284c7" : "#ffffff",
                  color:
                    vistaActual === "mantenimiento" ? "#ffffff" : "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: vistaActual === "mantenimiento" ? "700" : "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                🔧 Mantenimiento Vehicular
              </button>
            </div>

            {/* 👈 Línea 353: Cierre del contenedor de la botonera */}
          </div>{" "}
          {/* 👈 Línea 354: Cierre del encabezado header-card */}
          {/* RENDERIZADO CONDICIONAL DE LAS SECCIONES */}
          {vistaActual === "registro" &&
          usuarioLogueado.rol === "Administrador" ? (
            <RegistroUsuario
              onVolver={() => setVistaActual("inicio")}
              usuarioActual={usuarioLogueado}
            />
          ) : vistaActual === "perfil" ? (
            <PerfilUsuario
              usuarioActual={usuarioLogueado}
              onVolver={() => setVistaActual("inicio")}
              onCuentaEliminada={manejarCerrarSesion}
            />
          ) : vistaActual === "aprovisionamiento" ? (
            <Aprovisionamiento />
          ) : vistaActual === "almacen" ? (
            <GestionAlmacen />
          ) : vistaActual === "mantenimiento" ? (
            <MantenimientoVehicular usuarioActual={usuarioLogueado} />
          ) : vistaActual === "inicio" ? (
            <DashboardInicio />
          ) : vistaActual === "transporte" ? (
            <TransporteDistribucion />
          ) : vistaActual === "inventarios" ? (
            <>
              <FormulariosInventario
                datosReales={datosServidor}
                onOperacionExitosa={manejarSincronizacion}
              />

              {/* NUEVA CONSOLA INDEPENDIENTE DE RECURSOS HUMANOS (ALTA/BAJA AUDITADA) */}
              <FormulariosPersonal onOperacionExitosa={manejarSincronizacion} />

              <p
                style={{
                  backgroundColor: sincronizando
                    ? "#fef3c7"
                    : mensajeEstado.includes("X")
                      ? "#fee2e2"
                      : "#e2f5ec",
                  color: sincronizando
                    ? "#b45309"
                    : mensajeEstado.includes("X")
                      ? "#dc2626"
                      : "#0d9488",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.3s ease",
                }}
              >
                {mensajeEstado}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "16px",
                  marginBottom: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={handleDescargarInventario}
                  disabled={descargandoInventario}
                  style={{
                    backgroundColor: descargandoInventario
                      ? "#6ee7b7"
                      : "#059669",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: descargandoInventario ? "wait" : "pointer",
                  }}
                >
                  {descargandoInventario
                    ? "Preparando descarga..."
                    : "⬇ Descargar Inventario"}
                </button>
                <button
                  onClick={manejarSincronizacion}
                  disabled={sincronizando}
                  style={{
                    backgroundColor: sincronizando
                      ? "#94a3b8"
                      : "var(--accent-color)",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: sincronizando ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)",
                  }}
                >
                  {sincronizando
                    ? "Consultando Servidor..."
                    : "Forzar Sincronización con Servidor"}
                </button>
              </div>

              <TablaInventario
                datosReales={datosServidor}
                onAsignacionCambiada={manejarSincronizacion}
              />
            </>
          ) : (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                backgroundColor: "#fff",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                color: "#64748b",
              }}
            >
              <h3>🚧 Módulo "{vistaActual.toUpperCase()}" en Construcción</h3>
              <p style={{ fontSize: "14px" }}>
                Esta sección se encuentra lista en la arquitectura y en espera
                de los datos del área de proyectos.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
