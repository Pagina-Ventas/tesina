const { Router } = require('express');
const router = Router();
const controller = require('../controllers/pedidos.controller');

// GET /api/pedidos (Ver lista)
router.get('/', controller.getPedidos);

// ✅ GET /api/pedidos/:id (Ver detalle)
router.get('/:id', controller.getPedidoById);

// POST /api/pedidos (Nuevo pedido)
router.post('/', controller.createPedido);

// PUT /api/pedidos/:id (Actualizar estado)
router.put('/:id', controller.updatePedido);

// ✅ DELETE /api/pedidos/:id (Eliminar pedido)
router.delete('/:id', controller.deletePedido);

module.exports = router;