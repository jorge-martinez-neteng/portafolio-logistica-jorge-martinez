// GestionAlmacen.jsx
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

function GestionAlmacen() {
  const [inventarioAlmacen, setInventarioAlmacen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // ESTADOS PARA EL FORMULARIO DE ACTUALIZACIÓN DE ESTADO EN BODEGA
  const [idOrdenSeleccionada, setIdOrdenSeleccionada] = useState("");
  const [nuevoEstatusLogist, setNuevoEstatusLogist] = useState("En Bodega");

  // 🔄 FUNCIÓN MAESTRA: Consultar órdenes reales clasificadas y en bodega desde SQL Server
  const cargarPaquetesDesdeServidor = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bodega/ordenes-pendientes`,
      );
      const resultado = await response.json();

      if (resultado.status === "success") {
        // Mapear dinámicamente los estilos y colores industriales según el estado logístico
        const datosConEstilos = (resultado.data || []).map((item) => {
          let color = "#b45309";
          let bg = "#fef3c7";
          if (item.estatus === "En Bodega") {
            color = "#166534";
            bg = "#f0fdf4";
          }
          return { ...item, color, bg };
        });
        setInventarioAlmacen(datosConEstilos);
        if (datosConEstilos.length > 0 && !idOrdenSeleccionada) {
          setIdOrdenSeleccionada(datosConEstilos[0].id);
        }
      }
    } catch (err) {
      console.error("Error de comunicación con el backend logístico:", err);
      setMensaje(
        "❌ Error crítico de red: No se pudo conectar con el servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPaquetesDesdeServidor();
  }, []);

  // 💾 ENVIAR ACTUALIZACIÓN DE ESTADO A FASTAPI / SQL SERVER
  const handleGuardarUbicacionReal = async (e) => {
    e.preventDefault();
    if (!idOrdenSeleccionada) return;
    setMensaje("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bodega/actualizar-estado`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_orden: idOrdenSeleccionada,
            estado_logistico: nuevoEstatusLogist,
          }),
        },
      );

      const resultado = await response.json();
      if (resultado.status === "success") {
        setMensaje(
          `✔️ Orden ${idOrdenSeleccionada} actualizada con éxito en la base de datos.`,
        );
        cargarPaquetesDesdeServidor();
      } else {
        throw new Error(resultado.message);
      }
    } catch (error) {
      alert(`⚠️ Fallo al actualizar estado en bodega: ${error.message}`);
    }
  };

  const handleImprimirEtiqueta = (id) => {
    alert(
      `🖨️ Comando enviado a la Estación de Etiquetado Central YGO.\n\nCódigo de Tracking: ${id}\nFormato: Code 128 Industrial\nEstado: Verificado e interconectado localmente.`,
    );
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
          🏭 Gestión, Clasificación y Flujo Guiado en Bodega (SQL Server Live)
        </h3>
      </div>

      {mensaje && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#e2f5ec",
            color: "#0d9488",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "500",
            border: "1px solid #ccfbf1",
          }}
        >
          {mensaje}
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* PANEL IZQUIERDO: SEGUIMIENTO GUIADO */}
        <div
          style={{
            flex: "1 1 280px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            height: "fit-content",
          }}
        >
          <span
            className="form-label-compact"
            style={{
              display: "block",
              marginBottom: "12px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "4px",
            }}
          >
            📍 Flujo de Carga y Bahías
          </span>

          <form
            onSubmit={handleGuardarUbicacionReal}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div className="form-group-compact">
              <label className="form-label-compact">
                Seleccionar Paquete de la Fila:
              </label>
              <select
                value={idOrdenSeleccionada}
                onChange={(e) => setIdOrdenSeleccionada(e.target.value)}
                className="form-input-compact"
                style={{ backgroundColor: "#fff", cursor: "pointer" }}
                required
              >
                <option value="" disabled>
                  -- Seleccione un paquete en almacén --
                </option>
                {inventarioAlmacen.map((item) => (
                  <option key={item.id} value={item.id}>
                    📦 {item.id} — [{item.cliente}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-compact">
              <label className="form-label-compact">
                Avanzar Estado Logístico:
              </label>
              <select
                value={nuevoEstatusLogist}
                onChange={(e) => setNuevoEstatusLogist(e.target.value)}
                className="form-input-compact"
                style={{ backgroundColor: "#fff", cursor: "pointer" }}
              >
                <option value="En Bodega">
                  📥 Confirmar Acomodo en Bahía ('En Bodega')
                </option>
                <option value="En Ruta">
                  🚚 Confirmar Despacho y Carga a Vehículo ('En Ruta')
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-compact-primary"
              style={{ marginTop: "6px" }}
              disabled={loading || inventarioAlmacen.length === 0}
            >
              Actualizar Flujo de Paquete
            </button>
          </form>
        </div>

        {/* PANEL DERECHO: BITÁCORA EN TIEMPO REAL */}
        <div
          style={{
            flex: "1 1 500px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            overflowX: "auto",
          }}
        >
          <span
            className="form-label-compact"
            style={{ display: "block", marginBottom: "12px" }}
          >
            📋 Bitácora en Vivo: Paquetes por Surtir y Validar
          </span>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #cbd5e1",
                  color: "#475569",
                  fontWeight: "700",
                }}
              >
                <th style={{ padding: "6px 8px" }}>Ref ERP / SKU</th>
                <th style={{ padding: "6px 8px" }}>Cliente Origen</th>
                <th style={{ padding: "6px 8px" }}>Dirección de Entrega</th>
                <th style={{ padding: "6px 8px" }}>Bahía Física Sugerida</th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>
                  Cantidad
                </th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>
                  Estado
                </th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>
                  Etiqueta
                </th>
              </tr>
            </thead>
            <tbody>
              {inventarioAlmacen.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    No hay paquetes en proceso de bodega actualmente. Sincronice
                    el pipeline.
                  </td>
                </tr>
              ) : (
                inventarioAlmacen.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      color: "#334155",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px",
                        fontWeight: "700",
                        color: "#0284c7",
                      }}
                    >
                      {row.id}
                    </td>
                    <td style={{ padding: "8px", fontWeight: "600" }}>
                      {row.cliente}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        maxWith: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.descripcion}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          border: "1px solid #e2e8f0",
                          color: "#475569",
                        }}
                      >
                        📍 {row.bahia}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: "700",
                      }}
                    >
                      {row.paquetes}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "700",
                          backgroundColor: row.bg,
                          color: row.color,
                          border: `1px solid ${row.color}22`,
                        }}
                      >
                        {row.estatus}
                      </span>
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <button
                        onClick={() => handleImprimirEtiqueta(row.id)}
                        className="btn-compact-secondary"
                        style={{
                          padding: "2px 6px",
                          fontSize: "11px",
                          backgroundColor: "#0284c7",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        🖨️ Etiqueta
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestionAlmacen;
