const mysql = require('mysql2/promise');
require('dotenv').config();

async function applyMigration() {
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
    
    console.log('=== Applying Barangay Foreign Key Migration ===\n');
    
    // Step 1: Drop existing foreign key if it exists
    try {
      console.log('Step 1: Dropping existing foreign key (if exists)...');
      await connection.execute('ALTER TABLE farmers DROP FOREIGN KEY fk_farmers_barangay');
      console.log('✅ Foreign key dropped\n');
    } catch (err) {
      console.log('ℹ️ No existing foreign key to drop (or already dropped)\n');
    }
    
    // Step 2: Update NULL barangay_id values
    console.log('Step 2: Updating NULL barangay_id values to 1...');
    const [updateResult] = await connection.execute('UPDATE farmers SET barangay_id = 1 WHERE barangay_id IS NULL');
    console.log(`✅ Updated ${updateResult.affectedRows} records\n`);
    
    // Step 3: Modify column to NOT NULL
    console.log('Step 3: Setting barangay_id to NOT NULL...');
    await connection.execute('ALTER TABLE farmers MODIFY COLUMN barangay_id INT NOT NULL');
    console.log('✅ Column set to NOT NULL\n');
    
    // Step 4: Add foreign key constraint
    console.log('Step 4: Creating foreign key constraint...');
    await connection.execute(`
      ALTER TABLE farmers ADD CONSTRAINT fk_farmers_barangay 
      FOREIGN KEY (barangay_id) REFERENCES barangays(id) 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);
    console.log('✅ Foreign key constraint created\n');
    
    // Step 5: Create indexes
    console.log('Step 5: Creating performance indexes...');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_barangay_id ON farmers(barangay_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_role_barangay ON farmers(barangay_id, role)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_farmers_status_barangay ON farmers(barangay_id, status)');
    console.log('✅ Indexes created\n');
    
    // Step 6: Update column comment
    console.log('Step 6: Updating column comment...');
    await connection.execute(`
      ALTER TABLE farmers MODIFY COLUMN barangay_id INT NOT NULL 
      COMMENT 'Foreign key reference to barangays table - required for all farmers'
    `);
    console.log('✅ Column comment updated\n');
    
    // Verification
    console.log('=== Verification ===\n');
    
    const [columnInfo] = await connection.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);
    console.log('Column Properties:');
    console.table(columnInfo[0]);
    
    const [fkInfo] = await connection.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\nForeign Key Constraint:');
    if (fkInfo.length > 0) {
      console.table(fkInfo[0]);
      console.log('✅ FOREIGN KEY CONSTRAINT CREATED');
    }
    
    const [nullCount] = await connection.execute('SELECT COUNT(*) as null_count FROM farmers WHERE barangay_id IS NULL');
    console.log(`\nFarmers with NULL barangay_id: ${nullCount[0].null_count} ✅`);
    
    const [totalCount] = await connection.execute('SELECT COUNT(*) as total FROM farmers');
    console.log(`Total farmers: ${totalCount[0].total}`);
    
    const [distribution] = await connection.execute(`
      SELECT barangay_id, COUNT(*) as farmer_count FROM farmers 
      WHERE barangay_id IS NOT NULL 
      GROUP BY barangay_id 
      ORDER BY farmer_count DESC
      LIMIT 10
    `);
    
    console.log('\nFarmers Distribution by Barangay (top 10):');
    console.table(distribution);
    
    console.log('\n✅ Migration Applied Successfully!');
    console.log('\nSummary:');
    console.log('- barangay_id is now NOT NULL');
    console.log('- Foreign key constraint enforces referential integrity');
    console.log('- ON DELETE RESTRICT prevents barangay deletion with farmers');
    console.log('- ON UPDATE CASCADE auto-updates farmer references');
    console.log('- Performance indexes created for optimized queries');
    
    connection.release();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nStack Trace:', err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
