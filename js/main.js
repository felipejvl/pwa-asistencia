// ==========================================
// 🚀 CONTROLADOR PRINCIPAL - CBTa 47
// ==========================================

import { firebaseConfig } from "./config.js";
import {
  inicializarFirebase,
  guardarAlumnoConGrupo,
  obtenerGrupos,
  eliminarGrupo,
  obtenerAlumno,
  actualizarAlumno,
  obtenerAlumnosPorGrupo,
  eliminarAlumno,
  guardarAsistencia,
  obtenerHistorialGrupo,
} from "./modules/db.js";
import {
  renderizarAdminCSV,
  renderizarGestion,
  renderizarTablaAlumnos,
  renderizarPaseLista,
  renderizarHistorialAsistencia,
} from "./modules/ui.js";
import { parsearCSV, analizarAlumno } from "./modules/utils.js";

// ==========================================
// 🛠️ FUNCIONES DE APOYO (Lógica de Vistas)
// ==========================================

/**
 * Carga la vista de gestión de grupos y llena sus selectores
 */
async function cargarGestion() {
  const contenedor = document.getElementById("view-container");
  contenedor.innerHTML =
    '<div class="text-center mt-5">🔍 Cargando grupos...</div>';

  const grupos = await obtenerGrupos();
  renderizarGestion("view-container", grupos);
  popularDropdownEspecialidades(grupos);
}

/**
 * Carga la vista de administración de CSV y llena el selector de ciclos
 */
async function cargarVistaAdmin() {
  console.log("📂 Cambiando a vista de Administración...");
  renderizarAdminCSV("view-container");
  await actualizarDropdownCiclos();
}

/**
 * Cambia la clase 'active' en el menú de navegación
 */
function actualizarActivo(elemento) {
  document
    .querySelectorAll(".nav-link")
    .forEach((link) => link.classList.remove("active"));
  if (elemento) elemento.classList.add("active");
}

/**
 * Llena el select de especialidades en el modal basado en los grupos existentes
 */
function popularDropdownEspecialidades(grupos) {
  const select = document.getElementById("modal-edit-especialidad");
  if (!select) return;

  const especialidadesUnicas = [
    ...new Set(grupos.map((g) => g.especialidad)),
  ].sort();

  select.innerHTML =
    especialidadesUnicas.length > 0
      ? especialidadesUnicas
          .map((esp) => `<option value="${esp}">${esp}</option>`)
          .join("")
      : '<option value="">Sin especialidades cargadas</option>';

  select.innerHTML += `<option value="OTRA">-- OTRA --</option>`;
}

/**
 * Trae los ciclos de Firebase y los pone en el selector de carga
 */
async function actualizarDropdownCiclos() {
  const select = document.getElementById("select-ciclo-carga");
  if (!select) return;

  try {
    const grupos = await obtenerGrupos();
    const ciclos = [...new Set(grupos.map((g) => g.ciclo))].sort().reverse();

    let html =
      ciclos.length > 0
        ? ciclos.map((c) => `<option value="${c}">${c}</option>`).join("")
        : `<option value="NUEVO" selected>➕ Crear primer ciclo escolar...</option>`;

    html += `<option value="NUEVO">➕ Agregar nuevo ciclo...</option>`;
    select.innerHTML = html;
  } catch (error) {
    select.innerHTML = `<option value="NUEVO">➕ Agregar nuevo ciclo...</option>`;
  }
}

