# 前端代码执行流程与 Token 机制详解

## 📋 目录
1. [应用启动流程](#应用启动流程)
2. [文件调用关系图](#文件调用关系图)
3. [Token 机制详解](#token-机制详解)
4. [完整登录流程](#完整登录流程)
5. [路由保护机制](#路由保护机制)

---

## 🚀 应用启动流程

### 1. 入口文件：`src/index.js`

```javascript
// 这是整个 React 应用的入口点
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

**执行顺序：**
1. 浏览器加载 `public/index.html`
2. HTML 中有一个 `<div id="root"></div>`
3. `index.js` 找到这个 div，将 React 应用渲染进去
4. 渲染 `<App />` 组件

---

### 2. 主应用组件：`src/App.js`

**作用：** 配置路由，决定显示哪个页面

**执行流程：**
```
App.js 启动
  ↓
创建 Router（路由管理器）
  ↓
配置 Routes（路由规则）
  ↓
根据当前 URL 显示对应组件
```

**路由规则：**
- `/login` → 显示 `Login` 组件（如果已登录，自动跳转到 `/dashboard`）
- `/dashboard` → 显示 `Dashboard` 组件（需要登录，未登录跳转到 `/login`）
- `/` → 自动跳转到 `/dashboard`

**关键代码解析：**

```javascript
// 检查是否已登录
isAuthenticated() ? <Navigate to="/dashboard" /> : <Login />
```
- 如果用户已登录（localStorage 中有 token），访问 `/login` 会自动跳转到 `/dashboard`
- 如果未登录，显示登录页面

```javascript
<PrivateRoute>
  <Dashboard />
</PrivateRoute>
```
- `PrivateRoute` 是一个保护组件，会检查用户是否登录
- 如果未登录，自动跳转到 `/login`

---

## 📁 文件调用关系图

```
浏览器启动
  │
  ├─ public/index.html (HTML 模板)
  │   └─ <div id="root"></div>
  │
  └─ src/index.js (入口文件)
      └─ 渲染 <App />
          │
          ├─ src/App.js (路由配置)
          │   │
          │   ├─ /login → Login 组件
          │   │   └─ src/components/Login.js
          │   │       └─ 调用 src/api/auth.js 的 login() 函数
          │   │
          │   └─ /dashboard → Dashboard 组件
          │       └─ src/components/Dashboard.js
          │           └─ 调用 src/api/auth.js 的 logout() 函数
          │
          └─ src/api/auth.js (API 和 Token 管理)
              ├─ login() - 登录，保存 token
              ├─ register() - 注册
              ├─ logout() - 登出，删除 token
              ├─ getToken() - 获取 token
              ├─ setToken() - 保存 token
              ├─ removeToken() - 删除 token
              ├─ isAuthenticated() - 检查是否登录
              └─ authenticatedFetch() - 带 token 的请求
```

---

## 🔐 Token 机制详解

### Token 是什么？

Token 是一个**字符串**，由后端服务器生成，包含用户身份信息。前端拿到后保存起来，每次请求后端 API 时都要带上这个 token，后端验证 token 后就知道是哪个用户在请求。

### Token 存储位置

**localStorage** - 浏览器的本地存储，即使关闭浏览器，token 也会保留。

### Token 管理函数（`src/api/auth.js`）

#### 1. `getToken()` - 获取 Token
```javascript
export const getToken = () => {
  return localStorage.getItem('token');
};
```
- 从 localStorage 读取 token
- 如果没有 token，返回 `null`

#### 2. `setToken(token)` - 保存 Token
```javascript
export const setToken = (token) => {
  localStorage.setItem('token', token);
};
```
- 将 token 保存到 localStorage
- 登录成功后调用

#### 3. `removeToken()` - 删除 Token
```javascript
export const removeToken = () => {
  localStorage.removeItem('token');
};
```
- 从 localStorage 删除 token
- 登出时调用

#### 4. `isAuthenticated()` - 检查是否登录
```javascript
export const isAuthenticated = () => {
  return !!getToken();  // !! 将值转换为布尔值
};
```
- 检查 localStorage 中是否有 token
- 有 token → `true`（已登录）
- 无 token → `false`（未登录）

---

### Token 在请求中的使用

#### 登录请求（不需要 Token）
```javascript
// src/api/auth.js - login()
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 注意：登录请求不需要 Authorization header
  },
  body: JSON.stringify({ email, password }),
});
```

#### 需要认证的请求（需要 Token）
```javascript
// src/api/auth.js - authenticatedFetch()
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();  // 1. 从 localStorage 获取 token
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;  // 2. 添加到请求头
  }

  return fetch(url, {
    ...options,
    headers,  // 3. 发送请求时带上 token
  });
};
```

**请求头格式：**
```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJ1c2VySWQiOjEsImV4cCI6MTY5...
```

---

## 🔄 完整登录流程

### 场景：用户打开应用并登录

```
1. 用户访问 http://localhost:3000
   ↓
2. App.js 检测到路径是 "/"
   ↓
3. 自动跳转到 "/dashboard"
   ↓
4. App.js 渲染 PrivateRoute 组件
   ↓
5. PrivateRoute 调用 isAuthenticated()
   ↓
