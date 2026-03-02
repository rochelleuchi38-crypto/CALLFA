const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyBookingBarangayAccess } = require('../middleware/auth');

// ========================================
// MACHINERY INVENTORY ROUTES (Admin Only)
// ========================================

// GET /api/machinery/inventory - Get all machinery inventory (Admin views all, others view their barangay only)
router.get('/inventory', async (req, res) => {
  try {
    // Get user from token for barangay filtering
    const token = req.headers.authorization?.split(' ')[1];
    let userRole = 'guest';
    let userBarangayId = null;
    const jwt = require('jsonwebtoken');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userRole = decoded.role || 'guest';
        
        // Get current user info from database to ensure barangay is up-to-date
        const [user] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
        if (user.length > 0) {
          userRole = user[0].role;
          userBarangayId = user[0].barangay_id;
        }
      } catch (err) {
        // Token invalid, proceed with guest view
      }
    }

    const { status, machinery_type, barangay_id } = req.query;
    
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

    // Barangay filtering:
    // - Admin can see all barangays (or filter if barangay_id provided)
    // - All other roles (president, treasurer, auditor, farmer) see only their barangay
    const barangayRestrictedRoles = ['president', 'treasurer', 'auditor', 'farmer'];
    if (barangayRestrictedRoles.includes(userRole)) {
      // These roles always see only their barangay
      query += ' AND mi.barangay_id = ?';
      params.push(userBarangayId);
    } else if (userRole === 'admin' && barangay_id) {
      // Admin can filter by barangay if provided
      query += ' AND mi.barangay_id = ?';
      params.push(barangay_id);
    }
    
    query += ' GROUP BY mi.id ORDER BY mi.created_at DESC';
    
    const [inventory] = await pool.execute(query, params);
    res.json({ success: true, inventory, filtered_by_barangay: barangayRestrictedRoles.includes(userRole) });
  } catch (error) {
    console.error('Error fetching machinery inventory:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch machinery inventory' });
  }
});

