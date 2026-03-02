// utils/barangayHelpers.js
// Helper functions for barangay-based queries

const pool = require('../db');

/**
 * Get user's barangay context
 * @param {Number} userId - farmer ID
 * @returns {Promise<Object>} - barangay information
 */
const getUserBarangayContext = async (userId) => {
  try {
    const [users] = await pool.execute(
      `SELECT barangay_id FROM farmers WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return null;
    }

    const barangayId = users[0].barangay_id;
    
    if (!barangayId) {
      return null;
    }

    const [barangays] = await pool.execute(
      `SELECT id, name, location, status FROM barangays WHERE id = ?`,
      [barangayId]
    );

    return barangays.length > 0 ? barangays[0] : null;
  } catch (err) {
    console.error('Error getting barangay context:', err);
    return null;
  }
};

/**
 * Build WHERE clause for barangay filtering
 * @param {Object} user - user object with role and barangay_id
 * @param {String} tableAlias - table alias or name for the query
 * @returns {Object} - {whereClause: String, params: Array}
 */
const buildBarangayFilter = (user, tableAlias = '') => {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  
  // Admin gets no filter - sees all data
  if (user?.role === 'admin') {
    return { whereClause: '', params: [] };
  }

  // Officers see only their barangay
  if (user?.barangay_id) {
    return {
      whereClause: `AND ${prefix}barangay_id = ?`,
      params: [user.barangay_id]
    };
  }

  // Farmers see only their own data (handled elsewhere)
  return { whereClause: '', params: [] };
};

/**
 * Filter officers by barangay
 * @param {Array} officers - array of officer records
 * @param {Number} barangayId - barangay ID to filter by
 * @returns {Array} - filtered officers
 */
const filterOfficersByBarangay = (officers, barangayId) => {
  return officers.filter(officer => officer.barangay_id === barangayId);
};

/**
 * Get all officers for a barangay
 * @param {Number} barangayId - barangay ID
 * @returns {Promise<Array>} - officers in the barangay
 */
const getBarangayOfficers = async (barangayId) => {
  try {
    const [officers] = await pool.execute(
      `SELECT 
        f.id, f.reference_number, f.full_name, f.role, f.phone_number, 
        f.barangay_id, f.status
       FROM farmers f
       WHERE f.barangay_id = ? 
       AND f.role IN ('president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager')
       AND f.status = 'approved'
       ORDER BY 
         CASE f.role
           WHEN 'president' THEN 1
           WHEN 'treasurer' THEN 2
           WHEN 'auditor' THEN 3
           WHEN 'operation_manager' THEN 4
           WHEN 'business_manager' THEN 5
           WHEN 'agriculturist' THEN 6
           WHEN 'operator' THEN 7
           ELSE 8
         END,
         f.full_name ASC`,
      [barangayId]
    );

    return officers;
  } catch (err) {
    console.error('Error getting barangay officers:', err);
    return [];
  }
};

/**
 * Get all farmers for a barangay
 * @param {Number} barangayId - barangay ID
 * @returns {Promise<Array>} - farmers in the barangay
 */
const getBarangayFarmers = async (barangayId) => {
  try {
    const [farmers] = await pool.execute(
      `SELECT 
        id, reference_number, full_name, phone_number, date_of_birth, 
        role, status, registered_on, barangay_id
       FROM farmers 
       WHERE barangay_id = ? 
       AND role = 'farmer'
       AND status = 'approved'
       ORDER BY full_name ASC`,
      [barangayId]
    );

    return farmers;
  } catch (err) {
    console.error('Error getting barangay farmers:', err);
    return [];
  }
};

/**
 * Verify if user has access to a specific barangay
 * @param {Object} user - user object with role and barangay_id
 * @param {Number} targetBarangayId - target barangay ID to check
 * @returns {Boolean} - true if user has access
 */
const hasBarangayAccess = (user, targetBarangayId) => {
  // Admin has access to all barangays
  if (user?.role === 'admin') {
    return true;
  }

  // Officers can only access their assigned barangay
  return user?.barangay_id === parseInt(targetBarangayId);
};

/**
 * Get barangay statistics for dashboard
 * @param {Number} barangayId - barangay ID
 * @returns {Promise<Object>} - statistics
 */
const getBarangayStats = async (barangayId) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM farmers WHERE barangay_id = ? AND role = 'farmer' AND status = 'approved') as total_farmers,
        (SELECT COUNT(*) FROM farmers WHERE barangay_id = ? AND role IN ('president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager') AND status = 'approved') as total_officers,
        (SELECT COUNT(*) FROM loans WHERE barangay_id = ? AND status = 'approved') as total_loans_approved,
        (SELECT SUM(amount) FROM loans WHERE barangay_id = ? AND status = 'paid') as total_loans_paid,
        (SELECT COUNT(*) FROM machinery_inventory WHERE barangay_id = ? AND status = 'Available') as available_machinery,
        (SELECT SUM(amount) FROM contributions WHERE barangay_id = ? AND status = 'confirmed') as total_contributions
    `, [barangayId, barangayId, barangayId, barangayId, barangayId, barangayId]);

    return stats[0] || {};
  } catch (err) {
    console.error('Error getting barangay stats:', err);
    return {};
  }
};

module.exports = {
  getUserBarangayContext,
  buildBarangayFilter,
  filterOfficersByBarangay,
  getBarangayOfficers,
  getBarangayFarmers,
  hasBarangayAccess,
  getBarangayStats
};
