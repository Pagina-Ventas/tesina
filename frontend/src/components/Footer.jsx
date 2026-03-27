import React from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom'
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

        <div className="footer-col">
          <h2 className="logo">APOLO MATE</h2>
          <p>Elegancia en cada mate.</p>
        </div>

        <div className="footer-col">
          <h4>Secciones</h4>
          <ul>
            <li>
              <button type="button" className="footer-link-btn" onClick={irAlInicio}>
                Inicio
              </button>
            </li>
            <li>
              <button type="button" className="footer-link-btn" onClick={irAlCatalogo}>
                Productos
              </button>
            </li>
            <li>
              <a
                href="https://wa.me/qr/TL54ZGR3CNC6D1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contacto
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contacto</h4>
          <p>San Juan, Argentina</p>
          <a
            href="https://wa.me/qr/TL54ZGR3CNC6D1"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            Escribinos por WhatsApp
          </a>
        </div>

        <div className="footer-col">
          <h4>Información</h4>
          <p>Envíos a coordinar luego de la compra</p>
          <p>Pagos por transferencia o MercadoPago</p>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} ApoloMate. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;