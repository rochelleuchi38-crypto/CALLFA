-- Migration: Add barangay_id to financial tables
-- Description: Adds barangay_id to contributions and machinery_expenses for financial isolation

-- Add to contributions
ALTER TABLE contributions ADD COLUMN barangay_id INT AFTER farmer_id;

ALTER TABLE contributions ADD CONSTRAINT fk_contributions_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

CREATE INDEX idx_contributions_barangay ON contributions(barangay_id);
CREATE INDEX idx_contributions_barangay_date ON contributions(barangay_id, contribution_date);
CREATE INDEX idx_contributions_barangay_status ON contributions(barangay_id, status);

ALTER TABLE contributions MODIFY COLUMN barangay_id INT COMMENT 'Barangay of the contributor';

-- Add to machinery_expenses
ALTER TABLE machinery_expenses ADD COLUMN barangay_id INT AFTER machinery_id;

ALTER TABLE machinery_expenses ADD CONSTRAINT fk_machinery_expenses_barangay 
FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE;

CREATE INDEX idx_machinery_expenses_barangay ON machinery_expenses(barangay_id);
CREATE INDEX idx_machinery_expenses_barangay_date ON machinery_expenses(barangay_id, date_of_expense);

ALTER TABLE machinery_expenses MODIFY COLUMN barangay_id INT COMMENT 'Barangay of the machinery';