// GET /api/machinery/inventory/:id - Get single machinery details
router.get('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [machinery] = await pool.execute(
      `SELECT 
        mi.*,
        f.full_name as created_by_name
      FROM machinery_inventory mi
      LEFT JOIN farmers f ON mi.created_by = f.id
      WHERE mi.id = ?`,
      [id]
    );
    
    if (machinery.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }
    
    // Get assigned operators
    const [operators] = await pool.execute(
      `SELECT 
        mo.*,
        f.full_name as operator_name,
        f.reference_number
      FROM machinery_operators mo
      JOIN farmers f ON mo.farmer_id = f.id
      WHERE mo.machinery_id = ? AND mo.status = 'Active'`,
      [id]
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

// POST /api/machinery/inventory - Add new machinery (Admin or President only)
router.post('/inventory', async (req, res) => {
  try {
    console.log('📝 Received add machinery request:', req.body);
    
    // Verify token and get user role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const jwt = require('jsonwebtoken');
    let userRole = 'guest';
    let userBarangayId = null;
    let userId = null;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userRole = decoded.role;
      userBarangayId = decoded.barangay_id;
      userId = decoded.id;
      
      // Verify user role from database
      const [user] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [userId]);
      if (user.length === 0 || !['admin', 'president'].includes(user[0].role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only admin and president can add machinery' 
        });
      }
      userRole = user[0].role;
      userBarangayId = user[0].barangay_id;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    const {
      machinery_name,
      machinery_type,
      description,
      price_per_unit,
      unit_type,
      max_capacity,
      capacity_unit,
      status = 'Available',
      created_by,
      barangay_id
    } = req.body;
    
    // Validate required fields
    if (!machinery_name || !machinery_type || !price_per_unit || !unit_type) {
      console.error('❌ Validation failed. Missing fields:', {
        machinery_name: !!machinery_name,
        machinery_type: !!machinery_type,
        price_per_unit: !!price_per_unit,
        unit_type: !!unit_type
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: machinery_name, machinery_type, price_per_unit, unit_type' 
      });
    }

    // Validate barangay_id
    let finalBarangayId = barangay_id;
    if (!finalBarangayId) {
      return res.status(400).json({ 
        success: false, 
        message: 'barangay_id is required' 
      });
    }

    // For president, enforce barangay isolation
    if (userRole === 'president') {
      if (userBarangayId !== parseInt(finalBarangayId)) {
        return res.status(403).json({ 
          success: false, 
          message: `President can only manage machinery in barangay ${userBarangayId}` 
        });
      }
    }

    // Validate barangay exists
    const [barangays] = await pool.execute('SELECT id FROM barangays WHERE id = ?', [finalBarangayId]);
    if (barangays.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid barangay_id' 
      });
    }
    
    console.log('✅ Validation passed. Inserting into database...');
    
    const [result] = await pool.execute(
      `INSERT INTO machinery_inventory 
       (machinery_name, machinery_type, description, price_per_unit, unit_type, 
        max_capacity, capacity_unit, status, created_by, barangay_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [machinery_name, machinery_type, description, price_per_unit, unit_type, 
       max_capacity, capacity_unit, status, userId, finalBarangayId]
    );
    
    console.log('✅ Machinery added successfully! ID:', result.insertId);
    
    res.json({ 
      success: true, 
      message: 'Machinery added successfully',
      machinery_id: result.insertId 
    });
  } catch (error) {
    console.error('❌ Error adding machinery:', error);
    res.status(500).json({ success: false, message: 'Failed to add machinery: ' + error.message });
  }
});

// PUT /api/machinery/inventory/:id - Update machinery (Admin or President only)
router.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify token and get user role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const jwt = require('jsonwebtoken');
    let userRole = 'guest';
    let userBarangayId = null;
    let userId = null;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userRole = decoded.role;
      userBarangayId = decoded.barangay_id;
      userId = decoded.id;
      
      // Verify user role from database
      const [user] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [userId]);
      if (user.length === 0 || !['admin', 'president'].includes(user[0].role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only admin and president can update machinery' 
        });
      }
      userRole = user[0].role;
      userBarangayId = user[0].barangay_id;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get current machinery to check barangay
    const [machinery] = await pool.execute('SELECT barangay_id FROM machinery_inventory WHERE id = ?', [id]);
    if (machinery.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }

    const currentBarangayId = machinery[0].barangay_id;

    // For president, enforce barangay isolation
    if (userRole === 'president' && userBarangayId !== currentBarangayId) {
      return res.status(403).json({ 
        success: false, 
        message: `President can only manage machinery in barangay ${userBarangayId}` 
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
      status,
      barangay_id
    } = req.body;
    
    // If barangay is being changed, validate authorization
    if (barangay_id && barangay_id !== currentBarangayId) {
      if (userRole === 'president') {
        return res.status(403).json({ 
          success: false, 
          message: 'President cannot change machinery barangay' 
        });
      }
      // For admin, validate new barangay exists
      const [barangays] = await pool.execute('SELECT id FROM barangays WHERE id = ?', [barangay_id]);
      if (barangays.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid barangay_id' 
        });
      }
    }
    
    const [result] = await pool.execute(
      `UPDATE machinery_inventory 
       SET machinery_name = ?, machinery_type = ?, description = ?, 
           price_per_unit = ?, unit_type = ?, max_capacity = ?, 
           capacity_unit = ?, status = ?, barangay_id = ?
       WHERE id = ?`,
      [machinery_name, machinery_type, description, price_per_unit, unit_type, 
       max_capacity, capacity_unit, status, barangay_id || currentBarangayId, id]
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

// DELETE /api/machinery/inventory/:id - Delete machinery (Admin or President only)
router.delete('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify token and get user role
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const jwt = require('jsonwebtoken');
    let userRole = 'guest';
    let userBarangayId = null;
    let userId = null;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userRole = decoded.role;
      userBarangayId = decoded.barangay_id;
      userId = decoded.id;
      
      // Verify user role from database
      const [user] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [userId]);
      if (user.length === 0 || !['admin', 'president'].includes(user[0].role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only admin and president can delete machinery' 
        });
      }
      userRole = user[0].role;
      userBarangayId = user[0].barangay_id;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get machinery to check barangay
    const [machinery] = await pool.execute('SELECT barangay_id FROM machinery_inventory WHERE id = ?', [id]);
    if (machinery.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }

    // For president, enforce barangay isolation
    if (userRole === 'president' && userBarangayId !== machinery[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: `President can only delete machinery in barangay ${userBarangayId}` 
      });
    }
    
    // Check if machinery has active bookings
    const [activeBookings] = await pool.execute(
      `SELECT id FROM machinery_bookings 
       WHERE machinery_id = ? AND status IN ('Pending', 'Approved')`,
      [id]
    );
    
    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete machinery with active bookings' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM machinery_inventory WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }
    
    res.json({ success: true, message: 'Machinery deleted successfully' });
  } catch (error) {
    console.error('Error deleting machinery:', error);
    res.status(500).json({ success: false, message: 'Failed to delete machinery' });
  }
});

// ========================================
// MACHINERY OPERATORS ROUTES
// ========================================

// GET /api/machinery/operators - Get all operators
router.get('/operators', async (req, res) => {
  try {
    const { machinery_id, status } = req.query;
    
    let query = `
      SELECT 
        mo.*,
        f.full_name as operator_name,
        f.reference_number,
        f.phone_number,
        mi.machinery_name,
        mi.machinery_type
      FROM machinery_operators mo
      JOIN farmers f ON mo.farmer_id = f.id
      JOIN machinery_inventory mi ON mo.machinery_id = mi.id
      WHERE 1=1
    `;
    const params = [];
    
    if (machinery_id) {
      query += ' AND mo.machinery_id = ?';
      params.push(machinery_id);
    }
    
    if (status) {
      query += ' AND mo.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY mo.assigned_date DESC';
    
    const [operators] = await pool.execute(query, params);
    res.json({ success: true, operators });
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch operators' });
  }
});

// POST /api/machinery/operators - Assign operator to machinery
router.post('/operators', async (req, res) => {
  try {
    const { farmer_id, machinery_id, assigned_date } = req.body;
    
    if (!farmer_id || !machinery_id || !assigned_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: farmer_id, machinery_id, assigned_date' 
      });
    }
    
    // Check if farmer exists and has operator role
    const [farmer] = await pool.execute(
      'SELECT id, role FROM farmers WHERE id = ?',
      [farmer_id]
    );
    
    if (farmer.length === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    
    if (!["operator", "operation_manager", "business_manager"].includes(farmer[0].role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Farmer must have operator, Operation Manager, or Business Manager role' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO machinery_operators (farmer_id, machinery_id, assigned_date, status)
       VALUES (?, ?, ?, 'Active')
       ON DUPLICATE KEY UPDATE status = 'Active', assigned_date = VALUES(assigned_date)`,
      [farmer_id, machinery_id, assigned_date]
    );
    
    res.json({ 
      success: true, 
      message: 'Operator assigned successfully',
      operator_id: result.insertId 
    });
  } catch (error) {
    console.error('Error assigning operator:', error);
    res.status(500).json({ success: false, message: 'Failed to assign operator' });
  }
});

// PUT /api/machinery/operators/:id - Update operator status
router.put('/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE machinery_operators SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Operator assignment not found' });
    }
    
    res.json({ success: true, message: 'Operator status updated successfully' });
  } catch (error) {
    console.error('Error updating operator:', error);
    res.status(500).json({ success: false, message: 'Failed to update operator' });
  }
});

// DELETE /api/machinery/operators/:id - Remove operator assignment
router.delete('/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM machinery_operators WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Operator assignment not found' });
    }
    
    res.json({ success: true, message: 'Operator removed successfully' });
  } catch (error) {
    console.error('Error removing operator:', error);
    res.status(500).json({ success: false, message: 'Failed to remove operator' });
  }
});

// ========================================
// MACHINERY BOOKINGS ROUTES
// ========================================

