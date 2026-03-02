-- Drop completion_notes column from machinery_bookings table
-- This column was unnecessary as status field already indicates Completed/Incomplete

ALTER TABLE machinery_bookings DROP COLUMN IF EXISTS completion_notes;

-- Also drop the index if it exists
ALTER TABLE machinery_bookings DROP INDEX IF EXISTS idx_completion_notes;
