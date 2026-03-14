import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import '../style/auth.css' 

export function Login() {
  const [esRegistro, setEsRegistro] = useState(false)
  const [formData, setFormData] = useState({
      username: '',
      password: ''
  })

  const handleChange = (e) => {
      setFormData({
          ...formData,
          [e.target.name]: e.target.value
      })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if(!formData.username || !formData.password) {
        toast.error('Por favor completa todos los campos')
        return
    }

    const endpoint = esRegistro ? '/api/auth/register' : '/api/auth/login'

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        const data = await res.json()

        if (data.success) {
            if (esRegistro) {
                toast.success('¡Cuenta creada con éxito! Ahora inicia sesión.')
                setEsRegistro(false) 
            } else {
                localStorage.setItem('token', data.token) 
                
                if (data.role === 'admin') {
                    localStorage.setItem('adminToken', data.token)
                    toast.success('Bienvenido Jefe 🛡️')
                    setTimeout(() => window.location.href = '/admin', 1000)
                } else {
                    localStorage.setItem('usuarioData', JSON.stringify(data.user)) 
                    toast.success('¡Hola! Vamos a tus datos 📝')
                    setTimeout(() => window.location.href = '/perfil', 1000)
                }
            }
        } else {
            toast.error(data.message) 
        }
    } catch (error) {
        console.error(error)
        toast.error('Error de conexión con el servidor')
    }
  }

  const inputStyle = {
    width: '100%', padding: '15px', borderRadius: '8px', 
    background: '#0a0a0a', border: '1px solid #333', color: '#fff', 
    boxSizing: 'border-box', outline: 'none', textAlign: 'center',
    fontSize: '1rem', transition: 'border-color 0.3s'
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#121212', flexDirection: 'column', gap: '30px', padding: '20px' }}>
      
      {/* TARJETA DE LOGIN / REGISTRO */}
      <form onSubmit={handleSubmit} style={{
          width:'100%', maxWidth: '400px', textAlign:'center', padding: '50px 40px',
          background: '#1e1e1e', borderRadius: '20px', border: '1px solid #333',
          borderTop: '4px solid #c5a059', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        
        <h2 style={{ fontFamily: 'Playfair Display', color:'#fff', margin:'0 0 10px 0', fontSize: '2.2rem' }}>
            {esRegistro ? 'Crear Cuenta' : 'Bienvenido'}
        </h2>
        <p style={{color:'#a0a0a0', marginBottom:'40px', fontSize:'0.95rem'}}>
            {esRegistro ? 'Únete a la comunidad ImperioMate' : 'Ingresa a tu cuenta para continuar'}
        </p>

        <div style={{marginBottom:'20px'}}>
            <input 
                type="text" 
                name="username"
                placeholder="Usuario"
                value={formData.username}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#c5a059'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
            />
        </div>

        <div style={{marginBottom:'35px'}}>
            <input 
                type="password" 
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#c5a059'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
            />
        </div>

        <button type="submit" style={{
            width:'100%', padding:'15px', fontSize:'1.1rem', fontWeight: 'bold',
            background: '#c5a059', color: '#000', border: 'none', borderRadius: '8px',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.3s'
        }}
        onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 10px 20px rgba(197,160,89,0.3)' }}
        onMouseOut={(e) => { e.target.style.transform = 'none'; e.target.style.boxShadow = 'none' }}
        >
            {esRegistro ? 'Registrarse' : 'Ingresar'}
        </button>

        {/* Toggle para cambiar entre Login y Registro */}
        <p onClick={() => setEsRegistro(!esRegistro)} style={{ marginTop:'25px', color:'#a0a0a0', fontSize:'0.9rem', cursor:'pointer', transition: 'color 0.3s' }} onMouseOver={(e) => e.target.style.color = '#c5a059'} onMouseOut={(e) => e.target.style.color = '#a0a0a0'}>
            {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </p>

      </form>

      <Link to="/" style={{color: '#666', textDecoration: 'none', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem', transition: 'color 0.3s'}} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#666'}>
         ← Volver a la Tienda
      </Link>

    </div>
  )
}