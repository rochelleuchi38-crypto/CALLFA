const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper function to log activity
const logActivity = async (farmerId, activityType, description, metadata = null, ipAddress = null, userAgent = null) => {
  try {
    await db.query(
      `INSERT INTO activity_logs (farmer_id, activity_type, activity_description, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [farmerId, activityType, description, metadata ? JSON.stringify(metadata) : null, ipAddress, userAgent]
    );
    
    // Update last_activity
    await db.query(
      'UPDATE farmers SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
      [farmerId]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// GET /api/activity-logs - Get all activity logs (admin)
router.get('/', async (req, res) => {
  try {
    const { farmer_id, activity_type, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        al.*,
        f.full_name,
        f.reference_number
      FROM activity_logs al
      JOIN farmers f ON al.farmer_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    if (farmer_id) {
      query += ' AND al.farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (activity_type) {
      query += ' AND al.activity_type = ?';
      params.push(activity_type);
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [logs] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
    const countParams = [];
    
    if (farmer_id) {
      countQuery += ' AND farmer_id = ?';
      countParams.push(farmer_id);
    }
    
    if (activity_type) {
      countQuery += ' AND activity_type = ?';
      countParams.push(activity_type);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    
    res.json({ 
      success: true, 
      logs,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
});

// GET /api/activity-logs/farmer/:id - Get activity logs for specific farmer
router.get('/farmer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const [logs] = await db.query(
      `SELECT * FROM activity_logs 
       WHERE farmer_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [id, parseInt(limit)]
    );
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching farmer activity logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
});

// POST /api/activity-logs - Create activity log entry
router.post('/', async (req, res) => {
  try {
    const { farmer_id, activity_type, activity_description, metadata } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');
    
    await logActivity(farmer_id, activity_type, activity_description, metadata, ipAddress, userAgent);
    
    res.json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ success: false, message: 'Failed to create activity log' });
  }
});

// GET /api/activity-logs/stats - Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        activity_type,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM activity_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY activity_type, DATE(created_at)
      ORDER BY date DESC, count DESC
    `);
    
    const [recentActivity] = await db.query(`
      SELECT 
        al.*,
        f.full_name,
        f.reference_number
      FROM activity_logs al
      JOIN farmers f ON al.farmer_id = f.id
      ORDER BY al.created_at DESC
      LIMIT 20
    `);
    
    const [topUsers] = await db.query(`
      SELECT 
        f.id,
        f.full_name,
        f.reference_number,
        COUNT(al.id) as activity_count,
        MAX(al.created_at) as last_activity
      FROM farmers f
      JOIN activity_logs al ON f.id = al.farmer_id
      WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY f.id
      ORDER BY activity_count DESC
      LIMIT 10
    `);
    
    res.json({ 
      success: true, 
      stats,
      recent_activity: recentActivity,
      top_users: topUsers
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity statistics' });
  }
});

// GET /api/membership-history/:farmerId - Get membership history for a farmer
router.get('/membership-history/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    const [history] = await db.query(`
      SELECT 
        mh.*,
        f_changed.full_name as changed_by_name
      FROM membership_history mh
      LEFT JOIN farmers f_changed ON mh.changed_by = f_changed.id
      WHERE mh.farmer_id = ?
      ORDER BY mh.changed_at DESC
    `, [farmerId]);
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching membership history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch membership history' });
  }
});

// POST /api/membership-history - Record membership change
router.post('/membership-history', async (req, res) => {
  try {
    const { farmer_id, previous_status, new_status, previous_role, new_role, changed_by, change_reason } = req.body;
    
    await db.query(
      `INSERT INTO membership_history 
       (farmer_id, previous_status, new_status, previous_role, new_role, changed_by, change_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [farmer_id, previous_status, new_status, previous_role, new_role, changed_by, change_reason]
    );
    
    // Log the activity
    await logActivity(
      farmer_id,
      'membership_change',
      `Membership changed from ${previous_status || previous_role} to ${new_status || new_role}`,
      { previous_status, new_status, previous_role, new_role, changed_by, change_reason }
    );
    
    res.json({ success: true, message: 'Membership history recorded' });
  } catch (error) {
    console.error('Error recording membership history:', error);
    res.status(500).json({ success: false, message: 'Failed to record membership history' });
  }
});

// Export the log activity helper function
module.exports = router;
module.exports.logActivity = logActivity;
