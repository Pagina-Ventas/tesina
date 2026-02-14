require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const rutaArchivo = path.join(__dirname, '../data/productos.json');

console.log("--- DIAGNÓSTICO DEL BOT ---");
console.log("TOKEN:", token ? "✅ OK" : "❌ Faltante");
console.log("CHAT_ID:", chatId ? "✅ OK" : "❌ Faltante");

let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: true });
    
    bot.on("polling_error", (msg) => console.log("⚠️ Error Polling Telegram:", msg.message));
    console.log("🤖 Bot iniciado y escuchando...");

    // --- ESCUCHAR CLICS EN BOTONES ---
    bot.on('callback_query', (query) => {
        const idUsuario = query.message.chat.id;
        const data = query.data;
        
        // Evitamos error de botón expirado
        bot.answerCallbackQuery(query.id).catch(err => {
            console.log("⚠️ Clic en botón expirado (no es grave).");
        });

        console.log(`📩 Recibido clic: ${data} del usuario ${idUsuario}`);

        const partes = data.split('_');
        
        // 👇 VARIABLES CRÍTICAS (Aseguramos que sean válidas)
        const accion = partes[0];
        const idProducto = parseInt(partes[1]);
        const cantidad = partes[2] ? parseInt(partes[2]) : 0;

        // ACCIÓN: IGNORAR
        if (accion === 'ignore') {
            bot.sendMessage(idUsuario, "Alerta descartada. 🙈");
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
        }

        // ACCIÓN: COMPRAR (REPONER STOCK)
        if (accion === 'buy') {
            
            if (fs.existsSync(rutaArchivo)) {
                try {
                    const datos = fs.readFileSync(rutaArchivo, 'utf-8');
                    let productos = JSON.parse(datos);
                    
                    // Buscamos asegurando que ambos sean números
                    const index = productos.findIndex(p => Number(p.id) === Number(idProducto));

                    if (index !== -1) {
                        // Actualizamos stock
                        productos[index].stock += cantidad;
                        fs.writeFileSync(rutaArchivo, JSON.stringify(productos, null, 2));
                        
                        // Confirmamos al usuario
                        bot.sendMessage(idUsuario, `✅ *¡LISTO!*\nSe sumaron ${cantidad} unidades.\nNuevo Stock: ${productos[index].stock}`, { parse_mode: 'Markdown' });
                        
                        // Borramos los botones
                        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
                        console.log(`✅ Stock actualizado: Producto ${idProducto} +${cantidad}`);
                    } else {
                        bot.sendMessage(idUsuario, "❌ Error: Producto no encontrado (ID inválido).");
                    }
                } catch (error) {
                    console.error("❌ Error al actualizar JSON:", error);
                    bot.sendMessage(idUsuario, "❌ Error interno del servidor.");
                }
            }
        }
    });
}

// --- FUNCIÓN PARA ENVIAR ALERTAS (ASÍNCRONA) ---
const enviarAlerta = async (prod, esVenta = false) => {
    if (!bot || !chatId) {
        console.error("❌ Bot no configurado. No se puede enviar alerta.");
        return;
    }

    const titulo = esVenta ? "🚨 VENTA REALIZADA" : "⚠️ STOCK BAJO";
    const cuerpo = esVenta 
        ? `Se vendió *${prod.nombre}*.` 
        : `El producto *${prod.nombre}* está por debajo del mínimo.`;

    const mensaje = `${titulo}\n${cuerpo}\n` +
                    `📦 Stock Actual: *${prod.stock}* (Mín: ${prod.stockMinimo})\n\n` +
                    `¿Reponer stock ahora?`;

    const opciones = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [ 
                    { text: "🛒 +5 u.", callback_data: `buy_${prod.id}_5` },
                    { text: "🛒 +10 u.", callback_data: `buy_${prod.id}_10` }
                ],
                [{ text: "❌ Ignorar", callback_data: `ignore_${prod.id}` }]
            ]
        }
    };

    try {
        await bot.sendMessage(chatId, mensaje, opciones);
        console.log(`✅ Alerta enviada a Telegram para: ${prod.nombre}`);
    } catch (error) {
        console.error("❌ Error enviando a Telegram:", error.message);
    }
};

module.exports = { enviarAlerta };