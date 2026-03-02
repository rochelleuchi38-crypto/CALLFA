-- Add payment tracking fields to machinery_bookings table
-- This allows operators to record full or partial payments when approving bookings

-- Add payment-related columns
ALTER TABLE machinery_bookings
ADD COLUMN payment_status ENUM('Unpaid', 'Partial', 'Paid') DEFAULT 'Unpaid' AFTER status,
ADD COLUMN total_paid DECIMAL(10, 2) DEFAULT 0.00 AFTER total_price,
ADD COLUMN remaining_balance DECIMAL(10, 2) DEFAULT 0.00 AFTER total_paid,
ADD COLUMN receipt_number VARCHAR(100) AFTER remaining_balance,
ADD COLUMN payment_date DATE AFTER receipt_number,
ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash' AFTER payment_date,
ADD COLUMN payment_recorded_by INT AFTER payment_method,
ADD COLUMN last_payment_date DATE AFTER payment_recorded_by,
ADD CONSTRAINT fk_payment_recorded_by FOREIGN KEY (payment_recorded_by) REFERENCES farmers(id) ON DELETE SET NULL;

-- Create machinery_booking_payments table to track payment history (similar to loan_payments)
CREATE TABLE IF NOT EXISTS machinery_booking_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    receipt_number VARCHAR(100),
    remarks TEXT,
    recorded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES machinery_bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- Create index for better performance
CREATE INDEX idx_machinery_booking_payments_booking ON machinery_booking_payments(booking_id);
CREATE INDEX idx_machinery_booking_payments_date ON machinery_booking_payments(payment_date);
CREATE INDEX idx_machinery_bookings_payment_status ON machinery_bookings(payment_status);

-- Update existing bookings to set remaining_balance equal to total_price
UPDATE machinery_bookings 
SET remaining_balance = total_price 
WHERE remaining_balance = 0 AND total_paid = 0;
