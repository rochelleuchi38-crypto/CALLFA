const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, authorizeRoles, verifyLoanBarangayAccess } = require('../middleware/auth');
const { buildBarangayFilter } = require('../utils/barangayHelpers');

// Loan type limits
const LOAN_LIMITS = {
  agricultural: 5000,
  provident: 3000,
  educational: 3000
};

const INTEREST_RATE = 1.00; // Fixed 1% interest
const PAYMENT_TERM_MONTHS = 6; // Fixed 6 months

// Helper function to calculate due date (6 months from approval)
const calculateDueDate = (approvalDate) => {
  const date = new Date(approvalDate);
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().split('T')[0];
};

// Helper function to check if farmer can apply for loan
const canApplyForLoan = async (farmerId) => {
  // Check for unsettled loans
  const [unsettledLoans] = await pool.execute(
    `SELECT id FROM loans 
     WHERE farmer_id = ? 
     AND status IN ('pending', 'approved', 'active', 'overdue')`,
    [farmerId]
  );
  
  if (unsettledLoans.length > 0) {
    return { allowed: false, reason: 'You have an unsettled loan. Please complete your existing loan before applying for a new one.' };
  }
  
  // Check if farmer already had an APPROVED loan in the last 6 months (rejected loans don't count)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
  
  const [recentLoans] = await pool.execute(
    `SELECT id FROM loans 
     WHERE farmer_id = ? 
     AND application_date >= ?
     AND status IN ('approved', 'active', 'paid', 'overdue')`,
    [farmerId, sixMonthsAgoStr]
  );
  
  if (recentLoans.length > 0) {
    return { allowed: false, reason: 'You have already availed a loan in the last 6 months. Each farmer can only apply once every 6 months.' };
  }
  
  return { allowed: true };
};

// Get farmer's barangay for loan context
const getFarmerBarangay = async (farmerId) => {
  const [farmers] = await pool.execute(
    'SELECT barangay_id FROM farmers WHERE id = ?',
    [farmerId]
  );
  return farmers.length > 0 ? farmers[0].barangay_id : null;
};

