import React, { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../style/tienda.css'

// 👇 Definimos la URL de tu backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 👇 Fíjate que ahora recibe "recargarProductos" como parámetro
export function Exito({ vaciarCarrito, recargarProductos }) {
  const [searchParams] = useSearchParams()
  
  const collectionStatus = searchParams.get('collection_status')
  const statusMP = searchParams.get('status')
  
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
  const pedidoId = searchParams.get('external_reference')

  const estaAprobado = collectionStatus === 'approved' || statusMP === 'approved'
  
  // Usamos useRef para evitar que el fetch se dispare dos veces (por el modo estricto de React)
  const sincronizado = useRef(false)

  useEffect(() => {
    if (estaAprobado && !sincronizado.current) {
      sincronizado.current = true
      
      // 1. Vaciamos el carrito visualmente
      vaciarCarrito()

      // 2. Le avisamos al Backend que procese el stock y el pago (MODO LOCAL)
      if (pedidoId) {
        fetch(`${API_URL}/api/pagos/sincronizar-local/${pedidoId}`, { 
          method: 'POST' 
        })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Stock y Pedido sincronizados:', data)
          
          // 3. 👇 ACTUALIZAMOS EL STOCK VISUAL EN EL FRONTEND
          if (recargarProductos) {
            recargarProductos()
          }
        })
        .catch(err => console.error('❌ Error sincronizando:', err))
      }
    }
  }, [estaAprobado, pedidoId, vaciarCarrito, recargarProductos])

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