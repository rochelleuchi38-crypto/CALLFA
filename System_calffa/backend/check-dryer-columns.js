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
    
    // Check table structure
    const [columns] = await connection.execute(`
      DESCRIBE machinery_inventory
    `);
    
    console.log('\n📋 Machinery Inventory Table Structure:\n');
    console.table(columns);
    
    // Find Dryer Unit 1
    const [machinery] = await connection.execute(`
      SELECT * FROM machinery_inventory
      WHERE machinery_name LIKE '%Dryer%' OR machinery_type = 'Dryer'
    `);
    
    console.log('\n🔍 Current Dryer Machinery:');
    if (machinery.length > 0) {
      machinery.forEach((m, idx) => {
        console.log(`\n--- Dryer ${idx + 1} ---`);
        Object.keys(m).forEach(key => {
          console.log(`${key}: ${m[key]}`);
        });
      });
    } else {
      console.log('No Dryer machinery found');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
