const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/barangays - Get all barangays with stats
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        location,
        status
      FROM barangays
      WHERE status = 'active'
      ORDER BY name ASC
    `;
    
    const [barangays] = await db.execute(query);
    res.json({ success: true, barangays });
  } catch (error) {
    console.error('Error fetching barangays:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch barangays' });
  }
});

// GET /api/barangays/:id - Get single barangay details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get barangay info
    const [barangays] = await db.query('SELECT * FROM barangays WHERE id = ?', [id]);
    if (barangays.length === 0) {
      return res.status(404).json({ success: false, message: 'Barangay not found' });
    }
    
    const barangay = barangays[0];
    
    // Get farmers (role = 'farmer')
    const [farmers] = await db.query(
      `SELECT id, reference_number, full_name, phone_number, date_of_birth, role, status, registered_on
       FROM farmers 
       WHERE address = ? AND status = 'approved' AND role = 'farmer'
       ORDER BY full_name ASC`,
      [barangay.name]
    );
    
    // Get officers (president, treasurer, auditor, operator)
    const [officers] = await db.query(
      `SELECT id, reference_number, full_name, phone_number, date_of_birth, role, status, registered_on
       FROM farmers 
       WHERE address = ? AND status = 'approved' AND role IN ('president', 'treasurer', 'auditor', 'operator')
       ORDER BY 
         CASE role
           WHEN 'president' THEN 1
           WHEN 'treasurer' THEN 2
           WHEN 'auditor' THEN 3
           WHEN 'operator' THEN 4
           ELSE 5
         END,
         full_name ASC`,
      [barangay.name]
    );
    
    res.json({
      success: true,
      barangay,
      farmers,
      officers
    });
  } catch (error) {
    console.error('Error fetching barangay details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch barangay details' });
  }
});

// PUT /api/barangays/:id - Update barangay information
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, total_area, contact_person, contact_number } = req.body;
    
    await db.query(
      `UPDATE barangays 
       SET name = ?, status = ?, total_area = ?, contact_person = ?, contact_number = ?
       WHERE id = ?`,
      [name, status, total_area, contact_person, contact_number, id]
    );
    
    res.json({ success: true, message: 'Barangay updated successfully' });
  } catch (error) {
    console.error('Error updating barangay:', error);
    res.status(500).json({ success: false, message: 'Failed to update barangay' });
  }
});

// POST /api/barangays - Add new barangay
router.post('/', async (req, res) => {
  try {
    const { name, total_area, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Barangay name is required' });
    }

    const [result] = await db.query(
      `INSERT INTO barangays (name, total_area, status)
       VALUES (?, ?, ?)`,
      [name, total_area || 0, status || 'active']
    );
    
    res.json({ success: true, message: 'Barangay added successfully', id: result.insertId });
  } catch (error) {
    console.error('Error adding barangay:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ success: false, message: 'Barangay name already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add barangay' });
    }
  }
});

// DELETE /api/barangays/:id - Delete barangay
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM barangays WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Barangay deleted successfully' });
  } catch (error) {
    console.error('Error deleting barangay:', error);
    res.status(500).json({ success: false, message: 'Failed to delete barangay' });
  }
});

// POST /api/barangays/:id/officers - Add barangay officer
router.post('/:id/officers', async (req, res) => {
  try {
    const { id } = req.params;
    const { farmer_id, position, assigned_date } = req.body;
    
    await db.query(
      `INSERT INTO barangay_officers (barangay_id, farmer_id, position, assigned_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [id, farmer_id, position, assigned_date]
    );
    
    res.json({ success: true, message: 'Officer added successfully' });
  } catch (error) {
    console.error('Error adding officer:', error);
    res.status(500).json({ success: false, message: 'Failed to add officer' });
  }
});

// PUT /api/barangays/:id/officers/:officerId - Update officer
router.put('/:id/officers/:officerId', async (req, res) => {
  try {
    const { officerId } = req.params;
    const { position, end_date, status } = req.body;
    
    await db.query(
      `UPDATE barangay_officers 
       SET position = ?, end_date = ?, status = ?
       WHERE id = ?`,
      [position, end_date, status, officerId]
    );
    
    res.json({ success: true, message: 'Officer updated successfully' });
  } catch (error) {
    console.error('Error updating officer:', error);
    res.status(500).json({ success: false, message: 'Failed to update officer' });
  }
});

