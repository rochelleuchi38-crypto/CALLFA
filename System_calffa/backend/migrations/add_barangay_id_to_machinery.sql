-- Migration: Add barangay_id to machinery tables
-- Description: Adds barangay_id to machinery_inventory, machinery_bookings for barangay isolation

-- Add to machinery_inventory
ALTER TABLE machinery_inventory ADD COLUMN barangay_id INT AFTER created_by;

ALTER TABLE machinery_inventory ADD CONSTRAINT fk_machinery_inventory_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

CREATE INDEX idx_machinery_inventory_barangay ON machinery_inventory(barangay_id);
CREATE INDEX idx_machinery_inventory_barangay_status ON machinery_inventory(barangay_id, status);

ALTER TABLE machinery_inventory MODIFY COLUMN barangay_id INT COMMENT 'Barangay that owns this machinery';

-- Add to machinery_bookings
ALTER TABLE machinery_bookings ADD COLUMN barangay_id INT AFTER farmer_id;

ALTER TABLE machinery_bookings ADD CONSTRAINT fk_machinery_bookings_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

CREATE INDEX idx_machinery_bookings_barangay ON machinery_bookings(barangay_id);
CREATE INDEX idx_machinery_bookings_barangay_status ON machinery_bookings(barangay_id, status);
CREATE INDEX idx_machinery_bookings_barangay_date ON machinery_bookings(barangay_id, booking_date);

ALTER TABLE machinery_bookings MODIFY COLUMN barangay_id INT COMMENT 'Barangay where the booking is made';

-- Add to machinery_operators
ALTER TABLE machinery_operators ADD COLUMN barangay_id INT AFTER farmer_id;

ALTER TABLE machinery_operators ADD CONSTRAINT fk_machinery_operators_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

CREATE INDEX idx_machinery_operators_barangay ON machinery_operators(barangay_id);

ALTER TABLE machinery_operators MODIFY COLUMN barangay_id INT COMMENT 'Barangay where operator works';
