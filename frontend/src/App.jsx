import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { initMercadoPago } from '@mercadopago/sdk-react'

// --- IMPORTACIONES ORDENADAS ---
const Tienda = lazy(() =>
  import('./pages/Tienda').then(module => ({ default: module.Tienda }))
)

const Carrito = lazy(() =>
  import('./pages/Carrito').then(module => ({ default: module.Carrito }))
)

const AdminPanel = lazy(() =>
  import('./pages/AdminPanel').then(module => ({ default: module.Inventario }))
)

const ProductoDetalle = lazy(() =>
  import('./pages/ProductoDetalle').then(module => ({ default: module.ProductoDetalle }))
)

const Login = lazy(() =>
  import('./pages/Login').then(module => ({ default: module.Login }))
)

const PerfilUsuario = lazy(() =>
  import('./pages/PerfilUsuario').then(module => ({ default: module.PerfilUsuario }))
)

const CheckoutForm = lazy(() =>
  import('./components/Checkout/CheckoutForm').then(module => ({ default: module.CheckoutForm }))
)

const Exito = lazy(() =>
  import('./pages/Exito').then(module => ({ default: module.Exito }))
)

// --- IMPORTACIONES DE ESTILOS ---
import './style/base.css'
import './style/layout.css'

// --- IMPORTACIÓN DE COMPONENTES ---
import { BotonWhatsApp } from './components/BotonWhatsApp'
import Footer from './components/Footer'

// ✅ Inicializar Mercado Pago UNA sola vez
initMercadoPago('APP_USR-76524e58-7401-4687-acc5-ddb10e609cb9')

// ✅ URL base API
const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
}

const RutaProtegida = ({ children }) => {
  const token = localStorage.getItem('adminToken')
  return token ? children : <Login />
}

// ✅ Normaliza pedidos para que siempre usen el ID real
const normalizarPedidos = (arr) => {
  if (!Array.isArray(arr)) return []
  return arr.map((p) => {
    const pid = p.pedidoId ?? p.id
    return { ...p, pedidoId: pid, id: pid }
  })
}

