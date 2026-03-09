import React, { useState, useEffect } from 'react'
// ✅ CORRECCIÓN: Subimos dos niveles (../../) para llegar a src y luego entrar a style
import '../../style/App.css' 

// ✅ CORRECCIÓN: También ajustamos la ruta del hook, ya que está en src/hooks
import { useMercadoPago } from '../../hooks/useMercadoPago'

export function CheckoutForm({ carrito, totalProductos, onConfirmar, onCancelar }) {
  const [datos, setDatos] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    metodoPago: 'Transferencia',
    tipoEntrega: 'Retiro',
    courier: '',
    email: ''
  })

  // Hook personalizado para Mercado Pago
  const { iniciarPago, cargando: pagandoMP } = useMercadoPago()
  const [procesandoManual, setProcesandoManual] = useState(false)

  // Combinamos ambos estados de carga para bloquear la UI si algo está pasando
  const procesandoTotal = procesandoManual || pagandoMP

  const DATOS_BANCO = {
    cbu: '0000003100000000000000',
    alias: 'IMPERIO.MATE.PRO',
    banco: 'Banco Nación',
    titular: 'Germán Proprietario'
  }

  const COSTOS_ENVIO = {
    didimoto: 2500,
    correo: 6500,
    andreani: 8200
  }

  const costoEnvio =
    datos.tipoEntrega === 'Envio' && datos.courier
      ? COSTOS_ENVIO[datos.courier] || 0
      : 0

  const totalFinal = totalProductos + costoEnvio

  useEffect(() => {
    if (datos.metodoPago === 'Efectivo') {
      setDatos((prev) => ({ ...prev, tipoEntrega: 'Retiro', courier: '' }))
    }
  }, [datos.metodoPago])

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const orden = {
      cliente: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
      direccion:
        datos.tipoEntrega === 'Envio'
          ? `${datos.direccion}, ${datos.ciudad}`
          : 'Retiro en Local',
      items: carrito,
      total: totalFinal,
      metodoPago: datos.metodoPago,
      tipoEntrega: datos.tipoEntrega,
      envio: datos.courier || '-',
      estado: 'PENDIENTE',
      fecha: new Date().toLocaleString()
    }

    // --- ESCENARIO 1: MERCADO PAGO ---
    if (datos.metodoPago === 'MercadoPago') {
      try {
        setProcesandoManual(true)

        // 1. Guardar el pedido primero para obtener ID real de DB
        const pedidoCreado = await onConfirmar(orden, true)
        const idReal = pedidoCreado?.id || pedidoCreado?.pedido?.id || pedidoCreado?.pedidoId

        if (!idReal) {
          throw new Error('No se pudo generar el pedido en la base de datos.')
        }

        // 2. Delegar el pago al Hook (él maneja la redirección al Sandbox)
        await iniciarPago({
          items: carrito,
          cliente: {
            nombre: datos.nombre,
            email: datos.email,
            telefono: datos.telefono
          },
          idPedido: idReal
        })

      } catch (error) {
        console.error('Error en Checkout (MP):', error)
        alert(error.message || 'Hubo un problema con Mercado Pago.')
        setProcesandoManual(false)
      }
      return
    }

    // --- ESCENARIO 2: TRANSFERENCIA / EFECTIVO ---
    try {
      setProcesandoManual(true)
      await onConfirmar(orden, false)
    } catch (error) {
      console.error('Error en Checkout (Manual):', error)
      alert('No se pudo enviar el pedido. Revisá los datos.')
      setProcesandoManual(false)
    }
  }

  return (
    <div className="checkout-overlay">
      <div className="checkout-card">
        <h2 className="checkout-title">Finalizar Compra</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                name="nombre"
                required
                className="form-input"
                onChange={handleChange}
                value={datos.nombre}
                disabled={procesandoTotal}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                required
                className="form-input"
                onChange={handleChange}
                value={datos.telefono}
                disabled={procesandoTotal}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email (Para enviar recibo)</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              onChange={handleChange}
              value={datos.email}
              disabled={procesandoTotal}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Forma de Pago</label>
            <select
              name="metodoPago"
              className="form-input"
              onChange={handleChange}
              value={datos.metodoPago}
              disabled={procesandoTotal}
            >
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="MercadoPago">Mercado Pago (Tarjetas / QR)</option>
              <option value="Efectivo">Efectivo (Solo retiro)</option>
            </select>
          </div>

          {datos.metodoPago === 'Transferencia' && (
            <div className="payment-info-box" style={{ background: '#1a1a2e', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '20px' }}>
              <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>Datos para transferir:</p>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>Alias: <strong>{DATOS_BANCO.alias}</strong></p>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>CBU: {DATOS_BANCO.cbu}</p>
            </div>
          )}

          {datos.metodoPago === 'MercadoPago' && (
            <div className="payment-info-box" style={{ background: 'rgba(0, 158, 227, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid #009ee3', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: '#009ee3', fontWeight: 'bold' }}>¡Estás a un paso!</p>
              <p style={{ fontSize: '0.9rem', color: '#ccc' }}>Al confirmar, serás redirigido a la pasarela segura.</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Método de Entrega</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`filter-btn ${datos.tipoEntrega === 'Retiro' ? 'active' : ''}`}
                onClick={() => setDatos({ ...datos, tipoEntrega: 'Retiro', courier: '' })}
                style={{ flex: 1 }}
                disabled={procesandoTotal}
              >
                🏢 Retiro Local
              </button>

              <button
                type="button"
                className={`filter-btn ${datos.tipoEntrega === 'Envio' ? 'active' : ''}`}
                onClick={() => setDatos({ ...datos, tipoEntrega: 'Envio' })}
                disabled={datos.metodoPago === 'Efectivo' || procesandoTotal}
                style={{ flex: 1, opacity: datos.metodoPago === 'Efectivo' ? 0.5 : 1 }}
              >
                🚚 Envío
              </button>
            </div>
          </div>

          {datos.tipoEntrega === 'Envio' && (
            <div className="shipping-options" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
              <select name="courier" className="form-input" required onChange={handleChange} value={datos.courier} disabled={procesandoTotal}>
                <option value="" disabled>Seleccionar empresa...</option>
                <option value="didimoto">🛵 Didimoto - $2.500</option>
                <option value="correo">📦 Correo Argentino - $6.500</option>
                <option value="andreani">🚚 Andreani Express - $8.200</option>
              </select>
              <div style={{ marginTop: '15px' }}>
                <input type="text" name="direccion" placeholder="Calle y Altura" required className="form-input" style={{ marginBottom: '10px' }} onChange={handleChange} value={datos.direccion} disabled={procesandoTotal} />
                <input type="text" name="ciudad" placeholder="Ciudad / Provincia" required className="form-input" onChange={handleChange} value={datos.ciudad} disabled={procesandoTotal} />
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', color: '#4caf50', fontWeight: '900' }}>
              <span>TOTAL:</span>
              <span>${totalFinal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-whatsapp"
            disabled={procesandoTotal}
            style={{
              background: datos.metodoPago === 'MercadoPago' ? '#009ee3' : '#25D366',
              opacity: procesandoTotal ? 0.7 : 1
            }}
          >
            {procesandoTotal ? '⏳ PROCESANDO...' : datos.metodoPago === 'MercadoPago' ? 'PAGAR CON MERCADO PAGO 💳' : 'ENVIAR PEDIDO A REVISIÓN 📨'}
          </button>

          <button type="button" className="btn-cancel" onClick={onCancelar} disabled={procesandoTotal}>
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}