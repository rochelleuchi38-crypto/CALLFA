# Barangay-Based Inventory and Booking System - Implementation Guide

## Overview
This system ensures strict data isolation and access control so that each barangay operates independently while maintaining a unified system architecture. Every machine and booking is now strictly tied to a specific barangay.

---

## Key Features Implemented

### 1. **Inventory Structure**
- ✅ Each barangay has its own machines
- ✅ Every machine is assigned to a specific barangay via `machinery_inventory.barangay_id`
- ✅ Machines from one barangay are NOT accessible or bookable by another barangay
- ✅ Admin can view all machines from all barangays with barangay filter capability

### 2. **System Views and Access Control**

#### Admin View
- Can view all machines from all barangays
- Inventory is automatically organized/filterable per barangay
- Has full access to all records and transactions
- No barangay restrictions apply to admin role

#### President View  
- Can only view and handle machine inventory of assigned barangay
- Cannot see machines from other barangays
- Cannot book machinery outside their barangay
- Access automatically filtered by `barangay_id` in JWT token

#### Officer View (Treasurer, Auditor, Agriculturist)
- Same barangay restrictions as President
- Can only see data related to their assigned barangay
- Transactions filtered by barangay_id

### 3. **Booking System Modifications**

#### Booking Approval & Completion
- **Operation Manager**: Can only approve/complete bookings for their assigned barangay
- **Business Manager**: Can only approve/complete bookings for their assigned barangay
- **Operator**: Can only deploy/return equipment for bookings in their assigned barangay
- **Treasurer**: Can only record payments for bookings in their assigned barangay
- **Admin**: Full access across all barangays

#### Critical Validations
```
✅ Booking creation captures farmer's barangay_id
✅ Machinery must belong to farmer's barangay
✅ Role-based access verified at each step
✅ Barangay match verified before action execution
✅ All transactions logged with barangay context
```

---

## Database Schema Changes

### Tables Modified

#### `machinery_inventory`
```sql
ALTER TABLE machinery_inventory ADD COLUMN barangay_id INT;
ALTER TABLE machinery_inventory ADD FOREIGN KEY (barangay_id) REFERENCES barangays(id);
CREATE INDEX idx_machinery_inventory_barangay ON machinery_inventory(barangay_id);
```

#### `machinery_bookings`
```sql
ALTER TABLE machinery_bookings ADD COLUMN barangay_id INT AFTER farmer_id;
ALTER TABLE machinery_bookings ADD FOREIGN KEY (barangay_id) REFERENCES barangays(id);
CREATE INDEX idx_machinery_bookings_barangay ON machinery_bookings(barangay_id);
CREATE INDEX idx_machinery_bookings_barangay_status ON machinery_bookings(barangay_id, status);
```

#### `machinery_operators`
```sql
ALTER TABLE machinery_operators ADD COLUMN barangay_id INT AFTER farmer_id;
ALTER TABLE machinery_operators ADD FOREIGN KEY (barangay_id) REFERENCES barangays(id);
CREATE INDEX idx_machinery_operators_barangay ON machinery_operators(barangay_id);
```

---

## API Endpoints - Updated Behavior

### GET /api/machinery/inventory
**Before**: Returns all machinery regardless of barangay
**After**: 
- Admin: See all machines from all barangays (with barangay filter available)
- Officers: Automatically filtered to show only their barangay's machines

```javascript
// Example: President from Barangay 1 requests inventory
GET /api/machinery/inventory
Response: {
  success: true,
  inventory: [
    { id: 1, machinery_name: "Tractor", barangay_id: 1, barangay_name: "Barangay 1" },
    // Only machines from Barangay 1 returned
  ],
  filtered_by_barangay: true
}
```

### POST /api/machinery/bookings
**Before**: Booking created without barangay context
**After**:
- Captures farmer's barangay_id from farmer record
- Validates machinery belongs to same barangay
- Rejects if machinery from different barangay

```javascript
// Booking creation flow
POST /api/machinery/bookings
Body: {
  farmer_id: 5,        // Farmer from Barangay 1
  machinery_id: 2,     // Machinery assigned to Barangay 1
  booking_date: "2024-02-25",
  // ...other fields
}

Success Response: {
  success: true,
  booking_id: 123,
  barangay_id: 1,      // Automatically captured
  // ...
}

Error (machinery from different barangay): {
  success: false,
  message: "Machinery is not available in your barangay"
}
```

