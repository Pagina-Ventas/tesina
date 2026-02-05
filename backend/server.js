require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURACIÓN TELEGRAM ---
const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID; // Aquí leemos tu ID del archivo .env
const bot = new TelegramBot(token, { polling: true });

// --- RUTAS DEL SISTEMA ---

// 1. Ruta para verificar que el servidor vive
app.get('/', (req, res) => {
    res.send('Sistema de Tesina Funcionando 🚀');
});

// 2. Ruta de PRUEBA para simular una alerta de stock
// (Esto es lo que el sistema llamará automáticamente en el futuro)
app.get('/test-alerta', (req, res) => {
    const producto = "RTX 3060";
    const stockActual = 2;
    
    const mensaje = `⚠️ *ALERTA DE STOCK BAJO*\n\nEl producto *${producto}* tiene solo *${stockActual}* unidades.\n¿Deseas autorizar la compra de reposición?`;
    
    // Enviamos el mensaje a TU chat ID específico
    bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    
    console.log("Alerta enviada a Telegram");
    res.send("Simulación ejecutada: Revisa tu Telegram.");
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});