// Helper function to calculate booking price
const calculateBookingPrice = (machinery, areaSize, areaUnit) => {
  const pricePerUnit = parseFloat(machinery.price_per_unit);
  const size = parseFloat(areaSize);
  
  // Validate that booking unit matches machinery capacity unit
  if (machinery.capacity_unit && areaUnit !== machinery.capacity_unit) {
    throw new Error(`This machinery must be booked in ${machinery.capacity_unit}, not ${areaUnit}`);
  }
  
  // Validate capacity limits
  if (machinery.max_capacity) {
    const maxCap = parseFloat(machinery.max_capacity);
    if (size > maxCap) {
      throw new Error(`Maximum capacity for ${machinery.machinery_type} is ${maxCap} ${machinery.capacity_unit} per day`);
    }
  }
  
  // IMPROVED: Handle 'per load' pricing (flat rate) vs per unit pricing
  if (machinery.unit_type === 'per load') {
    // Flat rate for entire load (e.g., Dryer: ₱7,500 for up to 100 kabans)
    return pricePerUnit;
  } else {
    // Per unit pricing (e.g., Tractor: ₱500 per hectare = 60 × 500)
    return pricePerUnit * size;
  }
};

// Helper function to check booking availability
const checkBookingAvailability = async (machineryId, bookingDate, areaSize, excludeBookingId = null, checkForApproval = false) => {
  // Only count APPROVED, COMPLETED bookings toward capacity
  // Pending and Rejected bookings should NOT count
  let query = `SELECT SUM(area_size) as total_booked
     FROM machinery_bookings
     WHERE machinery_id = ? 
     AND booking_date = ? 
     AND status IN ('Approved', 'Completed')`;
  
  const params = [machineryId, bookingDate];
  
  // Exclude current booking when checking during approval
  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }
  
  const [bookings] = await pool.execute(query, params);
  
  const [machinery] = await pool.execute(
    'SELECT max_capacity FROM machinery_inventory WHERE id = ?',
    [machineryId]
  );
  
  if (machinery.length === 0) {
    throw new Error('Machinery not found');
  }
  
  const maxCapacity = machinery[0].max_capacity;
  if (!maxCapacity) {
    return true; // No capacity limit
  }
  
  const totalBooked = parseFloat(bookings[0].total_booked || 0);
  const requestedSize = parseFloat(areaSize);
  const maxCap = parseFloat(maxCapacity);
  
  console.log(`📊 Capacity check for machinery ${machineryId} on ${bookingDate}:`, {
    maxCapacity: maxCap,
    totalBooked,
    requestedSize,
    totalAfter: totalBooked + requestedSize,
    wouldExceed: (totalBooked + requestedSize) > maxCap
  });
  
  if (totalBooked + requestedSize > maxCap) {
    return false;
  }
  
  return true;
};

// GET /api/machinery/bookings - Get all bookings with barangay filtering
router.get('/bookings', async (req, res) => {
  try {
    // Get user from token for barangay filtering
    const token = req.headers.authorization?.split(' ')[1];
    let userRole = 'guest';
    let userBarangayId = null;
    let userId = null;
    const jwt = require('jsonwebtoken');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userRole = decoded.role || 'guest';
        userBarangayId = decoded.barangay_id;
        userId = decoded.id;
        
        // IMPORTANT: Verify user's barangay from database to ensure it's current
        if (userId && userRole !== 'admin') {
          const [user] = await pool.execute(
            'SELECT role, barangay_id FROM farmers WHERE id = ?',
            [userId]
          );
          if (user.length > 0) {
            userRole = user[0].role;
            userBarangayId = user[0].barangay_id;
          }
        }
      } catch (err) {
        console.error('Token verification error:', err.message);
        // Token invalid, proceed with guest view
      }
    }

    const { farmer_id, machinery_id, status, payment_status, start_date, end_date, barangay_id, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        mb.*,
        f.full_name as farmer_name,
        f.reference_number,
        f.phone_number as farmer_phone,
        f.barangay_id as farmer_barangay,
        mi.machinery_name,
        mi.machinery_type,
        a.full_name as approved_by_name,
        pr.full_name as payment_recorded_by_name,
        b.name as barangay_name
      FROM machinery_bookings mb
      JOIN farmers f ON mb.farmer_id = f.id
      JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers a ON mb.approved_by = a.id
      LEFT JOIN farmers pr ON mb.payment_recorded_by = pr.id
      LEFT JOIN barangays b ON mb.barangay_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    if (farmer_id) {
      query += ' AND mb.farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (machinery_id) {
      query += ' AND mb.machinery_id = ?';
      params.push(machinery_id);
    }
    
    if (status) {
      // Special case: 'Completed' filter includes both 'In Use' and 'Completed' statuses
      if (status === 'Completed') {
        query += ' AND mb.status IN (?, ?)';
        params.push('In Use', 'Completed');
      } else {
        query += ' AND mb.status = ?';
        params.push(status);
      }
    }
    
    if (payment_status) {
      query += ' AND mb.payment_status = ?';
      params.push(payment_status);
    }
    
    if (start_date) {
      query += ' AND mb.booking_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND mb.booking_date <= ?';
      params.push(end_date);
    }

    // CRITICAL: Barangay filtering based on user role
    // - Admin: Can see all barangays
    // - President/Operation Manager/Business Manager: Only their assigned barangay
    // - Farmer: Only their own bookings (already filtered by farmer_id if present)
    if (userRole === 'operation_manager' || userRole === 'business_manager') {
      // These roles can ONLY approve pending bookings from their assigned barangay
      // Ensure both booking's barangay AND farmer's barangay match their assigned barangay
      if (!userBarangayId) {
        // Manager has no barangay assigned - return empty results
        query += ' AND 1=0';
      } else {
        query += ' AND mb.barangay_id = ? AND f.barangay_id = ?';
        params.push(userBarangayId, userBarangayId);
        // NOTE: Removed auto-filter to Pending - frontend handles default filter
        // This allows fetching all statuses for count purposes
      }
    } else if (userRole === 'president') {
      // Presidents see their barangay's bookings regardless of status
      if (!userBarangayId) {
        query += ' AND 1=0';
      } else {
        query += ' AND mb.barangay_id = ? AND f.barangay_id = ?';
        params.push(userBarangayId, userBarangayId);
      }
    } else if (userRole === 'farmer') {
      // Farmers see only their own bookings
      if (!userId) {
        query += ' AND 1=0';
      } else {
        query += ' AND mb.farmer_id = ?';
        params.push(userId);
      }
    } else if (userRole === 'operator') {
      // Operators see approved/in-use bookings from their assigned barangay
      // They process bookings (deploy equipment, complete, mark incomplete)
      if (!userBarangayId) {
        query += ' AND 1=0';
      } else {
        query += ' AND mb.barangay_id = ? AND f.barangay_id = ?';
        params.push(userBarangayId, userBarangayId);
      }
    } else if (userRole !== 'admin') {
      // Other roles: no additional bookings (security measure)
      query += ' AND 1=0';
    }
    
    query += ' ORDER BY mb.booking_date DESC, mb.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [bookings] = await pool.execute(query, params);
    
    console.log(`📥 Fetched ${bookings.length} bookings for ${userRole} (ID: ${userId}, Barangay: ${userBarangayId})`);
    
    res.json({ 
      success: true, 
      bookings, 
      filtered_by_barangay: userRole !== 'admin', 
      user_role: userRole,
      user_barangay: userBarangayId
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /api/machinery/bookings/:id - Get single booking details with barangay info
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user from token for barangay verification
    const token = req.headers.authorization?.split(' ')[1];
    let userRole = 'guest';
    let userBarangayId = null;
    const jwt = require('jsonwebtoken');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userRole = decoded.role || 'guest';
        userBarangayId = decoded.barangay_id;
      } catch (err) {
        // Token invalid
      }
    }
    
    const [booking] = await pool.execute(
      `SELECT 
        mb.*,
        f.full_name as farmer_name,
        f.reference_number,
        f.phone_number as farmer_phone,
        f.address as farmer_address,
        f.barangay_id as farmer_barangay,
        mi.machinery_name,
        mi.machinery_type,
        mi.price_per_unit,
        mi.unit_type,
        a.full_name as approved_by_name,
        b.name as barangay_name
      FROM machinery_bookings mb
      JOIN farmers f ON mb.farmer_id = f.id
      JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      LEFT JOIN farmers a ON mb.approved_by = a.id
      LEFT JOIN barangays b ON mb.barangay_id = b.id
      WHERE mb.id = ?`,
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify barangay access for non-admin users
    if (userRole !== 'admin' && userBarangayId && userBarangayId !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access bookings from your assigned barangay.' 
      });
    }
    
    res.json({ success: true, booking: booking[0] });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking details' });
  }
});

