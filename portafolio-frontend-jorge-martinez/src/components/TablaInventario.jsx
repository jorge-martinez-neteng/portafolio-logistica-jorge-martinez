import { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

const OPCIONES_ESTATUS = [
  "DISPONIBLE",
  "ASIGNADO",
  "INACTIVO",
  "EN MANTENIMIENTO / REPARACIÓN",
  "DAÑADO",
  "EXTRAVIADO",
  "DAR DE BAJA",
];

const ESTILOS_ESTATUS = {
  DISPONIBLE: { backgroundColor: "#dcfce7", color: "#166534" },
  ASIGNADO: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  INACTIVO: { backgroundColor: "#e5e7eb", color: "#4b5563" },
  "EN MANTENIMIENTO / REPARACIÓN": {
    backgroundColor: "#ffedd5",
    color: "#c2410c",
  },
  DAÑADO: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  EXTRAVIADO: { backgroundColor: "#ede9fe", color: "#5b21b6" },
  "DAR DE BAJA": { backgroundColor: "#b91c1c", color: "#ffffff" },
};

function obtenerEstatusSelector(estatus, tieneAsignacion) {
  const normalizado = estatus.toLowerCase();
  if (
    normalizado.includes("reparación") ||
    normalizado.includes("mantenimiento")
  ) {
    return "EN MANTENIMIENTO / REPARACIÓN";
  }
  if (normalizado === "dañado" || normalizado === "danado") return "DAÑADO";
  if (normalizado === "extraviado" || normalizado === "perdido") {
    return "EXTRAVIADO";
  }
  if (normalizado === "inactivo" || normalizado === "robado") return "INACTIVO";
  if (normalizado === "activo" || normalizado === "asignado") {
    return tieneAsignacion ? "ASIGNADO" : "DISPONIBLE";
  }
  return "DISPONIBLE";
}

function TablaInventario({ datosReales, onAsignacionCambiada }) {
  const [empleados, setEmpleados] = useState([]);
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/empleados-lista`,
        );
        const resultado = await response.json();
        if (resultado.status === "success") {
          setEmpleados(resultado.data || []);
        }
      } catch (err) {
        console.error(
          "Error al traer catálogo de personal para la tabla:",
          err,
        );
      }
    };
    cargarEmpleados();
  }, []);

  const handleCambiarEmpleadoFila = async (idEquipo, idEmpleadoNuevo) => {
    setProcesandoId(idEquipo);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/equipos/asignar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_equipo: idEquipo,
            id_empleado: idEmpleadoNuevo,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      alert(`✔️ Responsable de activo actualizado con éxito en SQL Server.`);
      if (onAsignacionCambiada) onAsignacionCambiada();
    } catch (error) {
      alert(`⚠️ Error al actualizar responsable: ${error.message}`);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleReportarRobo = async (
    idEquipo,
    categoria,
    marca,
    modelo,
    usuario,
  ) => {
    const esCelular =
      idEquipo.startsWith("M") || categoria.toLowerCase().includes("celular");
    const msgConfirmacion = esCelular
      ? `🚨 ¿Confirmar baja por ROBO para el CELULAR "${idEquipo}"?\n\nEsta acción pondrá el equipo como INACTIVO, bloqueará el IMEI, desactivará la SIM vinculada y descargará el Acta Responsiva.`
      : `🚨 ¿Confirmar baja por ROBO para el activo "${idEquipo}"?\n\nSe desvinculará al operador de SQL Server y se descargará el Reporte con el espacio en blanco para la Declaración a Puño y Letra.`;

    const confirmar = window.confirm(msgConfirmacion);
    if (!confirmar) return;

    setProcesandoId(idEquipo);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/equipos/asignar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_equipo: idEquipo, id_empleado: "" }),
        },
      );

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      alert(
        `🚨 Reporte de siniestro procesado en SQL Server y documento descargado.`,
      );
      if (onAsignacionCambiada) onAsignacionCambiada();
    } catch (error) {
      alert(`⚠️ Error al registrar reporte: ${error.message}`);
    } finally {
      setProcesandoId(null);
    }
  };

  const handleActualizarEstatus = async (idActivo, categoria, nuevoEstatus) => {
    if (nuevoEstatus === "DAR DE BAJA") {
      const confirmar = window.confirm(
        `¿Confirmas dar de baja el activo ${idActivo}?\n\nEsta acción desvinculará el equipo del empleado asignado y lo eliminará permanentemente de la base de datos. No se puede deshacer.`,
      );
      if (!confirmar) return;
    }

    setProcesandoId(idActivo);
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventario/estatus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_activo: idActivo,
          categoria,
          nuevo_estatus: nuevoEstatus,
        }),
      });
      const resultado = await response.json();
      if (!response.ok || resultado.status === "error") {
        throw new Error(
          resultado.detail ||
            resultado.message ||
            "No se pudo actualizar el estatus.",
        );
      }

      if (onAsignacionCambiada) await onAsignacionCambiada();
      alert(
        nuevoEstatus === "DAR DE BAJA"
          ? `✔️ El activo ${idActivo} fue dado de baja.`
          : `✔️ Estatus de ${idActivo} actualizado a ${nuevoEstatus}.`,
      );
    } catch (error) {
      alert(`⚠️ Error al actualizar el estatus: ${error.message}`);
    } finally {
      setProcesandoId(null);
    }
  };

  if (!datosReales || datosReales.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          backgroundColor: "#f8fafc",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          color: "#64748b",
          marginTop: "16px",
        }}
      >
        <p style={{ margin: 0, fontWeight: "600" }}>
          📋 No hay registros visibles. Favor de sincronizar con el Servidor.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "20px",
        backgroundColor: "#ffffff",
        padding: "16px",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>
          📊 BITÁCORA DE ACTIVOS CONSOLIDADA (CÓMPUTO, TELEFONÍA Y FLOTA
          VEHICULAR)
        </span>
      </div>

      {/* 🟢 BARRA DE DESPLAZAMIENTO AÑADIDA CON CONTROL DE ALTURA MÁXIMA */}
      <div
        style={{
          overflowX: "auto",
          maxHeight: "500px",
          overflowY: "auto",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            textAlign: "left",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#f8fafc",
              zIndex: 1,
            }}
          >
            <tr
              style={{
                borderBottom: "2px solid #cbd5e1",
                color: "#475569",
                fontWeight: "700",
              }}
            >
              <th style={{ padding: "8px" }}>ID Activo</th>
              <th style={{ padding: "8px" }}>Categoría</th>
              <th style={{ padding: "8px" }}>Marca</th>
              <th style={{ padding: "8px" }}>Modelo</th>
              <th style={{ padding: "8px" }}>Usuario Responsable</th>
              <th style={{ padding: "8px", textAlign: "center" }}>
                📍 Reasignar
              </th>
              <th style={{ padding: "8px", textAlign: "center" }}>
                🚨 Incidente
              </th>
              <th style={{ padding: "8px", textAlign: "center" }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {datosReales.map((activo, index) => {
              const idActivo = activo.id_activo || "";
              const categoria = activo.categoria || "Genérico";
              const marca = activo.marca || "Desconocida";
              const modelo = activo.modelo || "Genérico";
              let estatusReal = activo.status
                ? activo.status.trim()
                : "inactivo";

              const esCelular =
                idActivo.startsWith("M") ||
                categoria.toLowerCase().includes("celular");
              if (esCelular && estatusReal.toLowerCase() === "robado") {
                estatusReal = "inactivo";
              }

              // Mapeo preciso del nombre del colaborador
              let usuarioAsignado = "Sin Asignar";
              let tieneAsignacion = false;
              if (
                activo.empleado_nombre &&
                activo.empleado_nombre.trim() !== "" &&
                activo.empleado_nombre !== "None"
              ) {
                usuarioAsignado =
                  `${activo.empleado_nombre} ${activo.empleado_paterno || ""}`.trim();
                tieneAsignacion = true;
              }

              const estatusSelector = obtenerEstatusSelector(
                estatusReal,
                tieneAsignacion,
              );

              return (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor:
                      estatusReal.toLowerCase() === "inactivo" && esCelular
                        ? "#fff5f5"
                        : "transparent",
                  }}
                >
                  <td style={{ padding: "10px 8px", fontWeight: "700" }}>
                    {idActivo}
                  </td>
                  <td style={{ padding: "10px 8px", fontWeight: "600" }}>
                    {categoria}
                  </td>
                  <td style={{ padding: "10px 8px" }}>{marca}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <div style={{ fontWeight: "600" }}>{modelo}</div>
                    {/* 🚐 Si el activo es un Vehículo, inyectamos su placa de circulación abajo con estilo institucional */}
                    {String(categoria).toLowerCase() === "vehiculo" &&
                      activo.serie && (
                        <div style={{ marginTop: "4px" }}>
                          <span
                            style={{
                              padding: "2px 6px",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontFamily: "monospace",
                              fontWeight: "700",
                              display: "inline-block",
                            }}
                          >
                            📇 Placas: {activo.serie}
                          </span>
                        </div>
                      )}
                  </td>

                  <td
                    style={{
                      padding: "10px 8px",
                      color: !tieneAsignacion ? "#94a3b8" : "#0284c7",
                      fontWeight: "500",
                    }}
                  >
                    👤 {usuarioAsignado}
                  </td>

                  {/* 🔄 COLUMNA INTERACTIVA: TEXTO CAMBIA EN AUTOMÁTICO SEGÚN ASIGNACIÓN */}
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <select
                      onChange={(e) =>
                        handleCambiarEmpleadoFila(idActivo, e.target.value)
                      }
                      disabled={
                        procesandoId === idActivo ||
                        (estatusReal.toLowerCase() === "inactivo" && esCelular)
                      }
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontWeight: "500",
                        color: "#334155",
                      }}
                      defaultValue=""
                    >
                      {/* Texto reactivo solicitado en tu ejemplo */}
                      <option value="" disabled>
                        {tieneAsignacion
                          ? "-- Modificar Asignación --"
                          : "-- Asignación --"}
                      </option>
                      {tieneAsignacion && (
                        <option value="">
                          👤 [Liberar Activo] Poner Sin Asignar
                        </option>
                      )}
                      {empleados.map((emp) => (
                        <option key={emp.id_empleado} value={emp.id_empleado}>
                          👤 {emp.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    {!(
                      estatusReal.toLowerCase() === "inactivo" && esCelular
                    ) ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleReportarRobo(
                            idActivo,
                            categoria,
                            marca,
                            modelo,
                            usuarioAsignado,
                          )
                        }
                        disabled={procesandoId === idActivo}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          backgroundColor: "#dc3545",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "700",
                        }}
                      >
                        🚨 Reportar Robo
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#dc2626",
                          fontWeight: "800",
                          fontStyle: "italic",
                        }}
                      >
                        ⚠️ Reportado
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <select
                      aria-label={`Cambiar estatus de ${idActivo}`}
                      value={estatusSelector}
                      onChange={(e) =>
                        handleActualizarEstatus(
                          idActivo,
                          categoria,
                          e.target.value,
                        )
                      }
                      disabled={procesandoId === idActivo}
                      style={{
                        maxWidth: "205px",
                        padding: "5px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "700",
                        border: "1px solid #cbd5e1",
                        cursor: procesandoId === idActivo ? "wait" : "pointer",
                        ...ESTILOS_ESTATUS[estatusSelector],
                      }}
                    >
                      {OPCIONES_ESTATUS.map((estatus) => (
                        <option
                          key={estatus}
                          value={estatus}
                          disabled={estatus === "ASIGNADO" && !tieneAsignacion}
                          style={ESTILOS_ESTATUS[estatus]}
                        >
                          {estatus}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaInventario;
