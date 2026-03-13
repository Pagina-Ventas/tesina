import { Preference } from 'mercadopago';
import { mpClient } from '../config/mercadoPago.js';

export const crearPreferencia = async (req, res) => {
  try {
    const { items, pedidoId } = req.body;

    const preference = new Preference(mpClient);

    const response = await preference.create({
      body: {
        items: items.map(item => ({
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: 'ARS',
        })),
        back_urls: {
          success: 'http://localhost:5173/pago-exitoso',
          failure: 'http://localhost:5173/pago-fallido',
          pending: 'http://localhost:5173/pago-pendiente',
        },
        auto_return: 'approved',
        external_reference: String(pedidoId),
      },
    });

    res.json({
      preferenceId: response.id,
      initPoint: response.init_point,
    });
  } catch (error) {
    console.error('Error al crear preferencia:', error);
    res.status(500).json({
      error: 'Error al crear la preferencia',
      detalle: error.message,
    });
  }
};