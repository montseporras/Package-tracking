// Conexión única a la base de datos SQLite.
// Se usa better-sqlite3: API síncrona, rápida y con consultas parametrizadas
// (previene inyección SQL de forma nativa).

import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// El archivo de la base de datos vive junto a este módulo (backend/src/db/clinica.sqlite)
// por defecto. En producción se puede apuntar a un disco persistente (ej. un volumen
// de Railway montado en /data) seteando la variable de entorno DB_PATH.
const DB_PATH = process.env.DB_PATH || join(__dirname, 'clinica.sqlite');

const db = new Database(DB_PATH);

// Buenas prácticas de SQLite: claves foráneas activas + modo WAL para mejor concurrencia.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Crear las tablas si no existen ejecutando el schema.
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Migración liviana: agrega columnas nuevas a bases de datos creadas con un
// esquema anterior (CREATE TABLE IF NOT EXISTS no las agrega automáticamente).
const columnas = db.prepare('PRAGMA table_info(pedidos)').all().map((c) => c.name);
if (!columnas.includes('moneda')) {
  db.exec("ALTER TABLE pedidos ADD COLUMN moneda TEXT NOT NULL DEFAULT 'USD'");
}
if (!columnas.includes('tiene_dj')) {
  db.exec('ALTER TABLE pedidos ADD COLUMN tiene_dj INTEGER NOT NULL DEFAULT 0');
  // Los pedidos que ya tenían el antiguo estado 'Declaración Jurada' pasan a tener el atributo activado.
  db.exec(
    "UPDATE pedidos SET tiene_dj = 1, estado = 'En camino' WHERE estado = 'Declaración Jurada'"
  );
}

export default db;
