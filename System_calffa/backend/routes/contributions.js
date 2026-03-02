const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/contributions - Get all contributions with filtering
router.get('/', async (req, res) => {
  try {
    const { farmer_id, contribution_type, status, start_date, end_date, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        c.*,
        f.full_name,
        f.reference_number,
        r.full_name as recorded_by_name
      FROM contributions c
      JOIN farmers f ON c.farmer_id = f.id
      LEFT JOIN farmers r ON c.recorded_by = r.id
      WHERE 1=1
    `;
    const params = [];
    
    if (farmer_id) {
      query += ' AND c.farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (contribution_type) {
      query += ' AND c.contribution_type = ?';
      params.push(contribution_type);
    }
    
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      query += ' AND c.contribution_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND c.contribution_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY c.contribution_date DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [contributions] = await pool.execute(query, params);
    res.json({ success: true, contributions });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contributions' });
  }
});

// GET /api/contributions/farmer/:farmerId - Get contributions for specific farmer
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const [contributions] = await pool.execute(
      `SELECT * FROM contributions 
       WHERE farmer_id = ? 
       ORDER BY contribution_date DESC`,
      [farmerId]
    );
    
    res.json({ success: true, contributions });
  } catch (error) {
    console.error('Error fetching farmer contributions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contributions' });
  }
});

// POST /api/contributions - Create new contribution
router.post('/', async (req, res) => {
  try {
    const { 
      farmer_id, 
      contribution_date, 
      amount, 
      contribution_type, 
      payment_method, 
      reference_number, 
      remarks,
      recorded_by,
      status 
    } = req.body;
    
    if (!farmer_id || !contribution_date || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: farmer_id, contribution_date, amount' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO contributions 
       (farmer_id, contribution_date, amount, contribution_type, payment_method, 
        reference_number, remarks, recorded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer_id, 
        contribution_date, 
        amount, 
        contribution_type || 'regular',
        payment_method || 'cash',
        reference_number,
        remarks,
        recorded_by,
        status || 'confirmed'
      ]
    );
    
    // Log activity
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmer_id]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, activity_type, activity_description, metadata)
         VALUES (?, 'contribution', ?, ?)`,
        [
          farmer_id, 
          `${farmer[0]?.full_name} made a contribution of ₱${amount}`,
          JSON.stringify({ contribution_id: result.insertId, amount, type: contribution_type })
        ]
      );
    } catch (logErr) {
      console.error('Error logging contribution activity:', logErr);
    }
    
    res.json({ success: true, id: result.insertId, message: 'Contribution recorded successfully' });
  } catch (error) {
    console.error('Error creating contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to create contribution' });
  }
});

// PUT /api/contributions/:id - Update contribution
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, contribution_type, payment_method, reference_number, remarks, status } = req.body;
    
    const updates = [];
    const values = [];
    
    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }
    if (contribution_type) {
      updates.push('contribution_type = ?');
      values.push(contribution_type);
    }
    if (payment_method) {
      updates.push('payment_method = ?');
      values.push(payment_method);
    }
    if (reference_number !== undefined) {
      updates.push('reference_number = ?');
      values.push(reference_number);
    }
    if (remarks !== undefined) {
      updates.push('remarks = ?');
      values.push(remarks);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE contributions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ success: true, message: 'Contribution updated successfully' });
  } catch (error) {
    console.error('Error updating contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to update contribution' });
  }
});

// GET /api/contributions/stats - Get contribution statistics
router.get('/stats', async (req, res) => {
  try {
    const { farmer_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_contributions,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        contribution_type,
        COUNT(*) as count_by_type
      FROM contributions
      WHERE status = 'confirmed'
    `;
    const params = [];
    
    if (farmer_id) {
      query += ' AND farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (start_date) {
      query += ' AND contribution_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND contribution_date <= ?';
      params.push(end_date);
    }
    
    query += ' GROUP BY contribution_type';
    
    const [stats] = await pool.execute(query, params);
    
    // Get overall totals
    let totalQuery = `
      SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_sum,
        AVG(amount) as average
      FROM contributions
      WHERE status = 'confirmed'
    `;
    const totalParams = [];
    
    if (farmer_id) {
      totalQuery += ' AND farmer_id = ?';
      totalParams.push(farmer_id);
    }
    
    if (start_date) {
      totalQuery += ' AND contribution_date >= ?';
      totalParams.push(start_date);
    }
    
    if (end_date) {
      totalQuery += ' AND contribution_date <= ?';
      totalParams.push(end_date);
    }
    
    const [totals] = await pool.execute(totalQuery, totalParams);
    
    res.json({ 
      success: true, 
      stats,
      totals: totals[0]
    });
  } catch (error) {
    console.error('Error fetching contribution stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// DELETE /api/contributions/:id - Delete contribution (soft delete by setting status to cancelled)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE contributions SET status = ? WHERE id = ?',
      ['cancelled', id]
    );
    
    res.json({ success: true, message: 'Contribution cancelled successfully' });
  } catch (error) {
    console.error('Error deleting contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contribution' });
  }
});

module.exports = router;
