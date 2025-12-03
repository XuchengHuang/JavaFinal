# AsteriTime 系统架构文档

## 1. 模块划分

### 1.1 前端模块 (asteritime-client)

#### Dashboard 模块
- `DashboardPanel.java` - 主面板
- `QuadrantPanel.java` - 四象限视图
- `KanbanColumn.java` - Kanban 列
- `TaskCard.java` - 任务卡片组件（待实现）
- `TaskEditorDialog.java` - 任务编辑对话框（待实现）
- `DragDropHandler.java` - 拖拽处理（待实现）

#### Timeline 模块
- `TimelinePanel.java` - 时间线主面板
- `TimelineGridPanel.java` - 24小时网格
- `TaskBlock.java` - 任务时间块（待实现）
- `FocusSessionBlock.java` - 专注会话块（待实现）
- `TimeRuler.java` - 时间标尺（待实现）

#### Pomodoro 模块
- `PomodoroPanel.java` - 番茄钟面板
- `PomodoroTimer.java` - 计时器逻辑（待实现）
- `TaskSelector.java` - 任务选择器（待实现）

#### Analytics 模块
- `AnalyticsPanel.java` - 统计面板
- `DonutChart.java` - 环形图（待实现）
- `BarChart.java` - 柱状图（待实现）
- `LineChart.java` - 折线图（待实现）

#### Journal 模块
- `JournalPanel.java` - 日记面板
- `JournalEditor.java` - 编辑器（待实现）
- `TagManager.java` - 标签管理（待实现）

#### API 模块
- `ApiClient.java` - REST API 客户端
- `TaskApiClient.java` - 任务 API（待实现）
- `TimelineApiClient.java` - 时间线 API（待实现）
- `PomodoroApiClient.java` - 番茄钟 API（待实现）
- `AnalyticsApiClient.java` - 统计 API（待实现）
- `JournalApiClient.java` - 日记 API（待实现）

### 1.2 后端模块 (asteritime-server)

#### Controller 层
- `TaskController.java` - 任务 REST API
- `TimelineController.java` - 时间线 API（待实现）
- `PomodoroController.java` - 番茄钟 API（待实现）
- `AnalyticsController.java` - 统计 API（待实现）
- `JournalController.java` - 日记 API（待实现）
- `ImportExportController.java` - 导入导出 API（待实现）

#### Service 层
- `TaskService.java` - 任务业务逻辑
- `TimelineService.java` - 时间线业务逻辑（待实现）
- `PomodoroService.java` - 番茄钟业务逻辑（待实现）
- `AnalyticsService.java` - 统计分析逻辑（待实现）
- `JournalService.java` - 日记业务逻辑（待实现）
- `ImportExportService.java` - 导入导出逻辑（待实现）

#### Repository 层
- `TaskRepository.java` - 任务数据访问
- `FocusSessionRepository.java` - 专注会话数据访问
- `JournalEntryRepository.java` - 日记数据访问

### 1.3 共享模块 (asteritime-common)

#### Model 层
- `Task.java` - 任务实体
- `FocusSession.java` - 专注会话实体
- `JournalEntry.java` - 日记条目实体

#### DTO 层（待实现）
- `TaskDTO.java` - 任务数据传输对象
- `AnalyticsDTO.java` - 统计数据传输对象

## 2. 数据库设计

### 2.1 表结构

#### tasks 表
- id (BIGINT, PK, AUTO_INCREMENT)
- title (VARCHAR(255), NOT NULL)
- description (TEXT)
- quadrant (INT, NOT NULL) - 1-4
- category (VARCHAR(100))
- status (VARCHAR(20), NOT NULL) - BACKLOG/TODO/DOING/DONE
- start_time (DATETIME)
- end_time (DATETIME)
- due_time (DATETIME)
- spent_time (INT) - 分钟
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME)

#### focus_sessions 表
- id (BIGINT, PK, AUTO_INCREMENT)
- start_time (DATETIME, NOT NULL)
- end_time (DATETIME, NOT NULL)
- duration (INT, NOT NULL) - 分钟
- type (VARCHAR(20), NOT NULL) - FOCUS/SHORT_BREAK/LONG_BREAK
- task_id (BIGINT, FK -> tasks.id)
- created_at (DATETIME, NOT NULL)

#### journal_entries 表
- id (BIGINT, PK, AUTO_INCREMENT)
- date (DATE, NOT NULL, UNIQUE)
- content (TEXT)
- tags (VARCHAR(500))
- encrypted (BOOLEAN)
- created_at (DATETIME, NOT NULL)
- updated_at (DATETIME)

### 2.2 索引
- tasks: quadrant, status, category, start_time
- focus_sessions: start_time, task_id
- journal_entries: date, tags

## 3. API 设计

### 3.1 Task API
- `GET /api/tasks` - 获取所有任务
- `GET /api/tasks/{id}` - 获取单个任务
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务
- `GET /api/tasks/quadrant/{quadrant}` - 按象限查询
- `GET /api/tasks/status/{status}` - 按状态查询

### 3.2 Timeline API（待实现）
- `GET /api/timeline?date={date}` - 获取某日时间线
- `POST /api/timeline/tasks/{id}/time` - 更新任务时间

### 3.3 Pomodoro API（待实现）
- `POST /api/pomodoro/sessions` - 创建专注会话
- `GET /api/pomodoro/sessions?date={date}` - 获取某日会话

### 3.4 Analytics API（待实现）
- `GET /api/analytics/quadrant?start={start}&end={end}` - 象限统计
- `GET /api/analytics/category?start={start}&end={end}` - 分类统计
- `GET /api/analytics/focus?start={start}&end={end}` - 专注时长统计

### 3.5 Journal API（待实现）
- `GET /api/journal?date={date}` - 获取日记
- `POST /api/journal` - 创建/更新日记
- `GET /api/journal/search?q={query}` - 搜索日记

## 4. 实现优先级

### Phase 1: 基础任务管理
1. ✅ 项目结构搭建
2. ✅ 数据库实体设计
3. ✅ 基础 REST API
4. ⏳ Dashboard UI（四象限 + Kanban）
5. ⏳ 任务 CRUD 功能
6. ⏳ 快速添加任务

### Phase 2: Timeline
1. ⏳ Timeline UI（24小时网格）
2. ⏳ 任务时间块显示
3. ⏳ 拖拽调整时间
4. ⏳ 重叠检测

### Phase 3: Pomodoro
1. ⏳ 番茄钟计时器
2. ⏳ 会话记录
3. ⏳ 与任务关联
4. ⏳ 写入 Timeline

### Phase 4: Analytics
1. ⏳ 统计 API
2. ⏳ 图表组件
3. ⏳ 日期过滤

### Phase 5: Journal
1. ⏳ 日记编辑器
2. ⏳ 标签系统
3. ⏳ 搜索功能
4. ⏳ 插入今日总结

### Phase 6: 导入导出 + 部署
1. ⏳ CSV/JSON 导入导出
2. ⏳ Docker 配置
3. ⏳ GCP 部署


