# Member Management - Barangay-Based Access Control Quick Guide

## What Changed?

The Member Management approval system now restricts member approvals by barangay. **Presidents can only approve members from their assigned barangay**, while **Admins can approve members from any barangay**.

---

## User Experience

### For Admins
✅ Everything works as before
- Can see all pending members from all barangays
- Can approve/reject/delete any member
- Can change anyone's role or assign barangay
- Full unrestricted access

### For Presidents
✅ New capability to manage their barangay
- Can see "Members" in the sidebar menu
- Can only view pending members from their barangay
- Can approve/reject members from their barangay
- Cannot see or interact with other barangays
- Get error message if trying to approve from another barangay (403 Forbidden)

### For Farmers
❌ No change (still cannot access Member Management)
- Member Management menu does not appear
- If they manually navigate to `/farmers-table`, they're redirected with error message

---

## How to Test

### Scenario 1: Admin User
```
1. Login as admin
2. Go to dashboard
3. Look in sidebar → see "Member Management" section
4. Click "Members"
5. See all pending members from all barangays
6. Click "Approve" on any member
7. Member approved successfully ✅
```

### Scenario 2: President User (Barangay 1)
```
1. Login as president from barangay 1
2. Go to dashboard
3. Look in sidebar → see "Member Management" section
4. Click "Members"
5. See ONLY pending members from barangay 1
6. Click "Approve" on a barangay 1 member
7. Member approved successfully ✅
8. Try to approve a member from barangay 2
9. Get error: "President can only approve members from barangay 1" ❌
```

### Scenario 3: Farmer User
```
1. Login as farmer
2. Go to dashboard
3. Look in sidebar → NO "Member Management" section
4. Try to manually visit /farmers-table
5. Get alert: "You do not have permission to access Member Management"
6. Redirected to dashboard ❌
```

---

## Key Features

### 1. Sidebar Menu Visibility
- **Shows for**: Admin, President
- **Hides for**: Farmer, Treasurer, Auditor, Operator, etc.

### 2. Data Filtering
```
Admin sees:     All pending members from all barangays
President sees: Pending members from their barangay ONLY
```

### 3. Barangay Information
The "Pending Approval" table now shows:
| Column | Shows |
|--------|-------|
| Barangay | Member's assigned barangay (or "Not assigned") |

### 4. Error Handling
- **Attempt to view page without permission**: Redirected to dashboard
- **Attempt to approve cross-barangay**: 403 Forbidden error
- **Attempt to reject cross-barangay**: 403 Forbidden error

---

## API Behind the Scenes

### Login Response
```json
{
  "success": true,
  "farmer": {
    "id": 123,
    "reference_number": "REF001",
    "full_name": "John President",
    "role": "president",
    "barangay_id": 1,
    "status": "approved"
  },
  "barangay": {
    "id": 1,
    "name": "Camansihan",
    "location": "South District"
  },
  "token": "eyJhbGc..."
}
```

### Getting Pending Members
**Admin request:**
```
GET /api/farmers/pending
Headers: Authorization: Bearer {token}
Response: All pending members from all barangays
```

**President request:**
```
GET /api/farmers/pending
Headers: Authorization: Bearer {token}
Response: Only pending members from their assigned barangay
```

### Approving a Member
**Admin request:**
```
POST /api/farmers/123/approve
Headers: Authorization: Bearer {token}
Body: { "role": "farmer", "barangay_id": 2 }
Response: ✅ Approved (can assign to any barangay)
```

**President request (same barangay):**
```
POST /api/farmers/456/approve
Headers: Authorization: Bearer {token}
Body: { "role": "farmer" }
Response: ✅ Approved if member.barangay_id === president.barangay_id
```

**President request (different barangay):**
```
POST /api/farmers/789/approve
Headers: Authorization: Bearer {token}
Body: { "role": "farmer" }
Response: ❌ 403 Forbidden
Message: "President can only approve members from barangay 1"
```

---

## Troubleshooting

### Problem: President doesn't see "Members" in sidebar

