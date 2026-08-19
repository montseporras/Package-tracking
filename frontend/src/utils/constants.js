// Constantes de dominio del lado del cliente.
// Se mantienen sincronizadas con el backend (utils/constants.js).

// La Declaración Jurada ya no es un estado: es un atributo propio del pedido (`tiene_dj`).
export const ESTADOS = ['En espera', 'En camino', 'Recibido'];

export const PAISES = ['China', 'Turquía', 'Estados Unidos', 'Argentina', 'Otro'];

// Monedas en las que se puede expresar el precio total. Elegible por el usuario.
export const MONEDAS = ['USD', 'ARS'];

// Mapea cada estado a la clase de badge correspondiente (color identificativo).
export const ESTADO_CLASE = {
  'En espera': 'espera',
  'En camino': 'camino',
  Recibido: 'recibido',
};

// Opciones de ordenamiento del listado (clave -> etiqueta).
export const ORDENES = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'precio', label: 'Precio' },
  { key: 'proveedor', label: 'Proveedor' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'pais', label: 'País' },
];

export const MAX = {
  numero_pedido: 50,
  pais_otro: 80,
  proveedor: 120,
  empresa: 120,
  descripcion: 1000,
  numero_dj: 80,
  observaciones: 1000,
};
