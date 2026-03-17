const pool = require('../db');
const { enviarCorreoCompra } = require('../services/mail.service');
const mpService = require('../services/mercadopago.service');
const { enviarAlerta } = require('../services/bot.service'); // 👈 Importamos el bot para avisar si hay poco stock

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
        
        // 1. OBTENER LOS PRODUCTOS DEL PEDIDO
        const [items] = await conn.query(
          `SELECT producto_id AS productoId, nombre, cantidad FROM pedido_items WHERE pedido_id = ?`,
          [idPedido]
        );

        // 2. DESCONTAR EL STOCK DE CADA PRODUCTO
        let alertasAEnviar = [];
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

          await conn.query(
            `UPDATE productos SET stock = ? WHERE id = ?`,
            [nuevoStock, prod.id]
          );

          // Si el stock queda bajo, lo preparamos para la alerta de Telegram
          if (nuevoStock <= Number(prod.stockMinimo)) {
            alertasAEnviar.push({
              ...prod,
              stock: nuevoStock,
              stockMinimo: Number(prod.stockMinimo)
            });
          }
        }

        // 3. MARCAR COMO PAGADO
        await conn.query(`UPDATE pedidos SET estado = 'PAGADO' WHERE id = ?`, [idPedido]);
        
        await conn.commit();

        // 4. ENVIAR CORREO AL CLIENTE
        if (rows[0].cliente_email) {
          await enviarCorreoCompra(rows[0].cliente_email, rows[0].cliente_nombre, rows[0].id, rows[0].total);
        }

        // 5. ENVIAR ALERTAS AL BOT DE TELEGRAM SI HUBIERA POCO STOCK
        for (const alerta of alertasAEnviar) {
          try {
            await enviarAlerta(alerta, true);
          } catch (e) {
            console.error('Error al enviar alerta a Telegram desde el webhook:', e.message);
          }
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