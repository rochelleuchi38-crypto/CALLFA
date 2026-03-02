// Apply educational_status migration to farmers table
// Run: node apply-educational-status-migration.js

const pool = require('./db');

async function applyMigration() {
  console.log('🚀 Applying educational_status migration...');
  
  try {
    // Check if column already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'farmers' 
      AND COLUMN_NAME = 'educational_status'
    `);
    
    if (columns.length > 0) {
      console.log('✅ educational_status column already exists in farmers table.');
      process.exit(0);
    }
    
    // Add the educational_status column
    await pool.execute(`
      ALTER TABLE farmers 
      ADD COLUMN educational_status VARCHAR(100) DEFAULT NULL 
      AFTER phone_number
    `);
    
    console.log('✅ Successfully added educational_status column to farmers table.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
