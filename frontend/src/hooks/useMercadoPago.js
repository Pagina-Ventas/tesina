// src/hooks/useMercadoPago.js
import { useState } from 'react';
// ✅ Importamos el nombre exacto que definimos arriba
import { generarPreferenciaPago } from '../api/payment.api';

export const useMercadoPago = () => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const iniciarPago = async (datosPago) => {
    try {
      setCargando(true);
      setError(null);

      const data = await generarPreferenciaPago(datosPago);

      if (data?.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
      } else {
        throw new Error('No se recibió el link de pago de Mercado Pago');
      }
    } catch (err) {
      console.error('Error en Hook useMercadoPago:', err);
      setError(err.message);
      throw err; 
    } finally {
      setCargando(false);
    }
  };

  return { iniciarPago, cargando, error };
};