const mysql = require('mysql2/promise');

async function fixBarangayIntegrity() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agriculture_portal'
  });

  try {
    console.log('🔍 Checking farmers table structure...\n');
    
    // Check barangay_id column
    const [barangayInfo] = await connection.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);

    if (barangayInfo.length > 0) {
      console.log('Current barangay_id column status:');
      console.log(`  - Type: ${barangayInfo[0].DATA_TYPE}`);
      console.log(`  - Nullable: ${barangayInfo[0].IS_NULLABLE}`);
      console.log(`  - Key: ${barangayInfo[0].COLUMN_KEY || 'None'}`);
    }

    // Check for existing FK constraints
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);

    console.log('\nExisting constraints:');
    if (constraints.length > 0) {
      constraints.forEach(c => {
        console.log(`  - ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}(${c.REFERENCED_COLUMN_NAME})`);
      });
    } else {
      console.log('  - No foreign key constraint found');
    }

    // Check for NULL values in barangay_id
    const [nullCount] = await connection.execute(`
      SELECT COUNT(*) as null_count FROM farmers WHERE barangay_id IS NULL
    `);
    console.log(`\nNULL values in barangay_id: ${nullCount[0].null_count}`);

    // Show sample data
    const [sample] = await connection.execute(`
      SELECT id, reference_number, full_name, barangay_id, status 
      FROM farmers 
      LIMIT 5
    `);
    console.log('\nSample farmer records:');
    sample.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.reference_number}, barangay_id: ${row.barangay_id}, status: ${row.status}`);
    });

    // Fix 1: Make sure barangay_id is NOT NULL
    console.log('\n✅ Setting barangay_id as NOT NULL...');
    try {
      await connection.execute(`
        ALTER TABLE farmers 
        MODIFY COLUMN barangay_id INT NOT NULL
      `);
      console.log('   ✓ barangay_id is now NOT NULL');
    } catch (err) {
      if (err.code === 'ER_INVALID_USE_OF_NULL') {
        console.log('   ⚠️  Cannot set NOT NULL - there are existing NULL values');
        console.log('   💡 Updating NULL barangay_id values to 67 (Camansihan) first...');
        await connection.execute(`UPDATE farmers SET barangay_id = 67 WHERE barangay_id IS NULL`);
        console.log('   ✓ NULL values updated to 67');
        
        // Try again
        await connection.execute(`
          ALTER TABLE farmers 
          MODIFY COLUMN barangay_id INT NOT NULL
        `);
        console.log('   ✓ barangay_id is now NOT NULL');
      } else {
        throw err;
      }
    }

    // Fix 2: Drop existing FK if it exists
    console.log('\n✅ Setting up foreign key constraint...');
    try {
      await connection.execute(`
        ALTER TABLE farmers 
        DROP FOREIGN KEY fk_farmers_barangay
      `);
      console.log('   ✓ Dropped existing FK constraint');
    } catch (err) {
      if (err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('   ℹ️  No existing FK to drop');
      }
    }

    // Fix 3: Create FK constraint
    await connection.execute(`
      ALTER TABLE farmers 
      ADD CONSTRAINT fk_farmers_barangay 
      FOREIGN KEY (barangay_id) 
      REFERENCES barangays(id) 
      ON DELETE RESTRICT 
      ON UPDATE CASCADE
    `);
    console.log('   ✓ Foreign key constraint created');

    // Fix 4: Create indexes for performance
    console.log('\n✅ Setting up indexes...');
    const indexQueries = [
      { name: 'idx_farmers_barangay_id', query: 'CREATE INDEX idx_farmers_barangay_id ON farmers(barangay_id)' },
      { name: 'idx_farmers_barangay_status', query: 'CREATE INDEX idx_farmers_barangay_status ON farmers(barangay_id, status)' },
      { name: 'idx_farmers_barangay_role', query: 'CREATE INDEX idx_farmers_barangay_role ON farmers(barangay_id, role, status)' }
    ];

    for (const idx of indexQueries) {
      try {
        await connection.execute(idx.query);
        console.log(`   ✓ Created index: ${idx.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`   ℹ️  Index already exists: ${idx.name}`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅ All database integrity checks and fixes complete!');
    console.log('\nFinal status:');
    const [finalInfo] = await connection.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);
    if (finalInfo.length > 0) {
      console.log(`  - barangay_id Nullable: ${finalInfo[0].IS_NULLABLE}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixBarangayIntegrity();
