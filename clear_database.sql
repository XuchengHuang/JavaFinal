-- Clear all tables in asteritime database
-- Usage: mysql -u root -p asteritime < clear_database.sql
-- Or execute the following commands in MySQL client

USE asteritime;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_categories;
DROP TABLE IF EXISTS task_recurrence_rules;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Show completion message
SELECT 'All tables have been dropped successfully!' AS message;

