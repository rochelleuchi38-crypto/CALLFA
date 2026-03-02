# 📊 New Dashboard Structure - Visual Reference

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard                            🚪 Logout           │
│  Overview of CALFFA Operations                              │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 📍       │ 👥       │ 💰       │ 💳       │ 📊       │ 📦       │
│ Barangays│ Members  │Contribut.│  Loans   │Transact. │Inventory │
│   62     │   125    │ ₱125,000 │ ₱625,000 │   625    │    15    │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────┬─────────────────────────────┐
│ 👥 Members by Status        │ 📍 Top 10 Barangays         │
│                             │                             │
│  [Doughnut Chart]           │  [Bar Chart]                │
│   - Approved                │   Barangay A: ██████ 15     │
│   - Pending                 │   Barangay B: ████ 12       │
│   - Rejected                │   Barangay C: ███ 10        │
│                             │   ...                       │
└─────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────┬─────────────────────────────┐
│ 📦 Inventory Overview       │ 💰 Financial Overview       │
│                             │                             │
│  [Bar Chart]                │  [Bar Chart]                │
│   Seeds:      ████ 500kg    │   Contributions: ████       │
│   Fertilizer: ███ 300kg     │   Loans:        ███████     │
│   Pesticide:  ██ 150L       │   Expenses:     ██          │
│   Tools:      █ 45pcs       │                             │
└─────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚡ Quick Actions                                            │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┤
│   👥    │   📦    │   🌱    │   💳    │   💰    │   ⚙️    │
│  View   │ Manage  │  Seed   │  Loan   │Financial│ Settings│
│ Members │Inventory│ Distrib.│  Mgmt   │ Overview│         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## Members Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  👥 Members Management                                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│ ⏳ Pending Approval (5)      │ ✅ Registered Farmers (120)  │
└──────────────────────────────┴──────────────────────────────┘
      [ACTIVE TAB]                    [INACTIVE TAB]

┌─────────────────────────────────────────────────────────────┐
│  Pending Farmers Table                                      │
│  ┌────────┬────────────┬──────────┬────────┬──────────┐    │
│  │  Name  │  Address   │   Phone  │  Role  │  Actions │    │
│  ├────────┼────────────┼──────────┼────────┼──────────┤    │
│  │ Juan D.│ Balingayan │ 09123... │ Farmer │ ✓ ✕ 🗑️ │    │
│  │ Maria S│ Balite     │ 09124... │ Farmer │ ✓ ✕ 🗑️ │    │
│  └────────┴────────────┴──────────┴────────┴──────────┘    │
│                                                             │
│  Actions:                                                   │
│   ✓ = Approve     ✕ = Reject     🗑️ = Delete               │
└─────────────────────────────────────────────────────────────┘

WHEN "Registered Farmers" TAB IS CLICKED:
┌─────────────────────────────────────────────────────────────┐
│  Registered Farmers Table                                   │
│  ┌────────┬────────────┬──────────┬────────┬──────────┐    │
│  │  Name  │  Address   │   Phone  │ Status │  Actions │    │
│  ├────────┼────────────┼──────────┼────────┼──────────┤    │
│  │ Pedro R│ Baruyan    │ 09125... │✅ Appr.│    🗑️    │    │
│  │ Rosa M │ Calawitan  │ 09126... │✅ Appr.│    🗑️    │    │
│  │ Admin  │ Balingayan │ 09127... │✅ Appr.│ 🔒 ADMIN │    │
│  └────────┴────────────┴──────────┴────────┴──────────┘    │
│                                                             │
│  Note: Admin accounts are protected and cannot be deleted  │
└─────────────────────────────────────────────────────────────┘
```

---

## Navigation Flow

### For Regular Users (Farmers):
```
Login → Dashboard (unified)
  │
  ├─ View Stats (can see all metrics)
  ├─ View Charts (can see all visualizations)
  ├─ Quick Actions:
  │   ├─ View Members (can see all members)
  │   ├─ Manage Inventory (view only)
  │   ├─ Loan Management
  │   └─ Settings
  └─ Sidebar Navigation (limited to non-admin features)
