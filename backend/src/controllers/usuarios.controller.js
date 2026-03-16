const pool = require('../db');
const { registrarLog } = require('./logs.controller');

const listarUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        username,
        nombre,
        email,
        telefono,
        direccion,
        role,
        activo,
        creado_en
      FROM usuarios
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('LISTAR USUARIOS ERROR:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const cambiarRolUsuario = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body || {};

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    if (!['cliente', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }

    const [rows] = await pool.query(
      `SELECT id, username, role FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await pool.query(
      `UPDATE usuarios SET role = ? WHERE id = ?`,
      [role, id]
    );

    await registrarLog(
      req.user?.username || 'Administrador',
      'CAMBIAR_ROL',
      `Cambió el rol del usuario ${rows[0].username} a ${role}.`
    );

    return res.json({
      success: true,
      message: 'Rol actualizado correctamente'
    });
  } catch (err) {
    console.error('CAMBIAR ROL ERROR:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { activo } = req.body || {};

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const activoFinal = activo ? 1 : 0;

    const [rows] = await pool.query(
      `SELECT id, username FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await pool.query(
      `UPDATE usuarios SET activo = ? WHERE id = ?`,
      [activoFinal, id]
    );

    await registrarLog(
      req.user?.username || 'Administrador',
      'CAMBIAR_ESTADO_USUARIO',
      `${activoFinal ? 'Activó' : 'Desactivó'} al usuario ${rows[0].username}.`
    );

    return res.json({
      success: true,
      message: 'Estado actualizado correctamente'
    });
  } catch (err) {
    console.error('CAMBIAR ESTADO USUARIO ERROR:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  listarUsuarios,
  cambiarRolUsuario,
  cambiarEstadoUsuario
};