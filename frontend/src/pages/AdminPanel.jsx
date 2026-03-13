import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts'
import '../style/Admin.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 👇 Agregamos editarProductoAdmin a los props
export function Inventario({ pedidos, confirmarPedidoAdmin, crearProducto, reponerProductoAdmin, editarProductoAdmin }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  
  // Estado para guardar los logs
  const [logs, setLogs] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [vistaActiva, setVistaActiva] = useState('dashboard')

  // --- MODAL CREAR PRODUCTO ---
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '',
    categoria: '', 
    precio: '',
    stock: '',
    stockMinimo: 5,
    imagen: null
  })

  // --- MODAL REPONER STOCK ---
  const [mostrarModalReponer, setMostrarModalReponer] = useState(false)
  const [productoAReponer, setProductoAReponer] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState(1)

  // 👇 NUEVO: ESTADO PARA EDITAR PRODUCTO
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false)
  const [prodEditar, setProdEditar] = useState(null)

  // --- CATEGORIAS: crear ---
  const [nuevaCategoria, setNuevaCategoria] = useState('')

  // --- MODAL DETALLE DE PEDIDO ---
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false)
  const [pedidoDetalle, setPedidoDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const token = localStorage.getItem('adminToken')

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos`)
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setProductos([])
    }
  }

  const cargarCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categorias`)
      const data = await res.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setCategorias([])
    }
  }

  // Cargar Logs
  const cargarLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando logs:', err)
      setLogs([])
    }
  }

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
    cargarLogs() 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarModal, mostrarModalEditar, pedidos]) // 👈 Se refresca también al cerrar el modal de edición

  // ✅ Obtener Detalle de un Pedido 
  const verDetallePedidoAdmin = async (id) => {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setPedidoDetalle(data)
        setModalDetalleAbierto(true)
      } else {
        alert(data.message || 'No se pudo cargar el detalle del pedido')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión al cargar detalle')
    } finally {
      setCargandoDetalle(false)
    }
  }

  // ✅ eliminar pedido
  const eliminarPedidoAdmin = async (id) => {
    const ok = window.confirm(`¿Eliminar el pedido #${id}? Esta acción no se puede deshacer.`)
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        console.error('DELETE error:', data)
        alert(data?.message || 'Error al eliminar pedido')
        return
      }

      alert('✅ Pedido eliminado')
      window.location.reload()
    } catch (e) {
      console.error(e)
      alert('Error de conexión al eliminar')
    }
  }

  const handleInputChange = (e) => {
    setNuevoProd({ ...nuevoProd, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNuevoProd({ ...nuevoProd, imagen: e.target.files[0] })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!nuevoProd.categoria) {
      alert('Seleccioná una categoría')
      return
    }

    const formData = new FormData()
    formData.append('nombre', nuevoProd.nombre)
    formData.append('categoria', nuevoProd.categoria)
    formData.append('precio', nuevoProd.precio)
    formData.append('stock', nuevoProd.stock)
    formData.append('stockMinimo', nuevoProd.stockMinimo)

    if (nuevoProd.imagen) formData.append('imagen', nuevoProd.imagen)

    crearProducto(formData)
    setMostrarModal(false)
    setNuevoProd({ nombre: '', categoria: '', precio: '', stock: '', stockMinimo: 5, imagen: null })
  }

  // 👇 NUEVAS FUNCIONES PARA EDITAR
  const abrirEditar = (prod) => {
    setProdEditar({
      id: prod.id,
      nombre: prod.nombre,
      categoria: prod.categoria,
      precio: prod.precio,
      stock: prod.stock,
      stockMinimo: prod.stockMinimo || 5,
      imagen: null
    })
    setMostrarModalEditar(true)
  }

  const handleEditChange = (e) => setProdEditar({ ...prodEditar, [e.target.name]: e.target.value })
  const handleEditFileChange = (e) => { if (e.target.files && e.target.files[0]) setProdEditar({ ...prodEditar, imagen: e.target.files[0] }) }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('nombre', prodEditar.nombre)
    formData.append('categoria', prodEditar.categoria)
    formData.append('precio', prodEditar.precio)
    formData.append('stock', prodEditar.stock)
    formData.append('stockMinimo', prodEditar.stockMinimo)
    if (prodEditar.imagen) formData.append('imagen', prodEditar.imagen)
    
    const exito = await editarProductoAdmin(prodEditar.id, formData)
    if (exito) {
      setMostrarModalEditar(false)
      setProdEditar(null)
    }
  }

  const abrirReponer = (prod) => {
    setProductoAReponer(prod)
    setCantidadReponer(1)
    setMostrarModalReponer(true)
  }

  const confirmarReponer = async () => {
    if (!productoAReponer) return

    const cant = Number(cantidadReponer)
    if (!Number.isFinite(cant) || cant <= 0) {
      alert('Ingresá una cantidad válida (> 0)')
      return
    }

    try {
      if (typeof reponerProductoAdmin === 'function') {
        const actualizado = await reponerProductoAdmin(productoAReponer.id, cant)
        if (actualizado?.id) {
          setProductos(prev => prev.map(p => (p.id === actualizado.id ? { ...p, stock: actualizado.stock } : p)))
        } else {
          await cargarProductos()
        }
      } else {
        const res = await fetch(`${API_URL}/api/productos/${productoAReponer.id}/reponer`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ cantidad: cant })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.success) throw new Error(data?.message || 'No se pudo reponer')

        setProductos(prev => prev.map(p => (p.id === data.producto.id ? { ...p, stock: data.producto.stock } : p)))
      }

      setMostrarModalReponer(false)
      setProductoAReponer(null)
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error reponiendo stock')
    }
  }

  // ✅ ELIMINAR PRODUCTO
  const eliminarProductoAdmin = async (id) => {
    const ok = window.confirm('¿Eliminar este producto del catálogo?')
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/productos/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo eliminar')
      }

      setProductos(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error eliminando producto')
    }
  }

  // ✅ CREAR CATEGORIA
  const crearCategoria = async () => {
    const nombre = nuevaCategoria.trim()
    if (!nombre) return alert('Escribí un nombre de categoría')

    try {
      const res = await fetch(`${API_URL}/api/categorias`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre })
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        alert(data?.message || 'Error creando categoría')
        return
      }

      setNuevaCategoria('')
      await cargarCategorias()
      alert('✅ Categoría creada')
    } catch (e) {
      console.error(e)
      alert('Error de conexión creando categoría')
    }
  }

  // ✅ ELIMINAR CATEGORÍA
  const eliminarCategoria = async (id, nombreCategoria) => {
    const ok = window.confirm(`¿Seguro que quieres eliminar la categoría "${nombreCategoria}"? ¡Se borrarán TODOS los productos que le pertenezcan!`)
    if (!ok) return

    try {
      const res = await fetch(`${API_URL}/api/categorias/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No se pudo eliminar la categoría')
      }

      setCategorias(prev => prev.filter(c => c.id !== id))
      await cargarProductos()

      alert('✅ Categoría y productos asociados eliminados')
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Error eliminando la categoría')
    }
  }

  // --- DATOS PARA GRAFICOS ---
  const dataCategoriasGraf = productos.reduce((acc, curr) => {
    const cat = acc.find(item => item.name === curr.categoria)
    if (cat) cat.value += curr.stock
    else acc.push({ name: curr.categoria, value: curr.stock })
    return acc
  }, [])

  const COLORES_TORTA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  const dataVentas = useMemo(() => {
    const meses = []
    const hoy = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const nombreMes = d.toLocaleString('es-ES', { month: 'short' })
      meses.push({ name: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1), ventas: 0 })
    }

    pedidos.forEach(p => {
      if (p.estado === 'PAGADO') {
        meses[meses.length - 1].ventas += Number(p.total || 0)
      }
    })

    return meses
  }, [pedidos])

  const totalProductos = productos.length
  const sinStock = productos.filter(p => p.stock === 0).length
  const valorInventario = productos.reduce((acc, p) => acc + (Number(p.precio || 0) * Number(p.stock || 0)), 0)
  const totalVendidoHistorico = pedidos
    .filter(p => p.estado === 'PAGADO')
    .reduce((acc, p) => acc + Number(p.total || 0), 0)

  const productosFiltrados = productos.filter(prod =>
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const pedidosPendientes = pedidos.filter(p => p.estado === 'PENDIENTE')

  return (
    <div className="admin-wrapper">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>IMPERIO<span>MATE</span></h2>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-menu">
          <button className={`menu-item ${vistaActiva === 'dashboard' ? 'active' : ''}`} onClick={() => setVistaActiva('dashboard')}>
            📊 Dashboard
          </button>

          <button className={`menu-item ${vistaActiva === 'inventario' ? 'active' : ''}`} onClick={() => setVistaActiva('inventario')}>
            📦 Inventario
          </button>

          <button className={`menu-item ${vistaActiva === 'categorias' ? 'active' : ''}`} onClick={() => setVistaActiva('categorias')}>
            📁 Categorías
          </button>

          <button className={`menu-item ${vistaActiva === 'pedidos' ? 'active' : ''}`} onClick={() => setVistaActiva('pedidos')}>
            🛒 Pedidos {pedidosPendientes.length > 0 && <span className="badge-alert">{pedidosPendientes.length}</span>}
          </button>

          <button className={`menu-item ${vistaActiva === 'logs' ? 'active' : ''}`} onClick={() => { setVistaActiva('logs'); cargarLogs(); }}>
            📜 Historial
          </button>

          <div className="separator"></div>
          <Link to="/" className="menu-item logout">← Volver a Tienda</Link>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="admin-content">
        <header className="admin-topbar">
          <h2 className="welcome-text">Hola, Germán 👋</h2>
          <div className="topbar-actions">
            <input
              type="text"
              placeholder="🔍 Buscar..."
              className="topbar-search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="admin-profile">GP</div>
          </div>
        </header>

        {/* DASHBOARD */}
        {vistaActiva === 'dashboard' && (
          <>
            <section className="overview-cards">
              <div className="stat-card">
                <div className="stat-icon box">📦</div>
                <div className="stat-info">
                  <h3>{totalProductos}</h3>
                  <p>Productos</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon money">💰</div>
                <div className="stat-info">
                  <h3>${totalVendidoHistorico.toLocaleString()}</h3>
                  <p>Ventas Totales</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon chart">📈</div>
                <div className="stat-info">
                  <h3>${valorInventario.toLocaleString()}</h3>
                  <p>Valor Stock</p>
                </div>
              </div>
              <div className="stat-card alert">
                <div className="stat-icon warning">⚠️</div>
                <div className="stat-info">
                  <h3>{sinStock}</h3>
                  <p>Sin Stock</p>
                </div>
              </div>
            </section>

            <section className="charts-grid">
              <div className="chart-container" style={{ minWidth: 0 }}>
                <h3>📈 Ventas Mensuales</h3>
                <div style={{ width: '100%', height: 250, minWidth: 0 }}>
                  <ResponsiveContainer>
                    <AreaChart data={dataVentas}>
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => `$${Number(value || 0).toLocaleString()}`} />
                      <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentas)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container" style={{ minWidth: 0 }}>
                <h3>🍰 Distribución por Categoría</h3>
                <div style={{ width: '100%', height: 250, minWidth: 0 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={dataCategoriasGraf} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {dataCategoriasGraf.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        )}

        {/* INVENTARIO */}
        {vistaActiva === 'inventario' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>Inventario Detallado</h3>
              <button className="btn-add" onClick={() => setMostrarModal(true)}>+ Nuevo Producto</button>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Img</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        {prod.imagen ? (
                          <img
                            src={`${API_URL}${prod.imagen}`}
                            alt="mini"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                        ) : (
                          <span>📷</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{prod.nombre}</td>
                      <td>{prod.categoria}</td>
                      <td>${Number(prod.precio || 0).toLocaleString()}</td>
                      <td>{prod.stock}</td>
                      <td>
                        <span className={`status-badge ${prod.stock === 0 ? 'out' : prod.stock <= prod.stockMinimo ? 'low' : 'ok'}`}>
                          {prod.stock === 0 ? 'Agotado' : prod.stock <= prod.stockMinimo ? 'Bajo' : 'En Stock'}
                        </span>
                      </td>

                      <td style={{ display: 'flex', gap: 10 }}>
                        {/* 👇 EL NUEVO BOTON DE EDITAR */}
                        <button className="btn-add" style={{ background: '#f59e0b' }} onClick={() => abrirEditar(prod)}>
                          ✏️ Editar
                        </button>

                        <button className="btn-add" style={{ background: '#3b82f6' }} onClick={() => abrirReponer(prod)}>
                          ➕ Reponer
                        </button>

                        <button className="btn-add" style={{ background: '#ef4444' }} onClick={() => eliminarProductoAdmin(prod.id)}>
                          🗑 Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CATEGORIAS */}
        {vistaActiva === 'categorias' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>Categorías</h3>
            </div>

            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.length === 0 ? (
                    <tr><td colSpan="2" style={{ padding: 20, textAlign: 'center' }}>No hay categorías todavía</td></tr>
                  ) : (
                    categorias.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 'bold' }}>{c.nombre}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-add" 
                            style={{ background: '#ef4444', padding: '5px 10px', fontSize: '0.8rem' }} 
                            onClick={() => eliminarCategoria(c.id, c.nombre)}
                          >
                            🗑 Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 15, marginTop: 20 }}>
              <input
                type="text"
                placeholder="Nueva categoría..."
                className="topbar-search"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
              />
              <button className="btn-add" onClick={crearCategoria}>+ Agregar</button>
            </div>
          </section>
        )}

        {/* PEDIDOS */}
        {vistaActiva === 'pedidos' && (
          <section className="recent-orders">
            <h3>Lista de Pedidos</h3>
            <div className="table-responsive">
              <table className="clean-table">
                <thead><tr><th>Cliente</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead>
                <tbody>
                  {pedidos.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay pedidos</td></tr>
                  ) : (
                    pedidos.map(p => (
                      <tr key={p.id}>
                        <td>{p.cliente}</td>
                        <td>${Number(p.total || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${p.estado === 'PENDIENTE' ? 'low' : 'ok'}`}>
                            {p.estado}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          
                          <button 
                            className="btn-add" 
                            style={{ background: '#3b82f6' }} 
                            onClick={() => verDetallePedidoAdmin(p.id)}
                            disabled={cargandoDetalle}
                          >
                            👁️ Detalles
                          </button>

                          {p.estado === 'PENDIENTE' && (
                            <button className="btn-add" style={{ background: '#10b981' }} onClick={() => confirmarPedidoAdmin(p.id)}>
                              ✅ Confirmar
                            </button>
                          )}

                          <button className="btn-add" style={{ background: '#ef4444' }} onClick={() => eliminarPedidoAdmin(p.id)}>
                            🗑 Eliminar
                          </button>

                          {p.estado === 'PAGADO' && <span>✅</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* HISTORIAL DE LOGS */}
        {vistaActiva === 'logs' && (
          <section className="recent-orders">
            <div className="section-header">
              <h3>📜 Historial de Actividad</h3>
              <button className="btn-add" style={{ background: '#444' }} onClick={cargarLogs}>🔄 Actualizar</button>
            </div>
            <div className="table-responsive">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Usuario / Actor</th>
                    <th>Acción</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>No hay actividad registrada aún.</td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td style={{ color: '#aaa', fontSize: '0.9rem' }}>{new Date(log.creado_en).toLocaleString('es-AR')}</td>
                        <td style={{ fontWeight: 'bold', color: '#fff' }}>{log.usuario}</td>
                        <td>
                          <span style={{ background: '#222', color: '#c5a059', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid #444' }}>
                            {log.accion}
                          </span>
                        </td>
                        <td style={{ color: '#ccc', fontSize: '0.9rem' }}>{log.detalle}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>

      {/* MODAL CREAR PRODUCTO */}
      {mostrarModal && (
        <div className="checkout-overlay">
          <div className="checkout-card" style={{ maxWidth: '500px' }}>
            <h2 className="checkout-title">Nuevo Producto</h2>
            <form onSubmit={handleSubmit}>

              <div className="form-group" style={{ border: '1px dashed #444', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                <label className="form-label">📸 Imagen del Producto</label>
                <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input type="text" name="nombre" required className="form-input" onChange={handleInputChange} value={nuevoProd.nombre} />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  name="categoria"
                  className="form-input"
                  onChange={handleInputChange}
                  value={nuevoProd.categoria}
                  required
                >
                  <option value="" disabled>Seleccionar categoría...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Precio ($)</label>
                  <input type="number" name="precio" required className="form-input" onChange={handleInputChange} value={nuevoProd.precio} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Inicial</label>
                  <input type="number" name="stock" required className="form-input" onChange={handleInputChange} value={nuevoProd.stock} />
                </div>
              </div>

              <button type="submit" className="btn-whatsapp">Guardar Producto 💾</button>
              <button type="button" className="btn-cancel" onClick={() => setMostrarModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* 👇 NUEVO MODAL: EDITAR PRODUCTO */}
      {mostrarModalEditar && prodEditar && (
        <div className="checkout-overlay">
          <div className="checkout-card" style={{ maxWidth: '500px' }}>
            <h2 className="checkout-title" style={{color: '#f59e0b'}}>Editar Producto</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group" style={{ border: '1px dashed #f59e0b', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                <label className="form-label">📸 Cambiar Imagen (Opcional)</label>
                <input type="file" accept="image/*" className="form-input" onChange={handleEditFileChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input type="text" name="nombre" required className="form-input" onChange={handleEditChange} value={prodEditar.nombre} />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select name="categoria" className="form-input" onChange={handleEditChange} value={prodEditar.categoria} required>
                  <option value="" disabled>Seleccionar categoría...</option>
                  {categorias.map(c => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Precio ($)</label>
                  <input type="number" name="precio" required className="form-input" onChange={handleEditChange} value={prodEditar.precio} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Real</label>
                  <input type="number" name="stock" required className="form-input" onChange={handleEditChange} value={prodEditar.stock} />
                </div>
              </div>

              <button type="submit" className="btn-whatsapp" style={{background: '#f59e0b'}}>Guardar Cambios 💾</button>
              <button type="button" className="btn-cancel" onClick={() => setMostrarModalEditar(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPONER STOCK */}
      {mostrarModalReponer && (
        <div className="checkout-overlay">
          <div className="checkout-card" style={{ maxWidth: '420px' }}>
            <h2 className="checkout-title">Reponer Stock</h2>

            <p style={{ color: '#a0a0a0', marginTop: 0 }}>
              Producto: <b style={{ color: '#fff' }}>{productoAReponer?.nombre}</b>
            </p>

            <div className="form-group">
              <label className="form-label">Cantidad a agregar</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={cantidadReponer}
                onChange={(e) => setCantidadReponer(e.target.value)}
              />
            </div>

            <button type="button" className="btn-whatsapp" onClick={confirmarReponer}>
              ➕ Reponer
            </button>
            <button type="button" className="btn-cancel" onClick={() => setMostrarModalReponer(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE PEDIDO PARA EL ADMIN */}
      {modalDetalleAbierto && pedidoDetalle && (
        <div className="checkout-overlay" style={{ zIndex: 9999 }}>
          <div className="checkout-card" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #c5a059' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              <h2 className="checkout-title" style={{ margin: 0, color: '#c5a059' }}>Detalle de Orden #{pedidoDetalle.id}</h2>
              <button onClick={() => setModalDetalleAbierto(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px', color: '#ddd', fontSize: '0.9rem' }}>
              <p style={{ margin: '5px 0' }}><strong>Cliente:</strong> {pedidoDetalle.clienteNombre || 'No registrado'}</p>
              <p style={{ margin: '5px 0' }}><strong>Teléfono:</strong> {pedidoDetalle.clienteTelefono || 'No especificado'}</p>
              <p style={{ margin: '5px 0' }}><strong>Dirección:</strong> {pedidoDetalle.clienteDireccion || 'No especificada'}</p>
              <p style={{ margin: '5px 0' }}><strong>Estado actual:</strong> <span style={{ color: pedidoDetalle.estado === 'PAGADO' ? '#10b981' : '#f59e0b' }}>{pedidoDetalle.estado}</span></p>
              <p style={{ margin: '5px 0' }}><strong>Fecha:</strong> {new Date(pedidoDetalle.creado_en).toLocaleString()}</p>
            </div>

            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', color: '#aaa', fontSize: '1.1rem' }}>Productos a preparar:</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
              {pedidoDetalle.items?.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222', color: '#fff' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#c5a059', marginRight: '8px' }}>{item.cantidad}x</span> 
                    {item.nombre}
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    ${Number(item.subtotal).toLocaleString('es-AR')}
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #444' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>TOTAL COBRADO</h3>
              <h3 style={{ margin: 0, color: '#10b981' }}>${Number(pedidoDetalle.total).toLocaleString('es-AR')}</h3>
            </div>

            <button onClick={() => setModalDetalleAbierto(false)} className="btn-cancel" style={{ width: '100%', marginTop: '25px' }}>
              Cerrar Vista
            </button>
          </div>
        </div>
      )}

    </div>
  )
}