const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const pool = require('../db');
const { enviarCorreoCompra } = require('../services/mail.service');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// 1. CREAR PREFERENCIA
const crearPreferencia = async (req, res) => {
  try {
    const { items, cliente, entrega, idPedido } = req.body || {};

    const pid = Number(idPedido);

    if (!Number.isFinite(pid) || pid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'idPedido inválido'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items requeridos'
      });
    }

    const itemsMP = items.map((item) => ({
      title: item.nombre || 'Producto',
      description: item.descripcion || item.nombre || 'Producto',
      quantity: Number(item.cantidad || 1),
      unit_price: Number(item.precio || 0),
      currency_id: 'ARS'
    }));

    const body = {
      items: itemsMP,

      payer: {
        name: cliente?.nombre || '',
        surname: cliente?.apellido || '',
        email: cliente?.email || 'test_user@test.com',
        phone: {
          area_code: '264',
          number: Number(cliente?.telefono || 0)
        },
        address: {
          zip_code: entrega?.cp || '',
          street_name: entrega?.calle || '',
          street_number: Number(entrega?.numeracion || 0)
        }
      },

      back_urls: {
        success: `${process.env.FRONT_URL || 'http://localhost:5173'}/exito`,
        failure: `${process.env.FRONT_URL || 'http://localhost:5173'}/carrito`,
        pending: `${process.env.FRONT_URL || 'http://localhost:5173'}/carrito`
      },

      auto_return: 'approved',
      external_reference: String(pid),
      notification_url: process.env.MP_NOTIFICATION_URL,

      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }
        ],
        installments: 6
      }
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    return res.json({
      success: true,
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });
  } catch (error) {
    console.error('ERROR CREANDO PREFERENCIA MP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear pago con Mercado Pago',
      detail: error.message
    });
  }
};

// 2. WEBHOOK
const recibirWebhook = async (req, res) => {
  try {
    const paymentId = req.query.id || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    if (!paymentId || type !== 'payment') {
      return res.status(200).send('OK');
    }

    const payment = new Payment(client);
    const pagoInfo = await payment.get({ id: paymentId });

    if (pagoInfo.status !== 'approved') {
      return res.status(200).send('OK');
    }

    const idPedido = Number(pagoInfo.external_reference);

    if (!Number.isFinite(idPedido) || idPedido <= 0) {
      return res.status(200).send('OK');
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        `SELECT id, estado, total, cliente_nombre, cliente_email
         FROM pedidos
         WHERE id = ?
         FOR UPDATE`,
        [idPedido]
      );

      if (rows.length === 0) {
        await conn.rollback();
        return res.status(200).send('OK');
      }

      const pedido = rows[0];

      if (pedido.estado === 'PAGADO') {
        await conn.commit();
        return res.status(200).send('OK');
      }

      await conn.query(
        `UPDATE pedidos
         SET estado = 'PAGADO'
         WHERE id = ?`,
        [idPedido]
      );

      await conn.commit();

      try {
        if (pedido.cliente_email) {
          await enviarCorreoCompra(
            pedido.cliente_email,
            pedido.cliente_nombre,
            pedido.id,
            Number(pedido.total || 0).toLocaleString()
          );
        }
      } catch (mailErr) {
        console.error('ERROR ENVIANDO MAIL:', mailErr);
      }

      return res.status(200).send('OK');
    } catch (dbErr) {
      try { await conn.rollback(); } catch {}
      console.error('ERROR DB WEBHOOK MP:', dbErr);
      return res.status(200).send('OK');
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('ERROR WEBHOOK MP:', error);
    return res.status(200).send('OK');
  }
};

module.exports = { crearPreferencia, recibirWebhook };