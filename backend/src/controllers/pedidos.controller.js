const fs = require('fs')
const path = require('path')

const rutaArchivo = path.join(__dirname, '../data/pedidos.json')

// Helper para leer/escribir
const leerPedidos = () => {
    if (!fs.existsSync(rutaArchivo)) return []
    const datos = fs.readFileSync(rutaArchivo, 'utf-8')
    return JSON.parse(datos)
}
const escribirPedidos = (datos) => fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2))

// 1. Obtener todos los pedidos
const getPedidos = (req, res) => {
    const pedidos = leerPedidos()
    // Los ordenamos: los más nuevos primero
    res.json(pedidos.reverse())
}

// 2. Crear nuevo pedido (Cuando el cliente compra)
const createPedido = (req, res) => {
    const pedidos = leerPedidos()
    const nuevoPedido = req.body
    
    // Guardamos el pedido tal cual viene del frontend
    pedidos.push(nuevoPedido)
    escribirPedidos(pedidos)
    
    res.json({ success: true, pedido: nuevoPedido })
}

// 3. Actualizar Estado (Cuando el Admin confirma pago)
const updatePedido = (req, res) => {
    const id = parseInt(req.params.id)
    const { estado } = req.body // Esperamos { estado: 'PAGADO' }

    const pedidos = leerPedidos()
    const index = pedidos.findIndex(p => p.id === id)

    if (index !== -1) {
        pedidos[index].estado = estado
        escribirPedidos(pedidos)
        res.json({ success: true, pedido: pedidos[index] })
    } else {
        res.status(404).json({ error: 'Pedido no encontrado' })
    }
}

module.exports = { getPedidos, createPedido, updatePedido }