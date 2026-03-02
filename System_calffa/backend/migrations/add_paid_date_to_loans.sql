-- Add paid_date column to loans table to track when a loan is fully paid
ALTER TABLE loans ADD COLUMN IF NOT EXISTS paid_date DATE NULL COMMENT 'Date when loan was fully paid' AFTER due_date;
