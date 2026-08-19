// Punto de entrada de la API de Clínica Mottura.
import express from 'express';
import cors from 'cors';
import pedidosRouter from './routes/pedidos.js';
import { ESTADOS, PAISES, MONEDAS } from './utils/constants.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// --- Middlewares globales ---
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' })); // límite de payload: evita abusos

// --- Rutas ---
app.get('/api/health', (_req, res) => res.json({ ok: true, servicio: 'clinica-mottura' }));

// Metadatos de dominio (para poblar selects del frontend sin duplicar constantes).
app.get('/api/meta', (_req, res) => res.json({ estados: ESTADOS, paises: PAISES, monedas: MONEDAS }));

app.use('/api/pedidos', pedidosRouter);

// --- 404 ---
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
