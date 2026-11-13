// Configuración de la URL base del micro-backend de FastAPI
const API_URL = "http://localhost:8000/api";

export const authService = {
  /**
   * Envía las credenciales del usuario al backend para su validación con BCrypt.
   * @param {string} username - Nombre de usuario introducido.
   * @param {string} password - Contraseña en texto plano.
   */
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el inicio de sesión");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en authService.login:", error.message);
      throw error;
    }
  },

  /**
   * Registra un nuevo usuario en el sistema (Llamada exclusiva de Gerencia).
   * @param {string} idEmpleado - ID/Matrícula alfanumérica del empleado (Ej: Y22). 🟢 CORREGIDO TIPO DE DATO
   * @param {string} username - Nombre de usuario propuesto.
   * @param {string} password - Contraseña inicial segura.
   * @param {string} rol - Rol asignado ('Administrador', 'Usuario', 'Supervisor', 'Mecánico'). 🟢 CORREGIDO DESCRIPCIÓN
   */
  registrar: async (idEmpleado, username, password, rol) => {
    try {
      const response = await fetch(`${API_URL}/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_empleado: idEmpleado,
          username,
          password,
          rol,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al registrar el usuario");
      }

      return await response.json();
    } catch (error) {
      console.error("Error en authService.registrar:", error.message);
      throw error;
    }
  },
};
