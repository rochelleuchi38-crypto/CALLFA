const mysql = require('mysql2/promise');

async function makeBarangayNullable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agriculture_portal'
  });

  try {
    console.log('Making barangay_id nullable...');
    
    // Make barangay_id nullable
    await connection.execute(`
      ALTER TABLE farmers 
      MODIFY COLUMN barangay_id INT NULL
    `);
    
    console.log('✅ barangay_id column is now nullable');

    // Check the schema
    const [result] = await connection.execute(`
      SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id'
    `);

    if (result.length > 0) {
      console.log('\nCurrent barangay_id column status:');
      console.log(`- Name: ${result[0].COLUMN_NAME}`);
      console.log(`- Nullable: ${result[0].IS_NULLABLE}`);
      console.log(`- Type: ${result[0].DATA_TYPE}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

makeBarangayNullable();
