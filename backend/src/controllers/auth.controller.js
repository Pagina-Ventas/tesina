const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs') // 👈 IMPORTANTE: Nueva librería

const rutaUsuarios = path.join(__dirname, '../data/users.json')

// Helper para leer usuarios
const leerUsuarios = () => {
    if (!fs.existsSync(rutaUsuarios)) return []
    const data = fs.readFileSync(rutaUsuarios, 'utf-8')
    return JSON.parse(data)
}

// Helper para guardar usuarios
const guardarUsuarios = (data) => fs.writeFileSync(rutaUsuarios, JSON.stringify(data, null, 2))

// 1. LOGIN (Admin o Usuario)
const login = async (req, res) => { // 👈 Ahora es ASYNC
    const { username, password } = req.body

    // A) Verificar si es ADMIN (Prioridad)
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '4h' })
        return res.json({ success: true, token, role: 'admin' })
    }

    // B) Verificar si es USUARIO CLIENTE
    const usuarios = leerUsuarios()
    // Buscamos SOLO por nombre de usuario primero
    const usuarioEncontrado = usuarios.find(u => u.username === username)

    if (usuarioEncontrado) {
        // 👇 AQUÍ COMPARAMOS LA CONTRASEÑA ENCRIPTADA
        // Si la contraseña no está encriptada (usuarios viejos), comparamos texto plano
        const coincide = usuarioEncontrado.password.startsWith('$2a$') 
            ? await bcrypt.compare(password, usuarioEncontrado.password)
            : usuarioEncontrado.password === password;

        if (coincide) {
            const token = jwt.sign({ role: 'client', id: usuarioEncontrado.id, username }, process.env.JWT_SECRET, { expiresIn: '4h' })
            return res.json({ success: true, token, role: 'client', user: usuarioEncontrado })
        }
    }

    res.status(401).json({ success: false, message: 'Credenciales incorrectas ⛔' })
}

// 2. REGISTRO (Solo para clientes)
const register = async (req, res) => { // 👈 Ahora es ASYNC
    const { username, password } = req.body
    const usuarios = leerUsuarios()

    // Verificar si ya existe
    if (usuarios.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'El usuario ya existe' })
    }

    // 👇 AQUÍ ENCRIPTAMOS LA CONTRASEÑA
    const passwordHash = await bcrypt.hash(password, 10)

    const nuevoUsuario = {
        id: Date.now(),
        username,
        password: passwordHash, // Guardamos el hash, NO el texto plano
        nombre: '',
        telefono: '',
        provincia: '',
        ciudad: '',
        direccion: '',
        dni: ''
    }

    usuarios.push(nuevoUsuario)
    guardarUsuarios(usuarios)

    res.json({ success: true, message: 'Usuario creado con éxito' })
}

// 3. ACTUALIZAR PERFIL (Sin cambios)
const updateProfile = (req, res) => {
    const { username, datos } = req.body 
    const usuarios = leerUsuarios()
    
    const index = usuarios.findIndex(u => u.username === username)

    if (index !== -1) {
        usuarios[index] = { ...usuarios[index], ...datos }
        guardarUsuarios(usuarios)
        res.json({ success: true, user: usuarios[index] })
    } else {
        res.status(404).json({ error: 'Usuario no encontrado' })
    }
}

module.exports = { login, register, updateProfile }