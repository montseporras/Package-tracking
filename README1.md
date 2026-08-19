# Clínica Mottura — Gestión de Pedidos

Aplicación web para registrar, administrar y hacer seguimiento de los pedidos
de Clínica Mottura. Interfaz moderna y responsive, con panel resumen, CRUD
completo, buscador, filtros combinables, estados con color e historial de cambios.

Arquitectura con separación **frontend / backend**:

- **Frontend:** React 18 + Vite (`/frontend`)
- **Backend:** Node.js + Express + SQLite (`/backend`)

---

## 1. Requisitos previos

- **Node.js 18 o superior** (recomendado 20+). Verificá con `node -v`.
- npm (viene con Node).
- Visual Studio Code (opcional, pero recomendado).

No hace falta instalar ninguna base de datos: SQLite se crea sola en un archivo
local la primera vez que arranca el backend.

---

## 2. Puesta en marcha (paso a paso)

Abrí la carpeta `clinica-mottura` en Visual Studio Code. Vas a necesitar
**dos terminales** (menú *Terminal → New Terminal*, y con el botón `+` abrís otra).

### Terminal 1 — Backend (API)

```bash
cd backend
npm install
npm run seed      # (opcional) carga 6 pedidos de ejemplo para probar
npm run dev       # arranca la API en http://localhost:4000
```

Si todo va bien vas a ver: `✅ API de Clínica Mottura escuchando en http://localhost:4000`.

### Terminal 2 — Frontend (interfaz)

```bash
cd frontend
npm install
npm run dev       # arranca la app en http://localhost:5173
```

Abrí **http://localhost:5173** en el navegador. Listo.

> El frontend habla con el backend a través de un proxy (`/api`), configurado en
> `frontend/vite.config.js`. Mientras ambos estén corriendo, todo funciona sin
> configuración extra.

---

## 3. Funcionalidades

- **Panel (dashboard):** total de pedidos, conteo por estado (En espera, En camino,
  Recibido), pedidos sin Declaración Jurada, monto total y pedidos recientes.
- **Gestión de pedidos (CRUD):** crear, ver, editar, eliminar (con confirmación),
  duplicar y cambiar estado de forma rápida.
- **Historial de estados:** cada cambio de estado queda registrado con fecha y hora.
- **Buscador inteligente:** por número de pedido, proveedor, empresa o descripción
  (con *debounce* para búsquedas fluidas).
- **Filtros combinables:** estado, país, empresa, proveedor, fecha de compra desde,
  rango de precios y Declaración Jurada. Se limpian todos con un botón.
- **Ordenamiento:** por fecha, precio, proveedor, empresa, país (clic en el encabezado).
- **Estados con color identificativo:** En espera (amarillo), En camino (azul),
  Recibido (verde).
- **Declaración Jurada:** es un atributo del pedido, independiente del estado.
  Se activa con un checkbox y, al marcarlo, aparece el campo para cargar su
  número; ese bloque se muestra con un color propio (violeta) para diferenciarlo
  del resto del formulario.
- **Moneda por pedido:** el precio total se puede cargar en dólares (USD) o
  pesos (ARS); la moneda se elige por pedido junto al monto.
- **Formulario inteligente:** el campo *Nombre del país* aparece solo si elegís
  “Otro”.
- **UX:** validaciones en tiempo real, mensajes de éxito/error (toasts), indicadores
  de carga y confirmaciones en acciones críticas.
- **UI:** diseño minimalista y responsive (PC, tablet y celular) con **modo claro y
  oscuro**.

---

## 4. Estructura del proyecto

