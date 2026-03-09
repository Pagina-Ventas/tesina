import { useState } from 'react';

const BotonMercadoPago = () => {
  const [cargando, setCargando] = useState(false);

  const manejarPago = async () => {
    setCargando(true);
    try {
      // 1. Preparamos los datos EXACTAMENTE como los pide tu backend
      const datosPedido = {
        idPedido: 101, // Este debería ser el ID real que generes en tu BD al armar el pedido
        items: [
          { 
            nombre: 'Zotac Trinity OC RTX 3090 (Usada)', // La placa que están vendiendo
            cantidad: 1, 
            precio: 850000 
          }
        ],
        cliente: {
          nombre: 'Usuario',
          apellido: 'De Prueba',
          email: 'test_user_123@test.com', // Puedes usar el email de la cuenta compradora aquí
          telefono: '2641234567'
        },
        entrega: {
          cp: '5400',
          calle: 'Av. Libertador',
          numeracion: '123'
        }
      };

      // 2. Hacemos la petición a tu ruta (ajusta el puerto si tu backend no es 3000)
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL}/api/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosPedido),
      });

      const data = await respuesta.json();

      if (data.success) {
        // 3. ¡La magia! Tu backend nos devolvió el link de prueba, redirigimos al usuario ahí
        window.location.href = data.sandbox_init_point; 
      } else {
        alert("Error del servidor: " + data.message);
      }

    } catch (error) {
      console.error("Error al conectar con el backend:", error);
      alert("Hubo un problema al procesar el pago");
    } finally {
      setCargando(false);
    }
  };

  return (
    <button 
      onClick={manejarPago} 
      disabled={cargando}
      style={{ padding: '10px 20px', backgroundColor: '#009ee3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
    >
      {cargando ? 'Preparando pago...' : 'Pagar con Mercado Pago'}
    </button>
  );
};

export default BotonMercadoPago;