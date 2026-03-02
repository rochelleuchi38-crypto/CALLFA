# Barangay-Based Inventory & Booking System - User Guide

## System Overview

The CALFFA machinery rental system now includes **strict barangay-based access control** to ensure each barangay operates independently with complete data isolation.

---

## What's New?

### 🎯 Core Principle
**Each barangay manages its own machines. Machines from one barangay cannot be used by another barangay.**

### ✅ Key Guarantees
1. **Equipment Isolation**: Barangay A's machines ≠ Barangay B's machines
2. **Transaction Isolation**: Officers only see and process their barangay's bookings
3. **Role-Based Control**: Each role can only perform actions within their barangay
4. **Admin Override**: System admin can view/manage all barangays

---

## For Different User Roles

### 👨‍💼 ADMIN
**What you can do:**
- ✅ View all machinery from ALL barangays
- ✅ View all bookings from ALL barangays  
- ✅ Approve/complete ANY booking regardless of barangay
- ✅ Override any barangay restriction
- ✅ Filter by barangay for organization

**Example:**
```
View Machines Dashboard
→ See all machines (Barangay 1, 2, 3, etc.)
→ Can filter by barangay or view all
→ Full access to all transactions
```

---

### 👔 PRESIDENT / BARANGAY OFFICER
**What you can do:**
- ✅ View machines ONLY from your barangay
- ✅ View bookings ONLY from your barangay
- ✅ Book machinery from your barangay only
- ✅ Approve/complete bookings for your barangay
- ✅ Cannot see other barangays' data

**What you CANNOT do:**
- ❌ View machinery from other barangays
- ❌ Book machinery from other barangays
- ❌ Approve bookings for other barangays
- ❌ Record payments for other barangays

**Example:**
```
President of Barangay A logs in
→ System automatically shows ONLY Barangay A machines
→ Cannot see Barangay B machines even if they exist
→ Can approve ONLY Barangay A bookings
```

---

### 🚜 FARMER
**What you can do:**
- ✅ Request machinery (booking) from your barangay
- ✅ View your own bookings
- ✅ See machinery available in your barangay only

**Automatic behavior:**
- System captures your barangay from your profile
- You only see machines available in your barangay
- Bookings automatically linked to your barangay

**Example:**
```
Farmer from Barangay A requests booking
→ System detects farmer is from Barangay A
→ Can only book machines assigned to Barangay A
→ Cannot book machines from Barangay B (rejected with error)
```

---

### ⚙️ OPERATOR
**What you can do:**
- ✅ Deploy machinery for bookings in your barangay
- ✅ Return equipment for your barangay bookings
- ✅ Record usage details for your barangay

**What you CANNOT do:**
- ❌ Deploy equipment for other barangays
- ❌ Return equipment from other barangays

**Example:**
```
Operator from Barangay C tries to deploy equipment
→ System verifies booking is from Barangay C
→ ✅ Allowed - same barangay
→ ❌ Blocked - machine from different barangay
```

---

### 👉 BUSINESS MANAGER / OPERATION MANAGER
**What you can do:**
- ✅ Approve bookings for your barangay
- ✅ Reject bookings for your barangay
- ✅ Manage equipment deployment for your barangay

**What you CANNOT do:**
- ❌ Approve bookings for other barangays
- ❌ Manage equipment from other barangays

**Example:**
```
Operation Manager from Barangay 1 approves booking
→ ✅ Booking from Barangay 1 - ALLOWED
→ ❌ Booking from Barangay 2 - BLOCKED
→ Error: "You can only approve bookings from your assigned barangay"
```

---

### 💰 TREASURER
**What you can do:**
- ✅ Record payments for bookings in your barangay
- ✅ View payment history for your barangay bookings

**What you CANNOT do:**
- ❌ Record payments for other barangays
- ❌ View payment details from other barangays

**Example:**
```
Treasurer from Barangay X records payment
→ ✅ Payment for Barangay X booking - ALLOWED
→ ❌ Payment for Barangay Y booking - BLOCKED
→ Error: "You can only record payments for bookings in your assigned barangay"
```