### GET /api/machinery/bookings
**Before**: Returns all bookings regardless of barangay
**After**:
- Admin: See all bookings from all barangays
- Officers: Automatically filtered to only their barangay bookings

### PUT /api/machinery/bookings/:id/approve
**Before**: Any Business Manager could approve any booking
**After**:
- Manager's barangay must match booking's barangay
- Admin can approve any booking
- Rejects with 403 error if barangay mismatch

```javascript
// Barangay Verification in Approval
PUT /api/machinery/bookings/123/approve
Body: { approved_by: 42 }  // Officer from Barangay 1

// If booking is from Barangay 2:
Response: {
  success: false,
  message: "You can only approve bookings from your assigned barangay."
}
```

### PUT /api/machinery/bookings/:id/deploy
**Before**: Any operator could deploy any booking
**After**:
- Operator's barangay must match booking's barangay
- Verifies before equipment deployment

### POST /api/machinery/bookings/:id/payment
**Before**: Any treasurer could record payment
**After**:
- Treasurer's barangay must match booking's barangay
- Prevents cross-barangay payment recording

### PUT /api/machinery/bookings/:id/mark-completed
**Before**: Admin could mark any booking complete
**After**:
- President/Treasurer must be from same barangay (unless admin)
- Admin has access across all barangays

---

## Middleware Changes

### New Middleware: `verifyBookingBarangayAccess()`
```javascript
// Location: middleware/auth.js

const verifyBookingBarangayAccess = async (req, res, next) => {
  // Admin bypass
  if (req.user?.role === 'admin') return next();
  
  // Get booking and verify barangay match
  const booking = await pool.execute(
    'SELECT barangay_id FROM machinery_bookings WHERE id = ?',
    [bookingId]
  );
  
  // Verify user's barangay matches booking's barangay
  if (req.user?.barangay_id !== booking[0].barangay_id) {
    return res.status(403).json({
      message: 'You can only access bookings from your assigned barangay.'
    });
  }
};
```

---

## Migration Steps

### Step 1: Run Migrations
```bash
# Populate barangay_id in machinery
mysql -u root -D CALFFA < migrations/populate_machinery_barangay_id.sql

# Populate barangay_id in machinery_bookings
mysql -u root -D CALFFA < migrations/populate_booking_barangay_id.sql

# Populate barangay_id in machinery_operators
mysql -u root -D CALFFA < migrations/populate_operators_barangay_id.sql
```

### Step 2: Verify Data
```sql
-- Check machinery assignment
SELECT COUNT(*) as total, COUNT(barangay_id) as assigned 
FROM machinery_inventory;

-- Check bookings
SELECT COUNT(*) as total, COUNT(barangay_id) as assigned 
FROM machinery_bookings;

-- Check operators
SELECT COUNT(*) as total, COUNT(barangay_id) as assigned 
FROM machinery_operators;
```

### Step 3: Deploy Updated Code
```bash
# Update routes/machinery.js (already done)
# Update middleware/auth.js (already done)
# Restart Node.js server
npm run dev  # or appropriate start command
```

---

## Security Guarantees

### 1. **Equipment Isolation**
```
Barangay A's Machines ≠ Barangay B's Machines
↓
No cross-barangay bookings possible
```

### 2. **Transaction Isolation**
```
Barangay A's Bookings ≠ Barangay B's Bookings
↓
Officers only see/process their barangay's transactions
```

### 3. **Role-Based Enforcement**
```
Operation Manager from Barangay A
  ↓ Can Approve booking → Must be from Barangay A
  ↓ Cannot Approve booking → From Barangay B
```

### 4. **Multi-Layer Verification**
For each booking action:
1. ✅ Role verification (is user authorized role?)
2. ✅ Barangay verification (is user from same barangay?)
3. ✅ Booking status verification (is booking in correct state?)
4. ✅ Business logic verification (capacity, availability, etc.)

---

## Admin vs Officer Experience

### Admin Flow
```
Admin Login
  ↓
View All Machines (with filter options)
  ↓ Can view from all barangays simultaneously
Select Barangay Filter (optional)
  ↓
Approve Any Booking
  ↓ Full transaction history access
```

