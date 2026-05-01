const nodemailer = require('nodemailer');
const { registrarLog } = require('../controllers/logs.controller');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,

  // Fuerza IPv4 para evitar error ENETUNREACH con IPv6 en Render
  family: 4,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },

  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000
});

const formatearPrecio = (valor) => {
  const numero = Number(valor || 0);

  return numero.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });
};

// Correo de compra / recibo
const enviarCorreoCompra = async (emailCliente, nombreCliente, idPedido, total) => {
  try {
    if (!emailCliente) {
      console.log('No se envió correo: el cliente no tiene email.');
      return;
    }

    const mailOptions = {
      from: `"ApoloMate" <${process.env.EMAIL_USER}>`,
      to: emailCliente,
      subject: `✅ Confirmación de pago - Pedido #${idPedido}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #121212; color: #fff; padding: 30px; border-radius: 12px; border: 1px solid #c5a059;">
          <h1 style="color: #c5a059; text-align: center; font-size: 30px; margin: 0 0 20px;">
            ApoloMate
          </h1>

          <h2 style="color: #4ade80; margin-bottom: 15px;">
            ¡Pago confirmado! 🧉
          </h2>

          <p style="font-size: 16px; color: #e0e0e0; line-height: 1.6;">
            Hola <strong>${nombreCliente || 'Cliente'}</strong>, recibimos correctamente el pago de tu pedido.
          </p>

          <div style="background-color: #1e1e1e; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #c5a059;">
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 16px;">
              <strong>Número de pedido:</strong> #${idPedido}
            </p>
            <p style="margin: 0; color: #ffffff; font-size: 16px;">
              <strong>Total:</strong> ${formatearPrecio(total)}
            </p>
          </div>

          <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">
            Estamos preparando tu pedido. Te avisaremos cuando esté listo para retirar o cuando coordinemos el envío.
          </p>

          <p style="text-align: center; color: #888; font-size: 12px; margin-top: 35px; border-top: 1px solid #333; padding-top: 20px;">
            Gracias por confiar en ApoloMate.<br>
            San Juan, Argentina.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Correo enviado exitosamente a: ${emailCliente}`);

    await registrarLog(
      'Sistema (Correo)',
      'EMAIL_ENVIADO',
      `Se envió el recibo de compra al cliente ${nombreCliente || 'Cliente'} (${emailCliente}) por el pedido #${idPedido}.`
    );
  } catch (error) {
    console.error('❌ Error enviando correo:', error);

    await registrarLog(
      'Sistema (Correo)',
      'ERROR_EMAIL',
      `No se pudo enviar el recibo al cliente ${nombreCliente || 'Cliente'} (${emailCliente}). Detalle: ${error.message}`
    );

    throw error;
  }
};

// Correo de verificación de cuenta
const enviarCorreoVerificacion = async (emailCliente, username, token) => {
  try {
    const apiUrl = (process.env.API_URL || process.env.BACKEND_URL || 'https://tesina-backend.onrender.com').replace(/\/$/, '');
    const linkVerificacion = `${apiUrl}/api/auth/verify-email/${token}`;

    const mailOptions = {
      from: `"ApoloMate" <${process.env.EMAIL_USER}>`,
      to: emailCliente,
      subject: '📩 Confirmá tu cuenta de ApoloMate',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #121212; color: #fff; padding: 30px; border-radius: 10px; border: 1px solid #c5a059;">
          <h1 style="color: #c5a059; text-align: center; font-size: 28px;">ApoloMate</h1>
          <h2 style="color: #ffffff;">¡Hola ${username}! 👋</h2>

          <p style="font-size: 16px; color: #e0e0e0; line-height: 1.5;">
            Gracias por registrarte en <strong>ApoloMate</strong>.
          </p>

          <p style="font-size: 16px; color: #e0e0e0; line-height: 1.5;">
            Para activar tu cuenta, hacé click en el siguiente botón:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a
              href="${linkVerificacion}"
              style="display: inline-block; padding: 14px 24px; background-color: #c5a059; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold;"
            >
              Confirmar cuenta
            </a>
          </div>

          <p style="text-align: center; color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
            Este enlace vence en 24 horas.<br>
            Gracias por confiar en ApoloMate. 🧉
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Correo de verificación enviado a: ${emailCliente}`);

    await registrarLog(
      'Sistema (Correo)',
      'EMAIL_VERIFICACION_ENVIADO',
      `Se envió correo de verificación a ${username} (${emailCliente}).`
    );
  } catch (error) {
    console.error('❌ Error enviando correo de verificación:', error);

    await registrarLog(
      'Sistema (Correo)',
      'ERROR_EMAIL_VERIFICACION',
      `No se pudo enviar correo de verificación a ${username} (${emailCliente}). Detalle: ${error.message}`
    );

    throw error;
  }
};

module.exports = {
  enviarCorreoCompra,
  enviarCorreoVerificacion
};