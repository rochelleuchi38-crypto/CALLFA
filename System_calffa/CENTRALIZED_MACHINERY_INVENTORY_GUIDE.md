# 🚜 Centralized Machinery Inventory System - Complete Guide

## Overview

The new Centralized Machinery Inventory system provides Admins with a professional, scalable interface to manage farm machinery across all barangays from a single, unified view. This system replaces the need for navigating between barangay-specific pages and provides a better user experience.

---

## ✨ Key Features

### 1. **Centralized Inventory Management**
- **Single View**: See all machinery from all barangays in one place
- **Barangay Column**: Clear visibility of which barangay owns each machine
- **Unified Dashboard**: All statistics and filters in one interface
- **No Page Switching**: Manage machines without navigating between barangay pages

### 2. **Intelligent Barangay Filtering**
- **Dropdown Selector**: Easy-to-use barangay filter at the top of the page
- **Default "All Barangays"**: Shows all machines by default
- **Quick Selection**: Select any barangay to see only its machinery
- **Filter Pill**: Visual indicator showing active barangay filter
- **Clear Filter Button**: Easily reset to show all barangays

### 3. **Improved Machine Registration Flow**
- **No Prerequisites**: Add machines without going to barangay pages first
- **Barangay Selection in Form**: Choose target barangay during machine creation
- **Consistent UI**: All add/edit operations in modal dialogs
- **Faster Workflow**: Complete machine registration in 2-3 clicks

### 4. **Professional Asset Management**
- **Status Tracking**: Available, In Use, Under Maintenance, Unavailable
- **Operator Assignment**: Track how many operators assigned to each machine
- **Pricing Management**: Set and manage pricing per machine type
- **Capacity Planning**: Track max capacity and unit specifications
- **Full CRUD Operations**: Create, Read, Update, Delete all machinery

### 5. **Advanced Filtering & Search**
- **Barangay Filter**: Filter by specific barangay or view all
- **Type Filter**: Filter by machinery type (Harvester, Dryer, etc.)
- **Status Filter**: View machines by operational status
- **Combined Filters**: Use multiple filters together for precise results
- **Real-time Updates**: Filters apply instantly

### 6. **Rich Data Display**
- **Statistics Cards**: Quick overview of total, available, and maintenance machines
- **Operator Count**: See active operators per machine
- **Color-coded Badges**: Type, status, and barangay indicators
- **Detailed View Modal**: Click to see full machinery details
- **Mobile Responsive**: Works on tablets and mobile devices

---

## 🎯 System Architecture

### Frontend Components

#### **MachineryInventoryPageAdmin.vue**
- **Location**: `src/views/MachineryInventoryPageAdmin.vue`
- **Route**: `/machinery-inventory`
- **Access**: Admin role only (`meta: { requiresAdmin: true }`)
- **Features**:
  - Centralized inventory display
  - Barangay dropdown filter
  - Add/Edit/Delete machinery
  - View detailed machinery information
  - Dynamic filtering

#### **machineryStore.js (Enhanced)**
- **Location**: `src/stores/machineryStore.js`
- **New State**: `barangays` array
- **New Action**: `fetchBarangays()` - retrieves all active barangays
- **Existing Actions**: All work with barangay_id parameter

### Backend API Integration

#### **GET /api/machinery/inventory**
```javascript
// Request Parameters
{
  status: 'Available|In Use|Under Maintenance|Unavailable',
  machinery_type: 'Harvester|Dryer|Hauling Track|Tractor',
  barangay_id: integer // Filter by specific barangay
}

// Response
{
  success: true,
  inventory: [
    {
      id: 1,
      machinery_name: 'Harvester Unit A',
      machinery_type: 'Harvester',
      barangay_id: 1,
      barangay_name: 'Barangay 1',  // ← NEW FIELD
      price_per_unit: 5000,
      status: 'Available',
      assigned_operators: 2,
      ...
    }
  ],
  filtered_by_barangay: false
}
```

#### **POST /api/machinery/inventory**
```javascript
// Request (Enhanced with barangay_id)
{
  machinery_name: string,
  machinery_type: string,
  barangay_id: integer,  // ← NEW REQUIRED FIELD
  description: string,
  price_per_unit: number,
  unit_type: string,
  max_capacity: number,
  capacity_unit: string,
  status: string,
  created_by: integer
}

// Response
{
  success: true,
  message: 'Machinery added successfully',
  machinery: { id, ... }
}
```

#### **GET /api/barangays**
```javascript
// Response
{
  success: true,
  barangays: [
    { id: 1, name: 'San Jose', location: 'Location A', status: 'active' },
    { id: 2, name: 'Santa Rosa', location: 'Location B', status: 'active' },
    ...
  ]
}
```

#### **PUT /api/machinery/inventory/:id**
```javascript
// Request (Enhanced with barangay_id support)
{
  machinery_name: string,
  barangay_id: integer,  // ← Can reassign to different barangay
  status: string,
  ...other fields
}

// Response
{
  success: true,
  message: 'Machinery updated successfully',
  machinery: { id, ... }
}
```

---

## 📋 User Guide

