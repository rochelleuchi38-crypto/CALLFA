# Machinery Booking System - Quick Reference Guide

## Status Flow Chart

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │           MACHINERY BOOKING LIFECYCLE                        │
                    └─────────────────────────────────────────────────────────────┘

                                          ☐ FARMER REQUESTS
                                                 │
                                    POST /bookings (Farmer)
                                                 │
                                                 ▼
                                    ┌──────────────────┐
                                    │     PENDING      │
                                    │  Awaiting Mgmt   │
                                    └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
        ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
        │  Farmer Cancels  │    │ Manager Approves │    │ Manager Rejects  │
        │ PUT /cancel      │    │ PUT /approve     │    │ PUT /reject      │
        │ (no approval)    │    │ (check capacity) │    │                  │
        └─────────┬────────┘    └────────┬─────────┘    └─────────┬────────┘
                  │                      │                        │
                  ▼                      ▼                        ▼
        ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
        │    CANCELLED     │    │    APPROVED      │    │    REJECTED      │
        │  (Workflow End)  │    │ Equipment Ready  │    │ (Workflow End)   │
        └──────────────────┘    └────────┬─────────┘    └──────────────────┘
                                         │
                                         │ [Time for payment?]
                                         │ POST /payment (optional)
                                         │
                       ┌─────────────────┴──────────────────┐
                       │                                    │
                       │   ☐ EQUIPMENT DEPLOYMENT (STEP 1)  │
                       │                                    │
                       ▼                                    ▼
      ┌──────────────────────────────┐      ┌────────────────────┐
      │ PUT /deploy (Operator)       │      │  (Still Approved)  │
      │ Record: deployment_date      │───► OR record more
      │ Deploy equipment             │      │  payments later
      └──────────┬───────────────────┘      │
                 │                          ▼
                 ▼                   ┌──────────────────┐
      ┌──────────────────┐         │   APPROVED       │
      │     IN USE       │         │  (awaiting next) │
      │ (Operator has    │         └──────────────────┘
      │  equipment)      │
      └─────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
  ├─┤       ├─┤           ├─┤
  │ │       │ │           │ │
  ├─┤       ├─┤           ├─┤
 (Work)  (Optional      (Issue)
         Payment)

             ┌─────────────────────────┐
             │     HARDWARE ISSUE      │
             │ PUT /complete           │
             │ status_action=incomplete│
             └──────────┬──────────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │   INCOMPLETE         │
             │ (needs resolution)   │
             └──────────┬───────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Resume Work      │  │ Cancel           │
    │ PUT /resolve-    │  │ PUT /resolve-    │
    │ incomplete       │  │ incomplete       │
    │ (resume)         │  │ (cancel)         │
    │                  │  │                  │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
             ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  IN USE (again)  │  │   CANCELLED      │
    └────────┬─────────┘  └──────────────────┘
             │
             └─────► (continue workflow)


                  ☐ EQUIPMENT RETURN (STEP 2)
                              │
                  ┌───────────┴────────────┐
                  │                        │
        ┌─────────▼────────────┐          │
        │ Record more payment? │ (Optional)
        │ POST /payment        │◄──┘
        └─────────┬────────────┘
                  │
            All payments done?
            (optional, not required)
                  │
        ┌─────────▼──────────────────┐
        │ PUT /return-equipment      │
        │ (Operator signs off)       │
        │ Record:                    │
        │ - equipment_return_date    │
        │ - equipment_hours_used     │
        │ - operational_notes        │
        │ - operator_signoff = 1     │
        └─────────┬──────────────────┘
                  │
        ┌─────────▼──────────────────────┐
        │ IN USE (with signoff recorded) │
        │ Awaiting Admin to mark complete│
        └─────────┬──────────────────────┘
                  │
                  │ ☐ ADMIN MARKS COMPLETE
                  │
        ┌─────────▼──────────────────┐
        │ PUT /mark-completed        │
        │ (Admin/President/Treasurer) │
        │ Record: completed_by,      │
        │         completed_date     │
        └─────────┬──────────────────┘
                  │
                  ▼
        ┌──────────────────────────┐
        │      COMPLETED           │
        │   (IN A/R & COLLECTIONS) │
        │   Ready for final payment │
        │   collection/follow-up    │
        └─────────┬──────────────────┘
                  │
          ☐ PAYMENT COLLECTION
                  │
    ┌─────────────┴──────────────┐
    │                            │
    ▼                            ▼
