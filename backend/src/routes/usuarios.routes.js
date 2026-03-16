const { Router } = require('express');
const router = Router();

const { verificarAdmin } = require('../middlewares/auth.middleware');
const {
  listarUsuarios,
  cambiarRolUsuario,
  cambiarEstadoUsuario
} = require('../controllers/usuarios.controller');

router.get('/', verificarAdmin, listarUsuarios);
router.put('/:id/rol', verificarAdmin, cambiarRolUsuario);
router.put('/:id/activo', verificarAdmin, cambiarEstadoUsuario);

module.exports = router;