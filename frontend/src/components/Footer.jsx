import React from "react";
import { Link } from 'react-router-dom'
import '../style/footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Marca */}
        <div className="footer-col">
          <h2 className="logo">APOLO MATE</h2>
          <p>Elegancia en cada mate.</p>
        </div>

        {/* Navegación */}
        <div className="footer-col">
          <h4>Secciones</h4>
          <ul>
            <li>Inicio</li>
            <li>Productos</li>
            <li>Contacto</li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="footer-col">
          <h4>Contacto</h4>
          <p>San Juan, Argentina</p>
          <a
            href="https://wa.me/549XXXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            Escribinos por WhatsApp
          </a>
        </div>

        {/* Info */}
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