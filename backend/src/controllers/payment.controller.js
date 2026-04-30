const pool = require('../db');
const { enviarCorreoCompra } = require('../services/mail.service');
const mpService = require('../services/mercadopago.service');
const { enviarAlerta } = require('../services/bot.service');

const crearPreferencia = async (req, res) => {
  try {
    const { items, cliente, idPedido, pedidoId } = req.body || {};
    const pid = Number(idPedido || pedidoId);

    if (!Number.isFinite(pid) || pid <= 0) {
      return res.status(400).json({ success: false, message: 'idPedido inválido' });
    }

    let baseURL = process.env.FRONT_URL ? process.env.FRONT_URL.trim() : '';

    if (!baseURL) {
      baseURL = 'http://localhost:5173';
    } else if (!baseURL.startsWith('http')) {
      baseURL = `http://${baseURL}`;
    }

    baseURL = baseURL.replace(/\/$/, '');

    let notificationURL = process.env.MP_NOTIFICATION_URL
      ? process.env.MP_NOTIFICATION_URL.trim()
      : null;

    if (notificationURL && !notificationURL.startsWith('http')) {
      notificationURL = `https://${notificationURL}`;
    }

    if (notificationURL && notificationURL.includes('localhost')) {
      notificationURL = null;
    }

    const result = await mpService.crearPreferenciaPago(
      items,
      pid,
      cliente,
      baseURL,
      notificationURL
    );

    return res.json({
      success: true,
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });
  } catch (error) {
    console.error('ERROR MP:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar pago',
      detail: error.message
    });
  }
};

const procesarPagoAprobado = async (idPedido) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT * FROM pedidos WHERE id = ? FOR UPDATE`,
      [idPedido]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return {
        success: false,
        message: 'Pedido no encontrado'
      };
    }

    const pedido = rows[0];

    if (pedido.estado === 'PAGADO') {
      await conn.commit();
      return {
        success: true,
        yaProcesado: true,
        pedido: {
          id: idPedido,
          estado: 'PAGADO'
        }
      };
    }

    const [items] = await conn.query(
      `SELECT producto_id AS productoId, nombre, cantidad 
       FROM pedido_items 
       WHERE pedido_id = ?`,
      [idPedido]
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
      `UPDATE pedidos SET estado = 'PAGADO' WHERE id = ?`,
      [idPedido]
    );

    await conn.commit();

    if (pedido.cliente_email) {
      try {
        await enviarCorreoCompra(
          pedido.cliente_email,
          pedido.cliente_nombre,
          pedido.id,
          pedido.total
        );
      } catch (e) {
        console.error('Error enviando correo:', e.message);
      }
    }

    for (const alerta of alertasAEnviar) {
      try {
        await enviarAlerta(alerta, true);
      } catch (e) {
        console.error('Error enviando alerta Telegram:', e.message);
      }
    }

    return {
      success: true,
      yaProcesado: false,
      pedido: {
        id: idPedido,
        estado: 'PAGADO'
      }
    };
  } catch (error) {
    try {
      await conn.rollback();
    } catch {}

    throw error;
  } finally {
    conn.release();
  }
};

const verificarPago = async (req, res) => {
  try {
    const { paymentId, pedidoId } = req.body || {};

    const pid = Number(pedidoId);
    const mpPaymentId = String(paymentId || '').trim();

    if (!mpPaymentId) {
      return res.status(400).json({
        success: false,
        aprobado: false,
        message: 'Falta paymentId'
      });
    }

    if (!Number.isFinite(pid) || pid <= 0) {
      return res.status(400).json({
        success: false,
        aprobado: false,
        message: 'pedidoId inválido'
      });
    }

    const pagoInfo = await mpService.consultarPago(mpPaymentId);

    const estadoMP = pagoInfo.status;
    const referenciaMP = Number(pagoInfo.external_reference);

    if (referenciaMP !== pid) {
      return res.status(400).json({
        success: false,
        aprobado: false,
        estadoMP,
        message: 'El pago no corresponde a este pedido'
      });
    }

    if (estadoMP !== 'approved') {
      return res.json({
        success: true,
        aprobado: false,
        estadoMP,
        message: 'El pago todavía no fue aprobado por Mercado Pago'
      });
    }

    const resultado = await procesarPagoAprobado(pid);

    return res.json({
      success: true,
      aprobado: true,
      estadoMP,
      ...resultado
    });
  } catch (error) {
    console.error('VERIFICAR PAGO ERROR:', error);
    return res.status(500).json({
      success: false,
      aprobado: false,
      message: 'Error verificando pago',
      detail: error.message
    });
  }
};

const recibirWebhook = async (req, res) => {
  try {
    const paymentId = req.query.id || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    if (!paymentId || type !== 'payment') {
      return res.status(200).send('OK');
    }

    const pagoInfo = await mpService.consultarPago(paymentId);

    if (pagoInfo.status !== 'approved') {
      return res.status(200).send('OK');
    }

    const idPedido = Number(pagoInfo.external_reference);

    if (!Number.isFinite(idPedido) || idPedido <= 0) {
      return res.status(200).send('OK');
    }

    await procesarPagoAprobado(idPedido);

    return res.status(200).send('OK');
  } catch (error) {
    console.error('WEBHOOK ERROR:', error);
    return res.status(200).send('OK');
  }
};

module.exports = {
  crearPreferencia,
  recibirWebhook,
  verificarPago
};