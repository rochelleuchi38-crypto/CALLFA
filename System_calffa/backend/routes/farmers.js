// routes/farmer.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import MySQL pool
const pool = require('../db');

// Import authentication middleware and helpers
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getUserBarangayContext, getBarangayOfficers, getBarangayFarmers } = require('../utils/barangayHelpers');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) are allowed!'));
    }
  }
});

// -----------------------------
// REGISTER FARMER OR ADMIN
// -----------------------------
// REGISTER FARMER OR ADMIN
// For officers (president, treasurer, etc.), barangay_id is required
router.post('/register', async (req, res) => {
  try {
    const { reference_number, full_name, date_of_birth, address, phone_number, educational_status, password, role, barangay_id } = req.body;

    // Validate required fields
    if (!reference_number || !full_name || !date_of_birth || !address || !phone_number || !educational_status || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required: reference_number, full_name, date_of_birth, address, phone_number, educational_status, password' 
      });
    }

    // Default role is farmer
    const userRole = role || 'farmer';
    const validRoles = ['farmer', 'admin', 'president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager'];
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Officer roles (non-farmer) require barangay assignment
    const officerRoles = ['president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager'];
    if (officerRoles.includes(userRole) && !barangay_id) {
      return res.status(400).json({ 
        success: false, 
        message: `Officer roles require barangay_id to be specified` 
      });
    }

    // If barangay_id is provided, verify it exists
    if (barangay_id) {
      const [barangays] = await pool.execute('SELECT id FROM barangays WHERE id = ?', [barangay_id]);
      if (barangays.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid barangay_id. Barangay does not exist.' 
        });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert into database (status pending by default)
    const [result] = await pool.execute(
      `INSERT INTO farmers 
       (reference_number, full_name, date_of_birth, address, phone_number, educational_status, password_hash, role, barangay_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [reference_number, full_name, date_of_birth, address, phone_number, educational_status || null, password_hash, userRole, barangay_id || null]
    );

    res.json({ 
      success: true, 
      message: `${userRole === 'admin' ? 'Admin' : userRole === 'farmer' ? 'Farmer' : 'Officer'} registered successfully! ${userRole === 'farmer' ? 'Pending approval from admin.' : 'Pending assignment and approval.'}`, 
      farmerId: result.insertId 
    });

  } catch (err) {
    console.error('Registration error:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Reference number already exists.' });
    }

    if (err.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ success: false, message: 'Database schema needs update. Add "role", "barangay_id" and "status" columns.' });
    }

    res.status(500).json({ success: false, message: 'Error registering user.', error: err.message });
  }
});

// -----------------------------
// LOGIN FARMER/ADMIN
// -----------------------------
// LOGIN FARMER/ADMIN/OFFICER
// Returns user info with barangay context
router.post('/login', async (req, res) => {
  try {
    const { reference_number, password } = req.body;

    const [rows] = await pool.execute(
      `SELECT id, reference_number, full_name, date_of_birth, address, phone_number, educational_status, role, barangay_id, status, password_hash, profile_picture
       FROM farmers WHERE reference_number = ?`,
      [reference_number]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid reference number.' });
    }

    const farmer = rows[0];
    const match = await bcrypt.compare(password, farmer.password_hash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    if (farmer.role === 'farmer' && farmer.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Account pending approval from admin.' });
    }

    // Get barangay context if officer
    let barangayContext = null;
    if (farmer.barangay_id && farmer.role !== 'admin') {
      const [barangays] = await pool.execute(
        'SELECT id, name, location, status FROM barangays WHERE id = ?',
        [farmer.barangay_id]
      );
      barangayContext = barangays[0] || null;
    }

    const { password_hash, ...farmerData } = farmer;

    const token = jwt.sign(
      { id: farmer.id, reference_number: farmer.reference_number, role: farmer.role, barangay_id: farmer.barangay_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Log login activity
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, ip_address, user_agent)
         VALUES (?, ?, 'login', ?, ?, ?)`,
        [farmer.id, farmer.barangay_id, `${farmer.full_name} logged in`, ipAddress, userAgent]
      );
    } catch (logErr) {
      console.error('Error logging login activity:', logErr);
    }

    res.json({ 
      success: true, 
      message: 'Login successful!', 
      farmer: farmerData, 
      barangay: barangayContext,
      token 
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Error logging in.', error: err.message });
  }
});

