import { useState, useEffect } from "react";

function FormulariosPersonal({ onOperacionExitosa }) {
  // CONTROL DE VISIBILIDAD DE LA CONSOLA DE RECURSOS HUMANOS
  const [consolaDesplegada, setConsolaDesplegada] = useState(false);
  const [seccionInterna, setSeccionInterna] = useState("nuevo");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [empleados, setEmpleados] = useState([]);

  // ESTADOS DEL FORMULARIO 1: REGISTRAR COLABORADOR NUEVO
  const [nombre, setNombre] = useState("");
  const [apPaterno, setApPaterno] = useState("");
  const [apMaterno, setApMaterno] = useState("");
  const [cargo, setCargo] = useState("");

  // 🎛️ VARIABLES ASOCIADAS PARA EL MÓDULO DE EVALUACIÓN SEMÁFORO VARCHAR
  const [empleadoEvaluar, setEmpleadoEvaluar] = useState("");
  const [valConducta, setValConducta] = useState("🟢 Excelente / Cumple");
  const [valValores, setValValores] = useState("🟢 Excelente / Cumple");
  const [obsEvaluacion, setObsEvaluacion] = useState("");

  // 📅 VARIABLES DE AUDITORÍA LABORAL INTEGRADAS (FECHAS DE CONTRATO)
  const [inicioContrato, setInicioContrato] = useState("");
  const [terminoContrato, setTerminoContrato] = useState("");

  // VARIABLES DE SELECCIÓN EXCLUSIVAS PARA MENÚS DESPLEGABLES
  const [idComputoOpcional, setIdComputoOpcional] = useState("");
  const [idCelularOpcional, setIdCelularOpcional] = useState("");
  const [idVehiculoOpcional, setIdVehiculoOpcional] = useState("");

  // ARREGLOS DE CONTROL INDEPENDIENTES PARA DISPOSITIVOS DISPONIBLES Y OPERATIVOS EN ALMACÉN
  const [computoDisponibles, setComputoDisponibles] = useState([]);
  const [celularesDisponibles, setCelularesDisponibles] = useState([]);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);

  // ESTADOS DEL FORMULARIO 2: OFFBOARDING / AUDITORÍA DE BAJA
  const [idEmpleadoBaja, setIdEmpleadoBaja] = useState("");
  const [activosBajoResguardo, setActivosBajoResguardo] = useState([]);
  const [mostrarAuditoria, setMostrarAuditoria] = useState(false);

  // 🔍 LOGÍSTICA SENIOR: Consultas 100% aisladas e independientes por cada tipo de herramienta
  const cargarCatalogosRHIndependientes = async () => {
    try {
      // A. Cargar catálogo general de operadores activos para bajas
      const resEmp = await fetch(
        "http://localhost:8000/api/empleados-lista-completa",
      );
      const dataEmp = await resEmp.json();
      if (dataEmp.status === "success") setEmpleados(dataEmp.data || []);

      // B. Casilla Cómputo aislada (Solo disponibles y operativos)
      const resComp = await fetch(
        "http://localhost:8000/api/computo-disponibles",
      );
      const dataComp = await resComp.json();
      if (dataComp.status === "success")
        setComputoDisponibles(dataComp.data || []);

      // C. Casilla Celulares aislada (Solo disponibles, IMEI activo y no robados)
      const resCel = await fetch(
        "http://localhost:8000/api/celulares-disponibles",
      );
      const dataCel = await resCel.json();
      if (dataCel.status === "success")
        setCelularesDisponibles(dataCel.data || []);

      // D. Casilla Vehículos aislada (Solo disponibles y operativos en almacén)
      const resVeh = await fetch(
        "http://localhost:8000/api/vehiculos-disponibles",
      );
      const dataVeh = await resVeh.json();
      if (dataVeh.status === "success")
        setVehiculosDisponibles(dataVeh.data || []);
    } catch (error) {
      console.error("Error al sincronizar canales de inventario libre:", error);
    }
  };

  useEffect(() => {
    cargarCatalogosRHIndependientes();
  }, []);
  // 📄 FUNCIÓN DE INGENIERÍA: Generar y descargar Carta Responsiva Institucional YGO en formato Word (.doc)
  const generarDocumentoResponsivaWord = (
    nombreCompleto,
    cargoColaborador,
    idComp,
    idCel,
    idVeh,
  ) => {
    const fechaActual = new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Buscar detalles técnicos de los activos asignados para incrustarlos en la responsiva
    const compDetalle = computoDisponibles.find((a) => a.ID_Equipo === idComp);
    const celDetalle = celularesDisponibles.find((a) => a.ID_Celular === idCel);
    const vehDetalle = vehiculosDisponibles.find(
      (a) => a.ID_Vehiculo === idVeh,
    );

    const contenidoPlantilla = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://w3.org'>
      <head><title>Carta Responsiva de Asignación de Activos</title>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.5; padding: 40px; color: #0f172a; }
        .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 8px; margin-bottom: 20pt; }
        .title { font-size: 14.0pt; font-weight: bold; color: #1e293b; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 9.0pt; color: #64748b; margin-top: 4px; font-weight: bold; }
        .meta-table { width: 100%; border-collapse: collapse; margin-top: 15pt; margin-bottom: 15pt; }
        .meta-table td { padding: 6px; border: 1px solid #cbd5e1; font-size: 9.5pt; }
        .section-title { font-size: 11.0pt; font-weight: bold; color: #0284c7; border-bottom: 1px solid #0284c7; margin-top: 18pt; padding-bottom: 2px; margin-bottom: 8pt; }
        .body-text { font-size: 9.5pt; text-align: justify; margin-bottom: 10pt; text-indent: 20pt; }
      </style>
      </head>
      <body>
        <div class='header'>
          <p class='title'>CARTA RESPONSIVA DE ASIGNACIÓN DE HERRAMIENTAS</p>
          <p class='subtitle'>SISTEMA CENTRAL DE ADMINISTRACIÓN Y CONTROL DE INVENTARIOS — YGO</p>
        </div>

        <p style='text-align: right; font-size: 9.5pt;'><strong>Fecha de Emisión:</strong> Edo. de México, a ${fechaActual}</p>

        <div class='section-title'>1. DATOS DEL COLABORADOR RESPONSABLE</div>
        <table class='meta-table'>
          <tr>
            <td style='background-color: #f8fafc; width: 25%; font-weight: bold;'>Nombre Completo:</td>
            <td>${nombreCompleto}</td>
            <td style='background-color: #f8fafc; width: 25%; font-weight: bold;'>Puesto / Cargo:</td>
            <td>${cargoColaborador}</td>
          </tr>
        </table>

        <div class='section-title'>2. DETALLE DE HERRAMIENTAS CORPORATIVAS RESGUARDADAS</div>
        <table class='meta-table'>
          <tr style='background-color: #f8fafc; font-weight: bold;'>
            <td style='width: 20%;'>Tipo de Activo</td>
            <td style='width: 20%;'>ID Asignado</td>
            <td style='width: 30%;'>Marca / Modelo</td>
            <td style='width: 30%;'>Identificador (Serie / Placas)</td>
          </tr>
          ${idComp ? `<tr><td>💻 Cómputo</td><td><strong>${idComp}</strong></td><td>${compDetalle?.Marca || "N/A"} ${compDetalle?.Modelo || ""}</td><td>${compDetalle?.Serie || "S/N"}</td></tr>` : ""}
          ${idCel ? `<tr><td>📱 Celular</td><td><strong>${idCel}</strong></td><td>${celDetalle?.Marca || "N/A"} ${celDetalle?.Modelo || ""}</td><td>${celDetalle?.Serie || "S/N"}</td></tr>` : ""}
          ${idVeh ? `<tr><td>🚐 Vehículo</td><td><strong>${idVeh}</strong></td><td>${vehDetalle?.Marca || "N/A"} ${vehDetalle?.Modelo || ""}</td><td>${vehDetalle?.Placas || "S/P"}</td></tr>` : ""}
        </table>

        <div class='section-title'>3. CLÁUSULAS DE RESGUARDO Y OBLIGACIONES JURÍDICAS</div>
        <p class='body-text'><strong>PRIMERA. ASIGNACIÓN Y USO:</strong> El colaborador reconoce haber recibido en perfectas condiciones operativas y de conservación las herramientas detalladas en el apartado anterior, comprometiéndose a utilizarlas de manera exclusiva para el desempeño de sus funciones y actividades laborales encomendadas por la empresa.</p>
        <p class='body-text'><strong>SEGUNDA. CUIDADO Y RESGUARDO:</strong> Es obligación estricta del resguardatario velar por la seguridad física, mantenimiento preventivo y buen uso de los activos asignados. En caso de daño por negligencia, pérdida o extravío imputable a un descuido, el empleado autoriza que los costos de reparación o reposición sean evaluados por la mesa de control de TI y la gerencia jurídica.</p>
        <p class='body-text'><strong>TERCERA. DEVOLUCIÓN DE MATERIALES:</strong> Al término de la relación laboral, o bien cuando la empresa así lo requiera, el trabajador se obliga a realizar la entrega inmediata de los materiales en las mismas condiciones en las que le fueron suministrados, salvo el desgaste natural por su uso operativo ordinario.</p>

        <br/><br/><br/>
        <table width='100%' cellspacing='0' style='margin-top: 40px; border: none;'>
          <tr>
            <td align='center' style='width: 50%; border: none; border-top: 1px solid #000; padding-top: 6px; font-size: 9.5pt;'><strong>Firma de Conformidad</strong><br/>Colaborador Resguardatario</td>
            <td style='width: 10%; border: none;'></td>
            <td align='center' style='width: 40%; border: none; border-top: 1px solid #000; padding-top: 6px; font-size: 9.5pt;'><strong>Validación de Entrega</strong><br/>Mesa de Control YGO</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + contenidoPlantilla], {
      type: "application/msword",
    });
    const urlDescarga = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = urlDescarga;
    link.download = `Carta_Responsiva_YGO_${nombreCompleto.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlDescarga);
  };

  const handleAgregarEmpleado = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: "" });
    setLoading(true);

    const nombreCompleto =
      `${nombre.trim()} ${apPaterno.trim()} ${apMaterno.trim()}`.trim();

    try {
      const response = await fetch(
        "http://localhost:8000/api/empleados/nuevo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            ap_paterno: apPaterno.trim(),
            ap_materno: apMaterno.trim(),
            cargo: cargo.trim(),
            id_computo_opcional: idComputoOpcional || null,
            id_celular_opcional: idCelularOpcional || null,
            id_vehiculo_opcional: idVehiculoOpcional || null,
            // 🔑 Nuevos campos mapeados de forma nativa hacia FastAPI y SQL Server
            inicio_contrato: inicioContrato || null,
            termino_contrato: terminoContrato || null,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      setMensaje({ texto: data.message, tipo: "success" });

      // 🔄 Descarga automática de la Carta Responsiva si se asignó al menos una herramienta
      if (idComputoOpcional || idCelularOpcional || idVehiculoOpcional) {
        generarDocumentoResponsivaWord(
          nombreCompleto,
          cargo.trim(),
          idComputoOpcional,
          idCelularOpcional,
          idVehiculoOpcional,
        );
      }

      if (onOperacionExitosa) onOperacionExitosa();
      cargarCatalogosRHIndependientes();

      setNombre("");
      setApPaterno("");
      setApMaterno("");
      setCargo("");
      setIdComputoOpcional("");
      setIdCelularOpcional("");
      setIdVehiculoOpcional("");
      // 🧼 Limpieza de campos de fecha YGO
      setInicioContrato("");
      setTerminoContrato("");
    } catch (err) {
      setMensaje({
        texto: err.message || "Error de comunicación.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarCondicionActivoMatriz = (idActivo, nuevaCondicion) => {
    setActivosBajoResguardo((prev) =>
      prev.map((item) =>
        item.id_activo === idActivo
          ? { ...item, condicion_entrega: nuevaCondicion }
          : item,
      ),
    );
  };
  // 3. PETICIÓN HTTP: PROCESAR BAJA LABORAL Y LIBERAR MATERIALES
  const handleBajaEmpleado = async (e) => {
    e.preventDefault();
    if (!idEmpleadoBaja) {
      alert("⚠️ Por favor, selecciona un colaborador del listado.");
      return;
    }

    setMensaje({ texto: "", tipo: "" });
    const empleadoSeleccionado = empleados.find(
      (emp) => emp.id_empleado === idEmpleadoBaja,
    );
    const nombreTexto = empleadoSeleccionado
      ? `"${empleadoSeleccionado.nombre_completo}"`
      : idEmpleadoBaja;

    const confirmar = window.confirm(
      `⚠️ ¿Estás absolutamente seguro de dar de baja al colaborador ${nombreTexto}?`,
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/empleados/eliminar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_empleado: idEmpleadoBaja,
            activos_devueltos: activosBajoResguardo,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      setMensaje({ texto: data.message, tipo: "success" });

      if (onOperacionExitosa) onOperacionExitosa();
      await cargarCatalogosRHIndependientes();

      setIdEmpleadoBaja("");
      setActivosBajoResguardo([]);
      setMostrarAuditoria(false);
    } catch (err) {
      setMensaje({
        texto: err.message || "Error al procesar la baja corporativa.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================================================
  // 📋 CONSOLA AVANZADA: DESCARGA DE REPORTE MAESTRO DE INVENTARIO Y NÓMINA
  // ======================================================================
  const handleDescargarReporteMaestro = async () => {
    setLoading(true);
    setMensaje({ texto: "", tipo: "" });
    try {
      const response = await fetch(
        "http://localhost:8000/api/recursos-humanos/reporte-maestro",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();

      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      const registros = data.data || [];
      if (registros.length === 0) {
        alert(
          "📋 No se encontraron registros de colaboradores activos para exportar.",
        );
        return;
      }

      // Estructura densa con todos los datos posibles unificados solicitados en tu diseño
      let excelRows = [
        [
          "ID Empleado",
          "Colaborador / Operador",
          "Puesto / Cargo",
          "Estatus Laboral",
          "ID Celular",
          "Detalle Celular",
          "IMEI Celular",
          "Número de Teléfono",
          "ID Cómputo",
          "Detalle Cómputo",
          "ID Vehículo",
          "Detalle Vehículo / Flota",
          "Ubicación Asignada Unidad",
        ],
      ];

      registros.forEach((item) => {
        excelRows.push([
          item.ID_Empleado,
          `${item.Empleado_Nombre || ""} ${item.Ap_Paterno || ""} ${item.Ap_Materno || ""}`.trim(),
          item.Cargo,
          item.Estatus_Empleado,
          item.ID_Celular,
          `${item.Celular_Marca || ""} ${item.Celular_Modelo || ""}`.trim(),
          item.Celular_Serie || item.IMEI,
          item.Numero_Telefonico,
          item.ID_Equipo || "Sin Computadora",
          `${item.Computo_Marca || ""} ${item.Computo_Modelo || ""}`.trim(),
          item.ID_Vehiculo || "Sin Vehículo",
          `${item.Vehiculo_Marca || ""} ${item.Vehiculo_Modelo || ""}`.trim(),
          item.Vehiculo_Ubicacion || "N/A",
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
        `Reporte_Auditoria_Maestra_RH_YGO_${new Date().getFullYear()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMensaje({
        texto:
          "✔️ Reporte maestro patrimonial generado y descargado con éxito.",
        tipo: "success",
      });
    } catch (err) {
      setMensaje({
        texto: `❌ Error al procesar el reporte: ${err.message}`,
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarEvaluacionSemaforo = async (e) => {
    e.preventDefault();
    if (!empleadoEvaluar) {
      alert("⚠️ Selecciona un colaborador.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/recursos-humanos/evaluar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_empleado: empleadoEvaluar,
            calificacion_conducta: valConducta,
            calificacion_valores: valValores,
            observaciones: obsEvaluacion,
          }),
        },
      );
      const data = await response.json();
      if (data.status === "success") {
        setMensaje({ texto: data.message, tipo: "success" });
        setEmpleadoEvaluar("");
        setObsEvaluacion("");
        setValConducta("🟢 Excelente / Cumple");
        setValValores("🟢 Excelente / Cumple");
        cargarCatalogosRHIndependientes();
      } else throw new Error(data.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarTodoEmpleadosExcel = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/recursos-humanos/reporte-empleados-completo",
      );
      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      let rows = [
        [
          "ID Empleado",
          "ID Celular",
          "Nombre",
          "Ap Paterno",
          "Ap Materno",
          "Cargo",
          "Estatus",
          "Fecha Registro",
          "Inicio Contrato",
          "Termino Contrato",
          "Calificación Conducta",
          "Calificación Valores",
          "Observaciones",
        ],
      ];
      (data.data || []).forEach((emp) => {
        rows.push([
          emp.ID_Empleado,
          emp.ID_Celular || "N/A",
          emp.Nombre,
          emp.Ap_Paterno,
          emp.Ap_Materno || "",
          emp.Cargo,
          emp.Estatus,
          emp.Fecha_Registro,
          emp.Fecha_Inicio_Contrato || "",
          emp.Fecha_Termino_Contrato || "",
          emp.Calificacion_Conducta,
          emp.Calificacion_Valores,
          emp.Observaciones,
        ]);
      });

      let csv =
        "data:text/csv;charset=utf-8,\uFEFF" +
        rows.map((e) => e.join(",")).join("\n");
      let link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `Reporte_Completo_Empleados_dbo_${new Date().getFullYear()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* BOTÓN MAESTRO DE ACCESO COLAPSABLE */}
      <button
        type="button"
        onClick={() => setConsolaDesplegada(!consolaDesplegada)}
        style={{
          padding: "8px 16px",
          backgroundColor: consolaDesplegada ? "#6b0b33" : "#148f85",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "13px",
          marginBottom: consolaDesplegada ? "14px" : "0px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease",
        }}
      >
        {consolaDesplegada
          ? "▲ Ocultar Panel de Recursos Humanos"
          : "👥 Abrir Consola de Recursos Humanos"}
      </button>

      {/* CONTENEDOR COLAPSABLE INTERACTIVO */}
      {consolaDesplegada && (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #6b0b33",
          }}
        >
          {/* MENÚ INTERNO DE PESTAÑAS */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "14px",
              borderBottom: "1px solid #6b0b33",
              paddingBottom: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSeccionInterna("nuevo");
                setMensaje({ texto: "", tipo: "" });
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "700",
                backgroundColor:
                  seccionInterna === "nuevo" ? "#0284c7" : "#f1f5f9",
                color: seccionInterna === "nuevo" ? "#fff" : "#475569",
                border: "1px solid #6b0b33",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              👤 Agregar Colaborador
            </button>
            <button
              type="button"
              onClick={() => {
                setSeccionInterna("eliminar");
                setMensaje({ texto: "", tipo: "" });
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "700",
                backgroundColor:
                  seccionInterna === "eliminar" ? "#dc3545" : "#f1f5f9",
                color: seccionInterna === "eliminar" ? "#fff" : "#475569",
                border: "1px solid #6b0b33",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ❌ Dar de Baja Empleado (Offboarding)
            </button>
            <button
              type="button"
              onClick={() => {
                setSeccionInterna("asignaciones");
                setMensaje({ texto: "", tipo: "" });
              }}
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: "700",
                backgroundColor:
                  seccionInterna === "asignaciones" ? "#b45309" : "#f1f5f9",
                color: seccionInterna === "asignaciones" ? "#fff" : "#475569",
                border: "1px solid #6b0b33",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              📂 Realizar consultas y Auditoria
            </button>
          </div>

          {/* ALERTAS DE MESA DE CONTROL */}
          {mensaje.texto && (
            <div
              style={{
                padding: "6px 10px",
                backgroundColor:
                  mensaje.tipo === "success" ? "#e2f5ec" : "#fef2f2",
                color: mensaje.tipo === "success" ? "#0d9488" : "#991b1b",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "12px",
                border: `1px solid ${mensaje.tipo === "success" ? "#ccfbf1" : "#fecaca"}`,
              }}
            >
              {mensaje.tipo === "success" ? "✅" : "⚠️"} {mensaje.texto}
            </div>
          )}

          {/* SUB-FORMULARIO 1: REGISTRAR COLABORADOR NUEVO */}
          {seccionInterna === "nuevo" && (
            <form
              onSubmit={handleAgregarEmpleado}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              <div className="form-group-compact">
                <label className="form-label-compact">Nombre(s):</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="form-input-compact"
                  placeholder="Ej. Brandon Adonai"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group-compact">
                <label className="form-label-compact">Apellido Paterno:</label>
                <input
                  type="text"
                  value={apPaterno}
                  onChange={(e) => setApPaterno(e.target.value)}
                  className="form-input-compact"
                  placeholder="Ej. Silva"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group-compact">
                <label className="form-label-compact">
                  Apellido Materno (Opcional):
                </label>
                <input
                  type="text"
                  value={apMaterno}
                  onChange={(e) => setApMaterno(e.target.value)}
                  className="form-input-compact"
                  placeholder="Ej. Lira"
                  disabled={loading}
                />
              </div>
              <div className="form-group-compact">
                <label className="form-label-compact">
                  Puesto / Cargo Laboral:
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="form-input-compact"
                  placeholder="Ej. Chofer Logístico"
                  required
                  disabled={loading}
                />
              </div>

              {/* 📅 NUEVOS CAMPOS DE CONTRATACIÓN SOLICITADOS */}
              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{ fontWeight: "700", color: "#148f85" }}
                >
                  Fecha de Contratación:
                </label>
                <input
                  type="date"
                  value={inicioContrato}
                  onChange={(e) => setInicioContrato(e.target.value)}
                  className="form-input-compact"
                  style={{ backgroundColor: "#fff", cursor: "pointer" }}
                  disabled={loading}
                />
              </div>

              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{ fontWeight: "700", color: "#991b1b" }}
                >
                  Fecha Término Contrato:
                </label>
                <input
                  type="date"
                  value={terminoContrato}
                  onChange={(e) => setTerminoContrato(e.target.value)}
                  className="form-input-compact"
                  style={{ backgroundColor: "#fff", cursor: "pointer" }}
                  disabled={loading}
                />
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  borderTop: "1px solid #6b0b33",
                  paddingTop: "10px",
                  marginTop: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#0284c7",
                }}
              >
                🔗 ASIGNACIÓN DE HERRAMIENTAS (...DEJAR EN BLANCO PARA HACERLO
                DESPUÉS)
              </div>

              {/* 💻 CASILLA 1: SECTOR CÓMPUTO INDEPENDIENTE */}
              <div className="form-group-compact">
                <label className="form-label-compact">
                  ID Equipo de Cómputo:
                </label>
                <select
                  value={idComputoOpcional}
                  onChange={(e) => setIdComputoOpcional(e.target.value)}
                  className="form-input-compact"
                  style={{ backgroundColor: "#fff", cursor: "pointer" }}
                  disabled={loading}
                >
                  <option value="">-- Ninguno / Vacío --</option>
                  {computoDisponibles.map((act) => (
                    <option key={act.ID_Equipo} value={act.ID_Equipo}>
                      💻 {act.ID_Equipo} - {act.Marca} {act.Modelo}
                    </option>
                  ))}
                </select>
              </div>

              {/* 📱 CASILLA 2: SECTOR TELEFONÍA INDEPENDIENTE */}
              <div className="form-group-compact">
                <label className="form-label-compact">
                  ID Dispositivo Celular:
                </label>
                <select
                  value={idCelularOpcional}
                  onChange={(e) => setIdCelularOpcional(e.target.value)}
                  className="form-input-compact"
                  style={{ backgroundColor: "#fff", cursor: "pointer" }}
                  disabled={loading}
                >
                  <option value="">-- Ninguno / Vacío --</option>
                  {celularesDisponibles.map((act) => (
                    <option key={act.ID_Celular} value={act.ID_Celular}>
                      📱 {act.ID_Celular} - {act.Marca} {act.Modelo}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🚐 CASILLA 3: SECTOR VEHÍCULOS INDEPENDIENTE */}
              <div className="form-group-compact">
                <label className="form-label-compact">
                  ID Vehículo / Unidad:
                </label>
                <select
                  value={idVehiculoOpcional}
                  onChange={(e) => setIdVehiculoOpcional(e.target.value)}
                  className="form-input-compact"
                  style={{ backgroundColor: "#fff", cursor: "pointer" }}
                  disabled={loading}
                >
                  <option value="">-- Ninguno / Vacío --</option>
                  {vehiculosDisponibles.map((act) => (
                    <option key={act.ID_Vehiculo} value={act.ID_Vehiculo}>
                      🚐 {act.ID_Vehiculo} - {act.Marca} {act.Modelo}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "12px",
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-compact-primary"
                  style={{ padding: "6px 20px", width: "auto" }}
                >
                  {loading
                    ? "Sincronizando..."
                    : "💾 Registrar & Agregar Empleado"}
                </button>
              </div>
            </form>
          )}

          {/* SUB-FORMULARIO 2: OFFBOARDING / LISTADO COMPLETO DE NÓMINA DISPONIBLE PARA BAJA */}
          {seccionInterna === "eliminar" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <div
                  className="form-group-compact"
                  style={{ flex: "1 1 300px" }}
                >
                  <label
                    className="form-label-compact"
                    style={{ color: "#991b1b" }}
                  >
                    Seleccionar Colaborador a Desvincular:
                  </label>
                  <select
                    value={idEmpleadoBaja}
                    onChange={(e) => setIdEmpleadoBaja(e.target.value)}
                    className="form-input-compact"
                    style={{
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      borderColor: "#fecaca",
                    }}
                    disabled={loading}
                    required
                  >
                    <option value="" disabled>
                      -- Selecciona un Empleado Activo ({empleados.length}) --
                    </option>
                    {empleados.map((emp) => (
                      <option key={emp.id_empleado} value={emp.id_empleado}>
                        👤 [{emp.id_empleado}] - {emp.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={handleBajaEmpleado}
                  disabled={loading || !idEmpleadoBaja}
                  className="btn-compact-danger"
                  style={{
                    padding: "6px 24px",
                    width: "auto",
                    fontWeight: "700",
                  }}
                >
                  {loading
                    ? "Procesando Finiquito..."
                    : "🗑/️ Confirmar Baja de Nómina"}
                </button>
              </div>
            </div>
          )}
          {/* SECCIÓN 3: REALIZAR CONSULTAS DE ACTIVOS Y MOTOR DE VENCIMIENTOS YGO */}
          {seccionInterna === "asignaciones" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* BLOQUE DE REPORTES ORDINARIOS */}
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#148f85",
                    marginBottom: "6px",
                  }}
                >
                  📊 CONSOLA CONSULTAS DE ACTIVOS
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    margin: "0 0 14px 0",
                    lineHeight: "1.4",
                  }}
                >
                  Este módulo realiza una auditoría completa del inventario
                  relacional unificado (Cómputo, Celulares y Unidades de
                  Transporte) por cada colaborador.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDescargarReporteMaestro}
                    disabled={loading}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: loading ? "#94a3b8" : "#28a745",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "9px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: "700",
                      fontSize: "14px",
                      boxShadow: "0 2px 4px rgba(40, 167, 69, 0.2)",
                    }}
                  >
                    {loading
                      ? "🔄 Extrayendo registros..."
                      : "🟢 Descargar Reporte Maestro"}
                  </button>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      fontWeight: "600",
                      fontStyle: "italic",
                    }}
                  >
                    * El archivo consolidará la relación completa por matrícula
                    en formato compatible con Excel.
                  </span>
                </div>
              </div>

              {/* ⚠️ AUDITORÍA EN VIVO: ALERTAS DE VENCIMIENTO DE CONTRATOS LABORALES */}
              <div
                style={{
                  padding: "14px",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #6b0b33",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#6b0b33",
                    marginBottom: "10px",
                  }}
                >
                  🚨 AUDITORÍA DE CONTRATOS Y ALERTAS DE VENCIMIENTO (MESA DE
                  CONTROL)
                </span>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxHeight: "250px",
                    overflowY: "auto",
                  }}
                >
                  {empleados.length === 0 ? (
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        fontStyle: "italic",
                      }}
                    >
                      No hay registros de empleados cargados.
                    </p>
                  ) : (
                    empleados.map((emp) => {
                      // Simulación de campos si el endpoint maestro de lista los contiene o mapeo por datos
                      const fTerminoStr =
                        emp.termino_contrato || emp.Termino_Contrato;
                      if (!fTerminoStr) return null;

                      // Lógica matemática de días restantes basada en el tiempo real (Octubre 2026)
                      const fechaActual = new Date(2026, 9, 28); // 28 de Octubre de 2026
                      const fechaVencimiento = new Date(fTerminoStr);
                      const diferenciaTiempo = fechaVencimiento - fechaActual;
                      const diasRestantes = Math.ceil(
                        diferenciaTiempo / (1000 * 60 * 60 * 24),
                      );

                      // Determinar severidad de la alerta (30 días o menos)
                      const porVencer = diasRestantes <= 30;
                      if (!porVencer) return null; // Solo mostrar los que requieren atención inmediata

                      const esCritico = diasRestantes <= 7;
                      const bgAlerta = esCritico ? "#fef2f2" : "#fffbeb";
                      const borderAlerta = esCritico ? "#fca5a5" : "#fcd34d";
                      const colorTexto = esCritico ? "#991b1b" : "#92400e";

                      // 🔄 Función en línea para renovar contrato un año en automático en la base de datos
                      const ejecutarRenovacionUnAno = async (idEmp) => {
                        const confirmar = window.confirm(
                          `📝 ¿Confirmar la renovación automática por 1 año del contrato del empleado ${idEmp}?`,
                        );
                        if (!confirmar) return;

                        setLoading(true);
                        // Añadir exactamente 1 año a la fecha de vencimiento actual
                        const nuevaFecha = new Date(fechaVencimiento);
                        nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
                        const nuevaFechaStr = nuevaFecha
                          .toISOString()
                          .split("T")[0];

                        try {
                          const response = await fetch(
                            "http://localhost:8000/api/empleados/renovar-contrato",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id_empleado: idEmp,
                                nueva_fecha_termino: nuevaFechaStr,
                              }),
                            },
                          );
                          const data = await response.json();
                          if (data.status === "success") {
                            alert(
                              `✔️ Contrato renovado con éxito hasta el ${nuevaFechaStr}`,
                            );
                            cargarCatalogosRHIndependientes(); // Refrescar la nómina en vivo
                          } else {
                            alert(`⚠️ Error: ${data.message}`);
                          }
                        } catch (err) {
                          alert("Error de comunicación con el servidor.");
                        } finally {
                          setLoading(false);
                        }
                      };

                      return (
                        <div
                          key={emp.id_empleado}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            backgroundColor: bgAlerta,
                            border: `1px solid ${borderAlerta}`,
                            borderRadius: "4px",
                          }}
                        >
                          <div
                            style={{ fontSize: "11.5px", color: colorTexto }}
                          >
                            <strong>
                              👤 [{emp.id_empleado}] - {emp.nombre_completo}
                            </strong>{" "}
                            <br />
                            <span>
                              📅 Vence el: {fTerminoStr} —{" "}
                              <strong style={{ textTransform: "uppercase" }}>
                                {diasRestantes <= 0
                                  ? "⚠️ CONTRATO EXPIRADO"
                                  : `⏳ Quedan ${diasRestantes} días`}
                              </strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              ejecutarRenovacionUnAno(emp.id_empleado)
                            }
                            disabled={loading}
                            style={{
                              padding: "4px 10px",
                              fontSize: "11px",
                              fontWeight: "700",
                              backgroundColor: "#0284c7",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(2,132,199,0.2)",
                            }}
                          >
                            ⚡ Renovar 1 Año
                          </button>
                        </div>
                      );
                    })
                  )}
                  {/* Si no hay contratos por vencer, pintar mensaje de tranquilidad */}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      textAlign: "center",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}
                  >
                    * Los contratos con vigencia mayor a 30 días se mantienen
                    archivados de forma segura en SQL Server.
                  </div>
                </div>
              </div>
              {/* 📊 NUEVA SECCIÓN: PANEL DE EVALUACIÓN SEMÁFORO DE EMPLEADOS CON SCROLLBAR */}
              <div
                style={{
                  padding: "14px",
                  backgroundColor: "#ffffff",
                  borderRadius: "6px",
                  border: "1px solid #148f85",
                  marginTop: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    borderBottom: "2px solid #148f85",
                    paddingBottom: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#148f85",
                    }}
                  >
                    🚦 EVALUACIÓN DE DESEMPEÑO Y VALORES CORPORATIVOS YGO
                  </span>
                  <button
                    type="button"
                    onClick={handleDescargarTodoEmpleadosExcel}
                    style={{
                      padding: "5px 12px",
                      backgroundColor: "#28a745",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    📥 Descargar Reporte de Evaluacion
                  </button>
                </div>

                <form
                  onSubmit={handleGuardarEvaluacionSemaforo}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "10px",
                    alignItems: "end",
                  }}
                >
                  {/* BARRA DE SCROLL INCORPORADA PARA NAVEGAR ENTRE TODOS LOS EMPLEADOS */}
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Seleccionar Empleado a Evaluar:
                    </label>
                    <select
                      value={empleadoEvaluar}
                      onChange={(e) => setEmpleadoEvaluar(e.target.value)}
                      className="form-input-compact"
                      style={{ backgroundColor: "#fff", maxHeight: "150px" }}
                      required
                    >
                      <option value="" disabled>
                        -- Selecciona de la Nómina ({empleados.length}) --
                      </option>
                      {empleados.map((emp) => (
                        <option key={emp.id_empleado} value={emp.id_empleado}>
                          👤 [{emp.id_empleado}] - {emp.nombre_completo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SEMÁFORO DE CONDUCTA VARCHAR */}
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Evaluación de Conducta:
                    </label>
                    <select
                      value={valConducta}
                      onChange={(e) => setValConducta(e.target.value)}
                      className="form-input-compact"
                      style={{ backgroundColor: "#fff", fontWeight: "700" }}
                    >
                      <option value="🟢 Excelente / Cumple">
                        🟢 Excelente / Cumple
                      </option>
                      <option value="🟡 En desarrollo / Alerta">
                        🟡 En desarrollo / Alerta
                      </option>
                      <option value="🔴 Crítico / No cumple">
                        🔴 Crítico / No cumple
                      </option>
                    </select>
                  </div>

                  {/* SEMÁFORO DE VALORES VARCHAR */}
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Evaluación de Valores:
                    </label>
                    <select
                      value={valValores}
                      onChange={(e) => setValValores(e.target.value)}
                      className="form-input-compact"
                      style={{ backgroundColor: "#fff", fontWeight: "700" }}
                    >
                      <option value="🟢 Excelente / Cumple">
                        🟢 Excelente / Cumple
                      </option>
                      <option value="🟡 En desarrollo / Alerta">
                        🟡 En desarrollo / Alerta
                      </option>
                      <option value="🔴 Crítico / No cumple">
                        🔴 Crítico / No cumple
                      </option>
                    </select>
                  </div>

                  {/* OBSERVACIONES GENERALES MAPEADAS */}
                  <div
                    className="form-group-compact"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <label className="form-label-compact">
                      Observaciones de Desempeño / Minuta Laboral:
                    </label>
                    <input
                      type="text"
                      value={obsEvaluacion}
                      onChange={(e) => setObsEvaluacion(e.target.value)}
                      className="form-input-compact"
                      placeholder="Añade las notas de comportamiento de los valores y conducta"
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-compact-primary"
                      style={{
                        backgroundColor: "#148f85",
                        padding: "6px 20px",
                        width: "auto",
                      }}
                    >
                      💾 Guardar Estado y Calificaciones
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FormulariosPersonal;
