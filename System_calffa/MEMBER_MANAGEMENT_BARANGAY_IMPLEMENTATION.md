# Barangay-Based Access Control for Member Management - Implementation Summary

## Overview
The Member Management approval system has been successfully modified to support barangay-based access control. Presidents can now approve members from their assigned barangay, while admins maintain full access across all barangays.

---

## Changes Made

### 1. Backend Updates (farmers.js)

#### GET /pending Endpoint
**Changes:**
- Added authentication check via JWT token
- Only Admin and President users can view pending members
- Presidents can only see pending members from their assigned barangay
- Admins see all pending members from all barangays

**Authorization Logic:**
```javascript
if (!canViewPending) {
  return res.status(403).json({ 
    message: 'Only Admins and Presidents can approve members.' 
  });
}

// If president, filter to own barangay
if (userRole === 'president' && userBarangayId) {
  query += ' AND barangay_id = ?';
  params.push(userBarangayId);
}
```

#### POST /:id/approve Endpoint
**Changes:**
- Verifies user is either Admin or President
- Admins can approve anyone from any barangay
- Presidents can only approve members from their assigned barangay
- Rejects with 403 error if president tries to approve from another barangay
- Activity logs now include which role approved the member

**Key Validation:**
```javascript
// Check barangay authorization for presidents
if (approverRole === 'president' && approverBarangayId !== targetBarangayId) {
  return res.status(403).json({ 
    message: `President can only approve members from barangay ${approverBarangayId}` 
  });
}
```

#### POST /:id/reject Endpoint
**Changes:**
- Added President authorization support (same as approve)
- Presidents can only reject members from their assigned barangay
- Activity logs include which role rejected the member

---

### 2. Frontend Updates (Vue Components)

#### Sidebar.vue
**Changes:**
- Added `isPresident` computed property
- Added `canManageMembers` computed property that includes Admin and President
- Created new "Member Management" section in sidebar
- Section only appears for users with Admin or President role
- Members link points to `/farmers-table`

**Code:**
```javascript
const canManageMembers = computed(() => {
  const role = currentUser.value?.role;
  return ['admin', 'president'].includes(role);
});
```

#### FarmerTablePage.vue
**Changes:**
- Added authorization check on component mount
- Only Admin and President users can access the page
- Presidents see only members from their barangay
- Admins see all members
- Added JWT token to all API requests
- Proper error handling for 403 Forbidden responses

**Key Features:**
- `isAuthorized` computed property checks for admin/president roles
- `userBarangayId` extracts barangay from current user
- `loadFarmers()` filters data based on user role and barangay

**Authorization Check:**
```javascript
onMounted(() => {
  if (!isAuthorized.value) {
    alert('You do not have permission to access Member Management.')
    router.push('/dashboard')
    return
  }
  loadFarmers()
})
```

#### PendingFarmersTab.vue
**Changes:**
- Added barangay column to the table (No Address column needed)
- Updated table headers to show: Reference #, Name, DOB, Phone, Role, Barangay, Date, Actions
- Barangay displays member's assigned barangay (or "Not assigned" if null)
- Added authStore import for token management
- All API calls include Authorization header with JWT token

**Table Structure:**
```
| Reference Number | Full Name | Date of Birth | Phone Number | Role | Barangay | Registered Date | Actions |
```

#### authStore.js
**Changes:**
- Login response now stores barangay context
- `barangay_id`, `barangay_name`, and `barangay_location` are stored in the user object
- Enables frontend to use barangay info for filtering and display

**Storage:**
```javascript
if (data.barangay) {
  user.barangay_id = data.barangay.id
  user.barangay_name = data.barangay.name
  user.barangay_location = data.barangay.location
}
```

---

## User Flows

### Admin Approval Flow
1. Admin logs in
2. Member Management menu appears in sidebar
3. Admin clicks "Members"
4. Page loads showing all pending members from all barangays
5. Admin can:
   - View all pending members
   - Change roles
   - Approve/reject/delete members
   - Assign barangay during approval
6. All actions succeed regardless of barangay

### President Approval Flow
1. President logs in
2. Member Management menu appears in sidebar
3. President clicks "Members"
4. Page loads showing pending members only from their barangay
5. President can:
   - View pending members from their barangay only
   - Change roles
   - Approve/reject/delete members from their barangay
6. Backend prevents any cross-barangay actions (403 error)

### Farmer/Officer Flow
1. Non-admin/non-president user logs in
2. Member Management menu does NOT appear
3. If they try to access `/farmers-table` directly:
   - Alert shows: "You do not have permission to access Member Management"
   - Redirected to dashboard

---

## Security Implementation

### Backend Security (farmers.js)
✅ **JWT Token Verification**
- Every approval/rejection request requires a valid JWT token
- Token is verified and user context extracted
- Barangay_id comes from token and database (not client)

✅ **Role-Based Authorization**
- Only users with admin or president roles can approve
- Farmer roles cannot access approval endpoints

✅ **Barangay-Based Filtering**
- Presidents filtered at database query level (SQL WHERE clause)
- No client-side filtering - backend enforces isolation
- All activity logs include barangay context

✅ **Activity Logging**
- All approvals/rejections logged with barangay context
- Includes which role performed the action
- Timestamp and user information recorded

### Frontend Security (Vue)
✅ **Authorization Checks**
- Component mount verifies user role
- Sidebar menu items hidden for unauthorized users
- Token sent in Authorization header for all requests

