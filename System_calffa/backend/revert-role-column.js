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

async function revertChanges() {
  let connection;
  try {
    console.log('\n🔄 Reverting Role Column Changes');
    console.log('==================================\n');
    
    connection = await pool.getConnection();
    
    // Step 1: Check current constraints
    console.log('📋 Checking for constraints...');
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'role'
    `).catch(() => [[]]);
    
    console.log(`Found ${constraints.length} constraint(s)`);
    constraints.forEach(c => console.log(`  - ${c.CONSTRAINT_NAME}`));
    
    // Step 2: Drop check constraint if it exists
    console.log('\n🗑️  Removing check constraints...');
    try {
      await connection.execute('ALTER TABLE farmers DROP CONSTRAINT check_valid_role');
      console.log('✓ Constraint check_valid_role removed');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️  Constraint does not exist');
      } else {
        console.warn(`⚠️  ${err.message}`);
      }
    }
    
    // Step 3: Revert column back to ENUM
    console.log('\n🔄 Reverting column to original ENUM type...');
    await connection.execute(`
      ALTER TABLE farmers 
      MODIFY COLUMN role ENUM('admin','farmer','president','treasurer','auditor','operator','agriculturist') 
      DEFAULT 'farmer'
    `);
    console.log('✓ Column reverted to ENUM');
    
    // Step 4: Update any invalid roles back to default
    console.log('\n🔧 Updating invalid roles to default...');
    const [invalidRoles] = await connection.execute(`
      SELECT id, full_name, role 
      FROM farmers 
      WHERE role NOT IN ('admin','farmer','president','treasurer','auditor','operator','agriculturist','operation_manager','business_manager')
      OR role IS NULL
    `);
    
    if (invalidRoles.length > 0) {
      console.log(`Found ${invalidRoles.length} farmer(s) with invalid roles`);
      invalidRoles.forEach(farmer => {
        console.log(`  - ${farmer.full_name}: "${farmer.role}"`);
      });
      
      const [updateResult] = await connection.execute(`
        UPDATE farmers 
        SET role = 'farmer' 
        WHERE role NOT IN ('admin','farmer','president','treasurer','auditor','operator','agriculturist')
        OR role IS NULL
      `);
      console.log(`✓ Updated ${updateResult.affectedRows} farmer(s) to default role`);
    } else {
      console.log('✓ All roles are valid for ENUM');
    }
    
    // Step 5: Verify
    console.log('\n✅ Verification...');
    const [column] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'role'
    `);
    
    console.log('Current column definition:');
    console.log(`  Type: ${column[0].COLUMN_TYPE}`);
    console.log(`  Default: ${column[0].COLUMN_DEFAULT}`);
    console.log(`  Nullable: ${column[0].IS_NULLABLE}`);
    
    console.log('\n✅ Revert completed successfully!\n');
    
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

revertChanges().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
