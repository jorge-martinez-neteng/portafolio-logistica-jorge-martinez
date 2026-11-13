// TransporteDistribucion.jsx
import { useState } from "react";

function TransporteDistribucion() {
  const [zonaSeleccionada, setZonaSeleccionada] = useState("ZONA_NORTE_1");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [monitoreoRutas] = useState([
    {
      conductor: "Jorge Martínez",
      vehiculo: "Nissan NV350 (Eco-01)",
      ruta: "Zona Norte / Satélite",
      estatus: "En Ruta",
      color: "#28a745",
    },
    {
      conductor: "Carlos Gómez",
      vehiculo: "Chevrolet Isuzu (Eco-02)",
      ruta: "Zona Centro / Reforma",
      estatus: "En Ruta",
      color: "#28a745",
    },
    {
      conductor: "María Rodríguez",
      vehiculo: "Ford Transit (Eco-03)",
      ruta: "Zona Sur / Coyoacán",
      estatus: "Cargando",
      color: "#0284c7",
    },
    {
      conductor: "Supervisor YGO",
      vehiculo: "Toyota Hilux (Eco-04)",
      ruta: "Zona Oriente / Aeropuerto",
      estatus: "Detenido",
      color: "#dc3545",
    },
  ]);

  // 📍 LINK EN VIVO DE SEGUIMIENTO OBTENIDO DE TU CUENTA REAL DE SIMPLIROUTE
  const urlTrackingSimpliRoute = "https://simpliroute.com";

  const handleLanzarDespachoSimpliroute = async (e) => {
    e.preventDefault();
    setMensaje(
      "ℹ️ Cuenta en Modo Visualización: El Token proporcionado por la gerencia no cuenta con permisos de escritura (POST) para alterar rutas.",
    );

    /* 
    ======================================================================
    🔒 CÓDIGO MAESTRO DE ENVÍO DE RUTA (DESCOMENTAR CUANDO OTORGUEN PERMISOS)
    ======================================================================
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/transporte/despachar?zona_id=${zonaSeleccionada}`, {
        method: "POST"
      });
      const resultado = await response.json();
      if (response.ok && resultado.status === "success") {
        setMensaje(`✔️ Éxito API: Se enviaron ${resultado.visitas_enviadas} paradas.`);
      }
    } catch (error) {
      setMensaje("❌ Error al conectar con el endpoint del despachador.");
    } finally {
      setLoading(false);
    }
    ======================================================================
    */
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "10px",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "700",
            color: "#1e293b",
          }}
        >
          🚚 Monitoreo y Planificación de Distribución (Última Milla Full-Stack)
        </h3>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            backgroundColor: "#e2f5ec",
            color: "#0d9488",
            padding: "4px 10px",
            borderRadius: "12px",
          }}
        >
          🟢 Interconexión SimpliRoute Activa
        </span>
      </div>

      {mensaje && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#fff8e6",
            color: "#b45309",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "500",
            border: "1px solid #ffe4a3",
          }}
        >
          {mensaje}
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* COLUMNA 1: MAPA EN VIVO DESDE LA PLATAFORMA DE SEGUIMIENTO */}
        <div
          style={{
            flex: "1 1 500px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            padding: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              📍 Consola de Monitoreo de Visitas y Progreso Vehicular (Live
              Tracking)
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: "460px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              overflow: "hidden",
              backgroundColor: "#f1f5f9",
            }}
          >
            <iframe
              src={urlTrackingSimpliRoute}
              title="Panel de Monitoreo SimpliRoute"
              width="100%"
              height="100%"
              style={{ border: "none" }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        </div>

        {/* COLUMNA 2: ACCIONES Y PROGRESO */}
        <div
          style={{
            flex: "1 1 300px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#f8fafc",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                color: "#475569",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              ⚡ Despachador de Rutas (Bloqueado)
            </span>
            <form
              onSubmit={handleLanzarDespachoSimpliroute}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <select
                value={zonaSeleccionada}
                onChange={(e) => setZonaSeleccionada(e.target.value)}
                className="form-input-compact"
                style={{ backgroundColor: "#fff" }}
                disabled={loading}
              >
                <option value="ZONA_NORTE_1">
                  Despachar Zona Norte / Satélite
                </option>
                <option value="ZONA_CENTRO_1">
                  Despachar Zona Central / Reforma
                </option>
              </select>
              <button
                type="submit"
                className="btn-compact-primary"
                style={{
                  width: "100%",
                  fontWeight: "700",
                  backgroundColor: "#64748b",
                }}
              >
                Optimizar & Enviar (Solo Lectura)
              </button>
            </form>
          </div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "6px",
            }}
          >
            📇 Estado de Despacho de Operadores
          </span>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {monitoreoRutas.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "700",
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  <span>{item.conductor}</span>
                  <span style={{ color: item.color, fontSize: "12px" }}>
                    ● {item.estatus}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span>
                    <strong>Vehículo:</strong> {item.vehiculo}
                  </span>
                  <span>
                    <strong>Ruta Asignada:</strong> {item.ruta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransporteDistribucion;
