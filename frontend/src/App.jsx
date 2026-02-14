import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Toaster, toast } from 'sonner'

// --- IMPORTACIONES ORDENADAS ---
import { Tienda } from './pages/Tienda'
import { Carrito } from './pages/Carrito'
import { Inventario as AdminPanel } from './pages/AdminPanel' 
import { ProductoDetalle } from './pages/ProductoDetalle'
import { Login } from './pages/Login'
import { PerfilUsuario } from './pages/PerfilUsuario'
import { CheckoutForm } from './components/CheckoutForm'

// --- IMPORTACIONES DE ESTILOS ---
import './style/App.css'
import './style/Admin.css' 

// Componente de Seguridad
const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('adminToken')
  return token ? children : <Login />
}

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

  // 1. CREAR PRODUCTO (Versión con IMAGEN / FormData)
  const crearProducto = async (productoFormData) => {
    try {
      const respuesta = await fetch('/api/productos', {
        method: 'POST',
        body: productoFormData 
      })

      if (respuesta.ok) {
        const data = await respuesta.json()
        setProductos([...productos, data.producto])
        toast.success('Producto con foto guardado 📸')
      } else {
        // 👇 AQUI LEEMOS EL MENSAJE DE ERROR DEL SERVIDOR
        const errorData = await respuesta.json()
        toast.error(`Error: ${errorData.message || 'No se pudo subir'}`)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión o archivo muy pesado')
    }
  }

  // 2. CONFIRMAR PEDIDO (CORREGIDO)
  const confirmarPedidoAdmin = async (idPedido) => {
    const pedido = pedidos.find(p => p.id === idPedido)
    if (!pedido) return

    const toastId = toast.loading('Procesando pago y stock...')

    try {
      // ❌ BORRAMOS EL BUCLE "for (const item of pedido.items)..." QUE ESTABA AQUÍ
      // El backend ahora se encarga de todo.

      // Solo enviamos la orden de cambio de estado
      const respuesta = await fetch(`/api/pedidos/${idPedido}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'PAGADO' })
      })

      if (respuesta.ok) {
        setPedidos(pedidos.map(p => p.id === idPedido ? { ...p, estado: 'PAGADO' } : p))
        cargarProductos() // Recargamos para ver el stock nuevo en la tabla
        toast.success('¡Pedido confirmado y Stock actualizado! 🚀', { id: toastId })
      } else {
        toast.error('Error al confirmar pedido', { id: toastId })
      }

    } catch (error) {
      console.error(error)
      toast.error('Error al procesar el pedido', { id: toastId })
    }
  }

  // 3. AGREGAR AL CARRITO (BLINDADO)
  const agregarAlCarrito = (producto) => {
    
    // 1. Verificamos si hay sesión iniciada
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
    
    if (!token) {
      toast.error('🔒 Debes iniciar sesión para comprar', {
        description: 'Redirigiendo al login...',
        duration: 2000
      })
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return 
    }

    // 2. Si es cliente, verificamos datos
    const usuarioData = localStorage.getItem('usuarioData')
    if (token && !localStorage.getItem('adminToken') && usuarioData) {
        const user = JSON.parse(usuarioData)
        if (!user.nombre || !user.direccion) {
            toast.warning('⚠️ Por favor completa tus datos de envío antes de comprar')
            setTimeout(() => window.location.href = '/perfil', 1500)
            return
        }
    }

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

  // 4. CREAR PEDIDO
  const crearOrdenPendiente = async (ordenData) => {
    const nuevaOrden = {
        id: Date.now(),
        items: carrito,
        ...ordenData,
        estado: 'PENDIENTE'
    }

    try {
        const respuesta = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaOrden)
        })

        if (respuesta.ok) {
            setPedidos([nuevaOrden, ...pedidos])
            setCarrito([])
            setMostrarCheckout(false)

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
  const categorias = Array.isArray(productos) 
    ? ['Todos', ...new Set(productos.map(p => p.categoria))] 
    : ['Todos']

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
          
          <Link to="/admin" style={{color: '#a0a0a0', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
            👤 LOGIN {pedidos.filter(p => p.estado === 'PENDIENTE').length > 0 && <span style={{color: '#ff4444'}}>•</span>}
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

          <Route path="/login" element={<Login />} />

          <Route path="/perfil" element={<PerfilUsuario />} />

          <Route path="/admin" element={
            <RutaProtegida>
                <AdminPanel 
                    pedidos={pedidos} 
                    confirmarPedidoAdmin={confirmarPedidoAdmin}
                    crearProducto={crearProducto} 
                />
            </RutaProtegida>
          } />

        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App