const { Router } = require('express')
const router = Router()
const controller = require('../controllers/productos.controller')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/') },
    filename: (req, file, cb) => {
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + unico + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage })

// --- RUTAS ---
router.get('/', controller.getProductos)
router.post('/', upload.single('imagen'), controller.createProducto)

// 👇 ¡ESTA ES LA LÍNEA QUE FALTABA! AGREGALA:
router.get('/vender/:id/:cantidad', controller.venderProducto)

module.exports = router