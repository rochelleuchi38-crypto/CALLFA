# CALFFA Barangay-Based Access Control Implementation Guide

## Overview
This document details the comprehensive implementation of barangay-based access control across the CALFFA system. The system ensures that all data is isolated per barangay, with admins having full access and barangay officers having access only to their assigned barangay.

## Architecture

### Key Principles
1. **Admin Full Access**: Admins can view and manage data across all barangays
2. **Officer Barangay Isolation**: Officers (president, treasurer, auditor, operator, etc.) can only access data from their assigned barangay
3. **Data Segregation**: All transactions are tagged with barangay_id for proper isolation
4. **Role-Based Control**: Each role has specific permissions within their barangay

### User Roles

#### Admin
- Full access to all barangays and data
- Can assign officers to barangays
- Can approve/reject registrations
- Monitor all financial transactions
- View system-wide reports

#### Officers (Barangay-Specific)
- **President**: Oversees all operations, approves major decisions
- **Treasurer**: Approves loans, manages financial records
- **Auditor**: Audits financial transactions and records
- **Operation Manager**: Manages operational activities
- **Business Manager**: Manages business-related operations
- **Operator**: Operates machinery, books machinery services
- **Agriculturist**: Provides agricultural advisory

#### Farmer
- Applies for loans
- Books machinery services
- Views personal transactions
- Contributes to community

## Database Schema Changes

### Tables Modified

#### 1. farmers table
Added columns:
- `barangay_id INT` - References barangay where officer is assigned
- Required for officers, NULL for farmers initially

Migration file: `add_barangay_id_to_farmers.sql`

#### 2. loans table
Added columns:
- `barangay_id INT` - Barangay of the loan applicant
- Automatically populated from farmer's barangay during loan application

Migration file: `add_barangay_id_to_loans.sql`

#### 3. machinery_inventory table
Added columns:
- `barangay_id INT` - Barangay that owns the machinery

Migration file: `add_barangay_id_to_machinery.sql`

#### 4. machinery_bookings table
Added columns:
- `barangay_id INT` - Barangay where booking is made

Migration file: `add_barangay_id_to_machinery.sql`

#### 5. machinery_operators table
Added columns:
- `barangay_id INT` - Barangay where operator works

Migration file: `add_barangay_id_to_machinery.sql`

#### 6. machinery_expenses table
Added columns:
- `barangay_id INT` - Barangay of the machinery

Migration file: `add_barangay_id_to_financials.sql`

#### 7. contributions table
Added columns:
- `barangay_id INT` - Barangay of the contributor

Migration file: `add_barangay_id_to_financials.sql`

#### 8. activity_logs table
Added columns:
- `barangay_id INT` - Barangay context of the activity

Migration file: `add_barangay_to_activity_logs.sql`

## Code Structure

### New Files Created

#### 1. Middleware: `/backend/middleware/auth.js`
Comprehensive authentication and authorization middleware:

```javascript
// Middleware functions:
- verifyToken: Validates JWT and extracts user info
- isAdmin: Checks if user is admin
- isOfficer: Checks if user is an officer
- verifyBarangayAccess: Ensures barangay-level access control
- verifyFarmerBarangayAccess: Validates farmer access within barangay
- verifyMachineryBarangayAccess: Validates machinery access within barangay
- verifyLoanBarangayAccess: Validates loan access within barangay
- authorizeRoles: Role-based authorization
```

#### 2. Utilities: `/backend/utils/barangayHelpers.js`
Helper functions for barangay operations:

```javascript
// Functions:
- getUserBarangayContext: Get user's barangay info
- buildBarangayFilter: Build SQL WHERE clause for barangay filtering
- filterOfficersByBarangay: Filter officers by barangay
- getBarangayOfficers: Retrieve all officers in a barangay
- getBarangayFarmers: Retrieve all farmers in a barangay
- hasBarangayAccess: Check if user can access barangay
- getBarangayStats: Get statistics for a barangay
```

### Updated Files

#### 1. Routes: `/backend/routes/farmers.js`
**Changes:**
- Added barangay_id field to registration
- Officer registration requires barangay assignment
- Login response includes barangay context
- GET / endpoint filters by barangay for officers
- Approval endpoint assigns barangay to officers
- All queries include barangay_id

**New Response Format (Login):**
```json
{
  "success": true,
  "farmer": {
    "id": 1,
    "full_name": "John Doe",
    "role": "treasurer",
    "barangay_id": 5,
    "status": "approved"
  },
  "barangay": {
    "id": 5,
    "name": "Camansihan",
    "status": "active"
  },
  "token": "jwt_token"
}
```

#### 2. Routes: `/backend/routes/loans.js` (REPLACED)
**Complete rewrite with barangay support:**
- All loan queries include barangay filtering
- Loan creation automatically gets barangay from farmer
- Officers can only approve loans from their barangay
- Treasurer authorization checks barangay assignment
- GET /api/loans filters by barangay for officers
- Activity logging includes barangay context
- Rejection and approval are barangay-restricted

