const jwt = require('jsonwebtoken');
const pool = require('../db');
const { enviarAlerta, enviarPedido } = require('../services/bot.service');
const { enviarCorreoCompra } = require('../services/mail.service');
const { registrarLog } = require('./logs.controller');

// 1. Obtener todos los pedidos (Para el ADMIN)
const getPedidos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id AS pedidoId,
        id AS id,
        usuario_id,
        cliente_nombre AS cliente,
        cliente_email AS email,
        cliente_telefono AS telefono,
        total,
        estado,
        metodo_pago AS metodoPago,
        tipo_entrega AS tipoEntrega,
        creado_en
      FROM pedidos
      ORDER BY id DESC
      LIMIT 500
    `);

    res.json(rows);
  } catch (err) {
    console.error('GET PEDIDOS ERROR:', err);
    res.status(500).json({
      success: false,
      error: 'Error leyendo pedidos',
      detail: err.message
    });
  }
};

// 1.5 Obtener pedidos de un solo usuario (Para el CLIENTE)
const getMisPedidos = async (req, res) => {
  try {
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const [rows] = await pool.query(`
      SELECT 
        id AS pedidoId,
        id AS id,
        cliente_nombre AS cliente,
        cliente_email AS email,
        total,
        estado,
        metodo_pago AS metodoPago,
        tipo_entrega AS tipoEntrega,
        creado_en
      FROM pedidos
      WHERE usuario_id = ?
      ORDER BY id DESC
    `, [usuarioId]);

    res.json(rows);
  } catch (err) {
    console.error('GET MIS PEDIDOS ERROR:', err);
    res.status(500).json({
      success: false,
      error: 'Error leyendo tus pedidos',
      detail: err.message
    });
  }
};

// 2. Crear nuevo pedido (Cliente compra en la web)
const createPedido = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const nuevoPedido = req.body || {};
    const items = Array.isArray(nuevoPedido.items) ? nuevoPedido.items : [];

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido no tiene items'
      });
    }

    let usuarioId = null;

    if (req.user?.id) {
      usuarioId = req.user.id;
    }

    if (!usuarioId) {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          usuarioId = decoded?.id || null;
        } catch (e) {
          usuarioId = null;
        }
      }
    }

    const clienteNombre =
      (nuevoPedido.cliente && (nuevoPedido.cliente.nombre || nuevoPedido.cliente.name)) ||
      nuevoPedido.cliente ||
      nuevoPedido.nombre ||
      null;

    const clienteEmail =
      (nuevoPedido.cliente && (nuevoPedido.cliente.email || nuevoPedido.cliente.correo)) ||
      nuevoPedido.email ||
      nuevoPedido.correo ||
      null;

    const clienteTelefono =
      (nuevoPedido.cliente && (nuevoPedido.cliente.telefono || nuevoPedido.cliente.phone)) ||
      nuevoPedido.telefono ||
      null;

    const clienteDireccion =
      (nuevoPedido.cliente && (nuevoPedido.cliente.direccion || nuevoPedido.cliente.address)) ||
      nuevoPedido.direccion ||
      null;

    const metodoPago =
      nuevoPedido.metodoPago ||
      nuevoPedido.metodo_pago ||
      nuevoPedido.formaPago ||
      null;

    const tipoEntrega =
      nuevoPedido.tipoEntrega ||
      nuevoPedido.tipo_entrega ||
      nuevoPedido.entrega ||
      null;

    const totalCalc = items.reduce((acc, it) => {
      const precio = Number(it.precio || 0);
      const cant = Number(it.cantidad || 1);
      return acc + precio * cant;
    }, 0);

    const totalFinal = Number.isFinite(Number(nuevoPedido.total))
      ? Number(nuevoPedido.total)
      : totalCalc;

    const estadoFinal = nuevoPedido.estado || 'PENDIENTE';

    await conn.beginTransaction();

    const [rPedido] = await conn.query(
      `INSERT INTO pedidos 
      (usuario_id, cliente_nombre, cliente_email, cliente_telefono, cliente_direccion, total, estado, metodo_pago, tipo_entrega)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        clienteNombre,
        clienteEmail,
        clienteTelefono,
        clienteDireccion,
        totalFinal,
        estadoFinal,
        metodoPago,
        tipoEntrega
      ]
    );

    const pedidoId = rPedido.insertId;

    for (const item of items) {
      const productoId = item.productoId || item.id || null;
      const nombre = item.nombre || 'Producto';
      const precio = Number(item.precio || 0);
      const cantidad = Number(item.cantidad || 1);
      const subtotal = precio * cantidad;

      await conn.query(
        `INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedidoId, productoId, nombre, precio, cantidad, subtotal]
      );
    }

    await conn.commit();

    const actorLog = usuarioId ? `Usuario ID ${usuarioId}` : 'Invitado';

    await registrarLog(
      actorLog,
      'NUEVO_PEDIDO',
      `Creó el pedido #${pedidoId} por un total de $${totalFinal}.`
    );

    try {
      await enviarPedido({
        id: pedidoId,
        cliente: clienteNombre || 'Cliente',
        total: totalFinal
      });
    } catch (error) {
      console.error('Error enviando aviso a Telegram:', error.message);
    }

    return res.json({
      success: true,
      pedido: {
        ...nuevoPedido,
        pedidoId,
        id: pedidoId,
        usuario_id: usuarioId,
        clienteNombre,
        clienteEmail,
        clienteTelefono,
        total: totalFinal,
        estado: estadoFinal,
        metodoPago,
        tipoEntrega
      }
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}

    console.error('CREATE PEDIDO ERROR:', err);

    return res.status(500).json({
      success: false,
      error: 'Error creando pedido',
      detail: err.message
    });
  } finally {
    conn.release();
  }
};

