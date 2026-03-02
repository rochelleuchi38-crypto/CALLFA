// Update old records to have educational_status = 'College Level'
// Run: node update-educational-status.js

const pool = require('./db');

async function updateOldRecords() {
  console.log('🔄 Updating old farmer records with default educational status...');
  
  try {
    // Update all records with NULL or empty educational_status
    const [result] = await pool.execute(
      `UPDATE farmers SET educational_status = 'College Level' WHERE educational_status IS NULL OR educational_status = ''`
    );
    
    console.log(`✅ Updated ${result.affectedRows} records to 'College Level'`);
    
    // Make the column NOT NULL with default
    await pool.execute(
      `ALTER TABLE farmers MODIFY COLUMN educational_status VARCHAR(100) NOT NULL DEFAULT 'College Level'`
    );
    
    console.log('✅ Made educational_status column NOT NULL with default');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateOldRecords();
