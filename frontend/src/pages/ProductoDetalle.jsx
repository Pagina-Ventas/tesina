import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

import '../style/producto.css'
import '../style/tienda.css'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
}

// Sirve para imágenes nuevas de Cloudinary, URLs mal armadas y viejas de /uploads
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

  // Si ya es URL completa, la usa tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Si es imagen vieja tipo /uploads/imagen.jpg, le agrega el backend
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

export function ProductoDetalle({ productos, agregarAlCarrito }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [producto, setProducto] = useState(null)
  const [imagenesSecundarias, setImagenesSecundarias] = useState([])
  const [imagenActiva, setImagenActiva] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const encontrado = productos.find(p => p.id === parseInt(id))
    setProducto(encontrado)
  }, [id, productos])

  useEffect(() => {
    if (producto?.imagen) {
      setImagenActiva(producto.imagen)
    } else {
      setImagenActiva(null)
    }
  }, [producto])

  useEffect(() => {
    const cargarImagenesSecundarias = async () => {
      if (!id) return

      try {
        const res = await fetch(`${API_URL}/api/productos/${id}/imagenes`)
        const data = await res.json()
        setImagenesSecundarias(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error cargando imágenes secundarias:', err)
        setImagenesSecundarias([])
      }
    }

    cargarImagenesSecundarias()
  }, [id])

  if (!producto) {
    return (
      <div
        className="dashboard-container"
        style={{
          textAlign: 'center',
          padding: '100px',
          fontSize: '1.5rem',
          color: '#c5a059'
        }}
      >
        Cargando detalle... 🧉
      </div>
    )
  }

  const descripcion = producto.descripcion?.trim()
    ? producto.descripcion
    : 'Sin descripción disponible.'

  const relacionados = productos
    .filter(p => p.categoria === producto.categoria && p.id !== producto.id)
    .slice(0, 3)

  return (
    <div className="tienda-wrapper" style={{ paddingTop: '30px' }}>
      <button
        onClick={() => navigate(-1)}
        className="btn-buy"
        style={{
          width: 'auto',
          padding: '10px 20px',
          marginBottom: '20px',
          background: 'transparent',
          color: '#a0a0a0',
          borderColor: '#333'
        }}
      >
        ← VOLVER AL CATÁLOGO
      </button>

      <div className="detail-container">
        <div className="detail-image-box">
          <div className="detail-gallery">
            <div className="detail-thumbs">
              {producto.imagen && (
                <img
                  src={getImagenUrl(producto.imagen)}
                  alt="principal"
                  onClick={() => setImagenActiva(producto.imagen)}
                  className={`detail-thumb ${imagenActiva === producto.imagen ? 'active' : ''}`}
                />
              )}

              {imagenesSecundarias.map((img) => (
                <img
                  key={img.id}
                  src={getImagenUrl(img.imagen)}
                  alt="secundaria"
                  onClick={() => setImagenActiva(img.imagen)}
                  className={`detail-thumb ${imagenActiva === img.imagen ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="detail-main-image-wrapper">
              {imagenActiva ? (
                <img
                  src={getImagenUrl(imagenActiva)}
                  alt={producto.nombre}
                  className="detail-image"
                />
              ) : (
                <span className="detail-image-placeholder">
                  {producto.categoria === 'Termos'
                    ? '⚱️'
                    : producto.categoria === 'Bombillas'
                    ? '🥢'
                    : producto.categoria === 'Kits'
                    ? '💼'
                    : '🧉'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="detail-info">
          <span className="detail-category">{producto.categoria}</span>
          <h1 className="detail-title">{producto.nombre}</h1>
          <p className="detail-price">${Number(producto.precio).toLocaleString('es-AR')}</p>

          <div className="detail-description">
            <h3>Sobre este producto</h3>
            <p>{descripcion}</p>
          </div>

          <div className="detail-stock-info">
            {producto.stock > 0 ? (
              <span style={{ color: '#10b981' }}>
                ✅ En Stock ({producto.stock} unidades disponibles)
              </span>
            ) : (
              <span style={{ color: '#ef4444' }}>
                ❌ Producto Agotado temporalmente
              </span>
            )}
          </div>

          <button
            className="btn-buy"
            style={{
              marginTop: '20px',
              padding: '18px',
              fontSize: '1.2rem',
              background: producto.stock > 0 ? '#c5a059' : 'transparent',
              color: producto.stock > 0 ? '#000' : '#ef4444',
              borderColor: producto.stock > 0 ? '#c5a059' : '#ef4444'
            }}
            onClick={() => agregarAlCarrito(producto)}
            disabled={producto.stock === 0}
          >
            {producto.stock === 0 ? 'SIN STOCK' : 'AGREGAR AL CARRITO 🛒'}
          </button>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div className="related-section">
          <h3 className="section-title">Completá tu equipo</h3>

          <div className="grid">
            {relacionados.map(rel => {
              const esCriticoRel = rel.stock > 0 && rel.stock <= rel.stockMinimo

              return (
                <div key={rel.id} className="card">
                  <div className="category-tag">{rel.categoria}</div>

                  <div className={`badge-stock ${rel.stock === 0 ? 'out' : esCriticoRel ? 'low' : 'ok'}`}>
                    {rel.stock === 0 ? 'AGOTADO' : esCriticoRel ? `ÚLTIMOS ${rel.stock}` : 'STOCK'}
                  </div>

                  <Link to={`/producto/${rel.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      className="card-image-box"
                      style={{
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {rel.imagen ? (
                        <img
                          src={getImagenUrl(rel.imagen)}
                          alt={rel.nombre}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      ) : (
                        <span style={{ fontSize: '4rem', opacity: '0.5' }}>
                          {rel.categoria === 'Termos'
                            ? '⚱️'
                            : rel.categoria === 'Bombillas'
                            ? '🥢'
                            : rel.categoria === 'Kits'
                            ? '💼'
                            : rel.categoria === 'Insumos'
                            ? '🍃'
                            : '🧉'}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="card-body">
                    <Link to={`/producto/${rel.id}`} style={{ textDecoration: 'none' }}>
                      <h2 className="card-title">{rel.nombre}</h2>
                    </Link>

                    <div className="price-section">
                      <div className="precio-final">${Number(rel.precio).toLocaleString('es-AR')}</div>
                    </div>

                    <button
                      className="btn-buy"
                      onClick={() => agregarAlCarrito(rel)}
                      disabled={rel.stock === 0}
                    >
                      {rel.stock === 0 ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}