// 3. Actualizar estado (ADMIN)
const updatePedido = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const id = Number(req.params.id);
    const { estado } = req.body || {};

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Falta estado'
      });
    }

    await conn.beginTransaction();

    const [pRows] = await conn.query(
      `SELECT 
        id,
        estado,
        cliente_nombre,
        cliente_email,
        total
       FROM pedidos 
       WHERE id = ? 
       FOR UPDATE`,
      [id]
    );

    if (pRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        error: 'Pedido no encontrado'
      });
    }

    const pedido = pRows[0];
    const estadoAnterior = pedido.estado;

    if (estado === 'PAGADO' && estadoAnterior !== 'PAGADO') {
      const [items] = await conn.query(
        `SELECT producto_id AS productoId, nombre, cantidad 
         FROM pedido_items 
         WHERE pedido_id = ?`,
        [id]
      );

      const alertasAEnviar = [];

      for (const item of items) {
        const productoId = item.productoId;
        if (!productoId) continue;

        const [prodRows] = await conn.query(
          `SELECT id, nombre, stock, stock_minimo AS stockMinimo 
           FROM productos 
           WHERE id = ? 
           FOR UPDATE`,
          [productoId]
        );

        if (prodRows.length === 0) continue;

        const prod = prodRows[0];
        const cant = Number(item.cantidad || 1);
        let nuevoStock = Number(prod.stock) - cant;

        if (nuevoStock < 0) nuevoStock = 0;

        await conn.query(
          `UPDATE productos SET stock = ? WHERE id = ?`,
          [nuevoStock, prod.id]
        );

        if (nuevoStock <= Number(prod.stockMinimo)) {
          alertasAEnviar.push({
            ...prod,
            stock: nuevoStock,
            stockMinimo: Number(prod.stockMinimo)
          });
        }
      }

      await conn.query(
        `UPDATE pedidos SET estado = ? WHERE id = ?`,
        [estado, id]
      );

      await conn.commit();

      await registrarLog(
        'Administrador',
        'PEDIDO_PAGADO',
        `Confirmó el pago del pedido #${id} y se descontó el stock.`
      );

      if (pedido.cliente_email) {
        try {
          await enviarCorreoCompra(
            pedido.cliente_email,
            pedido.cliente_nombre || 'Cliente',
            id,
            pedido.total
          );
        } catch (e) {
          console.error('Error enviando correo de compra:', e.message);
        }
      }

      for (const alerta of alertasAEnviar) {
        try {
          await enviarAlerta(alerta, true);
        } catch (e) {
          console.error('Error enviando alerta Telegram:', e.message);
        }
      }

      return res.json({
        success: true,
        pedido: {
          pedidoId: id,
          id,
          estado
        }
      });
    }

    await conn.query(
      `UPDATE pedidos SET estado = ? WHERE id = ?`,
      [estado, id]
    );

    await conn.commit();

    await registrarLog(
      'Administrador',
      'ESTADO_PEDIDO',
      `Cambió el estado del pedido #${id} a ${estado}.`
    );

    return res.json({
      success: true,
      pedido: {
        pedidoId: id,
        id,
        estado
      }
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}

    console.error('UPDATE PEDIDO ERROR:', err);

    return res.status(500).json({
      success: false,
      error: 'Error actualizando pedido',
      detail: err.message
    });
  } finally {
    conn.release();
  }
};

// 4. Ver detalle de pedido con seguridad real
const getPedidoById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID de pedido inválido'
      });
    }

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    let query = `
      SELECT 
        id AS pedidoId,
        id AS id,
        usuario_id,
        cliente_nombre AS clienteNombre,
        cliente_email AS clienteEmail,
        cliente_telefono AS clienteTelefono,
        cliente_direccion AS clienteDireccion,
        metodo_pago AS metodoPago,
        tipo_entrega AS tipoEntrega,
        total,
        estado,
        creado_en
      FROM pedidos
      WHERE id = ?
    `;

    const params = [id];

    if (userRole !== 'admin') {
      query += ` AND usuario_id = ?`;
      params.push(userId);
    }

    const [pRows] = await pool.query(query, params);

    if (pRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado o no tienes permiso para verlo'
      });
    }

    const [items] = await pool.query(
      `SELECT 
        producto_id AS productoId,
        nombre,
        precio,
        cantidad,
        subtotal
      FROM pedido_items
      WHERE pedido_id = ?`,
      [id]
    );

    return res.json({
      ...pRows[0],
      items
    });
  } catch (err) {
    console.error('GET PEDIDO BY ID ERROR:', err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// 5. Eliminar pedido (ADMIN)
const deletePedido = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id FROM pedidos WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    await conn.query(
      `DELETE FROM pedidos WHERE id = ?`,
      [id]
    );

    await conn.commit();

    await registrarLog(
      'Administrador',
      'ELIMINAR_PEDIDO',
      `Eliminó el pedido #${id} del sistema.`
    );

    return res.json({
      success: true,
      deletedId: id
    });
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}

    console.error('DELETE PEDIDO ERROR:', err);

    return res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    conn.release();
  }
};

module.exports = {
  getPedidos,
  getMisPedidos,
  createPedido,
  updatePedido,
  getPedidoById,
  deletePedido
};