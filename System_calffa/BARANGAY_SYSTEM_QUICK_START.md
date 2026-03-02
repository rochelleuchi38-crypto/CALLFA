# Quick Implementation Guide - Barangay Inventory & Booking System

## Files Changed

### 1. **Middleware Updates**
📁 `backend/middleware/auth.js`
- ✅ Added `verifyBookingBarangayAccess()` middleware
- ✅ Exported new middleware function

### 2. **Route Updates**  
📁 `backend/routes/machinery.js`
- ✅ Added barangay_id capture in POST /api/machinery/bookings
- ✅ Updated GET /api/machinery/inventory to filter by barangay
- ✅ Updated GET /api/machinery/bookings to filter by barangay
- ✅ Updated GET /api/machinery/bookings/:id with barangay verification
- ✅ Updated PUT /api/machinery/bookings/:id/approve with barangay check
- ✅ Updated PUT /api/machinery/bookings/:id/reject with barangay check
- ✅ Updated POST /api/machinery/bookings/:id/payment with barangay check
- ✅ Updated PUT /api/machinery/bookings/:id/deploy with barangay check
- ✅ Updated PUT /api/machinery/bookings/:id/return-equipment with barangay check
- ✅ Updated PUT /api/machinery/bookings/:id/mark-completed with barangay check
- ✅ Updated PUT /api/machinery/bookings/:id/resolve-incomplete with barangay check

### 3. **Migrations Created**
📁 `backend/migrations/populate_booking_barangay_id.sql`
- Populates existing bookings with barangay_id from farmer records
- Creates necessary indexes

📁 `backend/migrations/populate_machinery_barangay_id.sql`
- Assigns barangay_id to machinery items
- Creates necessary indexes

📁 `backend/migrations/populate_operators_barangay_id.sql`
- Populates operator assignments with barangay_id
- Creates necessary indexes

### 4. **Documentation**
📁 `BARANGAY_INVENTORY_BOOKING_SYSTEM.md`
- Complete implementation guide
- Architecture explanation
- API endpoint changes
- Security guarantees
- Error scenarios

---

## Implementation Steps

### Step 1: Database Migrations
Run these SQL files in the exact order (if not already applied):

```bash
# From your MySQL CLI or database management tool:
mysql -u root -D CALFFA < backend/migrations/add_barangay_id_to_machinery.sql
mysql -u root -D CALFFA < backend/migrations/populate_machinery_barangay_id.sql

mysql -u root -D CALFFA < backend/migrations/populate_booking_barangay_id.sql

mysql -u root -D CALFFA < backend/migrations/populate_operators_barangay_id.sql
```

### Step 2: Verification Queries
Run these to verify migrations worked:

```sql
-- Check machinery
SELECT COUNT(*) as total_machines, 
       COUNT(barangay_id) as assigned,
       SUM(CASE WHEN barangay_id IS NULL THEN 1 ELSE 0 END) as missing
FROM machinery_inventory;

-- Check bookings
SELECT COUNT(*) as total_bookings,
       COUNT(barangay_id) as assigned,
       SUM(CASE WHEN barangay_id IS NULL THEN 1 ELSE 0 END) as missing
FROM machinery_bookings;

-- Check operators
SELECT COUNT(*) as total_operators,
       COUNT(barangay_id) as assigned,
       SUM(CASE WHEN barangay_id IS NULL THEN 1 ELSE 0 END) as missing
FROM machinery_operators;
```

Expected: All machines, bookings, and operators should have barangay_id assigned (missing = 0)

### Step 3: Verify Consistency
```sql
-- Verify no cross-barangay bookings
SELECT COUNT(*) as cross_barangay_issues
FROM machinery_bookings mb
JOIN farmers f ON mb.farmer_id = f.id
WHERE mb.barangay_id != f.barangay_id;
-- Expected: 0

-- Verify machinery assignments
SELECT COUNT(*) as machinery_barangay_issues
FROM machinery_bookings mb
JOIN machinery_inventory mi ON mb.machinery_id = mi.id
WHERE mb.barangay_id != mi.barangay_id;
-- Expected: 0
```

### Step 4: Code Deployment
```bash
cd backend
# No need to install packages - all dependencies already there
npm run dev  # or your start command
```

### Step 5: Test Critical Flows

#### Test 1: Create Booking (Should Capture Barangay)
```javascript
POST /api/machinery/bookings
{
  "farmer_id": 1,
  "machinery_id": 1,
  "booking_date": "2024-03-01",
  "service_location": "Rice field",
  "area_size": 2,
  "area_unit": "hectares",
  "notes": "Test booking"
}

// Response should include: "barangay_id": <farmer_barangay>
```

#### Test 2: List Bookings (Should Filter by Barangay)
```javascript
// Officer token from Barangay 1
GET /api/machinery/bookings

// Should return: only bookings from Barangay 1
// Response should include: "filtered_by_barangay": true
```

