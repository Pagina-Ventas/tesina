const { Router } = require('express');
const router = Router();
const controller = require('../controllers/banners.controller');
const { verificarAdmin } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// carpeta uploads
const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'banner-' + unico + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (jpg, png, webp, gif)'));
  }
});

// públicas
router.get('/', controller.getBannersPublicos);

// admin
router.get('/admin', verificarAdmin, controller.getBannersAdmin);

router.post(
  '/',
  verificarAdmin,
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  controller.createBanner
);

router.put(
  '/:id',
  verificarAdmin,
  (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  controller.updateBanner
);

router.delete('/:id', verificarAdmin, controller.deleteBanner);

module.exports = router;