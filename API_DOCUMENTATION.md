# AsteriTime API 接口文档

**Base URL**: `http://localhost:8080/api`

**说明**：
- 所有需要认证的接口都需要在 Header 中携带：`Authorization: Bearer <token>`
- `userId` 会自动从 token 中提取，无需手动传递
- 所有时间格式使用 ISO 8601：`2025-12-06T00:00:00` 或 `2025-12-06`

---

## 一、认证相关接口（Auth）

| 接口路径 | HTTP 方法 | 需要 Token | 请求参数/请求体 | 返回内容 | 状态码 |
|---------|----------|-----------|----------------|---------|--------|
| `/auth/register` | POST | ❌ 否 | **请求体**：<br>`{`<br>`  "username": "Alice",`<br>`  "email": "alice@example.com",`<br>`  "password": "123456"`<br>`}` | **成功**：`User` 对象<br>`{`<br>`  "id": 1,`<br>`  "username": "Alice",`<br>`  "email": "alice@example.com",`<br>`  ...`<br>`}` | 201 Created<br>400 Bad Request（邮箱重复） |
| `/auth/login` | POST | ❌ 否 | **请求体**：<br>`{`<br>`  "email": "alice@example.com",`<br>`  "password": "123456"`<br>`}` | **成功**：<br>`{`<br>`  "token": "eyJhbGciOiJIUzUxMiJ9...",`<br>`  "user": { ... }`<br>`}` | 200 OK<br>401 Unauthorized（密码错误） |
| `/auth/logout` | POST | ✅ 是 | 无 | **成功**：<br>`{`<br>`  "message": "Logout successful"`<br>`}` | 200 OK<br>401 Unauthorized |

---

## 二、任务相关接口（Tasks）

| 接口路径 | HTTP 方法 | 需要 Token | 请求参数/请求体 | 返回内容 | 状态码 |
|---------|----------|-----------|----------------|---------|--------|
| `/tasks` | GET | ✅ 是 | **查询参数**（全部可选，可组合）：<br>- `quadrant`: 四象限（1-4）<br>- `categoryId`: 类别ID<br>- `status`: 状态（DELAY, TODO, DOING, DONE, CANCEL）<br>- `startTime`: 开始时间（ISO 8601）<br>- `endTime`: 结束时间（ISO 8601）<br><br>**示例**：<br>`/tasks?quadrant=1`<br>`/tasks?status=TODO`<br>`/tasks?quadrant=1&status=DOING`<br>`/tasks?startTime=2025-12-06T00:00:00&endTime=2025-12-06T23:59:59` | **成功**：`Task[]` 数组<br>`[{`<br>`  "id": 1,`<br>`  "title": "...",`<br>`  "quadrant": 1,`<br>`  "status": "TODO",`<br>`  ...`<br>`}]` | 200 OK<br>400 Bad Request（参数错误）<br>401 Unauthorized |
| `/tasks/{id}` | GET | ✅ 是 | **路径参数**：<br>- `id`: 任务ID | **成功**：`Task` 对象 | 200 OK<br>404 Not Found<br>401 Unauthorized |
| `/tasks` | POST | ✅ 是 | **请求体**：<br>`{`<br>`  "title": "完成项目报告",`<br>`  "description": "需要完成本周的项目总结报告",`<br>`  "quadrant": 1,`<br>`  "type": { "id": 1 },`<br>`  "recurrenceRule": { "id": 1 },`<br>`  "status": "TODO",`<br>`  "plannedStartTime": "2025-12-06T09:00:00",`<br>`  "plannedEndTime": "2025-12-06T17:00:00"`<br>`}`<br><br>**注意**：`userId` 自动从 token 获取 | **成功**：创建的 `Task` 对象 | 201 Created<br>400 Bad Request<br>401 Unauthorized |
| `/tasks/{id}` | PUT | ✅ 是 | **路径参数**：<br>- `id`: 任务ID<br><br>**请求体**：<br>`{`<br>`  "title": "完成项目报告（已修改）",`<br>`  "status": "DOING",`<br>`  ...`<br>`}`<br><br>**注意**：`userId` 自动从 token 获取 | **成功**：更新后的 `Task` 对象 | 200 OK<br>404 Not Found<br>401 Unauthorized |
| `/tasks/{id}` | DELETE | ✅ 是 | **路径参数**：<br>- `id`: 任务ID | 无响应体 | 204 No Content<br>404 Not Found<br>401 Unauthorized |

---

## 三、日记相关接口（Journal Entries）

