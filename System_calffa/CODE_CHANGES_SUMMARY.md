# Code Changes Summary - Member Management Barangay Integration

## Overview of Changes

This document provides a summary of all code modifications made to implement barangay-based access control for the Member Management approval system.

---

## File 1: backend/routes/farmers.js

### Change 1: GET /pending - Added Barangay Filtering

**Location**: Lines 209-257 (Updated)

**What Changed**:
- Added JWT token verification
- Added role-based authorization (admin/president only)
- Presidents see only pending members from their barangay
- Admins see all pending members

**Key Code Addition**:
```javascript
// Extract token and verify user authorization
const token = req.headers.authorization?.split(' ')[1];
let userBarangayId = null;
let userRole = 'guest';
let canViewPending = false;

if (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    userBarangayId = decoded.barangay_id;

    // Get full user info
    const [users] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
    if (users.length > 0) {
      userRole = users[0].role;
      userBarangayId = users[0].barangay_id;
      
      // Allow admin (full access) or president (own barangay only)
      canViewPending = userRole === 'admin' || userRole === 'president';
    }
  } catch (err) {
    canViewPending = false;
  }
}

// Only admin or president can view pending members
if (!canViewPending) {
  return res.status(403).json({ 
    success: false, 
    message: 'You do not have permission to view pending members. Only Admins and Presidents can approve members.' 
  });
}

// If president, filter to own barangay only
if (userRole === 'president' && userBarangayId) {
  query += ' AND barangay_id = ?';
  params.push(userBarangayId);
}
```

---

### Change 2: POST /:id/approve - Added President Authorization

**Location**: Lines 363-520 (Updated)

**What Changed**:
- Added JWT token verification
- Admins can approve anyone from any barangay
- Presidents can only approve from their barangay
- Clear error messages for cross-barangay attempts
- Activity logs show which role approved

**Key Code Addition**:
```javascript
// APPROVE FARMER (ADMIN or PRESIDENT)
// Admins can approve anyone from any barangay
// Presidents can only approve members from their assigned barangay

// Extract token and verify authorization
const token = req.headers.authorization?.split(' ')[1];
let approverRole = 'guest';
let approverBarangayId = null;
let canApprove = false;

if (token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const [approvers] = await pool.execute('SELECT role, barangay_id FROM farmers WHERE id = ?', [decoded.id]);
    
    if (approvers.length > 0) {
      approverRole = approvers[0].role;
      approverBarangayId = approvers[0].barangay_id;
      canApprove = approverRole === 'admin' || approverRole === 'president';
    }
  } catch (err) {
    canApprove = false;
  }
}

// Only admin or president can approve
if (!canApprove) {
  return res.status(403).json({ 
    success: false, 
    message: 'You do not have permission to approve members. Only Admins and Presidents can approve accounts.' 
  });
}

// Check barangay authorization for presidents
const targetBarangayId = req.body.barangay_id || farmer[0].barangay_id;
if (approverRole === 'president' && approverBarangayId !== targetBarangayId) {
  return res.status(403).json({ 
    success: false, 
    message: `President can only approve members from barangay ${approverBarangayId}. This member belongs to barangay ${targetBarangayId}.` 
  });
}

// Activity log includes who approved
[farmerId, targetBarangayId, `${farmer[0].full_name} account approved by ${approverRole}`, ...]
```

---

### Change 3: POST /:id/reject - Added President Authorization

**Location**: Lines 528-601 (Updated)

**What Changed**:
- Same as approve but for rejection
- Admins can reject anyone
- Presidents can only reject from their barangay
- Clear error messages
- Activity logs include which role rejected

**Key Code Pattern** (same as approve):
```javascript
// Extract token and verify authorization
// Check if user is admin or president
// For presidents, verify same barangay
// Log activity with role information
```

---

## File 2: farmer-registration/src/components/Sidebar.vue

### Change 1: Added Computed Properties

**Location**: Lines 156-177 (Updated)

**What Changed**:
```javascript
// Added:
const isPresident = computed(() => currentUser.value?.role === 'president');

// Updated existing:
const canManageMembers = computed(() => {
  // Admin and President can manage members
  const role = currentUser.value?.role;
  return ['admin', 'president'].includes(role);
});
```

### Change 2: Added Member Management Section

**Location**: After Community Section (Added)

