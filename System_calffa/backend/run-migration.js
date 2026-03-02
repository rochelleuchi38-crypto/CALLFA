const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Empty password for XAMPP default
      database: 'agriculture_portal',
      multipleStatements: true
    });

    console.log('✓ Connected to database');

    // Read migration file from command line argument or default
    const migrationFileName = process.argv[2] || 'add_farmer_profile_and_logs.sql';
    const migrationFile = migrationFileName.includes('/')
      ? path.join(__dirname, migrationFileName)
      : path.join(__dirname, 'migrations', migrationFileName);
    
    console.log(`📄 Running migration: ${migrationFileName}\n`);
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.query(statement);
        
        // Get first 50 chars for logging
        const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
        console.log(`✓ Statement ${i + 1}/${statements.length}: ${preview}...`);
      } catch (error) {
        const preview = statement.substring(0, 50).replace(/\s+/g, ' ');
        console.log(`⚠ Statement ${i + 1}/${statements.length}: ${preview}...`);
        console.log(`  Error: ${error.message}`);
        
        // Continue with other statements even if one fails
        // This is useful for ALTER TABLE IF NOT EXISTS type statements
      }
    }

    console.log('\n✅ Migration completed!\n');

    // Verify created tables
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'agriculture_portal' 
      AND TABLE_NAME IN ('activity_logs', 'membership_history', 'farmer_documents', 'farmer_contacts')
    `);

    console.log('📊 Verified tables:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });

    // Check new columns in farmers table
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'agriculture_portal' 
      AND TABLE_NAME = 'farmers'
      AND COLUMN_NAME IN ('primary_crop', 'land_area', 'farm_location', 'barangay_id', 'membership_type', 'membership_date', 'last_activity', 'notes')
    `);

    console.log('\n📊 Verified columns in farmers table:');
    columns.forEach(col => {
      console.log(`   ✓ ${col.COLUMN_NAME}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run migration
runMigration();
