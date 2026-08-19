// Carga datos de ejemplo para poder probar la app de inmediato.
// Uso: npm run seed  (dentro de la carpeta backend)
// ATENCIÓN: borra todos los pedidos existentes antes de insertar los de ejemplo.

import db from './index.js';

const ejemplos = [
  {
    numero_pedido: 'PED-1001', pais_origen: 'China', pais_otro: '',
    proveedor: 'Shanghai Medical Supplies', empresa: 'Mottura Insumos SA',
    precio_total: 15400.5, moneda: 'USD', fecha_compra: '2026-06-02',
    descripcion: 'Guantes de nitrilo y mascarillas quirúrgicas',
    estado: 'En camino', tiene_dj: 0, numero_dj: '', observaciones: 'Envío por vía marítima',
  },
  {
    numero_pedido: 'PED-1002', pais_origen: 'Turquía', pais_otro: '',
    proveedor: 'Istanbul Health Group', empresa: 'Mottura Equipamiento',
    precio_total: 8900, moneda: 'USD', fecha_compra: '2026-07-10',
    descripcion: 'Camillas plegables de acero inoxidable',
    estado: 'En espera', tiene_dj: 0, numero_dj: '', observaciones: '',
  },
  {
    numero_pedido: 'PED-1003', pais_origen: 'Estados Unidos', pais_otro: '',
    proveedor: 'MedTech USA Inc.', empresa: 'Mottura Insumos SA',
    precio_total: 32250.75, moneda: 'USD', fecha_compra: '2026-05-18',
    descripcion: 'Monitores multiparamétricos',
    estado: 'En camino', tiene_dj: 1, numero_dj: 'DJ-2026-00045',
    observaciones: 'Requiere inspección aduanera',
  },
  {
    numero_pedido: 'PED-1004', pais_origen: 'Argentina', pais_otro: '',
    proveedor: 'Insumos del Sur SRL', empresa: 'Mottura Equipamiento',
    precio_total: 4200, moneda: 'ARS', fecha_compra: '2026-07-01',
    descripcion: 'Alcohol en gel y antisépticos',
    estado: 'Recibido', tiene_dj: 0, numero_dj: '', observaciones: 'Entregado en depósito central',
  },
  {
    numero_pedido: 'PED-1005', pais_origen: 'Otro', pais_otro: 'Alemania',
    proveedor: 'Deutsche Medizin GmbH', empresa: 'Mottura Insumos SA',
    precio_total: 51000, moneda: 'USD', fecha_compra: '2026-04-22',
    descripcion: 'Autoclave de esterilización de gran capacidad',
    estado: 'En camino', tiene_dj: 1, numero_dj: 'DJ-2026-00051', observaciones: 'Garantía 3 años',
  },
  {
    numero_pedido: 'PED-1006', pais_origen: 'China', pais_otro: '',
    proveedor: 'Guangzhou Instruments Co.', empresa: 'Mottura Equipamiento',
    precio_total: 12750.9, moneda: 'ARS', fecha_compra: '2026-06-28',
    descripcion: 'Instrumental quirúrgico variado',
    estado: 'En espera', tiene_dj: 0, numero_dj: '', observaciones: '',
  },
];

const insert = db.prepare(`
  INSERT INTO pedidos
    (numero_pedido, pais_origen, pais_otro, proveedor, empresa, precio_total, moneda,
     fecha_compra, descripcion, estado, tiene_dj, numero_dj, observaciones)
  VALUES
    (@numero_pedido, @pais_origen, @pais_otro, @proveedor, @empresa, @precio_total, @moneda,
     @fecha_compra, @descripcion, @estado, @tiene_dj, @numero_dj, @observaciones)
`);
const insertHist = db.prepare(
  'INSERT INTO historial_estados (pedido_id, estado_anterior, estado_nuevo) VALUES (?, ?, ?)'
);

const cargar = db.transaction(() => {
  db.exec('DELETE FROM historial_estados; DELETE FROM pedidos;');
  for (const e of ejemplos) {
    const info = insert.run(e);
    insertHist.run(info.lastInsertRowid, null, e.estado);
  }
});

cargar();
console.log(`✅ ${ejemplos.length} pedidos de ejemplo cargados.`);
process.exit(0);
