-- Migration: Add barangay_id to activity_logs table
-- Description: Adds barangay_id for barangay-specific audit trails

ALTER TABLE activity_logs ADD COLUMN barangay_id INT AFTER farmer_id;

ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE SET NULL;

CREATE INDEX idx_activity_logs_barangay ON activity_logs(barangay_id);
CREATE INDEX idx_activity_logs_barangay_timestamp ON activity_logs(barangay_id, timestamp);

ALTER TABLE activity_logs MODIFY COLUMN barangay_id INT COMMENT 'Barangay context of the activity';
