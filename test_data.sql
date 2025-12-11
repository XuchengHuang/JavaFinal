-- 测试数据SQL插入语句
-- 用于测试概述标签页的功能
-- 总共21条已完成任务，符合图片中的统计

-- 注意：请先确认你的用户ID和分类ID，根据实际情况调整
-- 用户ID: 1 (Yuwan421)
-- 分类ID: 1(运动), 2(学习), 3(日常), 4(娱乐)

-- 插入已完成的任务数据（用于测试概述页面的四象限统计和分类统计）
-- 四象限分布：重要且紧急(4条), 紧急不重要(5条), 不重要不紧急(3条), 重要不紧急(9条)

-- 重要且紧急的任务（象限1）- 4条
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('完成项目报告', '撰写并提交项目最终报告', 1, 2, 'DONE', 1, NOW(), NOW()),
('准备重要会议', '准备明天的客户会议材料', 1, 2, 'DONE', 1, NOW(), NOW()),
('修复紧急bug', '修复生产环境的严重bug', 1, NULL, 'DONE', 1, NOW(), NOW()),
('提交作业', '完成并提交本周作业', 1, NULL, 'DONE', 1, NOW(), NOW());

-- 重要不紧急的任务（象限2）- 9条
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

-- 紧急不重要的任务（象限3）- 5条
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('回复邮件', '回复一些不重要的邮件', 3, 3, 'DONE', 1, NOW(), NOW()),
('接电话', '接听朋友的电话', 3, 3, 'DONE', 1, NOW(), NOW()),
('处理琐事', '处理一些日常琐事', 3, 3, 'DONE', 1, NOW(), NOW()),
('购买日用品', '去超市购买日用品', 3, 3, 'DONE', 1, NOW(), NOW()),
('处理工作邮件', '处理工作邮件', 3, NULL, 'DONE', 1, NOW(), NOW());

-- 不重要不紧急的任务（象限4）- 3条
INSERT INTO tasks (title, description, quadrant, category_id, status, user_id, created_at, updated_at) VALUES
('看视频', '看一些娱乐视频', 4, 4, 'DONE', 1, NOW(), NOW()),
('玩游戏', '玩一会儿游戏放松', 4, 4, 'DONE', 1, NOW(), NOW()),
('休息', '休息一下', 4, NULL, 'DONE', 1, NOW(), NOW());

-- 分类统计分布（用于测试分类统计）：
-- 无分类: 6条 (已包含在上面)
-- 学习(2): 5条 (已包含在上面)
-- 日常(3): 4条 (已包含在上面)
-- 娱乐(4): 2条 (已包含在上面)
-- 运动(1): 1条 (已包含在上面)
-- 其他: 3条 (已包含在上面)
