const { Preference, Payment } = require('mercadopago');
const { mpClient } = require('../config/mercadopago.config');

const limpiarBaseUrl = (baseURL) => {
  let url = baseURL || process.env.FRONT_URL || 'https://www.apolomates.com';

  url = String(url).trim();

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url.replace(/\/$/, '');
};

const crearPreferenciaPago = async (
  items,
  idPedido,
  cliente,
  baseURL,
  notificationURL
) => {
  const preference = new Preference(mpClient);

  const frontURL = limpiarBaseUrl(baseURL);

  const body = {
    items: items.map(item => ({
      title: item.title || item.nombre || 'Producto',
      description: item.descripcion || item.nombre || item.title || 'Producto',
      quantity: Number(item.quantity || item.cantidad || 1),
      unit_price: Number(item.unit_price || item.precio || 0),
      currency_id: 'ARS'
    })),

    payer: {
      name: cliente?.nombre || 'Cliente',
      surname: cliente?.apellido || '',
      email: cliente?.email || undefined
    },

    back_urls: {
      success: `${frontURL}/exito`,
      failure: `${frontURL}/carrito`,
      pending: `${frontURL}/carrito`
    },

    auto_return: 'approved',
    external_reference: String(idPedido),

    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }],
      installments: 6
    }
  };

  if (notificationURL) {
    body.notification_url = notificationURL;
  }

  return await preference.create({ body });
};

const consultarPago = async (paymentId) => {
  const payment = new Payment(mpClient);
  return await payment.get({ id: paymentId });
};

module.exports = {
  crearPreferenciaPago,
  consultarPago
};