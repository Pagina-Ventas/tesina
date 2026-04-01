const express = require('express');
const cors = require('cors');
const path = require('path');

// Importamos las rutas
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const bannersRoutes = require('./routes/banners.routes');
const mercadoPagoRoutes = require('./routes/mercadoPago.routes');
const logsRoutes = require('./routes/logs.routes');

// DB pool
const pool = require('./db');

const app = express();

// --- MIDDLEWARES ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://tesina-frontend.vercel.app',
  'https://tesina-frontend-pdnksc9l1-alessiacatas-projects.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // permitir requests sin origin (Postman, navegador directo, health checks)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));

    if (normalizedAllowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentamos límite para fotos pesadas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- ARCHIVOS ESTÁTICOS (FOTOS) ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- RUTA SIMPLE (salud) ---
app.get('/', (req, res) => res.send('OK 🚀 Backend activo'));

// --- TEST DB ---
app.get('/api/db/ping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ db: 'ok', result: rows[0] });
  } catch (err) {
    console.error('DB PING ERROR:', err);
    res.status(500).json({ db: 'error', message: err.message });
  }
});

// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', paymentRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/mercadopago', mercadoPagoRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/banners', bannersRoutes);

// --- 404 JSON ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// --- MANEJO DE ERRORES JSON ---
app.use((err, req, res, next) => {
  console.error('EXPRESS ERROR:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
  });
});

module.exports = app;