const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agriculture_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    
    console.log('\n✅ Updating Dryer Unit 1 description for clarity...\n');
    
    const newDescription = 'Grain dryer - Maximum 100 kabans per load. Fixed rate: ₱7,500 per load (regardless of quantity up to 100 kabans)';
    
    const [result] = await connection.execute(`
      UPDATE machinery_inventory
      SET description = ?
      WHERE machinery_name = 'Dryer Unit 1'
    `, [newDescription]);
    
    console.log(`✅ Updated ${result.affectedRows} record(s)\n`);
    
    // Show updated info
    const [updated] = await connection.execute(`
      SELECT 
        id,
        machinery_name,
        machinery_type,
        description,
        price_per_unit,
        unit_type,
        max_capacity,
        capacity_unit
      FROM machinery_inventory
      WHERE machinery_name = 'Dryer Unit 1'
    `);
    
    console.log('📋 Updated Dryer Unit 1:\n');
    console.table(updated);
    
    connection.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
