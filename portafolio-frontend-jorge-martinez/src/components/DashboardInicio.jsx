// DashboardInicio.jsx
import { useState, useEffect } from "react";
import { API_URL } from "../config/api";

function DashboardInicio() {
  const [metricas, setMetricas] = useState({
    primer_intento: 0,
    total_visitas: 0,
    visitas_completadas: 0,
    visitas_fallidas: 0,
    visitas_pendientes: 0,
    vehiculos_ruta: 0,
    vehiculos_taller: 0,
    vehiculos_disponibles: 0,
    equipos_disponibles: 0,
    equipos_en_uso: 0,
    lineas_sim_activas: 0,
    proceso_entregas: [],
    paquetes_por_cliente: [],
    rendimiento_operadores: [],
  });

  const [loading, setLoading] = useState(true);
  const [errorRed, setErrorRed] = useState(false);

  // 🔄 FUNCIÓN MAESTRA: Consume los datos calculados en vivo por FastAPI
  const cargarMetricasLive = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/live-metrics`);
      const resultado = await response.json();

      if (resultado.status === "success") {
        setMetricas(resultado.data);
        setErrorRed(false);
      } else {
        console.error("Error devuelto por el servidor:", resultado.message);
      }
    } catch (error) {
      console.error("Error crítico de comunicación con el backend:", error);
      setErrorRed(true);
    } finally {
      setLoading(false);
    }
  };

  // 📡 ACTIVACIÓN DEL POLLING EN TIEMPO REAL (Cada 20 segundos)
  useEffect(() => {
    document.title = "YGO - Panel de Control Logístico";

    // Carga inicial inmediata
    cargarMetricasLive();

    // Ciclo de actualización automatizado en segundo plano
    const temporizadorLive = setInterval(() => {
      cargarMetricasLive();
    }, 20000); // 20 segundos óptimos de sincronización satelital

    // Limpieza preventiva de memoria al cambiar de pestaña
    return () => clearInterval(temporizadorLive);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          color: "#0284c7",
          fontWeight: "700",
          fontSize: "14px",
          textAlign: "center",
        }}
      >
        🔄 Inicializando enlace satelital con SimpliRoute y SQL Server...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "10px",
      }}
    >
      {/* ALERTA DE PÉRDIDA DE CONEXIÓN */}
      {errorRed && (
        <div
          style={{
            padding: "10px 14px",
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            border: "1px solid #fecaca",
          }}
        >
          ⚠️ Alerta de Suministro: Pérdida de comunicación local con el Backend
          (Port 8000). Los datos en pantalla reflejan el último estado
          capturado.
        </div>
      )}

      {/* SECCIÓN SUPERIOR DE INDICADORES DE PRODUCCIÓN */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* GRÁFICO 1: TACÓMETRO VECTORIAL SVG REPARADO */}
        <div
          style={{
            flex: "1 1 280px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            🎯 Progreso Real de Visitas (SimpliRoute)
          </span>
          <div
            style={{
              position: "relative",
              width: "160px",
              height: "90px",
              margin: "12px auto 0 auto",
            }}
          >
            <svg width="160" height="100" viewBox="0 0 160 100">
              <path
                d="M 10 90 A 70 70 0 0 1 150 90"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 10 90 A 70 70 0 0 1 150 90"
                fill="none"
                stroke="#0284c7"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="220"
                strokeDashoffset={
                  220 - (220 * (metricas.primer_intento || 0)) / 100
                }
                style={{ transition: "stroke-dashoffset 0.6s ease-in-out" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#1e293b",
                }}
              >
                {metricas.primer_intento}%
              </span>
              <p
                style={{
                  margin: "2px 0 0 0",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#28a745",
                }}
              >
                ● Sincronizado Satelital
              </p>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: FLOTA VEHICULAR */}
        <div
          style={{
            flex: "1 1 280px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            🚚 Estado de Flota Vehicular (SQL Server)
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              textAlign: "center",
            }}
          >
            <div>
              <strong
                style={{ fontSize: "22px", color: "#28a745", display: "block" }}
              >
                {metricas.vehiculos_ruta || 0}
              </strong>
              <small
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                En Ruta
              </small>
            </div>
            <div>
              <strong
                style={{ fontSize: "22px", color: "#dc3545", display: "block" }}
              >
                {metricas.vehiculos_taller || 0}
              </strong>
              <small
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                En Taller
              </small>
            </div>
            <div>
              <strong
                style={{ fontSize: "22px", color: "#0284c7", display: "block" }}
              >
                {metricas.vehiculos_disponibles || 0}
              </strong>
              <small
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                Disponibles
              </small>
            </div>
          </div>
        </div>

        {/* GRÁFICO 3: INVENTARIO DE TI */}
        <div
          style={{
            flex: "1 1 280px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            💻 Inventario TI & Dispositivos (SQL Server)
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              textAlign: "center",
            }}
          >
            <div>
              <strong
                style={{ fontSize: "22px", color: "#0284c7", display: "block" }}
              >
                {metricas.equipos_disponibles || 0}
              </strong>
              <small
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                Libres
              </small>
            </div>
            <div>
              <strong
                style={{ fontSize: "22px", color: "#16a34a", display: "block" }}
              >
                {metricas.equipos_en_uso || 0}
              </strong>
              <small
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                En Uso
              </small>
            </div>
            <div>
              <strong
                style={{ fontSize: "22px", color: "#9333ea", display: "block" }}
              >
                {metricas.lineas_sim_activas || 0}
              </strong>
              <small
                style={{
                  fontSize: "11px",
                  color: "#475569",
                  fontWeight: "600",
                }}
              >
                SIM / Cel
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN POWER BI: GRÁFICAS E INFORMES DE ANALÍTICA DESDE SQL SERVER */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {/* POWER BI CHART 1: PAQUETES POR CLIENTE */}
        <div
          style={{
            flex: "1 1 450px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h4
            style={{
              margin: "0 0 14px 0",
              fontSize: "13px",
              fontWeight: "700",
              color: "#1e293b",
              textTransform: "uppercase",
            }}
          >
            📊 Suma de Paquetes por Cliente (Power BI Datamart SQL Server)
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {!metricas.paquetes_por_cliente ||
            metricas.paquetes_por_cliente.length === 0 ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                Sin registros de paquetes por cliente en SQL Server.
              </p>
            ) : (
              metricas.paquetes_por_cliente.map((item, idx) => {
                const maxPkt = Math.max(
                  ...metricas.paquetes_por_cliente.map((p) => p.paquetes),
                  1,
                );
                const pct = Math.min((item.paquetes / maxPkt) * 100, 100);
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#334155",
                      }}
                    >
                      <span>🏢 {item.cliente}</span>
                      <strong style={{ color: "#0284c7" }}>
                        {item.paquetes} pkts
                      </strong>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "10px",
                        backgroundColor: "#f1f5f9",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          borderRadius: "4px",
                          transition: "width 0.5s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* POWER BI CHART 2: RENDIMIENTO POR OPERADOR */}
        <div
          style={{
            flex: "1 1 450px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h4
            style={{
              margin: "0 0 14px 0",
              fontSize: "13px",
              fontWeight: "700",
              color: "#1e293b",
              textTransform: "uppercase",
            }}
          >
            👷 Rendimiento por Operador / Destinatario (SQL Server)
          </h4>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {!metricas.rendimiento_operadores ||
            metricas.rendimiento_operadores.length === 0 ? (
              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                Sin registros de operadores en SQL Server.
              </p>
            ) : (
              metricas.rendimiento_operadores.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ fontWeight: "600", color: "#1e293b" }}>
                    👤 {item.operador}
                  </span>
                  <span
                    style={{
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      padding: "3px 8px",
                      borderRadius: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {item.ordenes} Órdenes
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ESTADO DE CARGA Y SURTIDO LOGÍSTICO */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "16px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
        }}
      >
        <h4
          style={{
            margin: "0 0 16px 0",
            fontSize: "13px",
            fontWeight: "700",
            color: "#1e293b",
            textTransform: "uppercase",
          }}
        >
          📋 Recuento de Órdenes por Estado Logístico (SQL Server Real)
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {!metricas.proceso_entregas ||
          metricas.proceso_entregas.length === 0 ? (
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                fontStyle: "italic",
                margin: 0,
                padding: "10px",
                backgroundColor: "#f8fafc",
                borderRadius: "4px",
                border: "1px solid #f1f5f9",
              }}
            >
              ℹ️ Mesa de Control: No hay paquetes ingresados por el pipeline el
              día de hoy en SQL Server.
            </p>
          ) : (
            metricas.proceso_entregas.map((item, idx) => (
              <div
                key={idx}
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#334155",
                  }}
                >
                  <span>
                    📦 Estatus Logístico:{" "}
                    <strong style={{ color: "#0284c7" }}>{item.estado}</strong>
                  </span>
                  <span>{item.cantidad} Guías unificadas</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(item.cantidad * 8, 100)}%`,
                      height: "100%",
                      backgroundColor:
                        item.estado === "En Ruta"
                          ? "#28a745"
                          : item.estado === "En Bodega"
                            ? "#0284c7"
                            : "#64748b",
                      transition: "width 0.5s ease",
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardInicio;
