const { Resend } = require('resend');
const { registrarLog } = require('../controllers/logs.controller');

const resend = new Resend(process.env.RESEND_API_KEY);

const MAIL_FROM =
  process.env.MAIL_FROM || 'ApoloMate <ventas@apolomates.com>';

const REPLY_TO =
  process.env.MAIL_REPLY_TO || 'ventas@apolomates.com';

const formatearPrecio = (valor) => {
  const numero = Number(valor || 0);

  return numero.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  });
};

const enviarCorreoCompra = async (emailCliente, nombreCliente, idPedido, total) => {
  try {
    if (!emailCliente) {
      console.log('No se envió correo: el cliente no tiene email.');
      return;
    }

    const nombre = nombreCliente || 'Cliente';
    const totalFormateado = formatearPrecio(total);

    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [emailCliente],
      reply_to: REPLY_TO,
      subject: `Confirmación de pago - Pedido #${idPedido}`,
      text: `Hola ${nombre}, recibimos correctamente el pago de tu pedido #${idPedido} por un total de ${totalFormateado}. Estamos preparando tu pedido. Te avisaremos cuando esté listo para retirar o cuando coordinemos el envío. Gracias por confiar en ApoloMate.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; color: #111827; padding: 28px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h1 style="color: #111827; text-align: center; font-size: 28px; margin: 0 0 22px;">
            ApoloMate
          </h1>

          <h2 style="color: #15803d; margin-bottom: 14px; font-size: 22px;">
            Pago confirmado
          </h2>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Hola <strong>${nombre}</strong>, recibimos correctamente el pago de tu pedido.
          </p>

          <div style="background-color: #f9fafb; padding: 18px; border-radius: 10px; margin: 24px 0; border-left: 4px solid #c5a059;">
            <p style="margin: 0 0 10px; color: #111827; font-size: 16px;">
              <strong>Número de pedido:</strong> #${idPedido}
            </p>
            <p style="margin: 0; color: #111827; font-size: 16px;">
              <strong>Total:</strong> ${totalFormateado}
            </p>
          </div>

          <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
            Estamos preparando tu pedido. Te avisaremos cuando esté listo para retirar o cuando coordinemos el envío.
          </p>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-top: 24px;">
            Si necesitás consultarnos algo, podés responder este correo.
          </p>

          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 34px; border-top: 1px solid #e5e7eb; padding-top: 18px;">
            Gracias por confiar en ApoloMate.<br>
            San Juan, Argentina.
          </p>
        </div>
      `
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`📧 Correo enviado exitosamente a: ${emailCliente}`, data);

    await registrarLog(
      'Sistema (Correo)',
      'EMAIL_ENVIADO',
      `Se envió el recibo de compra al cliente ${nombre} (${emailCliente}) por el pedido #${idPedido}.`
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

const enviarCorreoVerificacion = async (emailCliente, username, token) => {
  try {
    const apiUrl = (process.env.API_URL || process.env.BACKEND_URL || 'https://tesina-backend.onrender.com').replace(/\/$/, '');
    const linkVerificacion = `${apiUrl}/api/auth/verify-email/${token}`;

    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to: [emailCliente],
      reply_to: REPLY_TO,
      subject: 'Confirmá tu cuenta de ApoloMate',
      text: `Hola ${username}, gracias por registrarte en ApoloMate. Para activar tu cuenta abrí este enlace: ${linkVerificacion}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; color: #111827; padding: 28px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h1 style="color: #111827; text-align: center; font-size: 28px;">ApoloMate</h1>

          <h2 style="color: #111827;">Hola ${username}</h2>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Gracias por registrarte en <strong>ApoloMate</strong>.
          </p>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
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

          <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
            Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
            ${linkVerificacion}
          </p>

          <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 34px; border-top: 1px solid #e5e7eb; padding-top: 18px;">
            Este enlace vence en 24 horas.<br>
            Gracias por confiar en ApoloMate.
          </p>
        </div>
      `
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`📧 Correo de verificación enviado a: ${emailCliente}`, data);

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