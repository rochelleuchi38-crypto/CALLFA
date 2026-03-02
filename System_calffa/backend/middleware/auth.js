// middleware/auth.js
// Authentication and Authorization Middleware

const jwt = require('jsonwebtoken');
const pool = require('../db');

/**
 * Verify JWT token and extract user information
 * Stores user data in req.user for use in route handlers
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Please login first.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Fetch full user details from database
    const [users] = await pool.execute(
      `SELECT id, reference_number, full_name, role, barangay_id, status, address 
       FROM farmers WHERE id = ?`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    req.user = users[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Check if user is admin
 * Admins have full access across all barangays
 */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required. Only administrators can perform this action.' 
    });
  }
  next();
};

/**
 * Check if user is an officer (non-farmer role)
 * Officers include: president, treasurer, auditor, operator, agriculturist, operation_manager, business_manager
 */
const isOfficer = (req, res, next) => {
  const officerRoles = ['president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager'];
  
  if (!officerRoles.includes(req.user?.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Officer access required. Only barangay officers can perform this action.' 
    });
  }
  next();
};

/**
 * Verify barangay access - user must belong to the same barangay as the resource
 * Admins bypass this check
 * @param {String} barangayField - the field name in req.body or req.query containing barangay_id
 */
const verifyBarangayAccess = (barangayField = 'barangay_id') => {
  return async (req, res, next) => {
    try {
      // Admins have access to all barangays
      if (req.user?.role === 'admin') {
        return next();
      }

      // For officers: verify they belong to the requested barangay
      const targetBarangayId = req.body[barangayField] || req.query[barangayField] || req.params.barangay_id;
      
      if (!targetBarangayId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Barangay ID is required' 
        });
      }

      // Officer must be assigned to the target barangay
      if (req.user?.barangay_id && req.user.barangay_id !== parseInt(targetBarangayId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only access data from your assigned barangay.' 
        });
      }

      next();
    } catch (err) {
      console.error('Barangay access verification error:', err);
      res.status(500).json({ success: false, message: 'Access verification failed' });
    }
  };
};

/**
 * Verify resource ownership and barangay access
 * Used for farmer-specific resources
 * @param {String} farmerIdParam - the request parameter/field that contains farmer_id
 */
const verifyFarmerBarangayAccess = (farmerIdParam = 'farmerId') => {
  return async (req, res, next) => {
    try {
      // Admins have full access
      if (req.user?.role === 'admin') {
        return next();
      }

      const targetFarmerId = req.params[farmerIdParam] || req.body.farmer_id;
      
      if (!targetFarmerId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Farmer ID is required' 
        });
      }

      // Get farmer's barangay
      const [farmers] = await pool.execute(
        'SELECT barangay_id FROM farmers WHERE id = ?',
        [targetFarmerId]
      );

      if (farmers.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Farmer not found' 
        });
      }

      const farmerBarangayId = farmers[0].barangay_id;

      // Officer can only access farmers from their barangay
      if (req.user?.barangay_id && req.user.barangay_id !== farmerBarangayId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only access farmers from your assigned barangay.' 
        });
      }

      // Store farmer barangay for use in route handlers
      req.farmerBarangayId = farmerBarangayId;
      next();
    } catch (err) {
      console.error('Farmer barangay access verification error:', err);
      res.status(500).json({ success: false, message: 'Access verification failed' });
    }
  };
};

/**
 * Verify machinery access
 * Officers can only access machinery in their barangay
 */
const verifyMachineryBarangayAccess = async (req, res, next) => {
  try {
    // Admins have full access
    if (req.user?.role === 'admin') {
      return next();
    }

    const machineryId = req.params.id || req.body.machinery_id;
    
    if (!machineryId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Machinery ID is required' 
      });
    }

    // Get machinery's barangay
    const [machinery] = await pool.execute(
      'SELECT barangay_id FROM machinery_inventory WHERE id = ?',
      [machineryId]
    );

    if (machinery.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Machinery not found' 
      });
    }

    // Officer can only access machinery from their barangay
    if (req.user?.barangay_id && req.user.barangay_id !== machinery[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access machinery from your assigned barangay.' 
      });
    }

    req.machineryBarangayId = machinery[0].barangay_id;
    next();
  } catch (err) {
    console.error('Machinery barangay access verification error:', err);
    res.status(500).json({ success: false, message: 'Access verification failed' });
  }
};

/**
 * Verify loan access
 * Officers can only view/approve loans for farmers in their barangay
 */
const verifyLoanBarangayAccess = async (req, res, next) => {
  try {
    // Admins have full access
    if (req.user?.role === 'admin') {
      return next();
    }

    const loanId = req.params.id || req.body.loan_id;
    
    if (!loanId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Loan ID is required' 
      });
    }

    // Get loan's barangay
    const [loans] = await pool.execute(
      'SELECT barangay_id FROM loans WHERE id = ?',
      [loanId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Loan not found' 
      });
    }

    // Officer can only access loans from their barangay
    if (req.user?.barangay_id && req.user.barangay_id !== loans[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access loans from your assigned barangay.' 
      });
    }

    req.loanBarangayId = loans[0].barangay_id;
    next();
  } catch (err) {
    console.error('Loan barangay access verification error:', err);
    res.status(500).json({ success: false, message: 'Access verification failed' });
  }
};

/**
 * Verify machinery booking access
 * Officers can only access bookings for machinery in their barangay
 */
const verifyBookingBarangayAccess = async (req, res, next) => {
  try {
    // Admins have full access
    if (req.user?.role === 'admin') {
      return next();
    }

    const bookingId = req.params.id || req.body.booking_id;
    
    if (!bookingId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking ID is required' 
      });
    }

    // Get booking's barangay
    const [bookings] = await pool.execute(
      'SELECT barangay_id FROM machinery_bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const bookingBarangayId = bookings[0].barangay_id;

    // Officer can only access bookings from their barangay
    if (req.user?.barangay_id && req.user.barangay_id !== bookingBarangayId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access bookings from your assigned barangay.' 
      });
    }

    req.bookingBarangayId = bookingBarangayId;
    next();
  } catch (err) {
    console.error('Booking barangay access verification error:', err);
    res.status(500).json({ success: false, message: 'Access verification failed' });
  }
};

/**
 * Authorize specific roles for an action
 * @param {Array} allowedRoles - array of role names that can perform the action
 */
const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user?.role)) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `This action requires one of these roles: ${allowedRoles.join(', ')}` 
    });
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isOfficer,
  verifyBarangayAccess,
  verifyFarmerBarangayAccess,
  verifyMachineryBarangayAccess,
  verifyBookingBarangayAccess,
  verifyLoanBarangayAccess,
  authorizeRoles
};
