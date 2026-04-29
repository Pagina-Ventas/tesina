import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../style/carrito.css'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
}

const getImagenUrl = (imagen) => {
  if (!imagen) return ''

  let url = String(imagen).trim()

  // Corrige URLs mal armadas como:
  // https://tesina-backend.onrender.comhttps//res.cloudinary.com/...
  if (url.includes('res.cloudinary.com')) {
    const index = url.indexOf('res.cloudinary.com')
    return `https://${url.slice(index)}`
  }

  // Corrige casos tipo https//res.cloudinary.com
  if (url.startsWith('https//')) {
    url = url.replace('https//', 'https://')
  }

  if (url.startsWith('http//')) {
    url = url.replace('http//', 'http://')
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export function Carrito({ carrito, eliminarDelCarrito, finalizarCompra, modificarCantidad }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const totalPrecio = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

  if (carrito.length === 0) {
    return (
      <div className="tienda-wrapper">
        <div className="cart-page-container empty-cart">
          <span className="empty-icon">🧉</span>
          <h2 className="cart-header-title" style={{ border: 'none', margin: '0 0 10px 0' }}>Tu carrito está vacío</h2>
          <p style={{ color: '#a0a0a0', marginBottom: '40px' }}>Parece que todavía no elegiste ningún producto para tu ritual.</p>
          <Link to="/" className="btn-continue" style={{ display: 'inline-flex', margin: '0 auto' }}>
            VOLVER AL CATÁLOGO
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="tienda-wrapper">
      <div className="cart-page-container">

        <div className="cart-header">
          <h2 className="cart-header-title">Tu Selección</h2>
          <span className="cart-item-count">{carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}</span>
        </div>

        <div className="cart-list">
          {carrito.map(item => {
            const stockMax = Number.isFinite(Number(item.stock)) ? Number(item.stock) : Infinity
            const llegoAlMax = item.cantidad >= stockMax

            return (
              <div key={item.id} className="cart-item-row">

                <div className="cart-item-img-box">
                  {item.imagen ? (
                    <img
                      src={getImagenUrl(item.imagen)}
                      alt={item.nombre}
                      className="cart-item-img"
                    />
                  ) : (
                    <span className="cart-item-img-placeholder">
                      {item.categoria === 'Termos' ? '⚱️' : item.categoria === 'Bombillas' ? '🥢' : '🧉'}
                    </span>
                  )}
                </div>

                <div className="item-details">
                  <h3>{item.nombre}</h3>
                  <div className="item-price">${Number(item.precio).toLocaleString('es-AR')}</div>
                </div>

                <div className="cart-item-controls">
                  <div className="item-quantity-box">
                    <button
                      className="qty-btn"
                      onClick={() => modificarCantidad(item.id, -1)}
                      disabled={item.cantidad === 1}
                    >
                      -
                    </button>

                    <span className="qty-number">
                      {item.cantidad}
                      {Number.isFinite(Number(item.stock)) && (
                        <span style={{ opacity: 0.5, fontSize: '0.75em', display: 'block', marginTop: '-4px' }}>
                          de {stockMax}
                        </span>
                      )}
                    </span>

                    <button
                      className="qty-btn"
                      onClick={() => modificarCantidad(item.id, 1)}
                      disabled={llegoAlMax}
                      title={llegoAlMax && Number.isFinite(Number(item.stock)) ? `Solo quedan ${stockMax}` : ''}
                    >
                      +
                    </button>
                  </div>

                  <div className="item-subtotal">
                    ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                  </div>

                  <button className="btn-delete-item" onClick={() => eliminarDelCarrito(item.id)} title="Quitar producto">
                    ✕
                  </button>
                </div>

              </div>
            )
          })}
        </div>

        <div className="cart-summary-footer">
          <div className="cart-total-row">
            <span className="total-label">Subtotal:</span>
            <span className="total-amount">${totalPrecio.toLocaleString('es-AR')}</span>
          </div>
          <p className="shipping-notice">El costo de envío y recargos se calcularán en el siguiente paso.</p>

          <div className="cart-actions">
            <Link to="/" className="btn-continue">← SEGUIR MIRANDO</Link>
            <button className="btn-confirm-order" onClick={finalizarCompra}>
              INICIAR PAGO 💳
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}