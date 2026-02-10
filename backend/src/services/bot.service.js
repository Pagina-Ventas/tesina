require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const rutaArchivo = path.join(__dirname, '../data/productos.json');

// Inicializar Bot (solo si hay token)
let bot = null;
if (token) {
    bot = new TelegramBot(token, { polling: true });
    console.log("🤖 Bot de Telegram iniciado");

    // --- ESCUCHAR CLICS EN BOTONES ---
    bot.on('callback_query', (query) => {
        bot.answerCallbackQuery(query.id);

        const data = query.data;
        const idUsuario = query.message.chat.id;
        const partes = data.split('_'); 
        const accion = partes[0];
        const idProducto = parseInt(partes[1]);

        if (accion === 'ignore') {
            bot.sendMessage(idUsuario, "Entendido. Alerta ignorada. 🙈");
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
        }

        if (accion === 'buy') {
            const cantidadComprar = parseInt(partes[2]);
            
            // Actualizar stock en archivo
            try {
                const datos = fs.readFileSync(rutaArchivo, 'utf-8');
                let productos = JSON.parse(datos);
                const index = productos.findIndex(p => p.id === idProducto);

                if (index !== -1) {
                    productos[index].stock += cantidadComprar;
                    fs.writeFileSync(rutaArchivo, JSON.stringify(productos, null, 2));
                    
                    bot.sendMessage(idUsuario, `✅ *¡REPOSICIÓN EXITOSA!*\n\nSe agregaron ${cantidadComprar} unidades.\nNuevo Stock: ${productos[index].stock}`, { parse_mode: 'Markdown' });
                    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
                }
            } catch (error) {
                console.error("Error al reponer stock:", error);
            }
        }
    });
}

// --- FUNCIÓN PARA ENVIAR ALERTAS ---
const enviarAlerta = (prod, esVenta = false) => {
    if (!bot || !chatId) return;

    const titulo = esVenta ? "🚨 *ALERTA TRAS VENTA* 🚨" : "🚨 *STOCK CRÍTICO DETECTADO* 🚨";
    const cuerpo = esVenta 
        ? `Un cliente compró *${prod.nombre}* y el stock bajó peligrosamente.` 
        : `El producto *${prod.nombre}* está por debajo del mínimo.`;

    const mensaje = `${titulo}\n\n` +
                    `${cuerpo}\n` +
                    `📦 Producto: *${prod.nombre}*\n` +
                    `🔻 Stock Actual: *${prod.stock}*\n` +
                    `⚠️ Mínimo: *${prod.stockMinimo}*\n` +
                    `💰 Precio Unitario: $${prod.precio}\n\n` +
                    `¿Deseas reponer ahora?`;

    const opciones = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🛒 Reponer 5 u.", callback_data: `buy_${prod.id}_5` },
                    { text: "🛒 Reponer 10 u.", callback_data: `buy_${prod.id}_10` }
                ],
                [{ text: "❌ Ignorar", callback_data: `ignore_${prod.id}` }]
            ]
        }
    };
    bot.sendMessage(chatId, mensaje, opciones);
};

module.exports = { enviarAlerta };