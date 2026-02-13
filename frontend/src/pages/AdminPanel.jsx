import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts'
import '../style/Admin.css'

// Recibimos 'crearProducto' y 'pedidos' desde App.jsx
export function Inventario({ pedidos, confirmarPedidoAdmin, crearProducto }) {
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

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }, [mostrarModal, pedidos]) 

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

      if (nuevoProd.imagen) {
          formData.append('imagen', nuevoProd.imagen)
      }

      crearProducto(formData)
      setMostrarModal(false)
      setNuevoProd({ nombre: '', categoria: 'Termos', precio: '', stock: '', stockMinimo: 5, imagen: null })
  }

  // --- 1. DATOS REALES PARA EL GRÁFICO DE TORTA ---
  const dataCategorias = productos.reduce((acc, curr) => {
    const cat = acc.find(item => item.name === curr.categoria)
    if (cat) {
      cat.value += curr.stock
    } else {
      acc.push({ name: curr.categoria, value: curr.stock })
    }
    return acc
  }, [])

  const COLORES_TORTA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  // --- 2. DATOS REALES PARA EL GRÁFICO DE VENTAS (NUEVO 🧠) ---
  const dataVentas = useMemo(() => {
    // A. Generamos los últimos 6 meses (vacíos al principio)
    const meses = []
    const hoy = new Date()
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const nombreMes = d.toLocaleString('es-ES', { month: 'short' }) // 'ene', 'feb'
        // Guardamos el nombre bonito (Mayúscula inicial) y el índice para comparar
        meses.push({ 
            name: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1), 
            ventas: 0, 
            anio: d.getFullYear(),
            mesIndex: d.getMonth() 
        })
    }

    // B. Recorremos los pedidos y sumamos si están PAGADOS
    pedidos.forEach(p => {
        if (p.estado === 'PAGADO') {
            const fechaPedido = new Date(p.id) // El ID es el timestamp
            const mesP = fechaPedido.getMonth()
            const anioP = fechaPedido.getFullYear()

            // Buscamos si el pedido cae en alguno de los 6 meses del gráfico
            const mesEncontrado = meses.find(m => m.mesIndex === mesP && m.anio === anioP)
            if (mesEncontrado) {
                mesEncontrado.ventas += p.total
            }
        }
    })

    return meses
  }, [pedidos]) // Se recalcula cada vez que cambian los pedidos

  // Cálculos generales
  const totalProductos = productos.length
  const totalStock = productos.reduce((acc, p) => acc + p.stock, 0)
  const sinStock = productos.filter(p => p.stock === 0).length
  // Valor de inventario (Precio * Stock)
  const valorInventario = productos.reduce((acc, p) => acc + (p.precio * p.stock), 0)
  // Total Vendido (Histórico de pedidos pagados)
  const totalVendidoHistorico = pedidos
    .filter(p => p.estado === 'PAGADO')
    .reduce((acc, p) => acc + p.total, 0)

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
                  {/* Mostramos el total vendido histórico */}
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
                <h3>📈 Ventas Mensuales (Reales)</h3>
                <div style={{ width: '100%', height: 250, minWidth: 0 }}>
                  <ResponsiveContainer>
                    <AreaChart data={dataVentas}>
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
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
                      <span className="dot" style={{background: COLORES_TORTA[index % COLORES_TORTA.length]}}></span>
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
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map(prod => (
                      <tr key={prod.id}>
                        <td>
                            {prod.imagen ? (
                                <img src={`http://localhost:3000${prod.imagen}`} alt="mini" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px'}} />
                            ) : (
                                <span>📷</span>
                            )}
                        </td>
                        <td style={{fontWeight: 'bold'}}>{prod.nombre}</td>
                        <td>{prod.categoria}</td>
                        <td>${prod.precio.toLocaleString()}</td>
                        <td>{prod.stock}</td>
                        <td>
                          <span className={`status-badge ${prod.stock === 0 ? 'out' : prod.stock <= prod.stockMinimo ? 'low' : 'ok'}`}>
                            {prod.stock === 0 ? 'Agotado' : prod.stock <= prod.stockMinimo ? 'Bajo' : 'En Stock'}
                          </span>
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
                                <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No hay pedidos pendientes</td></tr>
                            ) : (
                                pedidos.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.cliente}</td>
                                        <td>${p.total.toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${p.estado === 'PENDIENTE' ? 'low' : 'ok'}`}>
                                                {p.estado}
                                            </span>
                                        </td>
                                        <td>
                                            {p.estado === 'PENDIENTE' && (
                                                <button className="btn-add" style={{background:'#10b981'}} onClick={() => confirmarPedidoAdmin(p.id)}>
                                                    ✅ Confirmar
                                                </button>
                                            )}
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
              <div className="checkout-card" style={{maxWidth: '500px'}}>
                  <h2 className="checkout-title">Nuevo Producto</h2>
                  <form onSubmit={handleSubmit}>
                      
                      <div className="form-group" style={{border: '1px dashed #444', padding: '10px', borderRadius: '8px', marginBottom:'15px'}}>
                          <label className="form-label">📸 Imagen del Producto</label>
                          <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} />
                      </div>

                      <div className="form-group">
                          <label className="form-label">Nombre del Producto</label>
                          <input type="text" name="nombre" required className="form-input" onChange={handleInputChange} value={nuevoProd.nombre}/>
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
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                        <div className="form-group">
                            <label className="form-label">Precio ($)</label>
                            <input type="number" name="precio" required className="form-input" onChange={handleInputChange} value={nuevoProd.precio}/>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stock Inicial</label>
                            <input type="number" name="stock" required className="form-input" onChange={handleInputChange} value={nuevoProd.stock}/>
                        </div>
                      </div>
                      <button type="submit" className="btn-whatsapp">Guardar Producto 💾</button>
                      <button type="button" className="btn-cancel" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  </form>
              </div>
          </div>
      )}

    </div>
  )
}