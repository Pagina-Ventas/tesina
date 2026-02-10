const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);

module.exports = app;