const mysql = require('mysql2/promise');

async function addCompletionNotesColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal',
      multipleStatements: true
    });

    console.log('✓ Connected to database');

    // Check if completion_notes column already exists
    const [columns] = await connection.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'machinery_bookings' AND COLUMN_NAME = 'completion_notes'"
    );

    if (columns.length > 0) {
      console.log('✓ completion_notes column already exists');
      await connection.end();
      return;
    }

    console.log('Adding completion_notes column...');
    
    // Add the column
    await connection.query(
      'ALTER TABLE machinery_bookings ADD COLUMN completion_notes TEXT NULL AFTER rejection_reason'
    );
    console.log('✓ completion_notes column added successfully');

    // Add index
    try {
      await connection.query(
        'CREATE INDEX idx_machinery_bookings_completion_notes ON machinery_bookings(completion_notes)'
      );
      console.log('✓ Index created successfully');
    } catch (error) {
      console.log('⚠ Index creation warning (may already exist):', error.message);
    }

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCompletionNotesColumn();
