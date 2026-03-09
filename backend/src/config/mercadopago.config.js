const { MercadoPagoConfig } = require('mercadopago');

// Inicializamos el cliente una sola vez para toda la app
const client = new MercadoPagoConfig({
  accessToken: (process.env.MP_ACCESS_TOKEN || '').trim()
});

module.exports = client;