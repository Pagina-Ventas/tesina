const express = require('express');
const cors = require('cors');
const path = require('path');

// Importamos las rutas
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes');
const categoriasRoutes = require('./routes/categorias.routes');

// DB pool
const pool = require('./db');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());

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
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', paymentRoutes);
app.use('/api/categorias', categoriasRoutes);

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