require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const pool = require('../db');

// 👇 IMPORTAMOS LOS LOGS
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

    // COMANDO /stock
    bot.onText(/\/stock/, async (msg) => {
        const idUsuario = msg.chat.id;

        try {
            const [rows] = await pool.query(
                `SELECT nombre, stock, stock_minimo 
                 FROM productos 
                 WHERE stock <= stock_minimo
                 ORDER BY stock ASC`
            );

            if (rows.length === 0) {
                bot.sendMessage(idUsuario, "✅ Todo correcto. No hay productos con stock bajo.");
            } else {

                let mensaje = "⚠️ *REPORTE DE STOCK BAJO*\n\n";

                rows.forEach(p => {
                    mensaje += `📦 *${p.nombre}*\nStock: ${p.stock} (mín: ${p.stock_minimo})\n\n`;
                });

                bot.sendMessage(idUsuario, mensaje, { parse_mode: 'Markdown' });
            }

        } catch (error) {
            console.error(error);
            bot.sendMessage(idUsuario, "❌ Error consultando stock.");
        }
    });

    // BOTONES
    bot.on('callback_query', async (query) => {

        const idUsuario = query.message.chat.id;
        const data = query.data;

        bot.answerCallbackQuery(query.id).catch(()=>{});

        const partes = data.split('_');

        const accion = partes[0];
        const idProducto = parseInt(partes[1]);
        const cantidad = partes[2] ? parseInt(partes[2]) : 0;

        // IGNORAR ALERTA
        if (accion === 'ignore') {

            bot.sendMessage(idUsuario,"Alerta ignorada 👍");

            bot.editMessageReplyMarkup(
                { inline_keyboard: [] },
                { chat_id: idUsuario, message_id: query.message.message_id }
            );
        }

        // REPONER STOCK
        if (accion === 'buy') {

            try {

                const [prodRows] = await pool.query(
                    `SELECT nombre, stock FROM productos WHERE id = ?`,
                    [idProducto]
                );

                if (prodRows.length === 0) {
                    return bot.sendMessage(idUsuario,"❌ Producto no encontrado");
                }

                const nombreProducto = prodRows[0].nombre;
                const stockAnterior = prodRows[0].stock;

                const [result] = await pool.query(
                    `UPDATE productos SET stock = stock + ? WHERE id = ?`,
                    [cantidad,idProducto]
                );

                if (result.affectedRows > 0) {

                    const nuevoStock = stockAnterior + cantidad;

                    bot.sendMessage(
                        idUsuario,
                        `✅ *Stock actualizado*\n\n${nombreProducto}\n+${cantidad} unidades\nNuevo stock: *${nuevoStock}*`,
                        { parse_mode:'Markdown'}
                    );

                    bot.editMessageReplyMarkup(
                        { inline_keyboard: [] },
                        { chat_id: idUsuario, message_id: query.message.message_id }
                    );

                    await registrarLog(
                        'Bot Telegram',
                        'REPONER_STOCK',
                        `Se agregaron ${cantidad} unidades a ${nombreProducto}. Nuevo stock: ${nuevoStock}`
                    );
                }

            } catch (error) {

                console.error(error);

                bot.sendMessage(idUsuario,"❌ Error actualizando stock");
            }
        }

    });
}

//////////////////////////////////////////////////////////////////
// 🚨 ALERTA STOCK BAJO
//////////////////////////////////////////////////////////////////

const enviarAlerta = async (prod, esVenta = false) => {

    if (!bot || !chatId) return;

    const titulo = esVenta ? "🚨 VENTA REALIZADA" : "⚠️ STOCK BAJO";

    const mensaje =
`${titulo}

📦 Producto: *${prod.nombre}*
📉 Stock actual: *${prod.stock}*
⚠️ Stock mínimo: *${prod.stockMinimo}*

¿Desea reponer stock?`;

    const opciones = {

        parse_mode:'Markdown',

        reply_markup: {

            inline_keyboard: [

                [
                    { text:"🛒 +5", callback_data:`buy_${prod.id}_5` },
                    { text:"🛒 +10", callback_data:`buy_${prod.id}_10` }
                ],

                [
                    { text:"❌ Ignorar", callback_data:`ignore_${prod.id}` }
                ]

            ]
        }
    };

    try {

        await bot.sendMessage(chatId,mensaje,opciones);

        console.log(`✅ alerta enviada para ${prod.nombre}`);

    } catch(error) {

        console.error("❌ error telegram:",error.message);

    }
};

//////////////////////////////////////////////////////////////////
// 🛒 ALERTA NUEVA VENTA
//////////////////////////////////////////////////////////////////

const enviarVenta = async (venta) => {

    if (!bot || !chatId) return;

    const mensaje =
`🛒 *NUEVA VENTA*

👤 Cliente: ${venta.cliente}

💰 Total: $${venta.total}

📦 Productos: ${venta.productos}
`;

    try {

        await bot.sendMessage(chatId,mensaje,{ parse_mode:'Markdown' });

    } catch(error){

        console.error(error);

    }

};

//////////////////////////////////////////////////////////////////
// 📦 ALERTA NUEVO PEDIDO
//////////////////////////////////////////////////////////////////

const enviarPedido = async (pedido) => {

    if (!bot || !chatId) return;

    const mensaje =
`📦 *NUEVO PEDIDO*

🧾 Pedido #${pedido.id}

👤 Cliente: ${pedido.cliente}

💰 Total: $${pedido.total}
`;

    try {

        await bot.sendMessage(chatId,mensaje,{ parse_mode:'Markdown' });

    } catch(error){

        console.error(error);

    }

};

//////////////////////////////////////////////////////////////////

module.exports = {
    enviarAlerta,
    enviarVenta,
    enviarPedido
};