const pool = require('../db');
const { enviarAlerta, enviarPedido } = require('../services/bot.service');

// 👇 IMPORTAMOS LA FUNCIÓN PARA GUARDAR LOGS
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
        total,
        estado,
        creado_en
      FROM pedidos
      ORDER BY id DESC
      LIMIT 500
    `);

    res.json(rows);
  } catch (err) {
    console.error('GET PEDIDOS ERROR:', err);
    res.status(500).json({ error: 'Error leyendo pedidos', detail: err.message });
  }
};

// NUEVO: 1.5 Obtener pedidos de UN solo usuario (Para el CLIENTE)
const getMisPedidos = async (req, res) => {
  try {
    const usuarioId = req.user.id; 

    const [rows] = await pool.query(`
      SELECT 
        id AS pedidoId,
        id AS id,
        cliente_nombre AS cliente,
        total,
        estado,
        creado_en
      FROM pedidos
      WHERE usuario_id = ?
      ORDER BY id DESC
    `, [usuarioId]);

    res.json(rows);
  } catch (err) {
    console.error('GET MIS PEDIDOS ERROR:', err);
    res.status(500).json({ error: 'Error leyendo tus pedidos', detail: err.message });
  }
};

// 2. Crear nuevo pedido (Cliente compra en la web)
const createPedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nuevoPedido = req.body || {};
    const items = Array.isArray(nuevoPedido.items) ? nuevoPedido.items : [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'El pedido no tiene items' });
    }

    const usuarioId = nuevoPedido.usuario_id || (req.user ? req.user.id : null);

    const clienteNombre =
      (nuevoPedido.cliente && (nuevoPedido.cliente.nombre || nuevoPedido.cliente.name)) ||
      nuevoPedido.cliente ||
      nuevoPedido.nombre ||
      null;

    const clienteTelefono =
      (nuevoPedido.cliente && (nuevoPedido.cliente.telefono || nuevoPedido.cliente.phone)) ||
      nuevoPedido.telefono ||
      null;

    const clienteDireccion =
      (nuevoPedido.cliente && (nuevoPedido.cliente.direccion || nuevoPedido.cliente.address)) ||
      nuevoPedido.direccion ||
      null;

    const totalCalc = items.reduce((acc, it) => {
      const precio = Number(it.precio || 0);
      const cant = Number(it.cantidad || 1);
      return acc + precio * cant;
    }, 0);

    const totalFinal = Number.isFinite(Number(nuevoPedido.total)) ? Number(nuevoPedido.total) : totalCalc;
    const estadoFinal = nuevoPedido.estado || 'PENDIENTE';

    await conn.beginTransaction();

    const [rPedido] = await conn.query(
      `INSERT INTO pedidos (usuario_id, cliente_nombre, cliente_telefono, cliente_direccion, total, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, clienteNombre, clienteTelefono, clienteDireccion, totalFinal, estadoFinal]
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

    // 📝 REGISTRAMOS LA CREACIÓN DEL PEDIDO
    const actorLog = usuarioId ? `Usuario ID ${usuarioId}` : 'Invitado';
    await registrarLog(actorLog, 'NUEVO_PEDIDO', `Creó el pedido #${pedidoId} por un total de $${totalFinal}.`);

    // 🤖 ENVIAR NOTIFICACIÓN A TELEGRAM
    try {
      await enviarPedido({
        id: pedidoId,
        cliente: clienteNombre || 'Cliente',
        total: totalFinal
      });
    } catch (error) {
      console.error("Error enviando aviso a Telegram:", error.message);
    }

    res.json({
      success: true,
      pedido: {
        ...nuevoPedido,
        pedidoId,
        id: pedidoId,
        total: totalFinal,
        estado: estadoFinal,
      },
    });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('CREATE PEDIDO ERROR:', err);
    res.status(500).json({ success: false, error: 'Error creando pedido', detail: err.message });
  } finally {
    conn.release();
  }
};

// 3. ACTUALIZAR ESTADO
const updatePedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const { estado } = req.body || {};

    if (!estado) {
      return res.status(400).json({ success: false, message: 'Falta estado' });
    }

    await conn.beginTransaction();

    const [pRows] = await conn.query(
      `SELECT id, estado FROM pedidos WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (pRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = pRows[0].estado;

    if (estado === 'PAGADO' && estadoAnterior !== 'PAGADO') {
      const [items] = await conn.query(
        `SELECT producto_id AS productoId, nombre, cantidad FROM pedido_items WHERE pedido_id = ?`,
        [id]
      );

      for (const item of items) {
        const productoId = item.productoId;
        if (!productoId) continue;

        const [prodRows] = await conn.query(
          `SELECT id, nombre, stock, stock_minimo AS stockMinimo FROM productos WHERE id = ? FOR UPDATE`,
          [productoId]
        );

        if (prodRows.length === 0) continue;

        const prod = prodRows[0];
        const cant = Number(item.cantidad || 1);
        let nuevoStock = Number(prod.stock) - cant;
        if (nuevoStock < 0) nuevoStock = 0;

        await conn.query(`UPDATE productos SET stock = ? WHERE id = ?`, [nuevoStock, prod.id]);
        item._alerta = { ...prod, stock: nuevoStock, stockMinimo: Number(prod.stockMinimo) };
      }

      await conn.query(`UPDATE pedidos SET estado = ? WHERE id = ?`, [estado, id]);
      await conn.commit();

      await registrarLog('Administrador', 'PEDIDO_PAGADO', `Confirmó el pago del pedido #${id} y se descontó el stock.`);

      for (const item of items) {
        if (!item._alerta) continue;
        const prod = item._alerta;
        if (prod.stock <= prod.stockMinimo) {
          try { await enviarAlerta(prod, true); } catch (e) {}
        }
      }

      return res.json({ success: true, pedido: { pedidoId: id, id, estado } });
    }

    await conn.query(`UPDATE pedidos SET estado = ? WHERE id = ?`, [estado, id]);
    await conn.commit();
    
    await registrarLog('Administrador', 'ESTADO_PEDIDO', `Cambió el estado del pedido #${id} a ${estado}.`);

    return res.json({ success: true, pedido: { pedidoId: id, id, estado } });

  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('UPDATE PEDIDO ERROR:', err);
    res.status(500).json({ error: 'Error actualizando pedido', detail: err.message });
  } finally {
    conn.release();
  }
};

const getPedidoById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [pRows] = await pool.query(
      `SELECT 
        id AS pedidoId,
        id AS id,
        usuario_id,
        cliente_nombre AS clienteNombre,
        cliente_telefono AS clienteTelefono,
        cliente_direccion AS clienteDireccion,
        total,
        estado,
        creado_en
      FROM pedidos
      WHERE id = ?`,
      [id]
    );

    if (pRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
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

    return res.json({ ...pRows[0], items });

  } catch (err) {
    console.error('GET PEDIDO BY ID ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deletePedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);

    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT id FROM pedidos WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    await conn.query(`DELETE FROM pedidos WHERE id = ?`, [id]);

    await conn.commit();
    
    await registrarLog('Administrador', 'ELIMINAR_PEDIDO', `Eliminó el pedido #${id} del sistema.`);

    return res.json({ success: true, deletedId: id });

  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('DELETE PEDIDO ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

module.exports = { getPedidos, getMisPedidos, createPedido, updatePedido, getPedidoById, deletePedido };