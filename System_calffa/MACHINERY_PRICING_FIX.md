# Machinery Booking Price Calculation Fix

## Issue Identified
When booking a Dryer, the system was incorrectly displaying:
- **Before**: "80 kabans × ₱7,500 = ₱600,000"
- **Expected**: "₱7,500 per load (up to 100 kabans)"

The problem: A Dryer has a **fixed price per load** (₱7,500), not a per-unit price. Whether you use 1 kaban or 100 kabans (the max capacity), the price should remain ₱7,500, as they all fit in one load.

## Root Cause
The database had incorrect `unit_type` values:
- Dryer had `unit_type = "load"` instead of `"per load"`
- Harvester had `unit_type = "hectare"` instead of `"per hectare"`

The backend and frontend code checks for the full phrase `"per load"` to determine if pricing is flat-rate vs. per-unit, but the database only had the short form.

## Solution Applied

### 1. **Database Migration** ✅
- Updated Dryer: `unit_type "load"` → `"per load"`
- Updated Harvester: `unit_type "hectare"` → `"per hectare"`
- Execution date: February 22, 2026
- Files: `backend/fix-unit-types.js` (migration script)

### 2. **Frontend Label Fix** ✅
- Updated `getAreaLabel()` function to dynamically use `capacity_unit` from machinery data
- Before:
  - Dryer: "Number of Loads" (confusing - users enter kabans, not loads)
  - Tractor: "Area (hectares)" (hardcoded)
- After:
  - Dryer: "Quantity (kabans)" (matches capacity_unit)
  - Tractor: "Area (hectares)" (matches capacity_unit)
  - **All machinery types now have dynamic labels matching their capacity_unit**

## Pricing Logic (Already Correct)

### Backend Calculation (`backend/routes/machinery.js`)
```javascript
const calculateBookingPrice = (machinery, areaSize, areaUnit) => {
  // For 'per load' pricing (flat rate):
  if (machinery.unit_type === 'per load') {
    return pricePerUnit; // Fixed price: ₱7,500
  } 
  // For per-unit pricing (e.g., 'per hectare'):
  else {
    return pricePerUnit * size; // ₱500/ha × 60 ha = ₱30,000
  }
};
```

### Frontend Calculation (`farmer-registration/src/views/MachineryBookingPage.vue`)
```javascript
const validateAndCalculate = () => {
  // For 'per load' pricing:
  if (selectedMachineryForBooking.value.unit_type === 'per load') {
    calculatedPrice.value = selectedMachineryForBooking.value.price_per_unit
  } 
  // For per-unit pricing:
  else {
    calculatedPrice.value = selectedMachineryForBooking.value.price_per_unit * area_size
  }
};
```

### Frontend Display
```vue
<!-- For 'per load' machinery: -->
<span v-if="unit_type === 'per load'">
  ₱7,500 per load (up to 100 kabans)
</span>

<!-- For per-unit machinery: -->
<span v-else>
  80 kabans × ₱7,500 per kaban
</span>
```

## Result
✨ **Now when booking a Dryer:**
- Label: "Quantity (kabans)" - clear what to enter
- User enters: 80 (kabans)
- Price display: "₱7,500 per load (up to 100 kabans)"
- Total cost: ₱7,500 (not ₱600,000)
- ✅ Correct!

## Testing

To verify the fix:
1. Open Machinery Booking page
2. Select "Dryer"
3. Enter 80 in the quantity field
4. See: "₱7,500 per load (up to 100 kabans)" and total ₱7,500
5. Try different quantities (50, 100) - total stays ₱7,500
6. Try exceeding 100 - should show error: "Maximum capacity is 100 kabans per day"

## Files Modified
1. **Backend Database**: `agriculture_portal.machinery_inventory`
   - Updated unit_type for Dryer (2 items)
   - Updated unit_type for Harvester (1 item)

2. **Frontend**: `farmer-registration/src/views/MachineryBookingPage.vue`
   - Updated `getAreaLabel()` function (line 645-655)
   - Now uses dynamic `capacity_unit` for all machinery types

3. **Migration Scripts** (for reference):
   - `backend/fix-unit-types.js` - Applied migration
   - `backend/check-all-machinery.js` - Verification
   - `backend/check-machinery.js` - Diagnostic (deleted after use)

## Additional Context
- **Database**: `agriculture_portal`
- **Unit Type Standards**:
  - `"per load"` = Flat rate (price doesn't change based on quantity)
  - `"per hectare"` = Per-unit pricing (multiplied by quantity)
  - `"per xyz"` pattern indicates the pricing model

---
**Status**: ✅ FIXED - Ready for user testing
