-- Migration: Enforce barangay_id as NOT NULL with proper Foreign Key
-- Description: Makes barangay_id a required field for all farmers with proper foreign key enforcement
-- Date: February 19, 2026

-- Step 1: Drop existing foreign key if it exists
ALTER TABLE farmers DROP FOREIGN KEY fk_farmers_barangay;

-- Step 2: Update any NULL barangay_id values to the first barangay (id = 1)
-- This ensures data consistency before adding NOT NULL constraint
UPDATE farmers SET barangay_id = 1 WHERE barangay_id IS NULL;

-- Step 3: Modify the column to be NOT NULL
ALTER TABLE farmers MODIFY COLUMN barangay_id INT NOT NULL;

-- Step 4: Add the proper foreign key constraint
-- ON DELETE RESTRICT: Prevents deletion of barangays that have farmers
-- ON UPDATE CASCADE: If barangay ID changes, farmer references update automatically
ALTER TABLE farmers ADD CONSTRAINT fk_farmers_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_farmers_barangay_id ON farmers(barangay_id);
CREATE INDEX IF NOT EXISTS idx_farmers_role_barangay ON farmers(barangay_id, role);
CREATE INDEX IF NOT EXISTS idx_farmers_status_barangay ON farmers(barangay_id, status);

-- Step 6: Update column comment
ALTER TABLE farmers MODIFY COLUMN barangay_id INT NOT NULL COMMENT 'Foreign key reference to barangays table - required for all farmers';

-- Verification: Run these queries to confirm the constraint was created properly
-- SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'barangay_id';
