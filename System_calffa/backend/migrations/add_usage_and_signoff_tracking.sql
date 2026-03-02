-- Add usage tracking and sign-off fields to machinery_bookings
ALTER TABLE machinery_bookings 
ADD COLUMN equipment_deployed_date DATETIME NULL AFTER machine_used,
ADD COLUMN equipment_return_date DATETIME NULL AFTER equipment_deployed_date,
ADD COLUMN equipment_hours_used DECIMAL(8,2) NULL AFTER equipment_return_date,
ADD COLUMN operational_notes TEXT NULL AFTER equipment_hours_used,
ADD COLUMN operator_signoff BOOLEAN DEFAULT 0 AFTER operational_notes,
ADD COLUMN operator_signoff_date DATETIME NULL AFTER operator_signoff,
ADD COLUMN operator_signoff_by INT(10) UNSIGNED NULL AFTER operator_signoff_date,
ADD COLUMN manager_verification BOOLEAN DEFAULT 0 AFTER operator_signoff_by,
ADD COLUMN manager_verification_date DATETIME NULL AFTER manager_verification,
ADD COLUMN manager_verified_by INT(10) UNSIGNED NULL AFTER manager_verification_date,
ADD KEY fk_operator_signoff_by (operator_signoff_by),
ADD KEY fk_manager_verified_by (manager_verified_by),
ADD CONSTRAINT fk_operator_signoff_by FOREIGN KEY (operator_signoff_by) REFERENCES farmers(id),
ADD CONSTRAINT fk_manager_verified_by FOREIGN KEY (manager_verified_by) REFERENCES farmers(id);