```

### For Admin Users:
```
Login → Dashboard (unified)
  │
  ├─ View Stats (same as regular users)
  ├─ View Charts (same as regular users)
  ├─ Quick Actions:
  │   ├─ View Members (can approve/reject/delete)
  │   ├─ Manage Inventory (full CRUD)
  │   ├─ Seed Distribution (admin only)
  │   ├─ Loan Management
  │   ├─ Financial Overview (admin only)
  │   └─ Settings
  └─ Sidebar Navigation (full admin features)
      ├─ Members
      ├─ Farmers Management
      ├─ Seed Distribution
      ├─ System Activity
      ├─ Financial Overview
      ├─ Notifications
      └─ Audit Logs
```

---

## Color Scheme Reference

### Stat Cards:
- 📍 Barangays: Purple (`#e9d5ff` to `#ddd6fe`)
- 👥 Members: Green (`#d1fae5` to `#a7f3d0`)
- 💰 Contributions: Blue (`#dbeafe` to `#bfdbfe`)
- 💳 Loans: Yellow (`#fef3c7` to `#fde68a`)
- 📊 Transactions: Indigo (`#e0e7ff` to `#c7d2fe`)
- 📦 Inventory: Orange (`#fed7aa` to `#fdba74`)

### Charts:
- Status Chart (Doughnut):
  - Approved: Green `#10B981`
  - Pending: Yellow `#FBBF24`
  - Rejected: Red `#EF4444`
- Barangays Chart: Purple `#7C3AED`
- Inventory Chart: Orange `#F59E0B`
- Financial Chart:
  - Contributions: Green `#10B981`
  - Loans: Blue `#3B82F6`
  - Expenses: Red `#EF4444`

### Buttons:
- Primary Action: Green gradient (`#10b981` to `#059669`)
- Logout: Red (`#ef4444`)
- Active Tab: Green gradient with shadow
- Inactive Tab: Transparent with hover gray

---

## Data Flow Diagram

```
┌──────────────┐
│   Database   │
│  (MySQL)     │
└──────┬───────┘
       │
       │ SQL Queries
       ▼
┌──────────────┐
│   Backend    │
│ (Node.js)    │ GET /api/farmers
└──────┬───────┘ GET /api/inventory
       │
       │ JSON Response
       ▼
┌──────────────┐
│   Frontend   │
│ (Vue 3)      │
└──────┬───────┘
       │
       ├─► Dashboard Stats (computed)
       ├─► Chart.js Rendering
       └─► Members Table Display

Data Calculations:
- Total Members: farmers.length
- Approved: farmers.filter(f => f.status === 'approved').length
- Pending: farmers.filter(f => f.status === 'pending').length
- Rejected: farmers.filter(f => f.status === 'rejected').length
- Contributions: approved * 1000
- Loans: approved * 5000
- Transactions: totalMembers * 5
```

---

## Component Hierarchy

```
App.vue
└─ Router View
   ├─ Login.vue (unauthenticated)
   │
   └─ AuthenticatedLayout.vue (authenticated)
      ├─ Sidebar.vue
      │  ├─ Dashboard (for all)
      │  ├─ Admin Section (admin only)
      │  └─ Settings (for all)
      │
      └─ Router View (main content)
         ├─ AdminDashboard.vue (/dashboard)
         │  ├─ Chart.js components (4 charts)
         │  └─ Quick Actions links
         │
         ├─ FarmerTablePage.vue (/farmers-table)
         │  ├─ PendingFarmersTab.vue (Pending tab)
         │  └─ FarmerTable.vue (Registered tab)
         │
         ├─ InventoryPage.vue (/inventory)
         ├─ SeedDistributionPage.vue (/seed-distribution)
         ├─ LoanPage.vue (/loan)
         └─ Settings.vue (/settings)
```

---

## Responsive Breakpoints

```
Desktop (>768px):
┌─────┬─────┬─────┬─────┬─────┬─────┐  Stats: 6 columns
│ 📍  │ 👥  │ 💰  │ 💳  │ 📊  │ 📦  │
└─────┴─────┴─────┴─────┴─────┴─────┘

┌────────────────┬────────────────┐  Charts: 2 columns
│   Chart 1      │   Chart 2      │
├────────────────┼────────────────┤
│   Chart 3      │   Chart 4      │
└────────────────┴────────────────┘


Tablet (≤768px):
┌─────┬─────┬─────┐  Stats: 3 columns
│ 📍  │ 👥  │ 💰  │
├─────┼─────┼─────┤
│ 💳  │ 📊  │ 📦  │
└─────┴─────┴─────┘

┌────────────────┐  Charts: 1 column
│   Chart 1      │
├────────────────┤
│   Chart 2      │
├────────────────┤
│   Chart 3      │
├────────────────┤
│   Chart 4      │
└────────────────┘


Mobile (<640px):
┌─────┬─────┐  Stats: 2 columns
│ 📍  │ 👥  │
├─────┼─────┤
│ 💰  │ 💳  │
├─────┼─────┤
│ 📊  │ 📦  │
└─────┴─────┘

┌────────────────┐  Charts: 1 column
│   Chart 1      │
├────────────────┤
│   Chart 2      │
├────────────────┤
│   Chart 3      │
├────────────────┤
│   Chart 4      │
└────────────────┘
```

