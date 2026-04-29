const fs = require('fs');
const mysql = require('mysql2/promise');

async function main() {
  const sql = fs.readFileSync('C:/xampp/mysql/bin/tesina (13).sql', 'utf8');

  const connection = await mysql.createConnection(
    'mysql://root:ehavCzmDSxtLSIirBpfXRNfSbXUUDjOz@caboose.proxy.rlwy.net:33425/railway'
  );

  console.log('Conectado a Railway. Limpiando tablas parciales...');

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  const tables = [
    'banners',
    'categorias',
    'configuracion_tienda',
    'logs',
    'pedidos',
    'pedido_items',
    'productos',
    'productos_imagenes',
    'proveedores',
    'usuarios'
  ];

  for (const t of tables) {
    try {
      await connection.query(`DROP TABLE IF EXISTS \`${t}\``);
    } catch (err) {
      console.log(`⚠️ No se pudo borrar ${t}:`, err.code || err.message);
    }
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('Preparando SQL...');

  const cleaned = sql
    .replace(/utf8mb4_uca1400_ai_ci/g, 'utf8mb4_unicode_ci')
    .replace(/\/\*![\s\S]*?\*\//g, '')
    .replace(/^--.*$/gm, '')
    .replace(/^SET .*;$/gm, '')
    .replace(/^START TRANSACTION;$/gm, '')
    .replace(/^COMMIT;$/gm, '')
    .trim();

  const statements = cleaned
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  console.log(`Ejecutando ${statements.length} sentencias...`);

  for (const stmt of statements) {
    try {
      await connection.query(stmt);
    } catch (err) {
      console.log('⚠️ Saltando:', err.code || err.message);
    }
  }

  console.log('Importación terminada ✅');
  await connection.end();
}

main().catch(err => {
  console.error('Error al importar:', err);
});