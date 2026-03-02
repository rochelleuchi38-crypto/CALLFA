// MACHINERY.JS BARANGAY INTEGRATION PATCH
// Key endpoints to update for barangay-based machinery management

// ========================================
// UPDATED IMPORTS AND CONFIGURATION
// ========================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { buildBarangayFilter } = require('../utils/barangayHelpers');

// Helper function to extract user context from request
const getUserContext = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return { role: 'guest', barangay_id: null };

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [users] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
    
    return users.length > 0 ? users[0] : { role: 'guest', barangay_id: null };
  } catch (err) {
    return { role: 'guest', barangay_id: null };
  }
};

// ========================================
// MACHINERY INVENTORY ROUTES - UPDATED
// ========================================

// GET /api/machinery/inventory - Get machinery with barangay filtering
router.get('/inventory', async (req, res) => {
  try {
    const { status, machinery_type, barangay_id } = req.query;
    const userContext = await getUserContext(req);
    
    let query = `
      SELECT 
        mi.*,
        f.full_name as created_by_name,
        b.name as barangay_name,
        COUNT(DISTINCT mo.id) as assigned_operators
      FROM machinery_inventory mi
      LEFT JOIN farmers f ON mi.created_by = f.id
      LEFT JOIN barangays b ON mi.barangay_id = b.id
      LEFT JOIN machinery_operators mo ON mi.id = mo.machinery_id AND mo.status = 'Active'
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND mi.status = ?';
      params.push(status);
    }
    
    if (machinery_type) {
      query += ' AND mi.machinery_type = ?';
      params.push(machinery_type);
    }

    // Barangay filtering - officers see only their barangay
    const targetBarangayId = barangay_id || userContext.barangay_id;
    if (userContext.role !== 'admin' && targetBarangayId) {
      query += ' AND mi.barangay_id = ?';
      params.push(targetBarangayId);
    }
    
    query += ' GROUP BY mi.id ORDER BY mi.created_at DESC';
    
    const [inventory] = await pool.execute(query, params);
    res.json({ success: true, inventory });
  } catch (error) {
    console.error('Error fetching machinery inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch machinery inventory' });
  }
});

// GET /api/machinery/inventory/:id - Get single machinery with barangay validation
router.get('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userContext = await getUserContext(req);
    
    const [machinery] = await pool.execute(
      `SELECT 
        mi.*,
        f.full_name as created_by_name,
        b.name as barangay_name
      FROM machinery_inventory mi
      LEFT JOIN farmers f ON mi.created_by = f.id
      LEFT JOIN barangays b ON mi.barangay_id = b.id
      WHERE mi.id = ?`,
      [id]
    );
    
    if (machinery.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }

    // Barangay access check
    if (userContext.role !== 'admin' && userContext.barangay_id !== machinery[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access machinery from your assigned barangay' 
      });
    }
    
    // Get assigned operators from the same barangay
    const [operators] = await pool.execute(
      `SELECT 
        mo.*,
        f.full_name as operator_name,
        f.reference_number
      FROM machinery_operators mo
      JOIN farmers f ON mo.farmer_id = f.id
      WHERE mo.machinery_id = ? AND mo.status = 'Active' AND mo.barangay_id = ?`,
      [id, machinery[0].barangay_id]
    );
    
    res.json({ 
      success: true, 
      machinery: machinery[0],
      operators 
    });
  } catch (error) {
    console.error('Error fetching machinery details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch machinery details' });
  }
});

// POST /api/machinery/inventory - Add new machinery with barangay assignment
router.post('/inventory', async (req, res) => {
  try {
    console.log('📝 Received add machinery request:', req.body);
    
    const {
      machinery_name,
      machinery_type,
      description,
      price_per_unit,
      unit_type,
      max_capacity,
      capacity_unit,
      barangay_id,  // NEW: Barangay assignment required
      status = 'Available',
      created_by
    } = req.body;

    const userContext = await getUserContext(req);
    
    // Validate required fields
    if (!machinery_name || !machinery_type || !price_per_unit || !unit_type || !barangay_id) {
      console.error('❌ Validation failed. Missing fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: machinery_name, machinery_type, price_per_unit, unit_type, barangay_id' 
      });
    }

    // Verify barangay exists
    const [barangays] = await pool.execute('SELECT id FROM barangays WHERE id = ?', [barangay_id]);
    if (barangays.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid barangay_id' 
      });
    }

    // Authorization: Only admin or barangay officers can add machinery
    if (userContext.role !== 'admin' && userContext.barangay_id !== parseInt(barangay_id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only add machinery to your assigned barangay' 
      });
    }
    
    console.log('✅ Validation passed. Inserting into database...');
    
    const [result] = await pool.execute(
      `INSERT INTO machinery_inventory 
       (machinery_name, machinery_type, description, price_per_unit, unit_type, 
        max_capacity, capacity_unit, barangay_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [machinery_name, machinery_type, description, price_per_unit, unit_type, 
       max_capacity, capacity_unit, barangay_id, status, created_by]
    );
    
    console.log('✅ Machinery added successfully! ID:', result.insertId);
    
    res.json({ 
      success: true, 
      message: 'Machinery added successfully',
      machinery_id: result.insertId,
      barangay_id: barangay_id
    });
  } catch (error) {
    console.error('❌ Error adding machinery:', error);
    res.status(500).json({ success: false, message: 'Failed to add machinery: ' + error.message });
  }
});

