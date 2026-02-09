require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURACIÓN ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: true });

// Ruta al archivo JSON
const rutaArchivo = path.join(__dirname, 'data', 'productos.json');

// --- RUTAS ---

// 1. Verificador de Stock (Disparador Manual)
app.get('/api/verificar-stock', (req, res) => {
    const datos = fs.readFileSync(rutaArchivo, 'utf-8');
    const productos = JSON.parse(datos);
    let alertas = 0;

    productos.forEach(prod => {
        if (prod.stock <= prod.stockMinimo) {
            enviarAlertaTelegram(prod); // Usamos una función auxiliar para no repetir código
            alertas++;
        }
    });

    if (alertas > 0) res.send(`Alertas enviadas: ${alertas}`);
    else res.send("Todo en orden ✅");
});

// 2. NUEVA RUTA: Simular Venta (Cliente comprando)
// Uso: /api/vender/ID/CANTIDAD -> Ejemplo: /api/vender/1/3
app.get('/api/vender/:id/:cantidad', (req, res) => {
    const idProd = parseInt(req.params.id);
    const cantidadVenta = parseInt(req.params.cantidad);

    // Leer archivo
    const datos = fs.readFileSync(rutaArchivo, 'utf-8');
    const productos = JSON.parse(datos);

    const index = productos.findIndex(p => p.id === idProd);

    if (index === -1) {
        return res.send("❌ Error: Producto no encontrado.");
    }

    // Validar stock suficiente
    if (productos[index].stock < cantidadVenta) {
        return res.send(`❌ Error: No hay suficiente stock. Solo quedan ${productos[index].stock}.`);
    }

    // Restar stock (Vender)
    productos[index].stock -= cantidadVenta;
    
    // Guardar cambios
    fs.writeFileSync(rutaArchivo, JSON.stringify(productos, null, 2));

    let mensajeRespuesta = `✅ ¡Venta Exitosa! Se vendieron ${cantidadVenta} de ${productos[index].nombre}. Stock restante: ${productos[index].stock}.`;

    // CHECK AUTOMÁTICO: ¿Quedamos en números rojos tras la venta?
    if (productos[index].stock <= productos[index].stockMinimo) {
        enviarAlertaTelegram(productos[index], true); // true indica que es una alerta post-venta
        mensajeRespuesta += " 🚨 SE DISPARÓ UNA ALERTA DE STOCK.";
    }

    res.send(mensajeRespuesta);
});


// --- LÓGICA DEL BOT (ESCUCHAR CLICS) ---
bot.on('callback_query', (query) => {
    bot.answerCallbackQuery(query.id); // Quitar relojito de carga

    const data = query.data;
    const idUsuario = query.message.chat.id;
    
    const partes = data.split('_'); 
    const accion = partes[0];
    const idProducto = parseInt(partes[1]);

    if (accion === 'ignore') {
        bot.sendMessage(idUsuario, "Entendido. Alerta ignorada. 🙈");
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
        return;
    }

    if (accion === 'buy') {
        const cantidadComprar = parseInt(partes[2]);

        let contenido = fs.readFileSync(rutaArchivo, 'utf-8');
        let productos = JSON.parse(contenido);

        const productoIndex = productos.findIndex(p => p.id === idProducto);
        
        if (productoIndex !== -1) {
            productos[productoIndex].stock += cantidadComprar;
            fs.writeFileSync(rutaArchivo, JSON.stringify(productos, null, 2));

            const nuevoStock = productos[productoIndex].stock;
            
            bot.sendMessage(idUsuario, `✅ *¡COMPRA EXITOSA!*\n\nSe agregaron ${cantidadComprar} unidades.\nNuevo Stock: ${nuevoStock}`);
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: idUsuario, message_id: query.message.message_id });
        }
    }
});

// --- FUNCIÓN AUXILIAR PARA ENVIAR ALERTAS (Para no repetir código) ---
function enviarAlertaTelegram(prod, esVenta = false) {
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
                [
                    { text: "❌ Ignorar", callback_data: `ignore_${prod.id}` }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, mensaje, opciones);
}

// Iniciar
const PORT = process.env.PORT || 3000;
app.get('/api/productos', (req, res) => {
    const datos = fs.readFileSync(rutaArchivo, 'utf-8');
    const productos = JSON.parse(datos);
    res.json(productos); // Enviamos la lista completa en formato JSON
});
app.listen(PORT, () => {
    console.log(`Servidor interactivo corriendo en puerto ${PORT}`);
});