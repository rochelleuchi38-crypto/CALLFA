# Machinery Financial Management - Barangay Integration Patch

## Key Updates for machinery-financial.js

### 1. Add Barangay Context to Middleware

```javascript
const jwt = require('jsonwebtoken');
const { buildBarangayFilter } = require('../utils/barangayHelpers');

// Extract user context from JWT
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
```

### 2. Update Expenses Endpoint with Barangay Filtering

**Before:**
```javascript
router.get('/expenses', verifyFinancialAccess, async (req, res) => {
  // ... get expenses without barangay context
});
```

**After:**
```javascript
router.get('/expenses', async (req, res) => {
  try {
    const { machinery_id, start_date, end_date, barangay_id, limit = 100 } = req.query;
    const userContext = await getUserContext(req);
    
    let query = `SELECT 
      me.*,
      mi.machinery_name,
      mi.machinery_type,
      mi.barangay_id,
      b.name as barangay_name
    FROM machinery_expenses me
    LEFT JOIN machinery_inventory mi ON me.machinery_id = mi.id
    LEFT JOIN barangays b ON me.barangay_id = b.id
    WHERE 1=1`;
    const params = [];
    
    if (machinery_id && machinery_id !== '') {
      query += ' AND me.machinery_id = ?';
      params.push(parseInt(machinery_id));
    }
    
    if (start_date) {
      query += ' AND me.date_of_expense >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND me.date_of_expense <= ?';
      params.push(end_date);
    }

    // Barangay filtering - officers see only their barangay
    const targetBarangayId = barangay_id || userContext.barangay_id;
    if (userContext.role !== 'admin' && targetBarangayId) {
      query += ' AND me.barangay_id = ?';
      params.push(targetBarangayId);
    }
    
    query += ' ORDER BY me.date_of_expense DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [expenses] = await pool.execute(query, params);
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses' });
  }
});
```

### 3. Update Create Expense with Barangay Assignment

```javascript
router.post('/expenses', async (req, res) => {
  try {
    const {
      machinery_id,
      date_of_expense,
      particulars,
      reference_number,
      total_amount,
      fuel_and_oil = 0,
      // ... other fields
      user_id
    } = req.body;
    
    const userContext = await getUserContext(req);

    // Validate required fields
    if (!machinery_id || !date_of_expense || !particulars || !total_amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Get machinery's barangay
    const [machinery] = await pool.execute(
      'SELECT barangay_id FROM machinery_inventory WHERE id = ?',
      [machinery_id]
    );

    if (machinery.length === 0) {
      return res.status(404).json({ success: false, message: 'Machinery not found' });
    }

    const barangayId = machinery[0].barangay_id;

    // Authorization check
    if (userContext.role !== 'admin' && userContext.barangay_id !== barangayId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only record expenses for machinery in your barangay' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO machinery_expenses 
       (machinery_id, barangay_id, date_of_expense, particulars, reference_number, total_amount, 
        fuel_and_oil, labor_cost, per_diem, repair_and_maintenance, office_supply,
        communication_expense, utilities_expense, sundries, record_created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [machinery_id, barangayId, date_of_expense, particulars, reference_number, total_amount,
       fuel_and_oil, labor_cost, per_diem, repair_and_maintenance, office_supply,
       communication_expense, utilities_expense, sundries, user_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Expense recorded successfully',
      expense_id: result.insertId,
      barangay_id: barangayId
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ success: false, message: 'Failed to create expense' });
  }
});
```

### 4. Update Revenue Endpoints

Apply the same barangay filtering patterns to revenue endpoints:
- GET /api/machinery-financial/revenue
- POST /api/machinery-financial/revenue
- PUT /api/machinery-financial/revenue/:id

### 5. Update Reports/Financial Summaries

```javascript
router.get('/summary', async (req, res) => {
  try {
    const { barangay_id, start_date, end_date } = req.query;
    const userContext = await getUserContext(req);

    const targetBarangayId = barangay_id || userContext.barangay_id;

    // Build query based on barangay context
    let query = `
      SELECT 
        b.id,
        b.name as barangay_name,
        COUNT(DISTINCT me.id) as total_expenses,
        SUM(me.total_amount) as total_expense_amount,
        COUNT(DISTINCT rev.id) as total_revenue_entries,
        SUM(rev.amount) as total_revenue
      FROM barangays b
      LEFT JOIN machinery_expenses me ON b.id = me.barangay_id
      LEFT JOIN machinery_revenue rev ON b.id = rev.barangay_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      query += ' AND (me.date_of_expense >= ? OR rev.date >= ?)';
      params.push(start_date, start_date);
    }

    if (end_date) {
      query += ' AND (me.date_of_expense <= ? OR rev.date <= ?)';
      params.push(end_date, end_date);
    }

    // Only show requested barangay if officer
    if (userContext.role !== 'admin') {
      if (!targetBarangayId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Barangay ID required' 
        });
      }
      query += ' AND b.id = ?';
      params.push(targetBarangayId);
    }

    query += ' GROUP BY b.id';

    const [summary] = await pool.execute(query, params);
    res.json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});
```

## Implementation Checklist for machinery-financial.js

- [ ] Add getUserContext helper function
- [ ] Update GET /expenses with barangay filtering
- [ ] Update GET /expenses/:id with barangay validation
- [ ] Update POST /expenses with barangay assignment
- [ ] Update PUT /expenses/:id with barangay check
- [ ] Update DELETE /expenses/:id with barangay check
- [ ] Update GET /revenue with barangay filtering
- [ ] Update POST /revenue with barangay assignment
- [ ] Update GET /summary with barangay context
- [ ] Update GET /report with barangay filtering
- [ ] Test all endpoints with officer and admin accounts
- [ ] Verify proper barangay isolation

## Key Principles

1. **All expenses must have barangay_id** derived from machinery's barangay
2. **Officers can only access their barangay's expenses**
3. **Admins see all expenses across all barangays**
4. **Reports must respect barangay context**
5. **Activity logging must include barangay_id**

## Testing Scenarios

### Scenario 1: Officer Can Only See Own Barangay Expenses
- Officer A from Barangay X tries to view expenses
- Should see only expenses for machinery in Barangay X
- Should not see expenses from Barangay Y

### Scenario 2: Admin Sees All Expenses
- Admin views expenses
- Should see all expenses from all barangays
- Can filter by barangay if desired

### Scenario 3: Cannot Record Expense for Other Barangay's Machinery
- Officer A tries to record expense for machinery in Barangay B
- Should receive error: "You can only record expenses for machinery in your barangay"
