# AsteriTime - Daily Timeline with Pomodoro, Quadrant Tasks, Journal, and Analytics

## 项目简介

AsteriTime 是一个基于 Java 的时间管理应用，集成了：
- **Eisenhower Dashboard**：四象限任务管理
- **Day Timeline**：日程时间线视图
- **Pomodoro Timer**：番茄钟专注工具
- **Analytics**：统计分析报表
- **Journal**：日记功能

## 技术栈

### 后端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **Java** | 21 | JDK 21 (Eclipse Temurin) |
| **Spring Boot** | 2.7.14 | Web 框架 |
| **Spring Data JPA** | 2.7.14 | 数据访问层（包含 Hibernate 5.6.15.Final） |
| **MySQL Connector** | 8.0.33 | MySQL 数据库驱动 |
| **JWT (jjwt)** | 0.11.5 | JSON Web Token 认证 |
| **Spring Retry** | 2.7.14 | 乐观锁重试机制 |
| **Maven** | 3.9+ | 构建工具 |
| **Maven Compiler Plugin** | 3.11.0 | Java 编译插件 |

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **Node.js** | 18+ (推荐) | 运行时环境（最低 14+） |
| **React** | 18.2.0 | UI 框架 |
| **React DOM** | 18.2.0 | React DOM 渲染 |
| **React Router DOM** | 6.8.0 | 路由管理 |
| **React Scripts** | 5.0.1 | Create React App 构建工具 |
| **Recharts** | 3.5.1 | 图表库 |

### 数据库

| 技术 | 版本 | 说明 |
|------|------|------|
| **MySQL** | 8.0+ | 关系型数据库 |

### 容器化技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **Docker** | 20.10+ | 容器化平台 |
| **Docker Compose** | 2.0+ | 多容器编排 |
| **Nginx** | Alpine | Web 服务器（前端生产环境） |
| **Maven (Docker)** | 3.9 | 构建镜像 |
| **Eclipse Temurin** | 21 | Java 运行时镜像 |

## 快速开始

### 方式一：本地开发（推荐用于开发调试）

#### 一键启动（推荐）

```bash
# 1. 首次使用：配置环境
./asteritime.sh setup

# 2. 启动开发服务器
./asteritime.sh dev
```

就这么简单！脚本会自动：
- ✅ 检查并配置 Java 21 环境
- ✅ 检查 Maven、MySQL 等依赖
- ✅ 自动创建 `.env` 配置文件（如果不存在）
- ✅ 检查数据库连接
- ✅ 自动编译项目（首次运行）
- ✅ 启动 Spring Boot 应用和 React 开发服务器

#### 其他常用命令

```bash
# 查看日志
./asteritime.sh logs
./asteritime.sh logs -f    # 实时跟踪
./asteritime.sh logs frontend  # 前端日志

# 停止服务器
./asteritime.sh stop
./asteritime.sh stop:backend   # 只停止后端
./asteritime.sh stop:frontend  # 只停止前端

# 重新编译
./asteritime.sh build

# 清理编译产物
./asteritime.sh clean

# 查看帮助
./asteritime.sh help
```

### 方式二：Docker 容器化部署（推荐用于生产环境）

#### 前置要求

1. **安装 Docker**
   ```bash
   # macOS
   brew install --cask docker
   
   # Linux (Ubuntu/Debian)
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   ```

2. **验证安装**
   ```bash
   docker --version
   docker-compose --version
   ```

#### 快速部署

```bash
# 1. 进入 docker 目录
cd docker

# 2. 创建环境变量文件
cp .env.example .env
# 编辑 .env 文件（可选，默认值可直接使用）

# 3. 构建镜像
./docker-build.sh

# 4. 启动服务
./docker-deploy.sh
```

#### Docker 常用命令

```bash
# 查看日志
./docker-logs.sh              # 所有服务
./docker-logs.sh backend      # 后端日志
./docker-logs.sh frontend     # 前端日志

# 停止服务
./docker-stop.sh              # 停止（保留容器）
./docker-stop.sh -r           # 停止并删除容器
./docker-stop.sh -v           # 停止并删除容器和数据卷（⚠️会删除数据库）

# 查看服务状态
docker-compose ps

# 重启服务
docker-compose restart
```