6. isAuthenticated() 调用 getToken()
   ↓
7. getToken() 从 localStorage 读取 token
   ↓
8. 如果没有 token，返回 null
   ↓
9. isAuthenticated() 返回 false
   ↓
10. PrivateRoute 检测到未登录
   ↓
11. 自动跳转到 "/login"
   ↓
12. App.js 渲染 Login 组件
   ↓
13. 用户输入邮箱和密码，点击"登录"
   ↓
14. Login.js 的 handleSubmit() 被调用
   ↓
15. 调用 login(email, password)
   ↓
16. login() 发送 POST 请求到 /api/auth/login
    {
      email: "user@example.com",
      password: "123456"
    }
   ↓
17. 后端验证成功，返回：
    {
      token: "eyJhbGciOiJIUzUxMiJ9...",
      user: { id: 1, username: "Alice", email: "..." }
    }
   ↓
18. login() 函数接收到响应
   ↓
19. 调用 setToken(data.token) 保存 token 到 localStorage
   ↓
20. login() 返回 data
   ↓
21. Login.js 接收到登录成功的数据
   ↓
22. 调用 navigate('/dashboard') 跳转到 Dashboard
   ↓
23. App.js 检测到路径是 "/dashboard"
   ↓
24. 渲染 PrivateRoute 组件
   ↓
25. PrivateRoute 调用 isAuthenticated()
   ↓
26. isAuthenticated() 调用 getToken()
   ↓
27. getToken() 从 localStorage 读取 token（这次有值了！）
   ↓
28. isAuthenticated() 返回 true
   ↓
29. PrivateRoute 允许访问，渲染 Dashboard 组件
   ↓
30. Dashboard 显示欢迎信息
```

---

## 🛡️ 路由保护机制

### PrivateRoute 组件详解

```javascript
function PrivateRoute({ children }) {
  const authenticated = isAuthenticated();  // 检查是否登录

  if (!authenticated) {
    return <Navigate to="/login" replace />;  // 未登录 → 跳转到登录页
  }

  return children;  // 已登录 → 显示受保护的内容
}
```

**工作原理：**
1. `PrivateRoute` 是一个**包装组件**，包裹需要登录才能访问的页面
2. 每次渲染时，都会调用 `isAuthenticated()` 检查 token
3. 如果没有 token，返回 `<Navigate>` 组件，自动跳转到 `/login`
4. 如果有 token，返回 `children`（即被包裹的组件，如 Dashboard）

**使用示例：**
```javascript
// App.js
<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />  {/* 只有登录后才能看到这个组件 */}
    </PrivateRoute>
  }
/>
```

---

## 📊 Token 生命周期

```
1. 生成（后端）
   ↓
   用户登录成功
   ↓
   后端生成 JWT token
   ↓
   返回给前端：{ token: "...", user: {...} }

2. 保存（前端）
   ↓
   login() 函数接收到 token
   ↓
   调用 setToken(token)
   ↓
   保存到 localStorage

3. 使用（前端）
   ↓
   每次调用需要认证的 API
   ↓
   使用 authenticatedFetch() 或手动添加 Authorization header
   ↓
   后端验证 token，提取 userId

4. 删除（前端）
   ↓
   用户点击"登出"
   ↓
   调用 logout()
   ↓
   调用 removeToken()
   ↓
   从 localStorage 删除 token
```

---

## 🔍 关键点总结

### 1. Token 存储
- **位置：** `localStorage`
- **键名：** `'token'`
- **格式：** JWT 字符串（如：`eyJhbGciOiJIUzUxMiJ9...`）

### 2. Token 检查时机
- 访问 `/dashboard` 时（PrivateRoute）
- 访问 `/login` 时（如果已登录，跳转到 dashboard）
- 调用需要认证的 API 时

### 3. Token 传递方式
- **请求头：** `Authorization: Bearer <token>`
- **自动添加：** 使用 `authenticatedFetch()` 函数

### 4. 安全注意事项
- Token 存储在 localStorage，**不是完全安全**（XSS 攻击可能窃取）
- 生产环境建议使用 httpOnly cookie 或更安全的存储方式
- Token 有过期时间（由后端 JWT 配置决定）

---

## 🧪 测试 Token 机制

### 在浏览器控制台测试：

```javascript
// 1. 查看 token
localStorage.getItem('token')

// 2. 手动设置 token（测试用）
localStorage.setItem('token', 'test-token')

// 3. 删除 token
localStorage.removeItem('token')

// 4. 检查是否登录
!!localStorage.getItem('token')  // true = 已登录，false = 未登录
```

---

## 📝 后续开发建议

当需要调用其他需要认证的 API 时：

```javascript
import { authenticatedFetch } from '../api/auth';

// 获取任务列表
const response = await authenticatedFetch('http://localhost:8080/api/tasks');
const tasks = await response.json();

// 创建任务
const response = await authenticatedFetch('http://localhost:8080/api/tasks', {
  method: 'POST',
  body: JSON.stringify({
    title: '新任务',
    quadrant: 1,
    // ...
  }),
});
```

`authenticatedFetch()` 会自动在请求头中添加 `Authorization: Bearer <token>`！

