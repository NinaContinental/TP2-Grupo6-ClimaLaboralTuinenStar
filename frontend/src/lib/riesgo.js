// Utilidades compartidas de presentacion (no tocan la logica del backend).

export const MAXIMO = 4;

// Zonas de riesgo de la escala 0-4. Reflejan las filas de regla_umbral del
// script SQL (BAJO 0-1.99, MEDIO 2-2.99, ALTO 3-4). Si cambian alla,
// actualizar aqui. La fuente oficial del nivel de una alerta es siempre la
// columna nivel_riesgo que devuelve el backend; esto solo sirve para pintar
// la escala y el nivel referencial del dashboard.
export const ZONAS = [
  { nivel: 'BAJO', desde: 0, hasta: 2 },
  { nivel: 'MEDIO', desde: 2, hasta: 3 },
  { nivel: 'ALTO', desde: 3, hasta: 4 }
];

export const ETIQUETA_NIVEL = {
  BAJO: 'Riesgo bajo',
  MEDIO: 'Riesgo medio',
  ALTO: 'Riesgo alto'
};

export const ETIQUETA_ROL = {
  TI: 'Administrador TI',
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
  RRHH: 'Recursos Humanos',
  GERENCIA: 'Gerencia'
};

export function nivelDe(promedio) {
  const p = Number(promedio);
  if (p >= 3) return 'ALTO';
  if (p >= 2) return 'MEDIO';
  return 'BAJO';
}

// utc=true para columnas DATE (llegan como medianoche UTC y no deben
// moverse de dia segun la zona horaria del navegador).
export function formatearFecha(valor, utc = true) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
  if (utc) opciones.timeZone = 'UTC';
  return d.toLocaleDateString('es-PE', opciones);
}

export function primerNombre(nombre) {
  return (nombre || '').trim().split(/\s+/)[0] || '';
}

export function iniciales(nombre) {
  const partes = (nombre || '').trim().split(/\s+/).filter(Boolean);
  const texto = (partes[0]?.[0] || '') + (partes[1]?.[0] || '');
  return texto.toUpperCase() || '?';
}
