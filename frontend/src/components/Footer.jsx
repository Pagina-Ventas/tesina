import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../style/footer.css'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const irAlInicio = () => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const irAlCatalogo = () => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const catalogo = document.getElementById('catalogo')
        if (catalogo) {
          catalogo.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      const catalogo = document.getElementById('catalogo')
      if (catalogo) {
        catalogo.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <h2 className="footer-logo">APOLO MATE</h2>
          <p>Elegancia en cada mate.</p>
        </div>

        <div className="footer-section">
          <h4>Secciones</h4>
          <div className="footer-links-row">
            <button type="button" className="footer-link-btn" onClick={irAlInicio}>
              Inicio
            </button>

            <button type="button" className="footer-link-btn" onClick={irAlCatalogo}>
              Productos
            </button>
          </div>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <div className="footer-links-row">
            <a
              href="https://wa.me/qr/TL54ZGR3CNC6D1"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>

            <a
              href="https://www.instagram.com/apolo.sj?igsh=MTh2aW1kOGlvcm9kcA=="
              target="_blank"
              rel="noopener noreferrer"
              className="instagram-link"
            >
              <span className="instagram-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="17"
                    cy="7"
                    r="1.2"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Instagram
            </a>
          </div>
        </div>

        <div className="footer-info">
          <p>San Juan, Argentina</p>
          <p>Envíos a coordinar luego de la compra.</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} ApoloMate. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer