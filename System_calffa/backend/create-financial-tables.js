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

async function createFinancialTables() {
  try {
    const connection = await pool.getConnection();
    
    console.log('Creating machinery financial management tables...\n');
    
    // Read and execute the migration
    const migrationPath = path.join(__dirname, 'migrations', 'create_machinery_financial_management_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        const tableName = statement.match(/CREATE TABLE[S]* IF NOT EXISTS (\w+)/i)?.[1] || 'statement';
        console.log('✓', tableName);
      }
    }
    
    console.log('\n✓ All financial management tables created successfully!');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

createFinancialTables();
