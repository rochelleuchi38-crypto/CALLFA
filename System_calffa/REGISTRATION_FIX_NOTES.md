<!-- Test the registration form changes -->
This file documents the fixes made to prevent "Cannot GET /api/farmers/register" error:

## Changes Made:

1. **Changed form to div** (Line 14)
   - FROM: `<form @submit.prevent="register" class="registration-form">`
   - TO:   `<div class="registration-form">`
   - WHY: Removes any form submission issues and prevents default browser form handling

2. **Changed button click handler** (Line 172)
   - FROM: `<button type="submit" ... @submit>`
   - TO:   `<button type="button" ... @click="register">`
   - WHY: Ensures register() is called directly without form submission interference

3. **Added .number modifier to barangay select** (Line 56)
   - FROM: `v-model="form.barangay_id"`
   - TO:   `v-model.number="form.barangay_id"`
   - WHY: Ensures barangay_id is always stored as a numeric value, not a string

4. **Improved validation in register()** 
   - Added console logging to debug barangay_id value
   - Explicit null check: `if (!form.value.barangay_id || form.value.barangay_id === null)`
   - Better error messaging

## How it works:

1. User selects a barangay from dropdown → v-model stores as number (67, 68, etc.)
2. User fills other form fields
3. User clicks "Create Account" button
4. @click="register" calls register() function directly
5. register() validates all fields
6. If valid, sends POST request (not form submission)
7. Backend processes registration
8. Frontend redirects to login on success

## Testing:

1. Keep backend running: `cd backend && node server.js`
2. Start frontend dev server: `cd farmer-registration && npm run dev`
3. Navigate to signup page
4. Select barangay from dropdown
5. Fill all fields
6. Click Create Account
7. Should successfully register (no "Cannot GET" error)
