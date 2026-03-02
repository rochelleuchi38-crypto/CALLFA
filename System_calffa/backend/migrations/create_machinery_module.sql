-- Create Machinery Module Tables
-- This migration creates tables for machinery inventory, bookings, and operators

-- 1. Machinery Inventory Table
CREATE TABLE IF NOT EXISTS machinery_inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    machinery_name VARCHAR(100) NOT NULL,
    machinery_type ENUM('Harvester', 'Dryer', 'Hauling Track', 'Tractor') NOT NULL,
    description TEXT,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    unit_type VARCHAR(50) NOT NULL,
    max_capacity DECIMAL(10, 2),
    capacity_unit VARCHAR(50),
    status ENUM('Available', 'In Use', 'Under Maintenance', 'Unavailable') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- 2. Machinery Operators Table
CREATE TABLE IF NOT EXISTS machinery_operators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    farmer_id INT NOT NULL,
    machinery_id INT NOT NULL,
    assigned_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    FOREIGN KEY (machinery_id) REFERENCES machinery_inventory(id) ON DELETE CASCADE,
    UNIQUE KEY unique_operator_machinery (farmer_id, machinery_id)
);

-- 3. Machinery Bookings Table
CREATE TABLE IF NOT EXISTS machinery_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    farmer_id INT NOT NULL,
    machinery_id INT NOT NULL,
    booking_date DATE NOT NULL,
    service_location VARCHAR(255) NOT NULL,
    area_size DECIMAL(10, 2) NOT NULL,
    area_unit VARCHAR(50) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
    approved_by INT,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    FOREIGN KEY (machinery_id) REFERENCES machinery_inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES farmers(id) ON DELETE SET NULL
);

-- Insert default machinery types with pricing
INSERT INTO machinery_inventory (machinery_name, machinery_type, description, price_per_unit, unit_type, max_capacity, capacity_unit, status, created_by)
VALUES 
    ('Harvester Unit 1', 'Harvester', 'Rice harvester - Maximum 3 hectares per day', 5000.00, 'per hectare', 3.00, 'hectares', 'Available', NULL),
    ('Dryer Unit 1', 'Dryer', 'Grain dryer - 100 kaban per load', 7500.00, 'per load', 100.00, 'kabans', 'Available', NULL),
    ('Hauling Track Unit 1', 'Hauling Track', 'Hauling service for grain transportation', 25.00, 'per kaban', NULL, 'kabans', 'Available', NULL),
    ('Tractor Unit 1', 'Tractor', 'Farm tractor for land preparation', 2500.00, 'per hectare', NULL, 'hectares', 'Available', NULL);

-- Create indexes for better performance
CREATE INDEX idx_machinery_bookings_farmer ON machinery_bookings(farmer_id);

CREATE INDEX idx_machinery_bookings_date ON machinery_bookings(booking_date);

CREATE INDEX idx_machinery_bookings_status ON machinery_bookings(status);

CREATE INDEX idx_machinery_inventory_type ON machinery_inventory(machinery_type);

CREATE INDEX idx_machinery_operators_farmer ON machinery_operators(farmer_id);
