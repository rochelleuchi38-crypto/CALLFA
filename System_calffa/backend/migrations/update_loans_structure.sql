-- Migration: Update Loans Structure
-- Description: Add loan_type field and update constraints for new loan system

-- Add loan_type column if it doesn't exist
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS loan_type ENUM('agricultural', 'provident', 'educational') NOT NULL DEFAULT 'agricultural' AFTER loan_amount;

-- Update interest_rate to fixed 1%
ALTER TABLE loans 
MODIFY COLUMN interest_rate DECIMAL(5, 2) DEFAULT 1.00 COMMENT 'Fixed interest rate at 1%';

-- Update payment_term to default 6 months
ALTER TABLE loans 
MODIFY COLUMN payment_term INT DEFAULT 6 COMMENT 'Fixed at 6 months';

-- Update due_date to be calculated as 6 months from approval
-- This will be handled in application logic

-- Add index for loan_type
ALTER TABLE loans 
ADD INDEX IF NOT EXISTS idx_loan_type (loan_type);

-- Update existing loans to have loan_type (set to agricultural by default)
UPDATE loans SET loan_type = 'agricultural' WHERE loan_type IS NULL OR loan_type = '';
