import React from 'react'
import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero' // <--- IMPORTAMOS HERO
import '../style/App.css'

export function Tienda({ productos, agregarAlCarrito, categorias, categoriaSeleccionada, setCategoriaSeleccionada }) {
  
  const productosFiltrados = categoriaSeleccionada === 'Todos'
    ? productos
    : productos.filter(p => p.categoria === categoriaSeleccionada)

  return (
    <>
      {/* 1. AGREGAMOS EL HERO */}
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
        {productosFiltrados.map(prod => {
          const esCritico = prod.stock <= prod.stockMinimo;
          return (
            <div key={prod.id} className="card">
              <div className={`badge-stock ${prod.stock === 0 ? 'low' : ''}`}>
                {prod.stock === 0 ? 'SIN STOCK' : esCritico ? '¡POCAS UNIDADES!' : 'PREMIUM'}
              </div>
              
              <Link to={`/producto/${prod.id}`} style={{textDecoration: 'none'}}>
                  <div className="card-image-box">
                    {prod.categoria === 'Termos' ? '⚱️' : 
                     prod.categoria === 'Bombillas' ? '🧪' : 
                     prod.categoria === 'Kits' ? '💼' : 
                     prod.categoria === 'Insumos' ? '🍃' : '🧉'}
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