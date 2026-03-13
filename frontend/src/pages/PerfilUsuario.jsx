import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

// --- IMPORTAMOS EL CSS MODULAR ---
import '../style/auth.css' 

export function PerfilUsuario() {
    const navigate = useNavigate()
    const [usuario, setUsuario] = useState(null)
    const [datos, setDatos] = useState({
        nombre: '',
        dni: '',
        telefono: '',
        provincia: '',
        ciudad: '',
        direccion: ''
    })

    // --- NUEVOS ESTADOS PARA EL HISTORIAL DE PEDIDOS ---
    const [pedidos, setPedidos] = useState([])
    const [cargandoPedidos, setCargandoPedidos] = useState(false)
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
    const [modalAbierto, setModalAbierto] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem('usuarioData')
        if (userStr) {
            const userObj = JSON.parse(userStr)
            setUsuario(userObj)
            setDatos({
                nombre: userObj.nombre || '',
                dni: userObj.dni || '',
                telefono: userObj.telefono || '',
                provincia: userObj.provincia || '',
                ciudad: userObj.ciudad || '',
                direccion: userObj.direccion || ''
            })
            // Llamamos a cargar los pedidos una vez que sabemos quién es el usuario
            cargarMisPedidos()
        }
    }, [])

    const handleChange = (e) => {
        setDatos({ ...datos, [e.target.name]: e.target.value })
    }

    const guardarDatos = async (e) => {
        e.preventDefault()
        if (!usuario) return

        const toastId = toast.loading('Guardando tus datos...')

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            console.error(error)
            toast.error('Error de conexión', { id: toastId })
        }
    }

    // --- FUNCIONES PARA HISTORIAL DE PEDIDOS ---
    const cargarMisPedidos = async () => {
        const token = localStorage.getItem('token')
        if (!token) return

        setCargandoPedidos(true)
        try {
            const res = await fetch('/api/pedidos/mis-pedidos', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setPedidos(data)
            }
        } catch (error) {
            console.error('Error cargando pedidos:', error)
            toast.error('No se pudo cargar tu historial de pedidos')
        } finally {
            setCargandoPedidos(false)
        }
    }

    const verDetallePedido = async (id) => {
        const token = localStorage.getItem('token')
        const toastId = toast.loading('Cargando detalles...')
        try {
            const res = await fetch(`/api/pedidos/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setPedidoSeleccionado(data)
                setModalAbierto(true)
                toast.dismiss(toastId)
            } else {
                toast.error('No se pudo cargar el detalle', { id: toastId })
            }
        } catch (error) {
            console.error('Error cargando detalle:', error)
            toast.error('Error de conexión', { id: toastId })
        }
    }

    // Función para dar color a los estados
    const getColorEstado = (estado) => {
        switch(estado) {
            case 'PAGADO': return '#4caf50' // Verde
            case 'CANCELADO': return '#f44336' // Rojo
            default: return '#ff9800' // Naranja (Pendiente)
        }
    }

    return (
        <div className="admin-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', paddingBottom: '50px', gap: '30px' }}>
            
            {/* --- TARJETA 1: DATOS DEL PERFIL --- */}
            <div className="checkout-card" style={{ maxWidth: '600px', width: '100%' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px'}}>
                    <h2 style={{ color: '#c5a059', margin: 0 }}>👤 Mi Perfil</h2>
                    <button onClick={() => navigate('/')} style={{background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem'}}>✕</button>
                </div>
                
                <p style={{ color: '#aaa', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Tus datos de envío predeterminados. Podés actualizarlos en cualquier momento.
                </p>

                <form onSubmit={guardarDatos}>
                    <div className="form-group">
                        <label className="form-label">Nombre Completo</label>
                        <input type="text" name="nombre" placeholder="Ej: Juan Pérez" className="form-input" value={datos.nombre} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">DNI / CUIT</label>
                            <input type="text" name="dni" className="form-input" value={datos.dni} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono</label>
                            <input type="text" name="telefono" placeholder="Ej: 264 123 4567" className="form-input" value={datos.telefono} onChange={handleChange} required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">Provincia</label>
                            <input type="text" name="provincia" className="form-input" value={datos.provincia} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ciudad</label>
                            <input type="text" name="ciudad" className="form-input" value={datos.ciudad} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Dirección de Entrega (Calle y Altura)</label>
                        <input type="text" name="direccion" placeholder="Ej: Av. Libertador 1234" className="form-input" value={datos.direccion} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="btn-whatsapp" style={{ width: '100%', marginTop: '25px', padding: '15px', fontSize: '1rem' }}>
                        GUARDAR CAMBIOS 💾
                    </button>

                    <button type="button" onClick={() => navigate('/carrito')} className="btn-cancel" style={{marginTop: '10px'}}>
                        Ir a mi carrito 🛒
                    </button>
                </form>
            </div>

            {/* --- TARJETA 2: HISTORIAL DE PEDIDOS --- */}
            <div className="checkout-card" style={{ maxWidth: '600px', width: '100%' }}>
                <h2 style={{ color: '#c5a059', borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px', marginTop: 0 }}>
                    📦 Mi Historial de Compras
                </h2>

                {cargandoPedidos ? (
                    <p style={{ color: '#aaa', textAlign: 'center' }}>Cargando pedidos...</p>
                ) : pedidos.length === 0 ? (
                    <p style={{ color: '#aaa', textAlign: 'center' }}>Aún no has realizado ninguna compra.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {pedidos.map(pedido => (
                            <div key={pedido.id} style={{ border: '1px solid #333', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
                                <div>
                                    <p style={{ margin: '0 0 5px 0', color: '#fff', fontWeight: 'bold' }}>Pedido #{pedido.id}</p>
                                    <p style={{ margin: '0 0 5px 0', color: '#aaa', fontSize: '0.9rem' }}>{new Date(pedido.creado_en).toLocaleDateString()}</p>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.8rem', 
                                        fontWeight: 'bold', 
                                        color: '#fff',
                                        backgroundColor: getColorEstado(pedido.estado) 
                                    }}>
                                        {pedido.estado}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: '0 0 10px 0', color: '#c5a059', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        ${Number(pedido.total).toLocaleString('es-AR')}
                                    </p>
                                    <button 
                                        onClick={() => verDetallePedido(pedido.id)}
                                        style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', transition: '0.2s' }}
                                        onMouseOver={(e) => e.target.style.background = '#444'}
                                        onMouseOut={(e) => e.target.style.background = '#333'}
                                    >
                                        Ver Detalle 👁️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODAL DE DETALLES DEL PEDIDO --- */}
            {modalAbierto && pedidoSeleccionado && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', border: '1px solid #c5a059', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#c5a059' }}>Detalle del Pedido #{pedidoSeleccionado.id}</h3>
                            <button onClick={() => setModalAbierto(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Estado:</strong> <span style={{ color: getColorEstado(pedidoSeleccionado.estado) }}>{pedidoSeleccionado.estado}</span></p>
                            <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Envío a:</strong> {pedidoSeleccionado.clienteDireccion || 'No especificada'}</p>
                            <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Teléfono:</strong> {pedidoSeleccionado.clienteTelefono || 'No especificado'}</p>
                        </div>

                        <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Productos comprados:</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
                            {pedidoSeleccionado.items?.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #222', color: '#fff' }}>
                                    <div style={{ flex: 1 }}>
                                        <span>{item.cantidad}x {item.nombre}</span>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>
                                        ${Number(item.subtotal).toLocaleString('es-AR')}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #444' }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>TOTAL</h3>
                            <h3 style={{ margin: 0, color: '#c5a059' }}>${Number(pedidoSeleccionado.total).toLocaleString('es-AR')}</h3>
                        </div>

                        <button onClick={() => setModalAbierto(false)} className="btn-cancel" style={{ width: '100%', marginTop: '25px' }}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}