**What Changed**:
```vue
<!-- Member Management Section (Admin and President only) -->
<div class="nav-section" v-if="canManageMembers">
  <div class="section-header">
    <span class="section-icon">👥</span>
    <span class="section-title">Member Management</span>
  </div>
  <ul class="nav-list">
    <li
      :class="{ active: isActiveRoute('/farmers-table') }"
      @click="handleMenuClick({ text: 'Members', route: '/farmers-table' })"
    >
      <router-link class="nav-link" to="/farmers-table" aria-label="Members">
        <span class="icon">👥</span>
        <span class="text">Members</span>
        <span class="leaf-accent">🌿</span>
      </router-link>
    </li>
  </ul>
</div>
```

---

## File 3: farmer-registration/src/views/FarmerTablePage.vue

### Change 1: Added Authorization Computed Properties

**Location**: Lines 127-155 (Updated)

**What Changed**:
```javascript
const isAuthorized = computed(() => {
  const user = authStore.currentUser
  return user && ['admin', 'president'].includes(user.role)
})

const userBarangayId = computed(() => {
  return authStore.currentUser?.barangay_id
})

const isAdmin = computed(() => {
  return authStore.currentUser?.role === 'admin'
})

const isPresident = computed(() => {
  return authStore.currentUser?.role === 'president'
})
```

### Change 2: Updated loadFarmers() Function

**Location**: Lines 166-206 (Updated - was 147-166)

**What Changed**:
```javascript
const loadFarmers = async () => {
  loading.value = true
  error.value = null
  try {
    const token = authStore.token
    const response = await fetch('/api/farmers/pending', {  // Changed from '/api/farmers'
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''  // Added token
      }
    })
    if (response.ok) {
      const data = await response.json()
      if (isAdmin.value) {
        // Admin can see all farmers
        allFarmers.value = data.farmers || data || []
      } else if (isPresident.value && userBarangayId.value) {
        // President only sees farmers from their barangay
        const farmersByBarangay = (data.farmers || data || []).filter(
          f => f.barangay_id === userBarangayId.value
        )
        allFarmers.value = farmersByBarangay
      } else {
        error.value = 'Insufficient permissions to view members'
        allFarmers.value = []
      }
    } else if (response.status === 403) {
      error.value = 'You do not have permission to view members. Only Admins and Presidents can access this page.'
      allFarmers.value = []
    } else {
      error.value = 'Failed to load farmers'
    }
  } catch (err) {
    console.error('Error loading farmers:', err)
    error.value = err.message || 'Failed to load farmers'
  } finally {
    loading.value = false
  }
}
```

### Change 3: Updated handleApprove() Function

**Location**: Lines 208-225 (Updated)

**What Changed**:
```javascript
const handleApprove = async (farmerId) => {
  try {
    const token = authStore.token  // Added
    const response = await fetch(`/api/farmers/${farmerId}/approve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''  // Added token
      }
    })
    const data = await response.json()  // Added
    if (response.ok) {
      await loadFarmers()
      alert('Farmer approved successfully!')
    } else {
      alert('Failed to approve farmer: ' + (data.message || 'Unknown error'))  // Better error
    }
  } catch (err) {
    alert('Error approving farmer: ' + err.message)
  }
}
```

### Change 4: Updated handleReject() Function

**Location**: Lines 227-245 (Updated)

**What Changed**:
```javascript
const handleReject = async (farmerId) => {
  try {
    const token = authStore.token  // Added
    const response = await fetch(`/api/farmers/${farmerId}/reject`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''  // Added token
      }
    })
    const data = await response.json()  // Added
    if (response.ok) {
      await loadFarmers()
      alert('Farmer rejected successfully!')
    } else {
      alert('Failed to reject farmer: ' + (data.message || 'Unknown error'))  // Better error
    }
  } catch (err) {
    alert('Error rejecting farmer: ' + err.message)
  }
}
```

### Change 5: Updated onMounted() Hook

**Location**: Lines 279-291 (Updated)

**What Changed**:
```javascript
onMounted(() => {
  if (!authStore.currentUser) {
    router.push('/login')
    return
  }
  // Check authorization
  if (!isAuthorized.value) {  // Added authorization check
    alert('You do not have permission to access Member Management. Only Admins and Presidents can approve members.')
    router.push('/dashboard')
    return
  }
  loadFarmers()
})
```

---

## File 4: farmer-registration/src/components/PendingFarmersTab.vue

### Change 1: Updated Script Imports

**Location**: Lines 129-131 (Updated)

**What Changed**:
```javascript
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/authStore'  // Added

