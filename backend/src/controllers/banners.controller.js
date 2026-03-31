const pool = require('../db');
const { registrarLog } = require('./logs.controller');

// GET público: solo banners activos
const getBannersPublicos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, imagen, titulo, subtitulo, orden, activo
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
      SELECT id, imagen, titulo, subtitulo, orden, activo, creado_en
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir una imagen para el banner'
      });
    }

    const imagenUrl = `/uploads/${req.file.filename}`;

    const [result] = await pool.query(
      `
      INSERT INTO banners (imagen, titulo, subtitulo, orden, activo)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        imagenUrl,
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
      return res.status(404).json({ success: false, message: 'Banner no encontrado' });
    }

    const actual = rows[0];
    let imagen = actual.imagen;

    if (req.file) {
      imagen = `/uploads/${req.file.filename}`;
    }

    await pool.query(
      `
      UPDATE banners
      SET imagen = ?, titulo = ?, subtitulo = ?, orden = ?, activo = ?
      WHERE id = ?
      `,
      [
        imagen,
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
      SELECT id, imagen, titulo, subtitulo, orden, activo, creado_en
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
      return res.status(404).json({ success: false, message: 'Banner no encontrado' });
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