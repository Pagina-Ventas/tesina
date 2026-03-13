import { useEffect, useState } from 'react';
import { Wallet } from '@mercadopago/sdk-react';

export default function BotonMercadoPago({ carrito, pedidoId }) {
  const [preferenceId, setPreferenceId] = useState(null);

  useEffect(() => {
    const crearPreferencia = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/mercadopago/crear-preferencia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pedidoId,
            items: carrito.map(prod => ({
              title: prod.nombre,
              quantity: prod.cantidad,
              unit_price: prod.precio,
            })),
          }),
        });

        const data = await res.json();
        if (data.preferenceId) {
          setPreferenceId(data.preferenceId);
        }
      } catch (error) {
        console.error('Error al pedir preferencia:', error);
      }
    };

    if (carrito?.length > 0) {
      crearPreferencia();
    }
  }, [carrito, pedidoId]);

  if (!preferenceId) return <p>Cargando botón de pago...</p>;

  return (
    <Wallet initialization={{ preferenceId }} />
  );
}