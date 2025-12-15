# GCP 部署指南

## 数据库配置说明

### 重要澄清

**Hibernate 的 `ddl-auto: update` 只能创建/更新表结构，不能创建数据库本身！**

- ✅ **可以自动创建**：表（tables）、列（columns）、索引（indexes）
- ❌ **不能自动创建**：数据库（database）本身

### 当前配置

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # 只能创建表，不能创建数据库
```

这意味着：
1. **数据库必须已经存在**（如 `asteritime`）
2. Hibernate 会自动创建表结构（如 `tasks`, `users`, `journal_entries` 等）
3. 如果表已存在，Hibernate 会更新表结构（添加新列等）

## GCP 部署选项

### 方案 1：使用 Cloud SQL（推荐 ⭐）

**优点：**
- ✅ 完全托管的 MySQL 服务
- ✅ 自动备份和恢复
- ✅ 高可用性和可扩展性
- ✅ 自动安全补丁更新
- ✅ 与 GCP 其他服务集成良好

**步骤：**

1. **创建 Cloud SQL 实例**
   ```bash
   gcloud sql instances create asteritime-db \
     --database-version=MYSQL_8_0 \
     --tier=db-f1-micro \
     --region=asia-east1 \
     --root-password=your_secure_password
   ```

2. **创建数据库**
   ```bash
   gcloud sql databases create asteritime \
     --instance=asteritime-db
   ```

3. **创建用户（可选）**
   ```bash
   gcloud sql users create asteritime_user \
     --instance=asteritime-db \
     --password=user_password
   ```

4. **配置应用连接**
   
   修改 `application.yml` 或使用环境变量：
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql:///asteritime?cloudSqlInstance=PROJECT_ID:REGION:INSTANCE_NAME&socketFactory=com.google.cloud.sql.mysql.SocketFactory
       username: ${DB_USERNAME}
       password: ${DB_PASSWORD}
   ```

5. **添加 Cloud SQL JDBC Socket Factory 依赖**
   
   在 `pom.xml` 中添加：
   ```xml
   <dependency>
     <groupId>com.google.cloud.sql</groupId>
     <artifactId>mysql-socket-factory-connector-j-8</artifactId>
     <version>1.11.2</version>
   </dependency>
   ```

### 方案 2：在同一 VM 上安装 MySQL（不推荐）

**优点：**
- ✅ 简单快速
- ✅ 成本较低（不需要单独的 Cloud SQL 实例）

**缺点：**
- ❌ 需要自己管理数据库
- ❌ 没有自动备份
- ❌ 需要手动处理安全更新
- ❌ 单点故障风险

**步骤：**

1. **在 VM 上安装 MySQL**
   ```bash
   sudo apt-get update
   sudo apt-get install mysql-server
   sudo systemctl start mysql
   sudo systemctl enable mysql
   ```

2. **创建数据库**
   ```bash
   mysql -u root -p
   CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   exit
   ```

3. **配置应用连接**
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/asteritime?useSSL=false&serverTimezone=UTC
       username: ${DB_USERNAME:root}
       password: ${DB_PASSWORD}
   ```

### 方案 3：使用 Cloud SQL Proxy（推荐用于开发/测试）

**优点：**
- ✅ 可以像连接本地数据库一样连接 Cloud SQL
- ✅ 不需要修改应用代码
- ✅ 自动处理 SSL 连接

**步骤：**

1. **下载 Cloud SQL Proxy**
   ```bash
   wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
   chmod +x cloud_sql_proxy
   ```

2. **启动 Proxy**
   ```bash
   ./cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:3306
   ```

3. **应用连接本地 3306 端口**（Proxy 会转发到 Cloud SQL）

## 推荐配置

### 生产环境

**强烈推荐使用 Cloud SQL**，配置如下：

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql:///asteritime?cloudSqlInstance=${CLOUD_SQL_INSTANCE}&socketFactory=com.google.cloud.sql.mysql.SocketFactory
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate  # 生产环境建议使用 validate，不自动修改表结构
```

### 开发/测试环境

可以使用 Cloud SQL Proxy 或本地 MySQL。

## 环境变量配置

在 GCP 部署时，通过环境变量设置：

```bash
# Cloud SQL 实例连接名称
CLOUD_SQL_INSTANCE=project-id:region:instance-name

# 数据库配置
DB_USERNAME=asteritime_user
DB_PASSWORD=your_secure_password

# JWT 配置
JWT_SECRET=your_production_jwt_secret
```

## 部署检查清单

- [ ] 创建 Cloud SQL 实例（或安装 MySQL）
- [ ] 创建数据库 `asteritime`
- [ ] 创建数据库用户（可选）
- [ ] 配置防火墙规则（允许应用访问数据库）
- [ ] 设置环境变量（DB_USERNAME, DB_PASSWORD, JWT_SECRET）
- [ ] 测试数据库连接
- [ ] 验证表结构自动创建
- [ ] 配置自动备份（Cloud SQL 自动，VM 需要手动）

## 常见问题

### Q: 应用启动时提示 "Unknown database 'asteritime'"

**A:** 需要先创建数据库。Hibernate 只能创建表，不能创建数据库。

```sql
CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Q: 生产环境应该使用 `ddl-auto: update` 吗？

**A:** 不建议。生产环境应该使用：
- `validate`: 只验证表结构，不修改
- `none`: 不执行任何操作

表结构应该通过数据库迁移工具（如 Flyway 或 Liquibase）管理。

### Q: Cloud SQL 和 VM 上的 MySQL 有什么区别？

**A:** 
- **Cloud SQL**: 托管服务，自动备份、高可用、自动更新
- **VM MySQL**: 需要自己管理，更灵活但需要更多维护工作

## 总结

**回答你的问题：**

> 如果我想要部署到GCP上面，还需要单独配置cloud数据库吗？

**答案：是的，需要！**

1. **必须创建数据库**：Hibernate 只能创建表，不能创建数据库
2. **推荐使用 Cloud SQL**：生产环境的最佳选择
3. **配置连接信息**：通过环境变量设置数据库连接信息
4. **表结构会自动创建**：一旦数据库存在，Hibernate 会自动创建所有表
