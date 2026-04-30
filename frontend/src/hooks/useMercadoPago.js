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

      // IMPORTANTE:
      // init_point = pago real / producción
      // sandbox_init_point = pago de prueba
      const urlPago = data?.init_point

      if (urlPago) {
        window.location.href = urlPago
        return
      }

      if (data?.preferenceId || data?.preference_id) {
        return {
          preferenceId: data.preferenceId || data.preference_id
        }
      }

      throw new Error('No se recibió init_point desde el backend')
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