// ==========================================
// 🕹️ EVENTOS Y NAVEGACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Sistema CBTa 47 Iniciando...");

  try {
    inicializarFirebase(firebaseConfig);
    cargarGestion(); // Iniciamos en gestión por defecto
  } catch (error) {
    console.error("❌ Falló el arranque:", error);
  }

  // DELEGACIÓN DE CLICKS (Manejador único)
  document.addEventListener("click", async (e) => {
    const target = e.target;

    // --- 1. Navegación ---
    if (target.closest("#nav-carga") || target.closest("#nav-admin")) {
      e.preventDefault();
      actualizarActivo(target.closest(".nav-link"));
      await cargarVistaAdmin();
      return;
    }

    if (target.closest("#nav-gestion")) {
      e.preventDefault();
      actualizarActivo(target.closest(".nav-link"));
      await cargarGestion();
      return;
    }

    // --- 2. Acciones de CSV ---
    if (target.id === "btn-subir-alumnos") {
      const ciclo = document.getElementById("select-ciclo-carga").value;
      if (!ciclo || ciclo === "NUEVO")
        return alert("Selecciona un ciclo válido");

      const fileInput = document.getElementById("csv-alumnos");
      if (!fileInput?.files[0]) return alert("⚠️ Selecciona el CSV");

      const btn = target;
      const originalText = btn.innerHTML;
      btn.disabled = true;

      try {
        const texto = await fileInput.files[0].text();
        const filasRaw = parsearCSV(texto);
        let contador = 0;

        for (let i = 0; i < filasRaw.length; i++) {
          btn.innerHTML = `⏳ (${i + 1}/${filasRaw.length})`;
          const alumno = analizarAlumno(filasRaw[i], ciclo);
          if (alumno.id) {
            await guardarAlumnoConGrupo(alumno);
            contador++;
          }
        }
        alert(`✅ Carga exitosa: ${contador} alumnos.`);
        await cargarGestion();
      } catch (err) {
        alert("Error en proceso");
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }

    // --- 3. Gestión de Grupos ---
    const btnVer = target.closest(".btn-ver-alumnos");
    if (btnVer) {
      const alumnos = await obtenerAlumnosPorGrupo(btnVer.dataset.id);
      renderizarTablaAlumnos(alumnos);
    }

    const btnBorrarG = target.closest(".btn-borrar-grupo");
    if (btnBorrarG) {
      if (confirm("¿Borrar grupo?")) {
        await eliminarGrupo(btnBorrarG.dataset.id);
        await cargarGestion();
      }
    }

    // --- 4. Gestión de Alumnos (Modal) ---
    const btnEditar = target.closest(".btn-abrir-modal");
    if (btnEditar) {
      const alumno = await obtenerAlumno(btnEditar.dataset.id);
      if (alumno) {
        // Llenado de campos del modal
        [
          "id",
          "ciclo",
          "especialidad",
          "generacion",
          "grupoId",
          "grupoLetra",
          "materno",
          "paterno",
          "nombres",
          "semestre",
        ].forEach((campo) => {
          const el = document.getElementById(`modal-edit-${campo}`);
          if (el) el.value = alumno[campo] || "";
        });
        new bootstrap.Modal(
          document.getElementById("modalEditarAlumno"),
        ).show();
      }
    }

    if (target.id === "btn-modal-guardar") {
      e.preventDefault();
      const btn = target;

      // Bloqueamos para evitar doble clic
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Guardando...';

      // Guardamos el grupo donde estaba para refrescar la lista después
      const idGrupoAnterior =
        document.getElementById("modal-edit-grupoId").value;

      try {
        // Recogemos todos los datos del modal
        const id = document.getElementById("modal-edit-id").value;
        const pat = document
          .getElementById("modal-edit-paterno")
          .value.trim()
          .toUpperCase();
        const mat = document
          .getElementById("modal-edit-materno")
          .value.trim()
          .toUpperCase();
        const nom = document
          .getElementById("modal-edit-nombres")
          .value.trim()
          .toUpperCase();
        const nuevaEsp = document.getElementById(
          "modal-edit-especialidad",
        ).value;
        const nuevoSem = document.getElementById("modal-edit-semestre").value;
        const nuevaLetra = document
          .getElementById("modal-edit-grupoLetra")
          .value.toUpperCase();
        const ciclo = document.getElementById("modal-edit-ciclo").value;

        // Reconstruimos el grupoId por si lo movimos de semestre o especialidad
        const espCod = nuevaEsp.substring(0, 3).toUpperCase();
        const nuevoGrupoId = `${ciclo}_${nuevoSem}${nuevaLetra}_${espCod}`;

        const nuevosDatos = {
          id: id,
          paterno: pat,
          materno: mat,
          nombres: nom,
          nombre: `${pat} ${mat} ${nom}`.trim(),
          especialidad: nuevaEsp,
          semestre: nuevoSem,
          grupoLetra: nuevaLetra,
          grupoId: nuevoGrupoId,
          ciclo: ciclo,
          generacion: document.getElementById("modal-edit-generacion").value,
          actualizadoEl: new Date().toISOString(),
        };

        // 1. Actualizamos al alumno en Firebase
        await actualizarAlumno(id, nuevosDatos);

        // 2. Aseguramos que el nuevo grupo exista (por si se movió de carrera)
        await guardarAlumnoConGrupo(nuevosDatos);

        // 3. Cerramos el modal de Bootstrap
        const modalEl = document.getElementById("modalEditarAlumno");
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        // 4. REFRESCAMOS SOLO LA TABLA DE ALUMNOS
        // Si lo moviste de grupo, desaparecerá de esta lista.
        // Si solo editaste el nombre, se actualizará ahí mismo.
        const alumnosRefrescados =
          await obtenerAlumnosPorGrupo(idGrupoAnterior);
        renderizarTablaAlumnos(alumnosRefrescados);

        if (idGrupoAnterior !== nuevoGrupoId) {
          // Si se movió, refrescamos TODA la gestión para que aparezca el botón del nuevo grupo
          console.log(
            "🔄 El grupo es nuevo o diferente, refrescando lista de grupos...",
          );
          await cargarGestion();
          alert(`✅ Alumno movido a ${nuevaEsp} ${nuevoSem}°${nuevaLetra}`);
        } else {
          // Si se quedó en el mismo grupo, solo refrescamos la tabla de la derecha (rápido y sin parpadeo)
          const alumnosRefrescados =
            await obtenerAlumnosPorGrupo(idGrupoAnterior);
          renderizarTablaAlumnos(alumnosRefrescados);
          alert(`✅ Datos actualizados correctamente.`);
        }

        alert(`✅ Alumno actualizado correctamente.`);
      } catch (error) {
        console.error("❌ Error al guardar:", error);
        alert("Hubo un error al guardar los cambios.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = "Guardar Cambios";
      }
    }

    const btnEliminar = target.closest(".btn-eliminar-alumno");
    if (btnEliminar) {
      if (confirm(`¿Borrar a ${btnEliminar.dataset.nombre}?`)) {
        await eliminarAlumno(btnEliminar.dataset.id);
        // Refresco quirúrgico
        const gId = document.getElementById("modal-edit-grupoId")?.value;
        if (gId) renderizarTablaAlumnos(await obtenerAlumnosPorGrupo(gId));
      }
    }

    // ... dentro de document.addEventListener("click", async (e) => {

    // 1. Buscamos si el clic fue en el botón de VER (usando closest)
    // Esta es la declaración que le faltaba a tu "scope"

    // 2. Si existe (es decir, si el clic fue ahí), ejecutamos la lógica
    if (btnVer) {
      const grupoId = btnVer.dataset.id;
      console.log("📂 Cargando alumnos de:", grupoId);

      // Llamamos a la base de datos
      const alumnos = await obtenerAlumnosPorGrupo(grupoId);

      // Pintamos la tabla
      renderizarTablaAlumnos(alumnos);
      return; // Salimos para no evaluar los demás botones
    }

    // --- Repetimos la misma lógica para el botón de ASISTENCIA ---
    const btnPase = e.target.closest(".btn-pase-lista");
    if (btnPase) {
      const grupoId = btnPase.dataset.id;
      console.log("📝 Abriendo pase de lista para:", grupoId);

      const alumnos = await obtenerAlumnosPorGrupo(grupoId);
      alumnos.sort((a, b) => a.paterno.localeCompare(b.paterno));

      renderizarPaseLista("view-container", grupoId, alumnos);
      return;
    }

    // ... rest de los botones
  });
});

