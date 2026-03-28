const { Router } = require('express')
const router = Router()
const controller = require('../controllers/productos.controller')
const { verificarAdmin } = require('../middlewares/auth.middleware')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// --- 1. VERIFICACIÓN AUTOMÁTICA DE CARPETA ---
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  console.log('📂 Creando carpeta uploads...')
  fs.mkdirSync(uploadDir, { recursive: true })
}

// --- 2. CONFIGURACIÓN DE MULTER ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir) },
  filename: (req, file, cb) => {
    const unico = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + unico + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    if (mimetype && extname) return cb(null, true)
    cb(new Error('❌ Solo se permiten imágenes (jpg, png, webp, gif)'))
  }
})

// --- 3. RUTAS ---

// 🟢 PÚBLICA: Cualquier usuario puede ver los productos
router.get('/', controller.getProductos)

// 🟢 PÚBLICA: Obtener imágenes secundarias de un producto
router.get('/:id/imagenes', controller.getImagenesProducto)

// 🔴 PROTEGIDA: Solo el administrador puede crear productos
router.post(
  '/',
  verificarAdmin,
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    })
  },
  controller.createProducto
)

// 🔴 PROTEGIDA: Agregar imágenes secundarias a un producto
router.post(
  '/:id/imagenes',
  verificarAdmin,
  (req, res, next) => {
    upload.array('imagenes', 10)(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    })
  },
  controller.agregarImagenesProducto
)

// 🔴 PROTEGIDA: Administrador puede editar producto completo
router.put(
  '/:id',
  verificarAdmin,
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message })
      next()
    })
  },
  controller.updateProducto
)

// 🔴 PROTEGIDA: Solo el administrador puede reponer stock manualmente
router.put('/:id/reponer', verificarAdmin, controller.reponerStock)

// 🔴 PROTEGIDA: Eliminar imagen secundaria
router.delete('/imagenes/:imagenId', verificarAdmin, controller.eliminarImagenProducto)

// 🔴 PROTEGIDA: Solo el administrador puede eliminar productos
router.delete('/:id', verificarAdmin, controller.eliminarProducto)

// 🟢 PÚBLICA: Ruta necesaria para el flujo de ventas del local o bot
router.get('/vender/:id/:cantidad', controller.venderProducto)

// 👇 RUTA DE PRUEBA (BOTÓN DE PÁNICO)
router.get('/test-bot', async (req, res) => {
  try {
    const { enviarAlerta } = require('../services/bot.service')

    const productoPrueba = {
      id: 1,
      nombre: '📢 PRUEBA DE CONEXIÓN',
      precio: 12345,
      stock: 1,
      stockMinimo: 5
    }

    console.log('🟡 Intentando enviar alerta desde /test-bot...')
    await enviarAlerta(productoPrueba, false)

    res.send('<h1>✅ ¡Orden enviada al Bot!</h1><p>Revisa tu Telegram ahora.</p>')
  } catch (error) {
    console.error('🔴 Error en /test-bot:', error)
    res.status(500).send(`<h1>❌ Error:</h1><p>${error.message}</p>`)
  }
})

// Verificar stock manualmente
router.get('/verificar-alertas', controller.verificarStock)

module.exports = router