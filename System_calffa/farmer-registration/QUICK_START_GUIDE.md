# 🚀 Quick Start Guide - Consolidated Dashboard

## For Developers

### What Changed?
The system now has a **single unified dashboard** for both admin and regular users, with real data and Chart.js visualizations. The old separate dashboards (AdminDashboard, AdminDashboardResponsive, FarmerDashboard) have been replaced with one consolidated view.

---

## File Changes Summary

### ✅ Modified Files:
1. **src/views/AdminDashboard.vue** - Completely rewritten with real data and charts
2. **src/views/FarmerTablePage.vue** - Added tabs for pending/registered members
3. **src/router/index.js** - Unified routing, removed old dashboard routes
4. **src/components/Sidebar.vue** - Removed redundant "Admin Dashboard" item

### 📦 Backup Files:
- **src/views/AdminDashboard_OLD.vue** - Original AdminDashboard (can be deleted after testing)

### 🗑️ Deleted Files:
- **src/views/AdminDashboardResponsive.vue** - No longer needed
- **src/views/Welcome.vue** - No longer used
- **src/views/FarmerDashboard.vue** - No longer used

---

## How to Test

### 1. Start the Backend Server
```powershell
cd c:\xampp\htdocs\CALFFA\CALFFA\Registration\backend
npm start
```
Expected: Server running on http://localhost:5000

### 2. Start the Frontend Dev Server
```powershell
cd c:\xampp\htdocs\CALFFA\CALFFA\Registration\farmer-registration
npm run dev
```
Expected: Vite dev server running on http://localhost:5173

### 3. Test Regular User Flow
1. Open http://localhost:5173
2. Login as a regular farmer (not admin)
3. Should redirect to `/dashboard`
4. Verify:
   - ✅ 6 stat cards visible
   - ✅ 4 charts rendered
   - ✅ Quick Actions show (no admin-only items)
   - ✅ Sidebar shows limited navigation
   - ✅ Can click "View Members" to see all farmers

### 4. Test Admin User Flow
1. Login as admin user
2. Should redirect to `/dashboard`
3. Verify:
   - ✅ Same 6 stat cards
   - ✅ Same 4 charts
   - ✅ Quick Actions include admin items (Seed Distribution, Financial Overview)
   - ✅ Sidebar shows admin section
   - ✅ Can click "Members" to manage farmers
   - ✅ Pending Approval tab shows action buttons (Approve/Reject/Delete)
   - ✅ Cannot delete admin accounts

### 5. Test Data Integration
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh dashboard
4. Verify API calls:
   - ✅ `GET /api/farmers` returns real data
   - ✅ `GET /api/inventory` returns real data (or fails gracefully)
5. Check Console for errors (should be none)

### 6. Test Responsive Design
1. Open browser DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Test different screen sizes:
   - Desktop (1920x1080): 3-column stats, 2-column charts
   - Tablet (768x1024): 3-column stats, 1-column charts
   - Mobile (375x667): 2-column stats, 1-column charts
4. Verify charts remain readable on all sizes

---

## Common Issues & Solutions

### Issue 1: Charts Not Rendering
**Symptoms:** Blank spaces where charts should be

**Solution:**
```javascript
// Check if Chart.js is imported correctly
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// Check if canvas refs are properly bound
<canvas ref="statusChartRef"></canvas>

// Check if renderCharts() is called after data loads
onMounted(async () => {
  await loadAllFarmers()
  await nextTick()
  renderCharts()
})
```

### Issue 2: "Cannot read property 'length' of undefined"
**Symptoms:** Error in computed properties

**Solution:**
```javascript
// Always initialize arrays
const allFarmers = ref([])
const inventoryItems = ref([])

// Use optional chaining
const totalFarmers = computed(() => allFarmers.value?.length || 0)
```

### Issue 3: API Call Fails (404 or 500)
**Symptoms:** No data displays, console errors

**Solution:**
1. Check backend is running: http://localhost:5000/api/farmers
2. Check database connection in `backend/db.js`
3. Check CORS settings in `backend/server.js`
4. Add error handling:
```javascript
try {
  const response = await fetch('/api/farmers')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  allFarmers.value = data.farmers || data || []
} catch (err) {
  console.error('Error loading farmers:', err)
  // Show user-friendly error message
}
```

### Issue 4: Redirect Loop
**Symptoms:** Page keeps refreshing, never loads dashboard

**Solution:**
Check router navigation guard in `router/index.js`:
```javascript
// Make sure this is correct
if (to.meta.requiresGuest && isLoggedIn) {
  next('/dashboard')  // NOT next('/login')
  return
}
```

### Issue 5: Admin Can't See Admin Features
**Symptoms:** Admin sees same view as regular users

**Solution:**
Check authStore:
```javascript
// In AdminDashboard.vue
const isAdmin = computed(() => authStore.currentUser?.role === 'admin')

// Verify currentUser has correct role
console.log('Current user:', authStore.currentUser)
console.log('User role:', authStore.currentUser?.role)
```

---

## API Endpoints Reference

### All endpoints use this base URL:
```
http://localhost:5000/api
```

### Farmers:
```javascript
// Get all farmers
GET /api/farmers
Response: { farmers: [...] }

// Get pending farmers only
GET /api/farmers/pending
Response: { farmers: [...] }

// Approve farmer
POST /api/farmers/:id/approve
Response: { success: true, message: '...' }

// Reject farmer
POST /api/farmers/:id/reject
Response: { success: true, message: '...' }

// Delete farmer (admin only)
DELETE /api/farmers/:id
Response: { success: true, message: '...' }

// Update profile
PUT /api/farmers/:id/profile
Body: { full_name, address, phone_number }
Response: { success: true, message: '...' }
```

