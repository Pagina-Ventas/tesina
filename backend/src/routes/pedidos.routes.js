const { Router } = require('express');
const router = Router();
const controller = require('../controllers/pedidos.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware'); // 👈 IMPORTADO

// 🔴 PROTEGIDA: Solo admin ve todos los pedidos
router.get('/', verificarAdmin, controller.getPedidos); // 🔒

// 🔴 PROTEGIDA: Detalle de pedido
router.get('/:id', verificarAdmin, controller.getPedidoById); // 🔒

// 🟢 PÚBLICA: El cliente debe poder crear el pedido
router.post('/', controller.createPedido);

// 🔴 PROTEGIDA: Cambios de estado manuales
router.put('/:id', verificarAdmin, controller.updatePedido); // 🔒

// 🔴 PROTEGIDA: Eliminar pedido
router.delete('/:id', verificarAdmin, controller.deletePedido); // 🔒

module.exports = router;