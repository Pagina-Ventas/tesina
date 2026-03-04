const pool = require('../db');
const { enviarAlerta } = require('../services/bot.service');

// 1. Obtener productos
const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        nombre, 
        precio, 
        categoria, 
        stock, 
        stock_minimo AS stockMinimo, 
        imagen
      FROM productos
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error leyendo productos', detail: err.message });
  }
};

// 2. Crear producto
const createProducto = async (req, res) => {
  try {
    const { nombre, precio, categoria, stock, stockMinimo } = req.body;
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `
      INSERT INTO productos (nombre, precio, categoria, stock, stock_minimo, imagen)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        Number(precio || 0),
        categoria || null,
        Number(stock || 0),
        Number(stockMinimo || 0),
        imagenUrl
      ]
    );

    res.json({
      success: true,
      producto: {
        id: result.insertId,
        nombre,
        precio: Number(precio || 0),
        categoria: categoria || null,
        stock: Number(stock || 0),
        stockMinimo: Number(stockMinimo || 0),
        imagen: imagenUrl
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error creando producto', detail: err.message });
  }
};

// 3. Vender producto (misma lógica pero en SQL)
const venderProducto = async (req, res) => {
  const idProd = Number(req.params.id);
  const cantidadVenta = Number(req.params.cantidad);

  console.log(`🛒 Procesando venta... ID: ${idProd}, Cant: ${cantidadVenta}`);

  if (!Number.isFinite(idProd) || !Number.isFinite(cantidadVenta) || cantidadVenta <= 0) {
    return res.status(400).send('❌ Error: parámetros inválidos.');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Bloqueamos la fila para evitar ventas simultáneas rompiendo stock
    const [rows] = await conn.query(
      `SELECT id, nombre, stock, stock_minimo AS stockMinimo
       FROM productos
       WHERE id = ?
       FOR UPDATE`,
      [idProd]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.send("❌ Error: Producto no encontrado.");
    }

    const prod = rows[0];
    const stockActual = Number(prod.stock);
    const stockMin = Number(prod.stockMinimo);

    if (stockActual < cantidadVenta) {
      await conn.rollback();
      return res.send(`❌ Error: No hay suficiente stock. Solo quedan ${stockActual}.`);
    }

    const nuevoStock = stockActual - cantidadVenta;

    await conn.query(
      `UPDATE productos SET stock = ? WHERE id = ?`,
      [nuevoStock, idProd]
    );

    await conn.commit();

    let mensajeRespuesta = `✅ ¡Venta Exitosa! Se vendieron ${cantidadVenta} de ${prod.nombre}. Stock restante: ${nuevoStock}.`;

    console.log(`🔎 Verificando alerta: ¿${nuevoStock} <= ${stockMin}?`);
    if (nuevoStock <= stockMin) {
      console.log("🚨 CONDICIÓN DE ALERTA CUMPLIDA. Enviando mensaje...");
      try {
        // Para el bot, le pasamos el producto con el stock actualizado
        await enviarAlerta({ ...prod, stock: nuevoStock, stockMinimo: stockMin }, true);
        mensajeRespuesta += " 🚨 SE DISPARÓ UNA ALERTA DE STOCK.";
      } catch (error) {
        console.error("❌ Error enviando alerta:", error);
      }
    } else {
      console.log("👍 Stock saludable, no se envía alerta.");
    }

    res.send(mensajeRespuesta);
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error(err);
    res.status(500).send("❌ Error procesando venta.");
  } finally {
    conn.release();
  }
};

// 4. Verificar Stock Manualmente (SQL)
const verificarStock = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, nombre, stock, stock_minimo AS stockMinimo
      FROM productos
      WHERE stock <= stock_minimo
      ORDER BY (stock - stock_minimo) ASC
    `);

    let alertas = 0;
    for (const prod of rows) {
      await enviarAlerta(prod, false);
      alertas++;
    }

    if (alertas > 0) res.send(`✅ Se enviaron ${alertas} alertas a Telegram.`);
    else res.send("👍 Todo el stock está saludable. No hay alertas.");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error verificando stock.");
  }
};

module.exports = {
  getProductos,
  createProducto,
  venderProducto,
  verificarStock
};