### Inventory:
```javascript
// Get all inventory items
GET /api/inventory
Response: { items: [...] }

// Note: If this endpoint doesn't exist yet, dashboard will use mock data
```

---

## Data Structure Reference

### Farmer Object:
```javascript
{
  id: 1,
  reference_number: "REF001",
  full_name: "Juan Dela Cruz",
  date_of_birth: "1990-01-15",
  address: "Balingayan",
  phone_number: "09123456789",
  role: "farmer" | "admin",
  status: "pending" | "approved" | "rejected",
  registered_on: "2024-01-01T00:00:00.000Z"
}
```

### Inventory Item Object:
```javascript
{
  id: 1,
  name: "Rice Seeds",
  quantity: 500,
  unit: "kg",
  last_updated: "2024-01-01T00:00:00.000Z"
}
```

---

## Chart Configuration Reference

### Members by Status (Doughnut Chart):
```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [120, 5, 2],
      backgroundColor: ['#10B981', '#FBBF24', '#EF4444']
    }]
  }
}
```

### Top Barangays (Bar Chart):
```javascript
{
  type: 'bar',
  data: {
    labels: ['Balingayan', 'Balite', 'Baruyan', ...],
    datasets: [{
      data: [15, 12, 10, ...],
      backgroundColor: '#7C3AED'
    }]
  }
}
```

---

## Performance Tips

### 1. Lazy Load Routes
```javascript
// ✅ Good - Lazy loading
{ path: 'inventory', component: () => import('../views/InventoryPage.vue') }

// ❌ Bad - Eager loading (increases initial bundle)
import InventoryPage from '../views/InventoryPage.vue'
{ path: 'inventory', component: InventoryPage }
```

### 2. Debounce API Calls
```javascript
import { debounce } from 'lodash-es'

const debouncedSearch = debounce(async (query) => {
  const response = await fetch(`/api/farmers?search=${query}`)
  // ...
}, 300)
```

### 3. Cache Chart Instances
```javascript
// Destroy old chart before creating new one
if (statusChart) statusChart.destroy()
statusChart = new Chart(ctx, config)
```

### 4. Use Computed Properties
```javascript
// ✅ Good - Cached
const totalFarmers = computed(() => allFarmers.value.length)

// ❌ Bad - Recalculates every render
const getTotalFarmers = () => allFarmers.value.length
```

---

## Deployment Checklist

### Before Deploying:
- [ ] All tests pass (no console errors)
- [ ] Charts render correctly
- [ ] API endpoints return real data
- [ ] Mobile responsive design works
- [ ] Admin features only visible to admins
- [ ] Delete protection works for admin accounts
- [ ] All routes redirect correctly
- [ ] Logout works properly
- [ ] Settings page saves correctly

### Environment Variables:
```env
# Backend (.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=calffa_db
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000
```

### Build Commands:
```powershell
# Frontend
cd farmer-registration
npm run build

# Output: dist/ folder ready for deployment

# Backend (no build needed)
cd backend
npm start
```

---

## Rollback Instructions

If you need to revert to the old dashboard:

### Step 1: Restore Old AdminDashboard
```powershell
cd c:\xampp\htdocs\CALFFA\CALFFA\Registration\farmer-registration\src\views
Copy-Item AdminDashboard_OLD.vue AdminDashboard.vue -Force
```

### Step 2: Restore Old Router
Edit `src/router/index.js` and change:
```javascript
// FROM:
{ path: 'dashboard', component: AdminDashboard }

// TO:
{ path: 'admin', component: AdminDashboard, meta: { requiresAdmin: true } }
{ path: 'dashboard', component: FarmerDashboard }
{ path: 'admin-responsive', component: AdminDashboardResponsive, meta: { requiresAdmin: true } }
```

### Step 3: Restore Old Sidebar
Edit `src/components/Sidebar.vue` and add back:
```javascript
const adminItems = [
  { text: "Admin Dashboard", route: "/admin", icon: "👨‍💼" },
  // ... rest of items
]
```

### Step 4: Restart Dev Server
```powershell
npm run dev
```

---

## Support & Documentation

### Additional Resources:
- **Full Changes:** See `DASHBOARD_CONSOLIDATION_CHANGES.md`
- **Visual Guide:** See `DASHBOARD_VISUAL_REFERENCE.md`
- **Chart.js Docs:** https://www.chartjs.org/docs/latest/
- **Vue 3 Docs:** https://vuejs.org/guide/
- **Vue Router Docs:** https://router.vuejs.org/

### Need Help?
1. Check console for errors (F12)
2. Check network tab for failed API calls
3. Verify backend is running (`GET http://localhost:5000/api/farmers`)
4. Check authStore has valid currentUser
5. Review the two documentation files above

---

## Quick Commands Reference

```powershell
# Start backend
cd c:\xampp\htdocs\CALFFA\CALFFA\Registration\backend
npm start

# Start frontend
cd c:\xampp\htdocs\CALFFA\CALFFA\Registration\farmer-registration
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies (if needed)
npm install

# Check for errors
npm run lint
```

---

**Status:** ✅ Ready for Testing
**Last Updated:** 2024
**Developed by:** GitHub Copilot

---

## Next Steps

1. ✅ Test the consolidated dashboard
2. ✅ Verify all API integrations
3. ✅ Test on mobile devices
4. ⏳ Replace estimated financial data with real database tables
5. ⏳ Add more detailed charts (trends, projections)
6. ⏳ Implement WebSocket for real-time updates
7. ⏳ Add export functionality (CSV/PDF)

---

**Happy Testing! 🎉**