// IMPORTANT: GET routes with specific paths must come BEFORE routes with parameters (:id)
// This ensures /pending is matched before /:id

// -----------------------------
// GET PENDING FARMERS (ADMIN)
// Shows pending registrations across all barangays
// -----------------------------
router.get('/pending', async (req, res) => {
  try {
    // Extract token and verify user authorization
    const token = req.headers.authorization?.split(' ')[1];
    let userBarangayId = null;
    let userRole = 'guest';
    let canViewPending = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userBarangayId = decoded.barangay_id;

        // Get full user info
        const [users] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
        if (users.length > 0) {
          userRole = users[0].role;
          userBarangayId = users[0].barangay_id;
          
          // Allow admin (full access) or president (own barangay only)
          canViewPending = userRole === 'admin' || userRole === 'president';
        }
      } catch (err) {
        canViewPending = false;
      }
    }

    // Only admin or president can view pending members
    if (!canViewPending) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view pending members. Only Admins and Presidents can approve members.' 
      });
    }

    // Build query with barangay filtering for presidents
    let query = `
      SELECT 
        f.id, 
        f.reference_number, 
        f.full_name, 
        f.date_of_birth, 
        f.address, 
        f.phone_number, 
        f.educational_status,
        f.role, 
        f.barangay_id,
        b.name AS barangay_name,
        f.status, 
        f.registered_on, 
        f.profile_picture
      FROM farmers f
      LEFT JOIN barangays b ON f.barangay_id = b.id
      WHERE LOWER(f.status) = 'pending' OR f.status IS NULL
    `;
    const params = [];

    // If president, filter to own barangay only
    if (userRole === 'president' && userBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(userBarangayId);
    }

    query += ' ORDER BY f.registered_on DESC';

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, farmers: rows });
  } catch (err) {
    console.error('Error fetching pending members:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching pending members.', error: err.message });
  }
});

// -----------------------------
// GET ALL FARMERS (ADMIN DASHBOARD)
// Admins see all farmers, officers see only farmers from their barangay
router.get('/', async (req, res) => {
  try {
    // Check if user provided a token for barangay filtering
    const token = req.headers.authorization?.split(' ')[1];
    let userBarangayId = null;
    let userRole = 'guest';

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userBarangayId = decoded.barangay_id;
        userRole = decoded.role || 'guest';

        // Get full user info
        const [users] = await pool.execute('SELECT role FROM farmers WHERE id = ?', [decoded.id]);
        if (users.length > 0) {
          userRole = users[0].role;
        }
      } catch (err) {
        // Token invalid, proceed without filtering
      }
    }

    let query = `
      SELECT 
        f.id, 
        f.reference_number, 
        f.full_name, 
        f.date_of_birth, 
        f.address, 
        f.phone_number, 
        f.educational_status,
        f.role, 
        f.barangay_id,
        b.name AS barangay_name,
        f.status, 
        f.primary_crop, 
        f.land_area, 
        f.farm_location, 
        f.membership_type, 
        f.registered_on, 
        f.profile_picture
      FROM farmers f
      LEFT JOIN barangays b ON f.barangay_id = b.id
      WHERE 1=1
    `;
    const params = [];

    // Officers can only see farmers from their barangay
    if (userRole !== 'admin' && userBarangayId) {
      query += ' AND f.barangay_id = ?';
      params.push(userBarangayId);
    }

    query += ' ORDER BY f.registered_on DESC';

    const [rows] = await pool.execute(query, params);
    res.json({ success: true, farmers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching farmers.', error: err.message });
  }
});

