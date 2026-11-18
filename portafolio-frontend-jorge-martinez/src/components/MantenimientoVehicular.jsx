import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

function MantenimientoVehicular({ usuarioActual }) {
  const esMecanico =
    usuarioActual?.username === "admin" || usuarioActual?.rol === "Mecánico";

  // Estados reales conectados al Servidor FastAPI / SQL Server
  const [flotaVehicular, setFlotaVehicular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [idVehiculoSeleccionado, setIdVehiculoSeleccionado] = useState("");
  const [tipoMantenimiento, setTipoMantenimiento] = useState(
    "Mantenimiento Preventivo",
  );
  const [fallaReportada, setFallaReportada] = useState("");
  const [kmIngreso, setKmIngreso] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [mecanicoResponsable, setMecanicoResponsable] = useState("");

  const cargarFlotaReal = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipos`);
      const resultado = await response.json();
      if (resultado.status === "success") {
        const soloVehiculos = (resultado.data || []).filter(
          (item) => item.categoria?.toLowerCase() === "vehiculo",
        );
        setFlotaVehicular(soloVehiculos);
        if (soloVehiculos.length > 0 && !idVehiculoSeleccionado) {
          setIdVehiculoSeleccionado(soloVehiculos[0].id_activo);
        }
      }
    } catch (err) {
      console.error("Error al conectar con la bitácora vehicular:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFlotaReal();
  }, []);

  const handleIngresarTaller = async (e) => {
    e.preventDefault();
    if (!esMecanico) return;
    setMensaje("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/equipos/asignar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_vehiculo: idVehiculoSeleccionado,
            tipo_mantenimiento: tipoMantenimiento,
            kilometraje: parseInt(kmIngreso),
            fecha_promesa: fechaEstimada,
            descripcion_falla: fallaReportada,
            mecanico_responsable: mecanicoResponsable, // 🔑 Atributo exacto hacia tu Backend
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);
      setMensaje(
        `✔️ Unidad ${idVehiculoSeleccionado} ingresada a taller correctamente.`,
      );
      setFallaReportada("");
      setKmIngreso("");
      setFechaEstimada("");
      cargarFlotaReal();
      setMecanicoResponsable("");
    } catch (error) {
      alert(`⚠️ Error al procesar ingreso: ${error.message}`);
    }
  };

  const handleCambiarEstatusFlota = async (idVehiculo, nuevoEstatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/equipos/asignar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_equipo: idVehiculo,
            status_vehiculo: nuevoEstatus,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);
      setMensaje(
        `⚙️ Estatus de la unidad ${idVehiculo} modificado a: ${nuevoEstatus}`,
      );
      cargarFlotaReal();
    } catch (error) {
      alert(`⚠️ Error al conmutar estatus: ${error.message}`);
    }
  };
  const handleImprimirBitacoraExcel = () => {
    const unidadesEnTaller = flotaVehicular.filter(
      (item) =>
        item.status?.toLowerCase() !== "en ruta" &&
        item.status?.toLowerCase() !== "activo" &&
        item.status?.toLowerCase() !== "stock",
    );
    let excelRows = [
      [
        "ID Vehiculo",
        "Operador",
        "Marca",
        "Modelo",
        "Placas",
        "Estatus Taller",
        "Observaciones",
      ],
    ];
    unidadesEnTaller.forEach((v) => {
      let operador = v.empleado_nombre
        ? `${v.empleado_nombre} ${v.empleado_paterno || ""}`.trim()
        : "Sin Asignar";
      excelRows.push([
        v.id_activo,
        operador,
        v.marca,
        v.modelo,
        v.serie || "S/P",
        v.status || "En Taller",
        v.observaciones || "",
      ]);
    });
    let csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      excelRows.map((e) => e.join(",")).join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Bitacora_Taller_YGO_${new Date().getFullYear()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDescargarInventarioFlotaExcel = () => {
    let excelRows = [
      [
        "ID Vehiculo / Referencia",
        "Operador Asignado",
        "Marca",
        "Modelo",
        "Placas / Serie",
        "Duplicado Llave",
        "Propietario",
        "Ubicacion Actual",
        "Estatus Vehiculo",
      ],
    ];
    flotaVehicular.forEach((v) => {
      let operador = v.empleado_nombre
        ? `${v.empleado_nombre} ${v.empleado_paterno || ""}`.trim()
        : "Sin Operador";
      let idVisual =
        v.referencia && v.referencia.trim() !== "" ? v.referencia : v.id_activo;
      let dupLlave =
        v.duplicado_llave && v.duplicado_llave.trim() !== ""
          ? v.duplicado_llave
          : "—";
      let propVeh =
        v.propietario && v.propietario.trim() !== "" ? v.propietario : "—";
      let ubicVeh =
        v.ubicacion && v.ubicacion.trim() !== "" ? v.ubicacion : "—";
      excelRows.push([
        idVisual,
        operador,
        v.marca,
        v.modelo,
        v.serie || "S/P",
        dupLlave,
        propVeh,
        ubicVeh,
        v.status || "Inactivo",
      ]);
    });
    let csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      excelRows.map((e) => e.join(",")).join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Inventario_Real_Flota_YGO_${new Date().getFullYear()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* 1. CABECERA GENERAL DE EXPORTACIONES */}
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
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
          🚚 Control de Flota Móvil y Órdenes de Mantenimiento YGO
        </h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleImprimirBitacoraExcel}
            style={{
              backgroundColor: "#475569",
              padding: "6px 14px",
              fontSize: "12px",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            📊 Imprimir Bitácora Taller (Excel)
          </button>
          <button
            type="button"
            onClick={handleDescargarInventarioFlotaExcel}
            style={{
              backgroundColor: "#28a745",
              padding: "6px 14px",
              fontSize: "12px",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            🟢 Descargar Inventario Flota (Excel)
          </button>
        </div>
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
      {loading && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#fffbeb",
            color: "#b45309",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "600",
            border: "1px solid #fef3c7",
          }}
        >
          🔄 Sincronizando con Servidor SQL Server...
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* 2. CARD IZQUIERDA: FORMULARIO MECÁNICO */}
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
          {esMecanico ? (
            <>
              <span
                style={{
                  display: "block",
                  marginBottom: "12px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "4px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#475569",
                }}
              >
                📝 Crear Órden de Servicio
              </span>
              <form
                onSubmit={handleIngresarTaller}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "4px",
                      color: "#475569",
                    }}
                  >
                    Seleccionar Unidad Real (ECO):
                  </label>
                  <select
                    value={idVehiculoSeleccionado}
                    onChange={(e) => setIdVehiculoSeleccionado(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                    }}
                    required
                  >
                    <option value="" disabled>
                      -- Seleccione una unidad --
                    </option>
                    {flotaVehicular.map((v) => {
                      const idVisual =
                        v.referencia && v.referencia.trim() !== ""
                          ? v.referencia
                          : v.id_activo;
                      return (
                        <option key={v.id_activo} value={v.id_activo}>
                          🚚 {idVisual} — {v.marca} {v.modelo}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "4px",
                      color: "#475569",
                    }}
                  >
                    Tipo de Mantenimiento:
                  </label>
                  <select
                    value={tipoMantenimiento}
                    onChange={(e) => setTipoMantenimiento(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#fff",
                    }}
                  >
                    <option value="Mantenimiento Preventivo">
                      🔧 Preventivo (Rutina / Afinación)
                    </option>
                    <option value="Reparación Pesada">
                      🚨 Correctivo (Falla / Reparación)
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "4px",
                      color: "#475569",
                    }}
                  >
                    Kilometraje de Ingreso:
                  </label>
                  <input
                    type="number"
                    value={kmIngreso}
                    onChange={(e) => setKmIngreso(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "4px",
                      color: "#475569",
                    }}
                  >
                    Fecha Promesa de Salida:
                  </label>
                  <input
                    type="date"
                    value={fechaEstimada}
                    onChange={(e) => setFechaEstimada(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "4px",
                      color: "#475569",
                    }}
                  >
                    Descripción Detallada de la Falla:
                  </label>
                  <textarea
                    value={fallaReportada}
                    onChange={(e) => setFallaReportada(e.target.value)}
                    style={{
                      width: "100%",
                      height: "50px",
                      padding: "6px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      resize: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    required
                  />
                </div>

                {/* ⚙️ CASILLA REQUERIDA: MECÁNICO RESPONSABLE DE LA REPARACIÓN */}
                <div
                  className="form-group-compact"
                  style={{ marginTop: "10px" }}
                >
                  <label
                    className="form-label-compact"
                    style={{ fontWeight: "700", color: "#6b0b33" }}
                  >
                    Mecánico Técnico Responsable:
                  </label>
                  <input
                    type="text"
                    value={mecanicoResponsable}
                    onChange={(e) => setMecanicoResponsable(e.target.value)}
                    className="form-input-compact"
                    placeholder="Ej. Maestro J. Inés / Taller Eléctrico Central"
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      width: "100%",
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#0284c7",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "700",
                    fontSize: "12px",
                  }}
                >
                  Ingresar Unidad a Taller
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "20px 10px",
                color: "#64748b",
              }}
            >
              <span
                style={{
                  fontSize: "32px",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                🔒
              </span>
              <h4 style={{ margin: "0 0 6px 0", color: "#334155" }}>
                Panel Protegido
              </h4>
              <p style={{ fontSize: "11px", margin: 0 }}>
                Tu cuenta solo cuenta con permisos de consulta.
              </p>
            </div>
          )}
        </div>
        {/* 3. CARD DERECHA: VISOR DE BITÁCORA CON SCROLLBAR ADAPTATIVO */}
        <div
          style={{
            flex: "1 1 500px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            maxHeight: "520px",
            overflowY: "auto",
            overflowX: "auto",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <span
            style={{
              display: "block",
              marginBottom: "12px",
              fontSize: "13px",
              fontWeight: "700",
              color: "#475569",
            }}
          >
            📋 Bitácora General de Estatus de Flota (SQL Server Live)
          </span>
          {flotaVehicular.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#94a3b8",
                fontWeight: "600",
                fontSize: "13px",
                backgroundColor: "#f8fafc",
                borderRadius: "4px",
                border: "1px dashed #cbd5e1",
              }}
            >
              🚚 Sincronizando inventario vehicular... Presione 'Forzar
              Sincronización' si de mora.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #cbd5e1",
                    color: "#475569",
                    fontWeight: "700",
                    backgroundColor: "#f8fafc",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <th style={{ padding: "6px" }}>ECO / Código (Referencia)</th>
                  <th style={{ padding: "6px" }}>Placas / Modelo</th>
                  <th style={{ padding: "6px" }}>Operador Responsable</th>
                  <th style={{ padding: "6px", textAlign: "center" }}>
                    Estatus
                  </th>
                  {esMecanico && (
                    <th style={{ padding: "6px", textAlign: "center" }}>
                      📍 Cambiar Acción
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {flotaVehicular.map((row) => {
                  let operador = row.empleado_nombre
                    ? `${row.empleado_nombre} ${row.empleado_paterno || ""}`.trim()
                    : "Sin Operador";
                  let estatusUnidad = row.status || "Inactivo";
                  let bgBadge = "#fef2f2";
                  let colorBadge = "#dc2626";
                  if (
                    estatusUnidad.toLowerCase() === "en ruta" ||
                    estatusUnidad.toLowerCase() === "activo"
                  ) {
                    bgBadge = "#f0fdf4";
                    colorBadge = "#166534";
                  } else if (
                    estatusUnidad.toLowerCase().includes("mantenimiento") ||
                    estatusUnidad.toLowerCase().includes("preventivo")
                  ) {
                    bgBadge = "#dbeafe";
                    colorBadge = "#1e40af";
                  }
                  return (
                    <tr
                      key={row.id_activo}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        color: "#334155",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 6px",
                          fontWeight: "800",
                          color: "#475569",
                        }}
                      >
                        {row.referencia && row.referencia.trim() !== ""
                          ? row.referencia
                          : row.id_activo}
                      </td>
                      <td style={{ padding: "8px 6px" }}>
                        <div style={{ fontWeight: "600" }}>
                          {row.marca} {row.modelo}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#64748b",
                            fontFamily: "monospace",
                          }}
                        >
                          {row.serie}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "8px 6px",
                          color:
                            operador === "Sin Operador" ? "#94a3b8" : "#0284c7",
                          fontWeight: "500",
                        }}
                      >
                        👤 {operador}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "700",
                            backgroundColor: bgBadge,
                            color: colorBadge,
                            textTransform: "uppercase",
                          }}
                        >
                          {estatusUnidad}
                        </span>
                      </td>
                      {esMecanico && (
                        <td style={{ padding: "8px 6px", textAlign: "center" }}>
                          <select
                            value={estatusUnidad}
                            onChange={(e) =>
                              handleCambiarEstatusFlota(
                                row.id_activo,
                                e.target.value,
                              )
                            }
                            style={{
                              padding: "2px 6px",
                              fontSize: "11px",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#fff",
                              fontWeight: "600",
                              cursor: "pointer",
                              color: "#334155",
                            }}
                          >
                            <option value="En Ruta">
                              🟢 En Ruta / Disponible
                            </option>
                            <option value="Inactivo">
                              🔴 Inactivo / Detenido
                            </option>
                            <option value="Mantenimiento Preventivo">
                              🔧 Mantenimiento Preventivo
                            </option>
                            <option value="Reparación Pesada">
                              🚨 Reparación Pesada
                            </option>
                          </select>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default MantenimientoVehicular;
