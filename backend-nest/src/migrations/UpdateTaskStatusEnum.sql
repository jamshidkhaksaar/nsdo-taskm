-- First, alter the column to accept VARCHAR temporarily
ALTER TABLE task 
MODIFY COLUMN status VARCHAR(255);

-- Update the existing values
UPDATE task SET status = 'pending' WHERE status = 'TODO' OR status = 'OPEN';
UPDATE task SET status = 'in_progress' WHERE status = 'IN_PROGRESS';
UPDATE task SET status = 'completed' WHERE status = 'DONE';

-- Now change the column back to ENUM with the new values
ALTER TABLE task 
MODIFY COLUMN status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'; 