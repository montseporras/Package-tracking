// Controlador de pedidos: toda la lógica CRUD + búsqueda, filtros, orden,
// duplicado, cambio de estado e historial.
// Todas las consultas usan parámetros (?) => inmunidad a inyección SQL.

import db from '../db/index.js';
import { CAMPOS_ORDEN, ESTADOS } from '../utils/constants.js';
import { limpiarTexto } from '../utils/sanitize.js';

// Sentencias preparadas reutilizables (mejor rendimiento).
const insertPedido = db.prepare(`
  INSERT INTO pedidos
    (numero_pedido, pais_origen, pais_otro, proveedor, empresa, precio_total, moneda,
     fecha_compra, descripcion, estado, tiene_dj, numero_dj, observaciones)
  VALUES
    (@numero_pedido, @pais_origen, @pais_otro, @proveedor, @empresa, @precio_total, @moneda,
     @fecha_compra, @descripcion, @estado, @tiene_dj, @numero_dj, @observaciones)
`);

const insertHistorial = db.prepare(`
  INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo)
  VALUES (?, ?, ?)
`);

const getPedidoStmt = db.prepare('SELECT * FROM pedidos WHERE id = ?');
const getHistorialStmt = db.prepare(
  'SELECT * FROM historial_estados WHERE pedido_id = ? ORDER BY id ASC'
);

