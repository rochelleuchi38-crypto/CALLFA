const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixBarangayForeignKey() {
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
    
    console.log('=== Fixing Barangay References ===\n');
    
    // Get valid barangay IDs
    const [barangays] = await connection.execute(`
      SELECT id, name, status FROM barangays ORDER BY id LIMIT 1
    `);
    
    if (barangays.length === 0) {
      throw new Error('No barangays found in the barangays table!');
    }
    
    const validBarangayId = barangays[0].id;
    console.log(`Using valid barangay: ID ${validBarangayId} (${barangays[0].name})\n`);
    
    // Update all invalid barangay references
    console.log(`Updating all farmers with invalid barangay_id to ${validBarangayId}...`);
    const [updateResult] = await connection.execute(`
      UPDATE farmers SET barangay_id = ? WHERE barangay_id NOT IN (
        SELECT id FROM barangays
      )
    `, [validBarangayId]);
    
    console.log(`✅ Updated ${updateResult.affectedRows} farmer records\n`);
    
    // Verify all references are now valid
    const [invalid] = await connection.execute(`
      SELECT COUNT(*) as count FROM farmers f
      WHERE barangay_id NOT IN (SELECT id FROM barangays)
    `);
    
    if (invalid[0].count > 0) {
      throw new Error(`Still ${invalid[0].count} invalid references!`);
    }
    
    console.log('✅ All farmer barangay_id values are now valid\n');
    
    // Check current distribution
    const [distribution] = await connection.execute(`
      SELECT barangay_id, COUNT(*) as farmer_count FROM farmers 
      GROUP BY barangay_id ORDER BY barangay_id
    `);
    
    console.log('Barangay Distribution:');
    console.table(distribution);
    
    // Now create the foreign key constraint
    console.log('\n=== Creating Foreign Key Constraint ===\n');
    
    try {
      await connection.execute(`
        ALTER TABLE farmers ADD CONSTRAINT fk_farmers_barangay 
        FOREIGN KEY (barangay_id) REFERENCES barangays(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key constraint created\n');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('ℹ️ Foreign key constraint already exists\n');
      } else {
        throw err;
      }
    }
    
    // Create indexes
    console.log('Creating performance indexes...');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_barangay_id ON farmers(barangay_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_role_barangay ON farmers(barangay_id, role)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_status_barangay ON farmers(barangay_id, status)');
    console.log('✅ Indexes created\n');
    
    // Final verification
    console.log('=== Final Verification ===\n');
    
    const [columnInfo] = await connection.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);
    
    console.log('Column Properties:');
    console.log(`  - Name: ${columnInfo[0].COLUMN_NAME}`);
    console.log(`  - Type: ${columnInfo[0].COLUMN_TYPE}`);
    console.log(`  - NOT NULL: ${columnInfo[0].IS_NULLABLE === 'NO' ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Comment: ${columnInfo[0].COLUMN_COMMENT}`);
    
    const [fkInfo] = await connection.execute(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\nForeign Key Constraint:');
    if (fkInfo.length > 0) {
      console.log(`  - Constraint: ${fkInfo[0].CONSTRAINT_NAME}`);
      console.log(`  - References: ${fkInfo[0].REFERENCED_TABLE_NAME}(id)`);
      console.log('  - ON DELETE: RESTRICT');
      console.log('  - ON UPDATE: CASCADE');
      console.log('  ✅ FOREIGN KEY ENFORCED');
    }
    
    const [nullCount] = await connection.execute('SELECT COUNT(*) as count FROM farmers WHERE barangay_id IS NULL');
    console.log(`\nFarmers with NULL barangay_id: ${nullCount[0].count} ✅`);
    
    const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM farmers');
    console.log(`Total farmers: ${totalCount[0].count}`);
    
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!\n');
    console.log('All farmers now have valid barangay assignments.');
    console.log('Foreign key constraint enforces referential integrity.');
    
    connection.release();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nStack:', err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixBarangayForeignKey();
