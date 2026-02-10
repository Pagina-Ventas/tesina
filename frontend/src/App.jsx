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
    cargarPedidos()
  }, [])

  const cargarProductos = () => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }

  const cargarPedidos = () => {
      fetch('/api/pedidos')
        .then(res => res.json())
        .then(data => setPedidos(data))
        .catch(err => console.error(err))
    }

  // 1. CREAR PRODUCTO (Versión conectada al Backend)
  const crearProducto = async (nuevoProducto) => {
    try {
      // Enviamos la orden al servidor
      const respuesta = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto)
      })

      if (respuesta.ok) {
        const data = await respuesta.json()
        // Agregamos a la lista el producto que devolvió el servidor (que ya tiene ID real)
        setProductos([...productos, data.producto])
        toast.success('Producto guardado en el servidor 💾')
      } else {
        toast.error('El servidor rechazó el producto')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión con el Backend')
    }
  }

// --- FUNCIÓN ACTUALIZADA: CONFIRMAR PEDIDO (PUT + RESTAR STOCK) ---
  const confirmarPedidoAdmin = async (idPedido) => {
    const pedido = pedidos.find(p => p.id === idPedido)
    if (!pedido) return

    const toastId = toast.loading('Procesando pago y stock...')

    try {
      // 1. Restar Stock (Ya lo tenías, lo mantenemos)
      for (const item of pedido.items) {
        await fetch(`/api/vender/${item.id}/${item.cantidad}`)
      }

      // 2. NUEVO: Actualizar estado del pedido en el Backend (PUT)
      await fetch(`/api/pedidos/${idPedido}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'PAGADO' })
      })

      // 3. Actualizar vista local y recargar productos
      setPedidos(pedidos.map(p => p.id === idPedido ? { ...p, estado: 'PAGADO' } : p))
      cargarProductos() 

      toast.success('¡Pedido confirmado y Stock actualizado! 🚀', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Error al procesar el pedido', { id: toastId })
    }
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

 // --- FUNCIÓN ACTUALIZADA: CREAR PEDIDO (POST AL BACKEND) ---
  const crearOrdenPendiente = async (ordenData) => {
    const nuevaOrden = {
        id: Date.now(),
        items: carrito,
        ...ordenData,
        estado: 'PENDIENTE' // Aseguramos que tenga estado inicial
    }

    try {
        // 1. Guardar en Backend
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaOrden)
        })

        if (respuesta.ok) {
            // 2. Actualizar vista local
            setPedidos([nuevaOrden, ...pedidos])
            setCarrito([])
            setMostrarCheckout(false)

            // 3. Enviar a WhatsApp
            const mensajeEncoded = encodeURIComponent(
                `👋 Hola ImperioMate! Soy *${ordenData.cliente}*.\n` +
                `Acabo de realizar el PEDIDO WEB #${nuevaOrden.id}.\n\n` +
                `💰 *Total a Pagar: $${ordenData.total.toLocaleString()}*\n` +
                `💳 Forma de Pago: ${ordenData.metodoPago}\n` +
                `🚚 Entrega: ${ordenData.tipoEntrega} ${ordenData.envio ? `(${ordenData.envio})` : ''}\n\n` +
                `Espero confirmación para abonar. ¡Gracias!`
            )
            const telefonoDestino = ADMIN_SAN_JUAN 
            window.open(`https://wa.me/${telefonoDestino}?text=${mensajeEncoded}`, '_blank')
            
            toast.success('¡Pedido guardado y enviado a WhatsApp! 📱')
        }
    } catch (error) {
        console.error(error)
        toast.error('Error al guardar el pedido')
    }
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
                crearProducto={crearProducto} 
            />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App