# Accounts Receivable Enhancement - Collections & Payments

## Overview
Enhanced the existing **List of Collectibles (Accounts Receivable)** section in the Machinery Financial Management page with comprehensive payment processing capabilities, including support for full/partial payments and optional interest calculation.

## Features Implemented

### 1. **Payment Type Selection**
- **Full Payment**: Automatically sets payment to remaining balance
- **Partial Payment**: Allows custom amount up to remaining balance
- Visual radio button interface with clear descriptions

### 2. **Interest Calculation for Partial Payments**
- **Optional 2% Interest**: Treasurer can choose to apply 2% interest × 2 seasons (4% total)
- **Automatic Calculation**: Interest amount computed and displayed in real-time
- **Seasonal Interest**: 2% per season for extended payment terms
- Interest only applies to partial payments, not full payments

### 3. **Collection Form Modal Features**
- **Receivable Details Display**: Shows farmer name, machinery, total amount, collected amount, and current balance
- **Payment Method Selection**: Cash, Check, Bank Transfer, GCash, Other
- **Receipt Number Tracking**: Optional reference number for audit trail
- **Remarks Section**: Additional notes about the payment
- **Date Selection**: Collection date picker with today's date as default

### 4. **Income Recording**
- **Automatic Income Entry**: All payments (full and partial) automatically recorded in the Income section
- **Payment Status Tracking**: 
  - "Paid" when full balance is cleared
  - "Partial" when partial payment made with outstanding balance
  - Properly updates the mechanics for income calculation
- **Interest Included**: If interest is applied, it's included in the total collection and income record

### 5. **Summary & Validation**
- **Real-Time Summary Table**: Shows balance due, payment amount, interest calculation, total collection, and remaining balance
- **Validation Checks**:
  - Prevents partial payment exceeding remaining balance
  - Ensures payment amount is greater than 0
  - Requires selection of payment method and date
  - Validates collection date is provided

## Database Changes

### New Columns Added to `machinery_booking_payments` table:
```sql
ALTER TABLE machinery_booking_payments ADD COLUMN payment_type VARCHAR(20) DEFAULT 'full';
ALTER TABLE machinery_booking_payments ADD COLUMN interest_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE machinery_booking_payments ADD COLUMN interest_applied TINYINT(1) DEFAULT 0;
```

### Fields in `machinery_booking_payments`:
- `payment_type` - 'full' or 'partial'
- `interest_amount` - Amount of interest calculated (4% for 2 seasons)
- `interest_applied` - Boolean flag indicating if interest was applied

## Architecture

### Frontend (MachineryFinancialPage.vue)

**New State:**
```javascript
collectionForm = {
  paymentType: 'full',           // 'full' or 'partial'
  paymentAmount: 0,
  collectionDate: today,         // Today's date by default
  paymentMethod: 'cash',         // Payment method
  receiptNumber: '',             // Optional
  remarks: '',                   // Optional
  addInterest: false             // Toggle for 2% interest
}
```

**Computed Properties:**
- `remainingBalance` - Amount still owed
- `interestAmount` - Calculated as paymentAmount × 0.04 (2% × 2 seasons)
- `totalCollectionAmount` - Payment + Interest
- `remainingBalanceAfter` - Balance after current payment

**Key Functions:**
- `recordCollection(ar)` - Opens collection form modal
- `validatePaymentAmount()` - Ensures amount doesn't exceed balance
- `saveCollection()` - Saves collection to backend and creates income entry
- `resetCollectionForm()` - Clears form for next entry

### Backend (machinery-financial.js)

**Enhanced POST /api/machinery-financial/collections**

Accepts:
```javascript
{
  booking_id,          // Required
  collection_amount,   // Required
  collection_date,     // Required
  payment_type,        // 'full' or 'partial'
  include_interest,    // Boolean
  interest_amount,     // Calculated interest
  total_collection,    // Payment + Interest
  payment_method,      // Selected method
  receipt_number,      // Optional
  remarks,             // Optional
  user_id              // Recorded by
}
```

Operations:
1. Validates required fields
2. Gets current booking details
3. Inserts payment record with all tracking fields
4. Updates machinery_bookings (total_paid, payment_status, payment_date)
5. Creates or updates machinery_income entry (payment goes to income)
6. Returns success with payment_id and tracking info

## Usage Flow

### For Treasurer/Admin:

1. Navigate to **Machinery Financial Management** → **A/R & Collections** tab
2. View **List of Collectibles** showing all outstanding receivables
3. Click **💳 Record Payment** button for desired AR item
4. In modal:
   - View current receivable details
   - Select **Full Payment** or **Partial Payment**
   - Enter payment amount (auto-filled for full, custom for partial)
   - Select collection date
   - **(Optional)** Check "Add 2% Interest for 2 Seasons" if partial payment
   - Select payment method
   - Enter optional receipt number and remarks
   - Review summary showing total collection
5. Click **Record Collection**
6. Payment automatically:
   - Updates booking status
   - Records collection transaction
   - Moves to Income section
   - Updates A/R balance

### Viewing Results:

- **A/R & Collections Tab**:
  - Updated "Total Collected" card
  - Updated "Outstanding Balance" card
  - Collections Transactions table shows new payment

- **Income Tab**:
  - New income record appears
  - Shows full payment amount + interest (if applicable)
  - Payment status updated (Paid/Partial)

## Interest Calculation Example

**Scenario: Partial Payment with Interest**
- Original Amount Due: ₱10,000
- Partial Payment: ₱5,000
- Interest Calculation: ₱5,000 × 4% = ₱200
- Total Collection: ₱5,200
- Remaining Balance: ₱5,000

## Validation Rules

1. **Full Payment**: Must pay exact remaining balance
2. **Partial Payment**: Must be greater than 0 but less than remaining balance
3. **Interest**: Only applies to partial payments
4. **Date**: Collection date is required
5. **Payment Method**: Must select a method
6. **Receipt Number**: Optional but recommended for audit trail

## Security & Permissions

- Only Admin, President, and Treasurer can access
- All transactions recorded with user_id (recorded_by)
- Payment status automatically calculated based on amount
- System prevents payments exceeding balance

## Integration with Income System

- All collections (full and partial) automatically move to Income
- Interest amounts are included in income calculation
- Payment status properly tracked for financial reporting
- Profit computation includes collection amounts

## Future Enhancements

- Payment reminders for outstanding AR items
- Automated interest calculation based on payment date
- Batch payment processing
- Payment schedule/installment plans
- AR aging report (30, 60, 90+ days overdue)

## Testing Checklist

- [x] Full payment clears remaining balance
- [x] Partial payment updates outstanding balance
- [x] Interest calculation is correct (4% total)
- [x] Income entry created for all payments
- [x] Collection transactions appear in table
- [x] A/R summary updates correctly
- [x] Validation prevents invalid amounts
- [x] Payment method is properly saved
- [x] Receipt number tracking works
- [x] Multiple payments for same AR tracked separately
