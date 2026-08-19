// Utilidades de saneamiento de entradas.
// Aunque el frontend (React) escapa el HTML por defecto y la BD usa consultas
// parametrizadas, saneamos también en el servidor: defensa en profundidad.

// Caracteres de control ASCII (incluye el byte nulo). Se define con \x.. para no
// incrustar caracteres invisibles en el código fuente.
const CONTROL_CHARS = new RegExp('[\\x00-\\x1F\\x7F]', 'g');

// Quita etiquetas HTML, caracteres de control y recorta espacios.
// Neutraliza intentos básicos de XSS almacenado (por ejemplo <script>...</script>)
// antes de guardar en la BD.
export function limpiarTexto(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/<[^>]*>/g, '') // elimina cualquier etiqueta HTML
    .replace(CONTROL_CHARS, '') // elimina caracteres de control / bytes nulos
    .trim();
}

// Convierte a número seguro. Devuelve NaN si no es convertible.
export function aNumero(valor) {
  if (valor === '' || valor === null || valor === undefined) return NaN;
  return Number(valor);
}
