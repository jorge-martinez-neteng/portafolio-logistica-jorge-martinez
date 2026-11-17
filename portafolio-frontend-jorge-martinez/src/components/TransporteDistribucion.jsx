// TransporteDistribucion.jsx
import { useState, useEffect, useRef } from "react";
import { API_URL } from "../config/api";

function TransporteDistribucion() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tabPanel, setTabPanel] = useState("vehiculos"); // "vehiculos" | "visitas" | "eventos"

  const [visitasData, setVisitasData] = useState({
    count: 0,
    total_pages: 1,
    results: [],
    all_markers: [],
  });
  const [vehiculosData, setVehiculosData] = useState([]);
  const [eventosData, setEventosData] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersGroupRef = useRef(null);

  // Cargar visitas, vehículos y eventos en vivo
  const cargarDatosTransporte = async () => {
    setLoading(true);
    try {
      const [resVis, resVeh, resEve] = await Promise.all([
        fetch(
          `${API_URL}/transporte/visitas?fecha=${fecha}&search=${encodeURIComponent(search)}&page=${pagina}&limit=10`,
        ),
        fetch(`${API_URL}/transporte/vehiculos?fecha=${fecha}`),
        fetch(`${API_URL}/transporte/eventos?fecha=${fecha}`),
      ]);

      const dataVis = await resVis.json();
      const dataVeh = await resVeh.json();
      const dataEve = await resEve.json();

      if (dataVis.status === "success") setVisitasData(dataVis);
      if (dataVeh.status === "success")
        setVehiculosData(dataVeh.vehiculos || []);
      if (dataEve.status === "success") setEventosData(dataEve.eventos || []);
    } catch (error) {
      console.error("Error al cargar datos de transporte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosTransporte();
  }, [fecha, search, pagina]);

  // Inicializar Leaflet Map
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.L &&
      mapContainerRef.current &&
      !leafletMapRef.current
    ) {
      const map = window.L.map(mapContainerRef.current).setView(
        [19.4326, -99.1332],
        11,
      );
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      markersGroupRef.current = window.L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Actualizar marcadores reales en Leaflet
  useEffect(() => {
    if (!leafletMapRef.current || !markersGroupRef.current || !window.L) return;

    markersGroupRef.current.clearLayers();
    const markers = visitasData.all_markers || [];
    const bounds = [];

    markers.forEach((v) => {
      const lat = parseFloat(v.latitude);
      const lng = parseFloat(v.longitude);

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        bounds.push([lat, lng]);

        const status = (v.status || "pending").toLowerCase();
        const color =
          status === "completed"
            ? "#28a745"
            : status === "failed"
              ? "#dc3545"
              : "#0284c7";

        const customIcon = window.L.divIcon({
          className: "custom-leaflet-marker",
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = window.L.marker([lat, lng], { icon: customIcon });
        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <strong style="color: #0f172a;">${v.title || "Visita"}</strong><br/>
            <span style="color: #64748b;">📍 ${v.address || "Sin dirección"}</span><br/>
            <span><strong>Conductor:</strong> ${v.driver ? `#${v.driver}` : "N/A"}</span><br/>
            <span><strong>Vehículo:</strong> ${v.vehicle_name || (v.vehicle ? `#${v.vehicle}` : "N/A")}</span><br/>
            <span><strong>Estado:</strong> <span style="color: ${color}; font-weight: bold;">${status.toUpperCase()}</span></span><br/>
            <span><strong>ETA:</strong> ${v.estimated_time_arrival || "N/A"}</span>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersGroupRef.current.addLayer(marker);
      }
    });

    if (bounds.length > 0) {
      leafletMapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [visitasData.all_markers]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "10px",
      }}
    >
      {/* HEADER DE ESTADO SIMPLIROUTE */}
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
          🚚 Monitoreo & Mapa en Tiempo Real (SimpliRoute + Leaflet)
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
          🟢 Enlace Satelital SimpliRoute (GET Solo Lectura)
        </span>
      </div>

      {/* SECCIÓN PRINCIPAL: MAPA (IZQUIERDA) + PANEL DE 3 PESTAÑAS (DERECHA) */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          minHeight: "450px",
          flexWrap: "wrap",
        }}
      >
        {/* MAPA INTERACTIVO LEAFLET */}
        <div
          style={{
            flex: "2 1 500px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            position: "relative",
            minHeight: "450px",
          }}
        >
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%", minHeight: "450px" }}
          ></div>
        </div>
        {/* PANEL LATERAL DE 3 PESTAÑAS */}
        <div
          style={{
            flex: "1 1 320px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* HEADER DE PESTAÑAS */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "8px",
              gap: "6px",
            }}
          >
            <button
              onClick={() => setTabPanel("vehiculos")}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "11px",
                fontWeight: "700",
                border: "none",
                borderRadius: "4px",
                backgroundColor:
                  tabPanel === "vehiculos" ? "#0284c7" : "#f1f5f9",
                color: tabPanel === "vehiculos" ? "#fff" : "#475569",
                cursor: "pointer",
              }}
            >
              🚛 Vehículos
            </button>
            <button
              onClick={() => setTabPanel("visitas")}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "11px",
                fontWeight: "700",
                border: "none",
                borderRadius: "4px",
                backgroundColor: tabPanel === "visitas" ? "#0284c7" : "#f1f5f9",
                color: tabPanel === "visitas" ? "#fff" : "#475569",
                cursor: "pointer",
              }}
            >
              📍 Visitas
            </button>
            <button
              onClick={() => setTabPanel("eventos")}
              style={{
                flex: 1,
                padding: "6px 8px",
                fontSize: "11px",
                fontWeight: "700",
                border: "none",
                borderRadius: "4px",
                backgroundColor: tabPanel === "eventos" ? "#0284c7" : "#f1f5f9",
                color: tabPanel === "eventos" ? "#fff" : "#475569",
                cursor: "pointer",
              }}
            >
              ⚡ Eventos
            </button>
          </div>

          {/* CONTENIDO PESTAÑAS */}
          {tabPanel === "vehiculos" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                overflowY: "auto",
                maxHeight: "380px",
              }}
            >
              {vehiculosData.length === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  Sin vehículos registrados para esta fecha.
                </p>
              ) : (
                vehiculosData.map((v, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      <span>🚛 {v.nombre}</span>
                      <span style={{ color: v.color }}>
                        {v.estado} · {v.progreso}%
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        margin: "4px 0",
                      }}
                    >
                      👤 Conductor: {v.conductor} ({v.visitas_completadas}/
                      {v.total_visitas} visitas)
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${v.progreso}%`,
                          height: "100%",
                          backgroundColor: v.color,
                          transition: "width 0.5s ease",
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tabPanel === "visitas" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                overflowY: "auto",
                maxHeight: "380px",
              }}
            >
              {(visitasData.all_markers || []).length === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  No hay visitas activas en SimpliRoute.
                </p>
              ) : (
                (visitasData.all_markers || []).map((vis, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "700",
                      }}
                    >
                      <span style={{ color: "#0f172a" }}>
                        {vis.title || "Visita"}
                      </span>
                      <span
                        style={{
                          backgroundColor:
                            vis.status === "completed"
                              ? "#dcfce7"
                              : vis.status === "failed"
                                ? "#fee2e2"
                                : "#e0f2fe",
                          color:
                            vis.status === "completed"
                              ? "#166534"
                              : vis.status === "failed"
                                ? "#991b1b"
                                : "#0369a1",
                          padding: "2px 6px",
                          borderRadius: "10px",
                          fontSize: "10px",
                        }}
                      >
                        {vis.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        marginTop: "2px",
                      }}
                    >
                      📍 {vis.address}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tabPanel === "eventos" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                overflowY: "auto",
                maxHeight: "380px",
              }}
            >
              {eventosData.length === 0 ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  Sin eventos registrados en vivo hoy.
                </p>
              ) : (
                eventosData.map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px",
                      backgroundColor: "#f8fafc",
                      borderLeft: `3px solid ${ev.status === "completed" ? "#28a745" : "#dc3545"}`,
                      borderRadius: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <strong style={{ color: "#1e293b" }}>
                      {ev.status === "completed"
                        ? "✅ Entregado"
                        : "❌ Fallido"}
                    </strong>
                    <div style={{ color: "#475569", fontSize: "11px" }}>
                      {ev.titulo} - {ev.driver}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/*
          ======================================================================
          🔒 REGLA CRÍTICA 2: DESPACHADOR DE RUTAS EN LOTE (SOLO LECTURA)
          Comentado todo el bloque del selector y botón de envío para ocultar en la UI
          pero dejándolo intacto y listo para descomentar en el futuro.
          ======================================================================
          <div style={{ padding: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
              ⚡ Despachador de Rutas en Lote (Modo Lectura)
            </span>
            <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
              <select className="form-input-compact" disabled style={{ backgroundColor: "#fff" }}>
                <option value="ZONA_NORTE_1">Despachar Zona Norte / Satélite</option>
                <option value="ZONA_CENTRO_1">Despachar Zona Central / Reforma</option>
              </select>
              <button type="submit" disabled style={{ backgroundColor: "#64748b", color: "#fff", fontWeight: "700", padding: "6px", borderRadius: "4px" }}>
                Optimizar & Enviar (Bloqueado por Permisos GET)
              </button>
            </form>
          </div>
          ======================================================================
          */}
        </div>
      </div>
      {/* TABLA PAGINADA "MIS VISITAS" ABAJO CON FILTRO Y BUSCADOR */}
      <div
        style={{
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
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: "700",
              color: "#1e293b",
              textTransform: "uppercase",
            }}
          >
            📋 Mis Visitas del Día (SimpliRoute Live Table)
          </h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setPagina(1);
              }}
              style={{
                padding: "6px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            />
            <input
              type="text"
              placeholder="🔍 Buscar por guía, cliente o conductor..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagina(1);
              }}
              style={{
                padding: "6px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                fontSize: "12px",
                width: "240px",
              }}
            />
          </div>
        </div>

        {/* TABLA DE VISITAS */}
        <div style={{ overflowX: "auto" }}>
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
                  backgroundColor: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                  color: "#475569",
                }}
              >
                <th style={{ padding: "10px" }}>ID Visita</th>
                <th style={{ padding: "10px" }}>Título / Cliente</th>
                <th style={{ padding: "10px" }}>Dirección</th>
                <th style={{ padding: "10px" }}>Estado</th>
                <th style={{ padding: "10px" }}>Conductor</th>
                <th style={{ padding: "10px" }}>Vehículo</th>
                <th style={{ padding: "10px" }}>ETA / Checkout</th>
              </tr>
            </thead>
            <tbody>
              {visitasData.results.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontStyle: "italic",
                    }}
                  >
                    ℹ️ No se encontraron visitas para la fecha seleccionada (
                    {fecha}).
                  </td>
                </tr>
              ) : (
                visitasData.results.map((v, idx) => {
                  const st = (v.status || "pending").toLowerCase();
                  const badgeBg =
                    st === "completed"
                      ? "#dcfce7"
                      : st === "failed"
                        ? "#fee2e2"
                        : "#e0f2fe";
                  const badgeClr =
                    st === "completed"
                      ? "#166534"
                      : st === "failed"
                        ? "#991b1b"
                        : "#0369a1";

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px", fontWeight: "600" }}>
                        #{v.id}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          fontWeight: "600",
                          color: "#0f172a",
                        }}
                      >
                        {v.title || "Visita"}
                      </td>
                      <td style={{ padding: "10px", color: "#475569" }}>
                        {v.address}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span
                          style={{
                            backgroundColor: badgeBg,
                            color: badgeClr,
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontWeight: "700",
                            fontSize: "11px",
                          }}
                        >
                          {st.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        {v.driver ? `#${v.driver}` : "No asignado"}
                      </td>
                      <td style={{ padding: "10px" }}>
                        {v.vehicle_name ||
                          (v.vehicle ? `#${v.vehicle}` : "No asignado")}
                      </td>
                      <td style={{ padding: "10px", color: "#64748b" }}>
                        {v.checkout_time ||
                          v.estimated_time_arrival ||
                          "Sin horario"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "14px",
            paddingTop: "10px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Total Visitas: <strong>{visitasData.count}</strong> | Página{" "}
            {pagina} de {visitasData.total_pages || 1}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={pagina <= 1}
              onClick={() => setPagina(pagina - 1)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                backgroundColor: pagina <= 1 ? "#f1f5f9" : "#fff",
                cursor: pagina <= 1 ? "not-allowed" : "pointer",
              }}
            >
              ⬅️ Anterior
            </button>
            <button
              disabled={pagina >= (visitasData.total_pages || 1)}
              onClick={() => setPagina(pagina + 1)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                backgroundColor:
                  pagina >= (visitasData.total_pages || 1) ? "#f1f5f9" : "#fff",
                cursor:
                  pagina >= (visitasData.total_pages || 1)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Siguiente ➡️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransporteDistribucion;