// GET /api/machinery/bookings/farmer-balance/:farmer_id - Check farmer's outstanding balance
router.get('/bookings/farmer-balance/:farmer_id', async (req, res) => {
  try {
    const { farmer_id } = req.params;
    
    // Get all completed bookings with unpaid or partial payment status
    const [unpaidBookings] = await pool.execute(
      `SELECT 
        mb.id,
        mb.booking_date,
        mi.machinery_name,
        mi.machinery_type,
        mb.total_price,
        COALESCE(mb.total_paid, 0) as total_paid,
        (mb.total_price - COALESCE(mb.total_paid, 0)) as remaining_balance,
        mb.payment_status
      FROM machinery_bookings mb
      LEFT JOIN machinery_inventory mi ON mb.machinery_id = mi.id
      WHERE mb.farmer_id = ? 
        AND mb.status = 'Completed' 
        AND (mb.payment_status = 'Unpaid' OR mb.payment_status = 'Partial')
        AND (mb.total_price - COALESCE(mb.total_paid, 0)) > 0
      ORDER BY mb.booking_date ASC`,
      [farmer_id]
    );
    
    const totalOutstandingBalance = unpaidBookings.reduce((sum, b) => sum + parseFloat(b.remaining_balance || 0), 0);
    
    res.json({
      success: true,
      has_outstanding_balance: totalOutstandingBalance > 0,
      total_outstanding_balance: parseFloat(totalOutstandingBalance.toFixed(2)),
      unpaid_bookings: unpaidBookings,
      can_book: totalOutstandingBalance <= 0
    });
  } catch (error) {
    console.error('Error checking farmer balance:', error);
    res.status(500).json({ success: false, message: 'Failed to check farmer balance' });
  }
});

