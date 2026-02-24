import React from 'react';
// 1. Importamos tu logo desde la carpeta assets
import apoloLogo from '../assets/Apolo.jpg';

const Hero = () => {
  return (
    <div className="hero-container">
      
      {/* Lado Izquierdo: Textos y Botón */}
      <div className="hero-content">
        <span className="hero-badge">NUEVA COLECCIÓN</span>
        <h1 className="hero-title">Elegancia en cada mate</h1>
        <p className="hero-subtitle">Descubrí la experiencia premium de Apolo.</p>
        <a href="#productos" className="btn-hero">Ver Productos</a>
      </div>

      {/* Lado Derecho: Tu Logo */}
      <div className="hero-image-container">
        {/* 2. Mostramos la imagen usando la variable apoloLogo */}
        <img src={apoloLogo} alt="Logo Apolo Mates" className="hero-image" />
      </div>

    </div>
  );
};

export default Hero;