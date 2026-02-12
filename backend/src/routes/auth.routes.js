const { Router } = require('express')
const router = Router()

// 👇 IMPORTANTE: Asegúrate de que 'register' esté aquí dentro de las llaves
const { login, register, updateProfile } = require('../controllers/auth.controller')

router.post('/login', login)
router.post('/register', register)
router.put('/profile', updateProfile)

module.exports = router