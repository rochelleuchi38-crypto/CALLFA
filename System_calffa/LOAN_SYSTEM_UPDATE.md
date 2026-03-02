# Loan System Update - Summary

## Overview
The loan system has been completely revised to implement new business rules for agricultural, provident, and educational loans.

## Changes Made

### 1. Database Updates
**File: `backend/migrations/update_loans_structure.sql`**
- ✅ Added `loan_type` column: ENUM('agricultural', 'provident', 'educational')
- ✅ Updated `interest_rate` default to 1.00%
- ✅ Updated `payment_term` default to 6 months
- ✅ Column already exists in database

### 2. Backend API Updates
**File: `backend/routes/loans.js`**

**New Constants:**
```javascript
LOAN_LIMITS = {
  agricultural: 5000,
  provident: 3000,
  educational: 3000
}
INTEREST_RATE = 1.00 (fixed at 1%)
PAYMENT_TERM_MONTHS = 6 (fixed at 6 months)
```

**New Endpoints:**
- `GET /api/loans/eligibility/:farmerId` - Check if farmer can apply for loan

**Updated Logic:**
- ✅ Validates loan type (agricultural, provident, educational)
- ✅ Enforces maximum loan limits per type
- ✅ Checks for unsettled loans (prevents new application if pending/approved/active/overdue loans exist)
- ✅ Enforces one loan per year per farmer
- ✅ Automatically calculates interest (1%) and adds to total
- ✅ Auto-calculates due date (6 months from approval)
- ✅ Stores principal + interest as loan_amount

**Business Rules Implemented:**
1. ✅ Unsettled loans block new applications
2. ✅ Only one loan per farmer per year
3. ✅ Fixed 1% interest rate
4. ✅ Fixed 6-month payment term
5. ✅ Loan type-specific limits

### 3. Frontend Updates
**File: `farmer-registration/src/views/LoanPage.vue`**

**New Features:**
- ✅ Loan type dropdown (Agricultural/Provident/Educational)
- ✅ Dynamic maximum amount based on loan type
- ✅ Real-time interest calculation display
- ✅ Eligibility check on page load
- ✅ Warning messages when ineligible
- ✅ Loan terms & conditions display
- ✅ Removed manual payment period selection (fixed at 6 months)

**UI Improvements:**
- Shows maximum loan amount for selected type
- Displays principal + interest + total calculation
- Shows eligibility status prominently
- Clear loan terms display

### 4. Admin Page Updates
The AdminLoansPage.vue will continue to work with the updated system as it uses the same API endpoints.

## How It Works

### For Farmers:
1. Navigate to "My Loans" page
2. System checks eligibility:
   - No unsettled loans (pending/approved/active/overdue)
   - Haven't taken a loan this calendar year
3. If eligible, select loan type:
   - **Agricultural**: Up to ₱5,000
   - **Provident**: Up to ₱3,000
   - **Educational**: Up to ₱3,000
4. Enter amount (system validates against limit)
5. System automatically:
   - Adds 1% interest
   - Sets 6-month payment term
   - Shows total to be paid
6. Submit application (status: pending)

### For Admins:
1. Review loan applications
2. Approve or reject
3. On approval:
   - System automatically sets due date to 6 months from approval
   - Loan becomes available for disbursement

### Payment Rules:
- Loan must be fully paid within 6 months
- Cannot apply for new loan until current one is settled
- Only one loan allowed per calendar year

## API Response Example

**Successful Loan Application:**
```json
{
  "success": true,
  "id": 123,
  "message": "Loan application submitted successfully",
  "details": {
    "principal": 5000,
    "interest": 50,
    "total": 5050,
    "payment_term": 6
  }
}
```

**Eligibility Check:**
```json
{
  "success": true,
  "allowed": false,
  "reason": "You have an unsettled loan. Please complete your existing loan before applying for a new one."
}
```

## Testing Instructions

1. **Test Eligibility:**
   ```bash
   GET http://localhost:3000/api/loans/eligibility/[farmerId]
   ```

2. **Apply for Loan:**
   ```bash
   POST http://localhost:3000/api/loans
   Body: {
     "farmer_id": 1,
     "loan_type": "agricultural",
     "loan_amount": 5000,
     "loan_purpose": "Rice farming"
   }
   ```

3. **Approve Loan:**
   ```bash
   PUT http://localhost:3000/api/loans/[loanId]/approve
   Body: {
     "approved_by": 1
   }
   ```

## Files Modified

### Backend:
- ✅ `backend/routes/loans.js` - Complete rewrite with new business rules
- ✅ `backend/migrations/update_loans_structure.sql` - New migration file

### Frontend:
- ✅ `farmer-registration/src/views/LoanPage.vue` - Updated loan application form

### Database:
- ✅ `loans` table - Added loan_type column

## Next Steps

1. Test loan application with all three types
2. Verify eligibility checking works correctly
3. Test admin approval process
4. Verify due date calculation (should be 6 months from approval)
5. Test payment recording
6. Verify yearly limit enforcement

## Notes

- Interest is calculated and added automatically (farmer sees principal + 1%)
- All existing loans are defaulted to 'agricultural' type
- Payment term is fixed at 6 months (no longer selectable)
- Due date is auto-calculated on approval (no manual input needed)