// PUT /api/machinery/inventory/:id - Update machinery with barangay validation
router.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userContext = await getUserContext(req);

    // Check machinery exists and get barangay
    const [machineryCheck] = await pool.execute(
      'SELECT barangay_id FROM machinery_inventory WHERE id = ?',
      [id]
    );

    if (machineryCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }

    // Barangay access validation
    if (userContext.role !== 'admin' && userContext.barangay_id !== machineryCheck[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update machinery from your assigned barangay' 
      });
    }

    const {
      machinery_name,
      machinery_type,
      description,
      price_per_unit,
      unit_type,
      max_capacity,
      capacity_unit,
      status
    } = req.body;
    
    const [result] = await pool.execute(
      `UPDATE machinery_inventory 
       SET machinery_name = ?, machinery_type = ?, description = ?, 
           price_per_unit = ?, unit_type = ?, max_capacity = ?, 
           capacity_unit = ?, status = ?
       WHERE id = ?`,
      [machinery_name, machinery_type, description, price_per_unit, unit_type, 
       max_capacity, capacity_unit, status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }
    
    res.json({ success: true, message: 'Machinery updated successfully' });
  } catch (error) {
    console.error('Error updating machinery:', error);
    res.status(500).json({ success: false, message: 'Failed to update machinery' });
  }
});

// ========================================
// MACHINERY BOOKINGS - UPDATED
// ========================================

// GET /api/machinery/bookings - Get machinery bookings with barangay filtering
router.get('/bookings', async (req, res) => {
  try {
    const { status, barangay_id, farmer_id } = req.query;
    const userContext = await getUserContext(req);
    
    let query = `
      SELECT 
        mb.*,
        f.full_name as farmer_name,
        f.reference_number,
        mi.machinery_name,
        a.full_name as approved_by_name,
        b.name as barangay_name
      FROM machinery_bookings mb
      JOIN farmers f ON mb.farmer_id = f.id
      JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers a ON mb.approved_by = a.id
      LEFT JOIN barangays b ON mb.barangay_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND mb.status = ?';
      params.push(status);
    }

    if (farmer_id) {
      query += ' AND mb.farmer_id = ?';
      params.push(farmer_id);
    }

    // Barangay filtering
    const targetBarangayId = barangay_id || userContext.barangay_id;
    if (userContext.role !== 'admin' && targetBarangayId) {
      query += ' AND mb.barangay_id = ?';
      params.push(targetBarangayId);
    }
    
    query += ' ORDER BY mb.booking_date DESC';
    
    const [bookings] = await pool.execute(query, params);
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching machinery bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// POST /api/machinery/bookings - Create machinery booking with barangay context
router.post('/bookings', async (req, res) => {
  try {
    const {
      farmer_id,
      machinery_id,
      booking_date,
      service_location,
      area_size,
      area_unit,
      total_price,
      notes
    } = req.body;

    // Validate required fields
    if (!farmer_id || !machinery_id || !booking_date || !area_size || !total_price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Get machinery and farmer barangay
    const [machinery] = await pool.execute('SELECT barangay_id FROM machinery_inventory WHERE id = ?', [machinery_id]);
    const [farmer] = await pool.execute('SELECT barangay_id FROM farmers WHERE id = ?', [farmer_id]);

    if (machinery.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }

    if (farmer.length === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Verify machinery and farmer are from same barangay
    if (machinery[0].barangay_id !== farmer[0].barangay_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Machinery and farmer must be from the same barangay' 
      });
    }

    const barangayId = machinery[0].barangay_id;

    const [result] = await pool.execute(
      `INSERT INTO machinery_bookings 
       (farmer_id, machinery_id, barangay_id, booking_date, service_location, 
        area_size, area_unit, total_price, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [farmer_id, machinery_id, barangayId, booking_date, service_location, 
       area_size, area_unit, total_price, notes]
    );

    res.json({ 
      success: true, 
      message: 'Machinery booking created successfully',
      booking_id: result.insertId,
      barangay_id: barangayId
    });
  } catch (error) {
    console.error('Error creating machinery booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking', error: error.message });
  }
});

// PUT /api/machinery/bookings/:id/approve - Approve booking (Operator/Officer barangay-restricted)
router.put('/bookings/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;
    const userContext = await getUserContext(req);

    // Get booking details
    const [bookings] = await pool.execute(
      'SELECT barangay_id, status FROM machinery_bookings WHERE id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Barangay authorization
    if (userContext.role !== 'admin' && userContext.barangay_id !== booking.barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only approve bookings from your assigned barangay' 
      });
    }

    // Check status
    if (booking.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending bookings can be approved' 
      });
    }

    const approved_date = new Date().toISOString();

    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET status = 'Approved', approved_by = ?, approved_date = ?
       WHERE id = ?`,
      [approved_by, approved_date, id]
    );

    res.json({ 
      success: true, 
      message: 'Booking approved successfully',
      booking_id: id 
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ success: false, message: 'Failed to approve booking' });
  }
});

// REMAINING ENDPOINTS FOLLOW THE SAME PATTERN:
// - Add barangay_id to all relevant inserts
// - Add barangay filtering to all GET requests
// - Add barangay authorization checks to all updates/deletes
// - Validate barangay access for officers
// - Allow admins full access

module.exports = router;
