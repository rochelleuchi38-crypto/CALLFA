-- Add profile_picture column to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) DEFAULT NULL;

-- Create uploads directory info comment
-- Make sure to create an 'uploads' folder in the backend directory for storing profile pictures
