// js/modules/utils.js

// Función interna para estirar los números que Excel acorta (ej. 2.41E+13)
const forzarTextoLargo = (val) => {
  if (!val) return "";
  let str = val.toString().trim();
  if (str.toUpperCase().includes("E+")) {
    return Number(val).toLocaleString("fullwide", { useGrouping: false });
  }
  return str;
};

export function analizarAlumno(fila, cicloActivo) {
  const seguro = (val) => (val || "").toString().trim().toUpperCase();

  // 1. Limpiamos el No_Control (ID)
  const control = forzarTextoLargo(fila["no_control"]);

  // 2. Limpiamos nombres y apellidos
  const apPaterno = seguro(fila["apellidos_paterno"]);
  const apMaterno = seguro(fila["apellido_materno"]);
  const nombre = seguro(fila["nombre"]);

  // 3. Datos escolares
  const semestre = fila["semestre"] || "0";
  const especialidad = seguro(fila["especialidad"] || "SIN_ESP");
  const grupoLetra = seguro(fila["grupo"] || "X");

  // 4. Lógica de generación e IDs
  const anio = control.substring(0, 2);
  const generacion = anio ? `20${anio}` : "Desconocida";
  const especialidadCod = especialidad.substring(0, 3);
  const grupoId = `${cicloActivo}_${semestre}${grupoLetra}_${especialidadCod}`;

  return {
    id: control,
    nombre: `${apPaterno} ${apMaterno} ${nombre}`.trim(),
    paterno: apPaterno,
    materno: apMaterno,
    nombres: nombre,
    generacion: generacion,
    grupoId: grupoId,
    semestre: semestre,
    especialidad: especialidad,
    grupoLetra: grupoLetra,
    ciclo: cicloActivo,
    actualizadoEl: new Date().toISOString(),
  };
}

export function parsearCSV(texto) {
  const lineas = texto.split("\n").filter((l) => l.trim() !== "");
  const encabezados = lineas[0]
    .split(/[,;\t]/)
    .map((h) => h.trim().toLowerCase().replace(".", ""));

  return lineas.slice(1).map((linea) => {
    const valores = linea.split(/[,;\t]/);
    let objeto = {};
    encabezados.forEach((h, i) => {
      objeto[h] = valores[i] ? valores[i].trim() : "";
    });
    return objeto;
  });
}
