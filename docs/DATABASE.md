# 数据库配置指南

## 配置文件位置

数据库连接配置在：
```
asteritime-server/src/main/resources/application.yml
```

## 默认配置

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/asteritime?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
```

## 配置说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `url` | 数据库连接 URL | `jdbc:mysql://localhost:3306/asteritime` |
| `username` | 数据库用户名 | `root` |
| `password` | 数据库密码 | `root` |
| `driver-class-name` | JDBC 驱动类 | `com.mysql.cj.jdbc.Driver` |

## 设置步骤

### 1. 安装 MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

**Windows:**
- 下载 MySQL Installer: https://dev.mysql.com/downloads/installer/

### 2. 创建数据库

```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选）
CREATE USER 'asteritime'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON asteritime.* TO 'asteritime'@'localhost';
FLUSH PRIVILEGES;

# 退出
exit;
```

### 3. 修改配置文件

编辑 `asteritime-server/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/asteritime?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8
    username: asteritime        # 修改为你的用户名
    password: your_password     # 修改为你的密码
```

### 4. 自动创建表结构

配置中已设置 `ddl-auto: update`，应用启动时会自动创建表：

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # 自动创建/更新表结构
```

**可选值：**
- `update`: 自动创建/更新表（开发环境推荐）
- `create`: 每次启动删除并重新创建表
- `create-drop`: 启动时创建，关闭时删除
- `validate`: 只验证表结构，不修改
- `none`: 不执行任何操作（生产环境推荐）

## 数据库表结构

应用会自动创建以下表：

### tasks 表
- 存储任务信息
- 包含：id, title, description, quadrant, category, status, start_time, end_time, due_time, spent_time 等

### focus_sessions 表
- 存储番茄钟专注会话
- 包含：id, start_time, end_time, duration, type, task_id 等

### journal_entries 表
- 存储日记条目
- 包含：id, date, content, tags, encrypted 等

## 验证连接

### 方法 1: 查看启动日志

```bash
./start.sh server
# 查看日志中是否有数据库连接成功的信息
```

### 方法 2: 测试 API

```bash
# 启动后端后
curl http://localhost:8080/api/tasks
```

### 方法 3: 直接连接数据库

```bash
mysql -u root -p asteritime
SHOW TABLES;
```

## 常见问题

### 1. 连接被拒绝

**错误信息：** `Communications link failure`

**解决方法：**
- 检查 MySQL 服务是否运行：`brew services list` (macOS) 或 `sudo systemctl status mysql` (Linux)
- 检查端口是否正确（默认 3306）
- 检查防火墙设置

### 2. 认证失败

**错误信息：** `Access denied for user`

**解决方法：**
- 检查用户名和密码是否正确
- 检查用户是否有权限访问数据库
- 尝试使用 root 用户连接

### 3. 数据库不存在

**错误信息：** `Unknown database 'asteritime'`

**解决方法：**
```bash
mysql -u root -p
CREATE DATABASE asteritime;
```

### 4. 时区问题

**错误信息：** `The server time zone value 'xxx' is unrecognized`

**解决方法：**
在连接 URL 中添加时区参数（已包含）：
```
?serverTimezone=UTC
```

## 生产环境配置

生产环境建议：

1. **使用环境变量：**
```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/asteritime}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:root}
```

2. **使用连接池：**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
```

3. **禁用自动创建表：**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate  # 或 none
```

4. **使用配置文件加密：**
- 使用 Spring Cloud Config
- 使用 Jasypt 加密敏感信息

