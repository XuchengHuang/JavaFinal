# 并发控制与多线程配置文档

## 概述

本文档说明 AsteriTime Server 的多线程处理和并发控制机制，确保系统能够安全地处理多个用户同时访问和操作数据。

## 1. 多线程连接处理

### 1.1 Tomcat 线程池配置

Spring Boot 使用内嵌的 Tomcat 服务器，已配置为支持多线程处理连接：

**配置位置**: `application.yml`

```yaml
server:
  servlet:
    threads:
      max: 200              # 最大工作线程数
      min-spare: 10         # 最小工作线程数
  tomcat:
    max-connections: 10000  # 最大连接数
    accept-count: 100       # 接受连接的队列大小
    connection-timeout: 20000  # 连接超时时间（毫秒）
```

**说明**:
- **max**: 最大工作线程数，决定同时处理的请求数量
- **min-spare**: 最小空闲线程数，保持一定数量的线程随时准备处理请求
- **max-connections**: 最大连接数，超过此数量的连接将被拒绝
- **accept-count**: 等待队列大小，当所有线程都在忙碌时，新连接会进入队列等待

### 1.2 数据库连接池配置（HikariCP）

Spring Boot 默认使用 HikariCP 作为数据库连接池，已优化配置：

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5           # 最小空闲连接数
      maximum-pool-size: 20     # 最大连接池大小
      connection-timeout: 30000 # 连接超时时间（毫秒）
      idle-timeout: 600000      # 空闲连接超时时间（毫秒）
      max-lifetime: 1800000     # 连接最大生命周期（毫秒）
      leak-detection-threshold: 60000  # 连接泄漏检测阈值
```

**说明**:
- **maximum-pool-size**: 建议设置为 `CPU核心数 × 2 + 磁盘数`，当前设置为 20
- **minimum-idle**: 保持的最小空闲连接数，提高响应速度
- **leak-detection-threshold**: 检测连接泄漏，如果连接超过 60 秒未关闭会记录警告

## 2. 并发控制机制

### 2.1 事务隔离级别

**配置**: `application.yml` 和 Service 层

```yaml
spring:
  jpa:
    properties:
      hibernate:
        connection:
          isolation: 2  # READ_COMMITTED（读已提交）
```

**Service 层配置**:
```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public class TaskService {
    // ...
}
```

**隔离级别说明**:
- **READ_COMMITTED (读已提交)**: 
  - 防止脏读（Dirty Read）
  - 允许不可重复读和幻读
  - 性能与数据一致性的平衡选择
  - 适合大多数 Web 应用场景

### 2.2 乐观锁（Optimistic Locking）

#### 2.2.1 实体类版本字段

所有实体类都添加了 `@Version` 字段，用于实现乐观锁：

```java
@Version
@Column(nullable = false)
private Long version;
```

**已添加版本字段的实体**:
- `Task`
- `JournalEntry`
- `User`
- `TaskCategory`
- `TaskRecurrenceRule`

#### 2.2.2 工作原理

1. **读取数据**: 每次从数据库读取实体时，会同时读取 `version` 字段
2. **更新数据**: 更新时，JPA 会检查 `version` 是否与数据库中的一致
3. **版本递增**: 如果一致，更新成功并自动递增 `version`
4. **冲突检测**: 如果不一致，抛出 `OptimisticLockingFailureException`

#### 2.2.3 重试机制

关键更新操作使用 `@Retryable` 注解，自动重试并发冲突：

```java
@Retryable(value = {OptimisticLockingFailureException.class}, 
           maxAttempts = 3, 
           backoff = @Backoff(delay = 100))
