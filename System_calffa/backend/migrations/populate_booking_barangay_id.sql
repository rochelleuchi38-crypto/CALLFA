-- Migration: Populate and enforce barangay_id in machinery_bookings
-- Description: Ensures all bookings are linked to a barangay based on farmer's barangay

-- Step 1: Update existing bookings with barangay_id from farmer's record
UPDATE machinery_bookings mb
SET barangay_id = (
    SELECT barangay_id FROM farmers f WHERE f.id = mb.farmer_id
)
WHERE barangay_id IS NULL;

-- Step 2: Verify and log which barangay_id we're using
-- This should populate all existing bookings

-- Step 3: Create indexes for better query performance (if not already exist)
CREATE INDEX IF NOT EXISTS idx_machinery_bookings_barangay ON machinery_bookings(barangay_id);
CREATE INDEX IF NOT EXISTS idx_machinery_bookings_barangay_status ON machinery_bookings(barangay_id, status);
CREATE INDEX IF NOT EXISTS idx_machinery_bookings_barangay_date ON machinery_bookings(barangay_id, booking_date);

-- Step 4: Verify Foreign Key constraint exists
ALTER TABLE machinery_bookings 
ADD CONSTRAINT fk_machinery_bookings_barangay
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

-- Step 5: Add NOT NULL constraint - only do after all bookings have barangay_id
-- ALTER TABLE machinery_bookings MODIFY COLUMN barangay_id INT NOT NULL;

-- Verification query to check progress:
-- SELECT COUNT(*) as total_bookings, 
--        COUNT(barangay_id) as with_barangay,
--        COUNT(CASE WHEN barangay_id IS NULL THEN 1 END) as missing_barangay
-- FROM machinery_bookings;
