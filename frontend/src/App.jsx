import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [productos, setProductos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos')

  // 1. Carga de datos
  const cargarProductos = () => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  // 2. Lógica de Compra
  const comprarProducto = (id, nombre) => {
    fetch(`/api/vender/${id}/1`)
      .then(res => res.text())
      .then(mensaje => {
        alert(`✅ ${mensaje}`)
        cargarProductos()
      })
  }

  // 3. Lógica EXPERTA: Extraer categorías únicas automáticamente
  // Esto lee tu JSON y dice: "Ah, hay Termos y Bombillas"
  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]

  // 4. Filtrar los productos antes de mostrarlos
  const productosFiltrados = categoriaSeleccionada === 'Todos'
    ? productos
    : productos.filter(p => p.categoria === categoriaSeleccionada)

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          IMPERIO<span>MATE</span>
        </div>
        <input type="text" placeholder="Buscar..." className="search-bar" />
        <div style={{color: '#c5a059', fontWeight: 'bold', cursor: 'pointer'}}>
          CARRITO (0)
        </div>
      </header>

      {/* --- NUEVA BARRA DE FILTROS --- */}
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

      {/* Grilla Filtrada */}
      <div className="grid">
        {productosFiltrados.map(prod => {
          const esCritico = prod.stock <= prod.stockMinimo;

          return (
            <div key={prod.id} className="card">
              <div className={`badge-stock ${prod.stock === 0 ? 'low' : ''}`}>
                {prod.stock === 0 ? 'SIN STOCK' : 
                 esCritico ? '¡POCAS UNIDADES!' : 'PREMIUM'}
              </div>

              <div className="card-image-box">
                {prod.categoria === 'Termos' ? '⚱️' : 
                 prod.categoria === 'Bombillas' ? '🧪' : 
                 prod.categoria === 'Kits' ? '💼' : 
                 prod.categoria === 'Insumos' ? '🍃' : '🧉'}
                 
                 {/* La etiqueta ya no es tan necesaria si tenemos filtros arriba, pero la dejamos por estilo */}
                 <div className="category-tag">{prod.categoria}</div>
              </div>

              <div className="card-body">
                <div>
                  <h2 className="card-title">{prod.nombre}</h2>
                  <p className="card-desc">Calidad asegurada - Envío gratis</p>
                </div>

                <div className="price-section">
                  <div>
                    <div className="precio-label">Precio Contado</div>
                    <div className="precio-final">${prod.precio.toLocaleString()}</div>
                  </div>
                </div>

                <button 
                  className="btn-buy"
                  onClick={() => comprarProducto(prod.id, prod.nombre)}
                  disabled={prod.stock === 0}
                >
                  {prod.stock === 0 ? "AGOTADO" : "AGREGAR AL MATE 🧉"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App