public Task updateTask(Long id, Long userId, Task updatedTask) {
    // ...
}
```

**重试策略**:
- **maxAttempts**: 最多重试 3 次
- **backoff**: 每次重试前等待 100 毫秒
- 适用于高并发场景下的短暂冲突

#### 2.2.4 Controller 层异常处理

Controller 层捕获乐观锁异常并返回适当的 HTTP 状态码：

```java
catch (OptimisticLockingFailureException e) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
            .header("X-Error-Message", "数据已被其他操作修改，请刷新后重试")
            .build();
}
```

**HTTP 状态码**: `409 Conflict`

## 3. 异步任务处理

### 3.1 异步任务配置

创建了 `AsyncConfig` 配置类，用于后台异步任务处理：

**配置类**: `com.asteritime.server.config.AsyncConfig`

**线程池参数**:
- **核心线程数**: 5
- **最大线程数**: 20
- **队列容量**: 100
- **线程名前缀**: `async-task-`

### 3.2 使用示例

在 Service 方法上添加 `@Async` 注解即可异步执行：

```java
@Async("taskExecutor")
public void processAsyncTask() {
    // 异步执行的代码
}
```

**适用场景**:
- 日志记录
- 统计分析
- 邮件发送
- 数据清理
- 其他不需要立即返回结果的操作

## 4. 多用户并发安全

### 4.1 用户隔离

所有数据操作都通过 `userId` 进行隔离，确保用户只能访问和修改自己的数据：

```java
public Optional<Task> findByIdAndUserId(Long id, Long userId) {
    return taskRepository.findByIdAndUser_Id(id, userId);
}
```

### 4.2 权限验证

每个 Controller 方法都会验证 `userId`，确保操作权限：

```java
Long userId = (Long) request.getAttribute("userId");
if (userId == null) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
}
```

## 5. 性能优化建议

### 5.1 连接池大小调整

根据实际负载调整连接池大小：

- **低负载** (< 100 并发用户): `maximum-pool-size: 10-15`
- **中负载** (100-500 并发用户): `maximum-pool-size: 20-30`
- **高负载** (> 500 并发用户): `maximum-pool-size: 50-100`

### 5.2 线程池大小调整

根据服务器 CPU 核心数调整线程池：

- **CPU 核心数 × 2**: 适合 I/O 密集型应用
- **CPU 核心数 + 1**: 适合 CPU 密集型应用

### 5.3 监控建议

建议监控以下指标：
- 数据库连接池使用率
- Tomcat 线程池使用率
- 乐观锁冲突频率
- 请求响应时间

## 6. 测试建议

### 6.1 并发测试

使用工具（如 JMeter、Apache Bench）进行并发测试：

```bash
# 使用 Apache Bench 测试并发
ab -n 1000 -c 100 http://localhost:8080/api/tasks
```

### 6.2 乐观锁测试

模拟并发更新场景：
1. 两个用户同时读取同一任务
2. 两个用户同时修改并保存
3. 验证只有一个更新成功，另一个返回 409 Conflict

## 7. 故障排查

### 7.1 连接池耗尽

**症状**: 请求超时或数据库连接错误

**解决方案**:
- 检查是否有连接泄漏（查看日志中的泄漏警告）
- 增加 `maximum-pool-size`
- 检查是否有长时间运行的事务

### 7.2 乐观锁冲突频繁

**症状**: 频繁返回 409 Conflict

**解决方案**:
- 检查是否有长时间未提交的事务
- 考虑使用悲观锁（`@Lock(LockModeType.PESSIMISTIC_WRITE)`）
- 优化业务逻辑，减少并发更新同一数据的可能性

### 7.3 线程池耗尽

**症状**: 请求排队时间过长

**解决方案**:
- 增加 `server.servlet.threads.max`
- 优化慢查询
- 使用异步处理减少线程占用时间

## 8. 总结

通过以上配置，AsteriTime Server 已经具备：

✅ **多线程连接处理**: Tomcat 线程池 + HikariCP 连接池  
✅ **并发控制**: 乐观锁 + 事务隔离  
✅ **多用户安全**: 用户数据隔离 + 权限验证  
✅ **自动重试**: 乐观锁冲突自动重试  
✅ **异步处理**: 后台任务线程池  

这些机制确保了系统在高并发场景下的数据一致性和系统稳定性。