// -----------------------------
// UPDATE FARMER PROFILE
// -----------------------------
router.put('/:id/profile', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    const { full_name, address, phone_number, date_of_birth, educational_status, primary_crop, land_area, farm_location, membership_type, barangay_id } = req.body;

    if (!farmerId) return res.status(400).json({ success: false, message: 'Invalid farmer ID' });

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (address) {
      updates.push('address = ?');
      values.push(address);
    }
    if (phone_number) {
      updates.push('phone_number = ?');
      values.push(phone_number);
    }
    if (date_of_birth) {
      updates.push('date_of_birth = ?');
      values.push(date_of_birth);
    }
    if (educational_status !== undefined) {
      updates.push('educational_status = ?');
      values.push(educational_status);
    }
    if (primary_crop) {
      updates.push('primary_crop = ?');
      values.push(primary_crop);
    }
    if (land_area !== undefined) {
      updates.push('land_area = ?');
      values.push(land_area);
    }
    if (farm_location) {
      updates.push('farm_location = ?');
      values.push(farm_location);
    }
    if (membership_type) {
      updates.push('membership_type = ?');
      values.push(membership_type);
    }
    if (barangay_id !== undefined && barangay_id !== null) {
      // Validate barangay exists
      const [barangays] = await pool.execute('SELECT id FROM barangays WHERE id = ?', [barangay_id]);
      if (barangays.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid barangay ID' });
      }
      updates.push('barangay_id = ?');
      values.push(barangay_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push('last_activity = CURRENT_TIMESTAMP');
    values.push(farmerId);
    
    const [result] = await pool.execute(
      `UPDATE farmers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Get updated farmer data
    const [farmer] = await pool.execute(
      `SELECT f.id, f.reference_number, f.full_name, f.date_of_birth, f.address, f.phone_number, f.educational_status, f.role, f.status, f.primary_crop, f.land_area, f.farm_location, f.membership_type, f.profile_picture, f.barangay_id, b.name as barangay_name 
       FROM farmers f 
       LEFT JOIN barangays b ON f.barangay_id = b.id 
       WHERE f.id = ?`,
      [farmerId]
    );

    // Log profile update activity
    try {
      const updatedFields = Object.keys(req.body).join(', ');
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, activity_type, activity_description, metadata)
         VALUES (?, 'profile_update', ?, ?)`,
        [farmerId, `Profile updated: ${updatedFields}`, JSON.stringify({ updated_fields: Object.keys(req.body) })]
      );
    } catch (logErr) {
      console.error('Error logging profile update:', logErr);
    }

    res.json({ success: true, message: 'Profile updated successfully', farmer: farmer[0] });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ success: false, message: 'Error updating profile', error: err.message });
  }
});

