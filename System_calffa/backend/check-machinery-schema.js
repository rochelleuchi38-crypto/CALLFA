const mysql = require('mysql2/promise');

async function checkMigration() {
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal'
    });

    console.log('Checking machinery_bookings table...');
    const [cols] = await pool.execute('DESCRIBE machinery_bookings');
    console.log('\nColumns:');
    cols.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));

    console.log('\n\nChecking machinery_booking_payments table...');
    const [tables] = await pool.execute('SHOW TABLES LIKE "machinery_booking_payments"');
    if (tables.length > 0) {
      const [paymentCols] = await pool.execute('DESCRIBE machinery_booking_payments');
      console.log('\nPayment columns:');
      paymentCols.forEach(c => console.log(`  - ${c.Field} (${c.Type})`));
    } else {
      console.log('Table does not exist yet');
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMigration();