function AppContenido() {
  const navigate = useNavigate()
  const location = useLocation()
  const esRutaAdmin = location.pathname.startsWith('/admin')

  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado = localStorage.getItem('carrito')
    return carritoGuardado ? JSON.parse(carritoGuardado) : []
  })
  const [pedidos, setPedidos] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarCheckout, setMostrarCheckout] = useState(false)

  useEffect(() => {
    cargarProductos()
    cargarPedidos()
  }, [])

  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(carrito))
  }, [carrito])

  useEffect(() => {
    const volverAlCheckout = localStorage.getItem('redirigirAlCheckout')

    if (
      volverAlCheckout === 'true' &&
      (localStorage.getItem('token') || localStorage.getItem('adminToken'))
    ) {
      setMostrarCheckout(true)
      localStorage.removeItem('redirigirAlCheckout')
      navigate('/carrito')
    }
  }, [navigate])

  // ✅ RECARGA PEDIDOS Y PRODUCTOS CADA VEZ QUE ENTRÁS AL ADMIN
  useEffect(() => {
    const token = localStorage.getItem('adminToken')

    if (location.pathname === '/admin' && token) {
      cargarPedidos()
      cargarProductos()
    }
  }, [location.pathname])

  const cargarProductos = () => {
    fetch(`${API_URL}/api/productos`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProductos(data)
        } else {
          console.error('El servidor no envió una lista de productos:', data)
          setProductos([])
        }
      })
      .catch(err => {
        console.error('Error de conexión con la API:', err)
        setProductos([])
      })
  }

  const cargarPedidos = () => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    fetch(`${API_URL}/api/pedidos`, {
      headers: { Authorization: `Bearer ${token}` }
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
        headers: { Authorization: `Bearer ${token}` },
        body: productoFormData
      })

      if (respuesta.ok) {
        const data = await respuesta.json()
        setProductos(prev => [...prev, data.producto])
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

  const editarProductoAdmin = async (idProducto, productoFormData) => {
    const token = localStorage.getItem('adminToken')
    const toastId = toast.loading('Guardando cambios...')

    try {
      const respuesta = await fetch(`${API_URL}/api/productos/${idProducto}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: productoFormData
      })

      const data = await respuesta.json().catch(() => ({}))

      if (respuesta.ok && data?.success) {
        setProductos(prev => prev.map(p => p.id === data.producto.id ? data.producto : p))
        toast.success('¡Producto actualizado correctamente! ✏️', { id: toastId })
        return true
      } else {
        toast.error(`Error: ${data?.message || 'No se pudo editar el producto'}`, { id: toastId })
        return false
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión', { id: toastId })
      return false
    }
  }

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
          Authorization: `Bearer ${token}`
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

  const confirmarPedidoAdmin = async (idPedido) => {
    const token = localStorage.getItem('adminToken')
    const pid = Number(idPedido)
    const pedido = pedidos.find(p => (p.pedidoId ?? p.id) === pid)

    if (!pedido) {
      toast.error('Pedido no encontrado')
      return
    }

    const toastId = toast.loading('Procesando pago y stock...')

    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos/${pid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'PAGADO' })
      })

      const data = await respuesta.json().catch(() => ({}))

      if (respuesta.ok) {
        setPedidos(prev => prev.map(p =>
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

  const eliminarPedidoAdmin = async (idPedido) => {
    const token = localStorage.getItem('adminToken')
    const pid = Number(idPedido)
    const toastId = toast.loading('Eliminando pedido...')

    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos/${pid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
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

  // ✅ AHORA SE PUEDE AGREGAR AL CARRITO SIN LOGIN
  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id)

    if (existe) {
      setCarrito(prev =>
        prev.map(item =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      )
    } else {
      setCarrito(prev => [...prev, { ...producto, cantidad: 1 }])
    }

    toast.success(`¡${producto.nombre} agregado!`, {
      style: { background: '#1e1e1e', border: '1px solid #c5a059', color: '#fff' }
    })
  }

  const modificarCantidad = (id, cantidad) => {
    setCarrito(prev =>
      prev.map(item =>
        item.id === id ? { ...item, cantidad: Math.max(1, item.cantidad + cantidad) } : item
      )
    )
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(prev => prev.filter(item => item.id !== id))
    toast.error('Producto eliminado', {
      style: { background: '#1e1e1e', border: '1px solid #d32f2f', color: '#fff' }
    })
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('usuarioData')
    navigate('/login', { replace: true })
  }

  // ✅ RECIÉN ACÁ EXIGE LOGIN
  const finalizarCompra = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken')

    if (!token) {
      localStorage.setItem('redirigirAlCheckout', 'true')

      toast.error('🔒 Debes iniciar sesión para finalizar la compra', {
        description: 'Te llevamos al login...',
        duration: 2000
      })

      setTimeout(() => {
        navigate('/login')
      }, 1200)

      return
    }

    setMostrarCheckout(true)
  }

  const crearOrdenPendiente = async (ordenData, esMercadoPago = false) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken')

      const respuesta = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
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
        localStorage.removeItem('carrito')
        setMostrarCheckout(false)

        const TELEFONO_ALEXIA = '5491169734096'

        const detalleProductos = ordenData.items
          .map(item => `• ${item.cantidad}x ${item.nombre} ($${(item.precio * item.cantidad).toLocaleString()})`)
          .join('\n')

        let infoEntrega = `🚚 *Tipo de Entrega:* ${ordenData.tipoEntrega} ${ordenData.envio && ordenData.envio !== '-' ? `(${ordenData.envio})` : ''}\n`

        if (ordenData.tipoEntrega === 'Envio') {
          infoEntrega += `📍 *Enviar a:* ${ordenData.direccion}\n`
        } else {
          infoEntrega += `📍 *Retirar en:* Nuestra sucursal (victoria 1215 sur)\n`
        }

        const mensajeEncoded = encodeURIComponent(
          `👋 Hola Alexia! Soy *${ordenData.cliente}*.\n` +
          `Acabo de realizar el PEDIDO WEB #${pedidoDB.id}.\n\n` +
          `🛍️ *Detalle de mi compra:*\n${detalleProductos}\n\n` +
          `💰 *Total a Pagar:* $${Number(pedidoDB.total || ordenData.total || 0).toLocaleString()}\n` +
          `💳 *Forma de Pago:* ${ordenData.metodoPago}\n\n` +
          `${infoEntrega}\n` +
          `📸 *Te adjunto a continuación mi comprobante de pago/transferencia.* ¡Muchas gracias!`
        )

        window.open(`https://wa.me/${TELEFONO_ALEXIA}?text=${mensajeEncoded}`, '_blank')
        toast.success('¡Pedido guardado y enviado a WhatsApp! 📱')
      }

      return pedidoDB
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar el pedido')
      return null
    }
  }

  const normalizarTexto = (texto) => {
    return (texto || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  const buscarPrimerProducto = (texto) => {
    const textoNormalizado = normalizarTexto(texto)
    if (!textoNormalizado) return null

    return productos.find((p) => {
      const contenido = normalizarTexto(`${p.nombre || ''} ${p.categoria || ''} ${p.descripcion || ''}`)
      return contenido.includes(textoNormalizado)
    })
  }

  const obtenerSugerencias = () => {
    const textoNormalizado = normalizarTexto(busqueda)
    if (!textoNormalizado) return []

    const empiezan = productos.filter((p) => {
      const nombre = normalizarTexto(p.nombre || '')
      return nombre.startsWith(textoNormalizado)
    })

    const contienen = productos.filter((p) => {
      const nombre = normalizarTexto(p.nombre || '')
      const categoria = normalizarTexto(p.categoria || '')
      const descripcion = normalizarTexto(p.descripcion || '')

      return (
        !nombre.startsWith(textoNormalizado) &&
        (
          nombre.includes(textoNormalizado) ||
          categoria.includes(textoNormalizado) ||
          descripcion.includes(textoNormalizado)
        )
      )
    })

    return [...empiezan, ...contienen].slice(0, 6)
  }

  const manejarCambioBusqueda = (e) => {
    const valor = e.target.value
    setBusqueda(valor)

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const catalogo = document.getElementById('catalogo')
        if (catalogo) {
          catalogo.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  const manejarEnterBusqueda = (e) => {
    if (e.key !== 'Enter') return

    const productoEncontrado = buscarPrimerProducto(busqueda)

    if (productoEncontrado) {
      navigate(`/producto/${productoEncontrado.id}`)
    } else {
      toast.error('No se encontró ningún producto con esa búsqueda')
    }
  }

  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0)
  const totalPrecio = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

  const categorias = Array.isArray(productos)
    ? ['Todos', ...new Set(productos.map(p => p.categoria))]
    : ['Todos']

  const sugerencias = obtenerSugerencias()

  return (
    <>
      <Toaster position="bottom-right" theme="dark" />

      <Suspense fallback={null}>
        {mostrarCheckout && (
      <CheckoutForm
        carrito={carrito}
        totalProductos={totalPrecio}
        onConfirmar={crearOrdenPendiente}
        onCancelar={() => setMostrarCheckout(false)}
      />
   )}
  </Suspense>

      <div className="dashboard-container">
        <header className="header">
          <Link to="/" className="logo-link">
            <span className="logo">
              APOLO<span>MATE</span>
            </span>

            <img
              src="/logo-apolo.png"
              alt="Logo Apolo"
              className="logo-img"
            />
          </Link>

          <div className="search-container" style={{ position: 'relative' }}>
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="search-bar"
              value={busqueda}
              onChange={manejarCambioBusqueda}
              onKeyDown={manejarEnterBusqueda}
              autoComplete="off"
            />

            {busqueda.trim() !== '' && sugerencias.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  width: '100%',
                  background: '#111',
                  border: '1px solid #c5a059',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  zIndex: 9999,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.35)'
                }}
              >
                {sugerencias.map((producto, index) => (
                  <button
                    key={producto.id}
                    type="button"
                    onClick={() => {
                      setBusqueda(producto.nombre)
                      navigate(`/producto/${producto.id}`)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: index !== sugerencias.length - 1
                        ? '1px solid rgba(255,255,255,0.08)'
                        : 'none'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{producto.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#c5a059', marginTop: '3px' }}>
                      {producto.categoria}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {(localStorage.getItem('token') || localStorage.getItem('adminToken')) ? (
              <>
                <Link
                  to="/perfil"
                  style={{
                    color: '#a0a0a0',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >
                  👤 MI PERFIL
                </Link>

                {localStorage.getItem('adminToken') && (
                  <Link
                    to="/admin"
                    style={{
                      color: '#c5a059',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    ⚙️ PANEL ADMIN {pedidos.filter(p => p.estado === 'PENDIENTE').length > 0 && <span style={{ color: '#ff4444' }}>•</span>}
                  </Link>
                )}

                <button
                  onClick={cerrarSesion}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  SALIR
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  color: '#a0a0a0',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                👤 INGRESAR
              </Link>
            )}

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
                <span>🛒</span>
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
          </div>
        </header>

        <Suspense
  fallback={
    <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
      Cargando...
    </div>
  }
>
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
          busqueda={busqueda}
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
          finalizarCompra={finalizarCompra}
          modificarCantidad={modificarCantidad}
        />
      }
    />

    <Route path="/login" element={<Login />} />
    <Route path="/perfil" element={<PerfilUsuario />} />

    <Route
      path="/exito"
      element={
        <Exito
          vaciarCarrito={() => {
            setCarrito([])
            localStorage.removeItem('carrito')
          }}
          recargarProductos={cargarProductos}
        />
      }
    />

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
            editarProductoAdmin={editarProductoAdmin}
          />
        </RutaProtegida>
      }
    />
  </Routes>
</Suspense>
      </div>

      {!esRutaAdmin && <Footer />}
      {!esRutaAdmin && <BotonWhatsApp />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContenido />
    </BrowserRouter>
  )
}

export default App