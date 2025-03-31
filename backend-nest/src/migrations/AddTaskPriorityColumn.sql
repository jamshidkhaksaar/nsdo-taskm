ALTER TABLE task 
ADD COLUMN priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium';