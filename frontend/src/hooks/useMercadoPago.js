import { useState } from 'react'
import { generarPreferenciaPago } from '../api/payment.api'

export const useMercadoPago = () => {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const iniciarPago = async (datosPago) => {
    try {
      setCargando(true)
      setError(null)

      const data = await generarPreferenciaPago(datosPago)

      console.log('Respuesta Mercado Pago:', data)

      // ✅ Si el backend devuelve links de redirección
      const urlPago = data?.sandbox_init_point || data?.init_point

      if (urlPago) {
        window.location.href = urlPago
        return
      }

      // ✅ Si más adelante querés usar Wallet, esto deja preparado el hook
      if (data?.preferenceId || data?.preference_id) {
        return {
          preferenceId: data.preferenceId || data.preference_id
        }
      }

      throw new Error('No se recibió ni sandbox_init_point, ni init_point, ni preferenceId desde el backend')
    } catch (err) {
      console.error('Error en Hook useMercadoPago:', err)
      setError(err.message || 'Error desconocido al iniciar pago')
      throw err
    } finally {
      setCargando(false)
    }
  }

  return { iniciarPago, cargando, error }
}