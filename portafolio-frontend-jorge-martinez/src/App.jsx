import React, { useState } from "react";
import TablaInventario from "./components/TablaInventario";

function App() {
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState(
    "Conectada de forma remota a la instancia 10.0.0.1\\YGO.",
  );
  const [datosServidor, setDatosServidor] = useState([]);

  const manejarSincronizacion = async () => {
    setSincronizando(true);
    setMensajeEstado(
      "🔄 Conectando con la base de datos remota... Extrayendo registros de Equipo_Computo...",
    );

    try {
      const respuesta = await fetch("http://10.0.0.138:8000/api/equipos");
      const resultado = await respuesta.json();

      if (resultado.status === "success") {
        setDatosServidor(resultado.data);
        if (resultado.data.length === 0) {
          setMensajeEstado(
            "✅ Conexión exitosa con 10.0.0.1. La tabla 'Equipo_Computo' se encuentra vacía (0 registros).",
          );
        } else {
          setMensajeEstado(
            `✅ Éxito de red. Se extrajeron ${resultado.data.length} registros reales desde SQL Server.`,
          );
        }
      } else {
        setMensajeEstado(`❌ Error en base de datos: ${resultado.message}`);
      }
    } catch (error) {
      setMensajeEstado(
        "❌ Error crítico de red: No se pudo establecer comunicación con el Micro-Backend (Puerto 8000).",
      );
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="header-card">
        <h1>Dashboard Logístico Central</h1>
        <p style={{ marginBottom: "16px" }}>
          Estación de trabajo de Jorge Martínez.
        </p>

        <p
          style={{
            backgroundColor: sincronizando
              ? "#fef3c7"
              : mensajeEstado.includes("❌")
                ? "#fee2e2"
                : "#e2f5ec",
            color: sincronizando
              ? "#b45309"
              : mensajeEstado.includes("❌")
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

        <button
          onClick={manejarSincronizacion}
          disabled={sincronizando}
          style={{
            marginTop: "16px",
            backgroundColor: sincronizando ? "#94a3b8" : "var(--accent-color)",
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

      <TablaInventario datosReales={datosServidor} />
    </div>
  );
}

export default App;
