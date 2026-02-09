import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid 
} from 'recharts'
import './Admin.css'

export function Inventario() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error(err))
  }, [])

  // --- 1. DATOS REALES PARA EL GRÁFICO DE TORTA (Categorías) ---
  const dataCategorias = productos.reduce((acc, curr) => {
    const cat = acc.find(item => item.name === curr.categoria)
    if (cat) {
      cat.value += curr.stock
    } else {
      acc.push({ name: curr.categoria, value: curr.stock })
    }
    return acc
  }, [])

  // Colores para el gráfico de torta (Azul, Verde, Violeta, Naranja)
  const COLORES_TORTA = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']

  // --- 2. DATOS SIMULADOS PARA EL GRÁFICO DE LÍNEAS (Ventas Mensuales) ---
  // Como aún no tenemos historial real, usamos esto para la estética visual
  const dataVentas = [
    { name: 'Ene', ventas: 40000 },
    { name: 'Feb', ventas: 30000 },
    { name: 'Mar', ventas: 60000 },
    { name: 'Abr', ventas: 95000 },
    { name: 'May', ventas: 80000 },
    { name: 'Jun', ventas: 120000 },
  ]

  // Cálculos generales
  const totalProductos = productos.length
  const totalStock = productos.reduce((acc, p) => acc + p.stock, 0)
  const sinStock = productos.filter(p => p.stock === 0).length
  const valorInventario = productos.reduce((acc, p) => acc + (p.precio * p.stock), 0)

  const productosFiltrados = productos.filter(prod => 
    prod.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="admin-wrapper">
      
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <h2>IMPERIO<span>MATE</span></h2>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-menu">
          <a href="#" className="menu-item active">📊 Dashboard</a>
          <a href="#" className="menu-item">📦 Inventario</a>
          <a href="#" className="menu-item">🛒 Pedidos</a>
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

        {/* TARJETAS DE RESUMEN */}
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
              <h3>${valorInventario.toLocaleString()}</h3>
              <p>Valor Total</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon chart">📈</div>
            <div className="stat-info">
              <h3>{totalStock}</h3>
              <p>Unid. Stock</p>
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

        {/* --- SECCIÓN DE GRÁFICOS --- */}
        <section className="charts-grid">
          
          {/* Gráfico 1: Rendimiento de Ventas (Area Chart) */}
          <div className="chart-container">
            <h3>📈 Rendimiento de Ventas (Semestral)</h3>
            <div style={{ width: '100%', height: 250 }}>
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
                  <Tooltip />
                  <Area type="monotone" dataKey="ventas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Distribución de Stock (Pie Chart) */}
          <div className="chart-container">
            <h3>🍰 Distribución por Categoría</h3>
            <div style={{ width: '100%', height: 250 }}>
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
            {/* Leyenda manual pequeña */}
            <div className="chart-legend">
              {dataCategorias.map((entry, index) => (
                <div key={index} className="legend-item">
                  <span className="dot" style={{background: COLORES_TORTA[index % COLORES_TORTA.length]}}></span>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* TABLA DE PRODUCTOS */}
        <section className="recent-orders">
          <div className="section-header">
            <h3>Inventario Detallado</h3>
            <button className="btn-add">+ Nuevo</button>
          </div>
          <div className="table-responsive">
            <table className="clean-table">
              <thead>
                <tr>
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

      </main>
    </div>
  )
}