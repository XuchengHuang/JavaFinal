-- 清除 asteritime 数据库中的所有表
-- 使用方法：mysql -u root -p asteritime < clear_database.sql
-- 或者在 MySQL 客户端中执行以下命令

USE asteritime;

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除所有表
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_categories;
DROP TABLE IF EXISTS task_recurrence_rules;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS users;

-- 重新启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 显示清除完成
SELECT 'All tables have been dropped successfully!' AS message;

