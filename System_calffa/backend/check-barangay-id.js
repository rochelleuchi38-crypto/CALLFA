const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixBarangayId() {
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
    
    console.log('=== Checking Barangay ID Column ===\n');
    
    // Check column properties
    const [columnInfo] = await connection.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);
    
    console.log('Column Information:');
    console.log(columnInfo[0]);
    console.log();
    
    // Check for NULL values
    const [nullCount] = await connection.execute(`
      SELECT COUNT(*) as null_count FROM farmers WHERE barangay_id IS NULL
    `);
    
    console.log(`Farmers with NULL barangay_id: ${nullCount[0].null_count}`);
    
    if (nullCount[0].null_count > 0) {
      console.log('\nFarmers with NULL barangay_id:');
      const [nullFarmers] = await connection.execute(`
        SELECT id, reference_number, full_name, barangay_id FROM farmers WHERE barangay_id IS NULL LIMIT 10
      `);
      console.table(nullFarmers);
      
      // Show the fix
      console.log('\n=== Applying Fix ===');
      console.log('Updating farmers with NULL barangay_id to barangay_id = 1...\n');
      
      const [updateResult] = await connection.execute(`
        UPDATE farmers SET barangay_id = 1 WHERE barangay_id IS NULL
      `);
      
      console.log(`Updated ${updateResult.affectedRows} farmer records`);
    }
    
    // Check foreign key constraint
    const [fkInfo] = await connection.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\nForeign Key Constraint:');
    if (fkInfo.length > 0) {
      console.table(fkInfo);
    } else {
      console.log('⚠️ NO FOREIGN KEY CONSTRAINT FOUND!');
    }
    
    // Check for NOT NULL constraint
    const [isNullable] = await connection.execute(`
      SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);
    
    console.log(`\nNOT NULL Constraint: ${isNullable[0].IS_NULLABLE === 'NO' ? '✅ YES (NOT NULL)' : '❌ NO (allows NULL)'}`);
    
    // Show barangay distribution
    const [distribution] = await connection.execute(`
      SELECT barangay_id, COUNT(*) as farmer_count FROM farmers 
      WHERE barangay_id IS NOT NULL 
      GROUP BY barangay_id 
      ORDER BY barangay_id
      LIMIT 10
    `);
    
    console.log('\nFarmers per Barangay (top 10):');
    console.table(distribution);
    
    connection.release();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nConnection Details:');
    console.error('Host:', process.env.DB_HOST || 'localhost');
    console.error('User:', process.env.DB_USER || 'root');
    console.error('Database:', process.env.DB_NAME);
    console.error('\nMake sure:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials in .env are correct');
    console.error('3. Database exists');
  }
}

checkAndFixBarangayId();
