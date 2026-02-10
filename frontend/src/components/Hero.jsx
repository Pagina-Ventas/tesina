import React from 'react'
import '../style/App.css'

export function Hero() {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <span className="hero-badge">NUEVA COLECCIÓN 2026</span>
        <h1 className="hero-title">El Arte del Buen Mate</h1>
        <p className="hero-subtitle">
          Descubrí nuestra selección premium de termos, bombillas y kits materos diseñados para durar toda la vida.
        </p>
        <a href="#catalogo" className="btn-hero">
          VER PRODUCTOS ↓
        </a>
      </div>
      
      {/* Elemento decorativo visual */}
      <div className="hero-image">
        🧉
      </div>
    </div>
  )
}