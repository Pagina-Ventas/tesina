import React from 'react';
import apoloLogo from '../assets/Apolo.jpg';

const Hero = () => {
  return (
    <div className="hero-container">

      {/* Lado Izquierdo */}
      <div className="hero-content">
        <span className="hero-badge">NUEVA COLECCIÓN</span>

        <h1 className="hero-title">
          Elegancia en cada mate
        </h1>

        <p className="hero-subtitle">
          Descubrí la experiencia premium de Apolo.
        </p>

        {/* BOTON QUE BAJA A LA GRILLA */}
        <a href="#catalogo" className="btn-hero">
          VER PRODUCTOS
        </a>

      </div>

      {/* Lado Derecho */}
      <div className="hero-image-container">
        <img 
          src={apoloLogo}
          alt="Logo Apolo Mates"
          className="hero-image"
        />
      </div>

    </div>
  );
};

export default Hero;