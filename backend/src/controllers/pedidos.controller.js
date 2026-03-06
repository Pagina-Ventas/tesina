const pool = require('../db');
const { enviarAlerta } = require('../services/bot.service');

// 1. Obtener todos los pedidos
const getPedidos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id AS pedidoId,
        id AS id,
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

// 2. Crear nuevo pedido (Cliente compra en la web)
const createPedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const nuevoPedido = req.body || {};
    const items = Array.isArray(nuevoPedido.items) ? nuevoPedido.items : [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'El pedido no tiene items' });
    }

    // Compatibilidad: algunos front mandan cliente como string, otros como objeto
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

    // Total: si viene, lo usamos; si no, lo calculamos
    const totalCalc = items.reduce((acc, it) => {
      const precio = Number(it.precio || 0);
      const cant = Number(it.cantidad || 1);
      return acc + precio * cant;
    }, 0);

    const totalFinal = Number.isFinite(Number(nuevoPedido.total)) ? Number(nuevoPedido.total) : totalCalc;
    const estadoFinal = nuevoPedido.estado || 'PENDIENTE';

    await conn.beginTransaction();

    // 1) Insert pedido
    const [rPedido] = await conn.query(
      `INSERT INTO pedidos (cliente_nombre, cliente_telefono, cliente_direccion, total, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [clienteNombre, clienteTelefono, clienteDireccion, totalFinal, estadoFinal]
    );

    const pedidoId = rPedido.insertId;

    // 2) Insert items
    for (const item of items) {
      // Tu JSON viejo usa item.id (producto id). Lo mantenemos.
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

    // ✅ Devolvemos ID real de MySQL con dos nombres: pedidoId e id (compat)
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

// 3. ACTUALIZAR ESTADO (descontar stock + alertas al pasar a PAGADO, devolver al CANCELAR)
const updatePedido = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    const { estado } = req.body || {};

    if (!estado) {
      return res.status(400).json({ success: false, message: 'Falta estado' });
    }

    await conn.beginTransaction();

    // Traemos pedido actual y bloqueamos
    const [pRows] = await conn.query(
      `SELECT id, estado FROM pedidos WHERE id = ? FOR UPDATE`,
      [id]
    );

    if (pRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = pRows[0].estado;

    // A) Si se confirma (PAGADO) y antes NO estaba pagado → descontar stock
    if (estado === 'PAGADO' && estadoAnterior !== 'PAGADO') {
      console.log('✅ Confirmando pedido... Descontando stock y verificando alertas.');

      const [items] = await conn.query(
        `SELECT producto_id AS productoId, nombre, cantidad
         FROM pedido_items
         WHERE pedido_id = ?`,
        [id]
      );

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

        await conn.query(`UPDATE productos SET stock = ? WHERE id = ?`, [nuevoStock, prod.id]);
        item._alerta = { ...prod, stock: nuevoStock, stockMinimo: Number(prod.stockMinimo) };
      }

      await conn.query(`UPDATE pedidos SET estado = ? WHERE id = ?`, [estado, id]);
      await conn.commit();

      for (const item of items) {
        if (!item._alerta) continue;
        const prod = item._alerta;
        if (prod.stock <= prod.stockMinimo) {
          console.log(`🚨 ALERTA: ${prod.nombre} bajó a ${prod.stock}`);
          try {
            await enviarAlerta(prod, true);
          } catch (e) {
            console.error('Error enviando alerta:', e);
          }
        }
      }

      return res.json({ success: true, pedido: { pedidoId: id, id, estado } });
    }

    // B) NUEVO: Si se CANCELA y antes estaba PAGADO → devolver stock
    if (estado === 'CANCELADO' && estadoAnterior === 'PAGADO') {
      console.log('🔄 Pedido cancelado. Devolviendo stock a los productos...');
      
      const [items] = await conn.query(
        `SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?`,
        [id]
      );

      for (const item of items) {
        if (item.producto_id) {
          await conn.query(
            `UPDATE productos SET stock = stock + ? WHERE id = ?`, 
            [item.cantidad, item.producto_id]
          );
        }
      }

      await conn.query(`UPDATE pedidos SET estado = ? WHERE id = ?`, [estado, id]);
      await conn.commit();
      return res.json({ success: true, pedido: { pedidoId: id, id, estado } });
    }

    // C) Si no es confirmación ni cancelación de algo pagado, solo cambiamos estado
    await conn.query(`UPDATE pedidos SET estado = ? WHERE id = ?`, [estado, id]);
    await conn.commit();

    return res.json({ success: true, pedido: { pedidoId: id, id, estado } });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('UPDATE PEDIDO ERROR:', err);
    res.status(500).json({ error: 'Error actualizando pedido', detail: err.message });
  } finally {
    conn.release();
  }
};

// 4. Obtener pedido por ID (detalle + items)
const getPedidoById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [pRows] = await pool.query(
      `SELECT 
        id AS pedidoId,
        id AS id,
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
      WHERE pedido_id = ?
      ORDER BY id ASC`,
      [id]
    );

    return res.json({ ...pRows[0], items });
  } catch (err) {
    console.error('GET PEDIDO BY ID ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ 5. Eliminar pedido (borra también items por ON DELETE CASCADE)
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

    // Borra el pedido (y sus items por FK cascade)
    await conn.query(`DELETE FROM pedidos WHERE id = ?`, [id]);

    await conn.commit();
    return res.json({ success: true, deletedId: id });
  } catch (err) {
    try { await conn.rollback(); } catch {}
    console.error('DELETE PEDIDO ERROR:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

module.exports = { getPedidos, createPedido, updatePedido, getPedidoById, deletePedido };