const { Router } = require('express');
const router = Router();
const controller = require('../controllers/banners.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

// IMPORTANTE:
// Usamos memoryStorage para que la imagen quede en req.file.buffer
// y luego se suba a Cloudinary desde el controller.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());

    if (mimetype && extname) return cb(null, true);

    cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
  }
});

// Middleware para manejar errores de multer
const subirImagenBanner = (req, res, next) => {
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

// públicas
router.get('/', controller.getBannersPublicos);

// admin
router.get('/admin', verificarAdmin, controller.getBannersAdmin);

router.post(
  '/',
  verificarAdmin,
  subirImagenBanner,
  controller.createBanner
);

router.put(
  '/:id',
  verificarAdmin,
  subirImagenBanner,
  controller.updateBanner
);

router.delete('/:id', verificarAdmin, controller.deleteBanner);

module.exports = router;