// POST /api/machinery/bookings - Create new booking (Farmer)
router.post('/bookings', async (req, res) => {
  try {
    console.log('📝 Received booking request:', req.body);
    
    const {
      farmer_id,
      machinery_id,
      booking_date,
      service_location,
      area_size,
      area_unit,
      notes
    } = req.body;
    
    // Validate required fields
    if (!farmer_id || !machinery_id || !booking_date || !service_location || !area_size || !area_unit) {
      console.error('❌ Validation failed. Missing fields:', {
        farmer_id: !!farmer_id,
        machinery_id: !!machinery_id,
        booking_date: !!booking_date,
        service_location: !!service_location,
        area_size: !!area_size,
        area_unit: !!area_unit
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: farmer_id, machinery_id, booking_date, service_location, area_size, area_unit' 
      });
    }
    
    console.log('✅ Validation passed. Getting farmer and machinery details...');
    
    // Get farmer's barangay
    const [farmer] = await pool.execute(
      'SELECT barangay_id FROM farmers WHERE id = ?',
      [farmer_id]
    );
    
    if (farmer.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Farmer not found' 
      });
    }

    const barangayId = farmer[0].barangay_id;
    
    // Check for outstanding balance from completed bookings
    const [unpaidBookings] = await pool.execute(
      `SELECT 
        SUM(mb.total_price - COALESCE(mb.total_paid, 0)) as total_outstanding
      FROM machinery_bookings mb
      WHERE mb.farmer_id = ? 
        AND mb.status = 'Completed' 
        AND (mb.payment_status = 'Unpaid' OR mb.payment_status = 'Partial')
        AND (mb.total_price - COALESCE(mb.total_paid, 0)) > 0`,
      [farmer_id]
    );
    
    const totalOutstanding = parseFloat(unpaidBookings[0]?.total_outstanding || 0);
    if (totalOutstanding > 0) {
      return res.status(403).json({
        success: false,
        message: `You have an outstanding balance of ₱${totalOutstanding.toFixed(2)} from previous bookings. Please settle your balance before booking new machinery.`,
        outstanding_balance: totalOutstanding
      });
    }
    
    // Get machinery details and verify it belongs to the same barangay
    const [machinery] = await pool.execute(
      'SELECT * FROM machinery_inventory WHERE id = ? AND status = "Available"',
      [machinery_id]
    );
    
    if (machinery.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Machinery not available for booking' 
      });
    }

    // CRITICAL: Verify machinery belongs to farmer's barangay
    if (machinery[0].barangay_id && machinery[0].barangay_id !== barangayId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Machinery is not available in your barangay' 
      });
    }
    
    // Check availability for the date
    const isAvailable = await checkBookingAvailability(machinery_id, booking_date, area_size, null, false);
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Machinery is not available for the requested date and capacity' 
      });
    }
    
    // Calculate total price
    let totalPrice;
    try {
      totalPrice = calculateBookingPrice(machinery[0], area_size, area_unit);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    // Create booking with barangay_id
    const [result] = await pool.execute(
      `INSERT INTO machinery_bookings 
       (farmer_id, machinery_id, barangay_id, booking_date, service_location, area_size, 
        area_unit, total_price, remaining_balance, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [farmer_id, machinery_id, barangayId, booking_date, service_location, area_size, 
       area_unit, totalPrice, totalPrice, notes]
    );
    
    console.log('✅ Booking created successfully! Booking ID:', result.insertId);
    
    res.json({ 
      success: true, 
      message: 'Booking created successfully',
      booking_id: result.insertId,
      total_price: totalPrice,
      barangay_id: barangayId
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking', error: error.message });
  }
});

// PUT /api/machinery/bookings/:id/approve - Approve booking (Business Manager / Operation Manager from same barangay only)
router.put('/bookings/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;
    
    if (!approved_by) {
      return res.status(400).json({ 
        success: false, 
        message: 'approved_by is required' 
      });
    }
    
    // Get manager and their barangay
    const [manager] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [approved_by]
    );
    
    if (manager.length === 0 || !["operation_manager", "business_manager", "admin"].includes(manager[0].role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Business Managers, Operation Managers, or Admin can approve bookings' 
      });
    }
    
    // Get booking and verify barangay access
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify manager's barangay matches booking's barangay (unless admin)
    if (manager[0].role !== 'admin' && manager[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only approve bookings from your assigned barangay.' 
      });
    }
    
    if (booking[0].status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending bookings can be approved' 
      });
    }
    
    // Recheck availability
    const isAvailable = await checkBookingAvailability(
      booking[0].machinery_id, 
      booking[0].booking_date, 
      booking[0].area_size,
      id,
      true
    );
    
    if (!isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Machinery capacity exceeded for this date' 
      });
    }
    
    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET status = 'Approved', 
           approved_by = ?, 
           approved_date = NOW()
       WHERE id = ?`,
      [approved_by, id]
    );

    console.log(`✅ Booking ${id} approved by ${manager[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    res.json({ 
      success: true, 
      message: 'Booking approved successfully. Operator can now deploy equipment.',
      booking_id: id,
      status: 'Approved',
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ success: false, message: 'Failed to approve booking' });
  }
});

// PUT /api/machinery/bookings/:id/reject - Reject booking (Business Manager / Operation Manager from same barangay only)
router.put('/bookings/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by, rejection_reason } = req.body;
    
    if (!approved_by || !rejection_reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'approved_by and rejection_reason are required' 
      });
    }
    
    // Get manager and their barangay
    const [manager] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [approved_by]
    );
    
    if (manager.length === 0 || !["operation_manager", "business_manager", "admin"].includes(manager[0].role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Business Managers, Operation Managers, or Admin can reject bookings' 
      });
    }
    
    // Get booking
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify manager's barangay matches booking's barangay (unless admin)
    if (manager[0].role !== 'admin' && manager[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only reject bookings from your assigned barangay.' 
      });
    }
    
    if (booking[0].status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending bookings can be rejected' 
      });
    }
    
    // Reject booking
    await pool.execute(
      `UPDATE machinery_bookings 
       SET status = 'Rejected', approved_by = ?, rejection_reason = ?, approved_date = NOW()
       WHERE id = ?`,
      [approved_by, rejection_reason, id]
    );

    console.log(`❌ Booking ${id} rejected by ${manager[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    res.json({ 
      success: true, 
      message: 'Booking rejected successfully',
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ success: false, message: 'Failed to reject booking' });
  }
});

// POST /api/machinery/bookings/:id/payment - Record payment for booking (Treasurer from same barangay)
// IMPROVED: Separated from status transitions - payment is independent of workflow
router.post('/bookings/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      payment_date, 
      amount, 
      receipt_number = null,
      remarks = null,
      recorded_by 
    } = req.body;
    
    if (!payment_date || !amount || !recorded_by) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: payment_date, amount, recorded_by' 
      });
    }
    
    // Get treasurer and their barangay
    const [user] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [recorded_by]
    );
    
    if (user.length === 0 || (user[0].role !== 'treasurer' && user[0].role !== 'admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only treasurers or admin can record payments. Access denied.' 
      });
    }
    
    // Get booking and verify barangay access
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify treasurer's barangay matches booking's barangay (unless admin)
    if (user[0].role !== 'admin' && user[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only record payments for bookings in your assigned barangay.' 
      });
    }
    
    // IMPROVED: Only allow payment for bookings that aren't Cancelled, Rejected, or already fully paid
    if (['Cancelled', 'Rejected'].includes(booking[0].status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot record payment for ${booking[0].status} booking` 
      });
    }
    
    const paymentAmount = parseFloat(amount);
    const currentRemainingBalance = parseFloat(booking[0].remaining_balance || booking[0].total_price);
    
    // Validate payment amount doesn't exceed remaining balance
    if (paymentAmount > currentRemainingBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Payment amount (₱${paymentAmount.toFixed(2)}) cannot exceed remaining balance (₱${currentRemainingBalance.toFixed(2)})` 
      });
    }
    
    // Record payment
    await pool.execute(
      `INSERT INTO machinery_booking_payments 
       (booking_id, payment_date, amount, receipt_number, remarks, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, payment_date, paymentAmount, receipt_number, remarks, recorded_by]
    );
    
    // Update booking totals
    const newTotalPaid = parseFloat(booking[0].total_paid || 0) + paymentAmount;
    const newRemainingBalance = parseFloat(booking[0].total_price) - newTotalPaid;
    const newPaymentStatus = newRemainingBalance <= 0 ? 'Paid' : 'Partial';
    
    await pool.execute(
      `UPDATE machinery_bookings 
       SET total_paid = ?, 
           remaining_balance = ?, 
           payment_status = ?,
           last_payment_date = ?
       WHERE id = ?`,
      [newTotalPaid, Math.max(0, newRemainingBalance), newPaymentStatus, payment_date, id]
    );

    console.log(`💰 Payment recorded for Booking ${id} by ${user[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    res.json({ 
      success: true, 
      message: 'Payment recorded successfully',
      total_paid: parseFloat(newTotalPaid.toFixed(2)),
      remaining_balance: parseFloat(Math.max(0, newRemainingBalance).toFixed(2)),
      payment_status: newPaymentStatus,
      status: booking[0].status,
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
});

// GET /api/machinery/bookings/:id/payments - Get payment history for a booking
router.get('/bookings/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [payments] = await pool.execute(
      `SELECT 
        mbp.*,
        f.full_name as recorded_by_name
      FROM machinery_booking_payments mbp
      LEFT JOIN farmers f ON mbp.recorded_by = f.id
      WHERE mbp.booking_id = ?
      ORDER BY mbp.payment_date DESC`,
      [id]
    );
    
    res.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// PUT /api/machinery/bookings/:id/deploy - Deploy equipment to operator from same barangay
router.put('/bookings/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      operator_id,
      equipment_deployed_date = new Date().toISOString().slice(0, 19).replace('T', ' '),
      equipment_deployed_notes = null
    } = req.body;
    
    if (!operator_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'operator_id is required' 
      });
    }
    
    // Get operator and their barangay
    const [operator] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [operator_id]
    );
    
    if (operator.length === 0) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }
    
    if (operator[0].role !== 'operator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only operators can deploy equipment' 
      });
    }
    
    // Get booking
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify operator's barangay matches booking's barangay
    if (operator[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Operator can only deploy equipment for bookings in their assigned barangay.' 
      });
    }
    
    // Can only deploy from Approved status
    if (booking[0].status !== 'Approved') {
      return res.status(400).json({ 
        success: false, 
        message: `Equipment can only be deployed from Approved status. Current status: ${booking[0].status}` 
      });
    }
    
    // Track equipment deployment with timestamp
    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET status = 'In Use',
           machine_used = 1,
           equipment_deployed_date = ?,
           operational_notes = ?
       WHERE id = ?`,
      [equipment_deployed_date, equipment_deployed_notes, id]
    );

    console.log(`⚙️ Equipment deployed for Booking ${id} by ${operator[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking not found or cannot be updated' 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Equipment deployed to operator ${operator[0].full_name}`,
      status: 'In Use',
      deployed_at: equipment_deployed_date,
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error deploying equipment:', error);
    res.status(500).json({ success: false, message: 'Failed to deploy equipment' });
  }
});

