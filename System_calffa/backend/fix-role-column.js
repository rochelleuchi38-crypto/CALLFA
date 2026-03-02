#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function runMigration() {
  let connection;
  try {
    console.log('\n🔧 Role Column Fix Migration');
    console.log('============================\n');
    
    connection = await pool.getConnection();
    
    // Check current column definition
    console.log('📋 Checking current role column definition...');
    const [currentColumn] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' 
      AND COLUMN_NAME = 'role'
    `);
    
    if (currentColumn.length > 0) {
      console.log('Current column definition:');
      console.log(`  Type: ${currentColumn[0].COLUMN_TYPE}`);
      console.log(`  Default: ${currentColumn[0].COLUMN_DEFAULT}`);
      console.log(`  Nullable: ${currentColumn[0].IS_NULLABLE}`);
    } else {
      console.error('❌ Role column not found!');
      return;
    }
    
    // Modify role column to be larger and NOT NULL
    console.log('\n🔄 Modifying role column...');
    await connection.execute(`
      ALTER TABLE farmers 
      MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'farmer' 
      COMMENT 'User role: farmer, admin, president, treasurer, auditor, operator, agriculturist, operation_manager, business_manager'
    `);
    console.log('✓ Role column modified to VARCHAR(50) NOT NULL');
    
    // Try to add constraint (might fail if it already exists)
    console.log('\n🔒 Adding role validation constraint...');
    try {
      await connection.execute(`
        ALTER TABLE farmers 
        ADD CONSTRAINT check_valid_role CHECK (
          role IN ('farmer', 'admin', 'president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager')
        )
      `);
      console.log('✓ Constraint added');
    } catch (constraintErr) {
      if (constraintErr.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Constraint already exists');
      } else {
        console.warn(`⚠️  Constraint warning: ${constraintErr.message}`);
      }
    }
    
    // Verify the changes
    console.log('\n✅ Verifying changes...');
    const [verifyColumn] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'farmers' 
      AND COLUMN_NAME = 'role'
    `);
    
    console.log('Updated column definition:');
    console.log(`  Type: ${verifyColumn[0].COLUMN_TYPE}`);
    console.log(`  Default: ${verifyColumn[0].COLUMN_DEFAULT}`);
    console.log(`  Nullable: ${verifyColumn[0].IS_NULLABLE}`);
    
    // Check for any NULL roles
    console.log('\n🔍 Checking for NULL roles in database...');
    const [nullRoles] = await connection.execute(`
      SELECT COUNT(*) as count FROM farmers WHERE role IS NULL OR role = ''
    `);
    
    if (nullRoles[0].count > 0) {
      console.log(`⚠️  Found ${nullRoles[0].count} farmer(s) with NULL or empty role`);
      console.log('🔄 Updating NULL roles to "farmer" (default)...');
      
      const [updateResult] = await connection.execute(`
        UPDATE farmers SET role = 'farmer' WHERE role IS NULL OR role = ''
      `);
      console.log(`✓ Updated ${updateResult.affectedRows} farmer(s)`);
    } else {
      console.log('✓ No NULL roles found');
    }
    
    // Show sample of roles in database
    console.log('\n📊 Current role distribution:');
    const [roleCounts] = await connection.execute(`
      SELECT role, COUNT(*) as count 
      FROM farmers 
      GROUP BY role 
      ORDER BY count DESC
    `);
    
    roleCounts.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });
    
    console.log('\n✅ Migration completed successfully!\n');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

// Run migration
runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
