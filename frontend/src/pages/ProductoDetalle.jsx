import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

// --- IMPORTAMOS LOS ESTILOS MODULARES ---
import '../style/producto.css' 
import '../style/tienda.css' // Lo necesitamos para la grilla de productos relacionados

// Definimos la URL base para las imágenes
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function ProductoDetalle({ productos, agregarAlCarrito }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState(null)

  useEffect(() => {
    // 👇 NUEVO: Hacemos que la página suba al principio al cargar un nuevo producto
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const encontrado = productos.find(p => p.id === parseInt(id))
    setProducto(encontrado)
  }, [id, productos])

  if (!producto) {
    return <div className="dashboard-container" style={{textAlign:'center', padding:'100px', fontSize: '1.5rem', color: '#c5a059'}}>Cargando detalle... 🧉</div>
  }

  // Simulamos descripción según categoría
  const descripcion = producto.categoria === 'Termos' 
    ? 'Mantiene el agua caliente por 24hs. Acero inoxidable 18/8, libre de BPA. Tapón cebador de alta precisión ideal para el ritual matero. Resistencia extrema contra golpes y caídas.'
    : producto.categoria === 'Bombillas'
    ? 'Fabricada en alpaca de alta calidad. Filtro tipo pala para evitar que se tape. Diseño ergonómico y disipador de calor en el pico para no quemarse.'
    : 'La mejor calidad del mercado. Seleccionado especialmente para los amantes del buen mate. Garantía de satisfacción total.'

  // Productos relacionados (Misma categoría, pero no el mismo producto)
  const relacionados = productos
    .filter(p => p.categoria === producto.categoria && p.id !== producto.id)
    .slice(0, 3)

  return (
    <div className="tienda-wrapper" style={{ paddingTop: '30px' }}>
      
      <button onClick={() => navigate(-1)} className="btn-buy" style={{ width: 'auto', padding: '10px 20px', marginBottom: '20px', background: 'transparent', color: '#a0a0a0', borderColor: '#333' }}>
        ← VOLVER AL CATÁLOGO
      </button>

      <div className="detail-container">
        
        {/* COLUMNA IZQUIERDA: IMAGEN */}
        <div className="detail-image-box">
            {producto.imagen ? (
                <img 
                    src={`${API_URL}${producto.imagen}`} 
                    alt={producto.nombre} 
                    className="detail-image"
                />
            ) : (
                <span className="detail-image-placeholder">
                    {producto.categoria === 'Termos' ? '⚱️' : producto.categoria === 'Bombillas' ? '🥢' : producto.categoria === 'Kits' ? '💼' : '🧉'}
                </span>
            )}
        </div>

        {/* COLUMNA DERECHA: INFO */}
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
                 <span style={{color: '#10b981'}}>✅ En Stock ({producto.stock} unidades disponibles)</span>
             ) : (
                 <span style={{color: '#ef4444'}}>❌ Producto Agotado temporalmente</span>
             )}
          </div>

          <button 
            className="btn-buy" 
            style={{marginTop: '20px', padding: '18px', fontSize: '1.2rem', background: producto.stock > 0 ? '#c5a059' : 'transparent', color: producto.stock > 0 ? '#000' : '#ef4444', borderColor: producto.stock > 0 ? '#c5a059' : '#ef4444'}}
            onClick={() => agregarAlCarrito(producto)}
            disabled={producto.stock === 0}
          >
            {producto.stock === 0 ? "SIN STOCK" : "AGREGAR AL CARRITO 🛒"}
          </button>
        </div>
      </div>

      {/* PRODUCTOS RELACIONADOS */}
      {relacionados.length > 0 && (
          <div className="related-section">
            <h3 className="section-title">Completá tu equipo</h3>
            
            {/* 👇 Usamos la misma estructura de la Tienda para que se vean iguales */}
            <div className="grid">
                {relacionados.map(rel => {
                    const esCriticoRel = rel.stock > 0 && rel.stock <= rel.stockMinimo;
                    
                    return (
                    <div key={rel.id} className="card">
                        <div className="category-tag">{rel.categoria}</div>
                        
                        <div className={`badge-stock ${rel.stock === 0 ? 'out' : esCriticoRel ? 'low' : 'ok'}`}>
                          {rel.stock === 0 ? 'AGOTADO' : esCriticoRel ? `ÚLTIMOS ${rel.stock}` : 'STOCK'}
                        </div>
                        
                        <Link to={`/producto/${rel.id}`} className="card-image-link">
                            <div className="card-image-box">
                                {rel.imagen ? (
                                    <img src={`${API_URL}${rel.imagen}`} alt={rel.nombre} className="card-image" />
                                ) : (
                                    <span className="card-image-placeholder">
                                      {rel.categoria === 'Termos' ? '⚱️' : rel.categoria === 'Bombillas' ? '🥢' : '🧉'}
                                    </span>
                                )}
                            </div>
                        </Link>
                        
                        <div className="card-body">
                            <Link to={`/producto/${rel.id}`} style={{textDecoration:'none'}}>
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
                )})}
            </div>
          </div>
      )}

    </div>
  )
}