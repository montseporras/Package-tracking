// Cliente HTTP hacia la API. Centraliza fetch, manejo de errores y endpoints.
// En desarrollo, Vite hace proxy de /api al backend (ver vite.config.js).

const BASE = '/api';

// Envoltura de fetch con manejo de errores uniforme.
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    // Error de red (backend caído, sin conexión, etc.)
    throw new ApiError('No se pudo conectar con el servidor. ¿Está corriendo el backend?', 0, {});
  }

  let data = null;
  const texto = await res.text();
  if (texto) {
    try { data = JSON.parse(texto); } catch { data = null; }
  }

  if (!res.ok) {
    const msg = data?.error || `Error ${res.status}`;
    throw new ApiError(msg, res.status, data?.errores || {});
  }
  return data;
}

// Error de API con código y errores de validación por campo.
export class ApiError extends Error {
  constructor(message, status, errores) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errores = errores || {};
  }
}

// Construye un query string a partir de un objeto (ignora vacíos).
function qs(params = {}) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined) usp.append(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  meta: () => request('/meta'),
  resumen: () => request('/pedidos/stats/resumen'),

  listarPedidos: (filtros) => request(`/pedidos${qs(filtros)}`),
  obtenerPedido: (id) => request(`/pedidos/${id}`),
  crearPedido: (datos) => request('/pedidos', { method: 'POST', body: JSON.stringify(datos) }),
  actualizarPedido: (id, datos) =>
    request(`/pedidos/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  cambiarEstado: (id, estado) =>
    request(`/pedidos/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
  duplicarPedido: (id) => request(`/pedidos/${id}/duplicar`, { method: 'POST' }),
  eliminarPedido: (id) => request(`/pedidos/${id}`, { method: 'DELETE' }),
};