**Solution**: 
- Verify user role in database is exactly "president"
- Check browser localStorage → currentUser → role should be "president"
- Clear cache and reload page
- Re-login

### Problem: President sees members from other barangays

**Solution**:
- Backend filtering is case-sensitive on barangay_id
- Verify barangay_id is a number, not a string
- Check database: president's barangay_id must match member's barangay_id

### Problem: Getting 403 Forbidden when trying to approve

**Solution**:
- Verify president's barangay_id matches the member's barangay_id
- Check JWT token is still valid (not expired)
- Try logging out and logging back in
- Check browser console for exact error message

### Problem: "You do not have permission to access Member Management" error

**Solution**:
- Only Admin and President can access
- Verify your current login role
- Try accessing as admin or president instead

---

## Database Check

### Verify President Setup
```sql
-- Check president exists with barangay assignment
SELECT id, reference_number, full_name, role, barangay_id, status 
FROM farmers 
WHERE role = 'president' AND status = 'approved';

-- Should show barangay_id != NULL for president
```

### Verify Member Assignment
```sql
-- Check pending member's barangay
SELECT id, reference_number, full_name, barangay_id, status
FROM farmers
WHERE status = 'pending';

-- All should have barangay_id assigned
```

### Check Activity Logs
```sql
-- View approval history with barangay context
SELECT farmer_id, barangay_id, activity_type, activity_description, created_at
FROM activity_logs
WHERE activity_type = 'membership_change'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Roles & Permissions Matrix

| Role | View Members | Approve/Reject | Restrictions |
|------|-------------|-----------------|-------------|
| Admin | ✅ All | ✅ Any | None - unrestricted |
| President | ✅ Own barangay | ✅ Own barangay | Can't see other barangays |
| Treasurer | ❌ No | ❌ No | No access |
| Farmer | ❌ No | ❌ No | No access |
| Others | ❌ No | ❌ No | No access |

---

## What Data Is Visible?

### To Admin
- All members from all barangays
- Barangay assignment for each member
- Full member details (phone, address, DOB)
- Status (pending, approved, rejected)

### To President
- Members from their barangay only
- Cannot see members from other barangays
- Barangay assignment (always their own)
- Full member details
- Status (pending, approved, rejected)

### To Others
- No access to Member Management at all
- Cannot see any pending members
- Cannot approve anyone

---

## Mobile/Responsive

The Member Management interface is fully responsive:
- ✅ Works on desktop
- ✅ Works on tablet (sidebar becomes collapsible)
- ✅ Works on mobile (sidebar collapses by default)
- ✅ All buttons functional on touch devices

---

## Performance

- **Large barangays**: Should load quickly (SQL filtered at database level)
- **Multiple barangays**: President only sees their data (efficient)
- **Activity logs**: Include barangay_id for fast filtering

---

## Security Notes

🔒 **Backend enforces all access control**:
- Frontend checks are UI convenience only
- Backend verifies every request
- Token validation is mandatory
- Barangay filtering happens at SQL query level
- Cannot be bypassed by client-side changes

---

## Support & References

- Implementation details: [MEMBER_MANAGEMENT_BARANGAY_IMPLEMENTATION.md](MEMBER_MANAGEMENT_BARANGAY_IMPLEMENTATION.md)
- Backend code: `/backend/routes/farmers.js`
- Frontend components:
  - Sidebar: `/farmer-registration/src/components/Sidebar.vue`
  - Page: `/farmer-registration/src/views/FarmerTablePage.vue`
  - Table: `/farmer-registration/src/components/PendingFarmersTab.vue`
  - Auth: `/farmer-registration/src/stores/authStore.js`

---

## Summary

✅ **Presidents now have Member Management access** - Can approve members from their barangay
✅ **Admins maintain full access** - Can approve members from any barangay  
✅ **Secure implementation** - Backend enforces all restrictions  
✅ **Clear error messages** - Users understand why actions failed  
✅ **Audit trail** - All approvals logged with barangay context
