import React, { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../style/App.css'

export function Exito({ vaciarCarrito }) {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('collection_status')
  const paymentId = searchParams.get('payment_id')

  useEffect(() => {
    // Si Mercado Pago dice "approved", vaciamos el carrito
    if (status === 'approved') {
      vaciarCarrito()
    }
  }, [status, vaciarCarrito])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      height: '80vh', textAlign: 'center', padding: '20px'
    }}>
      {status === 'approved' ? (
        <>
          <div style={{fontSize: '5rem'}}>🎉</div>
          <h1 style={{color: '#4caf50', fontFamily: 'Playfair Display', fontSize: '3rem'}}>¡Pago Exitoso!</h1>
          <p style={{color: '#a0a0a0', fontSize: '1.2rem', margin: '20px 0'}}>
            Tu pedido ha sido registrado correctamente.<br/>
            ID de Operación: <strong style={{color: '#fff'}}>{paymentId}</strong>
          </p>
        </>
      ) : (
        <>
          <div style={{fontSize: '5rem'}}>⏳</div>
          <h1 style={{color: '#c5a059'}}>Procesando...</h1>
          <p>Estamos verificando el estado de tu pago.</p>
        </>
      )}

      <Link to="/" className="btn-buy" style={{marginTop: '40px', width: 'auto', padding: '15px 40px', textDecoration: 'none'}}>
        VOLVER A LA TIENDA
      </Link>
    </div>
  )
}