| 接口路径 | HTTP 方法 | 需要 Token | 请求参数/请求体 | 返回内容 | 状态码 |
|---------|----------|-----------|----------------|---------|--------|
| `/journal-entries` | GET | ✅ 是 | 无 | **成功**：`JournalEntry[]` 数组<br>`[{`<br>`  "id": 1,`<br>`  "date": "2025-12-05",`<br>`  "totalFocusMinutes": 120,`<br>`  "evaluation": "...",`<br>`  ...`<br>`}]`<br><br>**按日期倒序排列** | 200 OK<br>401 Unauthorized |
| `/journal-entries/today` | GET | ✅ 是 | 无 | **成功**：当天的 `JournalEntry`<br>如果不存在则自动创建（`totalFocusMinutes=0`） | 200 OK<br>401 Unauthorized |
| `/journal-entries/focus-time` | GET | ✅ 是 | **查询参数**：<br>- `date`: 日期（格式：`2025-12-03`） | **成功**：`Integer`（分钟数）<br>如果当天没有记录，返回 `0` | 200 OK<br>400 Bad Request<br>401 Unauthorized |
| `/journal-entries/focus-time` | POST | ✅ 是 | **请求体**：<br>`{`<br>`  "date": "2025-12-03",`<br>`  "focusMinutes": 25`<br>`}`<br><br>**注意**：`userId` 自动从 token 获取 | **成功**：更新后的 `JournalEntry`<br>（`totalFocusMinutes` 已累加） | 200 OK<br>400 Bad Request<br>401 Unauthorized |
| `/journal-entries/evaluation` | GET | ✅ 是 | **查询参数**：<br>- `date`: 日期（格式：`2025-12-03`） | **成功**：`JournalEntry` 对象<br>（包含 `evaluation` 字段） | 200 OK<br>404 Not Found<br>401 Unauthorized |
| `/journal-entries/evaluation` | PUT | ✅ 是 | **请求体**：<br>`{`<br>`  "date": "2025-12-03",`<br>`  "evaluation": "今天状态不错，完成了所有计划。"`<br>`}`<br><br>**注意**：`userId` 自动从 token 获取 | **成功**：更新后的 `JournalEntry` | 200 OK<br>400 Bad Request<br>401 Unauthorized |

---

## 四、任务类别相关接口（Task Categories）

| 接口路径 | HTTP 方法 | 需要 Token | 请求参数/请求体 | 返回内容 | 状态码 |
|---------|----------|-----------|----------------|---------|--------|
| `/task-categories` | GET | ✅ 是 | 无 | **成功**：`TaskCategory[]` 数组<br>`[{`<br>`  "id": 1,`<br>`  "name": "工作",`<br>`  ...`<br>`}]` | 200 OK<br>401 Unauthorized |
| `/task-categories/{id}` | GET | ✅ 是 | **路径参数**：<br>- `id`: 类别ID | **成功**：`TaskCategory` 对象 | 200 OK<br>404 Not Found<br>401 Unauthorized |
| `/task-categories` | POST | ✅ 是 | **请求体**：<br>`{`<br>`  "name": "工作"`<br>`}`<br><br>**注意**：`userId` 自动从 token 获取 | **成功**：创建的 `TaskCategory` 对象 | 201 Created<br>400 Bad Request（名称重复）<br>401 Unauthorized |
| `/task-categories/{id}` | DELETE | ✅ 是 | **路径参数**：<br>- `id`: 类别ID | 无响应体 | 204 No Content<br>404 Not Found<br>401 Unauthorized |

---

## 五、重复规则相关接口（Task Recurrence Rules）

| 接口路径 | HTTP 方法 | 需要 Token | 请求参数/请求体 | 返回内容 | 状态码 |
|---------|----------|-----------|----------------|---------|--------|
| `/task-recurrence-rules` | GET | ✅ 是 | 无 | **成功**：`TaskRecurrenceRule[]` 数组<br>`[{`<br>`  "id": 1,`<br>`  "frequencyExpression": "1/day",`<br>`  ...`<br>`}]` | 200 OK<br>401 Unauthorized |
| `/task-recurrence-rules/{id}` | GET | ✅ 是 | **路径参数**：<br>- `id`: 规则ID | **成功**：`TaskRecurrenceRule` 对象 | 200 OK<br>404 Not Found<br>401 Unauthorized |
| `/task-recurrence-rules` | POST | ✅ 是 | **请求体**：<br>`{`<br>`  "frequencyExpression": "1/day"`<br>`}`<br><br>**注意**：`userId` 自动从 token 获取<br><br>**示例值**：<br>- `"1/day"` → 一天一次<br>- `"2/day"` → 一天两次<br>- `"1/week"` → 一周一次 | **成功**：创建的 `TaskRecurrenceRule` 对象 | 201 Created<br>400 Bad Request（表达式重复）<br>401 Unauthorized |
| `/task-recurrence-rules/{id}` | DELETE | ✅ 是 | **路径参数**：<br>- `id`: 规则ID | 无响应体 | 204 No Content<br>404 Not Found<br>401 Unauthorized |

