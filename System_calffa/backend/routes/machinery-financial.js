// Machinery Financial Management Routes
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to verify financial access and get user's barangay
// Admin: can view all (but only profit/reports tabs in frontend)
// President, Auditor: can view their barangay's data (read-only)
// Treasurer: can view and manage their barangay's data
const verifyFinancialAccess = async (req, res, next) => {
  try {
    const userId = req.query.user_id || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const [user] = await pool.execute(
      'SELECT role, barangay_id FROM farmers WHERE id = ?',
      [userId]
    );

    if (user.length === 0 || !['admin', 'president', 'treasurer', 'auditor'].includes(user[0].role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin, president, treasurer, and auditor can access financial management' 
      });
    }

    // Attach user info to request for barangay filtering
    req.userRole = user[0].role;
    req.userBarangayId = user[0].barangay_id;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// Middleware to verify treasurer-only access for write operations
const verifyTreasurerAccess = async (req, res, next) => {
  try {
    const userId = req.query.user_id || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const [user] = await pool.execute(
      'SELECT role, barangay_id FROM farmers WHERE id = ?',
      [userId]
    );

    if (user.length === 0 || user[0].role !== 'treasurer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only treasurers can manage financial records' 
      });
    }

    req.userRole = user[0].role;
    req.userBarangayId = user[0].barangay_id;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// ==================== EXPENSES ====================

// GET machinery expenses with filters (barangay-based)
router.get('/expenses', verifyFinancialAccess, async (req, res) => {
  try {
    const { machinery_id, start_date, end_date, limit = 100, barangay_id } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    let query = `SELECT 
      me.*,
      mi.machinery_name,
      mi.machinery_type,
      mi.barangay_id,
      b.name as barangay_name
    FROM machinery_expenses me
    LEFT JOIN machinery_inventory mi ON me.machinery_id = mi.id
    LEFT JOIN barangays b ON mi.barangay_id = b.id
    WHERE 1=1`;
    const params = [];
    
    // Filter by barangay: admin can filter by selected barangay, others see their own barangay
    if (userRole === 'admin' && barangay_id) {
      query += ' AND mi.barangay_id = ?';
      params.push(barangay_id);
    } else if (userRole !== 'admin' && userBarangayId) {
      query += ' AND mi.barangay_id = ?';
      params.push(userBarangayId);
    }
    
    if (machinery_id && machinery_id !== '') {
      query += ' AND me.machinery_id = ?';
      params.push(parseInt(machinery_id));
    }
    
    if (start_date) {
      query += ' AND me.date_of_expense >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND me.date_of_expense <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY me.date_of_expense DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [expenses] = await pool.execute(query, params);
    res.json({ success: true, expenses, userRole, userBarangayId });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
});

// GET single expense
router.get('/expenses/:id', verifyFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const [expense] = await pool.execute(
      'SELECT * FROM machinery_expenses WHERE id = ?',
      [id]
    );
    
    if (expense.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.json({ success: true, expense: expense[0] });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expense' });
  }
});

// POST create new expense (treasurer only)
router.post('/expenses', verifyTreasurerAccess, async (req, res) => {
  try {
    const {
      machinery_id,
      date_of_expense,
      particulars,
      reference_number,
      total_amount,
      fuel_and_oil = 0,
      labor_cost = 0,
      per_diem = 0,
      repair_and_maintenance = 0,
      office_supply = 0,
      communication_expense = 0,
      utilities_expense = 0,
      sundries = 0,
      user_id
    } = req.body;
    
    if (!machinery_id || !date_of_expense || !particulars || !total_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    if (!reference_number || reference_number.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt/Reference number is required' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO machinery_expenses 
       (machinery_id, date_of_expense, particulars, reference_number, total_amount, 
        fuel_and_oil, labor_cost, per_diem, repair_and_maintenance, office_supply,
        communication_expense, utilities_expense, sundries, record_created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [machinery_id, date_of_expense, particulars, reference_number.trim(), total_amount,
       fuel_and_oil, labor_cost, per_diem, repair_and_maintenance, office_supply,
       communication_expense, utilities_expense, sundries, user_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Expense recorded successfully',
      expense_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
});

// PUT update expense (treasurer only)
router.put('/expenses/:id', verifyTreasurerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_of_expense,
      particulars,
      reference_number,
      total_amount,
      fuel_and_oil,
      labor_cost,
      per_diem,
      repair_and_maintenance,
      office_supply,
      communication_expense,
      utilities_expense,
      sundries
    } = req.body;

    if (!reference_number || reference_number.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Receipt/Reference number is required' 
      });
    }
    
    const [result] = await pool.execute(
      `UPDATE machinery_expenses 
       SET date_of_expense = ?, particulars = ?, reference_number = ?, total_amount = ?,
           fuel_and_oil = ?, labor_cost = ?, per_diem = ?, repair_and_maintenance = ?,
           office_supply = ?, communication_expense = ?, utilities_expense = ?, sundries = ?
       WHERE id = ?`,
      [date_of_expense, particulars, reference_number.trim(), total_amount,
       fuel_and_oil, labor_cost, per_diem, repair_and_maintenance,
       office_supply, communication_expense, utilities_expense, sundries, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.json({ success: true, message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
});

// DELETE expense (treasurer only)
router.delete('/expenses/:id', verifyTreasurerAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'DELETE FROM machinery_expenses WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
});

// ==================== INCOME ====================

// GET machinery income (barangay-based)
router.get('/income', verifyFinancialAccess, async (req, res) => {
  try {
    const { machinery_id, start_date, end_date, limit = 100 } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    // Get income from all bookings with any payments (full or partial)
    let query = `
      SELECT 
        CONCAT('BK-', mb.id) as income_id,
        mb.id as booking_id,
        mb.machinery_id,
        mi.machinery_name,
        mi.machinery_type,
        mi.barangay_id,
        b.name as barangay_name,
        f.full_name as farmer_name,
        mb.booking_date,
        mb.total_price as original_amount,
        COALESCE(mb.total_paid, 0) as income_amount,
        COALESCE(mb.payment_date, mb.updated_at) as date_of_income,
        CASE 
          WHEN mb.total_paid >= mb.total_price THEN 'Full Payment'
          WHEN mb.total_paid > 0 THEN 'Partial Payment'
          ELSE 'Unpaid'
        END as payment_status,
        mb.status as booking_status,
        COALESCE(mb.notes, '') as remarks
      FROM machinery_bookings mb
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN barangays b ON mi.barangay_id = b.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE mb.total_paid > 0
    `;
    const params = [];
    
    // Filter by barangay for non-admin users
    if (userRole !== 'admin' && userBarangayId) {
      query += ' AND mi.barangay_id = ?';
      params.push(userBarangayId);
    }
    
    if (machinery_id && machinery_id !== '') {
      query += ' AND mb.machinery_id = ?';
      params.push(parseInt(machinery_id));
    }
    
    if (start_date) {
      query += ' AND mb.payment_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND mb.payment_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY COALESCE(mb.payment_date, mb.updated_at) DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [income] = await pool.execute(query, params);
    res.json({ success: true, income, userRole, userBarangayId });
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch income' });
  }
});

// POST create income record (treasurer only)
router.post('/income', verifyTreasurerAccess, async (req, res) => {
  try {
    const {
      machinery_id,
      booking_id,
      date_of_income,
      income_amount,
      remarks,
      user_id
    } = req.body;
    
    if (!machinery_id || !booking_id || !date_of_income || !income_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO machinery_income 
       (machinery_id, booking_id, date_of_income, income_amount, remarks, record_created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [machinery_id, booking_id, date_of_income, income_amount, remarks, user_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Income recorded successfully',
      income_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ success: false, message: 'Failed to record income' });
  }
});

// ==================== PROFIT CALCULATIONS ====================

// GET profit summary (barangay-based)
router.get('/profit-summary', verifyFinancialAccess, async (req, res) => {
  try {
    const { start_date, end_date, barangay_id } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    // Income query with barangay filter
    let incomeQuery = `
      SELECT COALESCE(SUM(minc.income_amount), 0) as total_income 
      FROM machinery_income minc
      LEFT JOIN machinery_inventory mi ON minc.machinery_id = mi.id
      WHERE 1=1
    `;
    
    // Expense query with barangay filter
    let expenseQuery = `
      SELECT COALESCE(SUM(me.total_amount), 0) as total_expenses 
      FROM machinery_expenses me
      LEFT JOIN machinery_inventory mi ON me.machinery_id = mi.id
      WHERE 1=1
    `;
    
    const incomeParams = [];
    const expenseParams = [];
    
    // Filter by barangay: admin can filter by selected barangay, others see their own barangay
    if (userRole === 'admin' && barangay_id) {
      incomeQuery += ' AND mi.barangay_id = ?';
      expenseQuery += ' AND mi.barangay_id = ?';
      incomeParams.push(barangay_id);
      expenseParams.push(barangay_id);
    } else if (userRole !== 'admin' && userBarangayId) {
      incomeQuery += ' AND mi.barangay_id = ?';
      expenseQuery += ' AND mi.barangay_id = ?';
      incomeParams.push(userBarangayId);
      expenseParams.push(userBarangayId);
    }
    
    if (start_date) {
      incomeQuery += ' AND minc.date_of_income >= ?';
      expenseQuery += ' AND me.date_of_expense >= ?';
      incomeParams.push(start_date);
      expenseParams.push(start_date);
    }
    
    if (end_date) {
      incomeQuery += ' AND minc.date_of_income <= ?';
      expenseQuery += ' AND me.date_of_expense <= ?';
      incomeParams.push(end_date);
      expenseParams.push(end_date);
    }
    
    const [incomeResult] = await pool.execute(incomeQuery, incomeParams);
    const [expenseResult] = await pool.execute(expenseQuery, expenseParams);
    
    const totalIncome = incomeResult[0].total_income || 0;
    const totalExpenses = expenseResult[0].total_expenses || 0;
    const netProfit = totalIncome - totalExpenses;
    
    res.json({ 
      success: true, 
      summary: {
        total_income: parseFloat(totalIncome),
        total_expenses: parseFloat(totalExpenses),
        net_profit: parseFloat(netProfit)
      },
      userRole,
      userBarangayId
    });
  } catch (error) {
    console.error('Error calculating profit:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate profit' });
  }
});

// GET expense breakdown by category (barangay-based)
router.get('/expenses-breakdown', verifyFinancialAccess, async (req, res) => {
  try {
    const { start_date, end_date, barangay_id } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    let query = `
      SELECT 
        SUM(me.fuel_and_oil) as fuel_and_oil,
        SUM(me.labor_cost) as labor_cost,
        SUM(me.per_diem) as per_diem,
        SUM(me.repair_and_maintenance) as repair_and_maintenance,
        SUM(me.office_supply) as office_supply,
        SUM(me.communication_expense) as communication_expense,
        SUM(me.utilities_expense) as utilities_expense,
        SUM(me.sundries) as sundries,
        SUM(me.total_amount) as total
      FROM machinery_expenses me
      LEFT JOIN machinery_inventory mi ON me.machinery_id = mi.id
      WHERE 1=1
    `;
    const params = [];
    
    // Filter by barangay: admin can filter by selected barangay, others see their own barangay
    if (userRole === 'admin' && barangay_id) {
      query += ' AND mi.barangay_id = ?';
      params.push(barangay_id);
    } else if (userRole !== 'admin' && userBarangayId) {
      query += ' AND mi.barangay_id = ?';
      params.push(userBarangayId);
    }
    
    if (start_date) {
      query += ' AND me.date_of_expense >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND me.date_of_expense <= ?';
      params.push(end_date);
    }
    
    const [breakdown] = await pool.execute(query, params);
    res.json({ success: true, breakdown: breakdown[0] });
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expense breakdown' });
  }
});

// ==================== ACCOUNTS RECEIVABLE & COLLECTIONS ====================

// GET Accounts Receivable list with summary (barangay-based)
router.get('/ar', verifyFinancialAccess, async (req, res) => {
  try {
    const { machinery_id } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    let query = `
      SELECT 
        mb.id,
        mb.farmer_id,
        f.full_name as farmer_name,
        f.barangay_id as farmer_barangay_id,
        mb.machinery_id,
        mi.machinery_name,
        mi.machinery_type,
        mi.barangay_id,
        b.name as barangay_name,
        mb.booking_date,
        mb.total_price,
        COALESCE(mb.total_paid, 0) as amount_collected,
        (mb.total_price - COALESCE(mb.total_paid, 0)) as remaining_balance,
        mb.status as booking_status,
        mb.payment_status
      FROM machinery_bookings mb
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN barangays b ON mi.barangay_id = b.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE mb.status = 'Completed' AND (mb.total_price - COALESCE(mb.total_paid, 0)) > 0
    `;
    const params = [];
    
    // Filter by barangay for non-admin users (collectibles from their barangay)
    if (userRole !== 'admin' && userBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(userBarangayId);
    }
    
    if (machinery_id && machinery_id !== '') {
      query += ' AND mb.machinery_id = ?';
      params.push(parseInt(machinery_id));
    }
    
    query += ' ORDER BY mb.booking_date DESC';
    
    const [arList] = await pool.execute(query, params);
    
    // Calculate summary
    const summary = {
      total_receivables: 0,
      total_collected: 0,
      total_balance: 0
    };
    
    arList.forEach(item => {
      summary.total_receivables += parseFloat(item.total_price) || 0;
      summary.total_collected += parseFloat(item.amount_collected) || 0;
      summary.total_balance += parseFloat(item.remaining_balance) || 0;
    });
    
    res.json({ success: true, ar: arList, summary, userRole, userBarangayId });
  } catch (error) {
    console.error('Error fetching AR data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch A/R data' });
  }
});

// GET Collections transactions (barangay-based)
router.get('/collections', verifyFinancialAccess, async (req, res) => {
  try {
    const { machinery_id } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    let query = `
      SELECT 
        mbp.id,
        mbp.booking_id,
        mbp.payment_date as collection_date,
        mbp.amount as collection_amount,
        mbp.payment_method,
        mbp.receipt_number,
        mbp.remarks,
        f.full_name as farmer_name,
        f.barangay_id as farmer_barangay_id,
        mi.machinery_name,
        mi.machinery_type,
        mb.total_price,
        b.name as barangay_name
      FROM machinery_booking_payments mbp
      LEFT JOIN machinery_bookings mb ON mbp.booking_id = mb.id
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN barangays b ON mi.barangay_id = b.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    // Filter by farmer's barangay for non-admin users
    if (userRole !== 'admin' && userBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(userBarangayId);
    }
    
    if (machinery_id && machinery_id !== '') {
      query += ' AND mb.machinery_id = ?';
      params.push(parseInt(machinery_id));
    }
    
    query += ' ORDER BY mbp.payment_date DESC';
    
    const [collections] = await pool.execute(query, params);
    res.json({ success: true, collections, userRole, userBarangayId });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collections' });
  }
});

// POST Record a collection (treasurer only)
router.post('/collections', verifyTreasurerAccess, async (req, res) => {
  try {
    const { 
      booking_id, 
      collection_amount, 
      collection_date, 
      receipt_number, 
      payment_method = 'cash', 
      remarks,
      payment_type = 'full', // 'full' or 'partial'
      include_interest = false,
      interest_amount = 0,
      interest_season = 1, // Which season applies (1 or 2)
      total_collection = collection_amount // Total including interest
    } = req.body;
    const { user_id } = req.body;
    
    if (!booking_id || !collection_amount || !collection_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!receipt_number || receipt_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Receipt number is required' });
    }
    
    // Get booking details
    const [booking] = await pool.execute(
      'SELECT total_price, total_paid FROM machinery_bookings WHERE id = ?',
      [booking_id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const currentTotalPaid = parseFloat(booking[0].total_paid) || 0;
    const totalPrice = parseFloat(booking[0].total_price) || 0;
    const collectionAmt = parseFloat(collection_amount);
    const newTotalPaid = currentTotalPaid + collectionAmt;
    
    // Validate collection amount doesn't exceed remaining balance
    const remainingBalance = totalPrice - currentTotalPaid;
    if (collectionAmt > remainingBalance + 0.01) { // small tolerance for floating point
      return res.status(400).json({ 
        success: false, 
        message: `Collection amount (₱${collectionAmt.toFixed(2)}) exceeds remaining balance (₱${remainingBalance.toFixed(2)})` 
      });
    }
    
    // Insert payment record with new fields for tracking payment type and interest
    const [result] = await pool.execute(
      `INSERT INTO machinery_booking_payments 
       (booking_id, payment_date, amount, payment_method, receipt_number, remarks, recorded_by, payment_type, interest_amount, interest_applied, interest_season)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [booking_id, collection_date, collection_amount, payment_method, receipt_number.trim(), remarks, user_id, payment_type, interest_amount || 0, include_interest ? 1 : 0, interest_season]
    );
    
    // Update booking with new total_paid and payment_date
    let paymentStatus = 'Unpaid';
    if (newTotalPaid >= parseFloat(booking[0].total_price)) {
      paymentStatus = 'Paid';
    } else if (newTotalPaid > 0) {
      paymentStatus = 'Partial';
    }
    
    await pool.execute(
      `UPDATE machinery_bookings 
       SET total_paid = ?, 
           payment_status = ?,
           payment_date = ?,
           last_payment_date = ?
       WHERE id = ?`,
      [newTotalPaid, paymentStatus, collection_date, collection_date, booking_id]
    );

    // Update income entry: delete old and insert fresh with cumulative total_paid
    // This ensures income always reflects the accurate total collected for this booking
    await pool.execute(
      'DELETE FROM machinery_income WHERE booking_id = ?',
      [booking_id]
    );
    
    await pool.execute(
      `INSERT INTO machinery_income 
       (booking_id, machinery_id, income_amount, date_of_income, record_created_by)
       SELECT ?, mb.machinery_id, mb.total_paid, ?, ?
       FROM machinery_bookings mb
       WHERE mb.id = ?`,
      [booking_id, collection_date, user_id, booking_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Collection recorded successfully and moved to income',
      payment_id: result.insertId,
      payment_type: payment_type,
      interest_season: interest_season,
      interest_applied: include_interest,
      total_collection: total_collection
    });
  } catch (error) {
    console.error('Error recording collection:', error);
    res.status(500).json({ success: false, message: 'Failed to record collection' });
  }
});

// DELETE Collection transaction
router.delete('/collections/:id', verifyFinancialAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Get payment details
    const [payment] = await pool.execute(
      'SELECT booking_id, amount FROM machinery_booking_payments WHERE id = ?',
      [id]
    );
    
    if (payment.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    const { booking_id, amount } = payment[0];
    
    // Delete payment record
    await pool.execute(
      'DELETE FROM machinery_booking_payments WHERE id = ?',
      [id]
    );
    
    // Update booking - recalculate total_paid
    const [payments] = await pool.execute(
      'SELECT COALESCE(SUM(amount), 0) as total FROM machinery_booking_payments WHERE booking_id = ?',
      [booking_id]
    );
    
    const newTotalPaid = parseFloat(payments[0].total) || 0;
    
    // Get booking total_price
    const [booking] = await pool.execute(
      'SELECT total_price FROM machinery_bookings WHERE id = ?',
      [booking_id]
    );
    
    let paymentStatus = 'Unpaid';
    if (newTotalPaid >= parseFloat(booking[0].total_price)) {
      paymentStatus = 'Paid';
    } else if (newTotalPaid > 0) {
      paymentStatus = 'Partial';
    }
    
    await pool.execute(
      `UPDATE machinery_bookings 
       SET total_paid = ?, 
           payment_status = ?
       WHERE id = ?`,
      [newTotalPaid, paymentStatus, booking_id]
    );
    
    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ success: false, message: 'Failed to delete collection' });
  }
});

// ==================== REPORTS ====================

// GET full transaction report
// Reports - transactions summary (barangay-based)
router.get('/reports/transactions', verifyFinancialAccess, async (req, res) => {
  try {
    const { type, start_date, end_date, barangay_id } = req.query;
    const userRole = req.userRole;
    const userBarangayId = req.userBarangayId;
    
    // Determine effective barangay filter
    let effectiveBarangayId = null;
    if (userRole === 'admin' && barangay_id) {
      effectiveBarangayId = barangay_id;
    } else if (userRole !== 'admin' && userBarangayId) {
      effectiveBarangayId = userBarangayId;
    }
    
    // Calculate date range based on report type
    let dateStart = start_date;
    let dateEnd = end_date;
    const now = new Date();
    
    if (!dateStart || !dateEnd) {
      switch (type) {
        case 'monthly':
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3);
          dateStart = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
          dateEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
          break;
        case 'annual':
          dateStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          dateEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
          break;
        default:
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      }
    }
    
    // Build barangay filter clause
    const barangayFilter = effectiveBarangayId ? ' AND mi.barangay_id = ?' : '';
    const barangayFilterFarmer = effectiveBarangayId ? ' AND f.barangay_id = ?' : '';
    
    // Fetch all expenses in date range (filtered by barangay)
    let expenseQuery = `
      SELECT 
        me.id,
        me.date_of_expense as date,
        'Expense' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        me.particulars as description,
        me.reference_number,
        me.fuel_and_oil,
        me.labor_cost,
        me.per_diem,
        me.repair_and_maintenance,
        me.office_supply,
        me.communication_expense,
        me.utilities_expense,
        me.sundries,
        me.total_amount as amount,
        NULL as farmer_name,
        NULL as booking_id
      FROM machinery_expenses me
      LEFT JOIN machinery_inventory mi ON me.machinery_id = mi.id
      WHERE me.date_of_expense BETWEEN ? AND ?${barangayFilter}
      ORDER BY me.date_of_expense DESC
    `;
    const expenseParams = [dateStart, dateEnd];
    if (effectiveBarangayId) expenseParams.push(effectiveBarangayId);
    
    const [expenses] = await pool.execute(expenseQuery, expenseParams);
    
    // Fetch all income in date range (filtered by barangay)
    let incomeQuery = `
      SELECT 
        minc.id,
        minc.date_of_income as date,
        'Income' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        CONCAT('Booking #', minc.booking_id, ' - ', COALESCE(minc.remarks, 'Service Income')) as description,
        NULL as reference_number,
        NULL as fuel_and_oil,
        NULL as labor_cost,
        NULL as per_diem,
        NULL as repair_and_maintenance,
        NULL as office_supply,
        NULL as communication_expense,
        NULL as utilities_expense,
        NULL as sundries,
        minc.income_amount as amount,
        f.full_name as farmer_name,
        minc.booking_id
      FROM machinery_income minc
      LEFT JOIN machinery_inventory mi ON minc.machinery_id = mi.id
      LEFT JOIN machinery_bookings mb ON minc.booking_id = mb.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE minc.date_of_income BETWEEN ? AND ?${barangayFilter}
      ORDER BY minc.date_of_income DESC
    `;
    const incomeParams = [dateStart, dateEnd];
    if (effectiveBarangayId) incomeParams.push(effectiveBarangayId);
    
    const [income] = await pool.execute(incomeQuery, incomeParams);
    
    // Fetch all collections (payments) in date range (filtered by farmer's barangay)
    let collectionsQuery = `
      SELECT 
        mbp.id,
        mbp.payment_date as date,
        'Collection' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        CONCAT('Payment for Booking #', mbp.booking_id, 
          CASE WHEN mbp.payment_type = 'full' THEN ' (Full Payment)' ELSE ' (Partial Payment)' END) as description,
        mbp.receipt_number,
        NULL as fuel_and_oil,
        NULL as labor_cost,
        NULL as per_diem,
        NULL as repair_and_maintenance,
        NULL as office_supply,
        NULL as communication_expense,
        NULL as utilities_expense,
        NULL as sundries,
        mbp.amount as amount,
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
      WHERE mbp.payment_date BETWEEN ? AND ?${barangayFilterFarmer}
      ORDER BY mbp.payment_date DESC
    `;
    const collectionParams = [dateStart, dateEnd];
    if (effectiveBarangayId) collectionParams.push(effectiveBarangayId);
    
    const [collections] = await pool.execute(collectionsQuery, collectionParams);
    
    // Fetch bookings summary in date range (filtered by farmer's barangay)
    let bookingsQuery = `
      SELECT 
        mb.id,
        mb.booking_date as date,
        'Booking' as transaction_type,
        mi.machinery_name,
        mi.machinery_type,
        CONCAT('Booking for ', f.full_name, ' - ', mb.service_location) as description,
        mb.status,
        mb.total_price as amount,
        mb.total_paid,
        mb.payment_status,
        f.full_name as farmer_name,
        mb.id as booking_id
      FROM machinery_bookings mb
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers f ON mb.farmer_id = f.id
      WHERE mb.booking_date BETWEEN ? AND ?${barangayFilterFarmer}
      ORDER BY mb.booking_date DESC
    `;
    const bookingParams = [dateStart, dateEnd];
    if (effectiveBarangayId) bookingParams.push(effectiveBarangayId);
    
    const [bookings] = await pool.execute(bookingsQuery, bookingParams);
    
    // Calculate summaries
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalCollections = collections.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const totalInterest = collections.reduce((sum, c) => sum + parseFloat(c.interest_amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    
    // Distribution calculations (30% org, 20% training, 50% members)
    const profitForDistribution = netProfit > 0 ? netProfit : 0;
    const organizationShare = profitForDistribution * 0.30;
    const trainingShare = profitForDistribution * 0.20;
    const membersShare = profitForDistribution * 0.50;
    
    // Get member count for per-member calculation (filtered by barangay)
    let memberQuery = "SELECT COUNT(*) as count FROM farmers WHERE status = 'approved'";
    const memberParams = [];
    if (effectiveBarangayId) {
      memberQuery += ' AND barangay_id = ?';
      memberParams.push(effectiveBarangayId);
    }
    const [members] = await pool.execute(memberQuery, memberParams);
    const memberCount = members[0].count || 1;
    const perMemberShare = membersShare / memberCount;
    
    // Combine all transactions sorted by date
    const allTransactions = [
      ...expenses,
      ...income,
      ...collections
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      success: true,
      report: {
        type: type || 'monthly',
        period: {
          start: dateStart,
          end: dateEnd
        },
        generated_at: new Date().toISOString(),
        summary: {
          total_expenses: totalExpenses,
          total_income: totalIncome,
          total_collections: totalCollections,
          total_interest_collected: totalInterest,
          net_profit: netProfit,
          distribution: {
            organization_share: organizationShare,
            training_share: trainingShare,
            members_share: membersShare,
            member_count: memberCount,
            per_member_share: perMemberShare
          }
        },
        counts: {
          expenses: expenses.length,
          income: income.length,
          collections: collections.length,
          bookings: bookings.length
        },
        transactions: {
          all: allTransactions,
          expenses: expenses,
          income: income,
          collections: collections,
          bookings: bookings
        }
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

module.exports = router;