// -----------------------------
// APPROVE FARMER (ADMIN or PRESIDENT)
// Admins can approve anyone from any barangay
// Presidents can only approve members from their assigned barangay
router.post('/:id/approve', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    if (!farmerId) return res.status(400).json({ success: false, message: 'Invalid member ID' });

    // Extract token and verify authorization
    const token = req.headers.authorization?.split(' ')[1];
    let approverRole = 'guest';
    let approverBarangayId = null;
    let canApprove = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const [approvers] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
        
        if (approvers.length > 0) {
          approverRole = approvers[0].role;
          approverBarangayId = approvers[0].barangay_id;
          canApprove = approverRole === 'admin' || approverRole === 'president';
        }
      } catch (err) {
        canApprove = false;
      }
    }

    // Only admin or president can approve
    if (!canApprove) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to approve members. Only Admins and Presidents can approve accounts.' 
      });
    }

    // Get farmer details first
    const [farmer] = await pool.execute('SELECT full_name, role, barangay_id FROM farmers WHERE id = ?', [farmerId]);
    if (farmer.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });

    // Prevent editing admin status
    if (farmer[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin account status' });
    }

    // Check barangay authorization for presidents
    const targetBarangayId = req.body.barangay_id || farmer[0].barangay_id;
    if (approverRole === 'president' && approverBarangayId !== targetBarangayId) {
      return res.status(403).json({ 
        success: false, 
        message: `President can only approve members from barangay ${approverBarangayId}. This member belongs to barangay ${targetBarangayId}.` 
      });
    }

    // If approving an officer and barangay_id is provided, validate it
    const officerRoles = ['president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager'];
    const targetRole = req.body.role || farmer[0].role;

    if (officerRoles.includes(targetRole)) {
      if (!targetBarangayId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Officer roles require barangay_id for assignment' 
        });
      }

      // Verify barangay exists
      const [barangays] = await pool.execute('SELECT id FROM barangays WHERE id = ?', [targetBarangayId]);
      if (barangays.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid barangay_id' 
        });
      }
    }

    // Update farmer status, role, and barangay
    let updateQuery = 'UPDATE farmers SET status = ?';
    let updateParams = ['approved'];
    
    if (targetRole && targetRole !== farmer[0].role) {
      updateQuery += ', role = ?';
      updateParams.push(targetRole);
    }

    if (targetBarangayId && targetBarangayId !== farmer[0].barangay_id) {
      updateQuery += ', barangay_id = ?';
      updateParams.push(targetBarangayId);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(farmerId);
    const [result] = await pool.execute(updateQuery, updateParams);

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Member not found' });

    // Log approval activity
    try {
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'membership_change', ?, ?)`,
        [farmerId, targetBarangayId, `${farmer[0].full_name} account approved by ${approverRole}`, JSON.stringify({ status: 'approved', previous_status: 'pending', role: targetRole, barangay_id: targetBarangayId })]
      );
    } catch (logErr) {
      console.error('Error logging approval activity:', logErr);
    }

    // Add blockchain entry
    try {
      const blockchainRoute = require('./blockchain');
      console.log(`✓ Approved farmer ${farmerId}: ${farmer[0].full_name}`);
    } catch (blockchainErr) {
      console.warn('Could not add blockchain entry:', blockchainErr.message);
    }

    res.json({ success: true, message: 'Member approved successfully' });
  } catch (err) {
    console.error('Error approving member:', err.message);
    res.status(500).json({ success: false, message: 'Error approving member', error: err.message });
  }
});

// -----------------------------
// REJECT FARMER (ADMIN)
// -----------------------------
router.post('/:id/reject', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    if (!farmerId) return res.status(400).json({ success: false, message: 'Invalid member ID' });

    // Extract token and verify authorization
    const token = req.headers.authorization?.split(' ')[1];
    let rejectorRole = 'guest';
    let rejectorBarangayId = null;
    let canReject = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const [rejectors] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
        
        if (rejectors.length > 0) {
          rejectorRole = rejectors[0].role;
          rejectorBarangayId = rejectors[0].barangay_id;
          canReject = rejectorRole === 'admin' || rejectorRole === 'president';
        }
      } catch (err) {
        canReject = false;
      }
    }

    // Only admin or president can reject
    if (!canReject) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to reject members. Only Admins and Presidents can reject accounts.' 
      });
    }

    // Check if user is admin before rejecting
    const [farmer] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [farmerId]);
    if (farmer.length === 0) return res.status(404).json({ success: false, message: 'Member not found' });
    
    if (farmer[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin account status' });
    }

    // Check barangay authorization for presidents
    if (rejectorRole === 'president' && rejectorBarangayId !== farmer[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: `President can only reject members from barangay ${rejectorBarangayId}. This member belongs to barangay ${farmer[0].barangay_id}.` 
      });
    }

    const [result] = await pool.execute('UPDATE farmers SET status = ? WHERE id = ?', ['rejected', farmerId]);

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Member not found' });

    // Log rejection activity
    try {
      const [farmerData] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmerId]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'membership_change', ?, ?)`,
        [farmerId, farmer[0].barangay_id, `${farmerData[0]?.full_name || 'Member'} account rejected by ${rejectorRole}`, JSON.stringify({ status: 'rejected', previous_status: 'pending' })]
      );
    } catch (logErr) {
      console.error('Error logging rejection activity:', logErr);
    }

    res.json({ success: true, message: 'Member rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error rejecting member', error: err.message });
  }
});

