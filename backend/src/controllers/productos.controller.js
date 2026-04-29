const pool = require('../db');
const { enviarAlerta } = require('../services/bot.service');
const { registrarLog } = require('./logs.controller');
const cloudinary = require('../config/cloudinary');

// Convierte números del formulario.
// Acepta: 40000, 40000.00, 40000,00, 40.000,00
const parseNumero = (valor, defecto = 0) => {
  if (valor === undefined || valor === null || valor === '') return defecto;

  const texto = String(valor).trim();

  let normalizado = texto;

  // Caso argentino/europeo: 40.000,50 => 40000.50
  if (texto.includes(',')) {
    normalizado = texto.replace(/\./g, '').replace(',', '.');
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : defecto;
};

// Subir imagen a Cloudinary desde buffer
const subirACloudinary = (buffer, folder = 'productos') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

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

    let imagenUrl = null;

    if (req.file) {
      const resultadoCloudinary = await subirACloudinary(req.file.buffer, 'productos');
      imagenUrl = resultadoCloudinary.secure_url;
    }

    console.log('BODY RECIBIDO CREATE PRODUCTO:', req.body);

    const precioNum = parseNumero(precio);
    const stockNum = parseNumero(stock);
    const stockMinimoNum = parseNumero(stockMinimo);

    const [result] = await pool.query(
      `
      INSERT INTO productos (nombre, precio, categoria, stock, stock_minimo, descripcion, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nombre || '',
        precioNum,
        categoria || null,
        stockNum,
        stockMinimoNum,
        descripcion || '',
        imagenUrl
      ]
    );

    await registrarLog(
      'Administrador',
      'CREAR_PRODUCTO',
      `Se creó el producto "${nombre}" (ID: ${result.insertId}) con ${stockNum} de stock inicial.`
    );

    res.json({
      success: true,
      producto: {
        id: result.insertId,
        nombre: nombre || '',
        precio: precioNum,
        categoria: categoria || null,
        stock: stockNum,
        stockMinimo: stockMinimoNum,
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
  const cantidad = parseNumero(req.body?.cantidad);

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
    const stockActual = parseNumero(prod.stock);
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
        stockMinimo: parseNumero(prod.stockMinimo),
        precio: parseNumero(prod.precio),
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
  const cantidadVenta = parseNumero(req.params.cantidad);

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
    const stockActual = parseNumero(prod.stock);
    const stockMin = parseNumero(prod.stockMinimo);

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
      SELECT nombre, stock, precio, descripcion, imagen, categoria, stock_minimo AS stockMinimo
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

    const precioNum = precio !== undefined && precio !== null && precio !== ''
      ? parseNumero(precio, parseNumero(prodAnterior.precio))
      : parseNumero(prodAnterior.precio);

    const stockNum = stock !== undefined && stock !== null && stock !== ''
      ? parseNumero(stock, parseNumero(prodAnterior.stock))
      : parseNumero(prodAnterior.stock);

    const stockMinimoNum = stockMinimo !== undefined && stockMinimo !== null && stockMinimo !== ''
      ? parseNumero(stockMinimo, parseNumero(prodAnterior.stockMinimo))
      : parseNumero(prodAnterior.stockMinimo);

    let query = `
      UPDATE productos
      SET nombre = ?, precio = ?, categoria = ?, stock = ?, stock_minimo = ?, descripcion = ?
    `;

    let params = [
      nombre || prodAnterior.nombre,
      precioNum,
      categoria || prodAnterior.categoria || null,
      stockNum,
      stockMinimoNum,
      descripcion ?? prodAnterior.descripcion ?? ''
    ];

    if (req.file) {
      const resultadoCloudinary = await subirACloudinary(req.file.buffer, 'productos');
      const imagenUrl = resultadoCloudinary.secure_url;

      query += `, imagen = ?`;
      params.push(imagenUrl);
    }

    query += ` WHERE id = ?`;
    params.push(idProd);

    await conn.query(query, params);
    await conn.commit();

    await registrarLog(
      'Administrador',
      'EDITAR_PRODUCTO',
      `Se editó "${nombre || prodAnterior.nombre}". Precio: $${precioNum}, Stock: ${stockNum}.`
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

// 8. Obtener imágenes secundarias de un producto
const getImagenesProducto = async (req, res) => {
  const productoId = Number(req.params.id);

  if (!Number.isFinite(productoId) || productoId <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        id,
        producto_id AS productoId,
        imagen,
        orden
      FROM producto_imagenes
      WHERE producto_id = ?
      ORDER BY orden ASC, id ASC
      `,
      [productoId]
    );

    res.json(rows);
  } catch (err) {
    console.error('ERROR OBTENIENDO IMÁGENES DEL PRODUCTO:', err);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo imágenes del producto',
      detail: err.message
    });
  }
};

// 9. Agregar imágenes secundarias a un producto
const agregarImagenesProducto = async (req, res) => {
  const productoId = Number(req.params.id);

  if (!Number.isFinite(productoId) || productoId <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No se subieron imágenes' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [productoRows] = await conn.query(
      `SELECT id, nombre FROM productos WHERE id = ? FOR UPDATE`,
      [productoId]
    );

    if (productoRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const [ordenRows] = await conn.query(
      `SELECT COALESCE(MAX(orden), 0) AS maxOrden FROM producto_imagenes WHERE producto_id = ?`,
      [productoId]
    );

    let ordenActual = parseNumero(ordenRows[0]?.maxOrden);

    for (const file of req.files) {
      ordenActual += 1;

      const resultadoCloudinary = await subirACloudinary(file.buffer, 'productos/secundarias');
      const imagenUrl = resultadoCloudinary.secure_url;

      await conn.query(
        `
        INSERT INTO producto_imagenes (producto_id, imagen, orden)
        VALUES (?, ?, ?)
        `,
        [productoId, imagenUrl, ordenActual]
      );
    }

    await conn.commit();

    const [imagenes] = await pool.query(
      `
      SELECT 
        id,
        producto_id AS productoId,
        imagen,
        orden
      FROM producto_imagenes
      WHERE producto_id = ?
      ORDER BY orden ASC, id ASC
      `,
      [productoId]
    );

    await registrarLog(
      'Administrador',
      'AGREGAR_IMAGENES_PRODUCTO',
      `Se agregaron ${req.files.length} imágenes secundarias al producto "${productoRows[0].nombre}".`
    );

    res.json({
      success: true,
      imagenes
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('ERROR AGREGANDO IMÁGENES AL PRODUCTO:', err);
    res.status(500).json({
      success: false,
      message: 'Error agregando imágenes al producto',
      detail: err.message
    });
  } finally {
    conn.release();
  }
};

// 10. Eliminar imagen secundaria
const eliminarImagenProducto = async (req, res) => {
  const imagenId = Number(req.params.imagenId);

  if (!Number.isFinite(imagenId) || imagenId <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id FROM producto_imagenes WHERE id = ?`,
      [imagenId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    }

    await pool.query(`DELETE FROM producto_imagenes WHERE id = ?`, [imagenId]);

    res.json({ success: true, deletedId: imagenId });
  } catch (err) {
    console.error('ERROR ELIMINANDO IMAGEN DEL PRODUCTO:', err);
    res.status(500).json({
      success: false,
      message: 'Error eliminando imagen',
      detail: err.message
    });
  }
};

module.exports = {
  getProductos,
  createProducto,
  reponerStock,
  eliminarProducto,
  venderProducto,
  verificarStock,
  updateProducto,
  getImagenesProducto,
  agregarImagenesProducto,
  eliminarImagenProducto
};