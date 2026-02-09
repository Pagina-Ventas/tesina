import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Tienda } from './Tienda'
import { Carrito } from './Carrito'
// 1. IMPORTAR EL NUEVO COMPONENTE
import { Inventario } from './Inventario'
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

  const modificarCantidad = (id, cantidad) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
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
          
          {/* 2. AGREGAR UN LINK AL ADMIN EN EL HEADER (Temporal, para acceso rápido) */}
          <Link to="/admin" style={{color: '#a0a0a0', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #444', padding: '5px 10px', borderRadius: '4px'}}>
            ⚙️ ADMIN
          </Link>

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
              modificarCantidad={modificarCantidad} 
            />
          } />

          {/* 3. NUEVA RUTA PARA EL INVENTARIO */}
          <Route path="/admin" element={<Inventario />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App