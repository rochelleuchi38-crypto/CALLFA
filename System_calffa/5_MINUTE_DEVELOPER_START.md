# 🚀 Developer Quick Start - Get Started in 5 Minutes

## What You Need to Know (Right Now)

You're implementing a **barangay-based access control system** for a multi-tenant agricultural platform.

### The Core Concept
```
Admin can see → ALL barangays
Officer can see → ONLY their assigned barangay
Farmer can see → Own records
```

### How It Works (Simple Version)
1. User logs in → Receives JWT token with `barangay_id` inside
2. User makes API request → Includes JWT in Authorization header
3. Server verifies token → Extracts `barangay_id`
4. SQL query runs → Adds `WHERE barangay_id = ?` (unless admin)
5. Officer sees only their barangay ✅

---

## Files You Need Right Now

### 1. READ FIRST (2 minutes)
Open: [QUICK_REFERENCE_BARANGAY.md](QUICK_REFERENCE_BARANGAY.md)
- Section: "Copy-Paste Code Snippets"
- Read: The 5 endpoint patterns
- Goal: Understand the 3-line barangay check pattern

### 2. UNDERSTAND THE PATTERN (3 minutes)
The most important pattern (appears in every route):
```javascript
// Check if user is admin or same barangay
if (user.role !== 'admin' && user.barangay_id !== resource.barangay_id) {
  return res.status(403).json({ message: 'Access denied' });
}
```

### 3. LOOK AT WORKING CODE (Optional)
Already complete and working:
- `routes/farms.js` - See how it's done
- `routes/loans.js` - Full example with all endpoints

---

## Now Apply Patches (Choose Your Route)

### Option A: Update machinery.js (90-120 minutes)
1. Open [MACHINERY_BARANGAY_PATCH.md](MACHINERY_BARANGAY_PATCH.md)
2. Copy code snippets section by section
3. Paste into your machinery.js file
4. Replace old versions of these functions: GET /, POST /, PUT /approve
5. Test each endpoint

**Time**: ~90-120 minutes | **Difficulty**: Medium

### Option B: Update machinery-financial.js (90-120 minutes)
1. Open [MACHINERY_FINANCIAL_BARANGAY_PATCH.md](MACHINERY_FINANCIAL_BARANGAY_PATCH.md)
2. Follow same pattern as machinery.js
3. Focus on: GET /expenses, POST /expenses, summary endpoints
4. Add barangay filtering to all GET queries
5. Add barangay assignment to all INSERT queries

**Time**: ~90-120 minutes | **Difficulty**: Medium

### Option C: Update contributions.js (45-60 minutes)
1. Open [CONTRIBUTIONS_BARANGAY_PATCH.md](CONTRIBUTIONS_BARANGAY_PATCH.md)
2. Simplest of the three patches
3. Add barangay filtering + assignment
4. Update GET endpoints with WHERE clause
5. Add barangay_id to POST inserts

**Time**: ~45-60 minutes | **Difficulty**: Low-Medium

---

## The 3-Step Checklist for Each Route

For EVERY GET endpoint:
- [ ] Extract user context: `const user = await getUserContext(req);`
- [ ] Add to WHERE clause: `if (user.role !== 'admin') query += ' AND barangay_id = ?';`
- [ ] Add parameter: `params.push(user.barangay_id);`

For EVERY POST/PUT/DELETE endpoint:
- [ ] Get barangay of resource: `const [resource] = await pool.execute('SELECT barangay_id FROM table WHERE id = ?', [id]);`
- [ ] Check access: `if (user.role !== 'admin' && user.barangay_id !== resource.barangay_id) return 403;`
- [ ] Add to INSERT/UPDATE: All inserts should include `barangay_id` value

---

## Code Patterns (Copy & Paste These)

### Pattern 1: Extract User Context
```javascript
const jwt = require('jsonwebtoken');
const user = jwt.verify(token, process.env.JWT_SECRET);
// user now has: id, role, barangay_id
```

### Pattern 2: GET Endpoint with Filtering
```javascript
let where = '';
const params = [];
if (user.role !== 'admin') {
  where = ' WHERE barangay_id = ?';
  params.push(user.barangay_id);
}
const [results] = await pool.execute(`SELECT * FROM table${where}`, params);
```

### Pattern 3: POST with Barangay Assignment
```javascript
const [farmer] = await pool.execute(
  'SELECT barangay_id FROM farmers WHERE id = ?',
  [farmerId]
);
const barangayId = farmer[0].barangay_id;
await pool.execute(
  'INSERT INTO table (farmer_id, barangay_id, ...) VALUES (?, ?, ...)',
  [farmerId, barangayId, ...]
);
```

### Pattern 4: PUT/DELETE with Authorization
```javascript
const [resource] = await pool.execute(
  'SELECT barangay_id FROM table WHERE id = ?',
  [id]
);
if (user.role !== 'admin' && user.barangay_id !== resource[0].barangay_id) {
  return res.status(403).json({ message: 'Access denied' });
}
// Proceed with update/delete
```

---

## Common Questions

