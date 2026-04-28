const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'productos' },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: 'Error subiendo imagen' });
        }

        res.json({
          url: result.secure_url,
        });
      }
    );

    stream.end(req.file.buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error general' });
  }
});

module.exports = router;