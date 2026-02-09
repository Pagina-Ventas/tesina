import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Tienda } from './Tienda'
import { Carrito } from './Carrito'
import './App.css'

function App() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos')

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }, [])

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id)
    if (existe) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...existe, cantidad: existe.cantidad + 1 } : item))
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }])
    }
  }

  // --- NUEVA FUNCIÓN PARA SUMAR/RESTAR ---
  const modificarCantidad = (id, cantidad) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        // Math.max(1, ...) asegura que nunca baje de 1
        const nuevaCant = Math.max(1, item.cantidad + cantidad)
        return { ...item, cantidad: nuevaCant }
      }
      return item
    }))
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
  }

  const finalizarCompra = async () => {
    alert("⚙️ Procesando compra...")
    for (const item of carrito) {
      await fetch(`/api/vender/${item.id}/${item.cantidad}`)
    }
    alert("✅ ¡Compra finalizada!")
    setCarrito([])
    const res = await fetch('/api/productos')
    const data = await res.json()
    setProductos(data)
  }

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0)
  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]

  return (
    <BrowserRouter>
      <div className="dashboard-container">
        <header className="header">
          <Link to="/" className="logo" style={{textDecoration: 'none'}}>IMPERIO<span>MATE</span></Link>
          <input type="text" placeholder="Buscar..." className="search-bar" />
          <Link to="/carrito" style={{textDecoration: 'none'}}>
            <div style={{color: '#c5a059', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center'}}>
              <span>🛒 TU MATE</span>
              <span style={{background: '#c5a059', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '0.9rem'}}>
                {totalItems}
              </span>
            </div>
          </Link>
        </header>

        <Routes>
          <Route path="/" element={
            <Tienda 
              productos={productos} 
              agregarAlCarrito={agregarAlCarrito} 
              categorias={categorias}
              categoriaSeleccionada={categoriaSeleccionada}
              setCategoriaSeleccionada={setCategoriaSeleccionada}
            />
          } />
          
          <Route path="/carrito" element={
            <Carrito 
              carrito={carrito} 
              eliminarDelCarrito={eliminarDelCarrito} 
              finalizarCompra={finalizarCompra}
              // PASAMOS LA NUEVA FUNCIÓN AQUÍ ABAJO 👇
              modificarCantidad={modificarCantidad} 
            />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App