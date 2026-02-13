const fs = require('fs')
const path = require('path')
const { enviarAlerta } = require('../services/bot.service') // 👈 Importamos al Bot

const rutaPedidos = path.join(__dirname, '../data/pedidos.json')
const rutaProductos = path.join(__dirname, '../data/productos.json') // 👈 Necesitamos leer productos

// --- HELPERS ---
const leerPedidos = () => {
    if (!fs.existsSync(rutaPedidos)) return []
    const datos = fs.readFileSync(rutaPedidos, 'utf-8')
    return JSON.parse(datos)
}
const escribirPedidos = (datos) => fs.writeFileSync(rutaPedidos, JSON.stringify(datos, null, 2))

const leerProductos = () => {
    if (!fs.existsSync(rutaProductos)) return []
    const datos = fs.readFileSync(rutaProductos, 'utf-8')
    return JSON.parse(datos)
}
const escribirProductos = (datos) => fs.writeFileSync(rutaProductos, JSON.stringify(datos, null, 2))

// --- CONTROLADORES ---

// 1. Obtener todos los pedidos
const getPedidos = (req, res) => {
    const pedidos = leerPedidos()
    res.json(pedidos.reverse())
}

// 2. Crear nuevo pedido (Cliente compra en la web)
const createPedido = (req, res) => {
    const pedidos = leerPedidos()
    const nuevoPedido = req.body
    
    // Opcional: Podrías reservar stock aquí, pero lo haremos al confirmar para simplificar
    pedidos.push(nuevoPedido)
    escribirPedidos(pedidos)
    
    res.json({ success: true, pedido: nuevoPedido })
}

// 3. ACTUALIZAR ESTADO (AQUÍ OCURRE LA MAGIA 🪄)
const updatePedido = async (req, res) => { // 👈 Agregamos ASYNC
    const id = parseInt(req.params.id)
    const { estado } = req.body 

    const pedidos = leerPedidos()
    const index = pedidos.findIndex(p => p.id === id)

    if (index !== -1) {
        // Verificar si estamos confirmando el pedido (Pasando a PAGADO)
        // Y asegurarnos de no descontar stock dos veces (si ya estaba pagado)
        if (estado === 'PAGADO' && pedidos[index].estado !== 'PAGADO') {
            console.log("✅ Confirmando pedido... Descontando stock y verificando alertas.");
            
            const productos = leerProductos();
            const itemsPedido = pedidos[index].items;

            // Recorremos cada producto comprado en este pedido
            for (const item of itemsPedido) {
                const prodIndex = productos.findIndex(p => p.id === item.id);
                
                if (prodIndex !== -1) {
                    // 1. Restar Stock Real
                    let stockActual = parseInt(productos[prodIndex].stock);
                    const cantidadComprada = parseInt(item.cantidad || 1);
                    
                    stockActual -= cantidadComprada;
                    if (stockActual < 0) stockActual = 0; // Evitar negativos

                    productos[prodIndex].stock = stockActual;

                    // 2. Chequear Alerta de Stock Bajo
                    const stockMin = parseInt(productos[prodIndex].stockMinimo);
                    
                    if (stockActual <= stockMin) {
                        console.log(`🚨 ALERTA: ${productos[prodIndex].nombre} bajó a ${stockActual}`);
                        try {
                            await enviarAlerta(productos[prodIndex], true); // true = es venta
                        } catch (error) {
                            console.error("Error enviando alerta:", error);
                        }
                    }
                }
            }
            // Guardamos los cambios de stock en productos.json
            escribirProductos(productos);
        }

        // Actualizamos el estado del pedido
        pedidos[index].estado = estado
        escribirPedidos(pedidos)
        
        res.json({ success: true, pedido: pedidos[index] })
    } else {
        res.status(404).json({ error: 'Pedido no encontrado' })
    }
}

module.exports = { getPedidos, createPedido, updatePedido }