(Already Paid)         (Outstanding Balance)
    │                            │
    │                    ┌───────▼────────────┐
    │                    │ POST /collections  │
    │                    │ (Treasurer)        │
    │                    │ Record payment(s)  │
    │                    └───────┬────────────┘
    │                            │
    │                    ┌───────▼────────────┐
    │                    │  balance = ₱0?     │
    │                    └───────┬────────────┘
    │                            │
    └────────────────┬──────────┴────────────────┐
                     │                          │
                     ▼                          ▼
            ┌──────────────────┐        ┌──────────────────┐
            │ PAYMENT STATUS:  │        │ PAYMENT STATUS:  │
            │  PAID            │        │  PARTIAL/UNPAID  │
            └────────┬─────────┘        └──────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │    CLOSED        │
            │   (Archived)     │
            │ Historical Data  │
            └──────────────────┘
```

## Role-Based Actions Matrix

```
┌──────────────────────┬──────────────┬──────────────────────────────────────────────┐
│ Status               │ Actor        │ Available Actions                            │
├──────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ PENDING              │ Farmer       │ • Cancel booking                             │
│                      │ Manager      │ • Approve (if capacity available)            │
│                      │ Manager      │ • Reject with reason                        │
├──────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ APPROVED             │ Farmer       │ • (none - awaiting operator)                 │
│                      │ Operator     │ • Deploy equipment (→ IN USE)                │
│                      │ Manager      │ • Cancel with approval (→ CANCELLED)         │
│                      │ Treasurer    │ • Record advance payment                    │
├──────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ IN USE               │ Operator     │ • Return equipment + sign off                │
│                      │ Treasurer    │ • Record payment                             │
│                      │ Manager      │ • Mark incomplete if issue                   │
│                      │ Admin/Pres   │ • Mark as Completed (→ COMPLETED)            │
├──────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ INCOMPLETE           │ Manager      │ • Resume (→ IN USE)                          │
│                      │ Manager      │ • Cancel (→ CANCELLED)                       │
├──────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ COMPLETED            │ Treasurer    │ • Record collection payment                 │
│                      │ Treasurer    │ • Delete collection (rollback)               │
│                      │ Admin        │ • Generate reports                          │
├──────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ CANCELLED/REJECTED   │ (All)        │ • View only (historical)                    │
└──────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

## Payment Independent from Status

```
IMPORTANT: Payment does NOT affect booking status!

Status: APPROVED           Status: IN USE           Status: COMPLETED
  │                         │                         │
  │ Payment: ₱1,000         │ Payment: ₱2,000        │ Payment: ₱5,000
  │ (50% paid)              │ (100% paid)            │ Balance to collect
  │ Status: APPROVED        │ Status: IN USE ✓       │ Status: COMPLETED
  │ Balance: ₱1,000         │ Balance: ₱0            │ Balance: ₱0
  │                         │                        │
  ▼                         ▼                        ▼
payment_status = PARTIAL   payment_status = PAID   payment_status = PAID
(Status stays Approved)    (Status stays In Use)   (Status stays Completed)

ONLY administrative action changes status:
  ✓ Approve changes: Pending → Approved
  ✓ Deploy changes: Approved → In Use
  ✓ Mark Complete changes: In Use → Completed
  ✗ Payment does NOT change status
```

## Key Endpoints at a Glance

```
REQUEST
POST /bookings
  { farmer_id, machinery_id, booking_date, ... }
  → Status: Pending

APPROVAL
PUT /bookings/:id/approve
  { approved_by }
  → Status: Approved (checks capacity)

PAYMENT (Independent)
POST /bookings/:id/payment
  { payment_date, amount, receipt_number, recorded_by }
  → Updates totals, does NOT change status

DEPLOYMENT
PUT /bookings/:id/deploy
  { operator_id, equipment_deployed_date, notes }
  → Status: Approved → In Use

RETURN & SIGN-OFF
PUT /bookings/:id/return-equipment
  { operator_id, equipment_return_date, equipment_hours_used, notes }
  → Records signoff, status stays In Use

COMPLETION
PUT /bookings/:id/mark-completed
  { completed_by }
  → Status: In Use → Completed (moves to A/R)

COLLECTIONS
POST /financial/collections
  { booking_id, payment_date, amount, ... }
  → Records payment within A/R module

EXCEPTIONS
PUT /bookings/:id/resolve-incomplete { resolved_by, resolution_action }
PUT /bookings/:id/cancel { cancelled_by, cancellation_reason }
```

