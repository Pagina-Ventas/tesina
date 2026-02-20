const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { enviarCorreoCompra } = require('../services/mail.service');
const fs = require('fs');
const path = require('path');

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TU_TOKEN_DE_PRUEBA' 
});

const rutaPedidos = path.join(__dirname, '../data/pedidos.json');

// 1. CREAR PREFERENCIA
const crearPreferencia = async (req, res) => {
    try {
        // Recibimos el idPedido desde el Frontend
        const { items, cliente, idPedido } = req.body; 

        const itemsMP = items.map(item => ({
            title: item.nombre,
            quantity: Number(item.cantidad),
            unit_price: Number(item.precio),
            currency_id: 'ARS'
        }));

        const body = {
            items: itemsMP,
            payer: { email: cliente.email || "test_user@test.com" },
            back_urls: {
                success: "http://localhost:5173/exito",
                failure: "http://localhost:5173",
                pending: "http://localhost:5173"
            },
            auto_return: "approved",
            // CLAVE: Le mandamos el ID de tu pedido a MP
            external_reference: idPedido.toString(),
            // 👇 ¡OJO AQUÍ! Cuando abras Ngrok, reemplaza esta URL por la tuya
            notification_url: "https://TU_URL_DE_NGROK.ngrok-free.app/api/pagos/webhook" 
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });
        res.json({ id: result.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear pago" });
    }
};

// 2. EL WEBHOOK (Recibe el aviso de Mercado Pago)
const recibirWebhook = async (req, res) => {
    try {
        const paymentId = req.query.id || req.body.data?.id;

        if (req.query.type === 'payment' || req.body.type === 'payment') {
            const payment = new Payment(client);
            // Consultamos el estado real del pago a Mercado Pago
            const pagoInfo = await payment.get({ id: paymentId });

            if (pagoInfo.status === 'approved') {
                const idPedido = parseInt(pagoInfo.external_reference);
                console.log(`✅ Webhook: El pedido ${idPedido} fue pagado.`);

                // 1. Leemos los pedidos
                let pedidos = [];
                if (fs.existsSync(rutaPedidos)) {
                    pedidos = JSON.parse(fs.readFileSync(rutaPedidos, 'utf-8'));
                }

                const index = pedidos.findIndex(p => p.id === idPedido);
                
                if (index !== -1 && pedidos[index].estado !== 'PAGADO') {
                    // 2. Actualizamos a PAGADO
                    pedidos[index].estado = 'PAGADO';
                    fs.writeFileSync(rutaPedidos, JSON.stringify(pedidos, null, 2));

                    // 3. ¡ENVIAMOS EL CORREO AL CLIENTE! 📧
                    const pedidoActualizado = pedidos[index];
                    
                    // Verificamos que el cliente haya puesto un email
                    if (pedidoActualizado.email) {
                        await enviarCorreoCompra(
                            pedidoActualizado.email, 
                            pedidoActualizado.cliente, 
                            pedidoActualizado.id,
                            pedidoActualizado.total.toLocaleString() // Mandamos el total formateado
                        );
                    } else {
                        console.log(`⚠️ Pedido ${idPedido} pagado, pero el cliente no dejó email.`);
                    }
                }
            }
        }
        
        // Siempre hay que responder 200 OK a Mercado Pago rápido
        res.status(200).send('OK');
    } catch (error) {
        console.error("Error en Webhook:", error);
        res.status(500).send('Error');
    }
};

module.exports = { crearPreferencia, recibirWebhook };