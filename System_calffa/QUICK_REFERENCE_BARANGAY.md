# Quick Reference Card - Barangay-Based Access Control

## Copy-Paste Code Snippets

### 1. User Context Extraction (Add to top of each route file)

```javascript
const jwt = require('jsonwebtoken');

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

### 2. GET Endpoint Pattern (with barangay filtering)

```javascript
router.get('/', async (req, res) => {
  try {
    const { status, barangay_id, limit = 100 } = req.query;
    const userContext = await getUserContext(req);
    
    let query = `
      SELECT * FROM table_name
      LEFT JOIN barangays b ON table_name.barangay_id = b.id
      WHERE 1=1
    `;
    const params = [];
    
    // Add filters
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    // Barangay filtering
    const targetBarangayId = barangay_id || userContext.barangay_id;
    if (userContext.role !== 'admin' && targetBarangayId) {
      query += ' AND table_name.barangay_id = ?';
      params.push(targetBarangayId);
    }
    
    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [results] = await pool.execute(query, params);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 3. POST Endpoint Pattern (with barangay assignment)

```javascript
router.post('/', async (req, res) => {
  try {
    const { farmer_id, ...fields } = req.body;
    const userContext = await getUserContext(req);
    
    // Get barangay from farmer or request
    const [farmers] = await pool.execute(
      'SELECT barangay_id FROM farmers WHERE id = ?',
      [farmer_id]
    );
    
    if (farmers.length === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }
    
    const barangayId = farmers[0].barangay_id;
    
    // Authorization check
    if (userContext.role !== 'admin' && userContext.barangay_id !== barangayId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only manage data from your barangay' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO table_name (farmer_id, barangay_id, ...) 
       VALUES (?, ?, ...)`,
      [farmer_id, barangayId, ...Object.values(fields)]
    );
    
    res.json({ success: true, id: result.insertId, barangay_id: barangayId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 4. PUT Endpoint Pattern (with barangay validation)

```javascript
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userContext = await getUserContext(req);
    
    // Get barangay of resource
    const [resources] = await pool.execute(
      'SELECT barangay_id FROM table_name WHERE id = ?',
      [id]
    );
    
    if (resources.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    
    // Barangay authorization
    if (userContext.role !== 'admin' && userContext.barangay_id !== resources[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update resources from your barangay' 
      });
    }
    
    // Perform update
    const [result] = await pool.execute(
      'UPDATE table_name SET field = ? WHERE id = ?',
      [req.body.field, id]
    );
    
    res.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### 5. DELETE Endpoint Pattern (with barangay check)

```javascript
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userContext = await getUserContext(req);
    
    // Get resource and check barangay
    const [resources] = await pool.execute(
      'SELECT barangay_id FROM table_name WHERE id = ?',
      [id]
    );
    
    if (resources.length === 0) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    
    // Only allow deletion if same barangay or admin
    if (userContext.role !== 'admin' && userContext.barangay_id !== resources[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete resources from your barangay' 
      });
    }
    
    const [result] = await pool.execute('DELETE FROM table_name WHERE id = ?', [id]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## Common Patterns & Solutions

### Problem: "How do I check if user can access this loan?"

**Solution:**
```javascript
const { barangayId } = await pool.execute(
  'SELECT barangay_id FROM loans WHERE id = ?', [loanId]
);

if (userContext.role !== 'admin' && userContext.barangay_id !== barangayId) {
  return res.status(403).json({ message: 'Access denied' });
}
```

### Problem: "How do I ensure machinery is from same barangay as farmer?"

**Solution:**
```javascript
const [machinery] = await pool.execute('SELECT barangay_id FROM machinery_inventory WHERE id = ?', [machineryId]);
const [farmer] = await pool.execute('SELECT barangay_id FROM farmers WHERE id = ?', [farmerId]);

if (machinery[0].barangay_id !== farmer[0].barangay_id) {
  return res.status(400).json({ message: 'Machinery and farmer must be from same barangay' });
}
```

### Problem: "How do I get all data for officer's barangay?"

**Solution:**
```javascript
const userContext = await getUserContext(req);

let whereClause = '';
const params = [];

if (userContext.role !== 'admin') {
  whereClause = 'WHERE barangay_id = ?';
  params.push(userContext.barangay_id);
}

const [data] = await pool.execute(`SELECT * FROM table_name ${whereClause}`, params);
```

### Problem: "How do I log activity with barangay context?"

**Solution:**
```javascript
await pool.execute(
  `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description)
   VALUES (?, ?, ?, ?)`,
  [farmerId, barangayId, 'action_type', 'description here']
);
```

---

## Database Query Reference

### Get user's barangay assignment
```sql
SELECT barangay_id FROM farmers WHERE id = ? AND role != 'farmer';
```

### Get all data for specific barangay
```sql
SELECT * FROM table_name WHERE barangay_id = ?;
```

### Get barangay-specific statistics
```sql
SELECT COUNT(*) as total, SUM(amount) as sum_amount
FROM table_name 
WHERE barangay_id = ?;
```

### Verify officer can manage resource
```sql
SELECT barangay_id FROM farmers WHERE id = ? 
AND role IN ('president', 'treasurer', 'auditor', ...);
```

---

## API Endpoint Checklist

### For Each Module, Ensure:
- [ ] `GET /` - Filters by barangay for non-admin
- [ ] `GET /:id` - Validates barangay access
- [ ] `POST /` - Assigns barangay_id automatically
- [ ] `PUT /:id` - Checks barangay authorization
- [ ] `DELETE /:id` - Validates barangay ownership
- [ ] All responses include `barangay_name` or `barangay_id`
- [ ] Activity logging includes barangay context
- [ ] Error responses are clear and descriptive

---

## Testing Checklist

For each endpoint:
1. Test with admin account (should see all)
2. Test with officer from same barangay (should see own)
3. Test with officer from different barangay (should get 403)
4. Test with farmer account (should get 403 for officer-only actions)
5. Verify activity logs are created correctly

---

## Common Error Messages

```
400 Bad Request
"Missing required fields" - Some required field is null
"Invalid barangay_id" - Barangay doesn't exist

403 Forbidden
"You can only access data from your assigned barangay" - Cross-barangay access attempt
"You can only manage data from your barangay" - Unauthorized operation

404 Not Found
"Resource not found" - ID doesn't exist
"Farmer not found" - Farmer doesn't exist

500 Server Error
"Database error message" - SQL or connection issue
```

---

## File Organization

```
backend/
├── middleware/
│   └── auth.js (use this everywhere)
├── utils/
│   └── barangayHelpers.js (helper functions)
├── routes/
│   ├── farmers.js (✅ DONE)
│   ├── loans.js (✅ DONE)
│   ├── machinery.js (TODO - use MACHINERY patch)
│   ├── machinery-financial.js (TODO - use MACHINERY_FINANCIAL patch)
│   ├── contributions.js (TODO - use CONTRIBUTIONS patch)
│   ├── barangays.js (TODO - create from scratch)
│   └── activity-logs.js (TODO - update existing)
├── migrations/
│   ├── add_barangay_id_to_farmers.sql
│   ├── add_barangay_id_to_loans.sql
│   ├── add_barangay_id_to_machinery.sql
│   ├── add_barangay_id_to_financials.sql
│   └── add_barangay_to_activity_logs.sql
└── server.js (import auth middleware)
```

---

## Key Functions from barangayHelpers.js

```javascript
// Get barangay context
getUserBarangayContext(userId)

// Build WHERE clause for filtering
buildBarangayFilter(user, tableAlias)

// Get officers in barangay
getBarangayOfficers(barangayId)

// Get farmers in barangay
getBarangayFarmers(barangayId)

// Check access permission
hasBarangayAccess(user, targetBarangayId)

// Get barangay statistics
getBarangayStats(barangayId)
```

---

## Middleware to Apply

```javascript
// In server.js or route files:

const { verifyToken, isAdmin, authorizeRoles } = require('./middleware/auth');

// Apply to routes
app.use('/api/loans', verifyToken, loansRoutes);
app.use('/api/machinery', verifyToken, machineryRoutes);
app.use('/api/contributions', verifyToken, contributionsRoutes);
```

---

## Quick Migration Test

```bash
# After running migrations, verify columns exist:

mysql -u root -p calffa -e "
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME='farmers' AND COLUMN_NAME='barangay_id';
"

# Should return one row with 'barangay_id'
```

---

**Save this file for quick reference during implementation!**
