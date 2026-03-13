import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

// --- ACTUALIZAMOS EL IMPORT AL NUEVO CSS ---
import '../style/tienda.css'

export function Exito({ vaciarCarrito }) {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('collection_status')
  const paymentId = searchParams.get('payment_id')
  const pedidoId = searchParams.get('external_reference') // 👈 Capturamos el ID de tu base de datos

  useEffect(() => {
    // Si Mercado Pago dice "approved", vaciamos el carrito
    if (status === 'approved') {
      vaciarCarrito()
    }
  }, [status, vaciarCarrito])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '80vh', textAlign: 'center', padding: '20px'
    }}>
      {status === 'approved' ? (
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
          <h1 style={{color: '#c5a059'}}>Procesando...</h1>
          <p style={{color: '#a0a0a0'}}>Estamos verificando el estado de tu pago.</p>
        </>
      )}

      <div style={{ display: 'flex', gap: '15px', marginTop: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* 👇 Botón nuevo para ir a ver el historial del usuario */}
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