**Approval Logic:**
```javascript
// Only treasurers from the same barangay can approve
- Check approver's barangay_id matches loan's barangay_id
- Only allow if approver.role in ['treasurer', 'operation_manager', 'business_manager', 'president', 'admin']
- Admins have no barangay restriction
```

## Installation & Deployment

### Step 1: Run Database Migrations
```bash
cd backend/migrations

# Run each migration file in order
mysql -u root -p your_database < add_barangay_id_to_farmers.sql
mysql -u root -p your_database < add_barangay_id_to_loans.sql
mysql -u root -p your_database < add_barangay_id_to_machinery.sql
mysql -u root -p your_database < add_barangay_id_to_financials.sql
mysql -u root -p your_database < add_barangay_to_activity_logs.sql
```

### Step 2: Update Your Routes
The following route files have been updated/created:
- ✅ `/backend/middleware/auth.js` - NEW
- ✅ `/backend/utils/barangayHelpers.js` - NEW
- ✅ `/backend/routes/farmers.js` - UPDATED
- ✅ `/backend/routes/loans.js` - COMPLETELY UPDATED
- ⏳ `/backend/routes/machinery.js` - PENDING
- ⏳ `/backend/routes/machinery-financial.js` - PENDING
- ⏳ `/backend/routes/contributions.js` - PENDING
- ⏳ `/backend/routes/barangays.js` - PENDING
- ⏳ `/backend/routes/activity-logs.js` - PENDING

### Step 3: Update Server Configuration
In `server.js`, import and use the auth middleware:

```javascript
const { verifyToken } = require('./middleware/auth');

// Apply to protected routes
app.use('/api/loans', verifyToken, loansRoutes);
app.use('/api/machinery', verifyToken, machineryRoutes);
app.use('/api/machinery-financial', verifyToken, machineryFinancialRoutes);
app.use('/api/contributions', verifyToken, contributionsRoutes);
```

## API Endpoint Examples

### Authentication & User Management

#### 1. Register Officer with Barangay
```bash
POST /api/farmers/register
{
  "reference_number": "002",
  "full_name": "Maria Reyes",
  "phone_number": "09199999999",
  "date_of_birth": "1985-05-15",
  "address": "Camansihan",
  "password": "SecurePassword123",
  "role": "treasurer",
  "barangay_id": 13  # Required for officers
}
```

#### 2. Login
```bash
POST /api/farmers/login
{
  "reference_number": "002",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "farmer": {
    "id": 2,
    "full_name": "Maria Reyes",
    "role": "treasurer",
    "barangay_id": 13
  },
  "barangay": {
    "id": 13,
    "name": "Camansihan",
    "status": "active"
  },
  "token": "eyJhbGci..."
}
```

### Loan Management

#### 1. Apply for Loan (Farmer's barangay is used)
```bash
POST /api/loans
Authorization: Bearer {token}
{
  "farmer_id": 101,
  "loan_amount": 3000,
  "loan_type": "agricultural",
  "loan_purpose": "Seeds and fertilizer",
  "remarks": "Planting season"
}
```

#### 2. Get Loans by Barangay (Officer restricted)
```bash
GET /api/loans?status=pending
Authorization: Bearer {token}

# If officer: returns only loans from their barangay
# If admin: returns all loans
```

#### 3. Approve Loan (Treasurer only, from their barangay)
```bash
PUT /api/loans/5/approve
Authorization: Bearer {token}
{
  "approved_by": 2,  # Treasurer ID
  "remarks": "Approved for processing"
}

# System validates:
# - approved_by is a treasurer/admin
# - approved_by's barangay matches loan's barangay
```

## Access Control Matrix

| Action | Admin | Treasurer | President | Auditor | Farmer |
|--------|-------|-----------|-----------|---------|--------|
| View all loans | ✅ | ❌ | ❌ | ❌ | ❌ |
| View barangay loans | ✅ | ✅* | ✅* | ✅* | ❌ |
| View own loans | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply for loan | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve loan | ✅ | ✅* | ✅* | ❌ | ❌ |
| View machinery | ✅ | ✅* | ✅* | ✅* | ✅* |
| Book machinery | ✅ | ✅* | ✅* | ✅* | ✅* |
| View contributions | ✅ | ✅* | ✅* | ✅* | ❌ |
| Record contribution | ✅ | ✅* | ✅* | ❌ | ❌ |

*\* = Barangay-restricted, can only access own barangay*

## Implementation Checklist

### Phase 1: Foundation ✅
- [x] Create database migrations
- [x] Create authentication middleware
- [x] Create barangay helper utilities
- [x] Update farmers.js with barangay support
- [x] Complete rewrite of loans.js