---

## API Endpoint Reference

### Farmers Endpoints:
```
GET    /api/farmers              → Get all farmers
GET    /api/farmers/pending      → Get pending farmers only
POST   /api/farmers/:id/approve  → Approve a farmer
POST   /api/farmers/:id/reject   → Reject a farmer
DELETE /api/farmers/:id          → Delete a farmer (admin only)
PUT    /api/farmers/:id/profile  → Update farmer profile
```

### Inventory Endpoints:
```
GET    /api/inventory            → Get all inventory items
POST   /api/inventory            → Create new item (admin only)
PUT    /api/inventory/:id        → Update item (admin only)
DELETE /api/inventory/:id        → Delete item (admin only)
```

---

## File Structure

```
farmer-registration/
├── src/
│   ├── views/
│   │   ├── AdminDashboard.vue ✅ (NEW - Unified Dashboard)
│   │   ├── AdminDashboard_OLD.vue 📦 (Backup)
│   │   ├── FarmerTablePage.vue ✅ (UPDATED - Tabs)
│   │   ├── Login.vue ✅ (Barangay dropdown)
│   │   └── Settings.vue ✅ (Barangay dropdown)
│   │
│   ├── components/
│   │   ├── Sidebar.vue ✅ (UPDATED - Removed Admin Dashboard)
│   │   ├── PendingFarmersTab.vue ✅ (Used in Members)
│   │   └── FarmerTable.vue ✅ (Used in Members)
│   │
│   ├── router/
│   │   └── index.js ✅ (UPDATED - Unified routing)
│   │
│   └── stores/
│       ├── authStore.js ✅
│       └── farmerStore.js ✅
│
├── DASHBOARD_CONSOLIDATION_CHANGES.md 📄
└── DASHBOARD_VISUAL_REFERENCE.md 📄 (This file)
```

---

## Testing Scenarios

### Test 1: Regular User Login
1. Login as farmer
2. Should redirect to `/dashboard`
3. See 6 stat cards with real data
4. See 4 charts rendered
5. Quick Actions should NOT show admin-only items
6. Sidebar should NOT show admin section

### Test 2: Admin User Login
1. Login as admin
2. Should redirect to `/dashboard`
3. See same 6 stat cards
4. See same 4 charts
5. Quick Actions should show all items including admin-only
6. Sidebar should show admin section

### Test 3: Members Page (Regular User)
1. Navigate to "View Members"
2. Should see Pending Approval tab (view only)
3. Should see Registered Farmers tab (view only)
4. Should NOT see approve/reject/delete buttons

### Test 4: Members Page (Admin)
1. Navigate to "Members"
2. Should see Pending Approval tab with action buttons
3. Can approve farmer → moves to Registered tab
4. Can reject farmer → status changes to rejected
5. Can delete farmer → removed from database
6. Cannot delete admin accounts (buttons disabled)

### Test 5: Chart Rendering
1. Load dashboard
2. Wait for data fetch
3. All 4 charts should render
4. Doughnut chart shows correct proportions
5. Bar charts show correct values
6. Resize window → charts should remain responsive

---

## Performance Metrics

### Expected Load Times:
- Initial Dashboard Load: <2s
- Charts Rendering: <500ms
- API Data Fetch: <1s
- Tab Switch: Instant
- Chart Re-render: <200ms

### Optimization Tips:
- Charts only render once on mount
- Data fetched in parallel (Promise.all)
- Computed properties for reactive stats
- Canvas elements for Chart.js (hardware accelerated)

---

**End of Visual Reference**
```

This document provides a complete visual guide for the new consolidated dashboard!
