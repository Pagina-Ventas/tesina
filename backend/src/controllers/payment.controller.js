const pool = require('../db');
const { enviarCorreoCompra } = require('../services/mail.service');
const mpService = require('../services/mercadopago.service');

const crearPreferencia = async (req, res) => {
  try {
    const { items, cliente, idPedido, pedidoId } = req.body || {};
    const pid = Number(idPedido || pedidoId);

    if (!Number.isFinite(pid) || pid <= 0) {
      return res.status(400).json({ success: false, message: 'idPedido inválido' });
    }

    // 👇 LIMPIEZA EXTREMA DE URL PARA EVITAR EL ERROR DE MERCADO PAGO
    let baseURL = process.env.FRONT_URL ? process.env.FRONT_URL.trim() : '';
    
    // Si la URL está vacía, usamos el localhost por defecto
    if (!baseURL) {
      baseURL = 'http://localhost:5173';
    } 
    // Si en el .env se olvidaron de poner "http://", se lo agregamos a la fuerza
    else if (!baseURL.startsWith('http')) {
      baseURL = `http://${baseURL}`;
    }
    // Quitamos la barra diagonal final por si se coló alguna (ej: http://localhost:5173/)
    baseURL = baseURL.replace(/\/$/, '');

    // Limpieza también para la URL de notificaciones
    let notificationURL = process.env.MP_NOTIFICATION_URL ? process.env.MP_NOTIFICATION_URL.trim() : null;
    if (notificationURL && !notificationURL.startsWith('http')) {
      notificationURL = `https://${notificationURL}`; 
    }
    // Mercado Pago no acepta webhooks en localhost, así que lo anulamos si estamos en desarrollo
    if (notificationURL && notificationURL.includes('localhost')) {
      notificationURL = null;
    }

    const result = await mpService.crearPreferenciaPago(items, pid, cliente, baseURL, notificationURL);

    return res.json({
      success: true,
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });
  } catch (error) {
    console.error('ERROR MP:', error);
    res.status(500).json({ success: false, message: 'Error al procesar pago', detail: error.message });
  }
};

const recibirWebhook = async (req, res) => {
  try {
    const paymentId = req.query.id || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    if (!paymentId || type !== 'payment') return res.status(200).send('OK');

    const pagoInfo = await mpService.consultarPago(paymentId);
    if (pagoInfo.status !== 'approved') return res.status(200).send('OK');

    const idPedido = Number(pagoInfo.external_reference);
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(`SELECT * FROM pedidos WHERE id = ? FOR UPDATE`, [idPedido]);
      
      if (rows.length > 0 && rows[0].estado !== 'PAGADO') {
        await conn.query(`UPDATE pedidos SET estado = 'PAGADO' WHERE id = ?`, [idPedido]);
        await conn.commit();
        if (rows[0].cliente_email) {
          await enviarCorreoCompra(rows[0].cliente_email, rows[0].cliente_nombre, rows[0].id, rows[0].total);
        }
      } else {
        await conn.commit();
      }
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('WEBHOOK ERROR:', error);
    return res.status(200).send('OK');
  }
};

module.exports = { crearPreferencia, recibirWebhook };