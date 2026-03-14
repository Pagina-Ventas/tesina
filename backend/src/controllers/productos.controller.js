const pool = require('../db');
const { enviarAlerta } = require('../services/bot.service');
const { registrarLog } = require('./logs.controller');

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
        descripcion,
        imagen
      FROM productos
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('ERROR LEYENDO PRODUCTOS:', err);
    res.status(500).json({
      error: 'Error leyendo productos',
      detail: err.message
    });
  }
};

// 2. Crear producto
const createProducto = async (req, res) => {
  try {
    const { nombre, precio, categoria, stock, stockMinimo, descripcion } = req.body;
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    console.log('BODY RECIBIDO CREATE PRODUCTO:', req.body);

    const [result] = await pool.query(
      `
      INSERT INTO productos (nombre, precio, categoria, stock, stock_minimo, descripcion, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre || '',
        Number(precio || 0),
        categoria || null,
        Number(stock || 0),
        Number(stockMinimo || 0),
        descripcion || '',
        imagenUrl
      ]
    );

    await registrarLog(
      'Administrador',
      'CREAR_PRODUCTO',
      `Se creó el producto "${nombre}" (ID: ${result.insertId}) con ${stock || 0} de stock inicial.`
    );

    res.json({
      success: true,
      producto: {
        id: result.insertId,
        nombre: nombre || '',
        precio: Number(precio || 0),
        categoria: categoria || null,
        stock: Number(stock || 0),
        stockMinimo: Number(stockMinimo || 0),
        descripcion: descripcion || '',
        imagen: imagenUrl
      }
    });
  } catch (err) {
    console.error('ERROR CREANDO PRODUCTO:', err);
    res.status(500).json({
      success: false,
      error: 'Error creando producto',
      detail: err.message
    });
  }
};

// 3. Reponer stock
const reponerStock = async (req, res) => {
  const idProd = Number(req.params.id);
  const cantidad = Number(req.body?.cantidad);

  if (!Number.isFinite(idProd) || idProd <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return res.status(400).json({ success: false, message: 'Cantidad inválida (debe ser > 0)' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `
      SELECT 
        id,
        nombre,
        stock,
        stock_minimo AS stockMinimo,
        precio,
        categoria,
        descripcion,
        imagen
      FROM productos
      WHERE id = ?
      FOR UPDATE
      `,
      [idProd]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const prod = rows[0];
    const stockActual = Number(prod.stock || 0);
    const nuevoStock = stockActual + cantidad;

    await conn.query(`UPDATE productos SET stock = ? WHERE id = ?`, [nuevoStock, idProd]);

    await conn.commit();

    await registrarLog(
      'Administrador',
      'REPONER_STOCK',
      `Se agregaron ${cantidad} unidades al producto "${prod.nombre}". Stock anterior: ${stockActual}, Nuevo stock: ${nuevoStock}.`
    );

    return res.json({
      success: true,
      producto: {
        ...prod,
        stock: nuevoStock,
        stockMinimo: Number(prod.stockMinimo || 0),
        precio: Number(prod.precio || 0),
        descripcion: prod.descripcion || ''
      }
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('REPONER STOCK ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Error reponiendo stock',
      detail: err.message
    });
  } finally {
    conn.release();
  }
};

// 4. Eliminar producto
const eliminarProducto = async (req, res) => {
  const idProd = Number(req.params.id);

  if (!Number.isFinite(idProd) || idProd <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  try {
    const [prodRows] = await pool.query(`SELECT nombre FROM productos WHERE id = ?`, [idProd]);
    const nombreProducto = prodRows.length > 0 ? prodRows[0].nombre : `ID ${idProd}`;

    const [result] = await pool.query(`DELETE FROM productos WHERE id = ?`, [idProd]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    await registrarLog(
      'Administrador',
      'ELIMINAR_PRODUCTO',
      `Se eliminó el producto "${nombreProducto}" del catálogo.`
    );

    return res.json({ success: true, deletedId: idProd });
  } catch (err) {
    console.error('ELIMINAR PRODUCTO ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Error eliminando producto',
      detail: err.message
    });
  }
};

// 5. Vender producto
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

    const [rows] = await conn.query(
      `
      SELECT id, nombre, stock, stock_minimo AS stockMinimo
      FROM productos
      WHERE id = ?
      FOR UPDATE
      `,
      [idProd]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.send('❌ Error: Producto no encontrado.');
    }

    const prod = rows[0];
    const stockActual = Number(prod.stock);
    const stockMin = Number(prod.stockMinimo);

    if (stockActual < cantidadVenta) {
      await conn.rollback();
      return res.send(`❌ Error: No hay suficiente stock. Solo quedan ${stockActual}.`);
    }

    const nuevoStock = stockActual - cantidadVenta;

    await conn.query(`UPDATE productos SET stock = ? WHERE id = ?`, [nuevoStock, idProd]);

    await conn.commit();

    await registrarLog(
      'Sistema',
      'VENTA_MANUAL',
      `Se descontaron ${cantidadVenta} unidades de "${prod.nombre}".`
    );

    let mensajeRespuesta = `✅ ¡Venta Exitosa! Se vendieron ${cantidadVenta} de ${prod.nombre}. Stock restante: ${nuevoStock}.`;

    if (nuevoStock <= stockMin) {
      console.log('🚨 CONDICIÓN DE ALERTA CUMPLIDA. Enviando mensaje...');
      try {
        await enviarAlerta({ ...prod, stock: nuevoStock, stockMinimo: stockMin }, true);
        mensajeRespuesta += ' 🚨 SE DISPARÓ UNA ALERTA DE STOCK.';
      } catch (error) {
        console.error('❌ Error enviando alerta:', error);
      }
    }

    res.send(mensajeRespuesta);
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('ERROR PROCESANDO VENTA:', err);
    res.status(500).send('❌ Error procesando venta.');
  } finally {
    conn.release();
  }
};

// 6. Verificar Stock Manualmente
const verificarStock = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        nombre,
        stock,
        stock_minimo AS stockMinimo
      FROM productos
      WHERE stock <= stock_minimo
      ORDER BY (stock - stock_minimo) ASC
    `);

    let alertas = 0;

    for (const prod of rows) {
      await enviarAlerta(prod, false);
      alertas++;
    }

    if (alertas > 0) {
      res.send(`✅ Se enviaron ${alertas} alertas a Telegram.`);
    } else {
      res.send('👍 Todo el stock está saludable. No hay alertas.');
    }
  } catch (err) {
    console.error('ERROR VERIFICANDO STOCK:', err);
    res.status(500).send('❌ Error verificando stock.');
  }
};

