const { Preference } = require('mercadopago');
const { mpClient } = require('../config/mercadopago.config.js'); 

// Variable en memoria para guardar el recargo 
let configuracionPagos = { recargoMP: 20 };

const crearPreferencia = async (req, res) => {
  try {
    const { items, pedidoId } = req.body;
    const preference = new Preference(mpClient);

    // 👇 SOLUCIÓN: Ya no calculamos nada acá. 
    // Solo recibimos los items del frontend (que ya traen el producto, el envío y el recargo)
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

// Funciones para el Panel de Administrador (Leer y Guardar el %)
const obtenerConfiguracion = (req, res) => {
  res.json(configuracionPagos);
};

const actualizarConfiguracion = (req, res) => {
  const { recargoMP } = req.body;
  if (recargoMP !== undefined) {
    configuracionPagos.recargoMP = Number(recargoMP);
  }
  res.json({ success: true, configuracion: configuracionPagos });
};

module.exports = { crearPreferencia, obtenerConfiguracion, actualizarConfiguracion };