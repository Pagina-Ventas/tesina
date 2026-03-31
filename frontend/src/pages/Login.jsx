import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import '../style/auth.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function Login() {
  const navigate = useNavigate()

  const [esRegistro, setEsRegistro] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
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

    if (!formData.username || !formData.password || (esRegistro && !formData.email)) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const endpoint = esRegistro ? '/api/auth/register' : '/api/auth/login'

    try {
      const bodyData = esRegistro
        ? {
            username: formData.username,
            email: formData.email,
            password: formData.password
          }
        : {
            username: formData.username,
            password: formData.password
          }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.message || 'Ocurrió un error')
        return
      }

      if (esRegistro) {
        toast.success('¡Cuenta creada con éxito! Ahora inicia sesión.')
        setEsRegistro(false)
        setFormData({ username: '', email: '', password: '' })
        return
      }

      localStorage.setItem('token', data.token)

      if (data.role === 'admin') {
        localStorage.setItem('adminToken', data.token)
        localStorage.setItem('usuarioData', JSON.stringify(data.user))
        toast.success('Bienvenido Jefe 🛡️')

        setTimeout(() => {
          navigate('/admin')
        }, 800)
      } else {
        localStorage.removeItem('adminToken')
        localStorage.setItem('usuarioData', JSON.stringify(data.user))

        const volverAlCheckout = localStorage.getItem('redirigirAlCheckout') === 'true'

        toast.success(
          volverAlCheckout
            ? '¡Ahora sí, seguimos con tu compra! 🛒'
            : '¡Hola! Vamos a tu perfil 📝'
        )

        setTimeout(() => {
          if (volverAlCheckout) {
            navigate('/carrito')
          } else {
            navigate('/perfil')
          }
        }, 800)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error de conexión con el servidor')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '15px',
    borderRadius: '8px',
    background: '#0a0a0a',
    border: '1px solid #333',
    color: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    textAlign: 'center',
    fontSize: '1rem',
    transition: 'border-color 0.3s'
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#121212',
        flexDirection: 'column',
        gap: '30px',
        padding: '20px'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          padding: '50px 40px',
          background: '#1e1e1e',
          borderRadius: '20px',
          border: '1px solid #333',
          borderTop: '4px solid #c5a059',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
      >
        <h2
          style={{
            fontFamily: 'Playfair Display',
            color: '#fff',
            margin: '0 0 10px 0',
            fontSize: '2.2rem'
          }}
        >
          {esRegistro ? 'Crear Cuenta' : 'Bienvenido'}
        </h2>

        <p style={{ color: '#a0a0a0', marginBottom: '40px', fontSize: '0.95rem' }}>
          {esRegistro ? 'Únete a la comunidad APOLO MATE' : 'Ingresa a tu cuenta para continuar'}
        </p>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            name="username"
            placeholder="Usuario"
            value={formData.username}
            onChange={handleChange}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#c5a059')}
            onBlur={(e) => (e.target.style.borderColor = '#333')}
          />
        </div>

        {esRegistro && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#c5a059')}
              onBlur={(e) => (e.target.style.borderColor = '#333')}
            />
          </div>
        )}

        <div style={{ marginBottom: '35px' }}>
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#c5a059')}
            onBlur={(e) => (e.target.style.borderColor = '#333')}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: '#c5a059',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 10px 20px rgba(197,160,89,0.3)'
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'none'
            e.target.style.boxShadow = 'none'
          }}
        >
          {esRegistro ? 'Registrarse' : 'Ingresar'}
        </button>

        <p
          onClick={() => setEsRegistro(!esRegistro)}
          style={{
            marginTop: '25px',
            color: '#a0a0a0',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'color 0.3s'
          }}
          onMouseOver={(e) => (e.target.style.color = '#c5a059')}
          onMouseOut={(e) => (e.target.style.color = '#a0a0a0')}
        >
          {esRegistro ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate aquí'}
        </p>
      </form>

      <Link
        to="/"
        style={{
          color: '#666',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.9rem',
          transition: 'color 0.3s'
        }}
        onMouseOver={(e) => (e.target.style.color = '#fff')}
        onMouseOut={(e) => (e.target.style.color = '#666')}
      >
        ← Volver a la Tienda
      </Link>
    </div>
  )
}