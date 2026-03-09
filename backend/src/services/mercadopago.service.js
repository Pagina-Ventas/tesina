const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago.config');

// Lógica pura de creación de preferencia
const crearPreferenciaPago = async (items, idPedido, cliente, baseURL, notificationURL) => {
  const preference = new Preference(client);

  const body = {
    items: items.map(item => ({
      title: item.nombre || 'Producto',
      description: item.descripcion || item.nombre || 'Producto',
      quantity: Number(item.cantidad || 1),
      unit_price: Number(item.precio || 0),
      currency_id: 'ARS'
    })),
    payer: {
      name: cliente?.nombre || 'Cliente',
      surname: cliente?.apellido || '',
      email: cliente?.email || 'test_user_123@test.com'
    },
    back_urls: {
      success: `${baseURL}/exito`,
      failure: `${baseURL}/carrito`,
      pending: `${baseURL}/carrito`
    },
    auto_return: 'approved',
    external_reference: String(idPedido),
    ...(notificationURL ? { notification_url: notificationURL } : {}),
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }],
      installments: 6
    }
  };

  return await preference.create({ body });
};

// Lógica para obtener datos de un pago en el webhook
const consultarPago = async (paymentId) => {
  const payment = new Payment(client);
  return await payment.get({ id: paymentId });
};

module.exports = { crearPreferenciaPago, consultarPago };