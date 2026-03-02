-- Add completion_notes column to machinery_bookings table
ALTER TABLE machinery_bookings 
ADD COLUMN completion_notes TEXT NULL AFTER rejection_reason;

-- Create index for completion_notes
CREATE INDEX idx_machinery_bookings_completion_notes ON machinery_bookings(completion_notes);