✅ **Error Handling**
- 403 Forbidden responses properly handled
- User-friendly error messages shown
- No sensitive data exposed

---

## Data Isolation

### Pending Members Endpoint
- **Admin**: Sees all pending members from all barangays
- **President**: Sees only pending members from their assigned barangay
- **Query Filter**: `WHERE status = 'pending' AND barangay_id = ?`

### Approval/Rejection Endpoints
- **Admin**: Can approve/reject anyone from any barangay
- **President**: Can only approve/reject from their barangay
- **Cross-Barangay Protection**: President attempting cross-barangay action gets 403 error

### Activity Logs
- All actions include barangay_id for audit trail
- Presidents can be identified by who approved each member

---

## Barangay Information Displayed

### In PendingFarmersTab
The table now shows a "Barangay" column that displays:
- Barangay ID if assigned
- "Not assigned" if barangay_id is NULL

### In authStore
User context includes:
- `barangay_id`: Numeric ID of assigned barangay
- `barangay_name`: Human-readable name
- `barangay_location`: Location description

---

## Frontend URL Structure

After authentication:
- **Admin**: Can navigate to `/farmers-table` → sees all members
- **President**: Can navigate to `/farmers-table` → sees members from their barangay
- **Other roles**: Redirected to `/dashboard` if accessing `/farmers-table`

---

## API Changes

### GET /api/farmers/pending
**Before:**
```
No authentication - returns all pending members
```

**After:**
```
Requires JWT token in Authorization header
Admin: Returns all pending members
President: Returns pending members from their barangay
Others: Returns 403 Forbidden
```

### POST /api/farmers/:id/approve
**Before:**
```
No role verification - access check missing
```

**After:**
```
Requires JWT token
Admin: Can approve anyone
President: Can approve only from same barangay
Others: Returns 403 Forbidden with descriptive message
```

### POST /api/farmers/:id/reject
**Before:**
```
No role verification
```

**After:**
```
Requires JWT token
Admin: Can reject anyone
President: Can reject only from same barangay
Others: Returns 403 Forbidden
```

---

## Testing the Implementation

### Test Case 1: Admin Approval
1. Login as admin
2. Click "Members" in sidebar
3. Should see all pending members from all barangays
4. Approve any member - should succeed

### Test Case 2: President Approval (Same Barangay)
1. Login as president from barangay 1
2. Click "Members" in sidebar
3. Should see only pending members from barangay 1
4. Approve a barangay 1 member - should succeed

### Test Case 3: President Cross-Barangay Attempt
1. Login as president from barangay 1
2. User attempts to approve member from barangay 2
3. Should get error: "President can only approve members from barangay 1"

### Test Case 4: Farmer Access Attempt
1. Login as farmer
2. Member Management menu does NOT appear
3. Manually navigate to `/farmers-table`
4. Should be redirected to dashboard with permission error

---

## Error Messages

### 403 Forbidden (Admin/President Check)
```
"You do not have permission to view members. Only Admins and Presidents 
can approve members."
```

### 403 Forbidden (Cross-Barangay)
```
"President can only approve members from barangay ${barangayId}. 
This member belongs to barangay ${differentBarangayId}."
```

### 403 Forbidden (Permission Denied)
```
"You do not have permission to approve members. Only Admins and Presidents 
can approve accounts."
```

---

## Files Modified

### Backend
- `backend/routes/farmers.js`
  - GET /pending - Added barangay filtering
  - POST /:id/approve - Added president authorization
  - POST /:id/reject - Added president authorization

### Frontend
- `farmer-registration/src/components/Sidebar.vue` - Added Member Management section
- `farmer-registration/src/views/FarmerTablePage.vue` - Added authorization and barangay filtering
- `farmer-registration/src/components/PendingFarmersTab.vue` - Added barangay column
- `farmer-registration/src/stores/authStore.js` - Store barangay context from login

---

## Verification Checklist

- ✅ Presidents can see Member Management menu
- ✅ Farmers cannot see Member Management menu  
- ✅ Presidents only see members from their barangay
- ✅ Admins see all members from all barangays
- ✅ Presidents can approve members from their barangay
- ✅ Presidents get 403 error trying to approve from another barangay
- ✅ Admins can approve anyone
- ✅ Barangay column appears in pending members table
- ✅ Activity logs record which role approved/rejected
- ✅ JWT token required for all approval actions
- ✅ Unauthorized users redirected from `/farmers-table`

---

## Next Steps (Future Enhancements)

1. **Barangay Selector for Presidents**
   - Allow presidents to filter by barangay when viewing members

2. **Bulk Approval by Barangay**
   - Show approve all for just the president's barangay

3. **Barangay Statistics**
   - Show count of pending/approved/rejected per barangay

4. **Notification System**
   - Notify president when new pending members join their barangay

5. **Enhanced Audit Trail**
   - Show which president approved which members
   - Generate reports per barangay

---

## Summary

The Member Management approval system now fully supports barangay-based access control with:
- **Role-based access**: Only Admin and President can approve
- **Barangay isolation**: Presidents limited to their barangay
- **Secure implementation**: Token validation and backend filtering
- **Clear UI**: Sidebar menu, authorization checks, error handling
- **Audit trail**: Activity logs with barangay context

Presidents can effectively manage member approvals within their assigned barangay while maintaining data isolation from other barangays.
