-- Migration: Ensure role column properly supports all role values including underscored names
-- This fixes the issue where 'operation_manager' and 'business_manager' become NULL

-- First, check current column definition
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'farmers' AND COLUMN_NAME = 'role';

-- Modify role column to be larger (VARCHAR(50)) and NOT NULL with proper default
ALTER TABLE farmers 
MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'farmer' COMMENT 'User role: farmer, admin, president, treasurer, auditor, operator, agriculturist, operation_manager, business_manager';

-- Add constraint to ensure valid roles (optional, but good for data integrity)
-- If you get an error about constraint already existing, you can ignore it
ALTER TABLE farmers 
ADD CONSTRAINT check_valid_role CHECK (
  role IN ('farmer', 'admin', 'president', 'treasurer', 'auditor', 'operator', 'agriculturist', 'operation_manager', 'business_manager')
);

-- Verify the changes
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'farmers' 
AND COLUMN_NAME = 'role';

-- Show any NULL roles in the database
SELECT id, reference_number, full_name, role, status 
FROM farmers 
WHERE role IS NULL 
ORDER BY registered_on DESC;

-- If there are any NULL roles, set them to 'farmer' as default
-- UPDATE farmers SET role = 'farmer' WHERE role IS NULL;

