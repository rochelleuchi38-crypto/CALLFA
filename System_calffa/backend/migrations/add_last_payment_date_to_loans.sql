-- Add last_payment_date column to loans table to track the most recent payment date
ALTER TABLE loans ADD COLUMN IF NOT EXISTS last_payment_date DATE NULL COMMENT 'Date of most recent payment' AFTER paid_date;