// GET /api/loans - Get all loans with barangay filtering
router.get('/', async (req, res) => {
  try {
    const { farmer_id, status, start_date, end_date, limit = 100, barangay_id } = req.query;
    
    // Check if user token is provided for barangay context
    let userBarangayId = null;
    let userRole = 'guest';
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userBarangayId = decoded.barangay_id;
        userRole = decoded.role || 'guest';
      } catch (err) {
        // Token invalid, proceed without filtering
      }
    }

    let query = `
      SELECT 
        l.*,
        f.full_name,
        f.reference_number,
        f.barangay_id as farmer_barangay,
        a.full_name as approved_by_name,
        b.name as barangay_name
      FROM loans l
      JOIN farmers f ON l.farmer_id = f.id
      LEFT JOIN farmers a ON l.approved_by = a.id
      LEFT JOIN barangays b ON f.barangay_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    if (farmer_id) {
      query += ' AND l.farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      query += ' AND l.application_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND l.application_date <= ?';
      params.push(end_date);
    }

    // Barangay filtering
    // Officers can only see loans from their barangay
    const targetBarangayId = barangay_id || userBarangayId;
    if (userRole !== 'admin' && targetBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(targetBarangayId);
    }
    
    query += ' ORDER BY l.application_date DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [loans] = await pool.execute(query, params);
    res.json({ success: true, loans });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
});

// GET /api/loans/eligibility/:farmerId - Check loan eligibility with barangay context
router.get('/eligibility/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Get farmer's barangay
    const barangayId = await getFarmerBarangay(farmerId);
    
    const eligibility = await canApplyForLoan(farmerId);
    res.json({ success: true, ...eligibility, barangay_id: barangayId });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ success: false, message: 'Failed to check eligibility' });
  }
});

// GET /api/loans/farmer/:farmerId - Get loans for specific farmer with barangay check
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const [loans] = await pool.execute(
      `SELECT l.*, b.name as barangay_name
       FROM loans l
       LEFT JOIN barangays b ON l.barangay_id = b.id
       WHERE l.farmer_id = ? 
       ORDER BY l.application_date DESC`,
      [farmerId]
    );
    
    res.json({ success: true, loans });
  } catch (error) {
    console.error('Error fetching farmer loans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
});

// GET /api/loans/:id - Get specific loan details with barangay context
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [loans] = await pool.execute(
      `SELECT 
        l.*,
        f.full_name,
        f.reference_number,
        f.barangay_id as farmer_barangay,
        a.full_name as approved_by_name,
        b.name as barangay_name
       FROM loans l
       JOIN farmers f ON l.farmer_id = f.id
       LEFT JOIN farmers a ON l.approved_by = a.id
       LEFT JOIN barangays b ON l.barangay_id = b.id
       WHERE l.id = ?`,
      [id]
    );
    
    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    
    // Get payment history
    const [payments] = await pool.execute(
      `SELECT * FROM loan_payments 
       WHERE loan_id = ? 
       ORDER BY payment_date DESC`,
      [id]
    );
    
    res.json({ 
      success: true, 
      loan: loans[0],
      payments 
    });
  } catch (error) {
    console.error('Error fetching loan details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loan details' });
  }
});

// POST /api/loans - Create new loan application with barangay context
router.post('/', async (req, res) => {
  try {
    const { 
      farmer_id, 
      loan_amount, 
      loan_type,
      loan_purpose,
      remarks 
    } = req.body;
    
    console.log('Received loan application:', req.body);
    
    // Validate required fields
    if (!farmer_id || !loan_amount || !loan_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: farmer_id, loan_amount, loan_type' 
      });
    }
    
    // Validate loan type
    if (!['agricultural', 'provident', 'educational'].includes(loan_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid loan type. Must be agricultural, provident, or educational' 
      });
    }
    
    // Validate loan amount against limits
    if (parseFloat(loan_amount) > LOAN_LIMITS[loan_type]) {
      return res.status(400).json({ 
        success: false, 
        message: `Loan amount exceeds maximum limit of ₱${LOAN_LIMITS[loan_type].toLocaleString()} for ${loan_type} loan` 
      });
    }
    
    // Check eligibility
    const eligibility = await canApplyForLoan(farmer_id);
    if (!eligibility.allowed) {
      return res.status(400).json({ 
        success: false, 
        message: eligibility.reason 
      });
    }

    // Get farmer's barangay
    const barangayId = await getFarmerBarangay(farmer_id);
    if (!barangayId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Farmer barangay assignment is required to apply for loans' 
      });
    }
    
    const application_date = new Date().toISOString().split('T')[0];
    
    // Calculate total amount with interest (1%)
    const principal = parseFloat(loan_amount);
    const interestAmount = principal * (INTEREST_RATE / 100);
    const totalAmount = principal + interestAmount;
    
    const [result] = await pool.execute(
      `INSERT INTO loans 
       (farmer_id, barangay_id, loan_amount, loan_type, interest_rate, loan_purpose, application_date, 
        total_paid, remaining_balance, payment_term, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        farmer_id, 
        barangayId,
        totalAmount, // Store total amount (principal + interest)
        loan_type,
        INTEREST_RATE,
        loan_purpose || `${loan_type} loan`,
        application_date,
        0, // Initialize total_paid to 0
        totalAmount, // Initially, remaining balance equals total amount
        PAYMENT_TERM_MONTHS,
        remarks || null
      ]
    );
    
    // Log activity with barangay context
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmer_id]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_application', ?, ?)`,
        [
          farmer_id,
          barangayId,
          `${farmer[0]?.full_name || 'Farmer'} applied for ${loan_type} loan of ₱${loan_amount}`,
          JSON.stringify({ loan_id: result.insertId, loan_type, loan_amount })
        ]
      );
    } catch (logErr) {
      console.error('Error logging loan application:', logErr);
    }
    
    console.log(`✓ Loan application created: ID ${result.insertId} for farmer ${farmer_id}`);
    
    res.json({ 
      success: true, 
      message: 'Loan application submitted successfully',
      loan_id: result.insertId,
      status: 'pending',
      barangay_id: barangayId,
      details: {
        principal: principal,
        interest: interestAmount,
        total: totalAmount,
        payment_term: PAYMENT_TERM_MONTHS
      }
    });
  } catch (error) {
    console.error('Error creating loan application:', error);
    res.status(500).json({ success: false, message: 'Failed to create loan application', error: error.message });
  }
});

