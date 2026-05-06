// js/modules/ui.js

// 1. Vista de Carga de CSV (Panel Amarillo)
export function renderizarAdminCSV(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = `
                <div class="card shadow border-warning">
                <div class="card-header bg-warning text-dark fw-bold">🚀 Carga Masiva de Alumnos</div>
                <div class="card-body">
                    <div class="row g-3">
                    <div class="col-md-5">
                        <label class="small fw-bold">1. Ciclo Escolar:</label>
                        <select id="select-ciclo-carga" class="form-select border-warning">
                        <option value="">Cargando ciclos...</option>
                        </select>
                    </div>
                    <div class="col-md-7">
                        <label class="small fw-bold">2. Archivo CSV:</label>
                        <div class="input-group">
                        <input type="file" class="form-control" id="csv-alumnos" accept=".csv">
                        <button class="btn btn-dark" id="btn-subir-alumnos">Subir</button>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            `;
}

// js/modules/ui.js -> Reemplaza la parte del Modal dentro de renderizarGestion

export function renderizarGestion(contenedorId, grupos) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  // Estructura del Modal (Sin el campo de Nombre Completo para mayor limpieza)
  const modalHtml = `
    <div class="modal fade" id="modalEditarAlumno" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">✏️ Editar Ficha del Alumno</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="form-modal-alumno">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">No. Control (ID)</label>
                        <input type="text" id="modal-edit-id" class="form-control bg-light" readonly>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Ciclo</label>
                        <input type="text" id="modal-edit-ciclo" class="form-control" placeholder="Ej: 2026-1">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Generación</label>
                        <input type="text" id="modal-edit-generacion" class="form-control" placeholder="Ej: 2024">
                    </div>

                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Paterno</label>
                        <input type="text" id="modal-edit-paterno" class="form-control">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Materno</label>
                        <input type="text" id="modal-edit-materno" class="form-control">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small fw-bold">Nombre(s)</label>
                        <input type="text" id="modal-edit-nombres" class="form-control">
                    </div>

                    <div class="col-md-6">
                        <label class="small fw-bold text-primary">Especialidad</label>
                        <select id="modal-edit-especialidad" class="form-select border-primary">
                            <option value="">Cargando especialidades...</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Semestre</label>
                        <input type="text" id="modal-edit-semestre" class="form-control">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Letra</label>
                        <input type="text" id="modal-edit-grupoLetra" class="form-control">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small fw-bold">Grupo ID</label>
                        <input type="text" id="modal-edit-grupoId" class="form-control bg-light" readonly>
                    </div>
                </div>
            </form>
          </div>
          <div class="modal-footer bg-light">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" id="btn-modal-guardar" class="btn btn-success px-4">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
    `;

  contenedor.innerHTML = `
        <div class="row">
            <div class="col-md-5">
                <div class="card shadow-sm">
                    <div class="card-header bg-dark text-white">📦 Grupos Activos (CBTa 47)</div>
                    <div class="card-body p-0">
                        <table class="table table-hover mb-0">
                            <tbody>${grupos
                              .map(
                                (g) => `
                                <tr>
                                    <td>
                                        <button class="btn btn-link btn-sm fw-bold text-decoration-none btn-ver-alumnos" data-id="${g.id}">
                                            📂 ${g.nombreVisible || g.id}
                                        </button>
                                    </td>
                                    
                                    <td class="text-end"> <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-outline-primary btn-ver-alumnos" data-id="${g.id}">
                                                👁️ Ver
                                            </button>

                                            <button class="btn btn-sm btn-outline-success btn-pase-lista" data-id="${g.id}">
                                                📋 Pasar Lista
                                            </button>
                                                                            

                                        <button class="btn btn-outline-danger btn-sm btn-borrar-grupo" data-id="${g.id}">🗑️</button>
                                    </td>
                                </tr>
                            `,
                              )
                              .join("")}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div id="lista-alumnos-container" class="col-md-7">
                <div class="text-center text-muted mt-5">Selecciona un grupo para gestionar alumnos...</div>
            </div>
        </div>
        ${modalHtml}
    `;
}

