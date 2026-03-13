require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const pool = require('../db');

// 👇 IMPORTAMOS LOS LOGS PARA REGISTRAR LAS ACCIONES DEL BOT
const { registrarLog } = require('../controllers/logs.controller'); 

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log("--- DIAGNÓSTICO DEL BOT ---");
console.log("TOKEN:", token ? "✅ OK" : "❌ Faltante");
console.log("CHAT_ID:", chatId ? "✅ OK" : "❌ Faltante");

let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: true });
    
    bot.on("polling_error", (msg) => console.log("⚠️ Error Polling Telegram:", msg.message));
    console.log("🤖 Bot iniciado y escuchando...");

    // --- NUEVO: COMANDO /stock PARA CONSULTAR MANUALMENTE ---
    bot.onText(/\/stock/, async (msg) => {
        const idUsuario = msg.chat.id;
        try {
            const [rows] = await pool.query(
                `SELECT nombre, stock, stock_minimo FROM productos WHERE stock <= stock_minimo ORDER BY stock ASC`
            );

            if (rows.length === 0) {
                bot.sendMessage(idUsuario, "✅ ¡Todo excelente! Ningún producto está por debajo de su stock mínimo.");
            } else {
                let mensaje = "⚠️ *REPORTE DE STOCK BAJO:*\n\n";
                rows.forEach(p => {
                    mensaje += `🔸 *${p.nombre}* \nStock: ${p.stock} (Mín: ${p.stock_minimo})\n\n`;
                });
                bot.sendMessage(idUsuario, mensaje, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error("❌ Error en comando /stock:", error);
            bot.sendMessage(idUsuario, "❌ Error al consultar la base de datos.");
        }
    });

    // --- ESCUCHAR CLICS EN BOTONES ---
    bot.on('callback_query', async (query) => {
        const idUsuario = query.message.chat.id;
        const data = query.data;
        
        // Evitamos error de botón expirado
        bot.answerCallbackQuery(query.id).catch(err => {
            console.log("⚠️ Clic en botón expirado (no es grave).");
        });

        console.log(`📩 Recibido clic: ${data} del usuario ${idUsuario}`);

        const partes = data.split('_');
        
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
            try {
                // Buscamos el nombre del producto primero para el Log
                const [prodRows] = await pool.query(`SELECT nombre, stock FROM productos WHERE id = ?`, [idProducto]);
                if (prodRows.length === 0) {
                    return bot.sendMessage(idUsuario, "❌ Error: Producto no encontrado en la Base de Datos.");
                }

                const nombreProducto = prodRows[0].nombre;
                const stockAnterior = prodRows[0].stock;

                // Actualizamos stock directo en MySQL
                const [result] = await pool.query(
                    `UPDATE productos SET stock = stock + ? WHERE id = ?`,
                    [cantidad, idProducto]
                );

                if (result.affectedRows > 0) {
                    const nuevoStock = stockAnterior + cantidad;

                    // Confirmamos al usuario por Telegram
                    bot.sendMessage(idUsuario, `✅ *¡LISTO!*\nSe sumaron ${cantidad} unidades de *${nombreProducto}*.\nNuevo Stock: ${nuevoStock}`, { parse_mode: 'Markdown' });
                    
                    // Borramos los botones
                    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
                    
                    // 📝 REGISTRAMOS LA ACCIÓN EN EL HISTORIAL (LOGS)
                    await registrarLog('Bot de Telegram', 'REPONER_STOCK_BOT', `Se repusieron ${cantidad} unidades de "${nombreProducto}" directamente desde Telegram. Stock actualizado: ${nuevoStock}`);

                    console.log(`✅ Stock actualizado en DB: Producto ${idProducto} +${cantidad}`);
                }
            } catch (error) {
                console.error("❌ Error al actualizar en MySQL:", error);
                bot.sendMessage(idUsuario, "❌ Error interno del servidor al procesar la compra.");
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