// ...
const authStore = useAuthStore()  // Added
```

### Change 2: Updated Table Headers

**Location**: Lines 54-62 (Updated)

**What Changed**:
```vue
<!-- Before: 8 columns -->
<tr>
  <th>Reference Number</th>
  <th>Full Name</th>
  <th>Date of Birth</th>
  <th>Address</th>           <!-- Removed -->
  <th>Phone Number</th>
  <th>Role</th>
  <th>Registered Date</th>
  <th>Actions</th>
</tr>

<!-- After: 8 columns (Address replaced with Barangay) -->
<tr>
  <th>Reference Number</th>
  <th>Full Name</th>
  <th>Date of Birth</th>
  <th>Phone Number</th>
  <th>Role</th>
  <th>Barangay</th>          <!-- Added -->
  <th>Registered Date</th>
  <th>Actions</th>
</tr>
```

### Change 3: Updated Table Row

**Location**: Lines 70-74 (Updated)

**What Changed**:
```vue
<!-- Before -->
<td>{{ member.date_of_birth }}</td>
<td>{{ member.address }}</td>           <!-- Removed -->
<td>{{ member.phone_number }}</td>

<!-- After -->
<td>{{ member.date_of_birth }}</td>
<td>{{ member.phone_number }}</td>
<td>
  <!-- After role select -->
</td>
<td>{{ member.barangay_id || 'Not assigned' }}</td>  <!-- Added -->
<td>{{ formatDate(member.registered_on) }}</td>
```

---

## File 5: farmer-registration/src/stores/authStore.js

### Change 1: Updated Login Response Handling

**Location**: Lines 45-56 (Updated)

**What Changed**:
```javascript
// Store user data (without password)
const user = { ...data.farmer }

// Added barangay context storage:
if (data.barangay) {
  user.barangay_id = data.barangay.id
  user.barangay_name = data.barangay.name
  user.barangay_location = data.barangay.location
}

// Keep status and is_approved flags
delete user.password_hash
this.currentUser = user
this.token = data.token
localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
localStorage.setItem('token', data.token)
```

---

## Summary of Changes

### Backend (1 file modified)
- **farmers.js**: 3 major updates to GET /pending, POST /approve, POST /reject
  - Added JWT verification
  - Added role-based authorization
  - Added barangay filtering for presidents
  - Total: ~80 lines of new authorization code

### Frontend (4 files modified)
- **Sidebar.vue**: Added Member Management section for admin/president
- **FarmerTablePage.vue**: Added authorization checks, barangay filtering, JWT tokens
- **PendingFarmersTab.vue**: Added barangay column to table, added authStore import
- **authStore.js**: Store barangay context from login response

### Total Changes
- Lines modified: ~150
- New files created: 2 documentation files
- Files modified: 5 (1 backend, 4 frontend)

---

## Testing Checkpoints

When implementing these changes, verify:

1. ✅ Backend GET /pending returns only president's barangay
2. ✅ Backend POST /approve blocks cross-barangay attempts  
3. ✅ Frontend Sidebar shows Member Management for admin/president
4. ✅ Frontend FarmerTablePage loads with JWT authorization
5. ✅ Frontend PendingFarmersTab displays barangay column
6. ✅ Frontend authStore stores barangay context
7. ✅ Error messages show for unauthorized access
8. ✅ Presidents see only their barangay's members
9. ✅ Admins see all members
10. ✅ Activity logs include barangay context

---

## Rollback Reference

If you need to revert changes:

### Revert backend/routes/farmers.js
1. Restore GET /pending to simple query (no auth check)
2. Restore POST /:id/approve to admin-only check
3. Restore POST /:id/reject to admin-only check

### Revert Sidebar.vue
1. Remove isPresident computed property
2. Remove canManageMembers computed property
3. Remove Member Management nav section

### Revert FarmerTablePage.vue
1. Remove isAuthorized, userBarangayId, isAdmin, isPresident computed properties
2. Restore loadFarmers to simple fetch without token
3. Remove JWT token from handleApprove/handleReject
4. Remove authorization check from onMounted

### Revert PendingFarmersTab.vue
1. Remove authStore import
2. Restore table headers (remove Barangay, re-add Address)
3. Remove table data row for barangay

### Revert authStore.js
1. Remove barangay context storage from login response

---

## Documentation Files Created

1. **MEMBER_MANAGEMENT_BARANGAY_IMPLEMENTATION.md** - Comprehensive implementation guide
2. **MEMBER_MANAGEMENT_QUICK_GUIDE.md** - User-friendly quick reference

Both files available in `/Registration/` directory.
