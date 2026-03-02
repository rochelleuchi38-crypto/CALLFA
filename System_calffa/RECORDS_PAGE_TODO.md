# RecordsPage - Financial Records Module

## Current Status: Mock Data (Pending Implementation)

The RecordsPage (`src/views/RecordsPage.vue`) currently displays mock financial records data. This page is for tracking **loans and payments**, which is separate from the Farmer & Member Module.

## Mock Data Currently Used:
```javascript
const records = ref([
  { id: 1, date: '2025-11-01', type: 'Loan', amount: 5000, status: 'Paid', remarks: 'Rice loan' },
  { id: 2, date: '2025-11-05', type: 'Payment', amount: 2000, status: 'Pending', remarks: 'Fertilizer purchase' },
  { id: 3, date: '2025-11-10', type: 'Loan', amount: 8000, status: 'Overdue', remarks: 'Corn loan' },
  { id: 4, date: '2025-11-12', type: 'Payment', amount: 1500, status: 'Paid', remarks: 'Seed purchase' },
])
```

## To Implement Real Data:

### 1. Create Database Table

```sql
CREATE TABLE IF NOT EXISTS financial_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL,
  record_date DATE NOT NULL,
  record_type ENUM('loan', 'payment', 'contribution') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('paid', 'pending', 'overdue', 'cancelled') DEFAULT 'pending',
  remarks TEXT,
  due_date DATE,
  paid_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_record_type (record_type),
  INDEX idx_status (status),
  INDEX idx_record_date (record_date),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
);
```

### 2. Create Backend API Route

**File:** `backend/routes/financial-records.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/financial-records - Get all financial records
router.get('/', async (req, res) => {
  try {
    const { farmer_id, record_type, status, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        fr.*,
        f.full_name,
        f.reference_number
      FROM financial_records fr
      JOIN farmers f ON fr.farmer_id = f.id
      WHERE 1=1
    `;
    const params = [];
    
    if (farmer_id) {
      query += ' AND fr.farmer_id = ?';
      params.push(farmer_id);
    }
    
    if (record_type) {
      query += ' AND fr.record_type = ?';
      params.push(record_type);
    }
    
    if (status) {
      query += ' AND fr.status = ?';
      params.push(status);
    }
    
    if (start_date) {
      query += ' AND fr.record_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND fr.record_date <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY fr.record_date DESC';
    
    const [records] = await db.query(query, params);
    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching financial records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch records' });
  }
});

// POST /api/financial-records - Create new record
router.post('/', async (req, res) => {
  try {
    const { farmer_id, record_date, record_type, amount, status, remarks, due_date } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO financial_records 
       (farmer_id, record_date, record_type, amount, status, remarks, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [farmer_id, record_date, record_type, amount, status || 'pending', remarks, due_date]
    );
    
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating financial record:', error);
    res.status(500).json({ success: false, message: 'Failed to create record' });
  }
});

// PUT /api/financial-records/:id - Update record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paid_date, remarks } = req.body;
    
    const [result] = await db.query(
      `UPDATE financial_records 
       SET status = ?, paid_date = ?, remarks = ?
       WHERE id = ?`,
      [status, paid_date, remarks, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating financial record:', error);
    res.status(500).json({ success: false, message: 'Failed to update record' });
  }
});

// GET /api/financial-records/stats - Get financial statistics
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue,
        COUNT(*) as total_records,
        COUNT(DISTINCT farmer_id) as total_farmers
      FROM financial_records
    `);
    
    res.json({ success: true, stats: stats[0] });
  } catch (error) {
    console.error('Error fetching financial stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
```

### 3. Update server.js

```javascript
const financialRecordsRoutes = require('./routes/financial-records');
app.use('/api/financial-records', financialRecordsRoutes);
```

### 4. Update RecordsPage.vue

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardHeader from '../components/DashboardHeader.vue'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const records = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterDate = ref('')

const loadRecords = async () => {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams()
    if (filterDate.value) params.append('start_date', filterDate.value)
    
    const response = await fetch(`/api/financial-records?${params}`)
    if (response.ok) {
      const data = await response.json()
      records.value = data.records || []
    } else {
      error.value = 'Failed to load records'
    }
  } catch (err) {
    console.error('Error loading records:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const filteredRecords = computed(() => {
  return records.value.filter(record => {
    const matchesQuery = record.record_type.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         record.remarks.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDate = !filterDate.value || record.record_date === filterDate.value
    return matchesQuery && matchesDate
  })
})

const totalPaid = computed(() => 
  records.value.filter(r => r.status === 'paid').reduce((sum, r) => sum + parseFloat(r.amount), 0)
)

const totalPending = computed(() => 
  records.value.filter(r => r.status === 'pending').reduce((sum, r) => sum + parseFloat(r.amount), 0)
)

const formatCurrency = (value) => new Intl.NumberFormat('en-PH').format(value)

onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  loadRecords()
})
</script>
```

## Note

The RecordsPage mock data is **intentionally left** as it requires a separate Financial Records module implementation. This is outside the scope of Task 4 (Farmer & Member Module).

To implement this feature properly, you would need to:
1. Define business requirements for loans and payments tracking
2. Create the database table with proper relationships
3. Build the backend API with all CRUD operations
4. Update the frontend to fetch and display real data
5. Add forms for creating/editing financial records
6. Implement payment tracking and overdue notifications

**Recommendation:** Create this as a separate task/module (e.g., "Task 5: Financial Management Module") with its own specifications and requirements.
