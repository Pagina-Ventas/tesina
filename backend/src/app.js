const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const authRoutes = require('./routes/auth.routes')
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Autenticación
app.use('/api/auth', authRoutes) 

// 👇 CORRECCIÓN CLAVE: Agregamos '/productos' aquí
app.use('/api/productos', productosRoutes);

// Pedidos
app.use('/api/pedidos', pedidosRoutes);

// Carpeta de imágenes pública
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = app;