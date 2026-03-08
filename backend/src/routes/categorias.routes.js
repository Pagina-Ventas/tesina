const { Router } = require('express');
const router = Router();
const controller = require('../controllers/categorias.controller');

router.get('/', controller.getCategorias);
router.post('/', controller.createCategoria);
router.delete('/:id', controller.deleteCategoria);

module.exports = router;