// -----------------------------
// UPDATE FARMER STATUS (ADMIN)
// -----------------------------
router.put('/:id/status', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    const { status } = req.body;

    if (!farmerId) return res.status(400).json({ success: false, message: 'Invalid farmer ID' });
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Check if user is admin
    const [farmer] = await pool.execute('SELECT role FROM farmers WHERE id = ?', [farmerId]);
    if (farmer.length === 0) return res.status(404).json({ success: false, message: 'Farmer not found' });
    
    if (farmer[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin account status' });
    }

    const [result] = await pool.execute('UPDATE farmers SET status = ? WHERE id = ?', [status, farmerId]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Farmer not found' });

    // Log status change activity
    try {
      const [farmerData] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmerId]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, activity_type, activity_description, metadata)
         VALUES (?, 'membership_change', ?, ?)`,
        [farmerId, `${farmerData[0]?.full_name || 'Member'} status changed to ${status}`, JSON.stringify({ status, action: 'status_update' })]
      );
    } catch (logErr) {
      console.error('Error logging status change:', logErr);
    }

    res.json({ success: true, message: `Status updated to ${status}`, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating status', error: err.message });
  }
});

// -----------------------------
// UPDATE FARMER ROLE (ADMIN)
// -----------------------------
router.put('/:id/role', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    const { role } = req.body;

    if (!farmerId) return res.status(400).json({ success: false, message: 'Invalid farmer ID' });
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    // Validate role
    const validRoles = ['farmer', 'admin', 'president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Update role
    const [result] = await pool.execute('UPDATE farmers SET role = ? WHERE id = ?', [role, farmerId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    console.log(`✓ Updated role for farmer ${farmerId} to: ${role}`);

    res.json({ 
      success: true, 
      message: `Role updated to ${role} successfully`,
      role 
    });
  } catch (err) {
    console.error('Error updating role:', err.message);
    res.status(500).json({ success: false, message: 'Error updating role', error: err.message });
  }
});

// -----------------------------
// DELETE FARMER (ADMIN)
// -----------------------------
router.delete('/:id', async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    if (!farmerId) return res.status(400).json({ success: false, message: 'Invalid farmer ID' });

    // Get farmer details before deletion for logging
    const [farmer] = await pool.execute('SELECT full_name, reference_number, status, role FROM farmers WHERE id = ?', [farmerId]);
    
    if (farmer.length === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Prevent deleting admin accounts
    if (farmer[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });
    }

    // Delete the farmer from database
    const [result] = await pool.execute('DELETE FROM farmers WHERE id = ?', [farmerId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    console.log(`✓ Deleted farmer ${farmerId}: ${farmer[0].full_name} (${farmer[0].reference_number}) - Status: ${farmer[0].status}`);

    res.json({ 
      success: true, 
      message: 'Farmer deleted successfully',
      deletedFarmer: {
        id: farmerId,
        name: farmer[0].full_name,
        reference_number: farmer[0].reference_number
      }
    });
  } catch (err) {
    console.error('Error deleting farmer:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting farmer', error: err.message });
  }
});

// -----------------------------
// UPLOAD PROFILE PICTURE
// -----------------------------
router.post('/:id/profile-picture', upload.single('profile_picture'), async (req, res) => {
  try {
    const farmerId = parseInt(req.params.id);
    
    if (!farmerId) {
      return res.status(400).json({ success: false, message: 'Invalid farmer ID' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Generate the URL path for the uploaded file
    const profilePicturePath = `/uploads/${req.file.filename}`;

    // Get old profile picture to delete
    const [oldData] = await pool.execute(
      'SELECT profile_picture FROM farmers WHERE id = ?',
      [farmerId]
    );

    // Update database with new profile picture path
    const [result] = await pool.execute(
      'UPDATE farmers SET profile_picture = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?',
      [profilePicturePath, farmerId]
    );

    if (result.affectedRows === 0) {
      // Delete uploaded file if farmer not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    // Delete old profile picture file if it exists
    if (oldData[0]?.profile_picture) {
      const oldFilePath = path.join(__dirname, '..', oldData[0].profile_picture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Log activity
    try {
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, activity_type, activity_description, metadata)
         VALUES (?, 'profile_update', 'Profile picture updated', ?)`,
        [farmerId, JSON.stringify({ filename: req.file.filename })]
      );
    } catch (logErr) {
      console.error('Error logging profile picture update:', logErr);
    }

    res.json({ 
      success: true, 
      message: 'Profile picture uploaded successfully',
      profile_picture: profilePicturePath
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err.message);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Error uploading profile picture', error: err.message });
  }
});

module.exports = router;
