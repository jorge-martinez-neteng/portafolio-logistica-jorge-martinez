import React from "react";

function TablaInventario({ datosReales }) {
  // ℹ️ Evaluamos: Si no han presionado el botón o la tabla en SQL Server está vacía,
  // pintamos una fila informativa elegante en lugar de romper el diseño.
  const tieneDatos = datosReales && datosReales.length > 0;

  return (
    <div
      style={{
        marginTop: "24px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <h2
        style={{
          color: "var(--primary-color)",
          fontSize: "18px",
          marginBottom: "16px",
        }}
      >
        Monitoreo de Infraestructura Remota
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid var(--border-color)",
              color: "var(--text-muted)",
            }}
          >
            <th style={{ padding: "12px 8px" }}>ID</th>
            <th style={{ padding: "12px 8px" }}>Categoría / Campo</th>
            <th style={{ padding: "12px 8px" }}>Descripción del Registro</th>
            <th style={{ padding: "12px 8px" }}>Estatus de Red</th>
          </tr>
        </thead>
        <tbody>
          {tieneDatos ? (
            // 🔄 Si el servidor regresa filas, el mapa las dibuja automáticamente aquí
            datosReales.map((item, index) => (
              <tr
                key={index}
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <td style={{ padding: "12px 8px", fontWeight: "bold" }}>
                  {index + 1}
                </td>
                <td style={{ padding: "12px 8px" }}>Equipo Cómputo Real</td>
                <td style={{ padding: "12px 8px" }}>{JSON.stringify(item)}</td>
                <td style={{ padding: "12px 8px" }}>
                  <span
                    style={{
                      backgroundColor: "#e2f5ec",
                      color: "#0d9488",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Sincronizado
                  </span>
                </td>
              </tr>
            ))
          ) : (
            // 💤 Estado de espera si la base de datos no tiene información
            <tr>
              <td
                colSpan="4"
                style={{
                  padding: "24px 8px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                No hay registros reales en la tabla 'Equipo_Computo'. Presiona
                el botón superior para verificar conectividad.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TablaInventario;
