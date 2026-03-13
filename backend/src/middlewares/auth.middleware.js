const jwt = require('jsonwebtoken');

// 🟢 NUEVO: Middleware para clientes y admins (Cualquier usuario logueado)
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado: No se proporcionó un token de seguridad.' 
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado: Formato de token inválido.' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión expirada o token inválido. Por favor, volvé a iniciar sesión.' 
      });
    }

    // Si todo está OK, guardamos los datos del usuario (id, username, role) en la petición
    req.user = decoded;
    next();
  });
};

// 🔴 Middleware exclusivo para Administradores
const verificarAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado: No se proporcionó un token de seguridad.' 
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado: Formato de token inválido.' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión expirada o token inválido. Por favor, volvé a iniciar sesión.' 
      });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado: No tenés permisos de administrador para realizar esta acción.' 
      });
    }

    req.user = decoded;
    next();
  });
};

// 👇 EXPORTAMOS AMBAS FUNCIONES
module.exports = { verificarToken, verificarAdmin };