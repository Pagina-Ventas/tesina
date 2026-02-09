import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [productos, setProductos] = useState([])

  // 1. Función para cargar los productos del Backend
  const cargarProductos = () => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error("Error cargando productos:", err))
  }

  // Se ejecuta una sola vez al iniciar la página
  useEffect(() => {
    cargarProductos()
  }, [])

  // 2. Función para Comprar (Llama a tu Backend)
  const comprarProducto = (id, nombre) => {
    // Simulamos que compra 1 unidad
    fetch(`/api/vender/${id}/1`)
      .then(res => res.text()) // Leemos el mensaje del servidor
      .then(mensaje => {
        alert(mensaje) // Mostramos alerta al usuario
        cargarProductos() // Recargamos para ver el stock actualizado
      })
      .catch(err => alert("Error en la compra"))
  }

  return (
    <div className="container">
      <h1>🛒 Tienda de Tesina (Stock System)</h1>
      <div className="grid">
        {productos.map(prod => (
          <div key={prod.id} className="card">
            <h2>{prod.nombre}</h2>
            <p className="precio">Precio: ${prod.precio}</p>
            <p className={prod.stock <= prod.stockMinimo ? "stock bajo" : "stock"}>
              Stock: {prod.stock}
            </p>
            
            <button 
              onClick={() => comprarProducto(prod.id, prod.nombre)}
              disabled={prod.stock === 0}
            >
              {prod.stock === 0 ? "Sin Stock" : "Comprar 1 Unidad"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App