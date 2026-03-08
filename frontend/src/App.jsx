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
import { Exito } from './pages/Exito'

// --- IMPORTACIONES DE ESTILOS ---
import './style/App.css'
import './style/Admin.css'

// CORRECCIÓN: Definimos la URL base de la API para que funcione en local y en producción
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('adminToken')
  return token ? children : <Login />
}

// ✅ Normaliza pedidos para que SIEMPRE usen el ID real (MySQL)
const normalizarPedidos = (arr) => {
  if (!Array.isArray(arr)) return []
  return arr.map((p) => {
    const pid = p.pedidoId ?? p.id
    return { ...p, pedidoId: pid, id: pid }
  })
}

function App() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos')
  const [mostrarCheckout, setMostrarCheckout] = useState(false)

  const ADMIN_SAN_JUAN = '5492644117588'

  useEffect(() => {
    cargarProductos()
    cargarPedidos()
  }, [])

  const cargarProductos = () => {
    fetch(`${API_URL}/api/productos`)
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }

  const cargarPedidos = () => {
    // CORRECCIÓN: Solo intentamos cargar si hay un token de admin, para evitar el error 403 innecesario
    const token = localStorage.getItem('adminToken')
    if (!token) return

    fetch(`${API_URL}/api/pedidos`, {
      headers: { 'Authorization': `Bearer ${token}` } // 🔒 Enviamos el token
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPedidos(normalizarPedidos(data))
        }
      })
      .catch(err => console.error(err))
  }

  const crearProducto = async (productoFormData) => {
    const token = localStorage.getItem('adminToken')
    try {
      const respuesta = await fetch(`${API_URL}/api/productos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // 🔒 Enviamos el token
        body: productoFormData
      })

      if (respuesta.ok) {
        const data = await respuesta.json()
        setProductos([...productos, data.producto])
        toast.success('Producto con foto guardado 📸')
      } else {
        const errorData = await respuesta.json()
        toast.error(`Error: ${errorData.message || 'No se pudo subir'}`)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión o archivo muy pesado')
    }
  }

  // ✅ Reponer stock (Admin)
  const reponerProductoAdmin = async (idProducto, cantidad) => {
    const token = localStorage.getItem('adminToken')
    const id = Number(idProducto)
    const cant = Number(cantidad)

    if (!Number.isFinite(id) || id <= 0) {
      toast.error('ID de producto inválido')
      return null
    }
    if (!Number.isFinite(cant) || cant <= 0) {
      toast.error('Cantidad inválida (debe ser > 0)')
      return null
    }

    const toastId = toast.loading('Reponiendo stock...')

    try {
      const res = await fetch(`${API_URL}/api/productos/${id}/reponer`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔒 Enviamos el token
        },
        body: JSON.stringify({ cantidad: cant })
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'No se pudo reponer stock', { id: toastId })
        return null
      }

      setProductos(prev =>
        prev.map(p => (p.id === data.producto.id ? { ...p, stock: data.producto.stock } : p))
      )

      toast.success('Stock repuesto ✅', { id: toastId })
      return data.producto
    } catch (e) {
      console.error(e)
      toast.error('Error reponiendo stock', { id: toastId })
      return null
    }
  }

  // ✅ Confirmar pedido (admin)
  const confirmarPedidoAdmin = async (idPedido) => {
    const token = localStorage.getItem('adminToken')
    const pid = Number(idPedido)
    const pedido = pedidos.find(p => (p.pedidoId ?? p.id) === pid)
    if (!pedido) return toast.error('Pedido no encontrado')

    const toastId = toast.loading('Procesando pago y stock...')

    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos/${pid}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔒 Enviamos el token
        },
        body: JSON.stringify({ estado: 'PAGADO' })
      })

      const data = await respuesta.json().catch(() => ({}))

      if (respuesta.ok) {
        setPedidos(pedidos.map(p =>
          (p.pedidoId ?? p.id) === pid ? { ...p, estado: 'PAGADO' } : p
        ))
        cargarProductos()
        toast.success('¡Pedido confirmado y Stock actualizado! 🚀', { id: toastId })
      } else {
        toast.error(data?.message || data?.error || 'Error al confirmar pedido', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al procesar el pedido', { id: toastId })
    }
  }

  // ✅ Eliminar pedido (admin)
  const eliminarPedidoAdmin = async (idPedido) => {
    const token = localStorage.getItem('adminToken')
    const pid = Number(idPedido)
    const toastId = toast.loading('Eliminando pedido...')

    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos/${pid}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } // 🔒 Enviamos el token
      })

      const data = await respuesta.json().catch(() => ({}))

      if (respuesta.ok) {
        setPedidos(prev => prev.filter(p => (p.pedidoId ?? p.id) !== pid))
        toast.success('Pedido eliminado 🗑️', { id: toastId })
      } else {
        toast.error(data?.message || data?.error || 'Pedido no encontrado', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Error eliminando pedido', { id: toastId })
    }
  }

  const agregarAlCarrito = (producto) => {
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
      setCarrito(carrito.map(item =>
        item.id === producto.id ? { ...existe, cantidad: existe.cantidad + 1 } : item
      ))
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }])
    }

    toast.success(`¡${producto.nombre} agregado!`, {
      style: { background: '#1e1e1e', border: '1px solid #c5a059', color: '#fff' }
    })
  }

  const modificarCantidad = (id, cantidad) => {
    setCarrito(carrito.map(item =>
      item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + cantidad) } : item
    ))
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id))
    toast.error('Producto eliminado', {
      style: { background: '#1e1e1e', border: '1px solid #d32f2f', color: '#fff' }
    })
  }

  const crearOrdenPendiente = async (ordenData, esMercadoPago = false) => {
    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenData)
      })

      const data = await respuesta.json().catch(() => ({}))

      if (!respuesta.ok || !data?.success) {
        toast.error(data?.message || data?.error || 'Error al guardar el pedido')
        return null
      }

      const pedidoDB = {
        ...data.pedido,
        pedidoId: data.pedido.id,
        id: data.pedido.id
      }

      setPedidos(prev => [pedidoDB, ...prev.filter(p => (p.pedidoId ?? p.id) !== pedidoDB.id)])

      if (!esMercadoPago) {
        setCarrito([])
        setMostrarCheckout(false)

        const mensajeEncoded = encodeURIComponent(
          `👋 Hola ImperioMate! Soy *${ordenData.cliente}*.\n` +
          `Acabo de realizar el PEDIDO WEB #${pedidoDB.id}.\n\n` +
          `💰 *Total a Pagar: $${Number(pedidoDB.total || ordenData.total || 0).toLocaleString()}*\n` +
          `💳 Forma de Pago: ${ordenData.metodoPago}\n` +
          `🚚 Entrega: ${ordenData.tipoEntrega} ${ordenData.envio ? `(${ordenData.envio})` : ''}\n\n` +
          `Espero confirmación para abonar. ¡Gracias!`
        )

        window.open(`https://wa.me/${ADMIN_SAN_JUAN}?text=${mensajeEncoded}`, '_blank')

        toast.success('¡Pedido guardado y enviado a WhatsApp! 📱')
      }

      return pedidoDB

    } catch (error) {
      console.error(error)
      toast.error('Error al guardar el pedido')
      return null
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
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            APOLO<span>MATE</span>
          </Link>

          <Link
            to="/admin"
            style={{
              color: '#a0a0a0',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            👤 LOGIN {pedidos.filter(p => p.estado === 'PENDIENTE').length > 0 && <span style={{ color: '#ff4444' }}>•</span>}
          </Link>

          <input type="text" placeholder="Buscar..." className="search-bar" />

          <Link to="/carrito" style={{ textDecoration: 'none' }}>
            <div
              style={{
                color: '#c5a059',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}
            >
              <span>🛒 TU MATE</span>
              <span
                style={{
                  background: '#c5a059',
                  color: '#000',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.9rem'
                }}
              >
                {totalItems}
              </span>
            </div>
          </Link>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <Tienda
                productos={productos}
                agregarAlCarrito={agregarAlCarrito}
                categorias={categorias}
                categoriaSeleccionada={categoriaSeleccionada}
                setCategoriaSeleccionada={setCategoriaSeleccionada}
              />
            }
          />

          <Route
            path="/producto/:id"
            element={
              <ProductoDetalle
                productos={productos}
                agregarAlCarrito={agregarAlCarrito}
              />
            }
          />

          <Route
            path="/carrito"
            element={
              <Carrito
                carrito={carrito}
                eliminarDelCarrito={eliminarDelCarrito}
                finalizarCompra={() => setMostrarCheckout(true)}
                modificarCantidad={modificarCantidad}
              />
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/perfil" element={<PerfilUsuario />} />
          <Route path="/exito" element={<Exito vaciarCarrito={() => setCarrito([])} />} />

          <Route
            path="/admin"
            element={
              <RutaProtegida>
                <AdminPanel
                  pedidos={pedidos}
                  confirmarPedidoAdmin={confirmarPedidoAdmin}
                  eliminarPedidoAdmin={eliminarPedidoAdmin}
                  crearProducto={crearProducto}
                  reponerProductoAdmin={reponerProductoAdmin}
                />
              </RutaProtegida>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App