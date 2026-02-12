import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import '../style/Admin.css' // Reusamos estilos para que se vea bien

export function PerfilUsuario() {
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
        // Cargar datos del localStorage al entrar
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

        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usuario.username, datos })
            })
            const data = await res.json()

            if (data.success) {
                // Actualizamos localStorage
                localStorage.setItem('usuarioData', JSON.stringify(data.user))
                toast.success('¡Datos guardados correctamente! 💾')
            } else {
                toast.error('Error al guardar datos')
            }
        } catch (error) {
            toast.error('Error de conexión')
        }
    }

    return (
        <div className="admin-wrapper" style={{ justifyContent: 'center', paddingTop: '50px' }}>
            <div className="checkout-card" style={{ maxWidth: '600px', width: '100%' }}>
                <h2 style={{ color: '#c5a059', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                    📝 Completar Mis Datos
                </h2>
                <p style={{ color: '#aaa', marginBottom: '20px' }}>
                    Necesitamos estos datos para poder enviarte tus pedidos.
                </p>

                <form onSubmit={guardarDatos}>
                    <div className="form-group">
                        <label className="form-label">Nombre Completo</label>
                        <input type="text" name="nombre" className="form-input" value={datos.nombre} onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">DNI / CUIT</label>
                            <input type="text" name="dni" className="form-input" value={datos.dni} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono (WhatsApp)</label>
                            <input type="text" name="telefono" className="form-input" value={datos.telefono} onChange={handleChange} required />
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
                        <input type="text" name="direccion" className="form-input" value={datos.direccion} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="btn-whatsapp" style={{ width: '100%', marginTop: '20px' }}>
                        GUARDAR DATOS ✅
                    </button>
                </form>
            </div>
        </div>
    )
}