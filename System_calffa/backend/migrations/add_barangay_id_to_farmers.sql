-- Migration: Add barangay_id to farmers table
-- Description: Adds barangay_id column to farmers table for barangay-based access control

ALTER TABLE farmers ADD COLUMN barangay_id INT AFTER address;

-- Add foreign key constraint
ALTER TABLE farmers ADD CONSTRAINT fk_farmers_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_farmers_barangay_id ON farmers(barangay_id);
CREATE INDEX idx_farmers_role_barangay ON farmers(barangay_id, role);
CREATE INDEX idx_farmers_status_barangay ON farmers(barangay_id, status);

-- Add comment to explain the column
ALTER TABLE farmers MODIFY COLUMN barangay_id INT COMMENT 'Reference to barangays table - required for officers, null for farmers';
