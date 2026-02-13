const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const authRoutes = require('./routes/auth.routes');
const path = require('path');
const app = express();

app.use(cors());

// 👇 1. AUMENTAMOS LÍMITE A 50MB (Para que entren fotos pesadas)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);

// 👇 2. CORREGIMOS LA RUTA (Para que coincida con el Frontend)
app.use('/api/productos', productosRoutes);

app.use('/api/pedidos', pedidosRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = app;