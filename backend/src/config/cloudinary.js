const { v2: cloudinary } = require('cloudinary');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Diagnóstico seguro: no muestra claves, solo dice si existen
console.log('--- CLOUDINARY CONFIG ---');
console.log('CLOUD_NAME:', cloudName ? '✅ OK' : '❌ FALTA');
console.log('API_KEY:', apiKey ? '✅ OK' : '❌ FALTA');
console.log('API_SECRET:', apiSecret ? '✅ OK' : '❌ FALTA');

module.exports = cloudinary;