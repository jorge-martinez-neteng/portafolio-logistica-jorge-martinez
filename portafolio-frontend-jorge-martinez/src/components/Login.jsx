import { useState } from "react";
import { authService } from "../services/authService"; // Importación segura de nuestro servicio

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ENVIAR CREDENCIALES DIRECTAS Y EN TEXTO PLANO AL BACKEND
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password, // Aquí viaja estrictamente "1234" directo a Python
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        throw new Error(
          data.detail || data.message || "Error en las credenciales",
        );
      }

      // Éxito: Transmitir la sesión real a App.jsx
      onLoginSuccess(data.usuario, rememberMe);
    } catch (err) {
      setError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "350px",
        margin: "100px auto",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>YGO-Login</h2>

      <form onSubmit={handleSubmit}>
        {/* Renderizado condicional de la alerta de error con estilos de advertencia */}
        {error && (
          <div
            style={{
              color: "#721c24",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Usuario:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Contraseña:
          </label>
          {/* Contenedor relativo para posicionar el ojo visor adentro del campo */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type={mostrarPassword ? "text" : "password"} // Alterna el tipo de campo dinámicamente
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "8px",
                boxSizing: "border-box",
                borderRadius: "4px",
                border: "1px solid #ccc",
                paddingRight: "40px", // Espacio a la derecha para que el texto no tape el ojo
              }}
              required
            />
            {/* Botón interactivo minimalista del ojo visor */}
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{
                position: "absolute",
                right: "10px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                userSelect: "none",
              }}
              title={
                mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {mostrarPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            style={{
              marginRight: "8px",
              cursor: "pointer",
              width: "16px",
              height: "16px",
            }}
          />
          <label
            htmlFor="rememberMe"
            style={{
              fontSize: "14px",
              cursor: "pointer",
              userSelect: "none",
              color: "#555",
            }}
          >
            Recordar mi sesión en este equipo
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          {loading ? "Validando con Servidor..." : "Ingresar al Sistema"}
        </button>
      </form>
    </div>
  );
}

export default Login;
