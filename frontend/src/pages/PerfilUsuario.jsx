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
                // 1. Actualizamos localStorage con los nuevos datos
                localStorage.setItem('usuarioData', JSON.stringify(data.user))
                
                toast.success('¡Datos actualizados correctamente! 💾', { id: toastId })
                
                // NOTA: Ya no hay redirección forzada al carrito.
                // El usuario decide si quiere ir al carrito o seguir navegando.
            } else {
                toast.error('Error al guardar datos', { id: toastId })
            }
        } catch (error) {
            console.error(error)
            toast.error('Error de conexión', { id: toastId })
        }
    }

    return (
        <div className="admin-wrapper" style={{ justifyContent: 'center', paddingTop: '100px', paddingBottom: '50px' }}>
            <div className="checkout-card" style={{ maxWidth: '600px', width: '100%' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px'}}>
                    <h2 style={{ color: '#c5a059', margin: 0 }}>
                        👤 Mi Perfil
                    </h2>
                    {/* Botón para volver al inicio */}
                    <button onClick={() => navigate('/')} style={{background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem'}}>
                        ✕
                    </button>
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

                    {/* Botón opcional para ir al carrito */}
                    <button type="button" onClick={() => navigate('/carrito')} className="btn-cancel" style={{marginTop: '10px'}}>
                        Ir a mi carrito 🛒
                    </button>
                </form>
            </div>
        </div>
    )
}