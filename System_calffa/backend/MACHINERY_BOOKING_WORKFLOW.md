# Machinery Booking Operations Workflow

## Overview
This document outlines the clean workflow for machinery booking operations with role-based responsibilities and clear status transitions.

## Status Flow Diagram

```
Pending
   ↓ (Business Manager/Operation Manager)
Approved
   ↓ (Operator)
In Use (Process)
   ↓ (Admin/President/Treasurer)
Completed → [Moves to A/R & Collections for payment tracking]
```

## Detailed Workflow

### 1. **Pending → Approved** (Business Manager/Operation Manager)
- **Role**: Business Manager or Operation Manager
- **Endpoint**: `PUT /api/machinery/bookings/:id/approve`
- **Actions**:
  - Verify machinery capacity for requested date
  - Optionally record initial payment (full, partial, or unpaid)
  - Set approval timestamp and approver details
  - Booking is now ready for operator usage
- **Payment Status**: Can be `Unpaid`, `Partial`, or `Paid`
- **Next Step**: Operator uses machinery and marks as complete

### 2. **Approved → In Use (Process)** (Operator)
- **Role**: Operator
- **Endpoint**: `PUT /api/machinery/bookings/:id/complete`
- **Request Body**: `{ status_action: 'completed', operator_id: <id> }`
- **Actions**:
  - Mark that machinery has been used (`machine_used = 1`)
  - Change status to "In Use"
  - Operator's responsibility ends here
- **Next Step**: Admin/President/Treasurer marks as Completed
- **Important**: 
  - ✅ No payment required at this stage
  - ✅ Works regardless of payment status (full, partial, or unpaid)
  - ✅ Can have outstanding balance

### 3. **In Use → Completed** (Admin/President/Treasurer)
- **Role**: Admin, President, or Treasurer
- **Endpoint**: `PUT /api/machinery/bookings/:id/mark-completed`
- **Request Body**: `{ completed_by: <id> }`
- **Actions**:
  - Mark booking as "Completed"
  - Record who completed the booking and when
  - Move booking to **A/R & Collections** module
- **Next Step**: Payment tracking and collection in A/R module
- **Important**:
  - ✅ No payment required to complete
  - ✅ Remaining balance automatically goes to A/R
  - ✅ Booking becomes visible in "Accounts Receivable" list
  - ✅ Payment collection tracked via Collections module

## Additional Payment Recording

### During Approval (Optional)
- Can record initial payment in the approve endpoint
- Payment recorded in `machinery_booking_payments` table

### After Booking Used
- Use `POST /api/machinery/bookings/:id/payment` to record additional payments
- Each payment is tracked in payment history
- Remaining balance is automatically calculated

## A/R & Collections Integration

After a booking reaches "Completed" status:

1. **Accounts Receivable (A/R) List**
   - Shows all completed bookings with outstanding balances
   - Displays: farmer, machinery, booking date, total amount, collected amount, remaining balance
   - Filtered to only show records with remaining balance > 0

2. **Collections Module**
   - Track each payment made against the booking
   - Record payment date, amount, receipt number, and remarks
   - View payment history for each booking
   - Delete incorrect payments with automatic recalculation

## Example Workflow Scenarios

### Scenario 1: Full Payment at Approval
```
1. Farmer requests machinery booking
2. Business Manager approves + records full payment
3. Operator uses machinery, marks as complete (In Use)
4. Admin marks as Completed
5. Booking appears in A/R but with zero balance (already paid)
```

### Scenario 2: Partial Payment at Approval, Balance Later
```
1. Farmer requests machinery booking
2. Business Manager approves + records partial payment (₱500 of ₱1,000)
3. Operator uses machinery, marks as complete (In Use)
4. Admin marks as Completed
5. Booking appears in A/R with ₱500 outstanding balance
6. Treasurer records additional ₱500 payment via Collections
7. A/R balance updates to ₱0, booking marked as Paid
```

### Scenario 3: No Payment Until Completion
```
1. Farmer requests machinery booking
2. Business Manager approves without payment (₱0 paid)
3. Operator uses machinery, marks as complete (In Use)
4. Admin marks as Completed
5. Booking appears in A/R with full ₱1,000 outstanding
6. Treasurer records full payment later via Collections
7. A/R balance updates to ₱0, booking marked as Paid
```

## Key Points

✅ **Operator's Role**: Limited to marking machinery usage (Approved → In Use)
- No payment responsibilities
- No approval authority
- Simple action: "Mark machine as used"

✅ **Admin/President/Treasurer Role**: Financial and completion authority
- Complete bookings after operator marks as used
- Move bookings to financial tracking (A/R & Collections)
- Record and track all payments
- Generate financial reports

✅ **Payment Philosophy**: 
- Payment is independent of operational workflow
- Can be:
  - Recorded at approval time
  - Recorded after usage
  - Recorded months later
- All payment history tracked in Collections module

✅ **A/R & Collections Integration**:
- Automatically includes all "Completed" bookings with balance > 0
- Transparent payment tracking
- Easy collection and reconciliation

## Database Schema

### machinery_bookings
- `status`: ENUM(Pending, Approved, In Use, Completed, ...)
- `approved_by`: Manager who approved (Business Manager/Operation Manager)
- `approved_date`: When approval happened
- `completed_by`: Admin/President/Treasurer who marked as complete
- `completed_date`: When booking moved to completed status
- `machine_used`: Boolean (1 = operator marked as used)
- `total_price`: Original booking amount
- `total_paid`: Sum of all payments
- `remaining_balance`: total_price - total_paid
- `payment_status`: ENUM(Unpaid, Partial, Paid)

### machinery_booking_payments
- Tracks each payment transaction
- Includes: payment_date, amount, receipt_number, remarks, recorded_by
- Used to build payment history in Collections module

## API Endpoints

### Booking Operations
- `PUT /api/machinery/bookings/:id/approve` - Approve by Manager
- `PUT /api/machinery/bookings/:id/complete` - Mark used by Operator
- `PUT /api/machinery/bookings/:id/mark-completed` - Complete by Admin/President/Treasurer
- `PUT /api/machinery/bookings/:id/cancel` - Cancel by Farmer
- `PUT /api/machinery/bookings/:id/reject` - Reject by Manager

### Payment Tracking
- `POST /api/machinery/bookings/:id/payment` - Record additional payment
- `GET /api/machinery/bookings/:id/payments` - View payment history

### Financial Management
- `GET /api/machinery/financial/ar` - Accounts Receivable list
- `GET /api/machinery/financial/collections` - Collections history
- `POST /api/machinery/financial/collections` - Record collection payment
- `DELETE /api/machinery/financial/collections/:id` - Delete collection (rollback)
