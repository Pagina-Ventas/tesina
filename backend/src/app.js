const express = require('express');
const cors = require('cors');
const path = require('path');

// Importamos las rutas
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const authRoutes = require('./routes/auth.routes');
const paymentRoutes = require('./routes/payment.routes'); // 👈 La ruta de pagos

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
// Aumentamos límite para fotos pesadas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', paymentRoutes); // 👈 Activamos pagos

// --- ARCHIVOS ESTÁTICOS (FOTOS) ---
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = app;