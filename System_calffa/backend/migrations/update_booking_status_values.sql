-- Update machinery_bookings status enum to include 'In Use'
-- This separates machine usage completion from payment status

-- First, update the column type to support the new status value
-- MySQL doesn't support adding enum values directly, so we need to modify the column

ALTER TABLE machinery_bookings 
MODIFY COLUMN status ENUM('Pending', 'Approved', 'In Use', 'Completed', 'Incomplete', 'Rejected', 'Cancelled') 
DEFAULT 'Pending' 
NOT NULL;
