// Utilidades de formato de presentación.

// Formatea un número como precio con separadores locales, en la moneda elegida
// por el usuario para ese pedido (USD o ARS).
export function formatoPrecio(valor, moneda = 'USD') {
  const n = Number(valor) || 0;
  return n.toLocaleString('es-AR', { style: 'currency', currency: moneda, minimumFractionDigits: 2 });
}

// Formatea una fecha ISO (YYYY-MM-DD) a formato legible dd/mm/aaaa.
export function formatoFecha(iso) {
  if (!iso) return '—';
  const soloFecha = String(iso).slice(0, 10);
  const [a, m, d] = soloFecha.split('-');
  if (!a || !m || !d) return iso;
  return `${d}/${m}/${a}`;
}

// Formatea un timestamp (YYYY-MM-DD HH:MM:SS) a dd/mm/aaaa HH:MM.
export function formatoFechaHora(ts) {
  if (!ts) return '—';
  const [fecha, hora = ''] = String(ts).split(/[ T]/);
  return `${formatoFecha(fecha)} ${hora.slice(0, 5)}`.trim();
}

// Muestra el país real: si es "Otro", usa el texto libre.
export function paisMostrar(pedido) {
  return pedido.pais_origen === 'Otro' && pedido.pais_otro
    ? pedido.pais_otro
    : pedido.pais_origen;
}