---

## 六、数据模型说明

### Task（任务）
```json
{
  "id": 1,
  "title": "完成项目报告",
  "description": "需要完成本周的项目总结报告",
  "quadrant": 1,
  "type": {
    "id": 1,
    "name": "工作"
  },
  "recurrenceRule": {
    "id": 1,
    "frequencyExpression": "1/day"
  },
  "status": "TODO",
  "plannedStartTime": "2025-12-06T09:00:00",
  "plannedEndTime": "2025-12-06T17:00:00",
  "actualEndTime": null,
  "createdAt": "2025-12-05T10:00:00",
  "updatedAt": "2025-12-05T10:00:00"
}
```

### JournalEntry（日记）
```json
{
  "id": 1,
  "date": "2025-12-05",
  "totalFocusMinutes": 120,
  "evaluation": "今天状态不错，完成了所有计划。",
  "createdAt": "2025-12-05T08:00:00",
  "updatedAt": "2025-12-05T20:00:00"
}
```

### TaskCategory（任务类别）
```json
{
  "id": 1,
  "name": "工作",
  "createdAt": "2025-12-05T10:00:00",
  "updatedAt": "2025-12-05T10:00:00"
}
```

### TaskRecurrenceRule（重复规则）
```json
{
  "id": 1,
  "frequencyExpression": "1/day",
  "createdAt": "2025-12-05T10:00:00",
  "updatedAt": "2025-12-05T10:00:00"
}
```

### User（用户）
```json
{
  "id": 1,
  "username": "Alice",
  "email": "alice@example.com",
  "createdAt": "2025-12-01T10:00:00",
  "updatedAt": "2025-12-01T10:00:00"
}
```

---

## 七、状态码说明

| 状态码 | 含义 | 常见场景 |
|--------|------|---------|
| 200 OK | 请求成功 | GET、PUT、POST（某些接口） |
| 201 Created | 资源创建成功 | POST 创建资源 |
| 204 No Content | 删除成功 | DELETE |
| 400 Bad Request | 请求参数错误 | 参数格式错误、重复值等 |
| 401 Unauthorized | 未授权 | Token 缺失、无效或过期 |
| 404 Not Found | 资源不存在 | 查询不存在的资源 |

---

## 八、常见错误处理

### 1. Token 相关错误
- **401 Unauthorized**：Token 缺失、无效或过期
- **解决方案**：重新登录获取新 token

### 2. 参数验证错误
- **400 Bad Request**：
  - `quadrant` 不在 1-4 范围内
  - `status` 不是有效的枚举值
  - 时间格式错误
  - 时间范围不完整（只有 startTime 或只有 endTime）

### 3. 资源不存在
- **404 Not Found**：查询的资源不存在或不属于当前用户

### 4. 重复值错误
- **400 Bad Request**：
  - 注册时邮箱已存在
  - 创建类别时名称已存在（同一用户下）
  - 创建重复规则时表达式已存在（同一用户下）

---

## 九、前端调用示例

### JavaScript / Fetch API
```javascript
// 1. 登录获取 token
const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'alice@example.com',
    password: '123456'
  })
});
const { token, user } = await loginResponse.json();

// 2. 保存 token（localStorage）
localStorage.setItem('token', token);

// 3. 调用需要认证的接口
const tasksResponse = await fetch('http://localhost:8080/api/tasks?quadrant=1&status=TODO', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const tasks = await tasksResponse.json();

// 4. 创建任务
const createTaskResponse = await fetch('http://localhost:8080/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: '完成项目报告',
    quadrant: 1,
    status: 'TODO',
    plannedStartTime: '2025-12-06T09:00:00',
    plannedEndTime: '2025-12-06T17:00:00'
  })
});
const newTask = await createTaskResponse.json();
```

---

## 十、接口总结

| 模块 | 接口数量 | 主要功能 |
|------|---------|---------|
| 认证（Auth） | 3 | 注册、登录、登出 |
| 任务（Tasks） | 5 | 查询（支持多条件）、创建、更新、删除 |
| 日记（Journal） | 6 | 查询所有、初始化当天、查询/累加专注时间、查询/更新评价 |
| 任务类别（Categories） | 4 | 查询、创建、删除 |
| 重复规则（Recurrence Rules） | 4 | 查询、创建、删除 |
| **总计** | **22** | - |

---

**最后更新**：2025-12-06

