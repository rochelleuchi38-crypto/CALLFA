-- Migration: Assign default barangay to machinery without barangay_id
-- Description: Ensures all machinery_inventory items are linked to a barangay

-- Step 1: For machinery without barangay, assign to a default admin-created value or first barangay
-- This assumes machinery created by admin without barangay should be available to all
-- OR we need to properly assign them during setup

-- Update machinery that was created by admin and has no barangay
-- Option 1: Assign first created machinery to default barangay (usually admin setup)
UPDATE machinery_inventory 
SET barangay_id = (SELECT id FROM barangays ORDER BY id ASC LIMIT 1)
WHERE barangay_id IS NULL AND created_by IS NOT NULL;

-- For now, keep as nullable during transition period
-- Once all machinery is properly assigned, run this:
-- ALTER TABLE machinery_inventory MODIFY COLUMN barangay_id INT NOT NULL;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_machinery_inventory_barangay ON machinery_inventory(barangay_id);
CREATE INDEX IF NOT EXISTS idx_machinery_inventory_barangay_status ON machinery_inventory(barangay_id, status);

-- Step 3: Verify foreign key constraint
ALTER TABLE machinery_inventory 
ADD CONSTRAINT fk_machinery_inventory_barangay
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

-- Verification query:
-- SELECT id, machinery_name, barangay_id FROM machinery_inventory WHERE barangay_id IS NULL;
-- SELECT COUNT(*) as total_machines, 
--        COUNT(barangay_id) as with_barangay,
--        COUNT(CASE WHEN barangay_id IS NULL THEN 1 END) as missing_barangay
-- FROM machinery_inventory;