#### 访问地址

启动成功后：
- **前端应用**: http://localhost:80
- **后端 API**: http://localhost:8080/api
- **MySQL**: localhost:3306

📖 **详细文档**: 查看 [Docker 部署指南](./docker/DEPLOYMENT_GUIDE.md)

## 前置要求

### 本地开发环境

#### 必需依赖

1. **Java 21**
   ```bash
   # macOS
   brew install openjdk@21
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install openjdk-21-jdk
   
   # 验证安装
   java -version
   ```

2. **Maven 3.9+**
   ```bash
   # macOS
   brew install maven
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install maven
   
   # 验证安装
   mvn -version
   ```

3. **MySQL 8.0+**
   ```bash
   # macOS
   brew install mysql
   brew services start mysql
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install mysql-server
   sudo systemctl start mysql
   
   # 验证安装
   mysql --version
   ```

4. **Node.js 18+** (前端开发需要)
   ```bash
   # macOS
   brew install node@18
   
   # Linux (Ubuntu/Debian)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 验证安装
   node --version
   npm --version
   ```

### 数据库准备

在首次启动前，需要创建数据库：

```bash
mysql -u root -p
CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

应用启动后会自动创建所有表结构（通过 Hibernate `ddl-auto: update`）。

### 环境变量配置

脚本会自动创建 `.env` 文件（从 `.env.example` 复制），你需要编辑它设置数据库密码：

```bash
# 编辑 .env 文件
DB_USERNAME=root
DB_PASSWORD=your_password  # 修改这里
JWT_SECRET=your_jwt_secret  # 生产环境必须设置（建议至少32字符）
JWT_EXPIRATION=604800000  # 7天（毫秒）
```

📖 **详细说明**: 查看 [环境变量配置指南](./ENV_SETUP.md)

## 项目结构

```
JavaFinal/
├── asteritime-client/          # React 前端模块
│   ├── src/
│   │   ├── api/                # API 调用模块
│   │   ├── components/         # React 组件
│   │   ├── config/             # 配置文件（API 地址等）
│   │   └── utils/              # 工具函数
│   ├── public/                 # 静态资源
│   └── package.json            # Node.js 依赖配置
│
├── asteritime-server/          # Spring Boot 后端模块
│   ├── src/main/java/
│   │   └── com/asteritime/server/
│   │       ├── config/         # 配置类（CORS、JWT、异步等）
│   │       ├── controller/     # REST API 控制器
│   │       ├── repository/     # 数据访问层
│   │       ├── service/        # 业务逻辑层
│   │       └── util/           # 工具类
│   ├── src/main/resources/
│   │   └── application.yml     # Spring Boot 配置
│   └── pom.xml                 # Maven 依赖配置
│
├── asteritime-common/          # 共享模块（实体类、DTO）
│   └── src/main/java/
│       └── com/asteritime/common/model/
│           ├── User.java
│           ├── Task.java
│           ├── JournalEntry.java
│           └── ...
│
├── docker/                     # Docker 容器化配置
│   ├── docker-compose.yml      # Docker Compose 配置
│   ├── .env.example            # 环境变量模板
│   ├── docker-build.sh         # 构建镜像脚本
│   ├── docker-deploy.sh        # 部署脚本
│   ├── docker-stop.sh          # 停止脚本
│   ├── docker-logs.sh          # 日志查看脚本
│   ├── DEPLOYMENT_GUIDE.md     # 部署指南
│   ├── README.md               # Docker 文档
│   ├── asteritime-server/
│   │   └── Dockerfile          # 后端 Dockerfile
│   └── asteritime-client/
│       ├── Dockerfile          # 前端 Dockerfile
│       └── nginx.conf          # Nginx 配置
│
├── docs/                       # 文档目录
│   ├── CONCURRENCY_README.md   # 多线程与并发控制实现说明
│   ├── CONCURRENCY.md          # 并发控制详细配置文档
│   ├── ARCHITECTURE.md         # 系统架构文档
│   ├── DATABASE.md             # 数据库设计文档
│   ├── DEVELOPMENT.md           # 开发指南
│   └── GCP_DEPLOYMENT.md       # GCP 部署指南
│
├── asteritime.sh               # 统一管理脚本（本地开发）
├── .env.example                # 环境变量模板
├── pom.xml                     # Maven 父 POM
└── README.md                   # 本文件
```

## 核心特性

### 多线程与并发控制

AsteriTime Server 实现了完整的多线程处理和并发控制机制：

- ✅ **多线程连接处理**：Tomcat 线程池 + HikariCP 数据库连接池
- ✅ **乐观锁机制**：防止并发更新冲突，确保数据一致性
- ✅ **自动重试**：处理短暂的并发冲突
- ✅ **事务隔离**：READ_COMMITTED 隔离级别，平衡性能与一致性
- ✅ **异步任务支持**：后台任务处理线程池

📖 **详细说明**：请查看 [多线程与并发控制实现说明](./docs/CONCURRENCY_README.md)

### 容器化部署

- ✅ **Docker Compose**：一键启动所有服务（MySQL、后端、前端）
- ✅ **多阶段构建**：优化镜像大小
- ✅ **健康检查**：自动检测服务状态
- ✅ **数据持久化**：MySQL 数据保存在 Docker 卷中
- ✅ **Nginx 反向代理**：前端生产环境使用 Nginx 提供静态文件服务

📖 **详细说明**：请查看 [Docker 部署指南](./docker/DEPLOYMENT_GUIDE.md)

## 开发计划

- **Week 1**：项目搭建 + 数据库设计 ✅
- **Week 2**：Timeline + Pomodoro ✅
- **Week 3**：图表 + 日记 + 导入导出 ✅
- **Week 4**：备份 API + Docker + GCP 部署 ✅
- **Week 5**：测试 + 修复 + 演示 🔄

## 文档

### 快速开始
- [快速开始指南](./QUICKSTART.md)
- [环境变量配置](./ENV_SETUP.md)
- [Docker 部署指南](./docker/DEPLOYMENT_GUIDE.md)

### API 文档
- [API 文档](./API_DOCUMENTATION.md)

### 技术文档
- [架构文档](./docs/ARCHITECTURE.md)
- [数据库设计](./docs/DATABASE.md)
- [多线程与并发控制](./docs/CONCURRENCY_README.md)
- [开发指南](./docs/DEVELOPMENT.md)

### 部署文档
- [GCP 部署指南](./docs/GCP_DEPLOYMENT.md)
- [Docker 文档](./docker/README.md)

### 故障排查
- [故障排查指南](./TROUBLESHOOTING.md)

## 版本信息

### 项目版本
- **当前版本**: 1.0.0
- **最后更新**: 2025-01

### 依赖版本总结

**后端核心依赖**:
- Java: 21
- Spring Boot: 2.7.14
- MySQL Connector: 8.0.33
- JWT (jjwt): 0.11.5
- Maven Compiler Plugin: 3.11.0

**前端核心依赖**:
- React: 18.2.0
- React Router DOM: 6.8.0
- React Scripts: 5.0.1
- Recharts: 3.5.1
- Node.js: 18+ (推荐)

**容器化**:
- Docker: 20.10+
- Docker Compose: 2.0+
- Nginx: Alpine (最新)
- Maven (Docker): 3.9
- Eclipse Temurin: 21

## 常见问题

### Q: 本地开发时前端无法连接后端？

**A**: 确保：
1. 后端已启动：`./asteritime.sh backend`
2. 前端使用 `npm start` 启动（会自动使用 proxy 配置）
3. 检查 `.env` 文件中的数据库配置

### Q: Docker 部署时端口被占用？

**A**: 修改 `docker/.env` 文件中的端口配置：
```bash
FRONTEND_PORT=8081
BACKEND_PORT=8081
MYSQL_PORT=3307
```

### Q: 如何更新依赖版本？

**A**: 
- **后端**: 修改 `pom.xml` 中的版本号，然后运行 `mvn clean install`
- **前端**: 修改 `package.json`，然后运行 `npm install`

## 作者

- Xucheng Huang (xh2810)
- Jia Yang (jy5081)

## 许可证

本项目为课程作业项目。
