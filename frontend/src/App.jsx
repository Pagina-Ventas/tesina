import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Toaster, toast } from 'sonner'

// --- IMPORTACIONES ORDENADAS ---
import { Tienda } from './pages/Tienda'
import { Carrito } from './pages/Carrito'
import { Inventario as AdminPanel } from './pages/AdminPanel' 
import { ProductoDetalle } from './pages/ProductoDetalle'
import { CheckoutForm } from './components/CheckoutForm'

// --- IMPORTACIONES DE ESTILOS ---
import './style/App.css'
import './style/Admin.css' 

function App() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos')
  const [mostrarCheckout, setMostrarCheckout] = useState(false)

  // --- CONFIGURACIÓN DE NÚMEROS DE WHATSAPP ---
  const ADMIN_SAN_JUAN = "5492644117588"      // Principal (Logística Local)
  const ADMIN_BS_AS = "5491169734096"         // Respaldo / Socio

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = () => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }

  // --- NUEVA FUNCIÓN: CREAR PRODUCTO (ADMIN) ---
  const crearProducto = (nuevoProducto) => {
    // Generamos un ID temporal (el último + 1)
    const id = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1
    const productoConId = { ...nuevoProducto, id }
    
    setProductos([...productos, productoConId])
    toast.success('Producto creado con éxito ✨')
  }

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id)
    if (existe) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...existe, cantidad: existe.cantidad + 1 } : item))
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }])
    }
    toast.success(`¡${producto.nombre} agregado!`, {
      style: { background: '#1e1e1e', border: '1px solid #c5a059', color: '#fff' }
    })
  }

  const modificarCantidad = (id, cantidad) => {
    setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + cantidad) } : item))
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
    toast.error('Producto eliminado', {
      style: { background: '#1e1e1e', border: '1px solid #d32f2f', color: '#fff' }
    })
  }

  // --- LÓGICA DE PEDIDOS ---
  const crearOrdenPendiente = (ordenData) => {
    const nuevaOrden = {
        id: Date.now(),
        ...ordenData
    }
    setPedidos([nuevaOrden, ...pedidos])
    
    setCarrito([])
    setMostrarCheckout(false)

    // Mensaje formateado
    const mensajeEncoded = encodeURIComponent(
        `👋 Hola ImperioMate! Soy *${ordenData.cliente}*.\n` +
        `Acabo de realizar el PEDIDO WEB #${nuevaOrden.id}.\n\n` +
        `💰 *Total a Pagar: $${ordenData.total.toLocaleString()}*\n` +
        `💳 Forma de Pago: ${ordenData.metodoPago}\n` +
        `🚚 Entrega: ${ordenData.tipoEntrega} ${ordenData.envio ? `(${ordenData.envio})` : ''}\n\n` +
        `Espero confirmación para abonar. ¡Gracias!`
    )

    // AQUÍ ELEGIMOS A QUIÉN ENVIAR EL PEDIDO
    const telefonoDestino = ADMIN_SAN_JUAN 

    window.open(`https://wa.me/${telefonoDestino}?text=${mensajeEncoded}`, '_blank')

    toast.success('¡Pedido Enviado a WhatsApp! 📱', { duration: 5000, icon: '🚀' })
  }

  const confirmarPedidoAdmin = (idPedido) => {
    setPedidos(pedidos.map(p => p.id === idPedido ? { ...p, estado: 'PAGADO' } : p))
  }

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0)
  const totalPrecio = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
      
      {mostrarCheckout && (
        <CheckoutForm 
          carrito={carrito} 
          totalProductos={totalPrecio} 
          onConfirmar={crearOrdenPendiente} 
          onCancelar={() => setMostrarCheckout(false)} 
        />
      )}

      <div className="dashboard-container">
        <header className="header">
          <Link to="/" className="logo" style={{textDecoration: 'none'}}>IMPERIO<span>MATE</span></Link>
          
          <Link to="/admin" style={{color: '#a0a0a0', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #444', padding: '5px 10px', borderRadius: '4px'}}>
            ⚙️ ADMIN {pedidos.filter(p => p.estado === 'PENDIENTE').length > 0 && '🔴'}
          </Link>

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
          
          <Route path="/producto/:id" element={
             <ProductoDetalle 
                productos={productos} 
                agregarAlCarrito={agregarAlCarrito} 
             />
          } />

          <Route path="/carrito" element={
            <Carrito 
                carrito={carrito} 
                eliminarDelCarrito={eliminarDelCarrito} 
                finalizarCompra={() => setMostrarCheckout(true)} 
                modificarCantidad={modificarCantidad} 
            />
          } />

          <Route path="/admin" element={
            <AdminPanel 
                pedidos={pedidos} 
                confirmarPedidoAdmin={confirmarPedidoAdmin}
                crearProducto={crearProducto} // <--- SE PASA LA FUNCIÓN AQUÍ
            />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App