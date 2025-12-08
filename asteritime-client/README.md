# AsteriTime 前端客户端

React 前端应用，用于连接 AsteriTime 后端 API。

## 功能

- ✅ 用户登录/注册
- ✅ Token 管理（自动保存到 localStorage）
- ✅ 登录后跳转到 Dashboard
- ✅ 路由保护（未登录自动跳转到登录页）

## 安装和运行

### 1. 安装依赖

```bash
cd asteritime-client
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

应用将在 `http://localhost:3000` 启动。

### 3. 确保后端服务器运行

后端服务器需要运行在 `http://localhost:8080/api`

## 项目结构

```
asteritime-client/
├── public/
│   └── index.html          # HTML 模板
├── src/
│   ├── api/
│   │   └── auth.js        # API 调用函数（登录、注册、token 管理）
│   ├── components/
│   │   ├── Login.js       # 登录组件
│   │   ├── Login.css      # 登录样式
│   │   ├── Dashboard.js    # Dashboard 占位页面
│   │   ├── Dashboard.css  # Dashboard 样式
│   │   └── PrivateRoute.js # 路由保护组件
│   ├── App.js             # 主应用组件（路由配置）
│   ├── App.css            # 应用样式
│   ├── index.js           # 入口文件
│   └── index.css          # 全局样式
├── package.json
└── README.md
```

## API 配置

API 基础 URL 配置在 `src/api/auth.js` 中：

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

如果需要修改后端地址，请更新此文件。

## Token 管理

- Token 自动保存到 `localStorage`
- 所有需要认证的请求会自动在 Header 中添加 `Authorization: Bearer <token>`
- 使用 `authenticatedFetch()` 函数可以自动添加认证头

## 下一步

- [ ] 完善 Dashboard 功能
- [ ] 添加任务管理界面
- [ ] 添加日记功能
- [ ] 添加数据分析功能

