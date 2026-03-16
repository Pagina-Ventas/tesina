const { Router } = require('express');
const router = Router();

const { login, register, updateProfile, getProfile } = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/register', register);
router.get('/profile', verificarToken, getProfile);
router.put('/profile', verificarToken, updateProfile);

module.exports = router;