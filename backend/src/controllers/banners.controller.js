const pool = require('../db');
const { registrarLog } = require('./logs.controller');
const cloudinary = require('../config/cloudinary');

// Subir imagen a Cloudinary desde memoria
const subirACloudinary = (buffer, folder = 'banners') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

// GET público: solo banners activos
const getBannersPublicos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        imagen, 
        imagen_mobile AS imagenMobile,
        titulo, 
        subtitulo, 
        orden, 
        activo
      FROM banners
      WHERE activo = 1
      ORDER BY orden ASC, id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('ERROR LEYENDO BANNERS PÚBLICOS:', err);
    res.status(500).json({
      success: false,
      message: 'Error leyendo banners',
      detail: err.message
    });
  }
};

// GET admin: todos los banners
const getBannersAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        imagen, 
        imagen_mobile AS imagenMobile,
        titulo, 
        subtitulo, 
        orden, 
        activo, 
        creado_en
      FROM banners
      ORDER BY orden ASC, id ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('ERROR LEYENDO BANNERS ADMIN:', err);
    res.status(500).json({
      success: false,
      message: 'Error leyendo banners',
      detail: err.message
    });
  }
};

// POST: crear banner
const createBanner = async (req, res) => {
  try {
    const { titulo, subtitulo, orden, activo } = req.body;

    const imagenDesktopFile = req.files?.imagen?.[0];
    const imagenMobileFile = req.files?.imagenMobile?.[0];

    if (!imagenDesktopFile) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir una imagen principal para el banner'
      });
    }

    const resultadoDesktop = await subirACloudinary(imagenDesktopFile.buffer, 'banners');
    const imagenUrl = resultadoDesktop.secure_url;

    let imagenMobileUrl = null;

    if (imagenMobileFile) {
      const resultadoMobile = await subirACloudinary(imagenMobileFile.buffer, 'banners_mobile');
      imagenMobileUrl = resultadoMobile.secure_url;
    }

    const [result] = await pool.query(
      `
      INSERT INTO banners (imagen, imagen_mobile, titulo, subtitulo, orden, activo)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        imagenUrl,
        imagenMobileUrl,
        titulo || null,
        subtitulo || null,
        Number(orden || 0),
        Number(activo ?? 1)
      ]
    );

    await registrarLog(
      'Administrador',
      'CREAR_BANNER',
      `Se creó el banner ID ${result.insertId}.`
    );

    res.json({
      success: true,
      banner: {
        id: result.insertId,
        imagen: imagenUrl,
        imagenMobile: imagenMobileUrl,
        titulo: titulo || null,
        subtitulo: subtitulo || null,
        orden: Number(orden || 0),
        activo: Number(activo ?? 1)
      }
    });
  } catch (err) {
    console.error('ERROR CREANDO BANNER:', err);
    res.status(500).json({
      success: false,
      message: 'Error creando banner',
      detail: err.message
    });
  }
};

// PUT: editar banner
const updateBanner = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  try {
    const { titulo, subtitulo, orden, activo } = req.body;

    const [rows] = await pool.query(`SELECT * FROM banners WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner no encontrado'
      });
    }

    const actual = rows[0];

    const imagenDesktopFile = req.files?.imagen?.[0];
    const imagenMobileFile = req.files?.imagenMobile?.[0];

    let imagen = actual.imagen;
    let imagenMobile = actual.imagen_mobile;

    if (imagenDesktopFile) {
      const resultadoDesktop = await subirACloudinary(imagenDesktopFile.buffer, 'banners');
      imagen = resultadoDesktop.secure_url;
    }

    if (imagenMobileFile) {
      const resultadoMobile = await subirACloudinary(imagenMobileFile.buffer, 'banners_mobile');
      imagenMobile = resultadoMobile.secure_url;
    }

    await pool.query(
      `
      UPDATE banners
      SET imagen = ?, imagen_mobile = ?, titulo = ?, subtitulo = ?, orden = ?, activo = ?
      WHERE id = ?
      `,
      [
        imagen,
        imagenMobile,
        titulo ?? actual.titulo,
        subtitulo ?? actual.subtitulo,
        Number(orden ?? actual.orden),
        Number(activo ?? actual.activo),
        id
      ]
    );

    await registrarLog(
      'Administrador',
      'EDITAR_BANNER',
      `Se editó el banner ID ${id}.`
    );

    const [updatedRows] = await pool.query(`
      SELECT 
        id, 
        imagen, 
        imagen_mobile AS imagenMobile,
        titulo, 
        subtitulo, 
        orden, 
        activo, 
        creado_en
      FROM banners
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      banner: updatedRows[0]
    });
  } catch (err) {
    console.error('ERROR EDITANDO BANNER:', err);
    res.status(500).json({
      success: false,
      message: 'Error editando banner',
      detail: err.message
    });
  }
};

// DELETE: eliminar banner
const deleteBanner = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  try {
    const [result] = await pool.query(`DELETE FROM banners WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner no encontrado'
      });
    }

    await registrarLog(
      'Administrador',
      'ELIMINAR_BANNER',
      `Se eliminó el banner ID ${id}.`
    );

    res.json({ success: true, deletedId: id });
  } catch (err) {
    console.error('ERROR ELIMINANDO BANNER:', err);
    res.status(500).json({
      success: false,
      message: 'Error eliminando banner',
      detail: err.message
    });
  }
};

module.exports = {
  getBannersPublicos,
  getBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner
};