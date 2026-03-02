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
    
    console.log('\n🔍 Searching for Dryer Unit 1...\n');
    
    // Find Dryer Unit 1
    const [machinery] = await connection.execute(`
      SELECT 
        id,
        machinery_name,
        machinery_type,
        hourly_rate,
        daily_rate,
        capacity,
        capacity_unit,
        specifications,
        description
      FROM machinery_inventory
      WHERE machinery_name LIKE '%Dryer%' OR machinery_type = 'Dryer'
    `);
    
    if (machinery.length === 0) {
      console.log('❌ No Dryer machinery found');
      connection.release();
      process.exit(0);
    }
    
    console.log('📋 Found Dryer Machinery:');
    console.table(machinery);
    
    // Update Dryer Unit 1
    if (machinery.length > 0) {
      const dryerId = machinery[0].id;
      
      console.log(`\n📝 Updating Dryer Unit 1 (ID: ${dryerId})...\n`);
      console.log('Changes:');
      console.log('  • Hourly Rate: 7500 per load (100 kabans max)');
      console.log('  • Capacity: 100 kabans per load');
      console.log('  • Capacity Unit: kaban\n');
      
      await connection.execute(`
        UPDATE machinery_inventory
        SET 
          hourly_rate = 7500,
          capacity = 100,
          capacity_unit = 'kaban',
          specifications = 'Maximum 100 kabans per load. Rate: ₱7,500 per full load (100 kabans)',
          description = 'Dryer Unit 1 - Capacity: 100 kabans per load. Fixed rate of ₱7,500 per load regardless of quantity (up to 100 kabans)'
        WHERE id = ?
      `, [dryerId]);
      
      console.log('✅ Dryer Unit 1 updated successfully!\n');
      
      // Show updated info
      const [updated] = await connection.execute(`
        SELECT 
          id,
          machinery_name,
          hourly_rate,
          capacity,
          capacity_unit,
          specifications
        FROM machinery_inventory
        WHERE id = ?
      `, [dryerId]);
      
      console.log('Updated Details:');
      console.table(updated);
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
