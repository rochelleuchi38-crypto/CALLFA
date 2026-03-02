const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'agriculture_portal',
    multipleStatements: true
  });

  console.log('✓ Connected to database');

  try {
    // Add columns to machinery_bookings table
    console.log('Adding payment columns to machinery_bookings...');
    
    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS payment_status ENUM('Unpaid', 'Partial', 'Paid') DEFAULT 'Unpaid' AFTER status
    `);
    console.log('✓ Added payment_status column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10, 2) DEFAULT 0.00 AFTER total_price
    `);
    console.log('✓ Added total_paid column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER total_paid
    `);
    console.log('✓ Added remaining_balance column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100) AFTER remaining_balance
    `);
    console.log('✓ Added receipt_number column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS payment_date DATE AFTER receipt_number
    `);
    console.log('✓ Added payment_date column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash' AFTER payment_date
    `);
    console.log('✓ Added payment_method column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS payment_recorded_by INT AFTER payment_method
    `);
    console.log('✓ Added payment_recorded_by column');

    await connection.execute(`
      ALTER TABLE machinery_bookings
      ADD COLUMN IF NOT EXISTS last_payment_date DATE AFTER payment_recorded_by
    `);
    console.log('✓ Added last_payment_date column');

    // Create machinery_booking_payments table
    console.log('Creating machinery_booking_payments table...');
    await connection.execute(`
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
        INDEX idx_booking (booking_id),
        INDEX idx_recorded (recorded_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Created machinery_booking_payments table');

    // Create indexes
    console.log('Creating indexes...');
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_machinery_booking_payments_booking ON machinery_booking_payments(booking_id)
    `).catch(() => console.log('  Index already exists: idx_machinery_booking_payments_booking'));

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_machinery_booking_payments_date ON machinery_booking_payments(payment_date)
    `).catch(() => console.log('  Index already exists: idx_machinery_booking_payments_date'));

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_machinery_bookings_payment_status ON machinery_bookings(payment_status)
    `).catch(() => console.log('  Index already exists: idx_machinery_bookings_payment_status'));

    console.log('✓ Created indexes');

    // Update existing bookings
    console.log('Updating existing bookings...');
    await connection.execute(`
      UPDATE machinery_bookings 
      SET remaining_balance = total_price 
      WHERE remaining_balance = 0 AND total_paid = 0
    `);
    console.log('✓ Updated existing bookings');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('✓ Database connection closed');
  }
}

runMigration().catch(console.error);
