const { Router } = require('express');
const router = Router();
const controller = require('../controllers/payment.controller');

router.post('/crear-preferencia', controller.crearPreferencia);
router.post('/webhook', controller.recibirWebhook);
router.post('/verificar-pago', controller.verificarPago);

module.exports = router;