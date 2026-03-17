const { Preference } = require('mercadopago');
const { mpClient } = require('../config/mercadopago.config.js');
const pool = require('../db');

const crearPreferencia = async (req, res) => {
  try {
    const { items, pedidoId } = req.body;
    const preference = new Preference(mpClient);

    const itemsPasarela = items.map(item => ({
      title: item.title || item.nombre,
      quantity: Number(item.quantity || item.cantidad || 1),
      unit_price: Number(item.unit_price || item.precio),
      currency_id: 'ARS',
    }));

    const baseUrl = process.env.FRONT_URL || 'http://localhost:5173';

    const response = await preference.create({
      body: {
        items: itemsPasarela,
        back_urls: {
          success: `${baseUrl}/exito`,
          failure: `${baseUrl}/carrito`,
          pending: `${baseUrl}/carrito`,
        },
        auto_return: 'approved',
        external_reference: String(pedidoId),
      },
    });

    res.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    });
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({ error: 'Error al crear la preferencia', detalle: error.message });
  }
};

// LEER CONFIGURACIÓN DESDE MYSQL
const obtenerConfiguracion = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT recargo_mp FROM configuracion_tienda WHERE id = 1 LIMIT 1`
    );

    if (rows.length === 0) {
      return res.json({ recargoMP: 20 });
    }

    return res.json({
      recargoMP: Number(rows[0].recargo_mp)
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la configuración',
      detalle: error.message
    });
  }
};

// GUARDAR CONFIGURACIÓN EN MYSQL
const actualizarConfiguracion = async (req, res) => {
  try {
    const { recargoMP } = req.body;

    if (recargoMP === undefined || recargoMP === null || isNaN(Number(recargoMP))) {
      return res.status(400).json({
        success: false,
        message: 'El recargo es inválido'
      });
    }

    const valor = Number(recargoMP);

    await pool.query(
      `
      INSERT INTO configuracion_tienda (id, recargo_mp)
      VALUES (1, ?)
      ON DUPLICATE KEY UPDATE recargo_mp = VALUES(recargo_mp)
      `,
      [valor]
    );

    return res.json({
      success: true,
      configuracion: { recargoMP: valor }
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la configuración',
      detalle: error.message
    });
  }
};

module.exports = { crearPreferencia, obtenerConfiguracion, actualizarConfiguracion };