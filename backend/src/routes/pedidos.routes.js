const { Router } = require('express')
const router = Router()
const controller = require('../controllers/pedidos.controller')

// GET /api/pedidos (Ver lista)
router.get('/', controller.getPedidos)

// POST /api/pedidos (Nuevo pedido)
router.post('/', controller.createPedido)

// PUT /api/pedidos/:id (Actualizar estado)
router.put('/:id', controller.updatePedido)

module.exports = router