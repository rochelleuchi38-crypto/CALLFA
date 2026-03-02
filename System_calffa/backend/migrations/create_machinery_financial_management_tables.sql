-- Create machinery_expenses table
CREATE TABLE IF NOT EXISTS machinery_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machinery_id INT NOT NULL,
  date_of_expense DATE NOT NULL,
  particulars VARCHAR(255) NOT NULL COMMENT 'Details of expense',
  reference_number VARCHAR(100),
  total_amount DECIMAL(10, 2) NOT NULL,
  fuel_and_oil DECIMAL(10, 2) DEFAULT 0,
  labor_cost DECIMAL(10, 2) DEFAULT 0 COMMENT 'Operator and Helper wages',
  per_diem DECIMAL(10, 2) DEFAULT 0 COMMENT 'Incentive per hectare/sq.m/hour of service',
  repair_and_maintenance DECIMAL(10, 2) DEFAULT 0,
  office_supply DECIMAL(10, 2) DEFAULT 0 COMMENT 'Ballpen, etc.',
  communication_expense DECIMAL(10, 2) DEFAULT 0 COMMENT 'Load/Internet',
  utilities_expense DECIMAL(10, 2) DEFAULT 0 COMMENT 'Water and electricity',
  sundries DECIMAL(10, 2) DEFAULT 0 COMMENT 'Other expenses',
  record_created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_machinery_id (machinery_id),
  INDEX idx_date (date_of_expense)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create machinery_income table
CREATE TABLE IF NOT EXISTS machinery_income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  machinery_id INT NOT NULL,
  booking_id INT NOT NULL,
  date_of_income DATE NOT NULL,
  income_amount DECIMAL(10, 2) NOT NULL,
  remarks TEXT,
  record_created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_machinery_id (machinery_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_date (date_of_income)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create machinery_profit_distribution table
CREATE TABLE IF NOT EXISTS machinery_profit_distribution (
  id INT AUTO_INCREMENT PRIMARY KEY,
  distribution_period VARCHAR(50) NOT NULL,
  total_machinery_income DECIMAL(15, 2) NOT NULL,
  total_machinery_expenses DECIMAL(15, 2) NOT NULL,
  net_profit DECIMAL(15, 2) GENERATED ALWAYS AS (total_machinery_income - total_machinery_expenses) STORED,
  distribution_created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_period (distribution_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create machinery_profit_per_barangay table
CREATE TABLE IF NOT EXISTS machinery_profit_per_barangay (
  id INT AUTO_INCREMENT PRIMARY KEY,
  distribution_id INT NOT NULL,
  barangay_id INT NOT NULL,
  barangay_name VARCHAR(100),
  member_count INT NOT NULL,
  barangay_share DECIMAL(15, 2) NOT NULL,
  share_per_member DECIMAL(10, 2) GENERATED ALWAYS AS (barangay_share / NULLIF(member_count, 0)) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (distribution_id) REFERENCES machinery_profit_distribution(id) ON DELETE CASCADE,
  INDEX idx_distribution_id (distribution_id),
  INDEX idx_barangay_id (barangay_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
