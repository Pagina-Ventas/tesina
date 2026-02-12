const fs = require('fs');
const path = require('path');
const { enviarAlerta } = require('../services/bot.service');

const rutaArchivo = path.join(__dirname, '../data/productos.json');

// Helper para leer DB
const leerDB = () => {
    if (!fs.existsSync(rutaArchivo)) return [];
    const datos = fs.readFileSync(rutaArchivo, 'utf-8');
    return JSON.parse(datos);
};

// Helper para escribir DB
const escribirDB = (datos) => {
    fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2));
};

// 1. Obtener productos
const getProductos = (req, res) => {
    const productos = leerDB();
    res.json(productos);
};

// 2. Crear producto (CORREGIDO)
const createProducto = (req, res) => {
    // 👇 CORRECCIÓN: Usamos leerDB()
    const productos = leerDB() 
    
    const { nombre, precio, categoria, stock, stockMinimo } = req.body
    
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null

    const nuevoProducto = {
        id: Date.now(),
        nombre,
        precio: Number(precio),
        categoria,
        stock: Number(stock),
        stockMinimo: Number(stockMinimo),
        imagen: imagenUrl
    }
    
    productos.push(nuevoProducto)
    
    // 👇 CORRECCIÓN: Usamos escribirDB()
    escribirDB(productos)
    
    res.json({ success: true, producto: nuevoProducto })
}

// 3. Vender Producto
const venderProducto = (req, res) => {
    const idProd = parseInt(req.params.id);
    const cantidadVenta = parseInt(req.params.cantidad);
    
    const productos = leerDB();
    const index = productos.findIndex(p => p.id === idProd);

    if (index === -1) return res.send("❌ Error: Producto no encontrado.");

    if (productos[index].stock < cantidadVenta) {
        return res.send(`❌ Error: No hay suficiente stock. Solo quedan ${productos[index].stock}.`);
    }

    productos[index].stock -= cantidadVenta;
    escribirDB(productos);

    let mensajeRespuesta = `✅ ¡Venta Exitosa! Se vendieron ${cantidadVenta} de ${productos[index].nombre}. Stock restante: ${productos[index].stock}.`;

    if (productos[index].stock <= productos[index].stockMinimo) {
        enviarAlerta(productos[index], true);
        mensajeRespuesta += " 🚨 SE DISPARÓ UNA ALERTA DE STOCK.";
    }

    res.send(mensajeRespuesta);
};

// 4. Verificar Stock Manualmente
const verificarStock = (req, res) => {
    const productos = leerDB();
    let alertas = 0;

    productos.forEach(prod => {
        if (prod.stock <= prod.stockMinimo) {
            enviarAlerta(prod, false);
            alertas++;
        }
    });

    if (alertas > 0) res.send(`Alertas enviadas: ${alertas}`);
    else res.send("Todo en orden ✅");
};

module.exports = {
    getProductos,
    createProducto,
    venderProducto,
    verificarStock
};