// PUT /api/machinery/bookings/:id/return-equipment - Operator returns equipment from same barangay
router.put('/bookings/:id/return-equipment', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      operator_id,
      equipment_return_date = new Date().toISOString().slice(0, 19).replace('T', ' '),
      equipment_hours_used = null,
      operational_notes = null
    } = req.body;
    
    if (!operator_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'operator_id is required' 
      });
    }
    
    // Get operator and their barangay
    const [operator] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [operator_id]
    );
    
    if (operator.length === 0) {
      return res.status(404).json({ success: false, message: 'Operator not found' });
    }
    
    if (operator[0].role !== 'operator') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only operators can return equipment' 
      });
    }
    
    // Get booking
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify operator's barangay matches booking's barangay
    if (operator[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Operator can only return equipment for bookings in their assigned barangay.' 
      });
    }
    
    // Equipment can only be returned from "In Use" status
    if (booking[0].status !== 'In Use') {
      return res.status(400).json({ 
        success: false, 
        message: `Equipment can only be returned from "In Use" status. Current: ${booking[0].status}` 
      });
    }
    
    // Record operator sign-off with usage details
    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET equipment_return_date = ?,
           equipment_hours_used = ?,
           operator_signoff = 1,
           operator_signoff_date = NOW(),
           operator_signoff_by = ?,
           operational_notes = ?
       WHERE id = ?`,
      [equipment_return_date, equipment_hours_used, operator_id, operational_notes, id]
    );

    console.log(`✔️ Equipment returned and signed off for Booking ${id} by ${operator[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    res.json({ 
      success: true, 
      message: `Equipment returned and signed off by ${operator[0].full_name}. Awaiting Admin to mark Booking as Completed.`,
      operator_signoff: true,
      signoff_time: new Date().toISOString(),
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error returning equipment:', error);
    res.status(500).json({ success: false, message: 'Failed to return equipment' });
  }
});

// PUT /api/machinery/bookings/:id/complete - Mark booking as completed or incomplete (Operator only)
// This transitions: Approved → Completed or Approved → Incomplete
router.put('/bookings/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { status_action = 'completed', operator_id } = req.body;
    
    // Validate status_action
    if (!['completed', 'incomplete'].includes(status_action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status action. Must be "completed" or "incomplete"' 
      });
    }
    
    // Verify operator role and barangay
    if (operator_id) {
      const [operator] = await pool.execute(
        'SELECT role, barangay_id FROM farmers WHERE id = ?',
        [operator_id]
      );
      
      if (operator.length === 0 || operator[0].role !== 'operator') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only operators can mark bookings as completed or incomplete' 
        });
      }
    }
    
    // Get current booking details
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify operator's barangay matches booking's barangay (if operator_id provided)
    if (operator_id) {
      const [operator] = await pool.execute(
        'SELECT barangay_id FROM farmers WHERE id = ?',
        [operator_id]
      );
      if (operator.length > 0 && operator[0].barangay_id !== booking[0].barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Operator can only complete bookings from their assigned barangay.' 
        });
      }
    }
    
    // Check if booking is approved
    if (booking[0].status !== 'Approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only approved bookings can be marked as completed or incomplete' 
      });
    }
    
    // Determine new status based on action
    let newStatus = booking[0].status;
    
    if (status_action === 'completed') {
      // Mark booking as completed - machine usage finished
      newStatus = 'Completed';
    } else if (status_action === 'incomplete') {
      // Mark as Incomplete (equipment issue, etc.)
      newStatus = 'Incomplete';
    }
    
    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET status = ?,
           machine_used = ?
       WHERE id = ?`,
      [newStatus, status_action === 'completed' ? 1 : 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking not found or cannot be updated' 
      });
    }
    
    const messageMap = {
      'completed': 'Booking marked as completed successfully.',
      'incomplete': 'Booking marked as incomplete'
    };
    
    res.json({ 
      success: true, 
      message: messageMap[status_action],
      status: newStatus
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status', error: error.message });
  }
});

// PUT /api/machinery/bookings/:id/mark-completed - Mark "In Use" booking as "Completed" (Admin/President/Treasurer from same barangay)
router.put('/bookings/:id/mark-completed', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_by } = req.body;
    
    if (!completed_by) {
      return res.status(400).json({ 
        success: false, 
        message: 'completed_by is required' 
      });
    }
    
    // Get user and their barangay
    const [user] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [completed_by]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (!['admin', 'president', 'treasurer'].includes(user[0].role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Admin, President, or Treasurer can complete bookings' 
      });
    }
    
    // Get booking
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify user's barangay matches booking's barangay (unless admin)
    if (user[0].role !== 'admin' && user[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only complete bookings from your assigned barangay.' 
      });
    }
    
    if (booking[0].status !== 'In Use') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only bookings in "In Use" status can be marked as completed. Current status: ' + booking[0].status 
      });
    }
    
    // Mark booking as Completed - this moves it to A/R & Collections for payment tracking
    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET status = 'Completed',
           completed_by = ?,
           completed_date = NOW()
       WHERE id = ?`,
      [completed_by, id]
    );

    console.log(`✅ Booking ${id} marked as Completed by ${user[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    res.json({ 
      success: true, 
      message: 'Booking marked as completed and moved to financial tracking (A/R & Collections)',
      status: 'Completed',
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error marking booking as completed:', error);
    res.status(500).json({ success: false, message: 'Failed to mark booking as completed' });
  }
});

// PUT /api/machinery/bookings/:id/resolve-incomplete - Resolve "Incomplete" booking from same barangay
router.put('/bookings/:id/resolve-incomplete', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved_by, resolution_action = 'resume', notes = null } = req.body;
    
    if (!resolved_by || !['resume', 'cancel'].includes(resolution_action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'resolved_by and valid resolution_action (resume/cancel) are required' 
      });
    }
    
    // Get manager and their barangay
    const [manager] = await pool.execute(
      'SELECT role, barangay_id, full_name FROM farmers WHERE id = ?',
      [resolved_by]
    );
    
    if (manager.length === 0 || !['operation_manager', 'business_manager', 'admin'].includes(manager[0].role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only Business Managers, Operation Managers, or Admin can resolve incomplete bookings' 
      });
    }
    
    // Get booking
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // CRITICAL: Verify manager's barangay matches booking's barangay (unless admin)
    if (manager[0].role !== 'admin' && manager[0].barangay_id !== booking[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only resolve incomplete bookings from your assigned barangay.' 
      });
    }
    
    if (booking[0].status !== 'Incomplete') {
      return res.status(400).json({ 
        success: false, 
        message: `Only Incomplete bookings can be resolved. Current: ${booking[0].status}` 
      });
    }
    
    let newStatus, responseMessage;
    
    if (resolution_action === 'resume') {
      newStatus = 'In Use';
      responseMessage = 'Booking resumed. Operator can continue work.';
    } else if (resolution_action === 'cancel') {
      newStatus = 'Cancelled';
      responseMessage = 'Incomplete booking cancelled.';
    }
    
    await pool.execute(
      `UPDATE machinery_bookings 
       SET status = ?,
           notes = CONCAT(COALESCE(notes, ''), '\n[Incomplete Resolution: ', ?, ' - ', ?, ']')
       WHERE id = ?`,
      [newStatus, manager[0].full_name, notes || 'No notes', id]
    );

    console.log(`🔧 Incomplete Booking ${id} resolved (${resolution_action}) by ${manager[0].full_name} (Barangay: ${booking[0].barangay_id})`);
    
    res.json({ 
      success: true, 
      message: responseMessage,
      status: newStatus,
      barangay_verified: true
    });
  } catch (error) {
    console.error('Error resolving incomplete booking:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve incomplete booking' });
  }
});

// PUT /api/machinery/bookings/:id/cancel - Cancel booking 
// IMPROVED: Delete booking from database instead of marking as Cancelled
router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { farmer_id, cancelled_by = null, cancellation_reason = null } = req.body;
    
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    // Allow cancellation from Pending (farmer only) or Approved (manager approval required)
    if (!['Pending', 'Approved'].includes(booking[0].status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Bookings can only be cancelled from Pending or Approved status. Current: ${booking[0].status}` 
      });
    }
    
    // If Approved, need manager approval to cancel
    if (booking[0].status === 'Approved') {
      if (!cancelled_by) {
        return res.status(400).json({ 
          success: false, 
          message: 'cancelled_by (manager ID) is required to cancel from Approved status' 
        });
      }
      
      const [manager] = await pool.execute(
        'SELECT role, barangay_id FROM farmers WHERE id = ?',
        [cancelled_by]
      );
      
      if (manager.length === 0 || !['operation_manager', 'business_manager', 'admin', 'president'].includes(manager[0].role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only managers/admins can cancel approved bookings' 
        });
      }

      // CRITICAL: Verify manager's barangay matches booking's barangay (unless admin)
      if (manager[0].role !== 'admin' && manager[0].barangay_id !== booking[0].barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only cancel bookings from your assigned barangay.' 
        });
      }
    } else {
      // Pending: farmer can cancel directly
      if (booking[0].farmer_id !== farmer_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only the farmer can cancel their pending booking' 
        });
      }

      // CRITICAL: Verify farmer's barangay matches booking's barangay
      const [farmer] = await pool.execute(
        'SELECT barangay_id FROM farmers WHERE id = ?',
        [farmer_id]
      );
      if (farmer.length > 0 && farmer[0].barangay_id !== booking[0].barangay_id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only cancel bookings from your assigned barangay.' 
        });
      }
    }
    
    // IMPROVED: Delete the booking instead of marking as Cancelled
    const [result] = await pool.execute(
      'DELETE FROM machinery_bookings WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      message: 'Booking cancelled and deleted successfully',
      status: 'Deleted'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

// PUT /api/machinery/bookings/:id/edit - Edit booking (farmer can only edit pending)
router.put('/bookings/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { machinery_id, booking_date, service_location, area_size, area_unit, notes } = req.body;
    
    console.log('🔄 Edit booking request:', { id, machinery_id, booking_date, service_location, area_size, area_unit, notes });
    
    // Validate required fields
    if (!machinery_id || !booking_date || area_size === undefined || area_size === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: machinery_id, booking_date, area_size' 
      });
    }
    
    // Convert numeric values
    const machineryIdNum = parseInt(machinery_id, 10);
    const areaSizeNum = parseFloat(area_size);
    const bookingIdNum = parseInt(id, 10);
    
    if (isNaN(machineryIdNum) || isNaN(areaSizeNum) || isNaN(bookingIdNum)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data types for booking update' 
      });
    }
    
    // Fetch the current booking
    const [booking] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [bookingIdNum]
    );
    
    if (booking.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    // CRITICAL: Verify farmer owns the booking
    if (!booking[0].farmer_id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Booking validation error: no farmer assigned' 
      });
    }

    // CRITICAL: Verify farmer owns AND is from the same barangay
    // Get farmer info from request body or token context
    const { farmer_id } = req.body;
    
    if (farmer_id && booking[0].farmer_id !== farmer_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the farmer who created this booking can edit it' 
      });
    }

    // Get farmer's barangay
    const [farmer] = await pool.execute(
      'SELECT barangay_id FROM farmers WHERE id = ?',
      [booking[0].farmer_id]
    );

    if (farmer.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Farmer information not found' 
      });
    }
    
    // Only allow editing of Pending bookings
    if (booking[0].status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: `Can only edit Pending bookings. Current status: ${booking[0].status}` 
      });
    }
    
    // Fetch machinery details for the new machinery
    const [machinery] = await pool.execute(
      'SELECT * FROM machinery_inventory WHERE id = ? AND barangay_id = ?',
      [machineryIdNum, farmer[0].barangay_id]
    );
    
    if (machinery.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Selected machinery not found or not available in your barangay' 
      });
    }
    
    // Calculate the new total price
    const pricePerUnit = parseFloat(machinery[0].price_per_unit);
    const unitType = machinery[0].unit_type;
    const totalPrice = unitType === 'per load' ? pricePerUnit : pricePerUnit * areaSizeNum;
    
    console.log('Price calculation:', { pricePerUnit, unitType, areaSizeNum, totalPrice });
    
    // Update the booking
    const [result] = await pool.execute(
      `UPDATE machinery_bookings 
       SET machinery_id = ?, 
           booking_date = ?, 
           service_location = ?, 
           area_size = ?,
           area_unit = ?,
           total_price = ?,
           notes = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [machineryIdNum, booking_date, service_location || null, areaSizeNum, area_unit || null, totalPrice, notes || null, bookingIdNum]
    );
    
    console.log('Update result:', result);
    
    if (result.affectedRows === 0) {
      console.error('No rows affected for booking:', bookingIdNum);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to update booking' 
      });
    }
    
    // Fetch and return the updated booking
    const [updatedData] = await pool.execute(
      'SELECT * FROM machinery_bookings WHERE id = ?',
      [bookingIdNum]
    );
    
    console.log('✅ Booking updated successfully');
    res.json({ 
      success: true, 
      message: 'Booking updated successfully',
      booking: updatedData[0]
    });
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking: ' + error.message });
  }
});

// GET /api/machinery/stats - Get machinery statistics
router.get('/stats', async (req, res) => {
  try {
    // Total machinery count by type
    const [machineryStats] = await pool.execute(
      `SELECT 
        machinery_type,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'In Use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN status = 'Under Maintenance' THEN 1 ELSE 0 END) as maintenance
      FROM machinery_inventory
      GROUP BY machinery_type`
    );
    
    // Booking statistics
    const [bookingStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(total_price) as total_revenue
      FROM machinery_bookings`
    );
    
    // Active operators count
    const [operatorStats] = await pool.execute(
      `SELECT COUNT(DISTINCT farmer_id) as active_operators
       FROM machinery_operators
       WHERE status = 'Active'`
    );
    
    res.json({ 
      success: true, 
      stats: {
        machinery: machineryStats,
        bookings: bookingStats[0],
        operators: operatorStats[0]
      }
    });
  } catch (error) {
    console.error('Error fetching machinery stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