```
clinica-mottura/
├── backend/
│   ├── src/
│   │   ├── server.js               # Punto de entrada de la API
│   │   ├── routes/pedidos.js        # Definición de rutas REST
│   │   ├── controllers/             # Lógica CRUD, búsqueda, filtros, historial
│   │   ├── middleware/              # Validación y saneamiento de pedidos
│   │   ├── utils/                   # Constantes y funciones de saneamiento
│   │   └── db/                      # Conexión SQLite, esquema y datos de ejemplo
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.jsx / App.jsx       # Arranque y rutas
│   │   ├── pages/                   # Dashboard, Pedidos, Formulario, Detalle
│   │   ├── components/              # Layout, tabla, modales, badges, iconos…
│   │   ├── context/                 # Tema (claro/oscuro) y notificaciones
│   │   ├── api/client.js            # Cliente HTTP hacia la API
│   │   ├── utils/                   # Constantes y formateadores
│   │   └── styles/index.css         # Estilos y temas
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 5. API REST (referencia rápida)

| Método | Ruta                          | Descripción                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/api/pedidos`                | Listar (acepta búsqueda, filtros, orden) |
| GET    | `/api/pedidos/:id`            | Obtener un pedido con su historial       |
| POST   | `/api/pedidos`                | Crear                                    |
| PUT    | `/api/pedidos/:id`            | Editar                                   |
| PATCH  | `/api/pedidos/:id/estado`     | Cambiar solo el estado                   |
| POST   | `/api/pedidos/:id/duplicar`   | Duplicar                                 |
| DELETE | `/api/pedidos/:id`            | Eliminar                                 |
| GET    | `/api/pedidos/stats/resumen`  | Métricas del dashboard                   |
| GET    | `/api/meta`                   | Estados, países y monedas disponibles    |

Parámetros de `/api/pedidos` (query string): `q`, `estado`, `empresa`, `proveedor`,
`pais`, `fecha_desde`, `precio_min`, `precio_max`, `tiene_dj`, `orden`
(`fecha|precio|proveedor|empresa|pais`), `dir` (`asc|desc`).

---

## 6. Seguridad y validaciones

- **Inyección SQL:** todas las consultas usan parámetros (better-sqlite3); nunca se
  concatena entrada del usuario. El ordenamiento usa lista blanca de columnas.
- **XSS:** el backend sanea las entradas (quita etiquetas HTML) y React escapa el
  contenido al renderizar (doble capa de defensa).
- **Validación:** en el cliente (en tiempo real) y en el servidor (fuente de verdad).
  Nunca se guardan registros incompletos. Se validan obligatorios, formatos de fecha,
  números, precios positivos y longitudes máximas.
- **Acciones críticas:** la eliminación pide confirmación explícita.
- **Límite de payload** en la API para evitar abusos.

---

## 7. Decisiones y supuestos

Siguiendo la consigna (ante ambigüedades, asumir de forma razonable y documentarlo):

1. **Persistencia con SQLite en archivo local** (`backend/src/db/clinica.sqlite`).
   Es gratuita, no requiere servidor y es suficiente para cientos/miles de pedidos.
   Migrar a PostgreSQL/MySQL más adelante solo implica cambiar la capa `db/`.
2. **Historial de estados** implementado como tabla propia (`historial_estados`),
   dejando lista la base para una auditoría completa futura.
3. **Duplicar** un pedido crea una copia con el sufijo `-COPIA` en el número, para
   que se distinga y puedas editarlo.
4. **Moneda:** cada pedido guarda su propia moneda (USD o ARS), elegida por el
   usuario al cargar el precio; se formatea acorde en toda la interfaz.
5. **Sin autenticación** en esta primera versión (no estaba en el alcance mínimo).
   La arquitectura queda preparada para agregar usuarios y permisos.

---

## 8. Compilar para producción (opcional)

```bash
cd frontend
npm run build     # genera /frontend/dist con la app optimizada
```

El backend puede servir esa carpeta o desplegarse por separado. Para producción,
configurá la variable `CORS_ORIGIN` en el backend (ver `backend/.env.example`).

---

## 9. Próximas ampliaciones previstas

La arquitectura ya está preparada para: adjuntar facturas/comprobantes, exportar a
Excel/PDF, importar pedidos, notificaciones automáticas, integración con APIs de
seguimiento de envíos, gestión de usuarios y permisos, y auditoría completa.
