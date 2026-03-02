const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agriculture_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function dropCompletionNotes() {
  try {
    const connection = await pool.getConnection();
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, 'migrations', 'drop_completion_notes_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('✓', statement.trim().split('\n')[0]);
      }
    }
    
    console.log('\n✓ Migration completed successfully!');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

dropCompletionNotes();
