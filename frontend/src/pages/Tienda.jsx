import React from 'react'
import { Link } from 'react-router-dom'

// --- IMPORTAMOS SOLO LOS ESTILOS DE LA TIENDA ---
import '../style/tienda.css'

// Definimos la URL base para las imágenes (igual que en App.jsx)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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

  return (
    <>
      <section className="hero-container">
        <div className="hero-carousel">
          <img src="/banners/banner1.jpg" alt="Banner 1" className="hero-slide" />
          <img src="/banners/banner2.jpg" alt="Banner 2" className="hero-slide" />
          <img src="/banners/banner3.jpg" alt="Banner 3" className="hero-slide" />
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
                      src={`${API_URL}${prod.imagen}`}
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
                  <div className="precio-final">${prod.precio.toLocaleString()}</div>
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