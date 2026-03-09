// src/api/payment.api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ✅ Usamos 'export const' para que sea un export nombrado exactamente así
export const generarPreferenciaPago = async (datosPago) => {
  const response = await fetch(`${API_URL}/api/pagos/crear-preferencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosPago)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error en el servidor de pagos');
  }

  return await response.json();
};