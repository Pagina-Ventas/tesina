const { Router } = require('express');
const router = Router();
const controller = require('../controllers/pedidos.controller');

// Importamos verificarToken (para clientes) y verificarAdmin (para admins)
const { verificarToken, verificarAdmin } = require('../middlewares/auth.middleware');

// ==========================================
// RUTAS PARA CLIENTES Y PÚBLICAS
// ==========================================

// Crear pedido.
// Puede venir con token o sin token.
// Si viene con token, el controller asociará usuario_id.
// Si no viene, quedará como invitado.
router.post('/', controller.createPedido);

// Historial del usuario logueado
// IMPORTANTE: debe ir ANTES de '/:id'
router.get('/mis-pedidos', verificarToken, controller.getMisPedidos);

// Ver detalle de un pedido específico
// Requiere token
router.get('/:id', verificarToken, controller.getPedidoById);

// ==========================================
// RUTAS EXCLUSIVAS DE ADMINISTRADOR
// ==========================================

// Ver todos los pedidos del sistema
router.get('/', verificarAdmin, controller.getPedidos);

// Cambiar estado de pedido
router.put('/:id', verificarAdmin, controller.updatePedido);

// Eliminar pedido
router.delete('/:id', verificarAdmin, controller.deletePedido);

module.exports = router;