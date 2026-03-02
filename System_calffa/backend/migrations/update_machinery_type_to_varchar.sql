-- Update machinery_type from ENUM to VARCHAR to allow dynamic types
-- This allows admins to add any machinery type instead of being restricted to predefined options

ALTER TABLE machinery_inventory 
MODIFY COLUMN machinery_type VARCHAR(100) NOT NULL;

-- No data loss - existing ENUM values will convert to VARCHAR automatically
