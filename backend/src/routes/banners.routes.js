const { Router } = require('express');
const router = Router();
const controller = require('../controllers/banners.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');

// Usamos memoryStorage para subir a Cloudinary desde el controller
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

// Ahora acepta:
// imagen = banner desktop
// imagenMobile = banner mobile vertical
const subirImagenesBanner = (req, res, next) => {
  upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'imagenMobile', maxCount: 1 }
  ])(req, res, (err) => {
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
  subirImagenesBanner,
  controller.createBanner
);

router.put(
  '/:id',
  verificarAdmin,
  subirImagenesBanner,
  controller.updateBanner
);

router.delete('/:id', verificarAdmin, controller.deleteBanner);

module.exports = router;