### Accessing the System

1. **Navigate to Machinery Inventory**
   - Click on "🚜 Machinery Inventory" in the admin menu
   - Or visit: `/machinery-inventory`
   - Requires Admin role

### Adding New Machinery

#### Step 1: Click "Add New Machinery"
![Add Button](screenshot: top-right button)

#### Step 2: Fill in Machinery Details
| Field | Required | Notes |
|-------|----------|-------|
| Machinery Name | ✅ Yes | e.g., "Harvester Unit A" |
| Machinery Type | ✅ Yes | Select from: Harvester, Dryer, Hauling Track, Tractor |
| **Assign to Barangay** | ✅ Yes | **NEW**: Select which barangay owns this machine |
| Description | ❌ No | Additional details |
| Price per Unit | ✅ Yes | Numeric value (auto-filled based on type) |
| Unit Type | ✅ Yes | e.g., "per hectare", "per load" |
| Max Capacity | ❌ No | Optional capacity limit |
| Capacity Unit | ❌ No | e.g., "hectares", "kabans" |
| Status | ✅ Yes | Available, In Use, Under Maintenance, Unavailable |

#### Step 3: Submit
- Click "Add Machinery"
- System validates barangay assignment
- Machinery is created with barangay_id stored in database
- Success message appears

### Filtering by Barangay

#### Method 1: Dropdown Select
```
📍 Filter by Barangay: [Dropdown ▼]
- All Barangays (default)
- Barangay 1
- Barangay 2
- Barangay 3
```

#### Method 2: Active Filter Pill
When a barangay is selected:
```
[Barangay Name] ✕
```
Click the ✕ to clear the filter

#### Behavior
- **Default**: Shows all machines across all barangays
- **After Selection**: Only shows machines assigned to selected barangay
- **Filter Persistence**: Combines with other filters (type, status)
- **Statistics Update**: Cards recalculate for filtered results

### Viewing Machine Details

1. Click the **👁️ (View)** button on any machine row
2. Modal opens showing:
   - Full machinery details
   - **Barangay Assignment** (prominent display)
   - Assigned operators list
   - All specifications

### Editing Machinery

1. Click the **✏️ (Edit)** button
2. Form opens with current values pre-filled
3. **Can change barangay assignment** - reassign machine to different barangay
4. Update desired fields
5. Click "Update Machinery"
6. System validates and updates

### Deleting Machinery

1. Click the **🗑️ (Delete)** button
2. Confirmation dialog appears
3. Verify you want to delete
4. Click "Delete" to confirm
5. Machine is removed from system

### Using Multiple Filters

1. **Filter by Barangay**: Select from dropdown
2. **Filter by Type**: Choose from Machinery Type dropdown
3. **Filter by Status**: Select status value
4. **Combine Filters**: All filters work together
5. **Results Update**: Table updates in real-time

**Example**: "Show all Available Harvesters from Barangay 1"
- Select "Barangay 1" in barangay filter
- Select "Harvester" in type filter
- Select "Available" in status filter
- Table shows only matching machines

---

## 🔄 Workflow Examples

### Example 1: Setup New Machinery for Barangay

```
1. Admin logs in → Navigate to Machinery Inventory
2. Click "Add New Machinery"
3. Fill form:
   - Name: "John Deere Harvester S100"
   - Type: Harvester
   - Barangay: "San Jose" ← (Select here)
   - Price: 5000 (per hectare)
   - Status: Available
4. Click "Add Machinery"
5. Machine appears in inventory, tied to San Jose barangay
6. System prevents booking this machine from other barangays
```

### Example 2: Transfer Machine to Another Barangay

```
1. Find the machine in the list
2. Filter can help if searching: use barangay filter
3. Click Edit button
4. Change "Assign to Barangay" dropdown
5. Select new barangay (e.g., "Santa Rosa")
6. Click "Update Machinery"
7. Machine now belongs to Santa Rosa
8. Previous barangay can no longer book it
```

### Example 3: Manage All Machines Across System

```
1. Admin needs overview of all machinery
2. Leave barangay filter as "All Barangays"
3. View all machines with clear barangay column
4. Use Type and Status filters to narrow down
5. Statistics cards show federation-wide totals
6. Can quickly see barangay distribution
```

### Example 4: Mark Machine for Maintenance

```
1. Machine needs maintenance
2. Find it in the list (use barangay filter if needed)
3. Click Edit
4. Change Status to "Under Maintenance"
5. Update Machinery
6. System prevents bookings for this machine
7. Operator cannot deploy it
```

---

## 🔐 Barangay-Based Access Control

### Admin Privileges
- ✅ View ALL machinery from all barangays
- ✅ Add machinery and assign to any barangay
- ✅ Edit and reassign machinery between barangays
- ✅ Delete machinery from any barangay
- ✅ See cross-barangay statistics
- ✅ Filter by any barangay or view all

### Non-Admin Users
- ✅ View machinery from their own barangay only
- ✅ Cannot access centralized inventory page
- ✅ Use MachineryBookingPage for their barangay
- ✅ Restricted to their barangay's machines

