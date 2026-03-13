const express = require('express');
const { 
  crearPreferencia, 
  obtenerConfiguracion, 
  actualizarConfiguracion 
} = require('../controllers/mercadoPago.controller.js');
const { verificarAdmin } = require('../middlewares/auth.middleware.js');

const router = express.Router();

// Ruta principal para iniciar el pago
router.post('/crear-preferencia', crearPreferencia);

// 👇 NUEVAS RUTAS PARA LA CONFIGURACIÓN DEL RECARGO

// 🟢 PÚBLICA: El frontend necesita leer de cuánto es el recargo para mostrarlo en el carrito
router.get('/configuracion', obtenerConfiguracion);

// 🔴 PROTEGIDA: Solo el administrador puede modificar el porcentaje de recargo
router.put('/configuracion', verificarAdmin, actualizarConfiguracion);

module.exports = router;