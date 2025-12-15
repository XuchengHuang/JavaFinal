# 故障排除指南

## 常见问题

### 1. 窗口闪退

**原因：** 通常是编译错误或运行时异常

**解决方法：**
```bash
# 1. 检查日志
cat client.log

# 2. 重新编译
mvn clean compile

# 3. 重新运行
./start.sh client
```

### 2. Maven 命令未找到

**解决方法：**
```bash
# macOS
brew install maven

# 验证安装
mvn --version
```

### 3. 编译错误：找不到类

**原因：** 依赖模块未编译

**解决方法：**
```bash
# 从根目录编译所有模块
cd /Users/yolanday/Documents/JavaFinal
mvn clean install -DskipTests
```

### 4. 窗口不显示

**可能原因：**
- 窗口被其他窗口遮挡
- 窗口在屏幕外
- Java 版本不兼容

**解决方法：**
```bash
# 检查 Java 版本（需要 Java 11+）
java -version

# 在 IDE 中直接运行，查看完整错误信息
# 运行 AsteriTimeClient.main()
```

### 5. 后端连接失败

**解决方法：**
```bash
# 1. 确保后端已启动
./start.sh server

# 2. 检查后端是否运行
curl http://localhost:8080/api/tasks

# 3. 检查 MySQL 是否运行
mysql -u root -p -e "SHOW DATABASES;"
```

### 6. 添加任务/频率/分类时出现 "Missing or invalid token" 错误

**原因：** 
- 用户未登录或登录状态已过期
- Token 已过期（默认7天）
- localStorage 中的 token 被清除或损坏

**解决方法：**

1. **确保已登录：**
   - 打开浏览器开发者工具（F12）
   - 查看 Application/Storage → Local Storage
   - 检查是否存在 `token` 键值对
   - 如果没有 token，请先登录

2. **重新登录：**
   - 访问登录页面：`http://localhost:3000/login`
   - 输入邮箱和密码登录
   - 登录成功后，token 会自动保存到 localStorage

3. **清除缓存后重新登录：**
   ```javascript
   // 在浏览器控制台执行
   localStorage.clear();
   // 然后重新登录
   ```

4. **检查 token 是否过期：**
   - Token 默认有效期为 7 天
   - 如果超过 7 天未使用，需要重新登录
   - 前端会自动检测 401 错误并跳转到登录页

5. **验证后端 JWT 配置：**
   - 检查 `application.yml` 中的 `jwt.secret` 配置
   - 确保环境变量 `JWT_SECRET` 设置正确（如果使用）
   - 默认 secret: `AsteriTimeSecretKeyForJWTTokenGeneration2025ThisShouldBeLongEnough`

**注意事项：**
- 所有需要认证的 API 请求都需要在 Header 中包含：`Authorization: Bearer <token>`
- 前端会自动处理 token 的添加和过期检测
- 如果在新电脑上运行，必须先注册/登录才能使用功能

### 7. 添加任务/频率/分类时出现 500 Internal Server Error（有 token 的情况下）

**原因：** 
JSON 序列化问题。当实体类包含 `User` 对象时，Spring Boot 在序列化为 JSON 时可能遇到循环引用或序列化失败，导致 500 错误。

**解决方案：**

1. **确保代码已更新**：
   - 所有包含 `User` 字段的实体类（`TaskCategory`、`Task`、`TaskRecurrenceRule`）都应该有 `@JsonIgnoreProperties({"user"})` 注解
   - 如果代码已更新，需要重新编译：
     ```bash
     mvn clean install -DskipTests
     ```

2. **重新启动后端服务**：
   ```bash
   ./asteritime.sh stop:backend
   ./asteritime.sh backend
   ```

3. **检查后端日志**：
   - 查看是否有序列化相关的错误信息
   - 查看是否有数据库连接问题

**技术细节：**
- `TaskCategory`、`Task`、`TaskRecurrenceRule` 实体都包含 `User` 对象
- 序列化时需要忽略 `user` 字段，避免循环引用和敏感信息泄露
- 已添加 `@JsonIgnoreProperties({"user"})` 注解到这些实体类

### 8. 为什么本机没问题，另一台电脑有问题？

**原因分析：**

1. **浏览器 localStorage 中保存了 token**
   - 本机之前登录过，浏览器 localStorage 中保存了有效的 token
   - Token 是浏览器级别的存储，与浏览器和域名绑定
   - 即使关闭浏览器，token 也会保留
   - 再次打开应用时，前端自动读取并使用该 token

2. **另一台电脑是全新环境**
   - 浏览器 localStorage 中没有 token
   - 需要先登录才能获取 token

3. **Token 不跨设备共享**
   - localStorage 是浏览器本地存储，不同电脑之间不共享
   - 每台电脑都需要单独登录

**验证方法：**

在本机浏览器控制台（F12）执行：
```javascript
// 查看是否有 token
localStorage.getItem('token')

// 查看所有 localStorage 数据
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, ':', localStorage.getItem(key));
}
```

**解决方案：**

在另一台电脑上：
1. 打开应用：`http://localhost:3000`
2. 如果自动跳转到登录页，说明没有 token
3. 输入邮箱和密码登录
4. 登录成功后，token 会保存到该电脑的浏览器 localStorage 中
5. 之后就可以正常使用了

**额外注意事项：**

如果两台电脑的 `JWT_SECRET` 环境变量不同，会导致 token 验证失败：
- 检查方法：确保两台电脑使用相同的 `JWT_SECRET`（或都使用默认值）
- 如果设置了不同的 `JWT_SECRET`，在一台电脑上生成的 token 在另一台电脑上无法验证
- 建议：开发环境使用默认值，或确保所有开发机器使用相同的 `JWT_SECRET`

## 调试技巧

### 查看实时日志
```bash
# 前端日志
tail -f client.log

# 后端日志
tail -f server.log
```

### 在 IDE 中调试
1. 在 `AsteriTimeClient.main()` 设置断点
2. 以 Debug 模式运行
3. 查看完整的堆栈跟踪

### 检查进程
```bash
# 查看 Java 进程
ps aux | grep java

# 查看 Maven 进程
ps aux | grep maven
```

