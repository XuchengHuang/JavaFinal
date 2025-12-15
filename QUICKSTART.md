# AsteriTime 快速开始指南

## 快速启动

### 推荐方式：分别启动（便于调试）

**首次使用：**
```bash
# 1. 配置环境（检查依赖、设置环境变量）
./asteritime.sh setup
```

**日常开发（推荐）：**
```bash
# 终端1: 启动后端
./asteritime.sh backend

# 终端2: 启动前端
./asteritime.sh frontend
```

这样可以在两个终端分别查看日志和调试。

### 或者：一次性启动（后台运行）

```bash
# 启动所有服务（后台运行）
./asteritime.sh dev

# 查看日志
./asteritime.sh logs          # 后端日志
./asteritime.sh logs frontend # 前端日志

# 停止服务器
./asteritime.sh stop
```

## 数据库准备

在启动应用前，确保 MySQL 数据库已创建：

```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

应用启动后会自动创建表结构。

## 完整命令列表

运行 `./asteritime.sh help` 查看所有可用命令。

## 环境配置

1. **复制环境变量模板**
   ```bash
   cp .env.example .env
   ```

2. **编辑 .env 文件**
   ```bash
   # 设置数据库密码
   DB_PASSWORD=your_password
   
   # 设置 JWT 密钥（生产环境必须）
   JWT_SECRET=your_very_long_secret_key
   ```

3. **运行配置检查**
   ```bash
   ./asteritime.sh setup
   ```

## 常见问题

### Java 版本问题

如果提示找不到 Java 21：

**macOS:**
```bash
brew install openjdk@21
```

**Linux:**
```bash
sudo apt-get install openjdk-21-jdk
```

### 数据库连接失败

1. 确保 MySQL 已启动
2. 检查 `.env` 文件中的 `DB_PASSWORD` 是否正确
3. 如果使用 Docker，数据库会自动启动

### 端口被占用

如果 8080 端口被占用，可以：
1. 停止占用端口的进程
2. 或修改 `application.yml` 中的端口配置

## 更多文档

- [环境变量配置](ENV_SETUP.md)
- [GCP 部署指南](docs/GCP_DEPLOYMENT.md)
- [API 文档](API_DOCUMENTATION.md)
- [架构文档](docs/ARCHITECTURE.md)
