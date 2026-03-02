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
    const connection = await pool.getConnection();
    
    // Check all payments
    const [payments] = await connection.execute(`
      SELECT 
        mbp.id, 
        mbp.booking_id, 
        mbp.amount, 
        mbp.payment_date, 
        mbp.receipt_number,
        mbp.remarks,
        f.full_name as farmer_name, 
        mi.machinery_name
      FROM machinery_booking_payments mbp
      LEFT JOIN machinery_bookings mb ON mbp.booking_id = mb.id
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      ORDER BY mbp.payment_date DESC
    `);
    
    console.log('\n✅ Payment Records Found:', payments.length);
    console.log('=====================================');
    payments.forEach(p => {
      console.log(`\nID: ${p.id}`);
      console.log(`Farmer: ${p.farmer_name}`);
      console.log(`Machinery: ${p.machinery_name}`);
      console.log(`Amount: ₱${p.amount}`);
      console.log(`Date: ${p.payment_date}`);
      console.log(`Receipt: ${p.receipt_number || 'N/A'}`);
      console.log(`Remarks: ${p.remarks || 'N/A'}`);
    });
    
    connection.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
