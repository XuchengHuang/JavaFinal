# 环境变量配置说明

## 概述

为了安全起见，AsteriTime 项目使用环境变量来管理敏感信息（如数据库密码、JWT密钥等）。

## 快速开始

### 1. 创建环境变量文件

复制示例文件并填入实际值：

```bash
cp .env.example .env
```

### 2. 编辑 .env 文件

使用文本编辑器打开 `.env` 文件，填入你的配置：

```bash
# 数据库配置
DB_USERNAME=root
DB_PASSWORD=your_actual_password

# JWT 配置（生产环境必须使用强随机密钥）
JWT_SECRET=your_very_long_and_random_jwt_secret_key_here
JWT_EXPIRATION=604800000  # 7天（毫秒）
```

### 3. 设置环境变量

#### macOS/Linux

```bash
# 临时设置（当前终端会话有效）
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=your_jwt_secret

# 或者从 .env 文件加载（需要安装 dotenv-cli）
# npm install -g dotenv-cli
# dotenv -e .env ./start.sh
```

#### Windows

```cmd
set DB_USERNAME=root
set DB_PASSWORD=your_password
set JWT_SECRET=your_jwt_secret
```

### 4. 启动应用

设置环境变量后，正常启动应用：

```bash
./start.sh
```

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `DB_USERNAME` | 数据库用户名 | `root` | 否 |
| `DB_PASSWORD` | 数据库密码 | 无（空字符串） | **是** |
| `JWT_SECRET` | JWT 签名密钥 | 开发环境默认值 | **生产环境必需** |
| `JWT_EXPIRATION` | Token 过期时间（毫秒） | `604800000` (7天) | 否 |

## 安全建议

1. **不要将 `.env` 文件提交到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 只提交 `.env.example` 作为模板

2. **生产环境必须设置强密钥**
   - JWT_SECRET 应该至少 32 个字符
   - 使用随机生成的字符串
   - 可以使用以下命令生成：
     ```bash
     openssl rand -base64 32
     ```

3. **定期更换密钥**
   - 定期更换 JWT_SECRET
   - 更换后所有现有 token 将失效，用户需要重新登录

4. **使用不同的配置**
   - 开发、测试、生产环境使用不同的配置
   - 不要在生产环境使用默认值

## Docker 部署

Docker Compose 文件中的环境变量可以通过以下方式设置：

1. 在 `docker-compose.yml` 中直接设置（仅用于开发）
2. 使用 `.env` 文件（推荐）
3. 使用 Docker secrets（生产环境推荐）

## 故障排查

### 问题：应用启动失败，提示数据库连接错误

**解决方案：**
- 检查 `DB_PASSWORD` 环境变量是否已设置
- 确认数据库密码是否正确
- 确认数据库服务是否已启动

### 问题：JWT token 验证失败

**解决方案：**
- 检查 `JWT_SECRET` 环境变量是否已设置
- 确认前后端使用的密钥是否一致
- 检查 token 是否已过期

### 问题：start.sh 脚本无法连接数据库

**解决方案：**
- 确保已设置 `DB_PASSWORD` 环境变量
- 或者修改脚本中的默认密码（仅用于开发环境）
