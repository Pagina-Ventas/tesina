const { Router } = require('express')
const router = Router()
const controller = require('../controllers/productos.controller')
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
        const unico = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + unico + path.extname(file.originalname))
    }
})

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('❌ Solo se permiten imágenes (jpg, png, webp)'));
    }
})

// --- 3. RUTAS ---
router.get('/', controller.getProductos)

router.post('/', (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
}, controller.createProducto);

// Ruta de Venta
router.get('/vender/:id/:cantidad', controller.venderProducto)

// 👇 RUTA DE PRUEBA (BOTÓN DE PÁNICO) - ¡AHORA SÍ TIENE CÓDIGO!
router.get('/test-bot', async (req, res) => {
    try {
        const { enviarAlerta } = require('../services/bot.service');
        
        // Usamos un ID (1) que suele existir para que el sistema lo encuentre
        const productoPrueba = {
            id: 1, 
            nombre: "📢 PRUEBA DE CONEXIÓN",
            precio: 12345,
            stock: 1,
            stockMinimo: 5
        };
        
        console.log("🟡 Intentando enviar alerta desde /test-bot...");
        await enviarAlerta(productoPrueba, false); 
        
        res.send("<h1>✅ ¡Orden enviada al Bot!</h1><p>Revisa tu Telegram ahora.</p>");
    } catch (error) {
        console.error("🔴 Error en /test-bot:", error);
        res.status(500).send(`<h1>❌ Error:</h1><p>${error.message}</p>`);
    }
});

// 👇 RUTA PARA VERIFICAR TODO EL STOCK REAL
router.get('/verificar-alertas', controller.verificarStock)

module.exports = router