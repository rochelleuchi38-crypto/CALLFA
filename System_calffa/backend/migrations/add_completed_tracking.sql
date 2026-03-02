-- Add columns for Admin/President/Treasurer completion tracking
ALTER TABLE machinery_bookings 
ADD COLUMN completed_by INT(10) UNSIGNED NULL AFTER approved_date,
ADD COLUMN completed_date TIMESTAMP NULL AFTER completed_by,
ADD CONSTRAINT fk_completed_by FOREIGN KEY (completed_by) REFERENCES farmers(id);