// --- Evento para crear ciclos nuevos ---
document.addEventListener("change", (e) => {
  if (e.target.id === "select-ciclo-carga" && e.target.value === "NUEVO") {
    const nuevo = prompt("Ingresa el nuevo Ciclo (Ej: 2026-2):");
    if (nuevo && /^\d{4}-[1-2]$/.test(nuevo)) {
      const opt = new Option(nuevo, nuevo, true, true);
      e.target.add(opt, e.target.firstChild);
      e.target.value = nuevo;
    } else {
      alert("Formato inválido.");
      actualizarDropdownCiclos();
    }
  }
});

// js/main.js

// 1. EL ESCUCHADOR DEBE SER ASYNC
document.addEventListener("click", async (e) => {
  // <--- ¡ESTE ASYNC ES LA CLAVE!

  // ... otros botones (Ver, Editar, etc.) ...

  // 2. TU BLOQUE DE GUARDAR ASISTENCIA
  if (e.target.id === "btn-guardar-asistencia") {
    e.preventDefault();
    const btn = e.target;
    const grupoId = btn.dataset.grupoid;
    const fecha = document.getElementById("fecha-asistencia").value;

    console.log(
      "📡 Intentando guardar asistencia para:",
      grupoId,
      "en la fecha:",
      fecha,
    );

    const registros = {};
    const filas = document.querySelectorAll(".fila-alumno");

    // Recolectamos datos (esto es sincrónico, no necesita await)
    filas.forEach((fila) => {
      const idAlumno = fila.dataset.id;
      const input = fila.querySelector(
        `input[name="asist-${idAlumno}"]:checked`,
      );
      if (input) {
        registros[idAlumno] = input.value;
      }
    });

    console.log("📝 Datos recolectados:", registros);

    if (Object.keys(registros).length === 0) {
      return alert("⚠️ No se encontraron registros de alumnos para guardar.");
    }

    // UI: Bloqueamos botón
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Guardando...`;

    try {
      const exito = await guardarAsistencia(grupoId, fecha, registros);

      if (exito) {
        alert("✅ ¡Asistencia guardada con éxito!");

        // 1. Traemos todos los pases de lista anteriores de este grupo
        console.log("📂 Consultando historial de:", grupoId);
        const historial = await obtenerHistorialGrupo(grupoId);

        // 2. Mandamos al usuario a la vista de historial
        // Esta función la creamos en ui.js (la que te pasé en el turno anterior)
        renderizarHistorialAsistencia("view-container", grupoId, historial);
      } else {
        alert("❌ No se pudo guardar en Firebase.");
      }
    } catch (err) {
      console.error("🔥 Error crítico:", err);
    }
  }
});
