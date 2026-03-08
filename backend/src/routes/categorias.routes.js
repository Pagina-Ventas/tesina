const { Router } = require('express');
const router = Router();
const controller = require('../controllers/categorias.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware'); // 👈 IMPORTADO

router.get('/', controller.getCategorias);

// 🔴 PROTEGIDAS
router.post('/', verificarAdmin, controller.createCategoria); // 🔒
router.delete('/:id', verificarAdmin, controller.deleteCategoria); // 🔒

module.exports = router;