#### Test 3: Approve Booking (Should Verify Barangay)
```javascript
// Manager from Barangay A tries to approve Barangay B booking
PUT /api/machinery/bookings/999/approve
{ "approved_by": 42 }  // Officer from different barangay

// Should return 403: "You can only approve bookings from your assigned barangay."
```

#### Test 4: Cross-Barangay Booking Attempt (Should Reject)
```javascript
// Farmer from Barangay A tries to book machinery from Barangay B
POST /api/machinery/bookings
{
  "farmer_id": 5,     // From Barangay A
  "machinery_id": 10, // From Barangay B
  // ...
}

// Should return error: "Machinery is not available in your barangay"
```

---

## Key Implementation Details

### Barangay ID Capture (POST /api/machinery/bookings)
```javascript
// Now does this:
1. Get farmer's barangay_id from farmer record
2. Verify machinery belongs to same barangay
3. Store barangay_id with booking
4. Prevents cross-barangay bookings
```

### Barangay Filtering (GET endpoints)
```javascript
// GET /api/machinery/bookings now:
1. Extracts user's barangay_id from JWT token
2. For non-admin users, filters: WHERE mb.barangay_id = userBarangayId
3. Returns filtered_by_barangay: true/false flag
```

### Barangay Verification (Action endpoints)
```javascript
// All action endpoints (approve, deploy, payment, etc.) now:
1. Verify user's role
2. Get user's barangay_id
3. Get resource's barangay_id
4. Compare: if mismatch AND user is not admin, reject with 403
5. Log action with barangay context
```

---

## Rollback Instructions (If Needed)

### Quick Disable (Emergency Only)
```javascript
// In machinery.js, comment out barangay verification:
const barangayId = farmer[0].barangay_id;
// if (machinery[0].barangay_id !== barangayId) {
//   return res.status(403).json(...);
// }
```

### Full Rollback
```bash
# Revert code changes:
git checkout backend/middleware/auth.js
git checkout backend/routes/machinery.js

# Restore from backup and drop migrations (DANGEROUS - DO NOT USE IN PRODUCTION)
```

---

## Monitoring & Validation

### After Deployment
Check application logs for:
- ✅ Barangay verification messages
- ✅ Cross-barangay rejection attempts
- ✅ Proper error messages for access denials

### Sample Log Messages
```
✅ Booking 123 approved by User 42 (Barangay: 1)
✔️ Equipment returned and signed off for Booking 123 by Operator 55 (Barangay: 1)
💰 Payment recorded for Booking 456 by Treasurer 30 (Barangay: 1)
❌ Booking 789 approval rejected - barangay mismatch
```

---

## Support & Questions

### Common Issues

**Q: Migration fails with "barangay_id already exists"**
A: Migrations were already applied. Skip that migration and run remaining ones.

**Q: Getting "Machinery not available in your barangay" error**
A: Machinery you're trying to book belongs to a different barangay. Book machinery from your barangay only.

**Q: Officer can't see any bookings**
A: Ensure officer has barangay_id set in their farmer record. Check: `SELECT barangay_id FROM farmers WHERE id = ?`

**Q: Admin can't see all machines**
A: Admin queries should bypass barangay filter. Check: `if (userRole !== 'admin')` condition is working.

---

## Verify Data Integrity Script

Run this SQL to ensure all is well:

```sql
-- Complete validation
SELECT 
  (SELECT COUNT(*) FROM machinery_inventory WHERE barangay_id IS NULL) as machinery_missing,
  (SELECT COUNT(*) FROM machinery_bookings WHERE barangay_id IS NULL) as bookings_missing,
  (SELECT COUNT(*) FROM machinery_operators WHERE barangay_id IS NULL) as operators_missing,
  (SELECT COUNT(*) FROM machinery_bookings mb 
   JOIN farmers f ON mb.farmer_id = f.id 
   WHERE mb.barangay_id != f.barangay_id) as booking_farmer_mismatch,
  (SELECT COUNT(*) FROM machinery_bookings mb 
   JOIN machinery_inventory mi ON mb.machinery_id = mi.id 
   WHERE mb.barangay_id != mi.barangay_id) as booking_machinery_mismatch;

-- All results should be 0
```

---

## Success Indicators

✅ **System is working correctly when:**
1. Officers only see their barangay's machines
2. Officers only see their barangay's bookings
3. Booking creation automatically captures barangay from farmer
4. Cross-barangay booking attempts are rejected
5. Cross-barangay approvals are rejected
6. All action logs include barangay context
7. Admin can view all machines across barangays

---

**Last Updated**: February 22, 2026
**System Version**: Barangay Isolation Complete
**Data Status**: ✅ Ready for Production
