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

// 2. Crear producto
const createProducto = (req, res) => {
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
    escribirDB(productos)
    res.json({ success: true, producto: nuevoProducto })
}

// 👇👇👇 3. VENDER PRODUCTO (CORREGIDO Y BLINDADO) 👇👇👇
const venderProducto = async (req, res) => { // <--- Agregamos ASYNC
    const idProd = parseInt(req.params.id);
    const cantidadVenta = parseInt(req.params.cantidad);
    
    console.log(`🛒 Procesando venta... ID: ${idProd}, Cant: ${cantidadVenta}`);

    const productos = leerDB();
    const index = productos.findIndex(p => p.id === idProd);

    if (index === -1) return res.send("❌ Error: Producto no encontrado.");

    // Aseguramos que trabajamos con NÚMEROS
    let stockActual = parseInt(productos[index].stock);
    let stockMin = parseInt(productos[index].stockMinimo);

    if (stockActual < cantidadVenta) {
        return res.send(`❌ Error: No hay suficiente stock. Solo quedan ${stockActual}.`);
    }

    // Restamos stock
    stockActual -= cantidadVenta;
    productos[index].stock = stockActual;
    
    // Guardamos en la base de datos
    escribirDB(productos);

    let mensajeRespuesta = `✅ ¡Venta Exitosa! Se vendieron ${cantidadVenta} de ${productos[index].nombre}. Stock restante: ${stockActual}.`;

    // VERIFICACIÓN DE ALERTA
    console.log(`🔎 Verificando alerta: ¿${stockActual} <= ${stockMin}?`);
    
    if (stockActual <= stockMin) {
        console.log("🚨 CONDICIÓN DE ALERTA CUMPLIDA. Enviando mensaje...");
        try {
            // Esperamos a que el bot envíe el mensaje antes de responder al navegador
            await enviarAlerta(productos[index], true); 
            mensajeRespuesta += " 🚨 SE DISPARÓ UNA ALERTA DE STOCK.";
        } catch (error) {
            console.error("❌ Error enviando alerta:", error);
        }
    } else {
        console.log("👍 Stock saludable, no se envía alerta.");
    }

    res.send(mensajeRespuesta);
};

// 4. Verificar Stock Manualmente
const verificarStock = async (req, res) => { // <--- También agregamos ASYNC aquí por seguridad
    const productos = leerDB();
    let alertas = 0;

    // Usamos un bucle for..of para poder usar await dentro
    for (const prod of productos) {
        if (prod.stock <= prod.stockMinimo) {
            await enviarAlerta(prod, false);
            alertas++;
        }
    }

    if (alertas > 0) res.send(`✅ Se enviaron ${alertas} alertas a Telegram.`);
    else res.send("👍 Todo el stock está saludable. No hay alertas.");
};

module.exports = {
    getProductos,
    createProducto,
    venderProducto,
    verificarStock
};