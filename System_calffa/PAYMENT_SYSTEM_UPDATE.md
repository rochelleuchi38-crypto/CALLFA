# Machinery Payment System - Completion Logic Update

## Overview
Updated the machinery booking payment system to remove unnecessary fields and implement proper completion logic based on payment status and machine usage.

## Changes Made

### 1. Frontend Updates (MachineryApprovalPage.vue)

#### Payment Form Improvements
- **Removed:** Payment method dropdown (all payments are face-to-face)
- **Added:** Payment type toggle buttons (No Payment / Partial / Full Payment)
- **Enhanced:** Auto-calculation of payment amounts when selecting "Full Payment"

#### Form Structure
**Approval Form:**
```javascript
{
  payment_type: 'unpaid',  // 'unpaid', 'partial', or 'full'
  payment_amount: 0,
  payment_date: Date,
  receipt_number: ''
}
```

**Payment Recording Form:**
```javascript
{
  payment_type: 'partial',  // 'partial' or 'full'
  amount: 0,
  payment_date: Date,
  receipt_number: '',
  remarks: ''
}
```

#### New Methods
- `setPaymentType(type)` - Handles approval form payment type changes
- `setRecordPaymentType(type)` - Handles payment recording type changes with auto-fill for full payment

#### UI Components
- Payment type buttons with active state styling
- Color-coded filter buttons for different booking statuses
- Visual feedback for payment status (Unpaid/Partial/Paid)

### 2. Backend Updates (routes/machinery.js)

#### PUT /api/machinery/bookings/:id/approve
**Removed:**
- `payment_method` parameter

**Behavior:**
- Records payment if `payment_type` is 'partial' or 'full'
- Updates `payment_status`, `total_paid`, `remaining_balance`
- Stores payment in `machinery_booking_payments` table

#### POST /api/machinery/bookings/:id/payment
**Removed:**
- `payment_method` parameter

**Added:**
- Automatic status update logic based on payment and machine usage

**Completion Logic:**
```javascript
if (machine_used && remaining_balance <= 0) {
  status = 'Completed'
} else {
  status = 'Approved' (with payment_status = 'Partial' or 'Unpaid')
}
```

#### PUT /api/machinery/bookings/:id/complete
**Updated:**
- Now accepts `machine_used` parameter (boolean)
- Implements completion rules:
  - **Fully Paid + Machine Used = Completed**
  - **Balance Remaining + Machine Used = Approved (with Partial status)**
  - **No Machine Use = Stays in current status**

### 3. Database Changes

#### New Column Added
```sql
ALTER TABLE machinery_bookings 
ADD COLUMN machine_used BOOLEAN DEFAULT FALSE AFTER status;
```

**Purpose:** Track whether the machinery has been used for the booking

#### Existing Columns Used
- `payment_status` - ENUM('Unpaid', 'Partial', 'Paid')
- `total_paid` - DECIMAL(10,2)
- `remaining_balance` - DECIMAL(10,2)
- `receipt_number` - VARCHAR(100)
- `payment_date` - DATE
- `last_payment_date` - DATE

### 4. Payment Tracking Table
```sql
machinery_booking_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT,
  payment_date DATE,
  amount DECIMAL(10,2),
  receipt_number VARCHAR(100),
  remarks TEXT,
  recorded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Booking Status Flow

### Status Transitions

1. **Pending → Approved**
   - Operator approves the booking
   - Optional: Record initial payment (No Payment/Partial/Full)
   - `status = 'Approved'`
   - `payment_status = 'Unpaid'/'Partial'/'Paid'`

2. **Approved → Approved (with Payment)**
   - Operator records additional payment
   - Updates `total_paid` and `remaining_balance`
   - If fully paid AND machine used → Completed
   - If balance remains AND machine used → stays Approved

3. **Approved → Completed**
   - Requirements:
     - `payment_status = 'Paid'` (remaining_balance = 0)
     - `machine_used = TRUE`
   - Only then: `status = 'Completed'`

### Filter Options
- **Pending** - All pending approvals
- **Approved** - Approved bookings (may have partial payment)
- **Partial Payment** - Bookings with outstanding balance
- **Rejected** - Rejected bookings
- **Completed** - Fully paid and machine used bookings
- **All** - Show all bookings

## Payment Types

### No Payment
- Used when approving booking without immediate payment
- `payment_amount = 0`
- `payment_status = 'Unpaid'`

### Partial Payment
- User enters specific amount
- Updates `total_paid` and `remaining_balance`
- `payment_status = 'Partial'` (if balance remains)

### Full Payment
- Auto-fills total price or remaining balance
- Sets `payment_status = 'Paid'`
- `remaining_balance = 0`

## User Experience Improvements

1. **Toggle Buttons:** Replace dropdown with visual toggle for payment types
2. **Auto-calculation:** Full payment button auto-fills the amount
3. **Smart Completion:** System automatically determines when booking is complete
4. **Payment History:** Track all payments in separate table
5. **Visual Feedback:** Color-coded status badges and filter buttons

## Technical Details

### Payment Recording Flow
```
1. Operator clicks "Record Payment"
2. Selects payment type (Partial/Full)
3. If Full: amount auto-fills with remaining balance
4. If Partial: operator enters amount
5. Adds receipt number and date
6. System updates:
   - total_paid = previous_total + new_payment
   - remaining_balance = total_price - total_paid
   - payment_status = calculated based on balance
   - If machine_used AND fully paid: status = 'Completed'
```

### Completion Determination
```javascript
// Only mark as completed if BOTH conditions are met:
if (booking.machine_used && booking.remaining_balance <= 0) {
  booking.status = 'Completed'
}
// Otherwise, stays in current status (usually 'Approved')
```

## Migration Files
1. `add_payment_to_machinery_bookings.sql` - Initial payment system setup
2. `add_machine_used_column.sql` - Added machine usage tracking

## Files Modified
1. `src/views/MachineryApprovalPage.vue` - Frontend payment forms and logic
2. `backend/routes/machinery.js` - Backend payment and completion logic
3. `backend/migrations/` - Database schema updates

## Testing Checklist
- [ ] Approve booking with no payment
- [ ] Approve booking with partial payment
- [ ] Approve booking with full payment
- [ ] Record additional payment on approved booking
- [ ] Complete booking (machine used + fully paid)
- [ ] Verify booking stays Approved if balance remains
- [ ] Test filter buttons (Pending, Approved, Partial, Rejected, Completed)
- [ ] Verify payment history tracking
- [ ] Check receipt number recording

## Notes
- All payments are assumed to be face-to-face (cash)
- Payment method field removed from database operations
- Machine usage must be explicitly marked by operator
- System prevents premature completion if payment pending
