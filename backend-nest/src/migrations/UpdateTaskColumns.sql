-- Check if priority column exists
SET @exists := (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'taskmanagement'
    AND TABLE_NAME = 'task'
    AND COLUMN_NAME = 'priority'
);

-- Add priority column only if it doesn't exist
SET @query = IF(
    @exists = 0,
    'ALTER TABLE task ADD COLUMN priority ENUM("low", "medium", "high") NOT NULL DEFAULT "medium"',
    'SELECT "Priority column already exists"'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing tasks to have default priority
UPDATE task SET priority = 'medium' WHERE priority IS NULL;

