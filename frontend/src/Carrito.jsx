import React from 'react'
import { Link } from 'react-router-dom'
import './App.css'

// Recibimos modificarCantidad
export function Carrito({ carrito, eliminarDelCarrito, finalizarCompra, modificarCantidad }) {
  
  const totalPrecio = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

  if (carrito.length === 0) {
    return (
      <div className="cart-page-container empty-cart">
        <span className="empty-icon">🧉</span>
        <h2 className="cart-header-title" style={{border: 'none'}}>Tu mate está vacío</h2>
        <Link to="/" className="btn-continue" style={{display: 'inline-flex', margin: '0 auto'}}>VOLVER AL CATÁLOGO</Link>
      </div>
    )
  }

  return (
    <div className="cart-page-container">
      <h2 className="cart-header-title">Resumen de tu Pedido</h2>

      <div className="cart-list">
        {carrito.map(item => (
          <div key={item.id} className="cart-item-row">
            
            <div className="item-details">
              <h3>{item.nombre}</h3>
              <div className="item-price">${item.precio.toLocaleString()}</div>
            </div>

            {/* --- CAJA DE CANTIDAD CON BOTONES --- */}
            <div className="item-quantity-box">
               <button 
                 className="qty-btn" 
                 onClick={() => modificarCantidad(item.id, -1)}
                 disabled={item.cantidad === 1} // Se desactiva si es 1
               >
                 -
               </button>
               
               <span className="qty-number">{item.cantidad}</span>
               
               <button 
                 className="qty-btn" 
                 onClick={() => modificarCantidad(item.id, 1)}
               >
                 +
               </button>
            </div>

            <button className="btn-delete-item" onClick={() => eliminarDelCarrito(item.id)}>
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary-footer">
        <div className="cart-total-row">
          <span className="total-label">Total a Pagar:</span>
          <span className="total-amount">${totalPrecio.toLocaleString()}</span>
        </div>
        <div className="cart-actions">
            <Link to="/" className="btn-continue">← Seguir mirando</Link>
            <button className="btn-confirm-order" onClick={finalizarCompra}>CONFIRMAR COMPRA 🧉</button>
        </div>
      </div>
    </div>
  )
}