const pool = require('../db');

// GET /api/categorias?all=1
const getCategorias = async (req, res) => {
  try {
    const all = req.query.all === '1';
    const [rows] = await pool.query(
      all
        ? `SELECT id, nombre, estado FROM categorias ORDER BY nombre ASC`
        : `SELECT id, nombre, estado FROM categorias WHERE estado='ACTIVO' ORDER BY nombre ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error leyendo categorías', detail: err.message });
  }
};

// POST /api/categorias  { nombre }
const createCategoria = async (req, res) => {
  try {
    const nombre = (req.body?.nombre || '').trim();
    if (!nombre) return res.status(400).json({ success: false, message: 'Nombre requerido' });

    const [result] = await pool.query(`INSERT INTO categorias (nombre) VALUES (?)`, [nombre]);

    return res.json({
      success: true,
      categoria: { id: result.insertId, nombre, estado: 'ACTIVO' }
    });
  } catch (err) {
    console.error(err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Esa categoría ya existe' });
    }
    return res.status(500).json({ success: false, message: 'Error creando categoría', detail: err.message });
  }
};

module.exports = {
  getCategorias,
  createCategoria
};

// NUEVO: Eliminar categoría y sus productos en cascada
const deleteCategoria = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    await conn.beginTransaction();

    // 1. Obtener el nombre de la categoría antes de borrarla
    const [catRows] = await conn.query(`SELECT nombre FROM categorias WHERE id = ?`, [id]);
    
    if (catRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    
    const nombreCategoria = catRows[0].nombre;

    // 2. Eliminar todos los productos que tengan esa categoría asignada
    await conn.query(`DELETE FROM productos WHERE categoria = ?`, [nombreCategoria]);

    // 3. Finalmente, eliminar la categoría
    await conn.query(`DELETE FROM categorias WHERE id = ?`, [id]);

    await conn.commit();
    return res.json({ success: true, message: `Categoría '${nombreCategoria}' y sus productos eliminados.` });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('ERROR ELIMINANDO CATEGORÍA:', err);
    return res.status(500).json({ success: false, message: 'Error eliminando categoría', detail: err.message });
  } finally {
    conn.release();
  }
};

module.exports = {
  getCategorias,
  createCategoria,
  deleteCategoria // <-- No olvides exportarla
};