### Q: "Do I need to update migrations?"
**A**: No, migrations are already created in backend/migrations/. You just need to run them:
```bash
mysql -u root -p calffa < backend/migrations/add_barangay_id_to_farmers.sql
mysql -u root -p calffa < backend/migrations/add_barangay_id_to_loans.sql
# ... etc for all 5 migrations
```

### Q: "Do I need auth middleware?"
**A**: No, it's already created in middleware/auth.js. Just import and use it in server.js:
```javascript
const { verifyToken } = require('./middleware/auth');
app.use('/api/loans', verifyToken, loansRouter);
```

### Q: "How do I test if officer can't see other barangay?"
**A**: 
1. Login as officer from barangay A → get token1
2. Login as officer from barangay B → get token2
3. Call GET /loans with token1 → Should only see A's loans
4. Call GET /loans with token2 → Should only see B's loans
5. Call DELETE loan_from_A with token2 → Should get 403 error

### Q: "What if officer is admin?"
**A**: If `user.role === 'admin'` → No barangay filtering applied → Admin sees everything

### Q: "How do I know which token to use?"
**A**: The frontend stores the JWT token when user logs in. Frontend sends it in every request:
```javascript
headers: { Authorization: `Bearer ${token}` }
```

### Q: "What about test data?"
**A**: Create test users with different roles/barangays:
- Admin user (barangay_id = NULL)
- Officer A from barangay 1 (barangay_id = 1)
- Officer B from barangay 2 (barangay_id = 2)
- Farmer from barangay 1 (barangay_id = 1)

---

## Where to Get Help

| Question | Answer | File |
|----------|--------|------|
| "How do I write the GET endpoint?" | See pattern in reference card | QUICK_REFERENCE_BARANGAY.md |
| "I'm updating machinery.js, where do I start?" | Copy code from patch file | MACHINERY_BARANGAY_PATCH.md |
| "What are all the authorization checks?" | Full matrix in guide | BARANGAY_IMPLEMENTATION_GUIDE.md |
| "Did I implement this correctly?" | Compare against loans.js (completed) | routes/loans.js |
| "What's my timeline?" | See phase breakdown | BARANGAY_SYSTEM_SUMMARY.md |
| "Where do I find all docs?" | Navigation hub with links | BARANGAY_IMPLEMENTATION_INDEX.md |

---

## Next Steps

### Right Now (5 minutes)
- [ ] Read QUICK_REFERENCE_BARANGAY.md
- [ ] Understand the 3-line barangay check pattern
- [ ] Look at routes/loans.js to see real implementation

### This Hour (60 minutes)
- [ ] Pick a route to update (machinery.js recommended)
- [ ] Open corresponding patch file
- [ ] Copy first code block (getUserContext helper)
- [ ] Paste into your route file

### Today (4-6 hours)
- [ ] Apply all code snippets from patch
- [ ] Test with different users/barangays
- [ ] Fix any issues

### This Week (4-6 hours more)
- [ ] Apply patches to all 5 remaining routes
- [ ] Test all endpoints
- [ ] Run database migrations if not done yet

---

## Checklist Before Submitting

Before you commit your changes:
- [ ] No barangay_id hardcoded anywhere (always from user context)
- [ ] All SELECT queries have WHERE barangay_id filter for officers
- [ ] All INSERT queries include barangay_id column
- [ ] All PUT/DELETE queries check authorization first
- [ ] All SQL uses parameterized statements (NO string concatenation)
- [ ] Activity logs include barangay_id
- [ ] Test with admin (sees all) ✅
- [ ] Test with officer A (sees only A) ✅
- [ ] Test with officer B (sees only B) ✅
- [ ] Test cross-barangay access returns 403 ✅

---

## Running Database Migrations

If not already done:
```bash
cd c:\xampp\htdocs\CALFFA\CALFFA\Registration\backend\migrations

mysql -u root -p calffa < add_barangay_id_to_farmers.sql
mysql -u root -p calffa < add_barangay_id_to_loans.sql
mysql -u root -p calffa < add_barangay_id_to_machinery.sql
mysql -u root -p calffa < add_barangay_id_to_financials.sql
mysql -u root -p calffa < add_barangay_to_activity_logs.sql
```

Verify columns were added:
```bash
mysql -u root -p calffa -e "DESCRIBE farmers;" | grep barangay_id
```

---

## Ready? Start Here

1. Open [QUICK_REFERENCE_BARANGAY.md](QUICK_REFERENCE_BARANGAY.md) ← Do this now
2. Read the code patterns (5 min)
3. Pick a route to update
4. Open the corresponding patch file
5. Copy and paste code blocks
6. Test everything

**Expected Time**: 4-6 hours to update all remaining 5 routes  
**Difficulty**: Easy-Medium (mostly copy-paste, patterns repetitive)  
**Help Available**: Compare against routes/loans.js (the completed example)

---

**Questions?** Check [BARANGAY_IMPLEMENTATION_INDEX.md](BARANGAY_IMPLEMENTATION_INDEX.md) for full navigation and help resources.

Good luck! 🚀