// 7. Actualizar producto completo
const updateProducto = async (req, res) => {
  const idProd = Number(req.params.id);

  if (!Number.isFinite(idProd) || idProd <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  const conn = await pool.getConnection();

  try {
    const { nombre, precio, categoria, stock, stockMinimo, descripcion } = req.body;

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `
      SELECT nombre, stock, precio, descripcion
      FROM productos
      WHERE id = ?
      FOR UPDATE
      `,
      [idProd]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const prodAnterior = rows[0];

    let query = `
      UPDATE productos
      SET nombre = ?, precio = ?, categoria = ?, stock = ?, stock_minimo = ?, descripcion = ?
    `;

    let params = [
      nombre || prodAnterior.nombre,
      Number(precio || 0),
      categoria || null,
      Number(stock || 0),
      Number(stockMinimo || 0),
      descripcion || ''
    ];

    if (req.file) {
      query += `, imagen = ?`;
      params.push(`/uploads/${req.file.filename}`);
    }

    query += ` WHERE id = ?`;
    params.push(idProd);

    await conn.query(query, params);
    await conn.commit();

    await registrarLog(
      'Administrador',
      'EDITAR_PRODUCTO',
      `Se editó "${nombre || prodAnterior.nombre}". Precio: $${precio || prodAnterior.precio}, Stock: ${stock || prodAnterior.stock}.`
    );

    const [updatedRows] = await pool.query(
      `
      SELECT 
        id,
        nombre,
        precio,
        categoria,
        stock,
        stock_minimo AS stockMinimo,
        descripcion,
        imagen
      FROM productos
      WHERE id = ?
      `,
      [idProd]
    );

    res.json({ success: true, producto: updatedRows[0] });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('ERROR EDITANDO PRODUCTO:', err);
    res.status(500).json({
      success: false,
      message: 'Error editando producto',
      detail: err.message
    });
  } finally {
    conn.release();
  }
};

module.exports = {
  getProductos,
  createProducto,
  reponerStock,
  eliminarProducto,
  venderProducto,
  verificarStock,
  updateProducto
};