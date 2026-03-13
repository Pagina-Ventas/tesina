const { Router } = require('express');
const router = Router();
const controller = require('../controllers/pedidos.controller');

// 👈 IMPORTAMOS verificarToken (para clientes) y verificarAdmin (para admins)
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware'); 

// ==========================================
// RUTAS PARA CLIENTES Y PÚBLICAS
// ==========================================

// 🟢 PÚBLICA/CLIENTE: Crear el pedido
router.post('/', controller.createPedido);

// 🟡 PROTEGIDA (CLIENTE): El usuario ve su propio historial
// ⚠️ IMPORTANTE: Debe ir ANTES de '/:id'
router.get('/mis-pedidos', verificarToken, controller.getMisPedidos);

// 🟡 PROTEGIDA (CLIENTE/ADMIN): Ver el detalle de un pedido específico.
// Lo bajamos a 'verificarToken' para que el cliente pueda ver su propio recibo.
router.get('/:id', verificarToken, controller.getPedidoById); 


// ==========================================
// RUTAS EXCLUSIVAS DE ADMINISTRADOR
// ==========================================

// 🔴 PROTEGIDA: Solo admin ve TODOS los pedidos del sistema
router.get('/', verificarAdmin, controller.getPedidos);

// 🔴 PROTEGIDA: Cambios de estado manuales (PAGADO, ENVIADO, CANCELADO)
router.put('/:id', verificarAdmin, controller.updatePedido);

// 🔴 PROTEGIDA: Eliminar pedido
router.delete('/:id', verificarAdmin, controller.deletePedido);

module.exports = router;