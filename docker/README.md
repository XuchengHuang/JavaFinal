# AsteriTime Docker 容器化部署指南

本目录包含 AsteriTime 项目的 Docker 容器化配置和部署脚本。

## 目录结构

```
docker/
├── docker-compose.yml          # Docker Compose 配置文件
├── .env.example                # 环境变量模板文件
├── docker-build.sh             # 构建Docker镜像脚本
├── docker-deploy.sh            # 部署服务脚本
├── docker-stop.sh              # 停止服务脚本
├── docker-logs.sh              # 查看日志脚本
├── init.sql                    # MySQL初始化脚本
├── asteritime-server/
│   └── Dockerfile              # 后端Dockerfile
└── asteritime-client/
    ├── Dockerfile              # 前端Dockerfile
    └── nginx.conf              # Nginx配置文件
```

## 快速开始

### 1. 准备环境变量

复制环境变量模板文件：

```bash
cd docker
cp .env.example .env
```

根据需要修改 `.env` 文件中的配置（数据库密码、JWT密钥等）。

### 2. 构建镜像

```bash
# 构建所有镜像
./docker-build.sh

# 或单独构建某个服务
./docker-build.sh backend
./docker-build.sh frontend
```

### 3. 启动服务

```bash
# 后台启动（推荐）
./docker-deploy.sh

# 前台启动（查看实时日志）
./docker-deploy.sh -f

# 重新构建并启动
./docker-deploy.sh --build

# 强制重新构建（不使用缓存）
./docker-deploy.sh --rebuild
```

### 4. 查看日志

```bash
# 查看所有服务日志（实时跟踪）
./docker-logs.sh

# 查看特定服务日志
./docker-logs.sh backend
./docker-logs.sh frontend
./docker-logs.sh mysql

# 查看最后100行日志（不跟踪）
./docker-logs.sh --tail 100
```

### 5. 停止服务

```bash
# 停止服务（保留容器）
./docker-stop.sh

# 停止并删除容器
./docker-stop.sh -r

# 停止并删除容器和数据卷（⚠️ 会删除数据库数据！）
./docker-stop.sh -v
```

## 环境变量配置

### 必需配置

在 `.env` 文件中配置以下变量：

```bash
# MySQL配置
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_USER=asteritime
MYSQL_PASSWORD=asteritime_password

# 数据库连接配置（后端使用）
DB_USERNAME=root
DB_PASSWORD=your_secure_password

# JWT配置（生产环境必须修改！）
JWT_SECRET=your_very_long_and_secure_jwt_secret_key
JWT_EXPIRATION=604800000  # 7天（毫秒）

# 端口配置
BACKEND_PORT=8080
FRONTEND_PORT=80
MYSQL_PORT=3306

# 前端API地址
# 容器化部署时，前端通过nginx代理访问后端，使用 /api
REACT_APP_API_URL=/api
```

### 生产环境注意事项

1. **修改默认密码**：必须修改 `MYSQL_ROOT_PASSWORD` 和 `DB_PASSWORD`
2. **修改JWT密钥**：必须修改 `JWT_SECRET` 为强随机字符串
3. **端口配置**：根据实际需求调整端口映射
4. **数据持久化**：MySQL数据存储在Docker卷中，确保定期备份

## 服务访问地址

启动成功后，可以通过以下地址访问：

- **前端应用**: http://localhost:80
- **后端 API**: http://localhost:8080/api
- **MySQL**: localhost:3306

## 常用命令

### Docker Compose 命令

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service]

# 重启服务
docker-compose restart [service]

# 进入容器
docker-compose exec backend bash
docker-compose exec mysql mysql -u root -p

# 查看资源使用
docker stats
```

### 数据库管理

```bash
# 连接MySQL
docker-compose exec mysql mysql -u root -p

# 备份数据库
docker-compose exec mysql mysqldump -u root -p asteritime > backup.sql

# 恢复数据库
docker-compose exec -T mysql mysql -u root -p asteritime < backup.sql
```

## 故障排查

### 1. 服务无法启动

```bash
# 查看日志
./docker-logs.sh

# 检查容器状态
docker-compose ps

# 检查端口占用
lsof -i :80
lsof -i :8080
lsof -i :3306
```

### 2. 数据库连接失败

- 检查 MySQL 容器是否正常运行：`docker-compose ps mysql`
- 检查环境变量配置是否正确
- 查看 MySQL 日志：`./docker-logs.sh mysql`

### 3. 前端无法访问后端

- 检查后端是否正常运行：`curl http://localhost:8080/api/auth/login`
- 检查前端nginx配置是否正确
- 查看前端日志：`./docker-logs.sh frontend`

### 4. 镜像构建失败

- 检查网络连接（需要下载依赖）
- 清理Docker缓存：`docker system prune -a`
- 使用 `--rebuild` 选项强制重新构建

## 生产环境部署

### 1. 使用外部数据库

修改 `docker-compose.yml`，移除 MySQL 服务，配置外部数据库连接：

```yaml
backend:
  environment:
    SPRING_DATASOURCE_URL: jdbc:mysql://your-db-host:3306/asteritime?...
```

### 2. 使用 HTTPS

- 配置 Nginx SSL 证书
- 更新 `nginx.conf` 添加 SSL 配置
- 配置反向代理

### 3. 数据备份

设置定期备份脚本：

```bash
#!/bin/bash
docker-compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD asteritime > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. 监控和日志

- 配置日志收集（如 ELK、Loki）
- 设置监控告警
- 定期检查容器资源使用情况

## 架构说明

### 服务架构

```
┌─────────────┐
│   Frontend  │ (Nginx + React)
│   Port: 80  │
└──────┬──────┘
       │ /api
       ▼
┌─────────────┐
│   Backend   │ (Spring Boot)
│  Port: 8080 │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    MySQL    │
│  Port: 3306 │
└─────────────┘
```

### 网络架构

所有服务运行在 `asteritime-network` 网络中，通过服务名互相访问：
- 前端通过 `http://backend:8080` 访问后端
- 后端通过 `mysql:3306` 访问数据库

## 更新和维护

### 更新应用

```bash
# 1. 停止服务
./docker-stop.sh

# 2. 拉取最新代码
cd ..
git pull

# 3. 重新构建并启动
cd docker
./docker-deploy.sh --rebuild
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a --volumes
```

## 参考文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目主 README](../README.md)
- [GCP 部署指南](../docs/GCP_DEPLOYMENT.md)

