import { useEffect, useRef } from "react";

/**
 * Custom Hook para gestionar el cierre automático de sesión por inactividad.
 * @param {boolean} isAuthenticated - Estado actual de autenticación del usuario.
 * @param {Function} onTimeout - Función que ejecuta el cierre de sesión en App.jsx.
 * @param {number} timeoutMinutes - Tiempo límite en minutos (por defecto 30).
 */
export function useSessionTimeout(
  isAuthenticated,
  onTimeout,
  timeoutMinutes = 30,
) {
  // Guardamos la referencia del temporizador para poder limpiarlo entre renders
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Si el usuario no ha iniciado sesión, no necesitamos rastrear inactividad
    if (!isAuthenticated) return;

    // Convertimos los minutos a milisegundos (30 min = 1,800,000 ms)
    const timeoutMs = timeoutMinutes * 60 * 1000;

    // Función que se ejecuta cuando el temporizador llega a cero
    const handleTimeout = () => {
      console.log(
        `Sesión cerrada automáticamente tras ${timeoutMinutes} minutos de inactividad.`,
      );
      onTimeout();
    };

    // Función encargada de reiniciar el reloj cada vez que el usuario interactúa
    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
    };

    // Eventos globales del navegador que delatan actividad humana real
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Inicializamos el temporizador por primera vez al entrar
    resetTimer();

    // Enganchamos los escuchadores de eventos al objeto global window
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // FUNCIÓN DE SANEAMIENTO (Cleanup): Se ejecuta al desmontar el componente o cerrar sesión
    // Es vital para evitar fugas de memoria (Memory Leaks) en la aplicación
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, onTimeout, timeoutMinutes]);
}
