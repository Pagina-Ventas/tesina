import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import '../style/Admin.css' 

export function Login() {
  const [esRegistro, setEsRegistro] = useState(false) // Estado para alternar entre Login y Registro
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
    
    // Validación básica
    if(!formData.username || !formData.password) {
        toast.error('Por favor completa todos los campos')
        return
    }

    // Decidimos a qué endpoint llamar según el modo
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
                // CASO: REGISTRO EXITOSO
                toast.success('¡Cuenta creada con éxito! Ahora inicia sesión.')
                setEsRegistro(false) // Cambiamos la vista a Login automáticamente
            } else {
                // CASO: LOGIN EXITOSO
                
                // Guardamos datos básicos
                localStorage.setItem('token', data.token) 
                
                if (data.role === 'admin') {
                    // Si es Admin, guardamos el token específico que usa tu ruta protegida
                    localStorage.setItem('adminToken', data.token)
                    toast.success('Bienvenido Jefe 🛡️')
                    setTimeout(() => window.location.href = '/admin', 1000)
                } else {
                    // Si es Cliente
                    localStorage.setItem('usuarioData', JSON.stringify(data.user)) // Guardamos datos para el perfil
                    toast.success('¡Hola! Vamos a tus datos 📝')
                    setTimeout(() => window.location.href = '/perfil', 1000)
                }
            }
        } else {
            toast.error(data.message) // Ej: "Usuario ya existe" o "Contraseña incorrecta"
        }
    } catch (error) {
        console.error(error)
        toast.error('Error de conexión con el servidor')
    }
  }

  return (
    <div className="login-container" style={{
        display:'flex', 
        justifyContent:'center', 
        alignItems:'center', 
        height:'100vh', 
        background:'#121212',
        flexDirection: 'column',
        gap: '20px'
    }}>
      
      {/* TARJETA DE LOGIN / REGISTRO */}
      <form onSubmit={handleSubmit} className="checkout-card" style={{width:'350px', textAlign:'center', padding: '40px 30px'}}>
        
        {/* Título Dinámico */}
        <h2 style={{color:'#c5a059', marginBottom:'10px', fontSize: '1.8rem'}}>
            {esRegistro ? 'CREAR CUENTA' : 'LOGIN'}
        </h2>
        <p style={{color:'#888', marginBottom:'30px', fontSize:'0.9rem'}}>
            {esRegistro ? 'Únete a la comunidad ImperioMate' : 'Ingresa a tu cuenta'}
        </p>

        <div className="form-group" style={{marginBottom:'15px'}}>
            <input 
                type="text" 
                name="username"
                className="form-input" 
                placeholder="Usuario"
                value={formData.username}
                onChange={handleChange}
                style={{textAlign: 'center'}}
            />
        </div>

        <div className="form-group" style={{marginBottom:'25px'}}>
            <input 
                type="password" 
                name="password"
                className="form-input" 
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                style={{textAlign: 'center'}}
            />
        </div>

        <button type="submit" className="btn-whatsapp" style={{width:'100%', padding:'12px', fontSize:'1rem'}}>
            {esRegistro ? 'REGISTRARSE' : 'INGRESAR'}
        </button>

        {/* Toggle para cambiar entre Login y Registro */}
        <p 
            onClick={() => setEsRegistro(!esRegistro)}
            style={{
                marginTop:'20px', 
                color:'#aaa', 
                fontSize:'0.9rem', 
                cursor:'pointer',
                textDecoration: 'underline'
            }}
        >
            {esRegistro 
                ? '¿Ya tienes cuenta? Inicia Sesión' 
                : '¿No tienes cuenta? Regístrate aquí'}
        </p>

      </form>

      {/* BOTÓN VOLVER FUERA DE LA TARJETA */}
      <Link to="/" style={{color: '#666', textDecoration: 'none', display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem'}}>
         ← Volver a la Tienda
      </Link>

    </div>
  )
}