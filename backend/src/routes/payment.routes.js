const { Router } = require('express');
const router = Router();
const controller = require('../controllers/payment.controller');

router.post('/crear-preferencia', controller.crearPreferencia);
router.post('/webhook', controller.recibirWebhook);

module.exports = router;