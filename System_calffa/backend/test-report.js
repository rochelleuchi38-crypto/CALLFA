const pool = require('./db');

const testReport = async () => {
  try {
    const now = new Date();
    const dateStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    console.log('Testing report for:', dateStart, 'to', dateEnd);
    
    // Test collections query with all joins
    const [collections] = await pool.execute(`
      SELECT 
        mbp.id,
        mbp.payment_date as date,
        'Collection' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        CONCAT('Payment for Booking #', mbp.booking_id, 
          CASE WHEN mbp.payment_type = 'full' THEN ' (Full Payment)' ELSE ' (Partial Payment)' END) as description,
        mbp.amount,
        f.full_name as farmer_name,
        mbp.booking_id,
        mbp.payment_type,
        mbp.interest_amount,
        mbp.interest_applied,
        mbp.interest_season
      FROM machinery_booking_payments mbp
      LEFT JOIN machinery_bookings mb ON mbp.booking_id = mb.id
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE mbp.payment_date BETWEEN ? AND ?
    `, [dateStart, dateEnd]);
    
    console.log('Collections query OK:', collections.length, 'rows');
    
    // Test income query
    const [income] = await pool.execute(`
      SELECT 
        minc.id,
        minc.date_of_income as date,
        'Income' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        CONCAT('Booking #', minc.booking_id, ' - ', COALESCE(minc.remarks, 'Service Income')) as description,
        minc.income_amount as amount,
        f.full_name as farmer_name,
        minc.booking_id
      FROM machinery_income minc
      LEFT JOIN machinery_inventory mi ON minc.machinery_id = mi.id
      LEFT JOIN machinery_bookings mb ON minc.booking_id = mb.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE minc.date_of_income BETWEEN ? AND ?
    `, [dateStart, dateEnd]);
    
    console.log('Income query OK:', income.length, 'rows');
    
    // Test expenses query
    const [expenses] = await pool.execute(`
      SELECT 
        me.id,
        me.date_of_expense as date,
        'Expense' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        me.particulars as description,
        me.total_amount as amount
      FROM machinery_expenses me
      LEFT JOIN machinery_inventory mi ON me.machinery_id = mi.id
      WHERE me.date_of_expense BETWEEN ? AND ?
    `, [dateStart, dateEnd]);
    
    console.log('Expenses query OK:', expenses.length, 'rows');
    
    // Test bookings query
    const [bookings] = await pool.execute(`
      SELECT 
        mb.id,
        mb.booking_date as date,
        'Booking' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        CONCAT('Booking for ', f.full_name, ' - ', mb.purpose) as description,
        mb.status,
        mb.total_price as amount,
        mb.total_paid,
        mb.payment_status,
        f.full_name as farmer_name,
        mb.id as booking_id
      FROM machinery_bookings mb
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE mb.booking_date BETWEEN ? AND ?
    `, [dateStart, dateEnd]);
    
    console.log('Bookings query OK:', bookings.length, 'rows');
    
    console.log('\nAll queries passed!');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
};

testReport();
