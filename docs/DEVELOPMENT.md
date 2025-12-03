# 开发指南

## 环境要求

- JDK 11+
- Maven 3.6+
- MySQL 8.0+
- Docker & Docker Compose（可选）

## 本地开发设置

### 1. 数据库设置

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 后端启动

```bash
cd asteritime-server
mvn spring-boot:run
```

后端将在 `http://localhost:8080/api` 启动

### 3. 前端启动

```bash
cd asteritime-client
mvn exec:java
```

## Docker 部署

```bash
cd docker
docker-compose up -d
```

## 代码规范

### 命名规范
- 类名：PascalCase（如 `TaskController`）
- 方法名：camelCase（如 `getAllTasks`）
- 常量：UPPER_SNAKE_CASE（如 `BASE_URL`）
- 包名：小写（如 `com.asteritime.client.ui`）

### 代码组织
- Controller 只负责 HTTP 请求/响应
- Service 包含业务逻辑
- Repository 只负责数据访问
- UI 组件按功能模块划分

## 测试

### 后端测试
```bash
cd asteritime-server
mvn test
```

### 前端测试
- 手动测试 UI 功能
- 集成测试 API 调用

## 常见问题

### 1. 数据库连接失败
- 检查 MySQL 是否运行
- 检查 `application.yml` 中的数据库配置

### 2. 端口被占用
- 修改 `application.yml` 中的 `server.port`
- 或修改前端 `ApiClient.java` 中的 `BASE_URL`

### 3. Maven 依赖下载失败
- 检查网络连接
- 尝试使用国内 Maven 镜像


