# Machinery Service Booking Module - Implementation Guide

## Overview
A comprehensive machinery booking system for CALFFA that allows farmers to book farm machinery, operators to approve bookings, and admins to manage the machinery inventory.

## Features Implemented

### 1. Database Schema
Location: `backend/migrations/create_machinery_module.sql`

**Tables Created:**
- `machinery_inventory` - Stores available machinery with pricing and capacity
- `machinery_operators` - Manages operator assignments to machinery
- `machinery_bookings` - Tracks all booking requests and approvals

**Default Machinery Types:**
- **Harvester**: ₱5,000 per hectare (max 3 hectares per day)
- **Dryer**: ₱7,500 per load (100 kaban per load)
- **Hauling Track**: ₱25 per kaban
- **Tractor**: ₱2,500 per hectare

### 2. Backend API
Location: `backend/routes/machinery.js`

**API Endpoints:**

#### Inventory Management (Admin Only)
- `GET /api/machinery/inventory` - List all machinery
- `GET /api/machinery/inventory/:id` - Get machinery details
- `POST /api/machinery/inventory` - Add new machinery
- `PUT /api/machinery/inventory/:id` - Update machinery
- `DELETE /api/machinery/inventory/:id` - Delete machinery

#### Operator Management
- `GET /api/machinery/operators` - List operators
- `POST /api/machinery/operators` - Assign operator
- `PUT /api/machinery/operators/:id` - Update operator status
- `DELETE /api/machinery/operators/:id` - Remove operator

#### Booking Management
- `GET /api/machinery/bookings` - List bookings (with filters)
- `GET /api/machinery/bookings/:id` - Get booking details
- `POST /api/machinery/bookings` - Create new booking
- `PUT /api/machinery/bookings/:id/approve` - Approve booking (Operator)
- `PUT /api/machinery/bookings/:id/reject` - Reject booking (Operator)
- `PUT /api/machinery/bookings/:id/complete` - Mark as completed
- `PUT /api/machinery/bookings/:id/cancel` - Cancel booking (Farmer)

#### Statistics
- `GET /api/machinery/stats` - Get machinery statistics

### 3. Frontend Components

#### Machinery Store
Location: `src/stores/machineryStore.js`
- State management for machinery inventory, bookings, and operators
- Actions for all CRUD operations
- Computed properties for filtering and statistics

#### Admin - Machinery Inventory Page
Location: `src/views/MachineryInventoryPage.vue`

**Features:**
- View all machinery inventory
- Add new machinery with default pricing
- Edit machinery details
- Delete machinery (with validation)
- View assigned operators
- Statistics dashboard

**Access:** Admin role only

#### Farmer - Machinery Booking Page
Location: `src/views/MachineryBookingPage.vue`

**Features:**
- Browse available machinery
- Create booking requests
- View booking history
- Cancel pending bookings
- Automatic price calculation
- Capacity validation

**Access:** All users (farmers, operators, admins)

#### Operator - Machinery Approval Page
Location: `src/views/MachineryApprovalPage.vue`

**Features:**
- View all booking requests
- Approve/reject bookings
- Add rejection reasons
- Mark bookings as completed
- Filter by status and date
- View farmer and machinery details

**Access:** Operator and Admin roles

### 4. Routing
Location: `src/router/index.js`

**Routes Added:**
- `/machinery-inventory` - Admin only
- `/machinery-booking` - All authenticated users
- `/machinery-approval` - Operator and Admin only

**Route Guards:**
- `requiresAuth` - Must be logged in
- `requiresAdmin` - Admin role required
- `requiresOperator` - Operator or Admin role required

### 5. Navigation
Location: `src/components/Sidebar.vue`

**Menu Structure:**
- **Operations Section:**
  - Machinery Booking (all users)
  - Machinery Approval (operators & admins)
  
- **Admin Section:**
  - Machinery Inventory (admin only)

## Installation & Setup

### 1. Run Database Migration
```bash
cd backend
node run-migration.js migrations/create_machinery_module.sql
```

### 2. Start Backend Server
```bash
cd backend
npm install  # if not already installed
node server.js
```

