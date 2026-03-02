-- Migration: Add barangay_id to loans table
-- Description: Adds barangay_id for barangay-based loan management

ALTER TABLE loans ADD COLUMN barangay_id INT AFTER farmer_id;

-- Add foreign key constraint
ALTER TABLE loans ADD CONSTRAINT fk_loans_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_loans_barangay_id ON loans(barangay_id);
CREATE INDEX idx_loans_barangay_status ON loans(barangay_id, status);
CREATE INDEX idx_loans_barangay_date ON loans(barangay_id, application_date);

ALTER TABLE loans MODIFY COLUMN barangay_id INT COMMENT 'Barangay where the loan applicant is from';
