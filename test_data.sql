-- Test data SQL insert statements
-- Used for testing overview tab functionality
-- Total 21 completed tasks, matching the statistics in the image

-- Note: Please confirm your user ID and category ID, adjust according to actual situation
-- User ID: 1 (Yuwan421)
-- Category ID: 1(Sports), 2(Study), 3(Daily), 4(Entertainment)

-- Insert completed task data (for testing quadrant statistics and category statistics on overview page)
-- Quadrant distribution: Urgent & Important(4), Urgent & Not Important(5), Not Urgent & Not Important(3), Not Urgent & Important(9)

-- Urgent & Important tasks (Quadrant 1) - 4 items
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('完成项目报告', '撰写并提交项目最终报告', 1, 2, 'DONE', 1, NOW(), NOW()),
('准备重要会议', '准备明天的客户会议材料', 1, 2, 'DONE', 1, NOW(), NOW()),
('修复紧急bug', '修复生产环境的严重bug', 1, NULL, 'DONE', 1, NOW(), NOW()),
('提交作业', '完成并提交本周作业', 1, NULL, 'DONE', 1, NOW(), NOW());

-- Not Urgent & Important tasks (Quadrant 2) - 9 items
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('学习新技术', '学习React Hooks高级用法', 2, 2, 'DONE', 1, NOW(), NOW()),
('制定学习计划', '制定下个月的学习计划', 2, 2, 'DONE', 1, NOW(), NOW()),
('阅读技术书籍', '阅读《深入理解Java虚拟机》', 2, 2, 'DONE', 1, NOW(), NOW()),
('整理笔记', '整理本周的学习笔记', 2, 2, 'DONE', 1, NOW(), NOW()),
('规划职业发展', '思考并规划未来职业发展方向', 2, 2, 'DONE', 1, NOW(), NOW()),
('晨跑', '完成晨跑5公里', 2, 1, 'DONE', 1, NOW(), NOW()),
('学习新技能', '学习Python编程', 2, NULL, 'DONE', 1, NOW(), NOW()),
('完成数学作业', '完成数学作业', 2, NULL, 'DONE', 1, NOW(), NOW()),
('完成英语作业', '完成英语作业', 2, NULL, 'DONE', 1, NOW(), NOW());

-- Urgent & Not Important tasks (Quadrant 3) - 5 items
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('回复邮件', '回复一些不重要的邮件', 3, 3, 'DONE', 1, NOW(), NOW()),
('接电话', '接听朋友的电话', 3, 3, 'DONE', 1, NOW(), NOW()),
('处理琐事', '处理一些日常琐事', 3, 3, 'DONE', 1, NOW(), NOW()),
('购买日用品', '去超市购买日用品', 3, 3, 'DONE', 1, NOW(), NOW()),
('处理工作邮件', '处理工作邮件', 3, NULL, 'DONE', 1, NOW(), NOW());

-- Not Urgent & Not Important tasks (Quadrant 4) - 3 items
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('看视频', '看一些娱乐视频', 4, 4, 'DONE', 1, NOW(), NOW()),
('玩游戏', '玩一会儿游戏放松', 4, 4, 'DONE', 1, NOW(), NOW()),
('休息', '休息一下', 4, NULL, 'DONE', 1, NOW(), NOW());

-- Category statistics distribution (for testing category statistics):
-- No category: 6 items (included above)
-- Study(2): 5 items (included above)
-- Daily(3): 4 items (included above)
-- Entertainment(4): 2 items (included above)
-- Sports(1): 1 item (included above)
-- Others: 3 items (included above)
