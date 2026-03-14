import React, { useState, useEffect } from 'react'
import "../../style/auth.css";
import { useMercadoPago } from '../../hooks/useMercadoPago'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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

  const [recargoTarjetaPorcentaje, setRecargoTarjetaPorcentaje] = useState(0)
  const { iniciarPago, cargando: pagandoMP } = useMercadoPago()
  const [procesandoManual, setProcesandoManual] = useState(false)
  const procesandoTotal = procesandoManual || pagandoMP

  useEffect(() => {
    const fetchConfiguracion = async () => {
      try {
        const res = await fetch(`${API_URL}/api/mercadopago/configuracion`)
        const data = await res.json()
        if (data && data.recargoMP !== undefined) {
          setRecargoTarjetaPorcentaje(Number(data.recargoMP))
        }
      } catch (error) {
        console.error('Error al cargar la configuración de pagos:', error)
      }
    }
    fetchConfiguracion()
  }, [])

  useEffect(() => {
    const userStr = localStorage.getItem('usuarioData')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setDatos(prev => ({
          ...prev,
          nombre: user.nombre || '',
          telefono: user.telefono || '',
          direccion: user.direccion || '',
          ciudad: user.ciudad ? `${user.ciudad}${user.provincia ? `, ${user.provincia}` : ''}` : ''
        }))
      } catch (error) {}
    }
  }, [])

  // 👇 DATOS DEL BANCO ACTUALIZADOS SEGÚN TU PEDIDO
  const DATOS_BANCO = {
    cvu: '4530000800014211011333',
    alias: 'alexiaaubone',
    titular: 'ApoloMate'
  }

  const COSTOS_ENVIO = {
    didimoto: 2500,
    correo: 6500,
    andreani: 8200
  }

  const costoEnvio = datos.tipoEntrega === 'Envio' && datos.courier ? COSTOS_ENVIO[datos.courier] || 0 : 0
  const subTotal = totalProductos + costoEnvio
  const costoRecargoTarjeta = datos.metodoPago === 'MercadoPago' ? (subTotal * (recargoTarjetaPorcentaje / 100)) : 0
  const totalFinal = subTotal + costoRecargoTarjeta

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
      direccion: datos.tipoEntrega === 'Envio' ? `${datos.direccion}, ${datos.ciudad}` : 'Retiro en Local',
      items: carrito,
      total: totalFinal,
      metodoPago: datos.metodoPago,
      tipoEntrega: datos.tipoEntrega,
      envio: datos.courier || '-',
      estado: 'PENDIENTE',
      fecha: new Date().toLocaleString()
    }

    if (datos.metodoPago === 'MercadoPago') {
      try {
        setProcesandoManual(true)
        const pedidoCreado = await onConfirmar(orden, true)
        const idReal = pedidoCreado?.id || pedidoCreado?.pedido?.id || pedidoCreado?.pedidoId

        if (!idReal) {
          throw new Error('No se pudo generar el pedido en la base de datos.')
        }

        const itemsParaMercadoPago = carrito.map(item => ({
          title: item.nombre,
          quantity: item.cantidad,
          unit_price: item.precio
        }));

        if (costoEnvio > 0) {
          itemsParaMercadoPago.push({
            title: `Costo de Envío (${datos.courier})`,
            quantity: 1,
            unit_price: costoEnvio
          });
        }

        if (costoRecargoTarjeta > 0) {
          itemsParaMercadoPago.push({
            title: `Recargo por pago con Tarjeta (${recargoTarjetaPorcentaje}%)`,
            quantity: 1,
            unit_price: Number(costoRecargoTarjeta.toFixed(2))
          });
        }

        await iniciarPago({
          items: itemsParaMercadoPago,
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

    try {
      setProcesandoManual(true)
      await onConfirmar(orden, false)
    } catch (error) {
      console.error('Error en Checkout (Manual):', error)
      alert('No se pudo enviar el pedido. Revisá los datos.')
      setProcesandoManual(false)
    }
  }

  // 👇 ESTILOS UNIFICADOS PARA INPUTS
  const inputStyle = {
    width: '100%', padding: '12px 15px', borderRadius: '8px', 
    background: '#0a0a0a', border: '1px solid #333', color: '#fff', 
    boxSizing: 'border-box', outline: 'none'
  };

  return (
    <div className="checkout-overlay" style={{ zIndex: 9999, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <div className="checkout-card" style={{ 
        maxHeight: '90vh', overflowY: 'auto', background: '#121212', 
        border: '1px solid #c5a059', borderRight: '5px solid #c5a059', 
        borderRadius: '20px', padding: '40px 30px', maxWidth: '450px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px' }}>
          <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2.4rem', color: '#fff', margin: '0 auto' }}>Finalizar Compra</h2>
          <button onClick={onCancelar} style={{ background: 'transparent', border: 'none', color: '#a0a0a0', fontSize: '1.5rem', cursor: 'pointer', position: 'absolute', right: '35px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Nombre</label>
              <input type="text" name="nombre" required style={inputStyle} onChange={handleChange} value={datos.nombre} disabled={procesandoTotal} />
            </div>

            <div className="form-group">
              <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Teléfono</label>
              <input type="tel" name="telefono" required style={inputStyle} onChange={handleChange} value={datos.telefono} disabled={procesandoTotal} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Email (Para enviar recibo)</label>
            <input type="email" name="email" required style={inputStyle} onChange={handleChange} value={datos.email} disabled={procesandoTotal} />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '8px', display: 'block', fontWeight: 'bold' }}>Forma de Pago</label>
            <select name="metodoPago" style={{...inputStyle, padding: '14px 15px', cursor: 'pointer'}} onChange={handleChange} value={datos.metodoPago} disabled={procesandoTotal}>
              <option value="Transferencia">Transferencia Bancaria (Sin recargo)</option>
              <option value="MercadoPago">Mercado Pago (Tarjetas)</option>
              <option value="Efectivo">Efectivo (Solo retiro)</option>
            </select>
          </div>

          {/* CAJA DE TRANSFERENCIA CON ESTILO OSCURO Y DATOS NUEVOS */}
          {datos.metodoPago === 'Transferencia' && (
            <div style={{ background: '#1e1e2f', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Titular:</span>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{DATOS_BANCO.titular}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Alias:</span>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{DATOS_BANCO.alias}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>CVU:</span>
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{DATOS_BANCO.cvu}</span>
                </div>
              </div>
            </div>
          )}

          {/* AVISO DE MERCADO PAGO */}
          {datos.metodoPago === 'MercadoPago' && (
            <div style={{ background: 'rgba(0, 158, 227, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid #009ee3', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: '#009ee3', fontWeight: 'bold', margin: '0 0 5px 0' }}>Pago con Tarjeta / Mercado Pago</p>
              <p style={{ fontSize: '0.9rem', color: '#fff', margin: '0' }}>
                Se aplicará un recargo del <strong>{recargoTarjetaPorcentaje}%</strong>.
              </p>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '10px', display: 'block', fontWeight: 'bold' }}>Método de Entrega</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDatos({ ...datos, tipoEntrega: 'Retiro', courier: '' })}
                style={{ flex: 1, padding: '12px', borderRadius: '30px', border: '1px solid #333', fontWeight: 'bold', transition: 'all 0.3s', cursor: 'pointer', background: datos.tipoEntrega === 'Retiro' ? '#fff' : 'transparent', color: datos.tipoEntrega === 'Retiro' ? '#000' : '#a0a0a0' }}
                disabled={procesandoTotal}
              >
                🏢 RETIRO LOCAL
              </button>

              <button
                type="button"
                onClick={() => setDatos({ ...datos, tipoEntrega: 'Envio' })}
                style={{ flex: 1, padding: '12px', borderRadius: '30px', border: '1px solid #333', fontWeight: 'bold', transition: 'all 0.3s', cursor: datos.metodoPago === 'Efectivo' ? 'not-allowed' : 'pointer', background: datos.tipoEntrega === 'Envio' ? '#333' : 'transparent', color: datos.tipoEntrega === 'Envio' ? '#fff' : '#a0a0a0', opacity: datos.metodoPago === 'Efectivo' ? 0.3 : 1 }}
                disabled={datos.metodoPago === 'Efectivo' || procesandoTotal}
              >
                🚚 ENVÍO
              </button>
            </div>
          </div>

          {datos.tipoEntrega === 'Envio' && (
            <div style={{ background: 'transparent', marginBottom: '25px' }}>
              <select name="courier" required onChange={handleChange} value={datos.courier} disabled={procesandoTotal} style={{...inputStyle, marginBottom: '10px', cursor: 'pointer'}}>
                <option value="" disabled>Seleccionar empresa...</option>
                <option value="didimoto">🛵 Didimoto - $2.500</option>
                <option value="correo">📦 Correo Argentino - $6.500</option>
                <option value="andreani">🚚 Andreani Express - $8.200</option>
              </select>
              <input type="text" name="direccion" placeholder="Calle y Altura" required style={{...inputStyle, marginBottom: '10px'}} onChange={handleChange} value={datos.direccion} disabled={procesandoTotal} />
              <input type="text" name="ciudad" placeholder="Ciudad / Provincia" required style={inputStyle} onChange={handleChange} value={datos.ciudad} disabled={procesandoTotal} />
            </div>
          )}

          <div style={{ paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a0a0a0', fontSize: '0.9rem' }}>
              <span>Subtotal Productos:</span>
              <span>${totalProductos.toLocaleString('es-AR')}</span>
            </div>
            
            {costoEnvio > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a0a0a0', fontSize: '0.9rem' }}>
                <span>Costo Envío:</span>
                <span>+ ${costoEnvio.toLocaleString('es-AR')}</span>
              </div>
            )}

            {costoRecargoTarjeta > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#009ee3', fontSize: '0.9rem' }}>
                <span>Recargo Tarjeta ({recargoTarjetaPorcentaje}%):</span>
                <span>+ ${costoRecargoTarjeta.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', color: '#22c55e', fontWeight: '900', marginTop: '10px' }}>
              <span style={{color: '#22c55e'}}>TOTAL FINAL:</span>
              <span>${totalFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={procesandoTotal}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: procesandoTotal ? 'not-allowed' : 'pointer', transition: 'all 0.3s', marginTop: '25px',
              background: datos.metodoPago === 'MercadoPago' ? '#009ee3' : '#22c55e', 
              color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            {procesandoTotal ? '⏳ PROCESANDO...' : datos.metodoPago === 'MercadoPago' ? 'PAGAR CON MERCADO PAGO 💳' : 'ENVIAR PEDIDO A REVISIÓN 📨'}
          </button>

        </form>
      </div>
    </div>
  )
}