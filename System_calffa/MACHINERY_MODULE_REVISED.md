# Machinery Service Booking Module - Updated Implementation

## 📋 Overview

The Machinery Service Booking Module provides role-specific access to machinery services:

### **Admin Role**
- **Single unified dashboard** at `/machinery-management`
- Inventory button to manage all machinery (add, edit, delete)
- Monitor all bookings across the system
- View revenue and statistics
- Full system oversight

### **Farmer Role** (Exclusive)
- **Booking page only** at `/machinery-booking`
- Browse and book available machinery
- View their booking history
- Cancel pending bookings
- **Cannot** access approval or inventory pages

### **Operator Role** (Exclusive)
- **Approval page only** at `/machinery-approval`
- Review pending booking requests
- Approve or reject bookings with reasons
- Mark approved bookings as completed
- **Cannot** access booking or inventory pages

---

## 🚜 Machinery Pricing

| Machinery Type | Price | Unit | Max Capacity |
|----------------|-------|------|--------------|
| **Harvester** | ₱5,000 | per hectare | 3 hectares/day |
| **Dryer** | ₱7,500 | per load | 100 kaban/load |
| **Hauling Track** | ₱25 | per kaban | No limit |
| **Tractor** | ₱2,500 | per hectare | No limit |

---

## 🗂️ Database Schema

**Location:** `backend/migrations/create_machinery_module.sql`

### Tables

#### 1. `machinery_inventory`
Stores all machinery with pricing and availability.

```sql
CREATE TABLE machinery_inventory (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  machinery_name VARCHAR(100) NOT NULL,
  machinery_type ENUM('Harvester', 'Dryer', 'Hauling Track', 'Tractor'),
  description TEXT,
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit_type VARCHAR(50) NOT NULL,
  max_capacity DECIMAL(10,2),
  capacity_unit VARCHAR(50),
  status ENUM('Available', 'In Use', 'Under Maintenance', 'Unavailable'),
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. `machinery_operators`
Manages operator assignments to machinery.

```sql
CREATE TABLE machinery_operators (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  machinery_id INT UNSIGNED NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  FOREIGN KEY (machinery_id) REFERENCES machinery_inventory(id),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id)
)
```

#### 3. `machinery_bookings`
Tracks all booking requests and their status.

```sql
CREATE TABLE machinery_bookings (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  machinery_id INT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  service_location VARCHAR(255) NOT NULL,
  area_size DECIMAL(10,2) NOT NULL,
  area_unit VARCHAR(50) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'),
  notes TEXT,
  approved_by INT UNSIGNED,
  approved_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id),
  FOREIGN KEY (machinery_id) REFERENCES machinery_inventory(id),
  FOREIGN KEY (approved_by) REFERENCES farmers(id)
)
```

---

## 🔌 Backend API

**Location:** `backend/routes/machinery.js`

### Inventory Endpoints (Admin Only)

```javascript
// Get all machinery
GET /api/machinery/inventory
Response: [{ id, machinery_name, machinery_type, price_per_unit, status, ... }]

// Get single machinery
GET /api/machinery/inventory/:id

// Add new machinery
POST /api/machinery/inventory
Body: {
  machinery_name: "Harvester Unit 2",
  machinery_type: "Harvester",
  price_per_unit: 5000,
  unit_type: "per hectare",
  max_capacity: 3,
  capacity_unit: "hectares",
  status: "Available",
  created_by: 1
}

// Update machinery
PUT /api/machinery/inventory/:id
Body: { machinery_name, price_per_unit, status, ... }

// Delete machinery
DELETE /api/machinery/inventory/:id
```

### Booking Endpoints

```javascript
// Get all bookings (with filters)
GET /api/machinery/bookings?status=Pending&machinery_type=Harvester

// Create booking (Farmers)
POST /api/machinery/bookings
Body: {
  farmer_id: 5,
  machinery_id: 1,
  booking_date: "2026-02-15",
  service_location: "Barangay Poblacion",
  area_size: 2.5,
  area_unit: "hectares",
  notes: "Need service early morning"
}

// Approve booking (Operators)
PUT /api/machinery/bookings/:id/approve
Body: { approved_by: 3 }

// Reject booking (Operators)
PUT /api/machinery/bookings/:id/reject
Body: { 
  approved_by: 3,
  notes: "Machinery under maintenance"
}

// Complete booking (Operators)
PUT /api/machinery/bookings/:id/complete