---

## System Workflows

### 📋 Complete Booking Workflow (Single Barangay)

```
1. FARMER REQUESTS BOOKING
   Farmer from Barangay A requests Tractor
   ↓
   System checks: Is Tractor assigned to Barangay A?
   ✅ YES → Booking created (barangay_id = A)
   ❌ NO → Error: "Machinery not available in your barangay"

2. BUSINESS MANAGER APPROVES
   BM from Barangay A receives request
   ↓
   System checks: Is BM from Barangay A? Is booking for Barangay A?
   ✅ YES → Booking approved
   ❌ NO → Error: "You can only approve bookings from your assigned barangay"

3. OPERATOR DEPLOYS
   Operator from Barangay A prepares equipment
   ↓
   System checks: Is Operator from Barangay A? Is booking for Barangay A?
   ✅ YES → Equipment deployed
   ❌ NO → Error: "Can only deploy equipment for your assigned barangay"

4. OPERATOR RETURNS
   Operator completes work and returns equipment
   ↓
   System tracks: Equipment return date, hours used, notes

5. TREASURER RECORDS PAYMENT
   Treasurer from Barangay A records payment
   ↓
   System checks: Is Treasurer from Barangay A? Is booking for Barangay A?
   ✅ YES → Payment recorded
   ❌ NO → Error: "Can only record payments for your assigned barangay"

6. COMPLETION
   President/Admin marks booking as completed
   ↓
   Final status: COMPLETED
```

---

## Error Messages You Might See

### Error 1: Cross-Barangay Booking Attempt
```
POST /api/machinery/bookings
ERROR: "Machinery is not available in your barangay"
```
**What it means**: The machinery you're trying to book is registered to a different barangay.
**Solution**: Book machinery that's available in your barangay.

---

### Error 2: Cross-Barangay Approval Attempt
```
PUT /api/machinery/bookings/123/approve
ERROR: "You can only approve bookings from your assigned barangay"
Status: 403 Forbidden
```
**What it means**: You're trying to approve a booking from a different barangay.
**Solution**: Only approve bookings from your barangay. Admin can approve any.

---

### Error 3: Cross-Barangay Payment Recording
```
POST /api/machinery/bookings/456/payment
ERROR: "You can only record payments for bookings in your assigned barangay"
Status: 403 Forbidden
```
**What it means**: You're a treasurer from a different barangay than the booking.
**Solution**: Only record payments for bookings in your barangay. Admin can record any.

---

### Error 4: Booking Not Found
```
GET /api/machinery/bookings/999
ERROR: "Booking not found"
Status: 404 Not Found
```
**What it means**: Either the booking doesn't exist, or it's from a different barangay and you don't have permission.
**Solution**: Verify the booking ID is correct and from your barangay.

---

## Dashboard & Views

### Admin Dashboard
```
[View All Machines] [Filter by Barangay] [View All Bookings]
        ↓                    ↓                     ↓
    All Machines        Select Barangay      All Bookings
  (All barangays)      (See only that)    (All barangays)
```

### Officer Dashboard  
```
[Machinery Inventory]     [Bookings]        [Transactions]
        ↓                     ↓                   ↓
  My Barangay         My Barangay          My Barangay
  Machines Only        Bookings Only        Only
  ✅ Auto-filtered     ✅ Auto-filtered     ✅ Auto-filtered
```

---

## Data Isolation Verification

### What Data Can You See?

#### Admin
```
Barangay A Machines: ✅ YES (all 10)
Barangay B Machines: ✅ YES (all 8)
Barangay C Machines: ✅ YES (all 12)
```

#### President of Barangay A
```
Barangay A Machines: ✅ YES (all 10)
Barangay B Machines: ❌ NO (cannot see)
Barangay C Machines: ❌ NO (cannot see)
```

#### President of Barangay B
```
Barangay A Machines: ❌ NO (cannot see)
Barangay B Machines: ✅ YES (all 8)
Barangay C Machines: ❌ NO (cannot see)
```

