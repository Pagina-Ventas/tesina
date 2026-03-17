const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { registrarLog } = require('./logs.controller');

// 1. LOGIN
const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan credenciales (username/password)'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Falta JWT_SECRET en el .env'
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM usuarios WHERE username = ? AND activo = 1 LIMIT 1`,
      [username]
    );

    if (rows.length === 0) {
      await registrarLog(
        username || 'Desconocido',
        'LOGIN_FALLIDO',
        'Intento de inicio de sesión fallido.'
      );

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas ⛔'
      });
    }

    const usuario = rows[0];
    const passGuardada = String(usuario.password || '');

    const coincide =
      passGuardada.startsWith('$2a$') ||
      passGuardada.startsWith('$2b$') ||
      passGuardada.startsWith('$2y$')
        ? await bcrypt.compare(password, passGuardada)
        : passGuardada === password;

    if (!coincide) {
      await registrarLog(
        username || 'Desconocido',
        'LOGIN_FALLIDO',
        'Intento de inicio de sesión fallido.'
      );

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas ⛔'
      });
    }

    const userSafe = {
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
      role: usuario.role || 'cliente',
      activo: usuario.activo
    };

    const token = jwt.sign(
      {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role || 'cliente'
      },
      jwtSecret,
      { expiresIn: '4h' }
    );

    await registrarLog(
      usuario.username,
      'LOGIN',
      `El usuario inició sesión con rol ${usuario.role || 'cliente'}.`
    );

    return res.json({
      success: true,
      token,
      role: usuario.role || 'cliente',
      user: userSafe
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 2. REGISTRO
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos (username/email/password)'
      });
    }

    const usernameLimpio = String(username).trim();
    const emailLimpio = String(email).trim().toLowerCase();

    if (usernameLimpio.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El usuario debe tener al menos 3 caracteres'
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 4 caracteres'
      });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(emailLimpio)) {
      return res.status(400).json({
        success: false,
        message: 'Ingresa un correo válido'
      });
    }

    const [usuariosExistentes] = await pool.query(
      `SELECT id FROM usuarios WHERE username = ? LIMIT 1`,
      [usernameLimpio]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    const [emailsExistentes] = await pool.query(
      `SELECT id FROM usuarios WHERE email = ? LIMIT 1`,
      [emailLimpio]
    );

    if (emailsExistentes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ese correo ya está registrado'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO usuarios (username, password, nombre, email, telefono, direccion, role, activo)
       VALUES (?, ?, '', ?, '', '', 'cliente', 1)`,
      [usernameLimpio, passwordHash, emailLimpio]
    );

    await registrarLog(
      usernameLimpio,
      'REGISTRO',
      `Nuevo usuario registrado con ID ${result.insertId}.`
    );

    return res.json({
      success: true,
      message: 'Usuario creado con éxito'
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El usuario o correo ya existe'
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 3. ACTUALIZAR PERFIL
const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { datos } = req.body || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    if (!datos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos del perfil'
      });
    }

    await pool.query(
      `UPDATE usuarios
       SET nombre = ?, email = ?, telefono = ?, direccion = ?
       WHERE id = ?`,
      [
        datos.nombre || '',
        datos.email || '',
        datos.telefono || '',
        datos.direccion || '',
        userId
      ]
    );

    const [rows] = await pool.query(
      `SELECT id, username, nombre, email, telefono, direccion, role, activo
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await registrarLog(
      req.user.username || `Usuario ID ${userId}`,
      'ACTUALIZAR_PERFIL',
      'Actualizó sus datos de perfil.'
    );

    return res.json({
      success: true,
      user: rows[0]
    });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 4. OBTENER MI PERFIL
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const [rows] = await pool.query(
      `SELECT id, username, nombre, email, telefono, direccion, role, activo, creado_en
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.json({
      success: true,
      user: rows[0]
    });
  } catch (err) {
    console.error('GET PROFILE ERROR:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { login, register, updateProfile, getProfile };