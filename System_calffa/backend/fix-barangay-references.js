const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixInvalidBarangayReferences() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    
    console.log('=== Checking for Invalid Barangay References ===\n');
    
    // Get all barangays
    const [barangays] = await connection.execute(`
      SELECT id, name, status FROM barangays ORDER BY id
    `);
    
    console.log(`Total Barangays: ${barangays.length}`);
    console.log(`Barangay IDs: ${barangays.map(b => b.id).join(', ')}\n`);
    
    // Get all unique barangay_id values in farmers table
    const [farmerBarangayIds] = await connection.execute(`
      SELECT DISTINCT barangay_id FROM farmers WHERE barangay_id IS NOT NULL ORDER BY barangay_id
    `);
    
    console.log(`Unique barangay_id values in farmers table:`);
    console.table(farmerBarangayIds);
    
    // Find invalid references
    const validIds = new Set(barangays.map(b => b.id));
    const invalidIds = farmerBarangayIds
      .map(f => f.barangay_id)
      .filter(id => !validIds.has(id));
    
    if (invalidIds.length > 0) {
      console.log(`\n⚠️ Invalid barangay_id values found: ${invalidIds.join(', ')}\n`);
      
      for (const invalidId of invalidIds) {
        const [farmers] = await connection.execute(`
          SELECT id, reference_number, full_name FROM farmers WHERE barangay_id = ?
        `, [invalidId]);
        
        console.log(`Fixing ${farmers.length} farmers with barangay_id = ${invalidId}...`);
        
        // Update to valid barangay (ID 1)
        await connection.execute(`
          UPDATE farmers SET barangay_id = 1 WHERE barangay_id = ?
        `, [invalidId]);
        
        console.log(`✅ Updated to barangay_id = 1\n`);
      }
    } else {
      console.log('\n✅ All barangay_id values are valid\n');
    }
    
    // Show final distribution
    const [distribution] = await connection.execute(`
      SELECT barangay_id, COUNT(*) as count FROM farmers WHERE barangay_id IS NOT NULL GROUP BY barangay_id ORDER BY barangay_id
    `);
    
    console.log('Final Barangay Distribution:');
    console.table(distribution);
    
    // Now try to create the foreign key
    console.log('\n=== Creating Foreign Key Constraint ===\n');
    
    try {
      await connection.execute(`
        ALTER TABLE farmers ADD CONSTRAINT fk_farmers_barangay 
        FOREIGN KEY (barangay_id) REFERENCES barangays(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key constraint created successfully\n');
    } catch (err) {
      console.error('❌ Foreign key creation failed:', err.message);
      throw err;
    }
    
    // Create indexes
    console.log('Creating performance indexes...');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_barangay_id ON farmers(barangay_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_role_barangay ON farmers(barangay_id, role)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_status_barangay ON farmers(barangay_id, status)');
    console.log('✅ Indexes created\n');
    
    // Verification
    const [fkInfo] = await connection.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('=== Verification ===\n');
    console.log('Foreign Key Constraint:');
    console.table(fkInfo[0]);
    
    const [colInfo] = await connection.execute(`
      SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);
    
    console.log(`\nNOT NULL Constraint: ${colInfo[0].IS_NULLABLE === 'NO' ? '✅ YES' : '❌ NO'}`);
    
    const [nullCount] = await connection.execute('SELECT COUNT(*) as count FROM farmers WHERE barangay_id IS NULL');
    console.log(`Farmers with NULL barangay_id: ${nullCount[0].count} ✅`);
    
    console.log('\n✅ Migration completed successfully!');
    
    connection.release();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixInvalidBarangayReferences();
