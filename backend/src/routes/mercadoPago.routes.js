const express = require('express');
const { crearPreferencia } = require('../controllers/mercadoPago.controller.js');

const router = express.Router();

router.post('/crear-preferencia', crearPreferencia);

module.exports = router;