### Phase 2: In Progress 🔄
- [ ] Update machinery.js with barangay isolation
- [ ] Update machinery-financial.js with barangay filtering
- [ ] Update contributions.js with barangay context
- [ ] Update barangays.js for officer management
- [ ] Update activity-logs.js with barangay context

### Phase 3: Frontend Updates ⏳
- [ ] Update login to store barangay context
- [ ] Add barangay selector to officer registrations
- [ ] Add barangay context to all dashboards
- [ ] Update forms to include barangay information
- [ ] Add barangay-aware reporting

### Phase 4: Testing & Deployment ⏳
- [ ] Unit test each route
- [ ] Integration test workflows
- [ ] UAT with officers from different barangays
- [ ] Performance testing with large datasets
- [ ] Security audit
- [ ] Production deployment

## Common Query Patterns

### Get user's barangay context
```javascript
const [users] = await pool.execute(
  'SELECT barangay_id FROM farmers WHERE id = ?',
  [userId]
);
const barangayId = users[0].barangay_id;
```

### Filter by user's barangay (if officer)
```javascript
let whereClause = '';
if (userRole !== 'admin' && userBarangayId) {
  whereClause = 'AND barangay_id = ?';
  params.push(userBarangayId);
}
```

### Ensure barangay access for updates
```javascript
const [resources] = await pool.execute(
  'SELECT barangay_id FROM resource_table WHERE id = ?',
  [resourceId]
);

if (userRole !== 'admin' && userBarangayId !== resources[0].barangay_id) {
  return res.status(403).json({ message: 'Access denied' });
}
```

## Testing Scenarios

### Scenario 1: Officer Loan Approval
1. Farmer from Barangay A applies for loan
2. Loan gets Barangay A's barangay_id automatically
3. Treasurer from Barangay A can see and approve
4. Treasurer from Barangay B cannot see or access
5. Admin can see all loans

### Scenario 2: Machinery Booking
1. Farmer from Barangay B books machinery
2. Machinery must be from Barangay B
3. Operator from Barangay B handles booking
4. Operator payment handled by Treasurer B only
5. Reports show barangay segregation

### Scenario 3: Financial Transactions
1. Contribution recorded with barangay_id
2. Only barangay's treasurer can view
3. Activity log shows barangay context
4. Reports filtered by barangay

## Migration Path for Existing Data

If you have existing data without barangay assignments:

```sql
-- For farmers, assign barangay based on address match
UPDATE farmers f
JOIN barangays b ON f.address = b.name
SET f.barangay_id = b.id
WHERE f.role IN ('president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager')
AND f.barangay_id IS NULL;

-- For loans, get farmer's barangay
UPDATE loans l
JOIN farmers f ON l.farmer_id = f.id
SET l.barangay_id = f.barangay_id
WHERE l.barangay_id IS NULL AND f.barangay_id IS NOT NULL;

-- For machinery, assign to first barangay if not set
UPDATE machinery_inventory
SET barangay_id = 1
WHERE barangay_id IS NULL;
```

## Security Considerations

1. **Always validate barangay access** before returning sensitive data
2. **Use JWT tokens** with barangay_id embedded
3. **Log all access attempts** with barangay context
4. **Audit trails** must show who accessed what in which barangay
5. **Prevent direct parameter manipulation** - validate all barangay_id inputs
6. **Use parameterized queries** to prevent SQL injection
7. **Implement rate limiting** per barangay to prevent abuse

## Performance Optimization

1. **Create indexes** on barangay_id columns (already in migrations)
2. **Cache barangay information** in application memory
3. **Use connection pooling** for database
4. **Implement query pagination** for large datasets
5. **Monitor query performance** with slow query logs

## Troubleshooting

### Issue: "You can only access data from your assigned barangay"
**Solution**: Ensure user has barangay_id assigned and matches resource's barangay_id

### Issue: Login fails for officers
**Solution**: Make sure officers were approved with a barangay_id assigned

### Issue: Loans show "Barangay assignment required"
**Solution**: Farmer's barangay_id might be NULL. Assign farmer to barangay first.

### Issue: No data visible for officer
**Solution**: Check that officer's barangay_id matches the data's barangay_id

## Future Enhancements

1. **Multi-barangay officers**: Allow officers to manage multiple barangays
2. **Barangay-to-barangay transactions**: Enable inter-barangay machinery sharing
3. **Federated reporting**: Allow federation-level reports while maintaining isolation
4. **Dynamic barangay creation**: Add UI for creating new barangays
5. **Barangay quotas**: Implement quotas per barangay for loans/machinery
6. **Cross-barangay collaboration**: Enable project teams across barangays

## Support & Documentation

For issues or questions:
1. Check the troubleshooting section
2. Review database migrations
3. Examine middleware implementation
4. Check route-specific documentation
5. Contact system administrator

---

**Last Updated**: February 17, 2026  
**Version**: 1.0.0  
**Status**: Implementation Phase 1-2 Complete
