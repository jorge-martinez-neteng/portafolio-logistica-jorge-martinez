import { useState, useEffect } from "react";
import { authService } from "../services/authService";

function RegistroUsuario({ onVolver, usuarioActual }) {
  // Cambiamos el estado de texto libre por una variable de selección relacional
  const [idEmpleado, setIdEmpleado] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 🟢 CASILLA DE CONFIRMACIÓN SOLICITADA
  const [rol, setRol] = useState("Usuario");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [loading, setLoading] = useState(false);
  const [userAEliminar, setUserAEliminar] = useState("");
  const [mensajeBaja, setMensajeBaja] = useState({ texto: "", tipo: "" });
  const [listaUsuariosActivos, setListaUsuariosActivos] = useState([]);

  // 🟢 NUEVO ESTADO: CATÁLOGO DE NÓMINA CENTRAL DE EMPLEADOS ACTIVOS
  const [catalogoEmpleados, setCatalogoEmpleados] = useState([]);

  // Carga las cuentas de usuario activas para la sección de baja
  const cargarUsuariosActivos = async () => {
    try {
      const userGerente = usuarioActual
        ? encodeURIComponent(usuarioActual.username)
        : "admin";
      const response = await fetch(
        `http://localhost:8000/api/usuarios-activos?username_gerente=${userGerente}`,
      );
      const resultado = await response.json();
      if (resultado.status === "success") {
        setListaUsuariosActivos(resultado.data || []);
      }
    } catch (error) {
      console.error("Error al consultar la lista de usuarios:", error.message);
    }
  };

  // 🟢 NUEVA FUNCIÓN SENIOR: EXTRAER PERSONAL REAL DESDE SQL SERVER
  const cargarCatalogoEmpleados = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/empleados-lista");
      const resultado = await response.json();
      if (resultado.status === "success") {
        setCatalogoEmpleados(resultado.data || []);
      }
    } catch (error) {
      console.error(
        "Error al traer catálogo de personal para usuarios:",
        error,
      );
    }
  };

  useEffect(() => {
    cargarUsuariosActivos();
    cargarCatalogoEmpleados(); // Jalamos la nómina al montar la vista
  }, [usuarioActual]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: "" });

    // 🟢 VALIDACIÓN DE INTEGRIDAD DE CONTRASEÑA EN EL CLIENTE
    if (password !== confirmPassword) {
      setMensaje({
        texto:
          "⚠️ Las contraseñas ingresadas no coinciden. Verifique la confirmación.",
        tipo: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // ======================================================================
      // ENTORNO SENIOR: PASAMOS EL ID DE EMPLEADO COMO CADENA DE TEXTO (Y22)
      // ======================================================================
      if (!idEmpleado || idEmpleado.trim() === "") {
        throw new Error(
          "Debe seleccionar un colaborador válido de la lista desplegable.",
        );
      }

      // Enviamos idEmpleado directamente como texto hacia el authService
      const response = await authService.registrar(
        idEmpleado,
        username.trim(),
        password,
        rol,
      );

      if (response.status === "success") {
        setMensaje({ texto: response.message, tipo: "success" });
        setIdEmpleado("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
      } else {
        setMensaje({
          texto: response.message || "Error en el registro",
          tipo: "error",
        });
      }
    } catch (err) {
      setMensaje({
        texto: err.message || "No se pudo completar el registro",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUsuario = async (e) => {
    e.preventDefault();
    setMensajeBaja({ texto: "", tipo: "" });

    const confirmar = window.confirm(
      `⚠️ ¿Estás seguro de dar de baja al usuario "${userAEliminar}"?`,
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/eliminar-usuario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username_a_eliminar: userAEliminar,
            username_gerente: usuarioActual ? usuarioActual.username : "admin",
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.detail || data.message);

      setMensajeBaja({ texto: data.message, tipo: "success" });
      cargarUsuariosActivos();
      setUserAEliminar("");
    } catch (err) {
      setMensajeBaja({ texto: err.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "450px",
        margin: "20px auto",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #eaeaea",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ margin: 0, color: "#333" }}>
          Aprovisionamiento de Nuevo Usuario
        </h3>
        <button
          onClick={onVolver}
          style={{
            padding: "6px 12px",
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Volver al Inventario
        </button>
      </div>

      {mensaje.texto && (
        <div
          style={{
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px",
            backgroundColor: mensaje.tipo === "success" ? "#d4edda" : "#f8d7da",
            color: mensaje.tipo === "success" ? "#155724" : "#721c24",
            border: `1px solid ${mensaje.tipo === "success" ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {mensaje.tipo === "success" ? "✅" : "⚠️"} {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 🟢 SELECCIÓN DE EMPLEADO EXPANDIBLE RELACIONAL */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Seleccionar Colaborador:
          </label>
          <select
            value={idEmpleado}
            onChange={(e) => setIdEmpleado(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
            required
            disabled={loading}
          >
            <option value="">-- Seleccione un empleado activo --</option>
            {catalogoEmpleados.map((emp) => (
              <option key={emp.id_empleado} value={emp.id_empleado}>
                👤 [{emp.id_empleado}] {emp.nombre_completo}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Crear Usuario de Inicio (Único):
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
            required
            disabled={loading}
            placeholder="Ej. brandon.silva"
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Contraseña de Acceso:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
            required
            disabled={loading}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        {/* 🟢 NUEVA CASILLA: CONFIRMAR CONTRASENA */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Confirmar Contraseña de Acceso:
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
            required
            disabled={loading}
            placeholder="Escriba de nuevo la contraseña"
          />
        </div>

        {/* 🟢 NUEVO MENÚ DESPLEGABLE DE ROLES CORPORATIVOS YGO */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
          >
            Rol Asignado en el Sistema:
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            <option value="Administrador">
              👑 Administrador (Control Total)
            </option>
            <option value="Usuario">👤 Usuario (Solo Vista / Lectura)</option>
            <option value="Supervisor">
              💼 Supervisor (Control Operativo de Vistas)
            </option>
            <option value="Mecánico">
              🔧 Mecánico (Gestión y Control de Taller)
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Procesando en Servidor..." : "Dar de Alta Cuenta"}
        </button>
      </form>

      {/* SECCIÓN COMPACTA: BAJA Y DESACTIVACIÓN DE USUARIOS */}
      <div className="danger-zone-compact" style={{ marginTop: "20px" }}>
        <h4 className="danger-zone-title">Baja de Usuarios del Sistema</h4>
        <p className="danger-zone-text">
          Ingrese el nombre de usuario para desactivar su acceso inmediatamente.
        </p>

        {mensajeBaja.texto && (
          <div
            className={`alert-compact ${mensajeBaja.tipo === "success" ? "alert-compact-success" : "alert-compact-error"}`}
            style={{
              padding: "6px 10px",
              fontSize: "12px",
              marginBottom: "10px",
            }}
          >
            {mensajeBaja.tipo === "success" ? "✅" : "⚠️"} {mensajeBaja.texto}
          </div>
        )}

        <form
          onSubmit={handleEliminarUsuario}
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <div style={{ flex: 1 }}>
            <select
              value={userAEliminar}
              onChange={(e) => setUserAEliminar(e.target.value)}
              className="form-input-compact"
              required
              disabled={loading || listaUsuariosActivos.length === 0}
              style={{
                padding: "6px 8px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="">-- Seleccione un usuario a desactivar --</option>
              {listaUsuariosActivos.map((user) => (
                <option key={user.id_usuario} value={user.username}>
                  👤 {user.username}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !userAEliminar}
            className="btn-compact-danger"
            style={{ padding: "6px 12px", whiteSpace: "nowrap" }}
          >
            {loading ? "Procesando..." : "Desactivar Cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistroUsuario;