### Booking System Integration
- Farmers can only book machinery from their barangay
- System auto-filters available machines by farmer's barangay
- Prevents cross-barangay machinery bookings
- Validates barangay match before approval/payment

---

## 📊 Data Model

### machinery_inventory Table
```sql
CREATE TABLE machinery_inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machinery_name VARCHAR(100) NOT NULL,
  machinery_type VARCHAR(100) NOT NULL,
  barangay_id INT,  -- ← Key field for barangay assignment
  description TEXT,
  price_per_unit DECIMAL(10,2),
  unit_type VARCHAR(50),
  max_capacity DECIMAL(10,2),
  capacity_unit VARCHAR(50),
  status ENUM('Available', 'In Use', 'Under Maintenance', 'Unavailable'),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (barangay_id) REFERENCES barangays(id),
  INDEX idx_barangay (barangay_id),
  INDEX idx_barangay_status (barangay_id, status)
);
```

### Key Relationships
- **machinery_inventory.barangay_id** → **barangays.id**
- **machinery_bookings.barangay_id** → **barangays.id**
- **machinery_operators.barangay_id** → **barangays.id**

---

## 🎨 UI/UX Highlights

### Color Scheme
- **Barangay Elements**: Blue (#3b82f6) - indicates location/assignment
- **Status Badges**: Color-coded by status
- **Machine Types**: Different colors for each type
- **Filter Pills**: Blue background showing active filters

### Responsive Design
- **Desktop**: Full table with all columns
- **Tablet**: Adjusted padding and smaller fonts
- **Mobile**: Stackable interface with accessible buttons

### Accessibility
- Clear labels and hint text
- Keyboard navigation support
- Color-independent status indicators
- Error messages with context

---

## 🔧 Technical Specifications

### Frontend Stack
- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Styling**: Scoped CSS (no framework)
- **API Communication**: Fetch API
- **Router**: Vue Router 4

### Backend Integration
- **API Endpoint**: `/api/machinery/inventory`
- **Barangays**: `/api/barangays`
- **Authentication**: JWT token in Authorization header
- **Database**: MySQL with proper foreign keys and indexes
- **Middleware**: Token verification and barangay access control

### Performance Considerations
- Indexed database queries on barangay_id
- Efficient filtering on client-side
- Minimal API calls through store caching
- Lazy loading of barangays on mount

---

## 🚀 Deployment Checklist

- [ ] Database migrations applied (barangay_id columns added)
- [ ] Machinery store updated with fetchBarangays action
- [ ] MachineryInventoryPageAdmin.vue deployed
- [ ] Router updated with new route
- [ ] Backend API returns barangay_name in responses
- [ ] Barangays API endpoint functional
- [ ] Authentication and authorization working
- [ ] Tested with multiple barangays
- [ ] Tested filter combinations
- [ ] Tested add/edit/delete operations
- [ ] Mobile responsiveness verified

---

## 🔄 Migration From Old System

### What Changed
- ❌ No longer need to navigate to barangay-specific pages
- ✅ Single centralized admin view for all machinery
- ✅ Barangay assignment during machine creation
- ✅ Better filtering and search capabilities

### Data Continuity
- All existing machinery is preserved
- barangay_id is populated from previous assignments
- No data loss during migration
- Booking history remains intact

### User Training
1. Show admin the new `/machinery-inventory` route
2. Demonstrate barangay filter dropdown
3. Show how to add machine with barangay selection
4. Explain improved workflow benefits
5. Highlight one-click barangay selection

---

## 🐛 Troubleshooting

### Issue: Barangay filter dropdown is empty
**Solution**: Ensure `/api/barangays` returns active barangays

### Issue: Added machinery doesn't appear
**Solution**: Check that barangay_id is properly submitted with request

### Issue: Cannot add machinery without barangay
**Solution**: Barangay field is required - must select one before submitting

### Issue: Filter results don't update
**Solution**: Try clearing all filters and reapplying

### Issue: Mobile layout is broken
**Solution**: Use responsive design - CSS handles breakpoints at 768px

---

## 📈 Future Enhancements

Potential features for future versions:
- [ ] Bulk import machinery CSV
- [ ] Machine maintenance history tracking
- [ ] Usage analytics per barangay
- [ ] Preventive maintenance scheduling
- [ ] Equipment depreciation tracking
- [ ] QR code scanning for machines
- [ ] Real-time availability status
- [ ] Calendar-based booking visualization

---

## 📞 Support & Questions

For issues or questions:
1. Check the troubleshooting section above
2. Review the technical specifications
3. Verify database migrations are applied
4. Check browser console for errors
5. Contact development team with error logs

---

## 📝 Summary

The new **Centralized Machinery Inventory System** provides:
- ✅ Single unified view for all machinery
- ✅ Professional barangay filtering
- ✅ Improved add machine workflow
- ✅ Scalable design for 100+ barangays
- ✅ Strict barangay-based access control
- ✅ Better statistics and visibility
- ✅ Mobile-responsive interface
- ✅ Enhanced admin productivity

This system maintains full barangay-based data isolation while providing a cleaner, more scalable admin experience.
