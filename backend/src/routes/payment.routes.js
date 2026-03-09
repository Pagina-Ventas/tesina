const { Router } = require('express');
const router = Router();
const controller = require('../controllers/payment.controller');

router.post('/crear-preferencia', controller.crearPreferencia);
router.post('/webhook', controller.recibirWebhook);

// ⚠️ ESTA ES LA LÍNEA MÁS IMPORTANTE. Si no está, app.js explota.
module.exports = router;