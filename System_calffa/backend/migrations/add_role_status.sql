-- Migration: Add role and status columns to farmers table
-- Run this SQL script to update your database schema

-- Add role column (default: 'farmer')
ALTER TABLE farmers 
ADD COLUMN role VARCHAR(20) DEFAULT 'farmer' AFTER phone_number;

-- Add status column (default: 'pending')
ALTER TABLE farmers 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER role;

-- Update existing farmers to be approved (if you want to keep existing data)
UPDATE farmers SET status = 'approved' WHERE status IS NULL OR status = '';

-- Update existing farmers to have farmer role (if you want to keep existing data)
UPDATE farmers SET role = 'farmer' WHERE role IS NULL OR role = '';

-- Add index for faster queries
CREATE INDEX idx_status ON farmers(status);
CREATE INDEX idx_role ON farmers(role);

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'farmers' 
AND COLUMN_NAME IN ('role', 'status');

