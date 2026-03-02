-- Migration: Add operation_manager and business_manager roles to farmers table
-- Date: February 9, 2026

-- Modify the role ENUM to include the two new roles
ALTER TABLE farmers 
MODIFY COLUMN role ENUM('admin','farmer','president','treasurer','auditor','operator','agriculturist','operation_manager','business_manager') 
DEFAULT 'farmer';

-- Verify the change
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'role';
