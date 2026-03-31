const nodemailer = require('nodemailer');
const { registrarLog } = require('../controllers/logs.controller');

// 1. Configuramos el transportador
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 2. Correo de compra
const enviarCorreoCompra = async (emailCliente, nombreCliente, idPedido, total) => {
  try {
    const mailOptions = {
      from: `"ApoloMate" <${process.env.EMAIL_USER}>`,
      to: emailCliente,
      subject: '✅ ¡Pago Recibido! Tu pedido está en marcha',
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

    await transporter.sendMail(mailOptions);
    console.log(`📧 Correo enviado exitosamente a: ${emailCliente}`);

    await registrarLog(
      'Sistema (Correo)',
      'EMAIL_ENVIADO',
      `Se envió el recibo de compra al cliente ${nombreCliente} (${emailCliente}) por el pedido #${idPedido}.`
    );
  } catch (error) {
    console.error('❌ Error enviando correo:', error);

    await registrarLog(
      'Sistema (Correo)',
      'ERROR_EMAIL',
      `No se pudo enviar el recibo al cliente ${nombreCliente} (${emailCliente}). Detalle: ${error.message}`
    );
  }
};

// 3. Correo de verificación de cuenta
const enviarCorreoVerificacion = async (emailCliente, username, token) => {
  try {
    const apiUrl = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');
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

          <div style="background-color: #1e1e1e; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #c5a059;">
            <p style="color: #a0a0a0; margin: 0; font-size: 14px; line-height: 1.5;">
              Si el botón no funciona, copiá y pegá este enlace en tu navegador:
            </p>
            <p style="color: #ffffff; word-break: break-all; font-size: 13px; margin-top: 10px;">
              ${linkVerificacion}
            </p>
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
  }
};

module.exports = {
  enviarCorreoCompra,
  enviarCorreoVerificacion
};