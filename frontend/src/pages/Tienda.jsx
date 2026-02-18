import React from 'react'
import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero' 
import '../style/App.css'

export function Tienda({ productos, agregarAlCarrito, categorias, categoriaSeleccionada, setCategoriaSeleccionada }) {
  
  const productosFiltrados = categoriaSeleccionada === 'Todos'
    ? productos
    : productos.filter(p => p.categoria === categoriaSeleccionada)

  return (
    <>
      <Hero />
      <div id="catalogo" style={{paddingTop: '20px'}}></div>

      {/* FILTROS */}
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

      {/* GRILLA */}
      <div className="grid">
        
        {/* 1. SKELETON LOADING (Efecto de Carga cuando no hay datos) */}
        {productos.length === 0 && (
            Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton-card">
                    <div className="skeleton-pulse"></div>
                </div>
            ))
        )}

        {/* 2. PRODUCTOS REALES */}
        {productosFiltrados.map(prod => {
          const esCritico = prod.stock <= prod.stockMinimo;
          
          return (
            <div key={prod.id} className="card">
              {/* --- LÓGICA DE ETIQUETAS MEJORADA --- */}
              <div className={`badge-stock ${prod.stock === 0 ? 'out' : esCritico ? 'low' : 'ok'}`}>
                {prod.stock === 0 ? 'SIN STOCK' 
                 : esCritico ? `¡SOLO QUEDAN ${prod.stock}!` 
                 : 'PREMIUM'}
              </div>
              
              <Link to={`/producto/${prod.id}`} style={{textDecoration: 'none'}}>
                  <div className="card-image-box" style={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {prod.imagen ? (
                        // 1. SI HAY FOTO REAL:
                        <img 
                            src={`http://localhost:3000${prod.imagen}`} 
                            alt={prod.nombre} 
                            style={{
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                transition: 'transform 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                    ) : (
                        // 2. SI NO HAY FOTO (Emoji fallback):
                        <span style={{fontSize: '5rem'}}>
                            {prod.categoria === 'Termos' ? '⚱️' : 
                             prod.categoria === 'Bombillas' ? '🧪' : 
                             prod.categoria === 'Kits' ? '💼' : 
                             prod.categoria === 'Insumos' ? '🍃' : '🧉'}
                        </span>
                    )}
                  </div>
              </Link>

              <div className="card-body">
                <Link to={`/producto/${prod.id}`} style={{textDecoration: 'none'}}>
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
                  {prod.stock === 0 ? "AGOTADO" : "AGREGAR AL MATE 🧉"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}