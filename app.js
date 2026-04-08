// --- 0. EL "CEREBRO" DE LA APP (MEMORIA LOCAL) ---
// Aquí buscamos si ya hay datos guardados de sesiones anteriores. Si no hay, creamos listas vacías [].
let appData = {
  alumnos: JSON.parse(localStorage.getItem("app_alumnos")) || [],
  maestros: JSON.parse(localStorage.getItem("app_maestros")) || [],
  materias: JSON.parse(localStorage.getItem("app_materias")) || [],
  asignaciones: JSON.parse(localStorage.getItem("app_asignaciones")) || [],
  historial: JSON.parse(localStorage.getItem("app_historial")) || [], // <--- ¡Nuevo!
};

// Esta función es la que "guarda la partida" en el navegador
function guardarEnLocal() {
  const modulos = [
    "asistencia",
    "reportes",
    "admin-csv",
    "maestros",
    "materias",
    "asignar",
  ];

  modulos.forEach((id) => {
    const el = document.getElementById(`modulo-${id}`);
    if (el) el.style.display = "none";
  });

  const seleccionado = document.getElementById(`modulo-${modulo}`);
  if (seleccionado) {
    seleccionado.style.display = "block";
    console.log("📂 Cambiando al módulo:", modulo);

    // GATILLOS DE CARGA
    if (modulo === "maestros") renderizarMaestrosGestion();
    if (modulo === "materias") renderizarMateriasGestion();
    if (modulo === "asistencia") inicializarApp(); // <--- Aquí carga los maestros para el profe
  }
}

// --- 1. NAVEGACIÓN SPA ---
function switchModulo(modulo) {
  // 1. Ocultar todos los módulos
  const secciones = document.querySelectorAll(".modulo-seccion");
  secciones.forEach((s) => (s.style.display = "none"));

  // 2. Mostrar el seleccionado (usando el ID correcto)
  const seleccionado = document.getElementById(`modulo-${modulo}`);
  if (seleccionado) {
    seleccionado.style.display = "block";

    // 3. GATILLOS: Ejecutar la carga de datos según el módulo
    console.log("Cambiando al módulo:", modulo);

    if (modulo === "maestros") renderizarMaestrosGestion();
    if (modulo === "materias") renderizarMateriasGestion();
    if (modulo === "asignar") actualizarSelectoresAsignacion();
    if (modulo === "asistencia") inicializarApp();
  }
}

// --- 2. LÓGICA DE ALUMNOS Y ASISTENCIA ---
/* document
  .getElementById("csvAlumnosForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const lector = new FileReader();
    lector.onload = (ev) => mostrarTablaAsistencia(ev.target.result);
    lector.readAsText(document.getElementById("csvFile").files[0]);
  }); */

document.addEventListener("DOMContentLoaded", () => {
  // Si estamos en la pantalla de asistencia, cargamos maestros
  inicializarApp();
});

function mostrarTablaAsistencia(csv) {
  const filas = csv.split("\n");
  const hoy = new Date().toISOString().split("T")[0];

  let html = `
    <div class="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
        <div>
            <label class="fw-bold small">FECHA DE CLASE:</label>
            <input type="date" id="fechaAsistencia" class="form-control form-control-sm" value="${hoy}">
        </div>
        <span class="badge bg-info text-dark">Tip: Toca A, F, R o J para avanzar</span>
    </div>
    <table class="table table-hover align-middle mb-0">
        <thead class="table-dark">
            <tr>
                <th class="ps-3">#</th>
                <th>NOMBRE DEL ALUMNO</th>
                <th class="text-center">ESTADO</th>
            </tr>
        </thead>
        <tbody>`;

  let count = 0;
  filas.forEach((linea, i) => {
    if (i === 0 || linea.trim() === "") return;
    const col = linea.split(/[,;\t]/);
    count++;

    html += `
      <tr id="fila_${count}" class="${count === 1 ? "fila-activa" : ""}">
          <td class="ps-3 text-muted small">${col[0]}</td>
          <td><strong>${col[2] || "Sin Nombre"}</strong><br><small class="text-muted">${col[1] || ""}</small></td>
          <td class="text-center">
              <div class="btn-group shadow-sm" role="group">
                  <input type="radio" class="btn-check" name="ast_${count}" id="a_${count}" value="A" checked onclick="manejarAvance(${count}, false)">
                  <label class="btn btn-outline-success btn-sm" for="a_${count}">A</label>

                  <input type="radio" class="btn-check" name="ast_${count}" id="f_${count}" value="F" onclick="manejarAvance(${count}, false)">
                  <label class="btn btn-outline-danger btn-sm" for="f_${count}">F</label>

                  <input type="radio" class="btn-check" name="ast_${count}" id="r_${count}" value="R" onclick="manejarAvance(${count}, false)">
                  <label class="btn btn-outline-warning btn-sm" for="r_${count}">R</label>

                  <input type="radio" class="btn-check" name="ast_${count}" id="j_${count}" value="J" onclick="manejarAvance(${count}, true)">
                  <label class="btn btn-outline-info btn-sm" for="j_${count}">J</label>
              </div>
              <div id="box_nota_${count}" class="mt-2" style="display:none">
                  <input type="text" id="nota_${count}" class="form-control form-control-sm" placeholder="Motivo...">
                  <button class="btn btn-primary btn-sm mt-1" onclick="avanzar(${count})">Continuar</button>
              </div>
          </td>
      </tr>`;
  });

  html += `</tbody></table>
      <div class="p-3 bg-white border-top">
          <button class="btn btn-primary w-100 btn-lg shadow" onclick="finalizarAsistencia()">💾 Guardar Reporte Final</button>
      </div>`;

  document.getElementById("resultadoCSV").innerHTML = html;
  document.getElementById("contenedorTabla").style.display = "block";
}

