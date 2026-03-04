const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const rutaUsuarios = path.join(__dirname, '../data/users.json');

const leerUsuarios = () => {
  if (!fs.existsSync(rutaUsuarios)) return [];
  const data = fs.readFileSync(rutaUsuarios, 'utf-8');
  return JSON.parse(data);
};

const guardarUsuarios = (data) =>
  fs.writeFileSync(rutaUsuarios, JSON.stringify(data, null, 2));

// 1. LOGIN (Admin o Usuario)
const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan credenciales (username/password)',
      });
    }

    // Si no hay JWT_SECRET, no firmes nada (evita 500)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Falta JWT_SECRET en el .env',
      });
    }

    // A) ADMIN
    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { role: 'admin', username },
        jwtSecret,
        { expiresIn: '4h' }
      );
      return res.json({ success: true, token, role: 'admin' });
    }

    // B) CLIENTE
    const usuarios = leerUsuarios();
    const usuarioEncontrado = usuarios.find((u) => u.username === username);

    if (usuarioEncontrado) {
      const passGuardada = String(usuarioEncontrado.password || '');

      const coincide = passGuardada.startsWith('$2a$') || passGuardada.startsWith('$2b$')
        ? await bcrypt.compare(password, passGuardada)
        : passGuardada === password;

      if (coincide) {
        const token = jwt.sign(
          { role: 'client', id: usuarioEncontrado.id, username },
          jwtSecret,
          { expiresIn: '4h' }
        );
        return res.json({
          success: true,
          token,
          role: 'client',
          user: usuarioEncontrado,
        });
      }
    }

    return res
      .status(401)
      .json({ success: false, message: 'Credenciales incorrectas ⛔' });
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
      return res.status(400).json({
        success: false,
        message: 'Faltan datos (username/password)',
      });
    }

    const usuarios = leerUsuarios();

    if (usuarios.find((u) => u.username === username)) {
      return res
        .status(400)
        .json({ success: false, message: 'El usuario ya existe' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      id: Date.now(),
      username,
      password: passwordHash,
      nombre: '',
      telefono: '',
      provincia: '',
      ciudad: '',
      direccion: '',
      dni: '',
    };

    usuarios.push(nuevoUsuario);
    guardarUsuarios(usuarios);

    return res.json({ success: true, message: 'Usuario creado con éxito' });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. ACTUALIZAR PERFIL
const updateProfile = (req, res) => {
  try {
    const { username, datos } = req.body || {};

    if (!username || !datos) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos (username/datos)',
      });
    }

    const usuarios = leerUsuarios();
    const index = usuarios.findIndex((u) => u.username === username);

    if (index !== -1) {
      usuarios[index] = { ...usuarios[index], ...datos };
      guardarUsuarios(usuarios);
      return res.json({ success: true, user: usuarios[index] });
    }

    return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, register, updateProfile };