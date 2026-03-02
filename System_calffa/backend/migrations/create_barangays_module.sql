-- Migration: Create Barangays Module Tables
-- Description: Creates tables for Federation & Barangay Management Module

-- Table: barangays
-- Stores information about each barangay in the Calapan Federation
CREATE TABLE IF NOT EXISTS barangays (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  population INT DEFAULT 0,
  total_area DECIMAL(10, 2) COMMENT 'Area in hectares',
  contact_person VARCHAR(100),
  contact_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: barangay_officers
-- Stores officers assigned to each barangay
CREATE TABLE IF NOT EXISTS barangay_officers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  barangay_id INT NOT NULL,
  farmer_id INT NOT NULL COMMENT 'Reference to farmers table',
  position VARCHAR(50) NOT NULL COMMENT 'e.g., Captain, Kagawad, Secretary, Treasurer',
  assigned_date DATE NOT NULL,
  end_date DATE COMMENT 'NULL means currently active',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barangay_id (barangay_id),
  INDEX idx_farmer_id (farmer_id),
  INDEX idx_status (status)
);

-- Table: barangay_contributions
-- Tracks financial contributions from each barangay
CREATE TABLE IF NOT EXISTS barangay_contributions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  barangay_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  contribution_type VARCHAR(50) COMMENT 'e.g., Monthly, Quarterly, Special',
  contribution_date DATE NOT NULL,
  description TEXT,
  received_by INT COMMENT 'Reference to farmers table (admin/treasurer)',
  receipt_number VARCHAR(50),
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barangay_id (barangay_id),
  INDEX idx_contribution_date (contribution_date),
  INDEX idx_status (status)
);

-- Table: barangay_activities
-- Records activities and events for each barangay
CREATE TABLE IF NOT EXISTS barangay_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  barangay_id INT NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50) COMMENT 'e.g., Meeting, Training, Distribution, Event',
  description TEXT,
  activity_date DATE NOT NULL,
  location VARCHAR(255),
  participants_count INT DEFAULT 0,
  budget DECIMAL(10, 2),
  status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
  organized_by INT COMMENT 'Reference to farmers table',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_barangay_id (barangay_id),
  INDEX idx_activity_date (activity_date),
  INDEX idx_status (status)
);

-- Insert the 61 barangays of Calapan City
INSERT INTO barangays (name, status) VALUES
('Balingayan', 'active'),
('Balite', 'active'),
('Baruyan', 'active'),
('Batino', 'active'),
('Bayanan I', 'active'),
('Bayanan II', 'active'),
('Biga', 'active'),
('Bondoc', 'active'),
('Bucayao', 'active'),
('Buhuan', 'active'),
('Bulusan', 'active'),
('Calero', 'active'),
('Camansihan', 'active'),
('Camilmil', 'active'),
('Canubing I', 'active'),
('Canubing II', 'active'),
('Comunal', 'active'),
('Guinobatan', 'active'),
('Gulod', 'active'),
('Gutad', 'active'),
('Ibaba East', 'active'),
('Ibaba West', 'active'),
('Ilaya', 'active'),
('Lalud', 'active'),
('Lazareto', 'active'),
('Libis', 'active'),
('Lumbang', 'active'),
('Lumangbayan', 'active'),
('Mahal na Pangalan', 'active'),
('Malad', 'active'),
('Malamig', 'active'),
('Managpi', 'active'),
('Masipit', 'active'),
('Nag-iba I', 'active'),
('Nag-iba II', 'active'),
('Navotas', 'active'),
('Pachoca', 'active'),
('Palhi', 'active'),
('Panggalaan', 'active'),
('Parang', 'active'),
('Patas', 'active'),
('Perseverance', 'active'),
('Pinagsabangan I', 'active'),
('Pinagsabangan II', 'active'),
('Ponon', 'active'),
('Poblacion', 'active'),
('Putingtubig', 'active'),
('Sabang', 'active'),
('Salong', 'active'),
('San Antonio', 'active'),
('San Vicente Central', 'active'),
('San Vicente East', 'active'),
('San Vicente North', 'active'),
('San Vicente South', 'active'),
('San Vicente West', 'active'),
('Santa Cruz', 'active'),
('Santa Isabel', 'active'),
('Santa Maria Village', 'active'),
('Santa Rita', 'active'),
('Silonay', 'active'),
('Suqui', 'active'),
('Tawagan', 'active'),
('Tawiran', 'active'),
('Tibag', 'active'),
('Wawa', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Add comment for future reference
-- This module is part of the CALFFA (Calapan Federation of Farmers Association) system
