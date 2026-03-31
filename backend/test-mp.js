// test-mp.js
require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Cargamos el token directamente desde tu .env
const client = new MercadoPagoConfig({
  accessToken: (process.env.MP_ACCESS_TOKEN || '').trim()
});

async function testToken() {
  console.log("--- 🧉 DIAGNÓSTICO MERCADO PAGO (UCC San Juan) ---");
  console.log("Token detectado:", process.env.MP_ACCESS_TOKEN ? "SÍ ✅" : "NO ❌");

  try {
    const preference = new Preference(client);
    
    // Intentamos crear una preferencia mínima de prueba
    const result = await preference.create({
      body: {
        items: [
          {
            title: 'Mate de prueba - Tesina Germán',
            quantity: 1,
            unit_price: 100,
            currency_id: 'ARS'
          }
        ]
      }
    });

    console.log("\n✅ ¡TOKEN VÁLIDO Y FUNCIONANDO!");
    console.log("ID de Preferencia:", result.id);
    console.log("Link de prueba (Sandbox):", result.sandbox_init_point);
    console.log("-------------------------------------------------");
    
  } catch (error) {
    console.log("\n❌ ERROR DE CONEXIÓN:");
    console.log("Mensaje:", error.message);
    if (error.cause) {
      console.log("Causa detallada:", JSON.stringify(error.cause, null, 2));
    }
  }
}

testToken();