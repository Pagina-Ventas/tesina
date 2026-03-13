const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db'); 

// 👇 IMPORTAMOS LA FUNCIÓN PARA GUARDAR LOGS
const { registrarLog } = require('./logs.controller'); 

// 1. LOGIN (Admin o Usuario)
const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Faltan credenciales (username/password)' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ success: false, message: 'Falta JWT_SECRET en el .env' });
    }

    // A) LOGIN ADMIN
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'admin', username }, jwtSecret, { expiresIn: '4h' });
      
      // 📝 REGISTRAMOS LA ACCIÓN DEL ADMIN
      await registrarLog('Administrador', 'LOGIN', 'El administrador inició sesión en el panel.');

      return res.json({ success: true, token, role: 'admin' });
    }

    // B) LOGIN CLIENTE (Busca en MySQL)
    const [rows] = await pool.query(`SELECT * FROM usuarios WHERE username = ?`, [username]);
    
    if (rows.length > 0) {
      const usuarioEncontrado = rows[0];
      const passGuardada = String(usuarioEncontrado.password || '');

      const coincide = passGuardada.startsWith('$2a$') || passGuardada.startsWith('$2b$')
        ? await bcrypt.compare(password, passGuardada)
        : passGuardada === password; 

      if (coincide) {
        delete usuarioEncontrado.password; 
        
        const token = jwt.sign({ role: 'client', id: usuarioEncontrado.id, username }, jwtSecret, { expiresIn: '4h' });
        
        // 📝 REGISTRAMOS LA ACCIÓN DEL CLIENTE
        await registrarLog(username, 'LOGIN', 'El cliente inició sesión en la tienda.');

        return res.json({ success: true, token, role: 'client', user: usuarioEncontrado });
      }
    }

    // Si alguien intenta entrar y falla, también lo podemos registrar (opcional, pero útil para seguridad)
    await registrarLog(username || 'Desconocido', 'LOGIN_FALLIDO', 'Intento de inicio de sesión fallido.');

    return res.status(401).json({ success: false, message: 'Credenciales incorrectas ⛔' });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 2. REGISTRO (Solo para clientes)
const register = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Faltan datos (username/password)' });
    }

    const [existentes] = await pool.query(`SELECT id FROM usuarios WHERE username = ?`, [username]);
    
    if (existentes.length > 0) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO usuarios (username, password, nombre, telefono, provincia, ciudad, direccion, dni) 
       VALUES (?, ?, '', '', '', '', '', '')`,
      [username, passwordHash]
    );

    // 📝 REGISTRAMOS EL NUEVO USUARIO
    await registrarLog(username, 'REGISTRO', 'Un nuevo usuario se ha registrado en la tienda.');

    return res.json({ success: true, message: 'Usuario creado con éxito' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. ACTUALIZAR PERFIL
const updateProfile = async (req, res) => {
  try {
    const { username, datos } = req.body || {};

    if (!username || !datos) {
      return res.status(400).json({ success: false, message: 'Faltan datos (username/datos)' });
    }

    const [result] = await pool.query(
      `UPDATE usuarios SET 
       nombre = ?, telefono = ?, provincia = ?, ciudad = ?, direccion = ?, dni = ? 
       WHERE username = ?`,
      [
        datos.nombre || '', 
        datos.telefono || '', 
        datos.provincia || '', 
        datos.ciudad || '', 
        datos.direccion || '', 
        datos.dni || '', 
        username
      ]
    );

    if (result.affectedRows > 0) {
      const [usuarioActualizado] = await pool.query(`SELECT * FROM usuarios WHERE username = ?`, [username]);
      delete usuarioActualizado[0].password; 
      
      // 📝 REGISTRAMOS LA ACTUALIZACIÓN
      await registrarLog(username, 'ACTUALIZAR_PERFIL', 'El usuario actualizó sus datos de envío/contacto.');

      return res.json({ success: true, user: usuarioActualizado[0] });
    }

    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, register, updateProfile };