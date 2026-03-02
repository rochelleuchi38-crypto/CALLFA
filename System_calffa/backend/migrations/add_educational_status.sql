-- Migration: Add educational_status column to farmers table
-- Date: 2026-02-23
-- Description: Adds educational attainment/status field for farmer registration

ALTER TABLE farmers 
ADD COLUMN educational_status VARCHAR(100) DEFAULT NULL 
AFTER phone_number;

-- Optional: Add comment to describe the column
ALTER TABLE farmers 
MODIFY COLUMN educational_status VARCHAR(100) DEFAULT NULL 
COMMENT 'Educational attainment level (e.g., Elementary, High School, College, Vocational, etc.)';
