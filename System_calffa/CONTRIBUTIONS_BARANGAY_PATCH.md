# Contributions Routes - Barangay Integration Patch

## Overview
The contributions route manages financial contributions from farmers to their barangay. With barangay-based isolation, contributions must be filtered and restricted to the user's assigned barangay (for officers) or visible only to admins across all barangays.

## Key Updates for contributions.js

### 1. Add Barangay Context Extraction

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

### 2. Update GET Contributions with Barangay Filtering

**Before:**
```javascript
router.get('/', async (req, res) => {
  // Returns all contributions without barangay filtering
});
```

**After:**
```javascript
router.get('/', async (req, res) => {
  try {
    const { farmer_id, contribution_type, status, start_date, end_date, barangay_id, limit = 100 } = req.query;
    const userContext = await getUserContext(req);
    
    let query = `
      SELECT 
        c.*,
        f.full_name,
        f.reference_number,
        f.barangay_id as farmer_barangay,
        r.full_name as recorded_by_name,
        b.name as barangay_name
      FROM contributions c
      JOIN farmers f ON c.farmer_id = f.id
      LEFT JOIN farmers r ON c.recorded_by = r.id
      LEFT JOIN barangays b ON c.barangay_id = b.id
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

    // Barangay filtering - officers see only their barangay
    const targetBarangayId = barangay_id || userContext.barangay_id;
    if (userContext.role !== 'admin' && targetBarangayId) {
      query += ' AND c.barangay_id = ?';
      params.push(targetBarangayId);
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
```

### 3. Update GET Farmer Contributions with Barangay Context

```javascript
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const userContext = await getUserContext(req);

    // Get farmer's barangay
    const [farmers] = await pool.execute(
      'SELECT barangay_id FROM farmers WHERE id = ?',
      [farmerId]
    );

    if (farmers.length === 0) {
      return res.status(404).json({ success: false, message: 'Farmer not found' });
    }

    const farmerBarangayId = farmers[0].barangay_id;

    // Barangay authorization check
    if (userContext.role !== 'admin' && userContext.barangay_id !== farmerBarangayId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view contributions from farmers in your barangay' 
      });
    }
    
    const [contributions] = await pool.execute(
      `SELECT c.*, b.name as barangay_name
       FROM contributions c
       LEFT JOIN barangays b ON c.barangay_id = b.id
       WHERE c.farmer_id = ? 
       ORDER BY c.contribution_date DESC`,
      [farmerId]
    );
    
    res.json({ success: true, contributions });
  } catch (error) {
    console.error('Error fetching farmer contributions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contributions' });
  }
});
```

### 4. Update POST Create Contribution with Barangay Assignment

```javascript
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

    const userContext = await getUserContext(req);
    
    if (!farmer_id || !contribution_date || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: farmer_id, contribution_date, amount' 
      });
    }

    // Get farmer's barangay
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
        message: 'You can only record contributions from farmers in your barangay' 
      });
    }
    
    const [result] = await pool.execute(
      `INSERT INTO contributions 
       (farmer_id, barangay_id, contribution_date, amount, contribution_type, payment_method, 
        reference_number, remarks, recorded_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer_id, 
        barangayId,
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
    
    // Log activity with barangay context
    try {
      const [farmer] = await pool.execute('SELECT full_name FROM farmers WHERE id = ?', [farmer_id]);
      await pool.execute(
        `INSERT INTO activity_logs (farmer_id, barangay_id, activity_type, activity_description, metadata)
         VALUES (?, ?, 'contribution', ?, ?)`,
        [
          farmer_id, 
          barangayId,
          `${farmer[0]?.full_name} made a contribution of ₱${amount}`,
          JSON.stringify({ contribution_id: result.insertId, amount, type: contribution_type })
        ]
      );
    } catch (logErr) {
      console.error('Error logging contribution activity:', logErr);
    }
    
    res.json({ 
      success: true, 
      id: result.insertId, 
      message: 'Contribution recorded successfully',
      barangay_id: barangayId
    });
  } catch (error) {
    console.error('Error creating contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to create contribution' });
  }
});
```

### 5. Update PUT Update Contribution with Barangay Validation

```javascript
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userContext = await getUserContext(req);

    // Get contribution's barangay
    const [contributions] = await pool.execute(
      'SELECT barangay_id FROM contributions WHERE id = ?',
      [id]
    );

    if (contributions.length === 0) {
      return res.status(404).json({ success: false, message: 'Contribution not found' });
    }

    // Barangay authorization
    if (userContext.role !== 'admin' && userContext.barangay_id !== contributions[0].barangay_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update contributions from your barangay' 
      });
    }

    const { amount, contribution_type, payment_method, reference_number, remarks, status } = req.body;
    
    const updates = [];
    const values = [];
    
    if (amount !== undefined) {
      updates.push('amount = ?');
      values.push(amount);
    }
    if (contribution_type !== undefined) {
      updates.push('contribution_type = ?');
      values.push(contribution_type);
    }
    if (payment_method !== undefined) {
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
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE contributions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Contribution not found' });
    }

    res.json({ success: true, message: 'Contribution updated successfully' });
  } catch (error) {
    console.error('Error updating contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to update contribution' });
  }
});
```

### 6. Add Barangay Contribution Summary Endpoint

```javascript
router.get('/barangay/:barangayId/summary', async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { start_date, end_date } = req.query;
    const userContext = await getUserContext(req);

    // Authorization check
    if (userContext.role !== 'admin' && userContext.barangay_id !== parseInt(barangayId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view summaries for your barangay' 
      });
    }

    let query = `
      SELECT 
        COUNT(DISTINCT c.id) as total_contributions,
        SUM(c.amount) as total_amount,
        COUNT(DISTINCT c.farmer_id) as total_contributors,
        AVG(c.amount) as average_contribution,
        b.name as barangay_name
      FROM contributions c
      LEFT JOIN barangays b ON c.barangay_id = b.id
      WHERE c.barangay_id = ? AND c.status = 'confirmed'
    `;
    const params = [barangayId];

    if (start_date) {
      query += ' AND c.contribution_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND c.contribution_date <= ?';
      params.push(end_date);
    }

    const [summary] = await pool.execute(query, params);
    res.json({ 
      success: true, 
      summary: summary[0] || {} 
    });
  } catch (error) {
    console.error('Error fetching contribution summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});
```

## Implementation Checklist for contributions.js

- [ ] Add getUserContext helper function
- [ ] Update GET / with barangay filtering
- [ ] Update GET /farmer/:farmerId with barangay validation
- [ ] Update POST / with barangay assignment from farmer
- [ ] Update PUT /:id with barangay check
- [ ] Update DELETE /:id with barangay check
- [ ] Add GET /barangay/:barangayId/summary endpoint
- [ ] Add activity logging with barangay_id
- [ ] Test all endpoints with officer and admin accounts
- [ ] Verify proper barangay isolation

## Key Principles

1. **Contributions must be tagged with farmer's barangay_id**
2. **Officers can only see contributions from their barangay**
3. **Admins see all contributions across all barangays**
4. **Only officers/admins from the same barangay can record contributions**
5. **Contribution summaries must respect barangay context**

## API Examples

### Get all contributions for a barangay
```bash
GET /api/contributions?barangay_id=13
Authorization: Bearer {token}

Response:
{
  "success": true,
  "contributions": [
    {
      "id": 1,
      "farmer_id": 101,
      "farmer_name": "Juan dela Cruz",
      "barangay_id": 13,
      "barangay_name": "Camansihan",
      "amount": 500,
      "contribution_date": "2026-02-15",
      "status": "confirmed"
    }
  ]
}
```

### Get contribution summary for barangay
```bash
GET /api/contributions/barangay/13/summary?start_date=2026-01-01&end_date=2026-02-28
Authorization: Bearer {token}

Response:
{
  "success": true,
  "summary": {
    "barangay_name": "Camansihan",
    "total_contributions": 25,
    "total_amount": 12500,
    "total_contributors": 18,
    "average_contribution": 500
  }
}
```
