const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'agriculture_portal'
    });

    console.log('🔧 Adding payment columns to machinery_bookings...');
    
    // Add columns one by one
    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN payment_status ENUM("Unpaid", "Partial", "Paid") DEFAULT "Unpaid" AFTER status');
      console.log('✅ Added payment_status');
    } catch (e) {
      console.log('⚠ payment_status:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN total_paid DECIMAL(10, 2) DEFAULT 0.00 AFTER total_price');
      console.log('✅ Added total_paid');
    } catch (e) {
      console.log('⚠ total_paid:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN remaining_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER total_paid');
      console.log('✅ Added remaining_balance');
    } catch (e) {
      console.log('⚠ remaining_balance:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN receipt_number VARCHAR(100) AFTER remaining_balance');
      console.log('✅ Added receipt_number');
    } catch (e) {
      console.log('⚠ receipt_number:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN payment_date DATE AFTER receipt_number');
      console.log('✅ Added payment_date');
    } catch (e) {
      console.log('⚠ payment_date:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT "cash" AFTER payment_date');
      console.log('✅ Added payment_method');
    } catch (e) {
      console.log('⚠ payment_method:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN payment_recorded_by INT AFTER payment_method');
      console.log('✅ Added payment_recorded_by');
    } catch (e) {
      console.log('⚠ payment_recorded_by:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE machinery_bookings ADD COLUMN last_payment_date DATE AFTER payment_recorded_by');
      console.log('✅ Added last_payment_date');
    } catch (e) {
      console.log('⚠ last_payment_date:', e.message);
    }

    console.log('\n🔧 Creating machinery_booking_payments table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS machinery_booking_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        booking_id INT NOT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        receipt_number VARCHAR(100),
        remarks TEXT,
        recorded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES machinery_bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (recorded_by) REFERENCES farmers(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created machinery_booking_payments table');

    console.log('\n🔧 Creating indexes...');
    
    try {
      await pool.execute('CREATE INDEX idx_machinery_booking_payments_booking ON machinery_booking_payments(booking_id)');
      console.log('✅ Created index on booking_id');
    } catch (e) {
      console.log('⚠ Index:', e.message);
    }

    try {
      await pool.execute('CREATE INDEX idx_machinery_booking_payments_date ON machinery_booking_payments(payment_date)');
      console.log('✅ Created index on payment_date');
    } catch (e) {
      console.log('⚠ Index:', e.message);
    }

    try {
      await pool.execute('CREATE INDEX idx_machinery_bookings_payment_status ON machinery_bookings(payment_status)');
      console.log('✅ Created index on payment_status');
    } catch (e) {
      console.log('⚠ Index:', e.message);
    }

    console.log('\n🔧 Updating existing bookings...');
    await pool.execute('UPDATE machinery_bookings SET remaining_balance = total_price WHERE remaining_balance = 0 AND total_paid = 0');
    console.log('✅ Updated remaining balances');

    await pool.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();
