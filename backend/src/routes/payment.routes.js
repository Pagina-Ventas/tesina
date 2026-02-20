const { Router } = require('express');
const router = Router();

// 👇 AQUÍ ESTÁ EL CAMBIO: Agregamos recibirWebhook en la importación
const { crearPreferencia, recibirWebhook } = require('../controllers/payment.controller');

// Ruta POST que llamará tu Frontend
router.post('/crear-orden', crearPreferencia);

// Ruta para el Webhook de Mercado Pago
router.post('/webhook', recibirWebhook);

module.exports = router;