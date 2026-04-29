import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../style/tienda.css'

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

  // Si ya es URL completa, la usa tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Si es imagen vieja tipo /uploads/imagen.jpg, le agrega el backend
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`
}

const normalizarTexto = (texto) => {
  return (texto || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function Tienda({
  productos,
  agregarAlCarrito,
  categorias,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  busqueda
}) {
  const [banners, setBanners] = useState([])

  useEffect(() => {
    const cargarBanners = async () => {
      try {
        const res = await fetch(`${API_URL}/api/banners`)
        const data = await res.json()
        setBanners(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error cargando banners:', error)
        setBanners([])
      }
    }

    cargarBanners()
  }, [])

  const textoBusqueda = normalizarTexto(busqueda)

  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria =
      categoriaSeleccionada === 'Todos' || p.categoria === categoriaSeleccionada

    const textoProducto = normalizarTexto(
      `${p.nombre || ''} ${p.categoria || ''} ${p.descripcion || ''}`
    )

    const coincideBusqueda =
      textoBusqueda === '' || textoProducto.includes(textoBusqueda)

    return coincideCategoria && coincideBusqueda
  })

  const bannersActivos = banners.length > 0 ? banners : null
  const segundosPorBanner = 5
  const cantidadBanners = bannersActivos?.length || 1
  const duracionTotal = cantidadBanners * segundosPorBanner

  return (
    <>
      <section className="hero-container">
        <div className="hero-carousel">
          {bannersActivos && bannersActivos.length > 0 ? (
            bannersActivos.length === 1 ? (
              <img
                src={getImagenUrl(bannersActivos[0].imagen)}
                alt={bannersActivos[0].titulo || 'Banner'}
                className="hero-slide hero-slide-single"
              />
            ) : (
              bannersActivos.map((banner, index) => (
                <img
                  key={banner.id}
                  src={getImagenUrl(banner.imagen)}
                  alt={banner.titulo || `Banner ${index + 1}`}
                  className="hero-slide"
                  style={{
                    animationDelay: `${index * segundosPorBanner}s`,
                    animationDuration: `${duracionTotal}s`
                  }}
                />
              ))
            )
          ) : (
            <img
              src="/banners/banner1.jpg"
              alt="Banner por defecto"
              className="hero-slide hero-slide-single"
            />
          )}
        </div>

        <div className="hero-overlay"></div>

        <div className="hero-content">
          <a href="#catalogo" className="btn-hero">
            VER PRODUCTOS
          </a>
        </div>
      </section>

      <div id="catalogo" style={{ paddingTop: '20px' }}></div>

      <div className="filter-container">
        {categorias.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${categoriaSeleccionada === cat ? 'active' : ''}`}
            onClick={() => setCategoriaSeleccionada(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid">
        {productos.length === 0 && (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-pulse"></div>
            </div>
          ))
        )}

        {productos.length > 0 && productosFiltrados.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              color: '#bbb',
              fontSize: '1.1rem'
            }}
          >
            No se encontraron productos para esa búsqueda.
          </div>
        )}

        {productosFiltrados.map(prod => {
          const esCritico = prod.stock > 0 && prod.stock <= prod.stockMinimo

          return (
            <div key={prod.id} className="card">
              <div className="category-tag">{prod.categoria}</div>

              <div className={`badge-stock ${prod.stock === 0 ? 'out' : esCritico ? 'low' : 'ok'}`}>
                {prod.stock === 0 ? 'AGOTADO'
                  : esCritico ? `ÚLTIMOS ${prod.stock}`
                  : 'STOCK'}
              </div>

              <Link to={`/producto/${prod.id}`} style={{ textDecoration: 'none' }}>
                <div
                  className="card-image-box"
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {prod.imagen ? (
                    <img
                      src={getImagenUrl(prod.imagen)}
                      alt={prod.nombre}
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
                      {prod.categoria === 'Termos' ? '⚱️'
                        : prod.categoria === 'Bombillas' ? '🥢'
                        : prod.categoria === 'Kits' ? '💼'
                        : prod.categoria === 'Insumos' ? '🍃'
                        : '🧉'}
                    </span>
                  )}
                </div>
              </Link>

              <div className="card-body">
                <Link to={`/producto/${prod.id}`} style={{ textDecoration: 'none' }}>
                  <h2 className="card-title">{prod.nombre}</h2>
                </Link>

                <div className="price-section">
                  <div className="precio-final">${Number(prod.precio || 0).toLocaleString('es-AR')}</div>
                </div>

                <button
                  className="btn-buy"
                  onClick={() => agregarAlCarrito(prod)}
                  disabled={prod.stock === 0}
                >
                  {prod.stock === 0 ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}