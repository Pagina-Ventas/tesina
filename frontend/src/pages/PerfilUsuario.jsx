import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import '../style/auth.css' 

export function PerfilUsuario() {
    const navigate = useNavigate()
    const [usuario, setUsuario] = useState(null)
    const [datos, setDatos] = useState({
        nombre: '', dni: '', telefono: '', provincia: '', ciudad: '', direccion: ''
    })

    const [pedidos, setPedidos] = useState([])
    const [cargandoPedidos, setCargandoPedidos] = useState(false)
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
    const [modalAbierto, setModalAbierto] = useState(false)

    useEffect(() => {
        window.scrollTo(0, 0); // Para que inicie arriba de todo
        const userStr = localStorage.getItem('usuarioData')
        if (userStr) {
            const userObj = JSON.parse(userStr)
            setUsuario(userObj)
            setDatos({
                nombre: userObj.nombre || '', dni: userObj.dni || '',
                telefono: userObj.telefono || '', provincia: userObj.provincia || '',
                ciudad: userObj.ciudad || '', direccion: userObj.direccion || ''
            })
            cargarMisPedidos()
        }
    }, [])

    const handleChange = (e) => setDatos({ ...datos, [e.target.name]: e.target.value })

    const guardarDatos = async (e) => {
        e.preventDefault()
        if (!usuario) return
        const toastId = toast.loading('Guardando tus datos...')
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usuario.username, datos })
            })
            const data = await res.json()
            if (data.success) {
                localStorage.setItem('usuarioData', JSON.stringify(data.user))
                toast.success('¡Datos actualizados correctamente! 💾', { id: toastId })
            } else {
                toast.error('Error al guardar datos', { id: toastId })
            }
        } catch (error) {
            toast.error('Error de conexión', { id: toastId })
        }
    }

    const cargarMisPedidos = async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        setCargandoPedidos(true)
        try {
            const res = await fetch('/api/pedidos/mis-pedidos', { headers: { 'Authorization': `Bearer ${token}` } })
            if (res.ok) {
                const data = await res.json()
                setPedidos(data)
            }
        } catch (error) {
            toast.error('No se pudo cargar tu historial de pedidos')
        } finally {
            setCargandoPedidos(false)
        }
    }

    const verDetallePedido = async (id) => {
        const token = localStorage.getItem('token')
        const toastId = toast.loading('Cargando detalles...')
        try {
            const res = await fetch(`/api/pedidos/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            const data = await res.json()
            if (res.ok) {
                setPedidoSeleccionado(data)
                setModalAbierto(true)
                toast.dismiss(toastId)
            } else {
                toast.error('No se pudo cargar el detalle', { id: toastId })
            }
        } catch (error) {
            toast.error('Error de conexión', { id: toastId })
        }
    }

    const getEstiloEstado = (estado) => {
        switch(estado) {
            case 'PAGADO': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '#10b981' }
            case 'CANCELADO': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '#ef4444' }
            default: return { bg: 'rgba(197, 160, 89, 0.1)', color: '#c5a059', border: '#c5a059' } // Pendiente
        }
    }

    const inputStyle = {
      width: '100%', padding: '12px 15px', borderRadius: '8px', 
      background: '#0a0a0a', border: '1px solid #333', color: '#fff', 
      boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.3s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '40px', background: '#121212', minHeight: '100vh' }}>
            
            <div style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontFamily: 'Playfair Display', color: '#fff', margin: 0, fontSize: '2.5rem' }}>Mi Cuenta</h1>
                <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('usuarioData'); window.location.href = '/'; }} style={{ background: 'transparent', border: '1px solid #444', color: '#a0a0a0', padding: '8px 16px', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => {e.target.style.color = '#fff'; e.target.style.borderColor = '#fff'}} onMouseOut={(e) => {e.target.style.color = '#a0a0a0'; e.target.style.borderColor = '#444'}}>
                    Cerrar Sesión
                </button>
            </div>

            {/* --- TARJETA 1: DATOS DEL PERFIL --- */}
            <div style={{ maxWidth: '700px', width: '100%', background: '#1e1e1e', padding: '40px', borderRadius: '20px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <h2 style={{ color: '#c5a059', margin: '0 0 5px 0', fontSize: '1.5rem' }}>Datos de Envío</h2>
                <p style={{ color: '#a0a0a0', marginBottom: '30px', fontSize: '0.95rem' }}>Tus datos predeterminados para agilizar tus compras.</p>

                <form onSubmit={guardarDatos}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Nombre Completo</label>
                        <input type="text" name="nombre" placeholder="Ej: Juan Pérez" style={inputStyle} value={datos.nombre} onChange={handleChange} required onFocus={(e) => e.target.style.borderColor = '#c5a059'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>DNI / CUIT</label>
                            <input type="text" name="dni" style={inputStyle} value={datos.dni} onChange={handleChange} required onFocus={(e) => e.target.style.borderColor = '#c5a059'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                        </div>
                        <div>
                            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Teléfono</label>
                            <input type="text" name="telefono" placeholder="Ej: 264 123 4567" style={inputStyle} value={datos.telefono} onChange={handleChange} required onFocus={(e) => e.target.style.borderColor = '#c5a059'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Provincia</label>
                            <input type="text" name="provincia" style={inputStyle} value={datos.provincia} onChange={handleChange} required onFocus={(e) => e.target.style.borderColor = '#c5a059'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                        </div>
                        <div>
                            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Ciudad</label>
                            <input type="text" name="ciudad" style={inputStyle} value={datos.ciudad} onChange={handleChange} required onFocus={(e) => e.target.style.borderColor = '#c5a059'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Dirección (Calle y Altura)</label>
                        <input type="text" name="direccion" placeholder="Ej: Av. Libertador 1234" style={inputStyle} value={datos.direccion} onChange={handleChange} required onFocus={(e) => e.target.style.borderColor = '#c5a059'} onBlur={(e) => e.target.style.borderColor = '#333'} />
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button type="submit" style={{ flex: 1, padding: '15px', fontSize: '1rem', fontWeight: 'bold', background: '#c5a059', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => e.target.style.background = '#e0b86a'} onMouseOut={(e) => e.target.style.background = '#c5a059'}>
                            GUARDAR CAMBIOS 💾
                        </button>
                        <button type="button" onClick={() => navigate('/carrito')} style={{ flex: 1, padding: '15px', fontSize: '1rem', fontWeight: 'bold', background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => e.target.style.borderColor = '#fff'} onMouseOut={(e) => e.target.style.borderColor = '#444'}>
                            IR AL CARRITO 🛒
                        </button>
                    </div>
                </form>
            </div>

            {/* --- TARJETA 2: HISTORIAL DE PEDIDOS --- */}
            <div style={{ maxWidth: '700px', width: '100%', background: '#1e1e1e', padding: '40px', borderRadius: '20px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <h2 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '15px', margin: '0 0 25px 0', fontSize: '1.5rem' }}>
                    📦 Historial de Compras
                </h2>

                {cargandoPedidos ? (
                    <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px 0' }}>Cargando pedidos...</p>
                ) : pedidos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0a0a0' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px', opacity: 0.5 }}>🛒</span>
                        Aún no has realizado ninguna compra en Imperio Mate.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {pedidos.map(pedido => {
                            const st = getEstiloEstado(pedido.estado);
                            return (
                            <div key={pedido.id} style={{ border: '1px solid #333', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>Pedido #{pedido.id}</p>
                                    <p style={{ margin: '0 0 10px 0', color: '#a0a0a0', fontSize: '0.9rem' }}>{new Date(pedido.creado_en).toLocaleDateString()}</p>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', 
                                        color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}`
                                    }}>
                                        {pedido.estado}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                    <p style={{ margin: 0, color: '#fff', fontWeight: '800', fontSize: '1.3rem' }}>
                                        ${Number(pedido.total).toLocaleString('es-AR')}
                                    </p>
                                    <button 
                                        onClick={() => verDetallePedido(pedido.id)}
                                        style={{ background: 'transparent', color: '#c5a059', border: '1px solid #c5a059', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: 'bold' }}
                                        onMouseOver={(e) => {e.target.style.background = '#c5a059'; e.target.style.color = '#000'}}
                                        onMouseOut={(e) => {e.target.style.background = 'transparent'; e.target.style.color = '#c5a059'}}
                                    >
                                        VER DETALLE
                                    </button>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {/* --- MODAL DE DETALLES DEL PEDIDO --- */}
            {modalAbierto && pedidoSeleccionado && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '20px', maxWidth: '500px', width: '90%', border: '1px solid #c5a059', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '25px' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontFamily: 'Playfair Display' }}>Pedido <span style={{color: '#c5a059'}}>#{pedidoSeleccionado.id}</span></h3>
                            <button onClick={() => setModalAbierto(false)} style={{ background: 'transparent', border: 'none', color: '#a0a0a0', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <div style={{ marginBottom: '25px', backgroundColor: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <p style={{ margin: '0 0 8px 0', color: '#a0a0a0', fontSize: '0.9rem' }}><strong>Estado:</strong> <span style={{ color: getEstiloEstado(pedidoSeleccionado.estado).color, fontWeight: 'bold' }}>{pedidoSeleccionado.estado}</span></p>
                            <p style={{ margin: '0 0 8px 0', color: '#a0a0a0', fontSize: '0.9rem' }}><strong>Envío a:</strong> <span style={{color: '#fff'}}>{pedidoSeleccionado.clienteDireccion || 'Retiro en Local'}</span></p>
                            <p style={{ margin: '0', color: '#a0a0a0', fontSize: '0.9rem' }}><strong>Teléfono:</strong> <span style={{color: '#fff'}}>{pedidoSeleccionado.clienteTelefono || '-'}</span></p>
                        </div>

                        <h4 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.1rem' }}>Productos:</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 25px 0' }}>
                            {pedidoSeleccionado.items?.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333', color: '#fff' }}>
                                    <div style={{ flex: 1 }}>
                                        <span style={{color: '#c5a059', fontWeight: 'bold', marginRight: '8px'}}>{item.cantidad}x</span> 
                                        {item.nombre}
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#a0a0a0' }}>
                                        ${Number(item.subtotal).toLocaleString('es-AR')}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px dashed #555' }}>
                            <span style={{ margin: 0, color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Abonado</span>
                            <span style={{ margin: 0, color: '#fff', fontSize: '1.8rem', fontWeight: '900' }}>${Number(pedidoSeleccionado.total).toLocaleString('es-AR')}</span>
                        </div>

                        <button onClick={() => setModalAbierto(false)} style={{ width: '100%', marginTop: '30px', padding: '15px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.target.style.background = '#444'} onMouseOut={(e) => e.target.style.background = '#333'}>
                            CERRAR VISTA
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}