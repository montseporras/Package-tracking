// Valores de dominio compartidos por toda la API.

// Estados posibles de un pedido. El orden define también el orden lógico del flujo.
// La Declaración Jurada ya no es un estado: es un atributo propio del pedido (ver `tiene_dj`).
export const ESTADOS = ['En espera', 'En camino', 'Recibido'];

// Países iniciales ofrecidos por el formulario. 'Otro' habilita un texto libre.
export const PAISES = ['China', 'Turquía', 'Estados Unidos', 'Argentina', 'Otro'];

// Monedas en las que se puede expresar el precio total. El usuario elige cuál usar.
export const MONEDAS = ['USD', 'ARS'];

// Longitudes máximas de los campos de texto (validación de entrada).
export const MAX = {
  numero_pedido: 50,
  pais_otro: 80,
  proveedor: 120,
  empresa: 120,
  descripcion: 1000,
  numero_dj: 80,
  observaciones: 1000,
};

// Campos por los que se permite ordenar el listado (lista blanca contra inyección).
export const CAMPOS_ORDEN = {
  fecha: 'fecha_compra',
  precio: 'precio_total',
  proveedor: 'proveedor',
  empresa: 'empresa',
  pais: 'pais_origen',
  numero: 'numero_pedido',
  estado: 'estado',
};
