const { Router } = require('express');
const router = Router();
const { crearPreferencia } = require('../controllers/payment.controller');

// Ruta POST que llamará tu Frontend
router.post('/crear-orden', crearPreferencia);

module.exports = router;