// Cancel booking (Farmers)
PUT /api/machinery/bookings/:id/cancel
```

### Statistics Endpoint

```javascript
GET /api/machinery/stats
Response: {
  machinery: [
    { machinery_type: "Harvester", total: 2, available: 1, in_use: 1 }
  ],
  bookings: {
    total: 45,
    pending: 5,
    approved: 20,
    completed: 15,
    total_revenue: 125000
  }
}
```

---

## 🎨 Frontend Pages

### 1. MachineryManagementPage.vue (Admin Only)

**Route:** `/machinery-management`  
**Access:** Admin role required  
**Location:** `src/views/MachineryManagementPage.vue`

**Features:**
- ✅ **Inventory Management Button** - Opens modal with full machinery table
  - Add new machinery with auto-filled pricing defaults
  - Edit existing machinery details
  - Delete machinery (with confirmation)
  - View machinery status and capacity
  
- ✅ **All Bookings Overview**
  - Filter by status (Pending, Approved, Rejected, Completed, Cancelled)
  - Filter by machinery type
  - View detailed booking information
  - Monitor all farmer requests

- ✅ **Statistics Dashboard**
  - Total machinery count
  - Available machinery count
  - Pending bookings count
  - Total revenue calculation

**UI Components:**
- Stats grid with 4 metric cards
- Bookings table with filters
- Inventory modal with add/edit/delete actions
- Pricing guide showing default rates
- Delete confirmation dialog
- Booking details modal

---

### 2. MachineryBookingPage.vue (Farmers Only)

**Route:** `/machinery-booking`  
**Access:** Farmer role required (exclusive)  
**Location:** `src/views/MachineryBookingPage.vue`

**Features:**
- ✅ Browse available machinery cards
- ✅ Create booking requests with:
  - Machinery selection
  - Booking date picker
  - Service location input
  - Area/quantity input (auto-labeled based on machinery type)
  - Automatic price calculation
  - Notes field
  
- ✅ View booking history table
- ✅ Real-time status tracking
- ✅ Cancel pending bookings

**Validation:**
- Cannot book if machinery unavailable
- Capacity validation (e.g., max 3 hectares for Harvester)
- Date cannot be in the past
- Required fields enforcement

---

### 3. MachineryApprovalPage.vue (Operators Only)

**Route:** `/machinery-approval`  
**Access:** Operator role required (exclusive)  
**Location:** `src/views/MachineryApprovalPage.vue`

**Features:**
- ✅ View all pending bookings
- ✅ Approve bookings (records operator ID)
- ✅ Reject bookings with required reason
- ✅ Mark approved bookings as completed
- ✅ Filter by:
  - Status
  - Date range
  - Machinery type

**Statistics:**
- Pending requests count
- Approved today
- Rejected today
- Revenue from approved bookings

---

## 🔐 Access Control

### Route Guards

**Router Configuration** (`src/router/index.js`):

```javascript
// Admin - Machinery Management (unified dashboard)
{
  path: 'machinery-management',
  component: MachineryManagementPage,
  meta: { requiresAuth: true, requiresAdmin: true }
}

// Farmer - Booking Only
{
  path: 'machinery-booking',
  component: MachineryBookingPage,
  meta: { requiresAuth: true, requiresFarmer: true }
}

// Operator - Approval Only
{
  path: 'machinery-approval',
  component: MachineryApprovalPage,
  meta: { requiresAuth: true, requiresOperator: true }
}
```

### Navigation Guard Logic

```javascript
// Farmer role check
const requiresFarmer = to.matched.some(record => record.meta.requiresFarmer)
if (requiresFarmer && userRole !== 'farmer' && userRole !== 'admin') {
  alert('Access denied. Farmer privileges required.')
  next('/dashboard')
  return
}

// Operator role check
const requiresOperator = to.matched.some(record => record.meta.requiresOperator)
if (requiresOperator && userRole !== 'operator' && userRole !== 'admin') {
  alert('Access denied. Operator privileges required.')
  next('/dashboard')
  return
}

// Admin role check
const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
if (requiresAdmin && userRole !== 'admin') {
  alert('Access denied. Admin privileges required.')
  next('/dashboard')
  return
}
```

---

## 🧭 Sidebar Navigation

**Location:** `src/components/Sidebar.vue`

### What Each Role Sees:

**👨‍🌾 Farmers:**
```
OPERATIONS
  └─ 🚜 Machinery Booking
```

**👷 Operators:**
```
OPERATIONS
  └─ ✅ Machinery Approval
```

**👨‍💼 Admins:**
```
ADMIN
  ├─ 👥 Members
  ├─ 🏘️ Barangays
  ├─ 💳 Loan Management
  ├─ 🚜 Machinery Management  ← Unified dashboard
  ├─ 📋 System Activity
  ├─ 💰 Financial Overview
  ├─ 🔔 Notifications
  └─ 📜 Audit Logs