## Data Fields by Stage

```
CREATION (Farmer submits)
├─ farmer_id
├─ machinery_id
├─ booking_date
├─ service_location
├─ area_size
└─ total_price

APPROVAL (Manager approves)
├─ approved_by
├─ approved_date
└─ status = 'Approved'

DEPLOYMENT (Operator takes equipment)
├─ equipment_deployed_date          ← NEW
├─ operational_notes                ← NEW
└─ status = 'In Use'
└─ machine_used = 1

RETURN (Operator returns equipment)
├─ equipment_return_date            ← NEW
├─ equipment_hours_used             ← NEW
├─ operator_signoff = 1             ← NEW
├─ operator_signoff_date            ← NEW
└─ operator_signoff_by              ← NEW

PAYMENT (Treasurer records)
├─ total_paid (accumulated)
├─ payment_status (Unpaid/Partial/Paid)
├─ last_payment_date
└─ recorded in machinery_booking_payments table

COMPLETION (Admin marks done)
├─ completed_by                     ← NEW
├─ completed_date                   ← NEW
└─ status = 'Completed' → moves to A/R
```

## Status Decision Tree

```
START: Is booking Pending?
├─ YES
│  ├─ Can farmer cancel?        → PUT /cancel
│  ├─ Can manager approve?      → PUT /approve (if capacity OK)
│  └─ Can manager reject?       → PUT /reject
│
└─ NO: Is booking Approved?
   ├─ YES
   │  ├─ Can operator deploy?   → PUT /deploy (→ IN USE)
   │  ├─ Can treasurer pay?     → POST /payment
   │  └─ Can manager cancel?    → PUT /cancel (needs approval)
   │
   └─ NO: Is booking In Use?
      ├─ YES
      │  ├─ Can operator return? → PUT /return-equipment
      │  ├─ Can operator mark    → PUT /complete (incomplete)
      │  │  incomplete?             → status = INCOMPLETE
      │  ├─ Can treasurer pay?    → POST /payment
      │  └─ Can admin complete?  → PUT /mark-completed
      │                              → status = COMPLETED
      │
      └─ NO: Is booking Incomplete?
         ├─ YES
         │  ├─ Can manager       → PUT /resolve-incomplete
         │  │  resume work?        (resume) → IN USE
         │  └─ Can manager       → PUT /resolve-incomplete
         │     cancel?             (cancel) → CANCELLED
         │
         └─ NO: Is booking Completed?
            ├─ YES
            │  ├─ Can treasurer  → POST /financial/collections
            │  │  collect payment?
            │  ├─ Can treasurer  → GET /financial/ar
            │  │  view A/R?
            │  └─ [Archived/Historical]
            │
            └─ NO: [Cancelled/Rejected - view only]
```

## Common Workflows

### Scenario 1: Immediate Full Payment
```
1. Farmer: Request (Pending)
2. Manager: Approve (Approved)
3. Treasurer: Record ₱5,000 payment (payment_status = PAID, status = Approved)
4. Operator: Deploy equipment (In Use)
5. Operator: Return equipment after 3 days (signoff recorded)
6. Admin: Mark Completed (→ Completed, no A/R balance)
7. Booking closed, payment complete
```

### Scenario 2: Payment After Work
```
1. Farmer: Request (Pending)
2. Manager: Approve (Approved)
3. Operator: Deploy equipment (In Use)
4. Operator: Return equipment after 3 days (signoff recorded)
5. Admin: Mark Completed (→ Completed, ₱5,000 balance due)
6. Booking appears in A/R with ₱5,000 outstanding
7. Treasurer: Collect ₱5,000 payment (payment_status = PAID)
8. Booking closed
```

### Scenario 3: Equipment Issue
```
1. Farmer: Request (Pending)
2. Manager: Approve (Approved)
3. Operator: Deploy equipment (In Use)
4. Operator: Encounter issue, mark Incomplete (Incomplete)
5. Manager: Review issue, decide to resume (→ In Use)
6. Operator: Continue work, return equipment (signoff recorded)
7. Admin: Mark Completed (→ Completed)
8. Payment collected as normal
```

---

**Reference Version**: 2.0 (Real-World Improvements)
**Last Updated**: February 9, 2026
**Status**: ✅ Backend Complete | ⏳ Frontend Pending
