# 快速启动指南

## 一键启动（推荐）

### macOS / Linux

```bash
# 启动所有服务（后端 + 前端）
./start.sh

# 或指定启动模式
./start.sh all      # 启动所有服务（默认）
./start.sh server   # 只启动后端
./start.sh client   # 只启动前端
./start.sh stop     # 停止所有服务

# 停止服务
./stop.sh
```

### Windows

```cmd
# 启动所有服务
start.bat

# 或指定启动模式
start.bat all      # 启动所有服务（默认）
start.bat server   # 只启动后端
start.bat client   # 只启动前端
start.bat stop     # 停止所有服务
```

## 手动启动

### 1. 启动后端

```bash
cd asteritime-server
mvn spring-boot:run
```

后端将在 `http://localhost:8080/api` 启动

### 2. 启动前端

在新的终端窗口中：

```bash
cd asteritime-client
mvn exec:java
```

## 前置要求

1. **Java 11+**
   ```bash
   java -version
   ```

2. **Maven 3.6+**
   ```bash
   mvn -version
   ```

3. **MySQL 8.0+**
   - 确保 MySQL 服务正在运行
   - 默认配置：用户名 `root`，密码 `root`
   - 数据库会自动创建（通过 Hibernate）

## 首次运行

首次运行时会自动：
- 编译所有模块
- 创建数据库表结构
- 下载 Maven 依赖（可能需要几分钟）

## 常见问题

### 1. 端口被占用

如果 8080 端口被占用，修改 `asteritime-server/src/main/resources/application.yml`：

```yaml
server:
  port: 8081  # 改为其他端口
```

### 2. MySQL 连接失败

检查 MySQL 是否运行：
```bash
# macOS
brew services list

# Linux
sudo systemctl status mysql
```

修改数据库配置：`asteritime-server/src/main/resources/application.yml`

### 3. 编译错误

清理并重新编译：
```bash
mvn clean install
```

## 查看日志

- 后端日志：`server.log`（使用脚本启动时）
- 前端日志：`client.log`（使用脚本启动时）
- 控制台输出：直接运行 Maven 命令时在终端显示

