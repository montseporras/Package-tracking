// Middleware de validación y saneamiento de un pedido.
// Valida TODOS los campos antes de que lleguen al controlador.
// Nunca se almacenan registros incompletos.

import { ESTADOS, PAISES, MONEDAS, MAX } from '../utils/constants.js';
import { limpiarTexto, aNumero } from '../utils/sanitize.js';

// Valida un cuerpo de pedido y devuelve { valido, errores, datos }.
export function validar(body) {
  const errores = {};

  // --- Campos de texto obligatorios ---
  const numero_pedido = limpiarTexto(body.numero_pedido);
  if (!numero_pedido) errores.numero_pedido = 'El número de pedido es obligatorio.';
  else if (numero_pedido.length > MAX.numero_pedido)
    errores.numero_pedido = `Máximo ${MAX.numero_pedido} caracteres.`;

  const proveedor = limpiarTexto(body.proveedor);
  if (!proveedor) errores.proveedor = 'El proveedor es obligatorio.';
  else if (proveedor.length > MAX.proveedor)
    errores.proveedor = `Máximo ${MAX.proveedor} caracteres.`;

  const empresa = limpiarTexto(body.empresa);
  if (!empresa) errores.empresa = 'La empresa es obligatoria.';
  else if (empresa.length > MAX.empresa)
    errores.empresa = `Máximo ${MAX.empresa} caracteres.`;

  // --- País de origen ---
  const pais_origen = limpiarTexto(body.pais_origen);
  if (!pais_origen) {
    errores.pais_origen = 'El país de origen es obligatorio.';
  } else if (!PAISES.includes(pais_origen)) {
    errores.pais_origen = 'País de origen inválido.';
  }
  let pais_otro = limpiarTexto(body.pais_otro);
  if (pais_origen === 'Otro') {
    if (!pais_otro) errores.pais_otro = 'Indicá el nombre del país.';
    else if (pais_otro.length > MAX.pais_otro)
      errores.pais_otro = `Máximo ${MAX.pais_otro} caracteres.`;
  } else {
    pais_otro = ''; // sólo se guarda cuando corresponde
  }

  // --- Precio total ---
  const precio_total = aNumero(body.precio_total);
  if (Number.isNaN(precio_total)) errores.precio_total = 'El precio es obligatorio.';
  else if (precio_total < 0) errores.precio_total = 'El precio debe ser positivo.';
  else if (precio_total > 1_000_000_000)
    errores.precio_total = 'El precio es demasiado alto.';

  // --- Moneda ---
  const moneda = limpiarTexto(body.moneda) || 'USD';
  if (!MONEDAS.includes(moneda)) errores.moneda = 'Moneda inválida.';

  // --- Fecha de compra (ISO YYYY-MM-DD) ---
  const fecha_compra = limpiarTexto(body.fecha_compra);
  if (!fecha_compra) {
    errores.fecha_compra = 'La fecha de compra es obligatoria.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_compra) || Number.isNaN(Date.parse(fecha_compra))) {
    errores.fecha_compra = 'Formato de fecha inválido.';
  }

  // --- Estado ---
  const estado = limpiarTexto(body.estado) || 'En espera';
  if (!ESTADOS.includes(estado)) errores.estado = 'Estado inválido.';

  // --- Declaración Jurada (atributo independiente del estado) ---
  const tiene_dj = Boolean(body.tiene_dj);
  let numero_dj = limpiarTexto(body.numero_dj);
  if (tiene_dj) {
    if (!numero_dj) errores.numero_dj = 'El número de Declaración Jurada es obligatorio.';
    else if (numero_dj.length > MAX.numero_dj)
      errores.numero_dj = `Máximo ${MAX.numero_dj} caracteres.`;
  } else {
    numero_dj = ''; // sólo se guarda cuando el pedido tiene Declaración Jurada
  }

  // --- Campos opcionales ---
  const descripcion = limpiarTexto(body.descripcion);
  if (descripcion.length > MAX.descripcion)
    errores.descripcion = `Máximo ${MAX.descripcion} caracteres.`;

  const observaciones = limpiarTexto(body.observaciones);
  if (observaciones.length > MAX.observaciones)
    errores.observaciones = `Máximo ${MAX.observaciones} caracteres.`;

  const datos = {
    numero_pedido,
    pais_origen,
    pais_otro,
    proveedor,
    empresa,
    precio_total,
    moneda,
    fecha_compra,
    descripcion,
    estado,
    tiene_dj: tiene_dj ? 1 : 0,
    numero_dj,
    observaciones,
  };

  return { valido: Object.keys(errores).length === 0, errores, datos };
}

// Middleware Express: valida el body y, si hay errores, corta con 422.
export function validarPedido(req, res, next) {
  const { valido, errores, datos } = validar(req.body || {});
  if (!valido) {
    return res.status(422).json({ error: 'Datos inválidos', errores });
  }
  req.pedidoValidado = datos; // el controlador usa datos ya saneados
  next();
}
