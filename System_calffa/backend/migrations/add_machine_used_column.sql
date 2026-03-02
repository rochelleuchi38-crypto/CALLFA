-- Add machine_used column to machinery_bookings table
ALTER TABLE machinery_bookings 
ADD COLUMN machine_used BOOLEAN DEFAULT FALSE AFTER status;

-- Update existing records: Completed bookings should have machine_used = TRUE
UPDATE machinery_bookings 
SET machine_used = TRUE 
WHERE status = 'Completed';