```

---

## 📊 State Management

**Location:** `src/stores/machineryStore.js`

### Store Structure

```javascript
{
  state: {
    inventory: [],        // All machinery
    bookings: [],         // All bookings
    operators: [],        // Assigned operators
    stats: {},            // Statistics
    selectedBooking: null,
    loading: false,
    error: null
  },
  
  getters: {
    availableMachinery,   // Filters by status = 'Available'
    pendingBookings,      // Filters by status = 'Pending'
    myBookings,           // Filters by farmer_id
    machineryByType       // Groups by machinery_type
  },
  
  actions: {
    // Inventory
    fetchInventory(),
    addMachinery(data),
    updateMachinery(id, data),
    deleteMachinery(id),
    
    // Bookings
    fetchBookings(filters),
    createBooking(data),
    getBookingDetails(id),
    approveBooking(id, operatorId),
    rejectBooking(id, operatorId, reason),
    completeBooking(id),
    cancelBooking(id),
    
    // Statistics
    fetchStats()
  }
}
```

---

## 🚀 Usage Examples

### Admin: Add New Machinery

1. Navigate to `/machinery-management`
2. Click **"📦 Machinery Inventory"** button
3. Click **"➕ Add New Machinery"**
4. Fill form:
   - Select machinery type (auto-fills pricing)
   - Enter machinery name
   - Adjust price if needed
   - Set status to "Available"
5. Click **"Add"**

### Farmer: Book Machinery

1. Navigate to `/machinery-booking`
2. Browse available machinery cards
3. Click **"Book Now"** on desired machinery
4. Fill booking form:
   - Select booking date
   - Enter service location
   - Enter area size (e.g., 2.5 hectares)
   - Add notes (optional)
5. Price calculates automatically
6. Click **"Submit Booking"**

### Operator: Approve Booking

1. Navigate to `/machinery-approval`
2. Review pending bookings
3. Click **"👁️"** to view details
4. Click **"✅ Approve"** or **"❌ Reject"**
5. If rejecting, provide reason
6. Booking status updates immediately

---

## 🛠️ Testing the Module

### Setup Database

```powershell
cd C:\xampp\htdocs\CALFFA\CALFFA\Registration\backend
node setup-machinery.js
```

Expected output:
```
✅ Connected to MySQL database: agriculture_portal
📊 Existing machinery tables: 3
   ✓ machinery_bookings
   ✓ machinery_inventory
   ✓ machinery_operators
📦 Machinery inventory: 4 items
```

### Start Backend Server

```powershell
cd C:\xampp\htdocs\CALFFA\CALFFA\Registration\backend
npm start
```

### Start Frontend

```powershell
cd C:\xampp\htdocs\CALFFA\CALFFA\Registration\farmer-registration
npm run dev
```

### Test Roles

1. **Admin Test:**
   - Login as admin
   - Navigate to Sidebar → Admin → Machinery Management
   - Test inventory button functionality

2. **Farmer Test:**
   - Login as farmer
   - Navigate to Sidebar → Operations → Machinery Booking
   - Create a test booking

3. **Operator Test:**
   - Login as operator
   - Navigate to Sidebar → Operations → Machinery Approval
   - Approve or reject test booking

---

## 📝 Key Implementation Details

### Price Calculation Logic

Server-side validation in `backend/routes/machinery.js`:

```javascript
function calculateBookingPrice(machinery, areaSize) {
  // Validate capacity limits
  if (machinery.max_capacity && areaSize > machinery.max_capacity) {
    throw new Error(`Maximum ${machinery.max_capacity} ${machinery.capacity_unit} per day`)
  }
  
  // Calculate total price
  return machinery.price_per_unit * areaSize
}
```

### Availability Check

Prevents overbooking:

```javascript
async function checkBookingAvailability(machineryId, bookingDate) {
  const [bookings] = await pool.execute(`
    SELECT SUM(area_size) as total_booked
    FROM machinery_bookings
    WHERE machinery_id = ? 
      AND booking_date = ?
      AND status IN ('Pending', 'Approved')
  `, [machineryId, bookingDate])
  
  const [machinery] = await pool.execute(`
    SELECT max_capacity FROM machinery_inventory WHERE id = ?
  `, [machineryId])
  
  if (machinery[0].max_capacity) {
    const available = machinery[0].max_capacity - (bookings[0].total_booked || 0)
    return available > 0
  }
  
  return true
}
```

---

## ✅ Module Checklist

- [x] Database tables created with proper foreign keys
- [x] Backend API with 20+ endpoints
- [x] Admin unified management page
- [x] Farmer booking page (exclusive)
- [x] Operator approval page (exclusive)
- [x] Role-based route guards
- [x] Sidebar navigation updates
- [x] Pinia store for state management
- [x] Price calculation and validation
- [x] Capacity checking
- [x] Default machinery data
- [x] Responsive UI design
- [x] Error handling and alerts
- [x] Documentation

---

## 🔄 Migration Notes

**Breaking Changes from Previous Version:**

1. **Route Changes:**
   - `/machinery-inventory` → `/machinery-management` (Admin unified)
   - `/machinery-booking` → Now farmer-exclusive
   - `/machinery-approval` → Now operator-exclusive

2. **Access Control:**
   - Added `requiresFarmer` meta guard
   - Stricter role enforcement (no cross-role access)

3. **Sidebar Structure:**
   - Removed machinery items from Operations for admins
   - Added "Machinery Management" to Admin section
   - Farmers only see booking
   - Operators only see approval

---

## 📞 Support & Maintenance

For issues or enhancements:
- Check database connection in `backend/db.js`
- Verify role assignments in `farmers` table
- Review browser console for frontend errors
- Check `backend/logs/` for API errors

**Last Updated:** February 2, 2026  
**Module Version:** 2.0.0 (Revised with role-exclusive access)