function manejarAvance(id, esJ) {
  if (esJ) {
    document.getElementById(`box_nota_${id}`).style.display = "block";
    document.getElementById(`nota_${id}`).focus();
  } else {
    document.getElementById(`box_nota_${id}`).style.display = "none";
    avanzar(id);
  }
}

function avanzar(id) {
  const actual = document.getElementById(`fila_${id}`);
  const siguiente = document.getElementById(`fila_${id + 1}`);

  actual.classList.remove("fila-activa");
  if (siguiente) {
    siguiente.classList.add("fila-activa");
    siguiente.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// 1. Definimos la función de Firebase afuera (para que sea más limpio)
async function guardarEnFirebase(reporte) {
  // VALIDACIÓN: Si window.fs aún no existe, no intentes desestructurar
  if (!window.fs) {
    console.warn(
      "☁️ Firebase aún no está listo. El reporte se guardó solo en el celular.",
    );
    return;
  }

  try {
    const { collection, addDoc } = window.fs; // Ahora ya no fallará
    const db = window.db;
    const docRef = await addDoc(collection(db, "asistencias"), reporte);
    console.log("✅ Sincronizado con la nube. ID:", docRef.id);
  } catch (e) {
    console.error("❌ Error de red:", e);
  }
}

function finalizarAsistencia() {
  const fecha = document.getElementById("fechaAsistencia").value;

  // Buscamos todos los botones de radio que están marcados (checked)
  const opcionesMarcadas = document.querySelectorAll(
    '#contenedorTabla input[type="radio"]:checked',
  );

  if (opcionesMarcadas.length === 0) {
    alert("⚠️ No hay ninguna lista activa para guardar.");
    return;
  }

  // Creamos el "sobre" donde guardaremos el reporte de hoy
  let reporteDelDia = {
    fecha: fecha,
    fechaCaptura: new Date().toISOString(), // Hora exacta en la que se guardó
    alumnos: [],
  };

  let conteo = { A: 0, F: 0, R: 0, J: 0 };

  // Recorremos cada botón marcado
  opcionesMarcadas.forEach((radio) => {
    // El id del radio es algo como "a_1", "f_2". Extraemos el número (1, 2, etc.)
    const idFila = radio.id.split("_")[1];

    // Vamos a la fila correspondiente para leer el nombre y número de lista
    const filaHTML = document.getElementById(`fila_${idFila}`);
    const columnas = filaHTML.getElementsByTagName("td");

    const noLista = columnas[0].innerText.trim();
    // Tomamos solo el nombre (ignoramos el número de control que está en el <small>)
    const nombreAlumno = columnas[1].innerText.split("\n")[0].trim();
    const estado = radio.value; // 'A', 'F', 'R' o 'J'

    // Si es justificante, atrapamos lo que escribiste en el cuadro de texto
    let nota = "";
    if (estado === "J") {
      nota = document.getElementById(`nota_${idFila}`).value;
    }

    // Sumamos al contador para el resumen final
    conteo[estado]++;

    // Metemos al alumno en el sobre
    reporteDelDia.alumnos.push({
      lista: noLista,
      nombre: nombreAlumno,
      estado: estado,
      nota: nota,
    });
  });

  // --- GUARDADO DOBLE ---
  // A. Guardar en local (Inmediato, siempre funciona)
  appData.historial.push(reporteDelDia);
  guardarEnLocal();
  renderizarReportes(); // Actualizamos la lista visual

  // B. Guardar en la nube (Segundo plano)
  guardarEnFirebase(reporteDelDia);
  // Ocultamos la tabla porque ya terminamos
  document.getElementById("contenedorTabla").style.display = "none";

  // Mostramos un resumen genial de lo que acaba de pasar
  alert(
    `✅ ¡Lista Guardada Exitosamente!\n\n📅 Fecha: ${fecha}\n\n📊 RESUMEN:\n✔️ Presentes: ${conteo.A}\n❌ Faltas: ${conteo.F}\n⏱️ Retardos: ${conteo.R}\n📝 Justificados: ${conteo.J}`,
  );
}

// --- 3. LÓGICA DE MAESTROS Y MATERIAS (CON MEMORIA) ---
function procesarMaestros() {
  const file = document.getElementById("csvMaestrosFile").files[0];
  if (!file) return alert("Selecciona un archivo de maestros");

  const lector = new FileReader();
  lector.onload = async (e) => {
    const lineas = e.target.result.split("\n");
    appData.maestros = []; // Limpiamos local

    // --- 1. PROCESAMIENTO LOCAL ---
    lineas.forEach((l, i) => {
      if (i === 0 || !l.trim()) return;
      // Usamos tu separador inteligente
      const datos = l.split(/[,;\t]/);
      if (datos.length >= 2) {
        appData.maestros.push({
          id: datos[0].trim(),
          nombre: datos[1].trim(),
        });
      }
    });

    // --- 2. GUARDADO EN NUBE (FIREBASE) ---
    // Verificamos si Firebase está listo
    if (window.fs && window.db) {
      const { collection, addDoc } = window.fs;
      const db = window.db;

      console.log("Subiendo maestros a la nube...");

      try {
        // Subimos cada maestro de uno por uno
        for (const maestro of appData.maestros) {
          await addDoc(collection(db, "profesores"), maestro);
        }
        console.log("✅ Nube actualizada");
      } catch (error) {
        console.error("❌ Error al subir a Firebase:", error);
      }
    }

    // --- 3. FINALIZAR ---
    guardarEnLocal(); // Tu función de siempre
    renderizarMaestros(); // Tu función de siempre
    alert(
      `Éxito: ${appData.maestros.length} maestros guardados en local y nube.`,
    );
  };

  lector.readAsText(file);
}

function renderizarMaestros() {
  let list = "";
  appData.maestros.forEach((m, index) => {
    list += `
      <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>
              👤 <strong>${m.nombre}</strong> <br>
              <small class="text-muted">ID: ${m.id}</small>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="borrarMaestro(${index})">
              🗑️ Eliminar
          </button>
      </div>`;
  });
  document.getElementById("listaMaestros").innerHTML =
    list || "<div class='text-muted p-2'>No hay maestros registrados.</div>";
}

function borrarMaestro(index) {
  // Un pequeño mensaje de confirmación para evitar dedazos accidentales
  if (confirm("¿Estás seguro de que deseas eliminar a este maestro?")) {
    // .splice() es una herramienta de JS que corta elementos de una lista
    // Le decimos: "Ve a la posición 'index' y borra 1 elemento"
    appData.maestros.splice(index, 1);

    guardarEnLocal(); // Guardamos el cambio en la memoria del celular
    renderizarMaestros(); // Volvemos a dibujar la lista ya sin ese maestro
  }
}
function borrarTodosMaestros() {
  if (
    confirm(
      "⚠️ ¿Estás seguro de eliminar a TODOS los maestros? Esta acción no se puede deshacer.",
    )
  ) {
    appData.maestros = []; // Convertimos la lista en una lista vacía
    guardarEnLocal();
    renderizarMaestros();
  }
}

function procesarMaterias() {
  const file = document.getElementById("csvMateriasFile").files[0];
  if (!file) return;
  const lector = new FileReader();
  lector.onload = (e) => {
    const lineas = e.target.result.split("\n");
    appData.materias = []; // Limpiamos la lista anterior

    lineas.forEach((l, i) => {
      if (i === 0 || !l.trim()) return;
      const datos = l.split(/[,;\t]/);
      appData.materias.push({ id: datos[0].trim(), nombre: datos[1].trim() });
    });

    guardarEnLocal();
    renderizarMaterias();
    alert("Materias guardadas permanentemente.");
  };
  lector.readAsText(file);
}

function renderizarMaterias() {
  let list = "";
  appData.materias.forEach((m) => {
    list += `<div class="list-group-item">📚 ${m.nombre} <small class="text-muted float-end">ID: ${m.id}</small></div>`;
  });
  document.getElementById("listaMaterias").innerHTML =
    list || "<div class='text-muted p-2'>No hay materias registradas.</div>";
}

// --- 4. LÓGICA DE ASIGNACIONES (EL MATCH) ---
function cargarSelectoresAsignaciones() {
  let htmlMaestros = '<option value="">Selecciona un maestro...</option>';
  appData.maestros.forEach((m) => {
    htmlMaestros += `<option value="${m.nombre}">${m.nombre}</option>`;
  });
  document.getElementById("selectMaestro").innerHTML = htmlMaestros;

  let htmlMaterias = '<option value="">Selecciona una materia...</option>';
  appData.materias.forEach((m) => {
    htmlMaterias += `<option value="${m.nombre}">${m.nombre}</option>`;
  });
  document.getElementById("selectMateria").innerHTML = htmlMaterias;
}

function crearAsignacion() {
  const maestro = document.getElementById("selectMaestro").value;
  const materia = document.getElementById("selectMateria").value;
  const grupo = document.getElementById("inputGrupo").value.toUpperCase(); // Ej: 3-A

  if (!maestro || !materia || !grupo) {
    alert("Por favor completa todos los campos.");
    return;
  }

  appData.asignaciones.push({ maestro, materia, grupo });
  guardarEnLocal();
  renderizarAsignaciones();
  document.getElementById("inputGrupo").value = ""; // Limpiamos el campo
}

function renderizarAsignaciones() {
  let list = "";
  appData.asignaciones.forEach((a, index) => {
    list += `
      <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>
              <strong>${a.maestro}</strong> da <em>${a.materia}</em>
              <span class="badge bg-primary ms-2">Grupo: ${a.grupo}</span>
          </div>
          <button class="btn btn-sm btn-danger" onclick="borrarAsignacion(${index})">X</button>
      </div>`;
  });
  document.getElementById("listaAsignaciones").innerHTML =
    list || "<div class='text-muted p-2'>No hay asignaciones creadas.</div>";
}

function borrarAsignacion(index) {
  appData.asignaciones.splice(index, 1);
  guardarEnLocal();
  renderizarAsignaciones();
}

/* // --- 5. INICIALIZACIÓN Y PWA ---
// Cuando la página cargue, pintamos los datos guardados
renderizarMaestros();
renderizarMaterias();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .catch((e) => console.log(e));
} */

// --- 6. MÓDULO DE REPORTES Y DESCARGAS ---

function renderizarReportes() {
  let list = "";
  appData.historial
    .slice()
    .reverse()
    .forEach((reporte, indexInvertido) => {
      const indexReal = appData.historial.length - 1 - indexInvertido;
      let a = 0,
        f = 0,
        r = 0,
        j = 0;
      reporte.alumnos.forEach((al) => {
        if (al.estado === "A") a++;
        if (al.estado === "F") f++;
        if (al.estado === "R") r++;
        if (al.estado === "J") j++;
      });

      list += `
        <div class="list-group-item d-flex justify-content-between align-items-center p-3">
            <div>
                <h5 class="mb-1">📅 ${reporte.fecha}</h5>
                <small class="text-muted">
                    <span class="text-success fw-bold">A: ${a}</span> | 
                    <span class="text-danger fw-bold">F: ${f}</span> | 
                    <span class="text-warning fw-bold">R: ${r}</span> | 
                    <span class="text-info fw-bold">J: ${j}</span>
                </small>
            </div>
            <button class="btn btn-success shadow-sm" onclick="descargarCSV(${indexReal})">
                📥 Descargar .CSV
            </button>
        </div>`;
    });
  document.getElementById("listaReportes").innerHTML =
    list ||
    "<div class='text-muted p-4 text-center'>Aún no hay listas guardadas.</div>";
}

function descargarCSV(index) {
  const reporte = appData.historial[index];
  let contenidoCSV = "NO LISTA,NOMBRE,ESTADO,NOTAS/JUSTIFICANTE\n";

  reporte.alumnos.forEach((al) => {
    let notaSegura = al.nota ? `"${al.nota}"` : "";
    contenidoCSV += `${al.lista},"${al.nombre}",${al.estado},${notaSegura}\n`;
  });

  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Asistencia_${reporte.fecha}.csv`;
  link.click();
}

function descargarSabanaFinal() {
  const nombre = document.getElementById("nombreUnidad").value || "Concentrado";
  const fInicio = document.getElementById("fechaInicioRep").value;
  const fFin = document.getElementById("fechaFinRep").value;

  if (!fInicio || !fFin) return alert("⚠️ Selecciona el rango de fechas.");

  const historialFiltrado = appData.historial.filter(
    (rep) => rep.fecha >= fInicio && rep.fecha <= fFin,
  );
  if (historialFiltrado.length === 0)
    return alert("🤷‍♂️ No hay datos en este rango.");

  // (Aquí va el resto de tu lógica de la sábana que ya tenías,
  // pero asegúrate de que termine con una llave '}' bien puesta)
}

function limpiarHistorialCompleto() {
  if (confirm("🚨 ¿Borrar TODO el historial?")) {
    appData.historial = [];
    guardarEnLocal();
    renderizarReportes();
  }
}

function descargarCSV(index) {
  const reporte = appData.historial[index];

  // 1. Preparamos los encabezados del archivo Excel/CSV
  let contenidoCSV = "NO LISTA,NOMBRE,ESTADO,NOTAS/JUSTIFICANTE\n";

  // 2. Llenamos el archivo con los datos de los alumnos
  reporte.alumnos.forEach((al) => {
    // Limpiamos la nota por si el maestro usó comas al escribir (para que no rompa el CSV)
    let notaSegura = al.nota ? `"${al.nota}"` : "";

    // Agregamos la fila del alumno
    contenidoCSV += `${al.lista},"${al.nombre}",${al.estado},${notaSegura}\n`;
  });

  // 3. Magia del navegador: Creamos un archivo invisible y forzamos la descarga
  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `Asistencia_${reporte.fecha}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function descargarSabanaFinal() {
  const nombre = document.getElementById("nombreUnidad").value || "Concentrado";
  const fInicio = document.getElementById("fechaInicioRep").value;
  const fFin = document.getElementById("fechaFinRep").value;

  if (!fInicio || !fFin) {
    alert(
      "⚠️ Por favor selecciona la fecha de inicio y la fecha de fin de la unidad.",
    );
    return;
  }

  const historialFiltrado = appData.historial.filter((rep) => {
    return rep.fecha >= fInicio && rep.fecha <= fFin;
  });

  if (historialFiltrado.length === 0) {
    alert("🤷‍♂️ No hay asistencias registradas en este rango.");
    return;
  }

  // Ordenamos cronológicamente
  historialFiltrado.sort(
    (a, b) => new Date(a.fechaCaptura) - new Date(b.fechaCaptura),
  );

  // AQUI ESTÁ LA MAGIA QUE ARREGLA TU ERROR: Usamos Fecha + Hora para que no se aplasten
  const columnasSesiones = historialFiltrado.map((rep) => {
    const fechaObj = new Date(rep.fechaCaptura);
    const horas = fechaObj.getHours().toString().padStart(2, "0");
    const minutos = fechaObj.getMinutes().toString().padStart(2, "0");
    // 2. Volteamos la fecha de YYYY-MM-DD a DD-MM-YY
    const [anio, mes, dia] = rep.fecha.split("-");
    // .slice(2) corta el "2026" y lo deja como "26"
    const fechaFormateada = `${dia}-${mes}-${anio.slice(2)}`;

    return {
      idUnico: rep.fechaCaptura,
      tituloColumna: `${fechaFormateada} [${horas}:${minutos}]`,
      alumnos: rep.alumnos,
    };
  });

  let alumnosConcen = {};

  columnasSesiones.forEach((sesion) => {
    sesion.alumnos.forEach((al) => {
      if (!alumnosConcen[al.lista]) {
        alumnosConcen[al.lista] = { nombre: al.nombre, historial: {} };
      }
      // Usamos el ID Único (con todo y hora) para que no se sobreescriban las Faltas
      alumnosConcen[al.lista].historial[sesion.idUnico] = al.estado;
    });
  });

  const encabezadosDias = columnasSesiones
    .map((s) => s.tituloColumna)
    .join(",");
  let csv = `NO LISTA,NOMBRE,${encabezadosDias},TOTAL ASISTENCIAS,TOTAL FALTAS,TOTAL RETARDOS,TOTAL JUSTIFICANTES\n`;

  const listaNumeros = Object.keys(alumnosConcen).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  listaNumeros.forEach((numLista) => {
    const al = alumnosConcen[numLista];
    let fila = `${numLista},"${al.nombre}"`;
    let tA = 0,
      tF = 0,
      tR = 0,
      tJ = 0;

    columnasSesiones.forEach((sesion) => {
      const estado = al.historial[sesion.idUnico] || "-";
      fila += `,${estado}`;

      if (estado === "A") tA++;
      if (estado === "F") tF++;
      if (estado === "R") tR++;
      if (estado === "J") tJ++;
    });

    fila += `,${tA},${tF},${tR},${tJ}\n`;
    csv += fila;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_${nombre}_${fInicio}_al_${fFin}.csv`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 6. MÓDULO DE REPORTES Y DESCARGAS (BLOQUE CORREGIDO) ---

function descargarCSV(index) {
  const reporte = appData.historial[index];
  if (!reporte) return;

  // 1. Preparamos los encabezados
  let contenidoCSV = "NO LISTA,NOMBRE,ESTADO,NOTAS/JUSTIFICANTE\n";

  // 2. Llenamos el archivo con los datos
  reporte.alumnos.forEach((al) => {
    let notaSegura = al.nota ? `"${al.nota}"` : "";
    contenidoCSV += `${al.lista},"${al.nombre}",${al.estado},${notaSegura}\n`;
  });

  // 3. Magia del navegador: Descarga del archivo
  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `Asistencia_${reporte.fecha}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} // <--- AQUÍ TERMINA descargarCSV

function generarReporteConcentrado() {
  const nombre = document.getElementById("nombreUnidad").value || "Concentrado";
  const fInicio = document.getElementById("fechaInicioRep").value;
  const fFin = document.getElementById("fechaFinRep").value;

  if (!fInicio || !fFin) {
    alert("⚠️ Por favor selecciona la fecha de inicio y fin.");
    return;
  }

  // 1. Filtramos historial
  const historialFiltrado = appData.historial.filter((rep) => {
    return rep.fecha >= fInicio && rep.fecha <= fFin;
  });

  if (historialFiltrado.length === 0) {
    alert("🤷‍♂️ No hay asistencias en este rango.");
    return;
  }

  // 2. Ordenamos cronológicamente
  historialFiltrado.sort(
    (a, b) => new Date(a.fechaCaptura) - new Date(b.fechaCaptura),
  );

  // 3. Creamos columnas (Fecha + Hora)
  const columnasSesiones = historialFiltrado.map((rep) => {
    const hora = new Date(rep.fechaCaptura).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      idOriginal: rep.fechaCaptura,
      tituloColumna: `${rep.fecha} [${hora}]`,
      alumnos: rep.alumnos,
    };
  });

  // 4. Agrupamos por alumno
  let alumnosConcen = {};
  columnasSesiones.forEach((sesion) => {
    sesion.alumnos.forEach((al) => {
      if (!alumnosConcen[al.lista]) {
        alumnosConcen[al.lista] = {
          nombre: al.nombre,
          historialPorSesion: {},
        };
      }
      alumnosConcen[al.lista].historialPorSesion[sesion.idOriginal] = al.estado;
    });
  });

  // 5. Armamos el CSV final (La Sábana)
  const encabezadosDias = columnasSesiones
    .map((s) => s.tituloColumna)
    .join(",");
  let csv = `NO LISTA,NOMBRE,${encabezadosDias},TOTAL A,TOTAL F,TOTAL R,TOTAL J\n`;

  const listaNumeros = Object.keys(alumnosConcen).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  listaNumeros.forEach((numLista) => {
    const al = alumnosConcen[numLista];
    let fila = `${numLista},"${al.nombre}"`;
    let tA = 0,
      tF = 0,
      tR = 0,
      tJ = 0;

    columnasSesiones.forEach((sesion) => {
      const estado = al.historialPorSesion[sesion.idOriginal] || "-";
      fila += `,${estado}`;
      if (estado === "A") tA++;
      if (estado === "F") tF++;
      if (estado === "R") tR++;
      if (estado === "J") tJ++;
    });

    fila += `,${tA},${tF},${tR},${tJ}\n`;
    csv += fila;
  });

  // 6. Descarga del reporte final
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Reporte_${nombre.replace(/ /g, "_")}_${fInicio}_al_${fFin}.csv`;
  link.click();
} // <--- AQUÍ TERMINA generarReporteConcentrado

function limpiarHistorialCompleto() {
  if (confirm("🚨 ¿Borrar todo el historial?")) {
    appData.historial = [];
    guardarEnLocal();
    renderizarReportes();
    alert("Historial limpio.");
  }
}

function switchModulo(moduloId) {
  // 1. Lista de todos tus contenedores de sección
  const modulos = [
    "modulo-asistencia",
    "modulo-reportes",
    "modulo-admin-csv",
    "modulo-maestros",
    "modulo-materias",
    "modulo-asignar",
  ];

  // 2. Ocultar todos
  modulos.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // 3. Mostrar el seleccionado
  // Nota: Si el moduloId es 'asistencia', el ID del div debe ser 'modulo-asistencia'
  const seleccionado = document.getElementById(`modulo-${moduloId}`);
  if (seleccionado) {
    seleccionado.style.display = "block";
  }

  // 4. (Opcional) Cerrar el menú en móviles después de hacer clic
  const navbarCollapse = document.getElementById("navbarNav");
  if (navbarCollapse.classList.contains("show")) {
    bootstrap.Collapse.getInstance(navbarCollapse).hide();
  }
}

async function procesarAdminCSV(tipoColeccion) {
  const inputId = `csv-${tipoColeccion}`;
  const fileInput = document.getElementById(inputId);

  if (!fileInput || !fileInput.files[0]) {
    return alert(`❌ Por favor, selecciona el archivo para ${tipoColeccion}`);
  }

  const file = fileInput.files[0];
  const lector = new FileReader();

  lector.onload = async (e) => {
    const contenido = e.target.result;
    const lineas = contenido.split("\n").filter((l) => l.trim() !== "");

    // Obtenemos los encabezados
    const encabezados = lineas[0]
      .split(/[,;\t]/)
      .map((h) => h.trim().toLowerCase());

    if (window.fs && window.db) {
      const { collection, addDoc } = window.fs;
      const db = window.db;
      let contador = 0;

      console.log(
        `🚀 Iniciando subida de ${lineas.length - 1} registros a: ${tipoColeccion}`,
      );

      for (let i = 1; i < lineas.length; i++) {
        const datos = lineas[i].split(/[,;\t]/);
        if (datos.length < 2) continue;

        let objetoParaSubir = {};
        encabezados.forEach((h, index) => {
          objetoParaSubir[h] = datos[index] ? datos[index].trim() : "";
        });

        try {
          // AGREGAMOS ESTO: Para ver el progreso en tiempo real
          await addDoc(collection(db, tipoColeccion), objetoParaSubir);
          contador++;
          console.log(
            `✅ [${contador}/${lineas.length - 1}] Guardado:`,
            objetoParaSubir.nombre || objetoParaSubir.id,
          );
        } catch (error) {
          console.error(`❌ Error en fila ${i}:`, error);
        }
      }

      alert(
        `✅ ¡Éxito! Se sincronizaron ${contador} registros en la colección ${tipoColeccion}.`,
      );
      fileInput.value = "";

      // Verificamos si la función existe antes de llamarla para que no truene el código
      if (typeof cargarMateriasDeNube === "function") {
        cargarMateriasDeNube();
      }
    } else {
      alert("❌ Error: Firebase no está conectado.");
    }
  };

  lector.readAsText(file);
}

async function cargarMateriasDeNube() {
  const contenedor = document.querySelector(
    "#modulo-materias #lista-asignaciones",
  );
  // Nota: Asegúrate de que en tu HTML tengas un <div id="lista-asignaciones"></div>

  if (!contenedor) return;
  contenedor.innerHTML = "Cargando datos de la nube... ⏳";

  try {
    const { collection, getDocs, query, orderBy } = window.fs;
    const db = window.db;

    // Pedimos la colección 'materias' (o 'grupos') ordenada por nombre
    const q = query(collection(db, "materias"), orderBy("nombre"));
    const querySnapshot = await getDocs(q);

    let html = '<ul class="list-group shadow-sm">';
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${data.nombre}</strong> <br>
                        <small class="text-muted">ID: ${data.id} | Maestro: ${data.id_maestro}</small>
                    </div>
                    <span class="badge bg-primary rounded-pill">Activo</span>
                </li>`;
    });
    html += "</ul>";

    contenedor.innerHTML = querySnapshot.empty
      ? "No hay materias registradas."
      : html;
  } catch (e) {
    console.error("Error al leer materias:", e);
    contenedor.innerHTML = "❌ No se pudieron cargar las materias.";
  }
}

// --- FUNCIÓN PARA VER MAESTROS EN GESTIÓN ---
async function renderizarMaestrosGestion() {
  const contenedor = document.getElementById("listaMaestros");
  if (!contenedor) return;
  contenedor.innerHTML =
    '<div class="text-center p-3">Cargando maestros...</div>';

  try {
    const { collection, getDocs } = window.fs;
    const snapshot = await getDocs(collection(window.db, "profesores"));

    let html = "";
    snapshot.forEach((doc) => {
      const m = doc.data();
      html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${m.nombre}</strong> <small class="text-muted">(ID: ${m.id})</small></span>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarDoc('profesores', '${doc.id}')">🗑️</button>
                </div>`;
    });
    contenedor.innerHTML = snapshot.empty
      ? "No hay maestros registrados."
      : html;
  } catch (e) {
    console.error(e);
  }
}

// --- FUNCIÓN PARA VER MATERIAS EN GESTIÓN ---
async function renderizarMateriasGestion() {
  const contenedor = document.getElementById("listaMaterias");
  if (!contenedor) return;
  contenedor.innerHTML =
    '<div class="text-center p-3">Cargando materias...</div>';

  try {
    const { collection, getDocs } = window.fs;
    const snapshot = await getDocs(collection(window.db, "materias")); // O "grupos", según como lo guardaste

    let html = "";
    snapshot.forEach((doc) => {
      const m = doc.data();
      html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span><strong>${m.nombre}</strong> <small class="text-muted">(Maestro: ${m.id_maestro})</small></span>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarDoc('materias', '${doc.id}')">🗑️</button>
                </div>`;
    });
    contenedor.innerHTML = snapshot.empty
      ? "No hay materias registradas."
      : html;
  } catch (e) {
    console.error(e);
  }
}

async function inicializarApp() {
  console.log("🚀 Intentando cargar maestros desde Firebase...");
  const selectMaestro = document.getElementById("select-maestro");

  if (!selectMaestro) {
    console.warn(
      "⚠️ No se encontró el elemento 'select-maestro'. Ignorando carga.",
    );
    return;
  }

  selectMaestro.innerHTML = '<option value="">Cargando maestros...</option>';

  try {
    // Verificamos que Firebase esté listo
    if (!window.fs || !window.db) {
      console.error("❌ Firebase no está listo todavía.");
      return;
    }

    const { collection, getDocs } = window.fs;
    const db = window.db;

    // Traemos los profesores de la nube
    const snapshot = await getDocs(collection(db, "profesores"));
    console.log(`📊 Se encontraron ${snapshot.size} maestros en la nube.`);

    let options = '<option value="">-- Selecciona tu nombre --</option>';
    snapshot.forEach((doc) => {
      const m = doc.data();
      options += `<option value="${m.id}">${m.nombre}</option>`;
    });

    selectMaestro.innerHTML = snapshot.empty
      ? '<option value="">No hay maestros registrados</option>'
      : options;
  } catch (e) {
    console.error("❌ Error al cargar maestros:", e);
    selectMaestro.innerHTML =
      '<option value="">Error al conectar con la nube</option>';
  }
}

async function cargarGruposDelMaestro() {
  const maestroId = document.getElementById("select-maestro").value;
  const selectGrupo = document.getElementById("select-grupo");

  // 1. Si el profe no ha seleccionado nada, bloqueamos el segundo cuadro
  if (!maestroId) {
    selectGrupo.disabled = true;
    selectGrupo.innerHTML =
      '<option value="">Primero elige un maestro</option>';
    return;
  }

  // 2. Preparamos el selector de grupos
  selectGrupo.disabled = false;
  selectGrupo.innerHTML = '<option value="">Cargando grupos...</option>';

  try {
    const { collection, getDocs, query, where } = window.fs;
    const db = window.db;

    // 3. CONSULTA FILTRADA: Buscamos en la colección 'materias'
    // IMPORTANTE: Asegúrate de que en Firebase tu colección se llame 'materias'
    const q = query(
      collection(db, "materias"),
      where("id_maestro", "==", maestroId),
    );

    const snapshot = await getDocs(q);
    console.log(
      `📚 Se encontraron ${snapshot.size} grupos para el maestro ${maestroId}`,
    );

    let options = '<option value="">-- Selecciona el grupo --</option>';

    snapshot.forEach((doc) => {
      const g = doc.data();
      // Usamos g.nombre y g.id (ajusta si tus columnas del CSV tenían otros nombres)
      options += `<option value="${g.id}">${g.nombre}</option>`;
    });

    if (snapshot.empty) {
      selectGrupo.innerHTML =
        '<option value="">No tienes grupos asignados</option>';
    } else {
      selectGrupo.innerHTML = options;
    }
  } catch (e) {
    console.error("❌ Error al cargar grupos:", e);
    selectGrupo.innerHTML = '<option value="">Error al cargar grupos</option>';
  }
}

// --- ESTO DEBE IR AL FINAL DE TODO TU ARCHIVO APP.JS ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("📱 App lista. Iniciando configuración...");
  inicializarApp();
});
