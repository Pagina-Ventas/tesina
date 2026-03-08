const jwt = require('jsonwebtoken');

const verificarAdmin = (req, res, next) => {
  // 1. Obtenemos el token del encabezado (headers)
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado: No se proporcionó un token de seguridad.' 
    });
  }

  // 2. El token suele venir como "Bearer XXXX...", así que extraemos solo el código
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado: Formato de token inválido.' 
    });
  }

  // 3. Verificamos que el token sea auténtico usando tu clave secreta
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Sesión expirada o token inválido. Por favor, volvé a iniciar sesión.' 
      });
    }

    // 4. Verificamos que el rol dentro del token sea realmente 'admin'
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado: No tenés permisos de administrador para realizar esta acción.' 
      });
    }

    // 5. Si todo está OK, guardamos los datos del admin en la petición y continuamos
    req.user = decoded;
    next();
  });
};

module.exports = { verificarAdmin };