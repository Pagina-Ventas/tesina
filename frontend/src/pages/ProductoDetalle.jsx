import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import '../style/App.css'
export function ProductoDetalle({ productos, agregarAlCarrito }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState(null)

  useEffect(() => {
    // Buscamos el producto por ID (asegurándonos de comparar números con números)
    const encontrado = productos.find(p => p.id === parseInt(id))
    setProducto(encontrado)
  }, [id, productos])

  if (!producto) {
    return <div className="dashboard-container" style={{textAlign:'center', padding:'50px'}}>Cargando mate... 🧉</div>
  }

  // Simulamos descripción según categoría
  const descripcion = producto.categoria === 'Termos' 
    ? 'Mantiene el agua caliente por 24hs. Acero inoxidable 18/8, libre de BPA. Tapón cebador de alta precisión ideal para mate.'
    : producto.categoria === 'Bombillas'
    ? 'Fabricada en alpaca de alta calidad. Filtro tipo pala para evitar que se tape. Diseño ergonómico y disipador de calor.'
    : 'La mejor calidad del mercado. Seleccionado especialmente para los amantes del buen mate. Garantía de satisfacción.'

  // Productos relacionados (Misma categoría, pero no el mismo producto)
  const relacionados = productos
    .filter(p => p.categoria === producto.categoria && p.id !== producto.id)
    .slice(0, 3)

  return (
    <div className="dashboard-container">
      
      {/* Botón Volver */}
      <button onClick={() => navigate(-1)} className="btn-back" style={{background:'transparent', border:'none', color:'#a0a0a0', cursor:'pointer', marginBottom:'20px', fontSize:'1rem'}}>
        ← Volver
      </button>

      <div className="detail-container">
        
        {/* COLUMNA IZQUIERDA: IMAGEN */}
        <div className="detail-image-box">
           <span style={{fontSize: '8rem'}}>
             {producto.categoria === 'Termos' ? '⚱️' : producto.categoria === 'Bombillas' ? '🧪' : producto.categoria === 'Kits' ? '💼' : '🧉'}
           </span>
        </div>

        {/* COLUMNA DERECHA: INFO */}
        <div className="detail-info">
          <span className="detail-category">{producto.categoria}</span>
          <h1 className="detail-title">{producto.nombre}</h1>
          <p className="detail-price">${producto.precio.toLocaleString()}</p>
          
          <div className="detail-description">
            <h3>Sobre este producto:</h3>
            <p>{descripcion}</p>
          </div>

          <div className="detail-stock-info">
             {producto.stock > 0 ? (
                 <span style={{color: '#4caf50'}}>✅ Hay Stock ({producto.stock} unid.)</span>
             ) : (
                 <span style={{color: '#d32f2f'}}>❌ Agotado</span>
             )}
          </div>

          <button 
            className="btn-buy" 
            style={{marginTop: '30px', padding: '18px', fontSize: '1.2rem'}}
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
            <h3 className="section-title">También te puede interesar...</h3>
            <div className="grid">
                {relacionados.map(rel => (
                    <Link to={`/producto/${rel.id}`} key={rel.id} className="card" style={{textDecoration:'none'}}>
                        <div className="card-image-box" style={{height:'150px', fontSize:'3rem'}}>
                            {rel.categoria === 'Termos' ? '⚱️' : rel.categoria === 'Bombillas' ? '🧪' : '🧉'}
                        </div>
                        <div className="card-body">
                            <h4 style={{color:'#fff', fontSize:'1rem'}}>{rel.nombre}</h4>
                            <p style={{color:'#c5a059', fontWeight:'bold'}}>${rel.precio.toLocaleString()}</p>
                        </div>
                    </Link>
                ))}
            </div>
          </div>
      )}

    </div>
  )
}