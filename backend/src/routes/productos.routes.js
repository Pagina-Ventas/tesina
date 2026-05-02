const { Router } = require('express');
const router = Router();
const controller = require('../controllers/productos.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

// Usamos memoryStorage para Cloudinary.
// La imagen queda disponible en req.file.buffer o req.files[].buffer
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) return cb(null, true);

    cb(new Error('❌ Solo se permiten imágenes (jpg, png, webp, gif)'));
  }
});

const subirImagenPrincipal = (req, res, next) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    next();
  });
};

const subirImagenesSecundarias = (req, res, next) => {
  upload.array('imagenes', 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    next();
  });
};

// 🟢 PÚBLICA: Cualquier usuario puede ver los productos
router.get('/', controller.getProductos);

// 🟢 PÚBLICA: Obtener imágenes secundarias de un producto
router.get('/:id/imagenes', controller.getImagenesProducto);

// 🔴 PROTEGIDA: Solo el administrador puede crear productos
router.post(
  '/',
  verificarAdmin,
  subirImagenPrincipal,
  controller.createProducto
);

// 🔴 PROTEGIDA: Agregar imágenes secundarias a un producto
router.post(
  '/:id/imagenes',
  verificarAdmin,
  subirImagenesSecundarias,
  controller.agregarImagenesProducto
);

// 🔴 PROTEGIDA: Administrador puede editar producto completo
router.put(
  '/:id',
  verificarAdmin,
  subirImagenPrincipal,
  controller.updateProducto
);

// 🔴 PROTEGIDA: Solo el administrador puede reponer stock manualmente
router.put('/:id/reponer', verificarAdmin, controller.reponerStock);

// 🔴 PROTEGIDA: Descontar stock manualmente y opcionalmente registrarlo como venta
router.put('/:id/descontar', verificarAdmin, controller.descontarStockManual);

// 🔴 PROTEGIDA: Eliminar imagen secundaria
router.delete('/imagenes/:imagenId', verificarAdmin, controller.eliminarImagenProducto);

// 🔴 PROTEGIDA: Solo el administrador puede eliminar productos
router.delete('/:id', verificarAdmin, controller.eliminarProducto);

// 🟢 PÚBLICA: Ruta necesaria para el flujo de ventas del local o bot
router.get('/vender/:id/:cantidad', controller.venderProducto);

// 👇 RUTA DE PRUEBA BOT
router.get('/test-bot', async (req, res) => {
  try {
    const { enviarAlerta } = require('../services/bot.service');

    const productoPrueba = {
      id: 1,
      nombre: '📢 PRUEBA DE CONEXIÓN',
      precio: 12345,
      stock: 1,
      stockMinimo: 5
    };

    console.log('🟡 Intentando enviar alerta desde /test-bot...');
    await enviarAlerta(productoPrueba, false);

    res.send('<h1>✅ ¡Orden enviada al Bot!</h1><p>Revisa tu Telegram ahora.</p>');
  } catch (error) {
    console.error('🔴 Error en /test-bot:', error);
    res.status(500).send(`<h1>❌ Error:</h1><p>${error.message}</p>`);
  }
});

// Verificar stock manualmente
router.get('/verificar-alertas', controller.verificarStock);

module.exports = router;