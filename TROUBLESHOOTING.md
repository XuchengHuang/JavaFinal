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

