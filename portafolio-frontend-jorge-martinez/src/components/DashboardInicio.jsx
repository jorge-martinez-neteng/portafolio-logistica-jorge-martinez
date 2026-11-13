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

        {/* GRÁFICO 2: INDICADORES EN TIEMPO REAL DE FLOTA Y TI */}
        <div
          style={{
            flex: "1 1 320px",
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
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "12px",
            }}
          >
            🚐 Estado de Infraestructura y Flota Vehicular
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  fontWeight: "600",
                }}
              >
                <span style={{ color: "#334155" }}>
                  Unidades Activas (En Ruta)
                </span>
                <span style={{ color: "#166534", fontWeight: "700" }}>
                  {metricas.vehiculos_ruta} Unidades
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min((metricas.vehiculos_ruta || 0) * 8, 100)}%`,
                    height: "100%",
                    backgroundColor: "#28a745",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  fontWeight: "600",
                }}
              >
                <span style={{ color: "#334155" }}>
                  Unidades Fuera de Servicio (Taller)
                </span>
                <span style={{ color: "#1e40af", fontWeight: "700" }}>
                  {metricas.vehiculos_taller} Unidades
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#f1f5f9",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min((metricas.vehiculos_taller || 0) * 8, 100)}%`,
                    height: "100%",
                    backgroundColor: "#0284c7",
                    borderRadius: "4px",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO 3: ACTIVOS DE TI PATRIMONIALES (CONECTADO A TU VALOR REAL) */}
        <div
          style={{
            flex: "1 1 240px",
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
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "12px",
            }}
          >
            💻 Inventario de Cómputo e TI
          </span>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              justifyContent: "space-around",
              marginTop: "14px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "28px",
                  fontWeight: "800",
                  color: "#166534",
                }}
              >
                {metricas.equipos_disponibles}
              </span>
              <small
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Disponibles
              </small>
            </div>
            <div
              style={{
                width: "1px",
                height: "42px",
                backgroundColor: "#cbd5e1",
              }}
            ></div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "28px",
                  fontWeight: "800",
                  color: "#0284c7",
                }}
              >
                {metricas.equipos_en_uso}
              </span>
              <small
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#64748b",
                  textTransform: "uppercase",
                }}
              >
                Asignados
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 4: BARRAS DINÁMICAS (AVANCE DE SURTIDO EN LA BODEGA CENTRAL) */}
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
            letterSpacing: "0.5px",
          }}
        >
          📋 Estado de Carga y Surtido de Órdenes Delivery (SQL Server Real)
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
                    📦 Estatus Logístico Base:{" "}
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
                      width: `${Math.min(item.cantidad * 6, 100)}%`,
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
