const pool = require('../db');

// Esta función es para que el Admin lea los logs desde el frontend
const getLogs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM logs ORDER BY creado_en DESC LIMIT 100');
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el historial' });
  }
};

// Esta función la usaremos INTERNAMENTE en otros controladores para guardar cosas
const registrarLog = async (usuario, accion, detalle = '') => {
  try {
    await pool.query(
      'INSERT INTO logs (usuario, accion, detalle) VALUES (?, ?, ?)',
      [usuario, accion, detalle]
    );
  } catch (error) {
    console.error('Error guardando log:', error);
  }
};

module.exports = { getLogs, registrarLog };