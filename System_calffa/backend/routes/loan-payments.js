const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get payment history with barangay filtering
router.get('/history', async (req, res) => {
  try {
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
        lp.*,
        l.loan_type,
        l.status as loan_status,
        l.loan_amount,
        f.full_name,
        f.reference_number,
        f.barangay_id,
        b.name as barangay_name,
        (l.loan_amount - COALESCE(SUM(lp.amount) OVER (PARTITION BY lp.loan_id ORDER BY lp.payment_date), 0)) as remaining_after_payment
      FROM loan_payments lp
      JOIN loans l ON lp.loan_id = l.id
      JOIN farmers f ON l.farmer_id = f.id
      LEFT JOIN barangays b ON f.barangay_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    // Barangay filtering - Officers can only see payments from their barangay
    if (userRole !== 'admin' && userBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(userBarangayId);
    }
    
    query += ` ORDER BY lp.payment_date DESC`;
    
    const [payments] = await pool.execute(query, params);
    
    res.json({ 
      success: true, 
      payments: payments || [] 
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history', error: error.message });
  }
});

module.exports = router;
