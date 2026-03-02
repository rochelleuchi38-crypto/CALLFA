-- Migration: Create Financial Module Tables
-- Description: Creates tables for contributions, loans, and financial records

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  contribution_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  contribution_type ENUM('regular', 'special', 'share_capital', 'other') DEFAULT 'regular',
  payment_method ENUM('cash', 'bank_transfer', 'check') DEFAULT 'cash',
  reference_number VARCHAR(50),
  remarks TEXT,
  recorded_by INT UNSIGNED NULL COMMENT 'Admin who recorded the contribution',
  status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_contribution_date (contribution_date),
  INDEX idx_status (status),
  INDEX idx_contribution_type (contribution_type),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  loan_amount DECIMAL(10, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Annual interest rate in percentage',
  loan_purpose TEXT,
  application_date DATE NOT NULL,
  approval_date DATE,
  due_date DATE,
  status ENUM('pending', 'approved', 'rejected', 'active', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  approved_by INT UNSIGNED NULL COMMENT 'Admin who approved the loan',
  rejection_reason TEXT,
  remaining_balance DECIMAL(10, 2),
  total_paid DECIMAL(10, 2) DEFAULT 0.00,
  payment_term INT COMMENT 'Number of months for repayment',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_status (status),
  INDEX idx_application_date (application_date),
  INDEX idx_due_date (due_date),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- Create loan_payments table for tracking individual loan payments
CREATE TABLE IF NOT EXISTS loan_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'check') DEFAULT 'cash',
  reference_number VARCHAR(50),
  remarks TEXT,
  recorded_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_loan_id (loan_id),
  INDEX idx_payment_date (payment_date),
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- Create financial_records table for comprehensive transaction tracking
CREATE TABLE IF NOT EXISTS financial_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  farmer_id INT UNSIGNED NOT NULL,
  record_date DATE NOT NULL,
  record_type ENUM('loan', 'payment', 'contribution', 'loan_payment', 'other') NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('paid', 'pending', 'overdue', 'cancelled') DEFAULT 'pending',
  remarks TEXT,
  related_loan_id INT NULL COMMENT 'Reference to loans table if applicable',
  related_contribution_id INT NULL COMMENT 'Reference to contributions table if applicable',
  due_date DATE,
  paid_date DATE,
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_record_type (record_type),
  INDEX idx_status (status),
  INDEX idx_record_date (record_date),
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  FOREIGN KEY (related_loan_id) REFERENCES loans(id) ON DELETE SET NULL,
  FOREIGN KEY (related_contribution_id) REFERENCES contributions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_loans_farmer_status ON loans(farmer_id, status);
CREATE INDEX idx_contributions_farmer_date ON contributions(farmer_id, contribution_date);
CREATE INDEX idx_financial_records_composite ON financial_records(farmer_id, record_type, status);
