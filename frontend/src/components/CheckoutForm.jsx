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
    courier: '',
    email: ''
  })

  const [procesando, setProcesando] = useState(false)

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

    // --- MERCADO PAGO ---
    if (datos.metodoPago === 'MercadoPago') {
      try {
        setProcesando(true)

        // 1) Guardar pedido y recibir el pedido REAL desde backend
        const pedidoCreado = await onConfirmar(orden, true)

        if (!pedidoCreado || !pedidoCreado.id) {
          alert('No se pudo guardar el pedido antes de iniciar el pago.')
          setProcesando(false)
          return
        }

        // 2) Crear preferencia usando el ID REAL del pedido
        const response = await fetch('/api/pagos/crear-preferencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: carrito,
            cliente: {
              nombre: datos.nombre,
              apellido: '',
              email: datos.email,
              telefono: datos.telefono
            },
            entrega: {
              calle: datos.direccion,
              numeracion: 0,
              cp: '',
              ciudad: datos.ciudad
            },
            idPedido: pedidoCreado.id
          })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok || !data?.init_point) {
          alert(data?.message || 'Error al generar el pago. Intenta nuevamente.')
          setProcesando(false)
          return
        }

        // 3) Redirigir a Mercado Pago
        window.location.href = data.init_point
      } catch (error) {
        console.error('Error MP:', error)
        alert('Hubo un problema de conexión con Mercado Pago.')
        setProcesando(false)
      }

      return
    }

    // --- TRANSFERENCIA / EFECTIVO ---
    try {
      setProcesando(true)
      await onConfirmar(orden, false)
    } catch (error) {
      console.error(error)
      alert('No se pudo enviar el pedido.')
      setProcesando(false)
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
                disabled={procesando}
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
                disabled={procesando}
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
              disabled={procesando}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Forma de Pago</label>
            <select
              name="metodoPago"
              className="form-input"
              onChange={handleChange}
              value={datos.metodoPago}
              disabled={procesando}
            >
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="MercadoPago">Mercado Pago (Tarjetas / QR)</option>
              <option value="Efectivo">Efectivo (Solo retiro)</option>
            </select>
          </div>

          {datos.metodoPago === 'Transferencia' && (
            <div
              className="payment-info-box"
              style={{
                background: '#1a1a2e',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                marginBottom: '20px'
              }}
            >
              <p style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '5px' }}>
                Datos para transferir:
              </p>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>
                Alias: <strong>{DATOS_BANCO.alias}</strong>
              </p>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>
                CBU: {DATOS_BANCO.cbu}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
                {DATOS_BANCO.banco} - {DATOS_BANCO.titular}
              </p>
            </div>
          )}

          {datos.metodoPago === 'MercadoPago' && (
            <div
              className="payment-info-box"
              style={{
                background: 'rgba(0, 158, 227, 0.1)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #009ee3',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <p style={{ color: '#009ee3', fontWeight: 'bold', marginBottom: '5px' }}>
                ¡Estás a un paso!
              </p>
              <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
                Al confirmar, serás redirigido a la web segura de Mercado Pago.
              </p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Método de Entrega</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`filter-btn ${datos.tipoEntrega === 'Retiro' ? 'active' : ''}`}
                onClick={() => setDatos({ ...datos, tipoEntrega: 'Retiro', courier: '' })}
                style={{ flex: 1, textAlign: 'center' }}
                disabled={procesando}
              >
                🏢 Retiro Local
              </button>

              <button
                type="button"
                className={`filter-btn ${datos.tipoEntrega === 'Envio' ? 'active' : ''}`}
                onClick={() => setDatos({ ...datos, tipoEntrega: 'Envio' })}
                disabled={datos.metodoPago === 'Efectivo' || procesando}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  opacity: datos.metodoPago === 'Efectivo' ? 0.5 : 1
                }}
              >
                🚚 Envío
              </button>
            </div>
          </div>

          {datos.tipoEntrega === 'Envio' && (
            <div
              className="shipping-options"
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #333'
              }}
            >
              <select
                name="courier"
                className="form-input"
                required
                onChange={handleChange}
                value={datos.courier}
                disabled={procesando}
              >
                <option value="" disabled>
                  Seleccionar empresa...
                </option>
                <option value="didimoto">🛵 Didimoto - $2.500</option>
                <option value="correo">📦 Correo Argentino - $6.500</option>
                <option value="andreani">🚚 Andreani Express - $8.200</option>
              </select>

              <div style={{ marginTop: '15px' }}>
                <input
                  type="text"
                  name="direccion"
                  placeholder="Calle y Altura"
                  required
                  className="form-input"
                  style={{ marginBottom: '10px' }}
                  onChange={handleChange}
                  value={datos.direccion}
                  disabled={procesando}
                />
                <input
                  type="text"
                  name="ciudad"
                  placeholder="Ciudad / Provincia"
                  required
                  className="form-input"
                  onChange={handleChange}
                  value={datos.ciudad}
                  disabled={procesando}
                />
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.4rem',
                color: '#4caf50',
                fontWeight: '900'
              }}
            >
              <span>TOTAL:</span>
              <span>${totalFinal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-whatsapp"
            disabled={procesando}
            style={{
              background: datos.metodoPago === 'MercadoPago' ? '#009ee3' : '#25D366',
              opacity: procesando ? 0.7 : 1
            }}
          >
            {procesando
              ? '⏳ PROCESANDO...'
              : datos.metodoPago === 'MercadoPago'
                ? 'PAGAR CON MERCADO PAGO 💳'
                : 'ENVIAR PEDIDO A REVISIÓN 📨'}
          </button>

          <button type="button" className="btn-cancel" onClick={onCancelar} disabled={procesando}>
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}