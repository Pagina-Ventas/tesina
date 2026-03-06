import React, { useState, useEffect } from 'react'
import '../style/App.css'

export function CheckoutForm({ carrito, totalProductos, onConfirmar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    metodoPago: 'Transferencia', // Por defecto
    tipoEntrega: 'Retiro',
    courier: '',
    email: '' // 👈 IMPORTANTE: Agregamos email para poder mandarle el correo
  })
  
  const [procesando, setProcesando] = useState(false)

  // DATOS BANCARIOS DEL VENDEDOR
  const DATOS_BANCO = {
    cbu: "0000003100000000000000",
    alias: "IMPERIO.MATE.PRO",
    banco: "Banco Nación",
    titular: "Germán Proprietario"
  }

  const COSTOS_ENVIO = {
    'didimoto': 2500,
    'correo': 6500,
    'andreani': 8200
  }

  const costoEnvio = (datos.tipoEntrega === 'Envio' && datos.courier) 
    ? COSTOS_ENVIO[datos.courier] || 0 
    : 0

  const totalFinal = totalProductos + costoEnvio

  useEffect(() => {
    if (datos.metodoPago === 'Efectivo') {
      setDatos(prev => ({ ...prev, tipoEntrega: 'Retiro', courier: '' }))
    }
  }, [datos.metodoPago])

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 👇 GENERAMOS EL ID AQUÍ PARA PODER USARLO EN MP
    const idPedidoGenerado = Date.now();

    // Objeto de orden base
    const orden = {
        id: idPedidoGenerado, // 👈 Lo agregamos a la orden
        cliente: datos.nombre,
        email: datos.email,   // 👈 Guardamos el email
        telefono: datos.telefono,
        direccion: datos.tipoEntrega === 'Envio' ? `${datos.direccion}, ${datos.ciudad}` : 'Retiro en Local',
        items: carrito,
        total: totalFinal,
        metodoPago: datos.metodoPago,
        tipoEntrega: datos.tipoEntrega,
        envio: datos.courier || '-',
        estado: 'PENDIENTE', 
        fecha: new Date().toLocaleString()
    }

    // --- LÓGICA DE MERCADO PAGO ---
    if (datos.metodoPago === 'MercadoPago') {
        try {
            setProcesando(true)
            
            // 1. PRIMERO: Guardamos el pedido silenciosamente
            await onConfirmar(orden, true); 

            // 2. Pedimos la preferencia al Backend
            const response = await fetch('/api/pagos/crear-preferencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // 👇 Enviamos el idPedido al backend
                body: JSON.stringify({ items: carrito, cliente: datos, idPedido: idPedidoGenerado }) 
            });

            const data = await response.json();

            if (data.id) {
                // 3. Redirigimos a Mercado Pago
                window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
            } else {
                alert("Error al generar el pago. Intenta nuevamente.");
                setProcesando(false);
            }

        } catch (error) {
            console.error("Error MP:", error);
            alert("Hubo un problema de conexión con Mercado Pago.");
            setProcesando(false);
        }
        return; 
    }

    // --- FLUJO NORMAL (Transferencia / Efectivo) ---
    onConfirmar(orden, false)
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-card">
        <h2 className="checkout-title">Finalizar Compra</h2>
        
        <form onSubmit={handleSubmit}>
          
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div className="form-group">
                <label className="form-label">Nombre</label>
                <input type="text" name="nombre" required className="form-input" onChange={handleChange} disabled={procesando}/>
            </div>
            <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input type="tel" name="telefono" required className="form-input" onChange={handleChange} disabled={procesando}/>
            </div>
          </div>

          {/* 👇 NUEVO CAMPO DE EMAIL (Necesario para enviarle el recibo) */}
          <div className="form-group">
              <label className="form-label">Email (Para enviar recibo)</label>
              <input type="email" name="email" required className="form-input" onChange={handleChange} disabled={procesando}/>
          </div>

          {/* SELECCIÓN DE PAGO */}
          <div className="form-group">
            <label className="form-label">Forma de Pago</label>
            <select name="metodoPago" className="form-input" onChange={handleChange} value={datos.metodoPago} disabled={procesando}>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="MercadoPago">Mercado Pago (Tarjetas / QR)</option>
              <option value="Efectivo">Efectivo (Solo retiro)</option>
            </select>
          </div>

          {/* INFORMACIÓN DE PAGO DINÁMICA */}
          {datos.metodoPago === 'Transferencia' && (
              <div className="payment-info-box" style={{background: '#1a1a2e', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '20px'}}>
                  <p style={{color: '#3b82f6', fontWeight: 'bold', marginBottom: '5px'}}>Datos para transferir:</p>
                  <p style={{fontSize: '0.9rem', color: '#fff'}}>Alias: <strong>{DATOS_BANCO.alias}</strong></p>
                  <p style={{fontSize: '0.9rem', color: '#fff'}}>CBU: {DATOS_BANCO.cbu}</p>
                  <p style={{fontSize: '0.9rem', color: '#aaa'}}>{DATOS_BANCO.banco} - {DATOS_BANCO.titular}</p>
              </div>
          )}

          {datos.metodoPago === 'MercadoPago' && (
              <div className="payment-info-box" style={{background: 'rgba(0, 158, 227, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid #009ee3', marginBottom: '20px', textAlign: 'center'}}>
                  <p style={{color: '#009ee3', fontWeight: 'bold', marginBottom: '5px'}}>¡Estás a un paso!</p>
                  <p style={{fontSize: '0.9rem', color: '#ccc'}}>Al confirmar, serás redirigido a la web segura de Mercado Pago.</p>
              </div>
          )}

          {/* LOGISTICA */}
          <div className="form-group">
            <label className="form-label">Método de Entrega</label>
            <div style={{display: 'flex', gap: '10px'}}>
                <button 
                    type="button"
                    className={`filter-btn ${datos.tipoEntrega === 'Retiro' ? 'active' : ''}`}
                    onClick={() => setDatos({...datos, tipoEntrega: 'Retiro', courier: ''})}
                    style={{flex: 1, textAlign: 'center'}}
                    disabled={procesando}
                >
                    🏢 Retiro Local
                </button>
                <button 
                    type="button"
                    className={`filter-btn ${datos.tipoEntrega === 'Envio' ? 'active' : ''}`}
                    onClick={() => setDatos({...datos, tipoEntrega: 'Envio'})}
                    disabled={datos.metodoPago === 'Efectivo' || procesando} 
                    style={{flex: 1, textAlign: 'center', opacity: datos.metodoPago === 'Efectivo' ? 0.5 : 1}}
                >
                    🚚 Envío
                </button>
            </div>
          </div>

          {datos.tipoEntrega === 'Envio' && (
            <div className="shipping-options" style={{background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333'}}>
                <select name="courier" className="form-input" required onChange={handleChange} defaultValue="" disabled={procesando}>
                    <option value="" disabled>Seleccionar empresa...</option>
                    <option value="didimoto">🛵 Didimoto - $2.500</option>
                    <option value="correo">📦 Correo Argentino - $6.500</option>
                    <option value="andreani">🚚 Andreani Express - $8.200</option>
                </select>
                <div style={{marginTop: '15px'}}>
                    <input type="text" name="direccion" placeholder="Calle y Altura" required className="form-input" style={{marginBottom: '10px'}} onChange={handleChange} disabled={procesando}/>
                    <input type="text" name="ciudad" placeholder="Ciudad / Provincia" required className="form-input" onChange={handleChange} disabled={procesando}/>
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

          <button type="submit" className="btn-whatsapp" disabled={procesando} style={{
              background: datos.metodoPago === 'MercadoPago' ? '#009ee3' : '#25D366',
              opacity: procesando ? 0.7 : 1
          }}>
            {procesando ? '⏳ PROCESANDO...' : 
             datos.metodoPago === 'MercadoPago' ? 'PAGAR CON MERCADO PAGO 💳' : 
             'ENVIAR PEDIDO A REVISIÓN 📨'}
          </button>
          
          <button type="button" className="btn-cancel" onClick={onCancelar} disabled={procesando}>
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}