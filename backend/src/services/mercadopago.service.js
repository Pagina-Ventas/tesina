const { Preference, Payment } = require('mercadopago');
const { mpClient } = require('../config/mercadopago.config');

const crearPreferenciaPago = async (items, idPedido, cliente) => {
  const preference = new Preference(mpClient);

  // 👇 EL TRUCO: Engañamos a la API usando 'https'
  const urlExito = 'https://localhost:5173/exito';
  const urlCarrito = 'https://localhost:5173/carrito';

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
      email: cliente?.email || 'test_user_123@test.com'
    },
    // Al tener https, Mercado Pago ya no las va a borrar
    back_urls: {
      success: urlExito,
      failure: urlCarrito,
      pending: urlCarrito
    },
    auto_return: 'approved',
    external_reference: String(idPedido || 1),
    payment_methods: {
      excluded_payment_types: [{ id: 'ticket' }],
      installments: 6
    }
  };

  return await preference.create({ body });
};

const consultarPago = async (paymentId) => {
  const payment = new Payment(mpClient);
  return await payment.get({ id: paymentId });
};

module.exports = { crearPreferenciaPago, consultarPago };