// GET /api/pedidos  → listado con búsqueda, filtros, orden.
export function listar(req, res) {
  const {
    q, // texto libre: número, proveedor, empresa, descripción
    estado,
    empresa,
    proveedor,
    pais,
    fecha_desde,
    precio_min,
    precio_max,
    tiene_dj,
    orden = 'fecha', // campo de ordenamiento
    dir = 'desc', // asc | desc
  } = req.query;

  const where = [];
  const params = {};

  if (q) {
    const like = `%${limpiarTexto(q)}%`;
    where.push(
      '(numero_pedido LIKE @q OR proveedor LIKE @q OR empresa LIKE @q OR descripcion LIKE @q)'
    );
    params.q = like;
  }
  if (estado) {
    where.push('estado = @estado');
    params.estado = limpiarTexto(estado);
  }
  if (empresa) {
    where.push('empresa LIKE @empresa');
    params.empresa = `%${limpiarTexto(empresa)}%`;
  }
  if (proveedor) {
    where.push('proveedor LIKE @proveedor');
    params.proveedor = `%${limpiarTexto(proveedor)}%`;
  }
  if (pais) {
    where.push('pais_origen = @pais');
    params.pais = limpiarTexto(pais);
  }
  if (fecha_desde) {
    where.push('fecha_compra >= @fecha_desde');
    params.fecha_desde = limpiarTexto(fecha_desde);
  }
  if (precio_min !== undefined && precio_min !== '') {
    where.push('precio_total >= @precio_min');
    params.precio_min = Number(precio_min);
  }
  if (precio_max !== undefined && precio_max !== '') {
    where.push('precio_total <= @precio_max');
    params.precio_max = Number(precio_max);
  }
  if (tiene_dj !== undefined && tiene_dj !== '') {
    where.push('tiene_dj = @tiene_dj');
    params.tiene_dj = Number(tiene_dj) ? 1 : 0;
  }

  // Orden: sólo se aceptan columnas de la lista blanca (previene inyección en ORDER BY).
  const columna = CAMPOS_ORDEN[orden] || 'fecha_compra';
  const direccion = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT * FROM pedidos
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${columna} ${direccion}, id DESC
  `;

  const pedidos = db.prepare(sql).all(params);
  res.json(pedidos);
}

// GET /api/pedidos/:id  → un pedido con su historial.
export function obtener(req, res) {
  const pedido = getPedidoStmt.get(Number(req.params.id));
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  pedido.historial = getHistorialStmt.all(pedido.id);
  res.json(pedido);
}

// POST /api/pedidos  → crear.
export function crear(req, res) {
  const datos = req.pedidoValidado;
  const tx = db.transaction((d) => {
    const info = insertPedido.run(d);
    insertHistorial.run(info.lastInsertRowid, null, d.estado); // estado inicial
    return info.lastInsertRowid;
  });
  const id = tx(datos);
  const pedido = getPedidoStmt.get(id);
  pedido.historial = getHistorialStmt.all(id);
  res.status(201).json(pedido);
}

// PUT /api/pedidos/:id  → editar (registra historial si cambió el estado).
export function actualizar(req, res) {
  const id = Number(req.params.id);
  const actual = getPedidoStmt.get(id);
  if (!actual) return res.status(404).json({ error: 'Pedido no encontrado' });

  const d = req.pedidoValidado;
  const update = db.prepare(`
    UPDATE pedidos SET
      numero_pedido = @numero_pedido,
      pais_origen   = @pais_origen,
      pais_otro     = @pais_otro,
      proveedor     = @proveedor,
      empresa       = @empresa,
      precio_total  = @precio_total,
      moneda        = @moneda,
      fecha_compra  = @fecha_compra,
      descripcion   = @descripcion,
      estado        = @estado,
      tiene_dj      = @tiene_dj,
      numero_dj     = @numero_dj,
      observaciones = @observaciones,
      updated_at    = datetime('now')
    WHERE id = @id
  `);

  const tx = db.transaction(() => {
    update.run({ ...d, id });
    if (actual.estado !== d.estado) {
      insertHistorial.run(id, actual.estado, d.estado);
    }
  });
  tx();

  const pedido = getPedidoStmt.get(id);
  pedido.historial = getHistorialStmt.all(id);
  res.json(pedido);
}

// PATCH /api/pedidos/:id/estado  → cambiar sólo el estado (con historial).
export function cambiarEstado(req, res) {
  const id = Number(req.params.id);
  const actual = getPedidoStmt.get(id);
  if (!actual) return res.status(404).json({ error: 'Pedido no encontrado' });

  const nuevo = limpiarTexto(req.body?.estado);
  if (!ESTADOS.includes(nuevo)) {
    return res.status(422).json({ error: 'Estado inválido', errores: { estado: 'Estado inválido.' } });
  }

  const tx = db.transaction(() => {
    db.prepare(
      "UPDATE pedidos SET estado = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(nuevo, id);
    if (actual.estado !== nuevo) insertHistorial.run(id, actual.estado, nuevo);
  });
  tx();

  const pedido = getPedidoStmt.get(id);
  pedido.historial = getHistorialStmt.all(id);
  res.json(pedido);
}

// POST /api/pedidos/:id/duplicar  → clona un pedido existente.
export function duplicar(req, res) {
  const original = getPedidoStmt.get(Number(req.params.id));
  if (!original) return res.status(404).json({ error: 'Pedido no encontrado' });

  const copia = {
    numero_pedido: `${original.numero_pedido}-COPIA`,
    pais_origen: original.pais_origen,
    pais_otro: original.pais_otro,
    proveedor: original.proveedor,
    empresa: original.empresa,
    precio_total: original.precio_total,
    moneda: original.moneda,
    fecha_compra: original.fecha_compra,
    descripcion: original.descripcion,
    estado: original.estado,
    tiene_dj: original.tiene_dj,
    numero_dj: original.numero_dj,
    observaciones: original.observaciones,
  };

  const tx = db.transaction(() => {
    const info = insertPedido.run(copia);
    insertHistorial.run(info.lastInsertRowid, null, copia.estado);
    return info.lastInsertRowid;
  });
  const id = tx();
  const pedido = getPedidoStmt.get(id);
  pedido.historial = getHistorialStmt.all(id);
  res.status(201).json(pedido);
}

// DELETE /api/pedidos/:id  → eliminar (el historial se borra en cascada).
export function eliminar(req, res) {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM pedidos WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json({ ok: true, id });
}

// GET /api/pedidos/stats/resumen  → métricas para el dashboard.
export function resumen(_req, res) {
  const total = db.prepare('SELECT COUNT(*) AS n FROM pedidos').get().n;
  const porEstado = db
    .prepare('SELECT estado, COUNT(*) AS n FROM pedidos GROUP BY estado')
    .all();

  const conteo = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
  for (const fila of porEstado) conteo[fila.estado] = fila.n;

  const montoTotal = db.prepare('SELECT COALESCE(SUM(precio_total),0) AS s FROM pedidos').get().s;
  const sinDJ = db.prepare('SELECT COUNT(*) AS n FROM pedidos WHERE tiene_dj = 0').get().n;

  res.json({ total, porEstado: conteo, montoTotal, sinDJ });
}