### 3. Start Frontend Development Server
```bash
cd farmer-registration
npm install  # if not already installed
npm run dev
```

## Usage Guide

### For Admins

1. **Add Machinery to Inventory:**
   - Navigate to Admin > Machinery Inventory
   - Click "Add New Machinery"
   - Select machinery type (defaults are pre-filled)
   - Adjust pricing if needed
   - Set max capacity
   - Save

2. **Assign Operators:**
   - View machinery details
   - Assign operators to specific machinery

### For Farmers

1. **Book Machinery:**
   - Navigate to Operations > Machinery Booking
   - Browse available machinery
   - Click "Book Now"
   - Fill in booking details:
     - Select machinery
     - Choose date (must be future date)
     - Enter service location
     - Specify area/quantity
   - Submit booking

2. **Track Bookings:**
   - View all bookings in "My Bookings" section
   - Check status (Pending, Approved, Rejected, Completed)
   - Cancel pending bookings if needed

### For Operators

1. **Review Bookings:**
   - Navigate to Operations > Machinery Approval
   - View all pending booking requests

2. **Approve/Reject:**
   - Click on booking to view details
   - Approve if capacity is available
   - Reject with reason if needed

3. **Mark as Completed:**
   - After service delivery, mark approved bookings as completed

## Business Rules & Validations

### Capacity Limits
- **Harvester**: Maximum 3 hectares per day
  - System prevents overbooking
  - Validates total bookings for a date
  
- **Dryer**: 100 kaban per load
  - Calculates loads automatically

- **Hauling Track & Tractor**: No daily limits

### Booking Rules
1. Farmers can only book for future dates
2. Multiple bookings can be made simultaneously
3. Only pending bookings can be cancelled by farmers
4. Only operators can approve/reject bookings
5. Only approved bookings can be marked as completed

### Pricing Validation
- Prices are calculated automatically based on:
  - Machinery type
  - Area/quantity requested
  - Current pricing in inventory

## API Examples

### Create Booking
```javascript
POST /api/machinery/bookings
{
  "farmer_id": 1,
  "machinery_id": 1,
  "booking_date": "2026-02-15",
  "service_location": "Barangay San Jose Farm",
  "area_size": 2.5,
  "area_unit": "hectares",
  "notes": "Need early morning service"
}
```

### Approve Booking
```javascript
PUT /api/machinery/bookings/1/approve
{
  "approved_by": 2
}
```

### Reject Booking
```javascript
PUT /api/machinery/bookings/1/reject
{
  "approved_by": 2,
  "rejection_reason": "Machinery under maintenance"
}
```

## Security Considerations

1. **Role-Based Access Control:**
   - Admin: Full access to inventory management
   - Operator: Approve/reject bookings
   - Farmer: Create and view own bookings

2. **Validation:**
   - Date validation (future dates only)
   - Capacity validation (prevent overbooking)
   - Price calculation server-side
   - Input sanitization

3. **Authorization:**
   - Route guards prevent unauthorized access
   - API endpoints check user roles
   - Farmers can only cancel their own bookings

## Future Enhancements

1. **Calendar View:**
   - Visual calendar for booking availability
   - Drag-and-drop booking creation

2. **Notifications:**
   - Email/SMS notifications for booking status changes
   - Reminders for upcoming bookings

3. **Payment Integration:**
   - Online payment gateway
   - Payment tracking

4. **Reports:**
   - Machinery utilization reports
   - Revenue analytics
   - Operator performance metrics

5. **Mobile App:**
   - Native mobile application
   - Push notifications
   - Offline booking capability

## Troubleshooting

### Common Issues

1. **Machinery not appearing in booking list:**
   - Check machinery status is "Available"
   - Verify machinery exists in inventory

2. **Booking rejection due to capacity:**
   - Check existing bookings for that date
   - Verify max capacity settings

3. **Unauthorized access errors:**
   - Verify user role is correct
   - Check route guards in router

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Review API responses
- Check browser console for frontend errors

## Version History

- **v1.0.0** (2026-02-02): Initial implementation
  - Machinery inventory management
  - Booking system
  - Operator approval workflow
  - Role-based access control
