import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../style/tienda.css'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
}

export function Exito({ vaciarCarrito, recargarProductos }) {
  const [searchParams] = useSearchParams()

  const paymentId =
    searchParams.get('payment_id') ||
    searchParams.get('collection_id')

  const pedidoId =
    searchParams.get('external_reference') ||
    searchParams.get('pedidoId')

  const [estado, setEstado] = useState('verificando')
  const [mensaje, setMensaje] = useState('Estamos verificando el pago con Mercado Pago...')
  const [estadoMP, setEstadoMP] = useState(null)

  const sincronizado = useRef(false)

  useEffect(() => {
    const verificarPagoReal = async () => {
      if (sincronizado.current) return
      sincronizado.current = true

      if (!paymentId || !pedidoId) {
        setEstado('pendiente')
        setMensaje('No pudimos verificar el pago porque faltan datos de Mercado Pago.')
        return
      }

      try {
        const res = await fetch(`${API_URL}/api/pagos/verificar-pago`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentId,
            pedidoId
          })
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'No se pudo verificar el pago')
        }

        setEstadoMP(data.estadoMP || null)

        if (data.aprobado) {
          setEstado('aprobado')
          setMensaje('Tu pago fue aprobado y tu pedido quedó registrado correctamente.')

          vaciarCarrito()

          if (recargarProductos) {
            recargarProductos()
          }

          return
        }

        setEstado('pendiente')
        setMensaje('Mercado Pago todavía no confirmó el pago. Si no se debitó, el pedido no fue marcado como pagado.')
      } catch (error) {
        console.error('Error verificando pago:', error)
        setEstado('error')
        setMensaje(error.message || 'Ocurrió un error verificando el pago.')
      }
    }

    verificarPagoReal()
  }, [paymentId, pedidoId, vaciarCarrito, recargarProductos])

  const aprobado = estado === 'aprobado'
  const pendiente = estado === 'pendiente'
  const error = estado === 'error'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        padding: '20px'
      }}
    >
      {estado === 'verificando' && (
        <>
          <div style={{ fontSize: '5rem' }}>⏳</div>
          <h1 style={{ color: '#c5a059' }}>Verificando pago...</h1>
          <p style={{ color: '#a0a0a0' }}>{mensaje}</p>
          <p style={{ color: '#777', fontSize: '0.9rem' }}>Pedido Web: #{pedidoId}</p>
        </>
      )}

      {aprobado && (
        <>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>🎉</div>
          <h1
            style={{
              color: '#4caf50',
              fontFamily: 'Playfair Display',
              fontSize: '3rem',
              margin: '0'
            }}
          >
            ¡Pago aprobado!
          </h1>

          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              border: '1px solid #4caf50'
            }}
          >
            <p style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 10px 0' }}>
              {mensaje}
            </p>

            <p style={{ color: '#a0a0a0', margin: '5px 0', fontSize: '1.1rem' }}>
              Número de Pedido Web:{' '}
              <strong style={{ color: '#c5a059', fontSize: '1.5rem' }}>
                #{pedidoId}
              </strong>
            </p>

            <p style={{ color: '#777', fontSize: '0.9rem', margin: '5px 0' }}>
              ID de Operación MP: {paymentId}
            </p>
          </div>
        </>
      )}

      {pendiente && (
        <>
          <div style={{ fontSize: '5rem' }}>⚠️</div>
          <h1 style={{ color: '#c5a059' }}>Pago no confirmado</h1>

          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              border: '1px solid #c5a059'
            }}
          >
            <p style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 10px 0' }}>
              {mensaje}
            </p>

            <p style={{ color: '#a0a0a0', margin: '5px 0' }}>
              Pedido Web: <strong style={{ color: '#c5a059' }}>#{pedidoId}</strong>
            </p>

            {estadoMP && (
              <p style={{ color: '#777', fontSize: '0.9rem', margin: '5px 0' }}>
                Estado Mercado Pago: {estadoMP}
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <>
          <div style={{ fontSize: '5rem' }}>❌</div>
          <h1 style={{ color: '#ef4444' }}>No pudimos verificar el pago</h1>

          <div
            style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              border: '1px solid #ef4444'
            }}
          >
            <p style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 10px 0' }}>
              {mensaje}
            </p>

            <p style={{ color: '#a0a0a0', margin: '5px 0' }}>
              Pedido Web: <strong style={{ color: '#c5a059' }}>#{pedidoId}</strong>
            </p>
          </div>
        </>
      )}

      <div
        style={{
          display: 'flex',
          gap: '15px',
          marginTop: '40px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <Link
          to="/perfil"
          className="btn-buy"
          style={{
            background: '#3b82f6',
            width: 'auto',
            padding: '15px 30px',
            textDecoration: 'none'
          }}
        >
          👤 VER MIS PEDIDOS
        </Link>

        <Link
          to="/"
          className="btn-buy"
          style={{
            width: 'auto',
            padding: '15px 30px',
            textDecoration: 'none'
          }}
        >
          VOLVER A LA TIENDA
        </Link>
      </div>
    </div>
  )
}