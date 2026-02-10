const { Router } = require('express');
const router = Router();
const controller = require('../controllers/productos.controller');

// Obtener todos los productos
router.get('/productos', controller.getProductos);

// Crear un producto (POST)
router.post('/productos', controller.createProducto);

// Vender un producto (GET - Compatible con tu código anterior)
router.get('/vender/:id/:cantidad', controller.venderProducto);

// Verificar stock manual
router.get('/verificar-stock', controller.verificarStock);

module.exports = router;