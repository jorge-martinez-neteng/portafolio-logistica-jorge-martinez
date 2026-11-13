import { useState } from "react";

function PerfilUsuario({ usuarioActual, onVolver, onCuentaEliminada }) {
  const [username, setUsername] = useState(usuarioActual.username || "");
  const [correo, setCorreo] = useState(usuarioActual.correo || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [loading, setLoading] = useState(false);

  const handleActualizarDatos = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: "" });

    if (password && password !== confirmPassword) {
      setMensaje({ texto: "Las contraseñas no coinciden", tipo: "error" });
      return;
    }

    setLoading(true);
    try {
      // NOTA SENIOR: Simulación en entorno de desarrollo. En producción llamará a authService
      console.log("Enviando actualización de perfil:", {
        username,
        correo,
        password,
      });

      setMensaje({
        texto: "Perfil actualizado exitosamente en el entorno de desarrollo.",
        tipo: "success",
      });
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMensaje({
        texto: err.message || "Error al actualizar el perfil",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCuenta = () => {
    const confirmar = window.confirm(
      "⚠️ ¿Estás absolutamente seguro de que deseas eliminar tu propio usuario? Esta acción es irreversible y te expulsará del sistema.",
    );

    if (confirmar) {
      console.log("Eliminando usuario ID:", usuarioActual.id_usuario);
      onCuentaEliminada();
    }
  };

  return (
    <div className="profile-compact-card">
      {/* CABECERA COMPACTA */}
      <div className="profile-compact-header">
        <h3 className="profile-compact-title">⚙️ Configuración de Mi Perfil</h3>
        <button onClick={onVolver} className="btn-compact-secondary">
          Volver al Inventario
        </button>
      </div>

      {/* RENDERIZADO DE ALERTAS */}
      {mensaje.texto && (
        <div
          className={`alert-compact ${mensaje.tipo === "success" ? "alert-compact-success" : "alert-compact-error"}`}
        >
          {mensaje.tipo === "success" ? "✅" : "⚠️"} {mensaje.texto}
        </div>
      )}

      {/* FORMULARIO DE CAPTURA DENSA */}
      <form onSubmit={handleActualizarDatos} style={{ marginBottom: "20px" }}>
        <div className="form-group-compact">
          <label className="form-label-compact">Nombre de Usuario:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input-compact"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group-compact">
          <label className="form-label-compact">
            Nueva Contraseña (Dejar vacío si no deseas cambiarla):
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input-compact"
            disabled={loading}
          />
        </div>

        {password && (
          <div className="form-group-compact" style={{ marginTop: "6px" }}>
            <label className="form-label-compact">
              Confirmar Nueva Contraseña:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input-compact"
              required
              disabled={loading}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-compact-primary"
          style={{ marginTop: "10px" }}
        >
          {loading ? "Guardando Cambios..." : "Actualizar Mis Datos"}
        </button>
      </form>

      {/* ZONA DE PELIGRO INDUSTRIAL */}
      <div className="danger-zone-compact">
        <h4 className="danger-zone-title">Zona de Peligro</h4>
        <p className="danger-zone-text">
          Al eliminar tu cuenta perderás de forma inmediata el acceso al sistema
          de monitoreo, logística e inventario vehicular centralizado.
        </p>
        <button
          type="button"
          onClick={handleEliminarCuenta}
          className="btn-compact-danger"
        >
          ❌ Eliminar Mi Usuario
        </button>
      </div>
    </div>
  );
}

export default PerfilUsuario;