### Officer (President) Flow
```
President Login (from Barangay 1)
  ↓
View Machines (AUTO: only Barangay 1 machines)
  ↓ Cannot see Barangay 2 machines
  ↓
View Bookings (AUTO: only Barangay 1 bookings)
  ↓
Approve Bookings (AUTO: verified as Barangay 1)
  ↓
Record Payments (AUTO: verified as Barangay 1)
```

---

## Error Scenarios & Handling

### Scenario 1: Cross-Barangay Booking Attempt
```
POST /api/machinery/bookings
Farmer from Barangay A requests machine from Barangay B

Response: {
  success: false,
  message: "Machinery is not available in your barangay"
}
```

### Scenario 2: Cross-Barangay Approval Attempt
```
PUT /api/machinery/bookings/123/approve
Manager from Barangay B tries to approve Barangay A booking

Response: {
  success: false,
  message: "You can only approve bookings from your assigned barangay."
}
```

### Scenario 3: Payment Recording Mismatch
```
POST /api/machinery/bookings/456/payment
Treasurer from Barangay C records payment for Barangay D booking

Response: {
  success: false,
  message: "You can only record payments for bookings in your assigned barangay."
}
```

---

## Monitoring & Compliance

### Data Isolation Verification Query
```sql
-- Verify no cross-barangay assignments
SELECT COUNT(*) FROM machinery_bookings mb
JOIN machinery_inventory mi ON mb.machinery_id = mi.id
WHERE mb.barangay_id != mi.barangay_id;
-- Result should be: 0 (zero cross-barangay bookings)

-- Verify farmer matches barangay
SELECT COUNT(*) FROM machinery_bookings mb
JOIN farmers f ON mb.farmer_id = f.id
WHERE mb.barangay_id != f.barangay_id;
-- Result should be: 0 (zero mismatches)
```

### Audit Log
All critical actions log barangay_id:
- Booking creation
- Booking approval/rejection
- Equipment deployment
- Payment recording
- Booking completion

---

## Testing Checklist

### Access Control Tests
- [ ] Admin can view all machines
- [ ] President A cannot see Barangay B machines
- [ ] President A can only approve Barangay A bookings
- [ ] Treasurer A cannot record payment for Barangay B booking
- [ ] Operator A cannot deploy Barangay B equipment

### Data Isolation Tests
- [ ] Barangay A bookings not visible to Barangay B users
- [ ] Booking creation auto-captures correct barangay_id
- [ ] Machinery booking restricted to same barangay only
- [ ] Cross-barangay attempts properly rejected

### Workflow Tests
- [ ] Complete booking workflow within same barangay works
- [ ] All approval steps enforce barangay match
- [ ] Payment recording validates barangay
- [ ] Admin override works across all barangays

---

## Rollback Plan

If issues arise, can temporarily disable barangay checks:

```javascript
// In route handlers, comment out barangay verification:
// if (req.user?.barangay_id !== booking[0].barangay_id) {
//   return res.status(403).json(...);  // Comment this block
// }
```

However, **NOT RECOMMENDED** as it compromises security guarantees.

---

## Configuration Summary

**Database**: 
- `machinery_inventory.barangay_id`
- `machinery_bookings.barangay_id`
- `machinery_operators.barangay_id`

**API Routes**:
- GET `/api/machinery/inventory` - Filtered by barangay
- POST `/api/machinery/bookings` - Captures barangay_id
- GET `/api/machinery/bookings` - Filtered by barangay
- PUT `/api/machinery/bookings/:id/approve` - Verified barangay access
- PUT `/api/machinery/bookings/:id/deploy` - Verified barangay access
- POST `/api/machinery/bookings/:id/payment` - Verified barangay access
- PUT `/api/machinery/bookings/:id/mark-completed` - Verified barangay access

**Middleware**:
- `verifyBookingBarangayAccess()` - New middleware for booking barangay validation
- Enhanced existing machinery and loan access controls

---

## Next Steps

1. ✅ Run database migrations
2. ✅ Verify data integrity
3. ✅ Deploy updated code
4. ✅ Run integration tests
5. ✅ Monitor audit logs for proper filtering
6. ✅ Document for end-users
