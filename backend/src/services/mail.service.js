const nodemailer = require('nodemailer');

// 👇 IMPORTAMOS LA FUNCIÓN PARA GUARDAR LOGS
const { registrarLog } = require('../controllers/logs.controller'); 

// 1. Configuramos el "transportador" (El cartero)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 2. Función para enviar el correo
const enviarCorreoCompra = async (emailCliente, nombreCliente, idPedido, total) => {
    try {
        const mailOptions = {
            from: '"ApoloMate" <' + process.env.EMAIL_USER + '>', // Remitente
            to: emailCliente, // Destinatario
            subject: '✅ ¡Pago Recibido! Tu pedido está en marcha', // Asunto
            
            // Cuerpo del correo en HTML (Diseño elegante)
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121212; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #c5a059;">
                    <h1 style="color: #c5a059; text-align: center; font-size: 28px;">Apolo Mate</h1>
                    <h2 style="color: #4caf50;">¡Hola ${nombreCliente}! 👋</h2>
                    
                    <p style="font-size: 16px; color: #e0e0e0; line-height: 1.5;">
                        Queríamos avisarte que hemos recibido el pago de tu pedido <strong>#${idPedido}</strong> por un total de <strong>$${total}</strong>.
                    </p>
                    
                    <div style="background-color: #1e1e1e; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #c5a059;">
                        <h3 style="margin-top: 0; color: #c5a059; font-size: 18px;">¿Qué sigue ahora?</h3>
                        <p style="color: #a0a0a0; margin-bottom: 0; font-size: 14px; line-height: 1.5;">
                            Estamos preparando tu pedido con mucho cuidado. Te avisaremos cuando esté listo para retirar por el local o cuando haya sido despachado.
                        </p>
                    </div>
                    
                    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
                        Gracias por confiar en ApoloMate.<br>San Juan, Argentina. 🧉
                    </p>
                </div>
            `
        };

        // 3. Enviamos el correo
        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo enviado exitosamente a: ${emailCliente}`);
        
        // 📝 REGISTRAMOS EL ÉXITO EN EL HISTORIAL
        await registrarLog('Sistema (Correo)', 'EMAIL_ENVIADO', `Se envió el recibo de compra al cliente ${nombreCliente} (${emailCliente}) por el pedido #${idPedido}.`);
        
    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        
        // 📝 REGISTRAMOS EL ERROR EN EL HISTORIAL
        await registrarLog('Sistema (Correo)', 'ERROR_EMAIL', `No se pudo enviar el recibo al cliente ${nombreCliente} (${emailCliente}). Detalle: ${error.message}`);
    }
};

module.exports = { enviarCorreoCompra };