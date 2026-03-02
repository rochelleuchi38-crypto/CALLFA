const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agriculture_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const conn = await pool.getConnection();
    
    // Get a specific booking to test with
    const [bookings] = await conn.execute('SELECT id, farmer_id, status, total_price FROM machinery_bookings WHERE id = ?', [25]);
    
    if (!bookings.length) {
      console.log('Booking not found');
      conn.release();
      process.exit(0);
    }
    
    const booking = bookings[0];
    console.log('Testing with booking:', booking);
    
    // Test the collection insert
    try {
      const [result] = await conn.execute(
        `INSERT INTO machinery_booking_payments 
         (booking_id, payment_date, amount, payment_method, receipt_number, remarks, recorded_by, payment_type, interest_amount, interest_applied, interest_season)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [booking.id, '2026-02-10', 1000, 'cash', 'RCP001', 'Test', booking.farmer_id, 'partial', 40, 1, 1]
      );
      console.log('Insert successful! ID:', result.insertId);
    } catch (insertError) {
      console.log('Insert error:', insertError.message);
    }
    
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
