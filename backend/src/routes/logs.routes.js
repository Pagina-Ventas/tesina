const { Router } = require('express');
const router = Router();
const { getLogs } = require('../controllers/logs.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware');

// Solo el administrador puede ver el historial de acciones
router.get('/', verificarAdmin, getLogs);

module.exports = router;