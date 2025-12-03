# AsteriTime - Daily Timeline with Pomodoro, Quadrant Tasks, Journal, and Analytics

## 项目简介

AsteriTime 是一个基于 Java 的时间管理应用，集成了：
- **Eisenhower Dashboard**：四象限任务管理
- **Day Timeline**：日程时间线视图
- **Pomodoro Timer**：番茄钟专注工具
- **Analytics**：统计分析报表
- **Journal**：日记功能

## 技术栈

- **前端**：Java Swing
- **后端**：Spring Boot + Hibernate (JPA) + MySQL
- **部署**：Docker + Docker Compose + GCP
- **构建工具**：Maven

## 项目结构

```
JavaFinal/
├── asteritime-client/          # Swing 前端模块
├── asteritime-server/          # Spring Boot 后端模块
├── asteritime-common/          # 共享模块（实体类、DTO）
├── docker/                     # Docker 配置文件
└── docs/                       # 文档
```

## 快速开始

### 后端启动
```bash
cd asteritime-server
mvn spring-boot:run
```

### 前端启动
```bash
cd asteritime-client
mvn exec:java
```

### Docker 部署
```bash
docker-compose up
```

## 开发计划

- **Week 1**：项目搭建 + 数据库设计
- **Week 2**：Timeline + Pomodoro
- **Week 3**：图表 + 日记 + 导入导出
- **Week 4**：备份 API + Docker + GCP 部署
- **Week 5**：测试 + 修复 + 演示

## 作者

- Xucheng Huang (xh2810)
- Jia Yang (jy5081)