---

## FAQ - Frequently Asked Questions

### Q: Why can't I see machines from other barangays?
**A**: The system enforces strict data isolation. Each barangay operates independently. You can only manage machines and bookings for your assigned barangay. This prevents cross-barangay interference and ensures data security.

### Q: Can the admin see everything?
**A**: Yes. The admin role has full access across all barangays, all machines, and all transactions. This is intentional - the system admin needs to manage the entire system.

### Q: What if a farmer is from Barangay A but books a machine from Barangay B?
**A**: The system will reject this booking with the error: "Machinery is not available in your barangay". Cross-barangay bookings are not allowed for data isolation and fairness.

### Q: Can a Business Manager from Barangay A approve a booking from Barangay B?
**A**: No. The system will return: "You can only approve bookings from your assigned barangay". Managers can only approve bookings from their own barangay.

### Q: What happens if a Treasurer tries to record payment for wrong barangay's booking?
**A**: The system blocks it with: "You can only record payments for bookings in your assigned barangay". This prevents accounting errors and maintains financial integrity.

### Q: How does the system know which barangay I belong to?
**A**: When you log in with your account, the system reads your `barangay_id` from your farmer profile. This determines what data you can access automatically.

### Q: Can an officer see historical bookings from other barangays?
**A**: No. Historical data is filtered the same way as current data. Officers only see historical records from their barangay.

### Q: Is there a way to override barangay restrictions?
**A**: Only an admin can override barangay restrictions. Regular officers cannot. This is intentional for security and data isolation.

---

## Best Practices

### ✅ DO:
- Book machinery from your barangay only
- Report any cross-barangay access attempts to admin
- Keep your barangay assignment current
- Document machine usage before returning

### ❌ DON'T:
- Try to book machinery from other barangays (will be rejected)
- Share credentials with users from other barangays
- Attempt to override barangay restrictions manually
- Record payments for bookings outside your barangay

---

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| **Machine Visibility** | Officer sees all machines | Officer sees only their barangay's machines |
| **Booking Access** | Officer sees all bookings | Officer sees only their barangay's bookings |
| **Approval Authority** | Manager could approve any booking | Manager can only approve their barangay's bookings |
| **Payment Recording** | Treasurer could record any payment | Treasurer can only record their barangay's payments |
| **Cross-Barangay Bookings** | Allowed (if machinery existed) | Blocked - not allowed |
| **Data Isolation** | Partial | Complete |
| **Admin Access** | Limited | Full across all barangays |

---

## Support & Troubleshooting

### Issue: "You don't have permission" error
**Check**:
1. Is your barangay_id set in your profile?
2. Does the booking belong to your barangay?
3. Is the machinery from your barangay?

### Issue: Can't see expected bookings
**Check**:
1. Are you logged in as the correct user?
2. Are you looking at the correct barangay's section?
3. Ask admin to verify your barangay assignment

### Issue: Cross-barangay access attempt
**Why it's happening**: System is working correctly - preventing unauthorized access.
**Solution**: Only manage data from your assigned barangay.

---

## Contact & Escalations

- **System Issue**: Contact system admin
- **Barangay Assignment Change**: Contact admin for profile update
- **Booking/Transaction Questions**: Contact your barangay president or treasurer
- **System Configuration**: Contact CALFFA development team

---

**System Version**: Barangay Isolation Complete
**Release Date**: February 22, 2026
**Status**: ✅ Active & Enforced

---

## Key Security Guarantees

1. ✅ **Barangay Data Isolation**: Complete separation of barangay data
2. ✅ **Role-Based Access**: Each role operates within their barangay
3. ✅ **Transaction Verification**: Each transaction verified for barangay match
4. ✅ **Admin Override**: Admin can manage all barangays when needed
5. ✅ **Audit Trail**: All actions logged with barangay context
6. ✅ **No Cross-Contamination**: Machines/bookings never cross barangay boundaries

---

**Questions? Need Help?**
Contact your system administrator with your user role and what you're trying to do, and they can assist you.
