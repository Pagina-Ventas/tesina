const pool = require('../db');
const { enviarCorreoCompra } = require('../services/mail.service');
const mpService = require('../services/mercadopago.service');

const crearPreferencia = async (req, res) => {
  try {
    const { items, cliente, idPedido } = req.body || {};
    const pid = Number(idPedido);

    if (!Number.isFinite(pid) || pid <= 0) return res.status(400).json({ success: false, message: 'idPedido inválido' });

    // Limpieza de URLs
    const baseURL = (process.env.FRONT_URL || 'http://localhost:5173').trim().replace(/\/$/, '');
    const notificationURL = (process.env.MP_NOTIFICATION_URL && !process.env.MP_NOTIFICATION_URL.includes('localhost')) 
      ? process.env.MP_NOTIFICATION_URL 
      : null;

    const result = await mpService.crearPreferenciaPago(items, pid, cliente, baseURL, notificationURL);

    return res.json({
      success: true,
      id: result.id,
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
      // Lógica de DB original
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