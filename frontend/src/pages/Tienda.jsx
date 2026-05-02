import React, { useEffect, useMemo, useState } from 'react'
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

const mezclarProductos = (lista) => {
  const copia = [...lista]

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }

  return copia
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

const productosFiltrados = useMemo(() => {
  const filtrados = productos.filter((p) => {
    const coincideCategoria =
      categoriaSeleccionada === 'Todos' || p.categoria === categoriaSeleccionada

    const textoProducto = normalizarTexto(
      `${p.nombre || ''} ${p.categoria || ''} ${p.descripcion || ''}`
    )

    const coincideBusqueda =
      textoBusqueda === '' || textoProducto.includes(textoBusqueda)

    return coincideCategoria && coincideBusqueda
  })

  if (categoriaSeleccionada === 'Todos' && textoBusqueda === '') {
    return mezclarProductos(filtrados)
  }

  return filtrados
}, [productos, categoriaSeleccionada, textoBusqueda])

  const bannersActivos = banners.length > 0 ? banners : null
  const segundosPorBanner = 5
  const cantidadBanners = bannersActivos?.length || 1
  const duracionTotal = cantidadBanners * segundosPorBanner

  const renderBanner = (banner, index = 0, single = false) => {
    const imagenDesktop = getImagenUrl(banner.imagen)
    const imagenMobile = getImagenUrl(
      banner.imagenMobile || banner.imagen_mobile || banner.imagen
    )

    return (
      <picture
        key={banner.id || index}
        className={`hero-picture hero-slide ${single ? 'hero-slide-single' : ''}`}
        style={
          single
            ? undefined
            : {
                animationDelay: `${index * segundosPorBanner}s`,
                animationDuration: `${duracionTotal}s`
              }
        }
      >
        <source media="(max-width: 768px)" srcSet={imagenMobile} />
        <img
          src={imagenDesktop}
          alt={banner.titulo || `Banner ${index + 1}`}
          className="hero-img"
        />
      </picture>
    )
  }

  return (
    <>
      <section className="hero-container">
        <div className="hero-carousel">
          {bannersActivos && bannersActivos.length > 0 ? (
            bannersActivos.length === 1 ? (
              renderBanner(bannersActivos[0], 0, true)
            ) : (
              bannersActivos.map((banner, index) => renderBanner(banner, index, false))
            )
          ) : (
            <picture className="hero-picture hero-slide hero-slide-single">
              <source media="(max-width: 768px)" srcSet="/banners/banner1-mobile.png" />
              <img
                src="/banners/banner1.jpg"
                alt="Banner por defecto"
                className="hero-img"
              />
            </picture>
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