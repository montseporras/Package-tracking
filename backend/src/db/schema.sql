-- Esquema de la base de datos de Clínica Mottura
-- SQLite. Se ejecuta automáticamente al iniciar el servidor si las tablas no existen.

-- Tabla principal de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_pedido     TEXT    NOT NULL,
  pais_origen       TEXT    NOT NULL,          -- China | Turquía | Estados Unidos | Argentina | Otro
  pais_otro         TEXT,                       -- nombre del país cuando pais_origen = 'Otro'
  proveedor         TEXT    NOT NULL,
  empresa           TEXT    NOT NULL,
  precio_total      REAL    NOT NULL CHECK (precio_total >= 0),
  moneda            TEXT    NOT NULL DEFAULT 'USD', -- USD | ARS
  fecha_compra      TEXT    NOT NULL,          -- ISO YYYY-MM-DD
  descripcion       TEXT    DEFAULT '',
  estado            TEXT    NOT NULL DEFAULT 'En espera',
  tiene_dj          INTEGER NOT NULL DEFAULT 0, -- 1 si el pedido tiene Declaración Jurada
  numero_dj         TEXT,                       -- obligatorio sólo cuando tiene_dj = 1
  observaciones     TEXT    DEFAULT '',
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Historial de cambios de estado (auditoría)
CREATE TABLE IF NOT EXISTS historial_estados (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id       INTEGER NOT NULL,
  estado_anterior TEXT,
  estado_nuevo    TEXT    NOT NULL,
  fecha           TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE
);

-- Índices para acelerar búsquedas y filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_pedidos_estado       ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa      ON pedidos (empresa);
CREATE INDEX IF NOT EXISTS idx_pedidos_proveedor    ON pedidos (proveedor);
CREATE INDEX IF NOT EXISTS idx_pedidos_pais         ON pedidos (pais_origen);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha        ON pedidos (fecha_compra);
CREATE INDEX IF NOT EXISTS idx_historial_pedido     ON historial_estados (pedido_id);
