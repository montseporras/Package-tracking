// Punto de entrada de la API de Clínica Mottura.
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pedidosRouter from './routes/pedidos.js';
import { ESTADOS, PAISES, MONEDAS } from './utils/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Build del frontend (generado con `npm run build` en frontend/). Si existe,
// este mismo servidor lo sirve junto con la API, así se despliega como un solo servicio.
const FRONTEND_DIST = join(__dirname, '..', '..', 'frontend', 'dist');

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// --- Middlewares globales ---
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' })); // límite de payload: evita abusos
app.use(express.static(FRONTEND_DIST));

// --- Rutas ---
app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'clinica-mottura' }));

// Metadatos de dominio (para poblar selects del frontend sin duplicar constantes).
app.get('/api/meta', (_req, res) => res.json({ estados: ESTADOS, paises: PAISES, monedas: MONEDAS }));

app.use('/api/pedidos', pedidosRouter);

// --- Fallback SPA: cualquier ruta que no sea /api sirve el index.html del frontend ---
// (permite refrescar rutas como /pedidos/5 directo en el navegador).
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(join(FRONTEND_DIST, 'index.html'), (err) => {
    if (err) next();
  });
});

// --- 404 (rutas /api no encontradas) ---
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// --- Manejador de errores central ---
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`✅ API de Clínica Mottura escuchando en http://localhost:${PORT}`);
});
