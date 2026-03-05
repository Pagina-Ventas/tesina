import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts'
import '../style/Admin.css'

// ✅ Ahora recibe también: reponerProductoAdmin (desde App.jsx)
export function Inventario({ pedidos, confirmarPedidoAdmin, crearProducto, reponerProductoAdmin }) {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [vistaActiva, setVistaActiva] = useState('dashboard')

  // --- ESTADO PARA EL MODAL DE CREAR PRODUCTO ---
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '',
    categoria: 'Termos',
    precio: '',
    stock: '',
    stockMinimo: 5,
    imagen: null
  })

  // ✅ MODAL REPONER STOCK
  const [mostrarModalReponer, setMostrarModalReponer] = useState(false)
  const [productoAReponer, setProductoAReponer] = useState(null)
  const [cantidadReponer, setCantidadReponer] = useState(1)

  const cargarProductos = async () => {
    try {
      const res = await fetch('/api/productos')
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [mostrarModal, pedidos])

  // ✅ eliminar pedido (admin) (mantengo tu lógica)
  const eliminarPedidoAdmin = async (id) => {
    const ok = window.confirm(`¿Eliminar el pedido #${id}? Esta acción no se puede deshacer.`)
    if (!ok) return

    try {
      const res = await fetch(`http://localhost:3000/api/pedidos/${id}`, { method: 'DELETE' })
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
    const formData = new FormData()
    formData.append('nombre', nuevoProd.nombre)
    formData.append('categoria', nuevoProd.categoria)
    formData.append('precio', nuevoProd.precio)
    formData.append('stock', nuevoProd.stock)
    formData.append('stockMinimo', nuevoProd.stockMinimo)

    if (nuevoProd.imagen) formData.append('imagen', nuevoProd.imagen)

    crearProducto(formData)
    setMostrarModal(false)
    setNuevoProd({ nombre: '', categoria: 'Termos', precio: '', stock: '', stockMinimo: 5, imagen: null })
  }

  // ✅ Abrir modal reponer
  const abrirReponer = (prod) => {
    setProductoAReponer(prod)
    setCantidadReponer(1)
    setMostrarModalReponer(true)
  }

  // ✅ Confirmar reponer (llama al backend /api/productos/:id/reponer)
  const confirmarReponer = async () => {
    if (!productoAReponer) return

    const cant = Number(cantidadReponer)
    if (!Number.isFinite(cant) || cant <= 0) {
      alert('Ingresá una cantidad válida (> 0)')
      return
    }

    try {
      // Si App.jsx te pasa la función, la usamos
      if (typeof reponerProductoAdmin === 'function') {
        const actualizado = await reponerProductoAdmin(productoAReponer.id, cant)
        if (actualizado?.id) {
          setProductos(prev => prev.map(p => (p.id === actualizado.id ? { ...p, stock: actualizado.stock } : p)))
        } else {
          await cargarProductos()
        }
      } else {
        // Fallback por si no pasaste prop todavía
        const res = await fetch(`/api/productos/${productoAReponer.id}/reponer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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

  // --- 1. DATOS REALES PARA EL GRÁFICO DE TORTA ---
  const dataCategorias = productos.reduce((acc, curr) => {
    const cat = acc.find(item => item.name === curr.categoria)
    if (cat) cat.value += curr.stock
    else acc.push({ name: curr.categoria, value: curr.stock })
    return acc
  }, [])

  const COLORES_TORTA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  // --- 2. DATOS REALES PARA EL GRÁFICO DE VENTAS ---
  const dataVentas = useMemo(() => {
    const meses = []
    const hoy = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const nombreMes = d.toLocaleString('es-ES', { month: 'short' })
      meses.push({
        name: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
        ventas: 0,
        anio: d.getFullYear(),
        mesIndex: d.getMonth()
      })
    }

    pedidos.forEach(p => {
      if (p.estado === 'PAGADO') {
        // ⚠️ OJO: esto era timestamp antes. Si no tenés created_at, no se puede mensual real.
        // Para no romper, lo sumo al mes actual:
        meses[meses.length - 1].ventas += Number(p.total || 0)
      }
    })

    return meses
  }, [pedidos])

  // Cálculos generales
  const totalProductos = productos.length
  const totalStock = productos.reduce((acc, p) => acc + p.stock, 0)
  const sinStock = productos.filter(p => p.stock === 0).length
  const valorInventario = productos.reduce((acc, p) => acc + (p.precio * p.stock), 0)
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
          <button className={`menu-item ${vistaActiva === 'dashboard' ? 'active' : ''}`} onClick={() => setVistaActiva('dashboard')}>📊 Dashboard</button>
          <button className={`menu-item ${vistaActiva === 'inventario' ? 'active' : ''}`} onClick={() => setVistaActiva('inventario')}>📦 Inventario</button>
          <button className={`menu-item ${vistaActiva === 'pedidos' ? 'active' : ''}`} onClick={() => setVistaActiva('pedidos')}>
            🛒 Pedidos {pedidosPendientes.length > 0 && <span className="badge-alert">{pedidosPendientes.length}</span>}
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

        {/* --- VISTA DASHBOARD --- */}
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
                      <Pie
                        data={dataCategorias}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataCategorias.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  {dataCategorias.map((entry, index) => (
                    <div key={index} className="legend-item">
                      <span className="dot" style={{ background: COLORES_TORTA[index % COLORES_TORTA.length] }}></span>
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* --- VISTA INVENTARIO --- */}
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
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        {prod.imagen ? (
                          <img
                            src={`http://localhost:3000${prod.imagen}`}
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

                      {/* ✅ BOTÓN REPONER */}
                      <td>
                        <button
                          className="btn-add"
                          style={{ background: '#3b82f6' }}
                          onClick={() => abrirReponer(prod)}
                        >
                          ➕ Reponer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* --- VISTA PEDIDOS --- */}
        {vistaActiva === 'pedidos' && (
          <section className="recent-orders">
            <h3>Pedidos Pendientes</h3>
            <div className="table-responsive">
              <table className="clean-table">
                <thead><tr><th>Cliente</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead>
                <tbody>
                  {pedidos.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay pedidos pendientes</td></tr>
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
                          {p.estado === 'PENDIENTE' && (
                            <button className="btn-add" style={{ background: '#10b981' }} onClick={() => confirmarPedidoAdmin(p.id)}>
                              ✅ Confirmar
                            </button>
                          )}

                          <button
                            className="btn-add"
                            style={{ background: '#ef4444' }}
                            onClick={() => eliminarPedidoAdmin(p.id)}
                          >
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

      </main>

      {/* --- MODAL CREAR PRODUCTO --- */}
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
                <select name="categoria" className="form-input" onChange={handleInputChange} value={nuevoProd.categoria}>
                  <option value="Termos">Termos</option>
                  <option value="Bombillas">Bombillas</option>
                  <option value="Kits">Kits</option>
                  <option value="Insumos">Insumos</option>
                  <option value="Bolsos">Bolsos</option>
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

      {/* --- MODAL REPONER STOCK --- */}
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

    </div>
  )
}