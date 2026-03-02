-- Migration: Add Farmer Profile Fields and Activity Logs
-- Description: Extends farmers table with profile information and creates activity logs

-- Add profile fields to farmers table if they don't exist
ALTER TABLE farmers
ADD COLUMN IF NOT EXISTS primary_crop VARCHAR(50) COMMENT 'Main crop type: rice, corn, vegetables, etc.',
ADD COLUMN IF NOT EXISTS land_area DECIMAL(10, 2) COMMENT 'Farm land area in hectares',
ADD COLUMN IF NOT EXISTS farm_location VARCHAR(255) COMMENT 'Specific farm location details',
ADD COLUMN IF NOT EXISTS barangay_id INT COMMENT 'Link to barangays table',
ADD COLUMN IF NOT EXISTS membership_type ENUM('regular', 'associate', 'honorary') DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS membership_date DATE COMMENT 'Date when member joined',
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP NULL COMMENT 'Last activity timestamp',
ADD COLUMN IF NOT EXISTS notes TEXT COMMENT 'Additional notes about the farmer',
ADD INDEX idx_primary_crop (primary_crop),
ADD INDEX idx_barangay_id (barangay_id),
ADD INDEX idx_membership_type (membership_type);

-- Create activity_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL COMMENT 'Reference to farmers table',
  activity_type VARCHAR(50) NOT NULL COMMENT 'Type: login, profile_update, contribution, activity_participation, etc.',
  activity_description TEXT COMMENT 'Detailed description of the activity',
  ip_address VARCHAR(45) COMMENT 'IP address of user',
  user_agent TEXT COMMENT 'Browser/device information',
  metadata JSON COMMENT 'Additional data in JSON format',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_created_at (created_at)
);

-- Create membership_history table to track membership changes
CREATE TABLE IF NOT EXISTS membership_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  previous_role VARCHAR(20),
  new_role VARCHAR(20),
  changed_by INT COMMENT 'Admin who made the change',
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_changed_at (changed_at)
);

-- Create farmer_documents table for storing important documents
CREATE TABLE IF NOT EXISTS farmer_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL COMMENT 'e.g., ID, Land Title, Certificate',
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INT COMMENT 'File size in bytes',
  uploaded_by INT,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_by INT,
  verified_at TIMESTAMP NULL,
  notes TEXT,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_document_type (document_type),
  INDEX idx_status (status)
);

-- Create farmer_contacts table for emergency and alternative contacts
CREATE TABLE IF NOT EXISTS farmer_contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT NOT NULL,
  contact_type VARCHAR(30) NOT NULL COMMENT 'emergency, alternate, spouse, etc.',
  contact_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50),
  phone_number VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_contact_type (contact_type)
);

-- Insert some sample activity log entries for existing farmers
INSERT INTO activity_logs (farmer_id, activity_type, activity_description)
SELECT id, 'account_created', CONCAT('Account created for ', full_name)
FROM farmers
WHERE id NOT IN (SELECT DISTINCT farmer_id FROM activity_logs WHERE activity_type = 'account_created')
LIMIT 100;

-- Update last_activity for all farmers
UPDATE farmers f
SET last_activity = (
  SELECT MAX(created_at) 
  FROM activity_logs al 
  WHERE al.farmer_id = f.id
)
WHERE id IN (SELECT DISTINCT farmer_id FROM activity_logs);