// PUT /api/loans/:id/approve - Approve loan (Treasurer or Admin based on barangay)
// Treasurers can only approve loans from their barangay
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, remarks } = req.body;

    // Get loan barangay info
    const [loans] = await pool.execute(
      'SELECT barangay_id, farmer_id, status FROM loans WHERE id = ?',
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loans[0];

    // Check if loan is already approved
    if (loan.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Loan is already ${loan.status}. Only pending loans can be approved.` 
      });
    }

    // Get approver info for barangay check
    if (approved_by) {
      const [approvers] = await pool.execute(
        'SELECT role, barangay_id FROM farmers WHERE id = ?',
        [approved_by]
      );

      if (approvers.length === 0) {
        return res.status(400).json({ success: false, message: 'Approver not found' });
      }

      const approver = approvers[0];

      // Check authorization: only treasurer or admin of the same barangay
      const treasurerRoles = ['treasurer', 'operation_manager', 'business_manager', 'president', 'admin'];
      
      if (!treasurerRoles.includes(approver.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only treasurers, operation managers, business managers, presidents, or admins can approve loans' 
        });
      }

      // Check barangay access
      if (approver.role !== 'admin' && approver.barangay_id !== loan.barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Officers can only approve loans from their assigned barangay' 
        });
      }
    }

    const approval_date = new Date().toISOString().split('T')[0];
    const due_date = calculateDueDate(approval_date);

    const [result] = await pool.execute(
      `UPDATE loans 
       SET status = 'approved', approved_by = ?, approval_date = ?, due_date = ?, remarks = ?
       WHERE id = ?`,
      [approved_by || null, approval_date, due_date, remarks || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Log approval activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [loan.farmer_id]);
      const [approverInfo] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [approved_by]);
      
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_approval', ?, ?)`,
        [
          loan.farmer_id,
          loan.barangay_id,
          `${farmer[0]?.full_name || 'Farmer'} loan approved by ${approverInfo[0]?.full_name || 'Admin'}`,
          JSON.stringify({ loan_id: id, approved_by, approval_date })
        ]
      );
    } catch (logErr) {
      console.error('Error logging loan approval:', logErr);
    }

    res.json({ 
      success: true, 
      message: 'Loan approved successfully',
      loan_id: id,
      status: 'approved',
      due_date 
    });
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({ success: false, message: 'Failed to approve loan', error: error.message });
  }
});

