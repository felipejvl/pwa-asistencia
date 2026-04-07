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
  localStorage.setItem("app_alumnos", JSON.stringify(appData.alumnos)); // <--- ¡NUEVO!
  localStorage.setItem("app_maestros", JSON.stringify(appData.maestros));
  localStorage.setItem("app_materias", JSON.stringify(appData.materias));
  localStorage.setItem(
    "app_asignaciones",
    JSON.stringify(appData.asignaciones),
  );
  localStorage.setItem("app_historial", JSON.stringify(appData.historial)); // <--- ¡Nuevo!
}

// --- 1. NAVEGACIÓN SPA ---
function switchModulo(modulo) {
  document
    .querySelectorAll(".modulo-seccion")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));

  document.getElementById("modulo-" + modulo).classList.add("active");
  document.getElementById("link-" + modulo).classList.add("active");

  if (modulo === "asignar") {
    cargarSelectoresAsignaciones();
    renderizarAsignaciones();
  }
  // ¡NUEVO! Si entramos a reportes, dibujamos el historial
  if (modulo === "reportes") {
    renderizarReportes();
  }
}

// --- 2. LÓGICA DE ALUMNOS Y ASISTENCIA ---
document
  .getElementById("csvAlumnosForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const lector = new FileReader();
    lector.onload = (ev) => mostrarTablaAsistencia(ev.target.result);
    lector.readAsText(document.getElementById("csvFile").files[0]);
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
  if (!file) return;
  const lector = new FileReader();
  lector.onload = (e) => {
    const lineas = e.target.result.split("\n");
    appData.maestros = []; // Limpiamos la lista anterior

    lineas.forEach((l, i) => {
      if (i === 0 || !l.trim()) return;
      const datos = l.split(/[,;\t]/);
      appData.maestros.push({ id: datos[0].trim(), nombre: datos[1].trim() }); // Guardamos en el cerebro
    });

    guardarEnLocal(); // Guardamos la partida
    renderizarMaestros(); // Dibujamos en pantalla
    alert("Maestros guardados permanentemente.");
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

  // Recorremos el historial al revés (.slice().reverse()) para ver el más nuevo primero
  appData.historial
    .slice()
    .reverse()
    .forEach((reporte, indexInvertido) => {
      // Calculamos el índice real original porque lo volteamos
      const indexReal = appData.historial.length - 1 - indexInvertido;

      // Contamos rápido cuántos vinieron para mostrar un resumen en la tarjeta
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
    "<div class='text-muted p-4 text-center'>Aún no hay listas guardadas en el historial.</div>";
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

  function generarReporteConcentrado() {
    const nombre =
      document.getElementById("nombreUnidad").value || "Concentrado";
    const fInicio = document.getElementById("fechaInicioRep").value;
    const fFin = document.getElementById("fechaFinRep").value;

    if (!fInicio || !fFin) {
      alert(
        "⚠️ Por favor selecciona la fecha de inicio y la fecha de fin de la unidad.",
      );
      return;
    }

    // 1. Filtramos el historial por rango de fechas
    const historialFiltrado = appData.historial.filter((rep) => {
      return rep.fecha >= fInicio && rep.fecha <= fFin;
    });

    if (historialFiltrado.length === 0) {
      alert("🤷‍♂️ No hay asistencias registradas en este rango de fechas.");
      return;
    }

    // 2. Ordenamos cronológicamente por la hora exacta en que se guardó
    historialFiltrado.sort(
      (a, b) => new Date(a.fechaCaptura) - new Date(b.fechaCaptura),
    );

    // ¡NUEVA MAGIA!: Creamos columnas únicas usando Fecha + Hora
    // Ejemplo: "2026-03-28 [10:30]"
    const columnasSesiones = historialFiltrado.map((rep) => {
      // Extraemos solo la hora y minuto de cuando le diste al botón guardar
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

    // 3. Agrupamos los datos por alumno
    let alumnosConcen = {};

    columnasSesiones.forEach((sesion) => {
      sesion.alumnos.forEach((al) => {
        if (!alumnosConcen[al.lista]) {
          alumnosConcen[al.lista] = {
            nombre: al.nombre,
            historialPorSesion: {},
          };
        }
        // Guardamos la letra (A, F, R, J) vinculada a la FECHA y HORA exactas
        alumnosConcen[al.lista].historialPorSesion[sesion.idOriginal] =
          al.estado;
      });
    });

    // 4. Armamos el archivo CSV (La sábana)
    // Juntamos todos los títulos de las columnas (ej. "28/03 [10:00],28/03 [11:30]")
    const encabezadosDias = columnasSesiones
      .map((s) => s.tituloColumna)
      .join(",");
    let csv = `NO LISTA,NOMBRE,${encabezadosDias},TOTAL ASISTENCIAS,TOTAL FALTAS,TOTAL RETARDOS,TOTAL JUSTIFICANTES\n`;

    // Ordenamos a los alumnos numéricamente por número de lista
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

      // Llenamos la fila del alumno pasando por cada sesión grabada
      columnasSesiones.forEach((sesion) => {
        const estado = al.historialPorSesion[sesion.idOriginal] || "-";
        fila += `,${estado}`;

        // Sumamos los totales reales
        if (estado === "A") tA++;
        if (estado === "F") tF++;
        if (estado === "R") tR++;
        if (estado === "J") tJ++;
      });

      fila += `,${tA},${tF},${tR},${tJ}\n`;
      csv += fila;
    });

    // 5. Descargamos el archivo final
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    link.download = `Reporte_${nombre.replace(/ /g, "_")}_${fInicio}_al_${fFin}.csv`;
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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

function limpiarHistorialCompleto() {
  if (
    confirm(
      "🚨 ¡ADVERTENCIA! ¿Estás seguro de que quieres borrar TODO el historial de asistencias de tu dispositivo? Esta acción no se puede deshacer.",
    )
  ) {
    appData.historial = []; // Vaciamos el cerebro
    guardarEnLocal(); // Guardamos el cerebro vacío
    renderizarReportes(); // Actualizamos la pantalla
    alert(
      "🧹 Historial borrado exitosamente. Todo está limpio y listo para usarse.",
    );
  }
}