// Nueva función para pintar la lista de alumnos al darle clic al grupo
export function renderizarTablaAlumnos(alumnos) {
  const listaContenedor = document.getElementById("lista-alumnos-container");
  if (!listaContenedor) return;

  const filas = alumnos
    .map(
      (a) => `
        <tr>
            <td class="small align-middle">${a.nombre}</td>
            <td class="text-end">
                <div class="btn-group shadow-sm">
                    <button class="btn btn-sm btn-outline-primary btn-abrir-modal" 
                        data-id="${a.id}" title="Editar Alumno">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar-alumno" 
                        data-id="${a.id}" 
                        data-nombre="${a.nombre}" title="Eliminar Alumno">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>`,
    )
    .join("");

  listaContenedor.innerHTML = `
        <div class="card shadow-sm border-primary">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span class="fw-bold">👥 Alumnos en este grupo</span>
                <span class="badge bg-white text-primary rounded-pill">${alumnos.length}</span>
            </div>
            <div class="card-body p-0" style="max-height: 500px; overflow-y: auto;">
                <table class="table table-sm table-striped table-hover mb-0">
                    <tbody>${filas || '<tr><td colspan="2" class="text-center p-4 text-muted">No hay alumnos registrados en este grupo.</td></tr>'}</tbody>
                </table>
            </div>
        </div>`;
}

export function renderizarPaseLista(contenedorId, grupoId, alumnos) {
  const contenedor = document.getElementById(contenedorId);
  const hoy = new Date().toISOString().split("T")[0];

  contenedor.innerHTML = `
    <div class="card shadow border-primary mb-4">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">📋 Pase de Lista: ${grupoId}</h5>
        <input type="date" id="fecha-asistencia" class="form-control form-control-sm w-auto" value="${hoy}">
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Alumno</th>
                <th class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody id="tabla-asistencia-body">
              ${alumnos
                .map(
                  (al) => `
                <tr data-id="${al.id}" class="fila-alumno">
                  <td>
                    <div class="fw-bold text-uppercase small">${al.paterno} ${al.materno}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">${al.nombres}</div>
                  </td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                      <input type="radio" class="btn-check" name="asist-${al.id}" id="a-${al.id}" value="A" checked>
                      <label class="btn btn-outline-success" for="a-${al.id}">A</label>

                      <input type="radio" class="btn-check" name="asist-${al.id}" id="f-${al.id}" value="F">
                      <label class="btn btn-outline-danger" for="f-${al.id}">F</label>

                      <input type="radio" class="btn-check" name="asist-${al.id}" id="r-${al.id}" value="R">
                      <label class="btn btn-outline-warning" for="r-${al.id}">R</label>

                      <input type="radio" class="btn-check" name="asist-${al.id}" id="j-${al.id}" value="J">
                      <label class="btn btn-outline-info" for="j-${al.id}">J</label>
                    </div>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer d-grid">
        <button id="btn-guardar-asistencia" class="btn btn-primary" data-grupoid="${grupoId}">
          💾 Guardar Pase de Lista
        </button>
      </div>
    </div>
  `;
}

// js/modules/ui.js

export function renderizarHistorialAsistencia(
  contenedorId,
  grupoId,
  registrosHistorial,
) {
  const contenedor = document.getElementById(contenedorId);

  contenedor.innerHTML = `
        <div class="card shadow border-info">
            <div class="card-header bg-info text-white d-flex justify-content-between">
                <h5 class="mb-0">📅 Historial: ${grupoId}</h5>
                <button class="btn btn-light btn-sm btn-pase-lista" data-id="${grupoId}">+ Nuevo Pase</button>
            </div>
            <div class="list-group list-group-flush">
                ${
                  registrosHistorial.length > 0
                    ? registrosHistorial
                        .map((reg) => {
                          const fechaFormateada = new Date(
                            reg.fecha + "T12:00:00",
                          ).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          });
                          return `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="fw-bold">${fechaFormateada}</span>
                                    <br><small class="text-muted">Actualizado: ${new Date(reg.actualizadoEl).toLocaleTimeString()}</small>
                                </div>
                                <button class="btn btn-outline-primary btn-sm btn-ver-asistencia-dia" 
                                        data-grupoid="${grupoId}" data-fecha="${reg.fecha}">
                                    👁️ Ver
                                </button>
                            </div>
                        `;
                        })
                        .join("")
                    : '<div class="p-3 text-center">No hay pases de lista registrados aún.</div>'
                }
            </div>
            <div class="card-footer">
                <button class="btn btn-secondary btn-sm" id="nav-gestion">⬅️ Volver a Grupos</button>
            </div>
        </div>
    `;
}
