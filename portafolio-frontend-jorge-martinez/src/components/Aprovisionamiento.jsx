// Aprovisionamiento.jsx
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

function Aprovisionamiento() {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [bitacoraArribos, setBitacoraArribos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Carga las órdenes reales que se acaban de recibir hoy en el sistema
  const cargarBitacoraHoy = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/bodega/ordenes-pendientes`,
      );
      const resultado = await response.json();
      if (resultado.status === "success") {
        setBitacoraArribos(resultado.data || []);
      }
    } catch (error) {
      console.error("Error al refrescar la bitácora de arribos:", error);
    }
  };

  useEffect(() => {
    cargarBitacoraHoy();
  }, []);

  const handleSeleccionarArchivo = (e) => {
    setArchivoSeleccionado(e.target.files[0]);
    setMensaje("");
  };

  const handleSubirYProcesar = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado) {
      setMensaje(
        "⚠️ Por favor, seleccione un archivo de Excel (.xlsx) o CSV primero.",
      );
      return;
    }

    setLoading(true);
    setMensaje(
      "🔄 Transmitiendo archivo a la Capa Bronce del Servidor y ejecutando unificación dinámica...",
    );

    const formData = new FormData();
    formData.append("file", archivoSeleccionado);

    try {
      // Endpoint que crearemos en FastAPI para recibir el archivo físico mutable
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ingesta/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const resultado = await response.json();

      if (response.ok && resultado.status === "success") {
        setMensaje(
          `✔️ Éxito Total: Se unificaron e insertaron ${resultado.registros_procesados} órdenes en SQL Server.`,
        );
        setArchivoSeleccionado(null);
        // Resetear el control físico del archivo en el HTML
        document.getElementById("input-file-logistica").value = "";
        cargarBitacoraHoy();
      } else {
        throw new Error(
          resultado.message || "Error desconocido al procesar el layout.",
        );
      }
    } catch (error) {
      setMensaje(
        `❌ Error de Pipeline: Layout incompatible o pérdida de conexión local.`,
      );
    } finally {
      setLoading(false);
    }
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
          📦 Coordinación, Recepción e Ingesta Multicanal (Capa Bronce Local)
        </h3>
      </div>

      {mensaje && (
        <div
          style={{
            padding: "10px 12px",
            backgroundColor: mensaje.includes("❌")
              ? "#fef2f2"
              : mensaje.includes("✔️")
                ? "#e2f5ec"
                : "#fffbeb",
            color: mensaje.includes("❌")
              ? "#991b1b"
              : mensaje.includes("✔️")
                ? "#0d9488"
                : "#b45309",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "500",
            border: `1px solid ${mensaje.includes("❌") ? "#fecaca" : mensaje.includes("✔️") ? "#ccfbf1" : "#fef3c7"}`,
          }}
        >
          {mensaje}
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* PANEL IZQUIERDO: CARGA FLUIDA SCHEMA-ON-READ */}
        <div
          style={{
            flex: "1 1 300px",
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
            📥 Inyectar Layout Heterogéneo de Cliente
          </span>

          <form
            onSubmit={handleSubirYProcesar}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div className="form-group-compact">
              <label
                className="form-label-compact"
                style={{ color: "#0284c7" }}
              >
                Seleccionar Reporte (Excel o CSV):
              </label>
              <input
                id="input-file-logistica"
                type="file"
                accept=".xlsx, .csv"
                onChange={handleSeleccionarArchivo}
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "12px",
                  border: "1px dashed #0284c7",
                  borderRadius: "4px",
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                }}
                disabled={loading}
                required
              />
              <small
                style={{
                  display: "block",
                  marginTop: "4px",
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                * DuckDB acoplará las columnas variables mediante
                'union_by_name' de forma transparente.
              </small>
            </div>

            <button
              type="submit"
              className="btn-compact-primary"
              style={{ backgroundColor: loading ? "#94a3b8" : "#0284c7" }}
              disabled={loading}
            >
              {loading
                ? "Ejecutando Pipeline Medallón..."
                : "⚡ Cargar y Procesar Carga"}
            </button>
          </form>
        </div>

        {/* PANEL DERECHO: VISOR DE ÓRDENES ENTRANTES */}
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
            📋 Bitácora de Carga Unificada en Estación (Monitoreo del Día)
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
                <th style={{ padding: "6px 8px" }}>Ref ERP</th>
                <th style={{ padding: "6px 8px" }}>Cliente Dueño</th>
                <th style={{ padding: "6px 8px" }}>Dirección Registrada</th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>
                  Paquetes
                </th>
                <th style={{ padding: "6px 8px", textAlign: "center" }}>
                  Estatus Base
                </th>
              </tr>
            </thead>
            <tbody>
              {bitacoraArribos.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontWeight: "500",
                    }}
                  >
                    No hay registros cargados para la jornada de hoy. Suba un
                    layout para inicializar.
                  </td>
                </tr>
              ) : (
                bitacoraArribos.map((row) => (
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
                        color: "#64748b",
                      }}
                    >
                      {row.id}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        fontWeight: "700",
                        color: "#0284c7",
                      }}
                    >
                      {row.cliente}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        maxWidth: "220px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.descripcion}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: "600",
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
                          backgroundColor:
                            row.estatus === "En Bodega" ? "#f0fdf4" : "#fef3c7",
                          color:
                            row.estatus === "En Bodega" ? "#166534" : "#b45309",
                        }}
                      >
                        {row.estatus}
                      </span>
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

export default Aprovisionamiento;
