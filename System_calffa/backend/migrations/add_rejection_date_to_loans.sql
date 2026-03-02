-- Add rejection_date column to loans table
ALTER TABLE loans
ADD COLUMN rejection_date DATE NULL AFTER rejection_reason;