// PUT /api/loans/:id/reject - Reject loan (Treasurer or Admin based on barangay)
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    // Get loan barangay info
    const [loans] = await pool.execute(
      'SELECT barangay_id, farmer_id, status FROM loans WHERE id = ?',
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loans[0];

    // Check if loan is pending
    if (loan.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending loans can be rejected' 
      });
    }

    // Get rejector info for barangay check
    if (rejected_by) {
      const [rejecters] = await pool.execute(
        'SELECT role, barangay_id FROM farmers WHERE id = ?',
        [rejected_by]
      );

      if (rejecters.length === 0) {
        return res.status(400).json({ success: false, message: 'Rejector not found' });
      }

      const rejecter = rejecters[0];

      // Check authorization
      const treasurerRoles = ['treasurer', 'operation_manager', 'business_manager', 'president', 'admin'];
      
      if (!treasurerRoles.includes(rejecter.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only treasurers or admins can reject loans' 
        });
      }

      // Check barangay access
      if (rejecter.role !== 'admin' && rejecter.barangay_id !== loan.barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Officers can only reject loans from their assigned barangay' 
        });
      }
    }

    const rejected_date = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute(
      `UPDATE loans 
       SET status = 'rejected', rejected_by = ?, rejection_date = ?, rejection_reason = ?
       WHERE id = ?`,
      [rejected_by || null, rejected_date, rejection_reason || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Log rejection activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [loan.farmer_id]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_rejection', ?, ?)`,
        [
          loan.farmer_id,
          loan.barangay_id,
          `${farmer[0]?.full_name || 'Farmer'} loan rejected`,
          JSON.stringify({ loan_id: id, rejected_by, reason: rejection_reason })
        ]
      );
    } catch (logErr) {
      console.error('Error logging loan rejection:', logErr);
    }

    res.json({ 
      success: true, 
      message: 'Loan rejected successfully',
      loan_id: id,
      status: 'rejected'
    });
  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to reject loan', error: error.message });
  }
});

// PUT /api/loans/:id - Update loan (generic updates with barangay validation)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get loan barangay info
    const [loans] = await pool.execute(
      'SELECT barangay_id FROM loans WHERE id = ?',
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const updates = [];
    const values = [];

    // Only allow specific fields to be updated
    const allowedFields = ['remarks', 'status', 'payment_term', 'loan_amount', 'loan_type', 'loan_purpose'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE loans SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Fetch updated loan to return details
    const [updatedLoan] = await pool.execute('SELECT loan_amount, interest_rate, payment_term FROM loans WHERE id = ?', [id]);
    const loan = updatedLoan[0];
    const principal = parseFloat(loan.loan_amount);
    const interest = principal * (parseFloat(loan.interest_rate) / 100);
    const total = principal + interest;

    res.json({ 
      success: true, 
      message: 'Loan updated successfully',
      loan_id: id,
      details: {
        principal: principal,
        interest: interest,
        total: total,
        payment_term: loan.payment_term
      }
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).json({ success: false, message: 'Failed to update loan', error: error.message });
  }
});

// DELETE /api/loans/:id - Delete loan (Admin only, or pending loans from own barangay)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [loans] = await pool.execute(
      'SELECT barangay_id, status FROM loans WHERE id = ?',
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    // Only allow deletion of pending loans
    if (loans[0].status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending loans can be deleted' 
      });
    }

    const [result] = await pool.execute('DELETE FROM loans WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    res.json({ 
      success: true, 
      message: 'Loan deleted successfully',
      loan_id: id 
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to delete loan', error: error.message });
  }
});

