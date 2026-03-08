const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // 👈 Importamos la conexión a MySQL

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

    // A) LOGIN ADMIN (Sigue usando las variables de entorno)
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'admin', username }, jwtSecret, { expiresIn: '4h' });
      return res.json({ success: true, token, role: 'admin' });
    }

    // B) LOGIN CLIENTE (Busca en MySQL)
    const [rows] = await pool.query(`SELECT * FROM usuarios WHERE username = ?`, [username]);
    
    if (rows.length > 0) {
      const usuarioEncontrado = rows[0];
      const passGuardada = String(usuarioEncontrado.password || '');

      const coincide = passGuardada.startsWith('$2a$') || passGuardada.startsWith('$2b$')
        ? await bcrypt.compare(password, passGuardada)
        : passGuardada === password; // Por si hay contraseñas viejas sin hashear

      if (coincide) {
        // Quitamos la contraseña del objeto antes de enviarlo al frontend por seguridad
        delete usuarioEncontrado.password; 
        
        const token = jwt.sign({ role: 'client', id: usuarioEncontrado.id, username }, jwtSecret, { expiresIn: '4h' });
        return res.json({ success: true, token, role: 'client', user: usuarioEncontrado });
      }
    }

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

    // 1. Verificar si ya existe en MySQL
    const [existentes] = await pool.query(`SELECT id FROM usuarios WHERE username = ?`, [username]);
    
    if (existentes.length > 0) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insertar el nuevo usuario en la base de datos
    await pool.query(
      `INSERT INTO usuarios (username, password, nombre, telefono, provincia, ciudad, direccion, dni) 
       VALUES (?, ?, '', '', '', '', '', '')`,
      [username, passwordHash]
    );

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

    // Actualizamos los campos en la base de datos
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
      // Devolvemos los datos actualizados buscando al usuario de nuevo
      const [usuarioActualizado] = await pool.query(`SELECT * FROM usuarios WHERE username = ?`, [username]);
      delete usuarioActualizado[0].password; // No enviar el hash al frontend
      
      return res.json({ success: true, user: usuarioActualizado[0] });
    }

    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, register, updateProfile };