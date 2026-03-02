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
    
    console.log('\n🔍 Checking for orphaned/test payments...\n');
    
    // Find payments without valid bookings
    const [orphanedPayments] = await connection.execute(`
      SELECT 
        mbp.id,
        mbp.booking_id,
        mbp.amount,
        mbp.payment_date,
        CASE WHEN mb.id IS NULL THEN '❌ ORPHANED' ELSE '✅ Valid' END as status
      FROM machinery_booking_payments mbp
      LEFT JOIN machinery_bookings mb ON mbp.booking_id = mb.id
      ORDER BY mbp.payment_date DESC
    `);
    
    console.log('📋 All Payments:');
    console.table(orphanedPayments);
    
    const orphanedIds = orphanedPayments
      .filter(p => p.status === '❌ ORPHANED')
      .map(p => p.id);
    
    if (orphanedIds.length > 0) {
      console.log(`\n⚠️  Found ${orphanedIds.length} ORPHANED payments (payment records without valid bookings):`);
      orphanedIds.forEach(id => console.log(`   - Payment ID: ${id}`));
      
      console.log(`\n🗑️  Deleting orphaned payments...`);
      const [result] = await connection.execute(
        `DELETE FROM machinery_booking_payments WHERE id IN (${orphanedIds.join(',')})`
      );
      
      console.log(`✅ Deleted ${result.affectedRows} orphaned payment records\n`);
    } else {
      console.log('\n✅ No orphaned payments found. Database is clean!\n');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
