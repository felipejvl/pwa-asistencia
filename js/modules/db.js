import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
  doc,
  setDoc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function inicializarFirebase(config) {
  const app = initializeApp(config);

  // Configuración moderna para Offline (Cache persistente)
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

  window.db = db;
  return db;
}

export async function eliminarGrupo(idGrupo) {
  try {
    await deleteDoc(doc(window.db, "grupos", idGrupo));
    return true;
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    return false;
  }
}

// Función para guardar alumnos y registrar el grupo automáticamente
export async function guardarAlumnoConGrupo(alumno) {
  try {
    // 1. Guardar o Actualizar al Alumno (con su nuevo grupoId)
    const alumnoRef = doc(window.db, "alumnos", alumno.id);
    await setDoc(alumnoRef, alumno, { merge: true });

    // 2. 🔥 LA CLAVE: Registrar el grupo de forma automática
    // Si el alumno dice que es de "5A CONTABILIDAD", nos aseguramos que ese grupo exista
    const grupoRef = doc(window.db, "grupos", alumno.grupoId);

    await setDoc(
      grupoRef,
      {
        id: alumno.grupoId,
        nombreVisible: `${alumno.semestre}°${alumno.grupoLetra} ${alumno.especialidad}`,
        especialidad: alumno.especialidad,
        ciclo: alumno.ciclo,
        actualizadoEl: new Date().toISOString(),
      },
      { merge: true },
    ); // 'merge: true' evita borrar datos si el grupo ya existía

    return true;
  } catch (error) {
    console.error("Error en el guardado dual:", error);
    return false;
  }
}

// Función para borrar grupos (lo que pediste)
export async function eliminarGrupoCompleto(idGrupo) {
  if (
    !confirm(
      `¿Seguro que quieres borrar el grupo ${idGrupo}? Los alumnos quedarán sin grupo.`,
    )
  )
    return;
  try {
    await deleteDoc(doc(window.db, "grupos", idGrupo));
    return true;
  } catch (e) {
    return false;
  }
}

// Obtener todos los grupos para listarlos
export async function obtenerGrupos() {
  const querySnapshot = await getDocs(collection(window.db, "grupos"));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Buscar un alumno por su ID (No. Control)
export async function obtenerAlumno(idAlumno) {
  const docSnap = await getDoc(doc(window.db, "alumnos", idAlumno));
  return docSnap.exists() ? docSnap.data() : null;
}

// Actualizar datos del alumno
export async function actualizarAlumno(idAlumno, nuevosDatos) {
  const alumnoRef = doc(window.db, "alumnos", idAlumno);
  await updateDoc(alumnoRef, nuevosDatos);
}

export async function obtenerAlumnosPorGrupo(grupoId) {
  const q = query(
    collection(window.db, "alumnos"),
    where("grupoId", "==", grupoId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// js/modules/db.js

export async function eliminarAlumno(idAlumno) {
  try {
    const alumnoRef = doc(window.db, "alumnos", idAlumno);
    await deleteDoc(alumnoRef);
    return true;
  } catch (error) {
    console.error("Error al eliminar alumno:", error);
    return false;
  }
}
export async function guardarAsistencia(grupoId, fecha, registros) {
  try {
    const docId = `${grupoId}_${fecha}`;
    const asistenciaRef = doc(window.db, "asistencias", docId);

    await setDoc(
      asistenciaRef,
      {
        grupoId: grupoId,
        fecha: fecha,
        asistencias: registros,
        actualizadoEl: new Date().toISOString(),
      },
      { merge: true },
    );

    return true; // Si llegamos aquí, todo salió bien
  } catch (error) {
    console.error("❌ Error en db.js:", error);
    return false; // Si falla, avisamos al main.js
  }
}

export async function obtenerHistorialGrupo(grupoId) {
  const q = query(
    collection(window.db, "asistencias"),
    where("grupoId", "==", grupoId),
  );
  const querySnapshot = await getDocs(q);
  const historial = [];
  querySnapshot.forEach((doc) => {
    historial.push(doc.data());
  });
  // Ordenar por fecha reciente
  return historial.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
