const { Router } = require('express');
const router = Router();

const {
  login,
  register,
  verifyEmail,
  updateProfile,
  getProfile
} = require('../controllers/auth.controller');

const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/login', login);
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.get('/profile', verificarToken, getProfile);
router.put('/profile', verificarToken, updateProfile);

module.exports = router;