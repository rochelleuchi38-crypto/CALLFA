-- Migration: Populate and enforce barangay_id in machinery_operators
-- Description: Ensures all operator assignments are linked to a barangay

-- Step 1: Update existing operators with barangay_id from farmer's record
UPDATE machinery_operators mo
SET barangay_id = (
    SELECT barangay_id FROM farmers f WHERE f.id = mo.farmer_id
)
WHERE barangay_id IS NULL;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_machinery_operators_barangay ON machinery_operators(barangay_id);
CREATE INDEX IF NOT EXISTS idx_machinery_operators_barangay_farmer ON machinery_operators(barangay_id, farmer_id);

-- Step 3: Verify foreign key constraint
ALTER TABLE machinery_operators 
ADD CONSTRAINT fk_machinery_operators_barangay
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

-- Step 4: Once verified, make NOT NULL
-- ALTER TABLE machinery_operators MODIFY COLUMN barangay_id INT NOT NULL;

-- Verification query:
-- SELECT COUNT(*) as total_operators, 
--        COUNT(barangay_id) as with_barangay,
--        COUNT(CASE WHEN barangay_id IS NULL THEN 1 END) as missing_barangay
-- FROM machinery_operators;
