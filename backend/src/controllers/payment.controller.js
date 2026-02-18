const { MercadoPagoConfig, Preference } = require('mercadopago');

// 1. Configuración del Cliente (Token de Prueba)
// Lo ideal es poner process.env.MP_ACCESS_TOKEN en tu archivo .env
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TU_ACCESS_TOKEN_DE_PRUEBA_AQUI' 
});

const crearPreferencia = async (req, res) => {
    try {
        const { items, cliente } = req.body;

        // 2. Mapeamos los productos para que MP los entienda
        const itemsMP = items.map(item => ({
            title: item.nombre,
            quantity: Number(item.cantidad),
            unit_price: Number(item.precio),
            currency_id: 'ARS'
        }));

        // 3. Creamos el cuerpo de la preferencia
        const body = {
            items: itemsMP,
            payer: {
                // En producción, usa el email real del cliente
                // En pruebas, MP a veces pide un email válido
                email: "test_user_123456@testuser.com" 
            },
            back_urls: {
                // A dónde vuelve el usuario después de pagar
                // Ajusta el puerto 5173 si tu frontend usa otro (ej: 3000 o 4000)
                success: "http://localhost:5173", 
                failure: "http://localhost:5173",
                pending: "http://localhost:5173"
            },
            auto_return: "approved",
        };

        // 4. Pedimos la preferencia a Mercado Pago
        const preference = new Preference(client);
        const result = await preference.create({ body });

        // 5. Devolvemos el ID al Frontend
        res.json({ id: result.id });

    } catch (error) {
        console.error("Error al crear preferencia:", error);
        res.status(500).json({ error: "Error al crear la preferencia de pago" });
    }
};

module.exports = { crearPreferencia };