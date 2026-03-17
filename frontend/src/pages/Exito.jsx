import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

// --- ACTUALIZAMOS EL IMPORT AL NUEVO CSS ---
import '../style/tienda.css'

export function Exito({ vaciarCarrito }) {
  const [searchParams] = useSearchParams()
  
  // 👈 Capturamos las diferentes formas en que Mercado Pago puede enviar el estado
  const collectionStatus = searchParams.get('collection_status')
  const statusMP = searchParams.get('status')
  
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
  const pedidoId = searchParams.get('external_reference')

  // Verificamos si está aprobado leyendo cualquiera de los dos parámetros
  const estaAprobado = collectionStatus === 'approved' || statusMP === 'approved'

  useEffect(() => {
    // 🧹 Vaciamos el carrito SIEMPRE que el usuario aterrice en la pantalla de éxito.
    // Si Mercado Pago lo redirigió a esta URL, significa que el proceso de checkout terminó
    // (la orden ya se creó en tu BD antes de ir a pagar), así que limpiamos la memoria.
    vaciarCarrito()
  }, [vaciarCarrito])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '80vh', textAlign: 'center', padding: '20px'
    }}>
      {estaAprobado ? (
        <>
          <div style={{fontSize: '5rem', marginBottom: '10px'}}>🎉</div>
          <h1 style={{color: '#4caf50', fontFamily: 'Playfair Display', fontSize: '3rem', margin: '0'}}>¡Pago Exitoso!</h1>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px', marginTop: '20px', border: '1px solid #4caf50'}}>
            <p style={{color: '#fff', fontSize: '1.2rem', margin: '0 0 10px 0'}}>
              Tu pedido ha sido registrado y pagado correctamente.
            </p>
            <p style={{color: '#a0a0a0', margin: '5px 0', fontSize: '1.1rem'}}>
              Número de Pedido Web: <strong style={{color: '#c5a059', fontSize: '1.5rem'}}>#{pedidoId}</strong>
            </p>
            <p style={{color: '#777', fontSize: '0.9rem', margin: '5px 0'}}>
              ID de Operación MP: {paymentId}
            </p>
          </div>
        </>
      ) : (
        <>
          <div style={{fontSize: '5rem'}}>⏳</div>
          <h1 style={{color: '#c5a059'}}>Procesando tu pago...</h1>
          <p style={{color: '#a0a0a0'}}>Mercado Pago está terminando de procesar la transacción.</p>
          <p style={{color: '#777', fontSize: '0.9rem'}}>Pedido Web: #{pedidoId}</p>
        </>
      )}

      <div style={{ display: 'flex', gap: '15px', marginTop: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 👇 Botón para ir a ver el historial del usuario */}
        <Link to="/perfil" className="btn-buy" style={{ background: '#3b82f6', width: 'auto', padding: '15px 30px', textDecoration: 'none'}}>
          👤 VER MIS PEDIDOS
        </Link>
        <Link to="/" className="btn-buy" style={{width: 'auto', padding: '15px 30px', textDecoration: 'none'}}>
          VOLVER A LA TIENDA
        </Link>
      </div>
    </div>
  )
}