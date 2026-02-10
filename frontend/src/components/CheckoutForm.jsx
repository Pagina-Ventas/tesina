import React, { useState, useEffect } from 'react'
import '../style/App.css'
export function CheckoutForm({ carrito, totalProductos, onConfirmar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    metodoPago: 'Transferencia',
    tipoEntrega: 'Retiro',
    courier: ''
  })

  // DATOS BANCARIOS DEL VENDEDOR (CONFIGURABLE)
  const DATOS_BANCO = {
    cbu: "0000003100000000000000",
    alias: "IMPERIO.MATE.PRO",
    banco: "Banco Nación",
    titular: "Germán Proprietario"
  }

  // LINK DE MERCADO PAGO (Simulado o Real)
  // En un caso real, esto vendría del backend tras crear una preferencia
  const LINK_MP = "https://link.mercadopago.com.ar/imperiomate" 

  const COSTOS_ENVIO = {
    'didimoto': 2500,
    'correo': 6500,
    'andreani': 8200
  }

  const costoEnvio = (datos.tipoEntrega === 'Envio' && datos.courier) 
    ? COSTOS_ENVIO[datos.courier] || 0 
    : 0

  const totalFinal = totalProductos + costoEnvio

  // Regla: Efectivo = Solo Retiro
  useEffect(() => {
    if (datos.metodoPago === 'Efectivo') {
      setDatos(prev => ({ ...prev, tipoEntrega: 'Retiro', courier: '' }))
    }
  }, [datos.metodoPago])

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Armamos el objeto de la orden para pasarlo al App.jsx
    const orden = {
        cliente: datos.nombre,
        telefono: datos.telefono,
        direccion: datos.tipoEntrega === 'Envio' ? `${datos.direccion}, ${datos.ciudad}` : 'Retiro en Local',
        items: carrito,
        total: totalFinal,
        metodoPago: datos.metodoPago,
        tipoEntrega: datos.tipoEntrega,
        envio: datos.courier || '-',
        estado: 'PENDIENTE', // El estado clave
        fecha: new Date().toLocaleString()
    }

    onConfirmar(orden)
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-card">
        <h2 className="checkout-title">Finalizar Compra</h2>
        
        <form onSubmit={handleSubmit}>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div className="form-group">
                <label className="form-label">Nombre</label>
                <input type="text" name="nombre" required className="form-input" onChange={handleChange}/>
            </div>
            <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input type="tel" name="telefono" required className="form-input" onChange={handleChange}/>
            </div>
          </div>

          {/* SELECCIÓN DE PAGO */}
          <div className="form-group">
            <label className="form-label">Forma de Pago</label>
            <select name="metodoPago" className="form-input" onChange={handleChange} value={datos.metodoPago}>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="MercadoPago">MercadoPago / Tarjetas</option>
              <option value="Efectivo">Efectivo (Solo retiro)</option>
            </select>
          </div>

          {/* --- BLOQUE DINÁMICO DE INFORMACIÓN DE PAGO --- */}
          
          {/* CASO 1: TRANSFERENCIA (Muestra CBU) */}
          {datos.metodoPago === 'Transferencia' && (
              <div className="payment-info-box" style={{background: '#1a1a2e', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '20px'}}>
                  <p style={{color: '#3b82f6', fontWeight: 'bold', marginBottom: '5px'}}>Datos para transferir:</p>
                  <p style={{fontSize: '0.9rem', color: '#fff'}}>Alias: <strong>{DATOS_BANCO.alias}</strong></p>
                  <p style={{fontSize: '0.9rem', color: '#fff'}}>CBU: {DATOS_BANCO.cbu}</p>
                  <p style={{fontSize: '0.9rem', color: '#aaa'}}>{DATOS_BANCO.banco} - {DATOS_BANCO.titular}</p>
                  <p style={{fontSize: '0.8rem', color: '#aaa', marginTop: '5px'}}>* El pedido se procesará al recibir el comprobante.</p>
              </div>
          )}

          {/* CASO 2: MERCADOPAGO (Muestra Botón/Link) */}
          {datos.metodoPago === 'MercadoPago' && (
              <div className="payment-info-box" style={{background: '#009ee31a', padding: '15px', borderRadius: '8px', border: '1px solid #009ee3', marginBottom: '20px', textAlign: 'center'}}>
                  <p style={{color: '#009ee3', fontWeight: 'bold', marginBottom: '10px'}}>Pagá rápido y seguro con QR o Link</p>
                  {/* Aquí simulamos el botón de ir a pagar */}
                  <a href={LINK_MP} target="_blank" rel="noopener noreferrer" style={{background: '#009ee3', color: 'white', padding: '8px 15px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem'}}>
                      Abrir MercadoPago ↗
                  </a>
                  <p style={{fontSize: '0.8rem', color: '#aaa', marginTop: '10px'}}>* Al volver, confirma el pedido abajo.</p>
              </div>
          )}


          {/* LOGISTICA (Igual que antes) */}
          <div className="form-group">
            <label className="form-label">Método de Entrega</label>
            <div style={{display: 'flex', gap: '10px'}}>
                <button 
                    type="button"
                    className={`filter-btn ${datos.tipoEntrega === 'Retiro' ? 'active' : ''}`}
                    onClick={() => setDatos({...datos, tipoEntrega: 'Retiro', courier: ''})}
                    style={{flex: 1, textAlign: 'center'}}
                >
                    🏢 Retiro Local
                </button>
                <button 
                    type="button"
                    className={`filter-btn ${datos.tipoEntrega === 'Envio' ? 'active' : ''}`}
                    onClick={() => setDatos({...datos, tipoEntrega: 'Envio'})}
                    disabled={datos.metodoPago === 'Efectivo'} 
                    style={{flex: 1, textAlign: 'center', opacity: datos.metodoPago === 'Efectivo' ? 0.5 : 1}}
                >
                    🚚 Envío
                </button>
            </div>
          </div>

          {datos.tipoEntrega === 'Envio' && (
            <div className="shipping-options" style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333'}}>
                <select name="courier" className="form-input" required onChange={handleChange} defaultValue="">
                    <option value="" disabled>Seleccionar empresa...</option>
                    <option value="didimoto">🛵 Didimoto - $2.500</option>
                    <option value="correo">📦 Correo Argentino - $6.500</option>
                    <option value="andreani">🚚 Andreani Express - $8.200</option>
                </select>
                <div style={{marginTop: '15px'}}>
                    <input type="text" name="direccion" placeholder="Calle y Altura" required className="form-input" style={{marginBottom: '10px'}} onChange={handleChange}/>
                    <input type="text" name="ciudad" placeholder="Ciudad / Provincia" required className="form-input" onChange={handleChange}/>
                </div>
            </div>
          )}

          {/* TOTALES */}
          <div style={{borderTop: '1px solid #333', paddingTop: '15px', marginTop: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', color: '#4caf50', fontWeight: '900'}}>
                <span>TOTAL:</span>
                <span>${totalFinal.toLocaleString()}</span>
            </div>
          </div>

          <button type="submit" className="btn-whatsapp">
            ENVIAR PEDIDO A REVISIÓN 📨
          </button>
          
          <button type="button" className="btn-cancel" onClick={onCancelar}>
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}