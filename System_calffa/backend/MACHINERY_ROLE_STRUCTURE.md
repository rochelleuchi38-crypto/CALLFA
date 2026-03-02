📋 MACHINERY MODULE ROLE STRUCTURE
===================================

UPDATED: February 9, 2026

NEW ROLE DISTRIBUTION FOR MACHINERY BOOKING WORKFLOW:

┌─────────────────────────────────────────────────────────────────────┐
│ 1. APPROVAL STAGE                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ WHO: Business Manager ✓ Operation Manager ✓                         │
│ CANNOT: Operator ✗                                                  │
│ ACTION: Approve or reject pending machinery booking requests         │
│ PROCESS:                                                            │
│   - Review booking details (farmer, machinery, date, area)          │
│   - Handle payment processing (full, partial, or unpaid)            │
│   - Record payment information (amount, date, receipt)              │
│   - Approve: Status changes from Pending → Approved                │
│   - Reject: Status changes to Rejected with reason                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 2. EXECUTION STAGE                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ WHO: Operator ✓                                                      │
│ CANNOT: Business Manager ✗ Operation Manager ✗                     │
│ ACTION: Complete or mark machine usage                              │
│ PROCESS:                                                            │
│   - Confirm machinery service has been performed                    │
│   - Mark machine as used                                            │
│   - If fully paid + machine used → Status: Completed                │
│   - If partial/unpaid + machine used → Status: Approved (partial)  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 3. VIEW & AUDIT STAGE                                                │
├─────────────────────────────────────────────────────────────────────┤
│ WHO: Admin, President, Treasurer, Auditor                           │
│ ACTION: View all booking details and transaction records            │
│ CAN SEE:                                                            │
│   - All booking details (farmer, machinery, dates, status)          │
│   - Payment information and history                                 │
│   - Machine usage records                                           │
│   - All approval and completion activities                          │
│   - Reports and analytics                                           │
└─────────────────────────────────────────────────────────────────────┘

MACHINERY OPERATORS ASSIGNMENT:
- Can be assigned by: Operator, Operation Manager, Business Manager
- Allows all three roles to manage operator assignments

ENDPOINT SECURITY UPDATES:
- POST /api/machinery/bookings/:id/approve
  ✓ UPDATED: Only operation_manager, business_manager
  
- PUT /api/machinery/bookings/:id/reject  
  ✓ UPDATED: Only operation_manager, business_manager
  
- PUT /api/machinery/bookings/:id/complete
  ✓ UPDATED: Only operator role (requires operator_id)

STATUS FLOW:
  New Booking
    ↓
  [Pending] → Approved by Business/Operation Manager
    ↓
  [Approved] → Completed by Operator (when fully paid)
    ↓
  [Completed] → Visible to all roles for audit/reporting

PARTIAL PAYMENT HANDLING:
- If payment is partial: Operator can mark as used, but stays [Approved]
- If full payment: Operator marks as used → [Completed]