// POST /api/loans/:id/payment - Record loan payment
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, payment_method, remarks, recorded_by, reference_number } = req.body;

    // Validate inputs
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    if (!payment_date) {
      return res.status(400).json({ success: false, message: 'Payment date is required' });
    }

    if (!reference_number || reference_number.trim() === '') {
      return res.status(400).json({ success: false, message: 'Receipt number is required' });
    }

    // Get loan details
    const [loans] = await pool.execute(
      `SELECT id, farmer_id, barangay_id, status, loan_amount, total_paid, remaining_balance 
       FROM loans WHERE id = ?`,
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loans[0];

    // Check if loan has a valid barangay assignment
    if (!loan.barangay_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Loan does not have a barangay assignment. Please assign a barangay to this loan before recording payment.' 
      });
    }

    // Check if loan is in a valid status for payment
    const validStatuses = ['approved', 'active', 'overdue'];
    if (!validStatuses.includes(loan.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot record payment for a ${loan.status} loan` 
      });
    }

    // Check authorization - verify the recorded_by user is authorized
    if (recorded_by) {
      const [recorders] = await pool.execute(
        'SELECT role, barangay_id FROM farmers WHERE id = ?',
        [recorded_by]
      );

      if (recorders.length === 0) {
        return res.status(400).json({ success: false, message: 'Recorder not found' });
      }

      const recorder = recorders[0];
      const allowedRoles = ['treasurer', 'operation_manager', 'business_manager', 'president', 'admin'];
      
      if (!allowedRoles.includes(recorder.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only treasurers, operation managers, business managers, presidents, or admins can record payments' 
        });
      }

      // Check barangay access - officers of the same barangay can record payments
      // Admins can record for any barangay
      const recorderBarangayId = parseInt(recorder.barangay_id);
      const loanBarangayId = parseInt(loan.barangay_id);
      
      const isAdmin = recorder.role === 'admin';
      const isSameBarangay = !isNaN(recorderBarangayId) && !isNaN(loanBarangayId) && recorderBarangayId === loanBarangayId;
      
      if (!isAdmin && !isSameBarangay) {
        return res.status(403).json({ 
          success: false, 
          message: `Officers can only record payments for loans from their barangay. Loan is in barangay ${loanBarangayId}, but you are assigned to barangay ${recorderBarangayId}.` 
        });
      }
    }

    // Check if payment amount exceeds remaining balance
    const currentRemaining = loan.remaining_balance || loan.loan_amount;
    if (parseFloat(amount) > currentRemaining) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₱${parseFloat(amount).toLocaleString()}) exceeds remaining balance (₱${currentRemaining.toLocaleString()})` 
      });
    }

    // Record the payment
    const [paymentResult] = await pool.execute(
      `INSERT INTO loan_payments (loan_id, amount, payment_date, payment_method, reference_number, remarks, recorded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, parseFloat(amount), payment_date, payment_method || 'cash', reference_number.trim(), remarks || null, recorded_by || null]
    );

    if (paymentResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to record payment' });
    }

    // Calculate new totals - ensure we use explicit numeric values
    const paymentAmount = parseFloat(amount);
    const currentTotalPaid = parseFloat(loan.total_paid) || 0;
    const loanAmount = parseFloat(loan.loan_amount);
    
    const newTotalPaid = currentTotalPaid + paymentAmount;
    const newRemainingBalance = Math.max(0, loanAmount - newTotalPaid); // Ensure it doesn't go negative
    const isPaidOff = newRemainingBalance <= 0;
    const newStatus = isPaidOff ? 'paid' : (loan.status === 'approved' ? 'active' : loan.status);
    const paidDate = isPaidOff ? payment_date : null;

    console.log(`Payment Update - Loan ${id}: OldPaid=${currentTotalPaid}, Payment=${paymentAmount}, NewPaid=${newTotalPaid}, NewBalance=${newRemainingBalance}, Status=${newStatus}`);

    // Update loan amounts and status
    const [updateResult] = await pool.execute(
      `UPDATE loans 
       SET total_paid = ?, remaining_balance = ?, status = ?, paid_date = ?, last_payment_date = NOW()
       WHERE id = ?`,
      [newTotalPaid, newRemainingBalance, newStatus, paidDate, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'Failed to update loan' });
    }

    // Log payment activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [loan.farmer_id]);
      const [recorder] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [recorded_by]);
      
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'loan_payment', ?, ?)`,
        [
          loan.farmer_id,
          loan.barangay_id,
          `Payment of ₱${parseFloat(amount).toLocaleString()} recorded by ${recorder[0]?.full_name || 'Admin'}`,
          JSON.stringify({ 
            loan_id: id, 
            payment_amount: parseFloat(amount),
            new_balance: newRemainingBalance,
            recorded_by,
            payment_date
          })
        ]
      );
    } catch (logErr) {
      console.error('Error logging payment:', logErr);
    }

    res.json({ 
      success: true, 
      message: isPaidOff ? 'Loan paid in full!' : 'Payment recorded successfully',
      payment_id: paymentResult.insertId,
      loan_id: id,
      total_paid: newTotalPaid,
      remaining_balance: newRemainingBalance,
      status: newStatus,
      is_paid_off: isPaidOff
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
  }
});

module.exports = router;
