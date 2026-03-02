#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

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

async function addNewRoles() {
  let connection;
  try {
    console.log('\n✨ Adding New Roles (operation_manager, business_manager)');
    console.log('==========================================================\n');
    
    connection = await pool.getConnection();
    
    // Check current column definition
    console.log('📋 Current role column definition:');
    const [columnInfo] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'role'
    `);
    
    console.log(`  Type: ${columnInfo[0].COLUMN_TYPE}`);
    
    // Modify ENUM to include the new roles
    console.log('\n🔄 Adding new roles to ENUM...');
    await connection.execute(`
      ALTER TABLE farmers 
      MODIFY COLUMN role ENUM('admin','farmer','president','treasurer','auditor','operator','agriculturist','operation_manager','business_manager') 
      DEFAULT 'farmer'
    `);
    console.log('✓ New roles added successfully!');
    
    // Verify
    console.log('\n✅ Verification:');
    const [updatedColumn] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'role'
    `);
    
    console.log(`  New type: ${updatedColumn[0].COLUMN_TYPE}`);
    
    console.log('\n✅ Migration completed successfully!\n');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

addNewRoles().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
