import { useState, useEffect } from "react";

function FormulariosInventario({ datosReales = [], onOperacionExitosa }) {
  // CONTROL DE VISIBILIDAD DE INTERFAZ Y PESTAÑAS
  const [consolaDesplegada, setConsolaDesplegada] = useState(false);
  const [seccionInterna, setSeccionInterna] = useState("nuevo");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  // CATÁLOGOS EXTRAÍDOS DE BASE DE DATOS REAL
  const [empleados, setEmpleados] = useState([]);
  const [inventarioSims, setInventarioSims] = useState([]);

  // 🎛️ FILTRO DE CATEGORÍA PRINCIPAL
  const [categoriaFiltro, setCategoriaFiltro] = useState("Equipos de Cómputo");

  // MATRIZ DE ESTADOS PARA LLENADO DINÁMICO DE ACTIVOS
  const [subcategoria, setSubcategoria] = useState("Laptops / Portátiles");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [idEmpleado, setIdEmpleado] = useState("");
  const [serie, setSerie] = useState("");
  const [procesador, setProcesador] = useState("");
  const [ram, setRam] = useState("");
  const [grafica, setGrafica] = useState("");
  const [almacenamiento, setAlmacenamiento] = useState("");
  const [tipoAlmacen, setTipoAlmacen] = useState("SSD");
  const [estadoEquipo, setEstadoEquipo] = useState("nuevo");
  const [accesorios, setAccesorios] = useState("");
  const [precio, setPrecio] = useState("");

  // 📱 Estados exclusivos para la Categoría 2: Dispositivos Móviles
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [color, setColor] = useState("");
  const [imei, setImei] = useState("");
  const [operadorOriginal, setOperadorOriginal] = useState("");

  // 💳 Estados exclusivos para el alta anidada de la tarjeta SIM
  const [numeroTelefonico, setNumeroTelefonico] = useState("");
  const [prefijoInternacional, setPrefijoInternacional] = useState("+52");
  const [compania, setCompania] = useState("");
  const [iccid, setIccid] = useState("");

  // 📈 variables de control
  const [precioActivo, setPrecioActivo] = useState("");
  const [tarjetaGrafica, setTarjetaGrafica] = useState("Integrado");

  // 🚐 Estados exclusivos para la Categoría 6: Vehículos
  const [placas, setPlacas] = useState("");
  const [duplicadoLlave, setDuplicadoLlave] = useState("sin duplicado");
  const [propietario, setPropietario] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [referencia, setReferencia] = useState("");

  // Control para pestañas de Eliminación Dinámica
  const [idEquipoAccion, setIdEquipoAccion] = useState("");
  const [categoriaEliminarFiltro, setCategoriaEliminarFiltro] =
    useState("Equipos de Cómputo");
  const [activosFiltradosParaBorrar, setActivosFiltradosParaBorrar] = useState(
    [],
  );
  // 📄 CARTA RESPONSIVA: Función maestra para generar y descargar el documento de asignación en formato Word (.doc)
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
          <p class='subtitle'>COMODATO DE RESPONCIVA YGO</p>
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

        <div class='section-title'>2.HERRAMIENTAS A RESGUARDADO</div>
        <table class='meta-table'>
          <tr style='background-color: #f8fafc; font-weight: bold;'>
            <td style='width: 25%;'>Tipo de Activo</td>
            <td style='width: 25%;'>Estatus de Entrega</td>
            <td style='width: 50%;'>Especificación Técnica</td>
          </tr>
          ${idComp ? `<tr><td>💻 Cómputo</td><td><strong>Buenas Condiciones</strong></td><td>Equipo de Computo</td></tr>` : ""}
          ${idCel ? `<tr><td>📱 Celular</td><td><strong>Buenas Condiciones</strong></td><td>Equipo Móvil de Comunicación Telefono Inteligente</td></tr>` : ""}
          ${idVeh ? `<tr><td>🚐 Vehículo</td><td><strong>Buenas Condiciones</strong></td><td>Vehiculo de Transporte/ Carga</td></tr>` : ""}
        </table>

        <div class='section-title'>3. CLÁUSULAS DE RESGUARDO Y OBLIGACIONES JURÍDICAS</div>
        <p class='body-text'><strong>PRIMERA. ASIGNACIÓN Y USO:</strong> El colaborador reconoce haber recibido en perfectas condiciones operativas y de conservación las herramientas detalladas en el apartado anterior, comprometiéndose a utilizarlas de manera exclusiva para el desempeño de sus funciones laborales encomendadas por la empresa.</p>
        <p class='body-text'><strong>SEGUNDA. CUIDADO Y RESGUARDO:</strong> Es obligación estricta del resguardatario velar por la seguridad física, mantenimiento preventivo y buen uso de los activos asignados. En caso de daño por negligencia, pérdida o extravío imputable a un descuido, el empleado autoriza que los costos de reposición sean evaluados por la mesa de control central.</p>
        <p class='body-text'><strong>TERCERA. DEVOLUCIÓN DE MATERIALES:</strong> Al término de la relación laboral, o bien cuando la empresa así lo requiera, el trabajador se obliga a realizar la entrega inmediata de los materiales en las mismas condiciones en las que le fueron suministrados, salvo el desgaste natural por su uso operativo ordinario.</p>

        <br/><br/><br/>
        <table width='100%' cellspacing='0' style='margin-top: 40px; border: none;'>
          <tr>
            <td align='center' style='width: 50%; border: none; border-top: 1px solid #000; padding-top: 6px; font-size: 9.5pt;'><strong>Firma de Conformidad</strong><br/>Colaborador Resguardatario</td>
            <td style='width: 10%; border: none;'></td>
            <td align='center' style='width: 40%; border: none; border-top: 1px solid #000; padding-top: 6px; font-size: 9.5pt;'><strong>Validación de Entrega</strong><br/>Supervisor/Administrador YGO</td>
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

  // 🛡️ SINCRONIZACIÓN CORREGIDA CONTRA ARREGLOS ANIDADOS DEL BACKEND
  const sincronizarCatalogosMesaControl = async () => {
    try {
      const resEmp = await fetch("http://localhost:8000/api/empleados-lista");
      const dataEmp = await resEmp.json();
      if (dataEmp.status === "success") setEmpleados(dataEmp.data || []);

      const resSim = await fetch("http://localhost:8000/api/sims-lista");
      const dataSim = await resSim.json();

      // Interceptamos si viene anidado en data o directo como arreglo
      if (dataSim.status === "success") {
        setInventarioSims(dataSim.data || []);
      } else if (Array.isArray(dataSim)) {
        setInventarioSims(dataSim);
      }
    } catch (error) {
      console.error("Fallo de red al jalar catálogos:", error);
    }
  };

  useEffect(() => {
    sincronizarCatalogosMesaControl();
  }, []);

  // 🛡️ EFECT
  useEffect(() => {
    let listaLimpia = [];
    if (datosReales) {
      if (Array.isArray(datosReales)) {
        listaLimpia = datosReales;
      } else if (datosReales.data && Array.isArray(datosReales.data)) {
        listaLimpia = datosReales.data;
      }
    }

    if (listaLimpia.length === 0) {
      setActivosFiltradosParaBorrar([]);
      return;
    }

    const filtrados = listaLimpia.filter((activo) => {
      if (!activo) return false;

      // Normalizamos el texto a minúsculas y eliminamos espacios fantasmas para asegurar coincidencia
      const cat = activo.categoria
        ? String(activo.categoria).toLowerCase().trim()
        : "";
      const id = activo.id_activo
        ? String(activo.id_activo).toLowerCase().trim()
        : "";

      if (categoriaEliminarFiltro === "Equipos de Cómputo") {
        return (
          [
            "laptop",
            "pc escritorio",
            "tablet",
            "equipos de cómputo",
            "computo",
          ].includes(cat) || id.startsWith("com-")
        );
      } else if (categoriaEliminarFiltro === "Dispositivos Móviles") {
        return (
          [
            "celular",
            "celulares / smartphones",
            "relojes inteligentes",
            "dispositivos móviles",
            "móviles",
          ].includes(cat) || id.startsWith("m")
        );
      } else if (categoriaEliminarFiltro === "Pantallas y Monitores") {
        return [
          "monitor de oficina",
          "pantallas de gran formato",
          "proyector",
          "pantallas y monitores",
          "pantallas",
        ].includes(cat);
      } else if (categoriaEliminarFiltro === "Impresión y Escaneo") {
        return [
          "impresoras y multifuncionales",
          "escáneres de documentos",
          "impresión y escaneo",
          "impresión",
        ].includes(cat);
      } else if (categoriaEliminarFiltro === "Redes y Conectividad") {
        return [
          "repetidores y sistemas mesh (malla)",
          "routers, modems y switches",
          "redes y conectividad",
          "redes",
        ].includes(cat);
      } else if (categoriaEliminarFiltro === "Vehiculo") {
        return cat === "vehiculo" || id.startsWith("veh-");
      }
      return false;
    });

    setActivosFiltradosParaBorrar(filtrados);
    setIdEquipoAccion("");
  }, [categoriaEliminarFiltro, datosReales]);

  const handleCambioCategoriaFiltro = (cat) => {
    setCategoriaFiltro(cat);
    if (cat === "Equipos de Cómputo") setSubcategoria("Laptops / Portátiles");
    else if (cat === "Dispositivos Móviles")
      setSubcategoria("Celulares / Smartphones");
    else if (cat === "Pantallas y Monitores")
      setSubcategoria("Monitores de Oficina y Gaming");
    else if (cat === "Impresión y Escaneo")
      setSubcategoria("Impresoras y Multifuncionales");
    else if (cat === "Redes y Conectividad")
      setSubcategoria("Repetidores y Sistemas Mesh (Malla)");
    else if (cat === "Vehiculo")
      setSubcategoria("Vehículos de Carga y trabajo");
  };
  const handleAgregarEquipo = async (e) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: "" });
    setLoading(true);

    // 🔍 Buscamos los datos del empleado seleccionado para la carta responsiva institucional
    const empleadoSeleccionado = empleados.find((emp) =>
      String(emp.id_empleado).strip
        ? String(emp.id_empleado).strip() === String(idEmpleado).strip()
        : String(emp.id_empleado) === String(idEmpleado),
    );
    const nombreCompletoResponsiva = empleadoSeleccionado
      ? empleadoSeleccionado.nombre_completo
      : "Colaborador YGO";

    try {
      const response = await fetch("http://localhost:8000/api/equipos/nuevo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria_filtro: categoriaFiltro,
          subcategoria,
          marca,
          modelo,
          id_empleado: idEmpleado || null,
          serie: serie || "sin serie",
          procesador:
            categoriaFiltro === "Equipos de Cómputo" ? procesador : null,
          ram: categoriaFiltro === "Equipos de Cómputo" ? ram : null,
          tarjeta_grafica:
            categoriaFiltro === "Equipos de Cómputo" ? tarjetaGrafica : null, // 🔑 Enlazado a tu variable de estado
          almacenamiento: [
            "Equipos de Cómputo",
            "Dispositivos Móviles",
          ].includes(categoriaFiltro)
            ? almacenamiento
            : null,
          tipo_almacenamiento:
            categoriaFiltro === "Equipos de Cómputo" ? tipoAlmacen : null,
          estado_equipo: estadoEquipo,
          accesorios: accesorios || null,
          precio: precioActivo ? parseFloat(precioActivo) : null, // 🔑 Enlazado a tu costo estimado
          nombre_equipo: nombreEquipo,
          color,
          imei,
          operador_original: operadorOriginal,
          numero_telefonico: numeroTelefonico,
          prefijo_internacional: prefijoInternacional,
          compania,
          iccid,
          placas: placas || "sin Placa",
          duplicado_llave: duplicadoLlave,
          propietario,
          ubicacion,
          referencia,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      setMensaje({ texto: data.message, tipo: "success" });

      // 📄 REGLA DE NEGOCIO ESTRICTA: Solo si hay un empleado asignado (no vacío) descarga la responsiva
      if (idEmpleado && idEmpleado.trim() !== "") {
        // Invocamos la función de Word pasándole el nombre real recuperado de la base de datos
        generarDocumentoResponsivaWord(
          nombreCompletoResponsiva,
          "Personal Resguardatario YGO",
          categoriaFiltro === "Equipos de Cómputo" ? "Asignado" : null,
          categoriaFiltro === "Dispositivos Móviles" ? "Asignado" : null,
          categoriaFiltro === "Vehiculo" ? "Asignado" : null,
        );
      }

      if (onOperacionExitosa) onOperacionExitosa();
      sincronizarCatalogosMesaControl();

      // Limpieza de estados
      setMarca("");
      setModelo("");
      setIdEmpleado("");
      setSerie("");
      setProcesador("");
      setRam("");
      setGrafica("");
      setAlmacenamiento("");
      setAccesorios("");
      setPrecio("");
      setNombreEquipo("");
      setColor("");
      setImei("");
      setOperadorOriginal("");
      setNumeroTelefonico("");
      setCompania("");
      setIccid("");
      setPlacas("");
      setPropietario("");
      setUbicacion("");
      setReferencia("");
      setDuplicadoLlave("sin duplicado");
      setPrefijoInternacional("+52");
    } catch (err) {
      setMensaje({
        texto: err.message || "Error al procesar el alta.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarEquipo = async (e) => {
    e.preventDefault();
    if (!idEquipoAccion) return;

    const activoSeleccionado = activosFiltradosParaBorrar.find(
      (a) => a.id_activo === idEquipoAccion,
    );
    const detalleTexto = activoSeleccionado
      ? `[${activoSeleccionado.marca} ${activoSeleccionado.modelo}]`
      : "";

    const confirmar = window.confirm(
      `⚠️ ¿Confirmar la eliminación permanente de ${idEquipoAccion} ${detalleTexto} de SQL Server?`,
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      let tablaOrigenBackend = "Laptop";
      if (idEquipoAccion.startsWith("VEH-")) tablaOrigenBackend = "Vehiculo";
      else if (idEquipoAccion.startsWith("M")) tablaOrigenBackend = "Celular";

      const response = await fetch(
        "http://localhost:8000/api/equipos/eliminar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_equipo: idEquipoAccion,
            categoria: tablaOrigenBackend,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      setMensaje({ texto: data.message, tipo: "success" });
      setIdEquipoAccion("");
      if (onOperacionExitosa) onOperacionExitosa();
    } catch (err) {
      setMensaje({ texto: err.message, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleModificarEstatusSimCompleto = async (idSim, nuevoEstatus) => {
    const esBaja = nuevoEstatus.toLowerCase() === "dar de baja";
    if (esBaja) {
      const confirmar = window.confirm(
        `⚠️ ¿Estás absolutamente seguro de eliminar permanentemente la SIM con ID ${idSim} permanentemente ?`,
      );
      if (!confirmar) return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/sims/actualizar-estatus",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_sim: parseInt(idSim),
            nuevo_estatus: nuevoEstatus,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      alert(data.message);
      sincronizarCatalogosMesaControl();
      if (onOperacionExitosa) onOperacionExitosa();
    } catch (err) {
      alert(`❌ Error al procesar SIM: ${err.message}`);
    }
  };

  const handleReasignarLineaTelefonica = async (idSim, idCelularNuevo) => {
    try {
      const response = await fetch("http://localhost:8000/api/sims/reasignar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_sim: parseInt(idSim),
          id_celular_nuevo: idCelularNuevo || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status === "error")
        throw new Error(data.message);

      alert(data.message);
      sincronizarCatalogosMesaControl();
      if (onOperacionExitosa) onOperacionExitosa();
    } catch (err) {
      alert(`❌ Error en reasignación: ${err.message}`);
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
          backgroundColor: consolaDesplegada ? "#475569" : "#0284c7",
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
          ? "▲ Ocultar Panel de Control"
          : "⚙️ Mostrar Herramientas de Administrador"}
      </button>

      {/* CONTENEDOR COLAPSABLE INTERACTIVO */}
      {consolaDesplegada && (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* MENÚ INTERNO DE PESTAÑAS */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "14px",
              borderBottom: "1px solid #cbd5e1",
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
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ➕ Agregar Activo (Cómputo/Celular/Vehículo)
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
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ❌ Eliminar Activo
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

          {/* ======================================================================
             ➕ SUB-FORMULARIO: REGISTRAR ACTIVO NUEVO
             ====================================================================== */}
          {seccionInterna === "nuevo" && (
            <form
              onSubmit={handleAgregarEquipo}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{ color: "#0284c7" }}
                >
                  Filtro de Categoría:
                </label>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => handleCambioCategoriaFiltro(e.target.value)}
                  className="form-input-compact"
                  style={{
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  <option value="Equipos de Cómputo">
                    💻 1. Equipos de Cómputo
                  </option>
                  <option value="Dispositivos Móviles">
                    📱 2. Dispositivos Móviles
                  </option>
                  <option value="Pantallas y Monitores">
                    🖥️ 3. Pantallas y Monitores
                  </option>
                  <option value="Impresión y Escaneo">
                    🖨️ 4. Impresión y Escaneo
                  </option>
                  <option value="Redes y Conectividad">
                    🌐 5. Redes y Conectividad
                  </option>
                  <option value="Vehiculo">🚐 6. Vehiculo</option>
                </select>
              </div>

              <div className="form-group-compact">
                <label className="form-label-compact">
                  Subcategoría Específica:
                </label>
                {categoriaFiltro === "Equipos de Cómputo" && (
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="form-input-compact"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="Laptop">Laptops / Portátiles</option>
                    <option value="PC Escritorio">
                      Computadoras de Escritorio
                    </option>
                  </select>
                )}

                {categoriaFiltro === "Dispositivos Móviles" && (
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="form-input-compact"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="Celulares / Smartphones">
                      Celulares / Smartphones
                    </option>
                    <option value="Relojes Inteligentes">
                      Relojes Inteligentes
                    </option>
                    <option value="Tablet">Tabletas Inteligentes</option>
                  </select>
                )}
                {categoriaFiltro === "Pantallas y Monitores" && (
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="form-input-compact"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="Monitor de Oficina">
                      Monitores de Oficina y Gaming
                    </option>
                    <option value="Pantallas de Gran Formato">
                      Pantallas de Gran Formato
                    </option>
                  </select>
                )}
                {categoriaFiltro === "Impresión y Escaneo" && (
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="form-input-compact"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="Impresoras y Multifuncionales">
                      Impresoras y Multifuncionales
                    </option>
                    <option value="Escáneres de Documentos">
                      Escáneres de Documentos
                    </option>
                  </select>
                )}
                {categoriaFiltro === "Redes y Conectividad" && (
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="form-input-compact"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="Repetidores y Sistemas Mesh (Malla)">
                      Repetidores y Sistemas Mesh (Malla)
                    </option>
                    <option value="Routers, Modems y Switches">
                      Routers, Modems y Switches
                    </option>
                  </select>
                )}
                {categoriaFiltro === "Vehiculo" && (
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="form-input-compact"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <option value="Pickups / Camionetas">
                      Pickups / Camionetas
                    </option>
                    <option value="Coches Sedan / Hatchback">
                      Coches Sedan / Hatchback
                    </option>
                    <option value="Motocicletas de Reparto y Trabajo">
                      Motocicletas de Reparto y Trabajo
                    </option>
                  </select>
                )}
              </div>

              <div className="form-group-compact">
                <label className="form-label-compact">Marca del Activo:</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="form-input-compact"
                  placeholder="Ej. DELL, Nissan"
                  required
                />
              </div>

              <div className="form-group-compact">
                <label className="form-label-compact">Modelo Técnico:</label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="form-input-compact"
                  placeholder="Ej. Latitude, iPhone 14"
                  required
                />
              </div>
              {categoriaFiltro === "Dispositivos Móviles" && (
                <>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Nombre Interno Equipo:
                    </label>
                    <input
                      type="text"
                      value={nombreEquipo}
                      onChange={(e) => setNombreEquipo(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. nicho096"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">Color:</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. Negro"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Operador de Red Original:
                    </label>
                    <input
                      type="text"
                      value={operadorOriginal}
                      onChange={(e) => setOperadorOriginal(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. Telcel"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label
                      className="form-label-compact"
                      style={{ color: "#0284c7", fontWeight: "700" }}
                    >
                      Costo Estimado (Precio MXN):
                    </label>
                    <input
                      type="number"
                      value={precioActivo}
                      onChange={(e) => setPrecioActivo(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. 4500"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{
                    color: ["Dispositivos Móviles", "Vehiculo"].includes(
                      categoriaFiltro,
                    )
                      ? "#dc3545"
                      : "#64748b",
                  }}
                >
                  {categoriaFiltro === "Vehiculo"
                    ? "Número de Serie / Motor:"
                    : "Número de Serie:"}
                </label>
                <input
                  type="text"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="form-input-compact"
                  placeholder="Vacio = sin serie"
                  required={["Dispositivos Móviles", "Vehiculo"].includes(
                    categoriaFiltro,
                  )}
                />
              </div>

              {categoriaFiltro === "Dispositivos Móviles" && (
                <div className="form-group-compact">
                  <label
                    className="form-label-compact"
                    style={{ color: "#dc3545" }}
                  >
                    IMEI del Dispositivo:
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="form-input-compact"
                    placeholder="15 dígitos"
                    maxLength="15"
                    required
                  />
                </div>
              )}

              {categoriaFiltro === "Equipos de Cómputo" && (
                <>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Procesador / Chipset:
                    </label>
                    <input
                      type="text"
                      value={procesador}
                      onChange={(e) => setProcesador(e.target.value)}
                      className="form-input-compact"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">Memoria RAM:</label>
                    <input
                      type="text"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="form-input-compact"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Tipo de Almacenamiento:
                    </label>
                    <select
                      value={tipoAlmacen}
                      onChange={(e) => setTipoAlmacen(e.target.value)}
                      className="form-input-compact"
                      style={{ backgroundColor: "#fff" }}
                    >
                      <option value="SSD">SSD</option>
                      <option value="HDD">HDD</option>
                    </select>
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Tarjeta Gráfica:
                    </label>
                    <input
                      type="text"
                      value={tarjetaGrafica}
                      onChange={(e) => setTarjetaGrafica(e.target.value)}
                      className="form-input-compact"
                      placeholder="Por defecto: Integrado"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label
                      className="form-label-compact"
                      style={{ color: "#0284c7", fontWeight: "700" }}
                    >
                      Costo Estimado (Inversión MXN):
                    </label>
                    <input
                      type="number"
                      value={precioActivo}
                      onChange={(e) => setPrecioActivo(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. 16500"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{
                    color: ["Dispositivos Móviles", "Vehiculo"].includes(
                      categoriaFiltro,
                    )
                      ? "#dc3545"
                      : "#64748b",
                  }}
                >
                  {categoriaFiltro === "Vehiculo"
                    ? "Número de Serie / Motor:"
                    : "Número de Serie:"}
                </label>
                <input
                  type="text"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="form-input-compact"
                  placeholder="Vacio = sin serie"
                  required={["Dispositivos Móviles", "Vehiculo"].includes(
                    categoriaFiltro,
                  )}
                />
              </div>

              {categoriaFiltro === "Dispositivos Móviles" && (
                <div className="form-group-compact">
                  <label
                    className="form-label-compact"
                    style={{ color: "#dc3545" }}
                  >
                    IMEI del Dispositivo:
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="form-input-compact"
                    placeholder="15 dígitos"
                    maxLength="15"
                    required
                  />
                </div>
              )}

              {categoriaFiltro === "Equipos de Cómputo" && (
                <>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Procesador / Chipset:
                    </label>
                    <input
                      type="text"
                      value={procesador}
                      onChange={(e) => setProcesador(e.target.value)}
                      className="form-input-compact"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">Memoria RAM:</label>
                    <input
                      type="text"
                      value={ram}
                      onChange={(e) => setRam(e.target.value)}
                      className="form-input-compact"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Tipo de Almacenamiento:
                    </label>
                    <select
                      value={tipoAlmacen}
                      onChange={(e) => setTipoAlmacen(e.target.value)}
                      className="form-input-compact"
                      style={{ backgroundColor: "#fff" }}
                    >
                      <option value="SSD">SSD</option>
                      <option value="HDD">HDD</option>
                    </select>
                  </div>
                </>
              )}

              {["Equipos de Cómputo", "Dispositivos Móviles"].includes(
                categoriaFiltro,
              ) && (
                <div className="form-group-compact">
                  <label className="form-label-compact">
                    Capacidad Almacenamiento:
                  </label>
                  <input
                    type="text"
                    value={almacenamiento}
                    onChange={(e) => setAlmacenamiento(e.target.value)}
                    className="form-input-compact"
                  />
                </div>
              )}

              {categoriaFiltro === "Vehiculo" && (
                <>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Placas de Circulación:
                    </label>
                    <input
                      type="text"
                      value={placas}
                      onChange={(e) => setPlacas(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. NCM-87-2C"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Ubicación Actual / Base:
                    </label>
                    <input
                      type="text"
                      value={ubicacion}
                      onChange={(e) => setUbicacion(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. Planta Toluca"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Duplicado de Llave:
                    </label>
                    <select
                      value={duplicadoLlave}
                      onChange={(e) => setDuplicadoLlave(e.target.value)}
                      className="form-input-compact"
                      style={{ backgroundColor: "#fff", cursor: "pointer" }}
                    >
                      <option value="sin duplicado">
                        Sin Duplicado (Por defecto)
                      </option>
                      <option value="con duplicado">
                        Con Duplicado / Copia de Resguardo
                      </option>
                    </select>
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Propietario / Arrendatario:
                    </label>
                    <input
                      type="text"
                      value={propietario}
                      onChange={(e) => setPropietario(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. Arrendadora ABC / Propio"
                    />
                  </div>
                  <div className="form-group-compact">
                    <label className="form-label-compact">
                      Referencia de Unidad (Código ECO):
                    </label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      className="form-input-compact"
                      placeholder="Ej. NS02, NS05"
                    />
                  </div>
                </>
              )}

              <div className="form-group-compact">
                <label className="form-label-compact">
                  Asignar Empleado Responsable:
                </label>
                <select
                  value={idEmpleado}
                  onChange={(e) => setIdEmpleado(e.target.value)}
                  className="form-input-compact"
                  style={{ backgroundColor: "#fff", cursor: "pointer" }}
                >
                  <option value="">
                    -- Sin Asignar (Disponible en Almacén) --
                  </option>
                  {empleados.map((emp) => (
                    <option key={emp.id_empleado} value={emp.id_empleado}>
                      👤 [{emp.id_empleado}] {emp.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              {categoriaFiltro === "Dispositivos Móviles" && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    backgroundColor: "#f0f9ff",
                    border: "1px dashed #0284c7",
                    padding: "12px",
                    borderRadius: "4px",
                    marginTop: "4px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#0284c7",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                    }}
                  >
                    💳 CONECTIVIDAD: ASOCIAR TARJETA SIM (DEJAR CHIP VACÍO SI NO
                    TIENE)
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div className="form-group-compact">
                      <label className="form-label-compact">
                        Prefijo Internacional:
                      </label>
                      <select
                        value={prefijoInternacional}
                        onChange={(e) =>
                          setPrefijoInternacional(e.target.value)
                        }
                        className="form-input-compact"
                        style={{
                          backgroundColor: "#fff",
                          cursor: "pointer",
                          fontWeight: "700",
                        }}
                      >
                        <option value="+52">🇲🇽 México (+52)</option>
                        <option value="+1">🇺🇸 Estados Unidos (+1)</option>
                        <option value="+1-CA">🇨🇦 Canadá (+1)</option>
                        <option value="+34">🇪🇸 España (+34)</option>
                        <option value="+54">🇦🇷 Argentina (+54)</option>
                      </select>
                    </div>
                    <div className="form-group-compact">
                      <label className="form-label-compact">
                        Número Telefónico:
                      </label>
                      <input
                        type="text"
                        value={numeroTelefonico}
                        onChange={(e) =>
                          setNumeroTelefonico(e.target.value.replace(/\D/g, ""))
                        }
                        className="form-input-compact"
                        placeholder="Ej. 5512345678"
                        maxLength="10"
                      />
                    </div>
                    <div className="form-group-compact">
                      <label className="form-label-compact">
                        Compañía Telefónica:
                      </label>
                      <input
                        type="text"
                        value={compania}
                        onChange={(e) => setCompania(e.target.value)}
                        className="form-input-compact"
                        placeholder="Ej. Telcel, Movistar"
                      />
                    </div>
                    <div className="form-group-compact">
                      <label className="form-label-compact">
                        Código ICCID (Tarjeta SIM):
                      </label>
                      <input
                        type="text"
                        value={iccid}
                        onChange={(e) => setIccid(e.target.value)}
                        className="form-input-compact"
                        placeholder="Obligatorio si coloca número"
                        required={numeroTelefonico.length > 0}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div
                className="form-group-compact"
                style={{ gridColumn: "1 / -1" }}
              >
                <label className="form-label-compact">
                  Accesorios / Observaciones:
                </label>
                <input
                  type="text"
                  value={accesorios}
                  onChange={(e) => setAccesorios(e.target.value)}
                  className="form-input-compact"
                  placeholder="DETALLES U OBSERVACIONES"
                />
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "4px",
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-compact-primary"
                  style={{ padding: "6px 20px", width: "auto" }}
                >
                  💾 Registrar e Insertar
                </button>
              </div>
            </form>
          )}
          {/* ======================================================================
             ❌ SUB-FORMULARIO: ELIMINACIÓN DE ACTIVO CON FILTRADO
             ====================================================================== */}
          {seccionInterna === "eliminar" && (
            <form
              onSubmit={handleEliminarEquipo}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "14px",
                alignItems: "end",
              }}
            >
              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{ color: "#dc3545", fontWeight: "700" }}
                >
                  1. Filtrar por Categoría de Origen:
                </label>
                <select
                  value={categoriaEliminarFiltro}
                  onChange={(e) => setCategoriaEliminarFiltro(e.target.value)}
                  className="form-input-compact"
                  style={{
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                  disabled={loading}
                >
                  <option value="Equipos de Cómputo">
                    💻 1. Equipos de Cómputo
                  </option>
                  <option value="Dispositivos Móviles">
                    📱 2. Dispositivos Móviles
                  </option>
                  <option value="Pantallas y Monitores">
                    🖥️ 3. Pantallas y Monitores
                  </option>
                  <option value="Impresión y Escaneo">
                    🖨️ 4. Impresión y Escaneo
                  </option>
                  <option value="Redes y Conectividad">
                    🌐 5. Redes y Conectividad
                  </option>
                  <option value="Vehiculo">🚐 6. Vehiculo</option>
                </select>
              </div>

              <div className="form-group-compact">
                <label
                  className="form-label-compact"
                  style={{ color: "#dc3545", fontWeight: "700" }}
                >
                  2. ID del Activo a Eliminar (
                  {activosFiltradosParaBorrar.length}):
                </label>
                <select
                  value={idEquipoAccion}
                  onChange={(e) => setIdEquipoAccion(e.target.value)}
                  className="form-input-compact"
                  style={{
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                  disabled={loading || activosFiltradosParaBorrar.length === 0}
                  required
                >
                  <option value="" disabled>
                    {activosFiltradosParaBorrar.length === 0
                      ? "-- No hay activos en esta categoría --"
                      : "-- Selecciona el Activo a Borrar --"}
                  </option>
                  {activosFiltradosParaBorrar.map((activo) => {
                    const responsable = activo.empleado_nombre
                      ? `(Resp: ${activo.empleado_nombre} ${activo.empleado_paterno || ""})`
                      : "(Disponible en Almacén)";
                    const nSerie =
                      activo.serie && activo.serie !== "S/N"
                        ? `[Serie/Placa: ${activo.serie}]`
                        : "[Sin Serie]";
                    return (
                      <option key={activo.id_activo} value={activo.id_activo}>
                        🆔 {activo.id_activo} - {activo.marca} {activo.modelo}{" "}
                        {nSerie} {responsable}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "stretch" }}>
                <button
                  type="submit"
                  disabled={loading || !idEquipoAccion}
                  className="btn-compact-danger"
                  style={{
                    padding: "6px 16px",
                    width: "100%",
                    height: "30px",
                    fontWeight: "700",
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(220, 53, 69, 0.15)",
                  }}
                >
                  {loading
                    ? "Ejecutando DELETE..."
                    : "🗑️ ELIMINAR PERMANENTEMENTE"}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================================
             📋 BITÁCORA DEL INVENTARIO DE TARJETAS SIM 
             ====================================================================== */}
          {seccionInterna === "nuevo" && (
            <div
              style={{
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #cbd5e1",
              }}
            >
              <span
                className="form-label-compact"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#b45309",
                  fontWeight: "700",
                }}
              >
                📊 CONTROL DE INVENTARIO INTERNO DE TARJETAS SIM EN VIVO
              </span>
              <div
                style={{
                  overflowX: "auto",
                  maxHeight: "220px",
                  overflowY: "auto",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "11px",
                    textAlign: "left",
                  }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#f8fafc",
                      zIndex: 5,
                    }}
                  >
                    <tr
                      style={{
                        borderBottom: "2px solid #cbd5e1",
                        color: "#475569",
                        fontWeight: "700",
                      }}
                    >
                      <th style={{ padding: "6px 4px" }}>ID SIM</th>
                      <th style={{ padding: "6px 4px" }}>Número Telefónico</th>
                      <th style={{ padding: "6px 4px" }}>Compañía</th>
                      <th style={{ padding: "6px 4px" }}>Código ICCID</th>
                      <th style={{ padding: "6px 4px" }}>Asignado A / IMEI</th>
                      <th style={{ padding: "6px 4px", textAlign: "center" }}>
                        Reasignar Línea
                      </th>
                      <th style={{ padding: "6px 4px", textAlign: "center" }}>
                        Estatus
                      </th>
                      <th style={{ padding: "6px 4px", textAlign: "center" }}>
                        Acción / Flujo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventarioSims.map((sim) => {
                      // 🔑 CORRECCIÓN RELACIONAL: Cruzamos el ID_SIM físico guardado en el backend con la lista de activos
                      const listaLimpiaActivos = Array.isArray(datosReales)
                        ? datosReales
                        : datosReales?.data && Array.isArray(datosReales.data)
                          ? datosReales.data
                          : [];

                      // Buscamos en el inventario general si la SIM está asignada a la línea móvil
                      const simLimpiaId = parseInt(sim.id_sim);
                      const simAsignadaEnLista =
                        sim.empleado_assigned &&
                        sim.empleado_assigned !== "Sin Asignar"
                          ? sim.empleado_assigned
                          : null;

                      // Definir la paleta de colores industriales solicitada
                      const estatusLimpio = String(
                        sim.estatus_sim,
                      ).toLowerCase();
                      let colorCelda = "#0284c7"; // Activo: Azul
                      let bgCelda = "#f0f9ff";

                      if (estatusLimpio === "inactivo") {
                        colorCelda = "#b45309"; // Inactivo: Amarillo
                        bgCelda = "#fef3c7";
                      } else if (estatusLimpio === "bloqueado") {
                        colorCelda = "#dc2626"; // Bloqueado: Rojo
                        bgCelda = "#fee2e2";
                      } else if (estatusLimpio === "disponible") {
                        colorCelda = "#166534"; // Disponible: Verde
                        bgCelda = "#f0fdf4";
                      }

                      return (
                        <tr
                          key={sim.id_sim}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <td style={{ padding: "6px 4px", fontWeight: "700" }}>
                            {sim.id_sim}
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            {sim.prefijo_internacional || "+52"}{" "}
                            {sim.numero_telefonico}
                          </td>
                          <td style={{ padding: "6px 4px" }}>{sim.compania}</td>
                          <td
                            style={{
                              padding: "6px 4px",
                              fontFamily: "monospace",
                            }}
                          >
                            {sim.iccid}
                          </td>

                          {/* 👤 COLUMNA MAPEADA NATURALEZA DEL ENDPOINT RELACIONAL DEFastAPI */}
                          <td
                            style={{
                              padding: "6px 4px",
                              fontWeight: "500",
                              color:
                                sim.empleado_assigned === "Sin Asignar"
                                  ? "#94a3b8"
                                  : "#334155",
                            }}
                          >
                            {sim.empleado_assigned &&
                            sim.empleado_assigned !== "Sin Asignar" ? (
                              <>
                                👤 {sim.empleado_assigned} <br />
                                <small
                                  style={{
                                    color: "#0284c7",
                                    fontWeight: "600",
                                  }}
                                >
                                  🆔 Dispositivo: {sim.celular_id || "Asignado"}
                                </small>
                              </>
                            ) : (
                              <>
                                <span style={{ color: "#94a3b8" }}>
                                  👤 Sin Asignar
                                </span>{" "}
                                <br />
                                <small style={{ color: "#94a3b8" }}>
                                  📱 {sim.celular_imei || "S/N IMEI"}
                                </small>
                              </>
                            )}
                          </td>

                          {/* 🔄 OPCIÓN DINÁMICA DE REASIGNACIÓN EN BASE A TU LISTA DE ACTIVOS MÓVILES REALES */}
                          <td style={{ padding: "4px", textAlign: "center" }}>
                            <select
                              onChange={(e) =>
                                handleReasignarLineaTelefonica(
                                  sim.id_sim,
                                  e.target.value,
                                )
                              }
                              style={{
                                padding: "2px 4px",
                                fontSize: "10px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#fff",
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                -- Reasignar a --
                              </option>
                              <option value="">⚠️ [Liberar Línea]</option>
                              {listaLimpiaActivos
                                .filter(
                                  (act) =>
                                    String(act.categoria).toLowerCase() ===
                                      "celular" ||
                                    String(act.id_activo).startsWith("M"),
                                )
                                .map((cel) => (
                                  <option
                                    key={cel.id_activo}
                                    value={cel.id_activo}
                                  >
                                    📱 {cel.id_activo} - {cel.marca}{" "}
                                    {cel.modelo}
                                  </option>
                                ))}
                            </select>
                          </td>

                          <td
                            style={{ padding: "6px 4px", textAlign: "center" }}
                          >
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: "700",
                                fontSize: "9px",
                                backgroundColor: bgCelda,
                                color: colorCelda,
                                border: `1px solid ${colorCelda}22`,
                                textTransform: "uppercase",
                              }}
                            >
                              {sim.estatus_sim}
                            </span>
                          </td>
                          <td style={{ padding: "4px", textAlign: "center" }}>
                            <select
                              onChange={(e) =>
                                handleModificarEstatusSimCompleto(
                                  sim.id_sim,
                                  e.target.value,
                                )
                              }
                              style={{
                                padding: "2px 4px",
                                fontSize: "10px",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                                fontWeight: "600",
                                color: "#475569",
                              }}
                              value=""
                            >
                              <option value="" disabled>
                                -- Acciones --
                              </option>
                              {estatusLimpio === "activo" && (
                                <>
                                  <option value="Inactivo">
                                    🔄 Cambiar a Inactivo
                                  </option>
                                  <option value="Bloqueado">
                                    🔒 Cambiar a Bloqueado
                                  </option>
                                  <option value="Disponible">
                                    🟢 Cambiar a Disponible
                                  </option>
                                </>
                              )}
                              {estatusLimpio === "bloqueado" && (
                                <>
                                  <option value="Dar de Baja">
                                    🗑️ Dar de Baja (Eliminar)
                                  </option>
                                  <option value="Activo">⚡ Activar</option>
                                  <option value="Bloqueado">🔒 Bloquear</option>
                                </>
                              )}
                              {!["activo", "bloqueado"].includes(
                                estatusLimpio,
                              ) && (
                                <>
                                  <option value="Activo">⚡ Activar</option>
                                  <option value="Inactivo">🔄 Inactivar</option>
                                  <option value="Bloqueado">🔒 Bloquear</option>
                                  <option value="Disponible">
                                    🟢 Disponible
                                  </option>
                                </>
                              )}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FormulariosInventario;
