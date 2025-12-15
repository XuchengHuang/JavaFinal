# 构建阶段
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# 复制pom文件（利用Docker缓存层）
COPY pom.xml .
COPY asteritime-common/pom.xml ./asteritime-common/
COPY asteritime-server/pom.xml ./asteritime-server/

# 下载依赖（利用Docker缓存）
RUN mvn dependency:go-offline -B

# 复制源代码
COPY asteritime-common ./asteritime-common
COPY asteritime-server ./asteritime-server

# 构建应用
RUN mvn clean package -DskipTests

# 生产阶段
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 创建非root用户
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# 复制构建产物
COPY --from=build /app/asteritime-server/target/*.jar app.jar

EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/auth/login || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]