// DELETE /api/barangays/:id/officers/:officerId - Remove officer
router.delete('/:id/officers/:officerId', async (req, res) => {
  try {
    const { officerId } = req.params;
    
    await db.query('DELETE FROM barangay_officers WHERE id = ?', [officerId]);
    
    res.json({ success: true, message: 'Officer removed successfully' });
  } catch (error) {
    console.error('Error removing officer:', error);
    res.status(500).json({ success: false, message: 'Failed to remove officer' });
  }
});

// POST /api/barangays/:id/contributions - Add contribution
router.post('/:id/contributions', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, contribution_type, contribution_date, description, received_by, receipt_number } = req.body;
    
    await db.query(
      `INSERT INTO barangay_contributions 
       (barangay_id, amount, contribution_type, contribution_date, description, received_by, receipt_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [id, amount, contribution_type, contribution_date, description, received_by, receipt_number]
    );
    
    res.json({ success: true, message: 'Contribution recorded successfully' });
  } catch (error) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to record contribution' });
  }
});

// PUT /api/barangays/:id/contributions/:contributionId - Update contribution
router.put('/:id/contributions/:contributionId', async (req, res) => {
  try {
    const { contributionId } = req.params;
    const { status, amount, contribution_type, description } = req.body;
    
    await db.query(
      `UPDATE barangay_contributions 
       SET status = ?, amount = ?, contribution_type = ?, description = ?
       WHERE id = ?`,
      [status, amount, contribution_type, description, contributionId]
    );
    
    res.json({ success: true, message: 'Contribution updated successfully' });
  } catch (error) {
    console.error('Error updating contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to update contribution' });
  }
});

// POST /api/barangays/:id/activities - Add activity
router.post('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_name, activity_type, description, activity_date, location, participants_count, budget, organized_by } = req.body;
    
    await db.query(
      `INSERT INTO barangay_activities 
       (barangay_id, activity_name, activity_type, description, activity_date, location, participants_count, budget, organized_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')`,
      [id, activity_name, activity_type, description, activity_date, location, participants_count, budget, organized_by]
    );
    
    res.json({ success: true, message: 'Activity created successfully' });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ success: false, message: 'Failed to create activity' });
  }
});

// PUT /api/barangays/:id/activities/:activityId - Update activity
router.put('/:id/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { activity_name, activity_type, description, activity_date, location, participants_count, budget, status } = req.body;
    
    await db.query(
      `UPDATE barangay_activities 
       SET activity_name = ?, activity_type = ?, description = ?, activity_date = ?, 
           location = ?, participants_count = ?, budget = ?, status = ?
       WHERE id = ?`,
      [activity_name, activity_type, description, activity_date, location, participants_count, budget, status, activityId]
    );
    
    res.json({ success: true, message: 'Activity updated successfully' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ success: false, message: 'Failed to update activity' });
  }
});

// DELETE /api/barangays/:id/activities/:activityId - Delete activity
router.delete('/:id/activities/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    
    await db.query('DELETE FROM barangay_activities WHERE id = ?', [activityId]);
    
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ success: false, message: 'Failed to delete activity' });
  }
});

// GET /api/barangays/stats/summary - Get federation-wide statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT b.id) as total_barangays,
        COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) as active_barangays,
        COUNT(DISTINCT f.id) as total_farmers,
        COUNT(DISTINCT bo.id) as total_officers,
        COALESCE(SUM(bc.amount), 0) as total_contributions,
        COUNT(DISTINCT ba.id) as total_activities
      FROM barangays b
      LEFT JOIN farmers f ON f.address = b.name AND f.status = 'approved'
      LEFT JOIN barangay_officers bo ON bo.barangay_id = b.id AND bo.status = 'active'
      LEFT JOIN barangay_contributions bc ON bc.barangay_id = b.id AND bc.status = 'verified'
      LEFT JOIN barangay_activities ba ON ba.barangay_id = b.id
    `);
    
    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Error fetching federation stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
