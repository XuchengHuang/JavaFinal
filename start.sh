#!/bin/bash

# AsteriTime 后端启动脚本
# 使用方法: ./start.sh [start|stop]

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/asteritime-server"

# 设置 Java 21 环境变量
export JAVA_HOME="/opt/homebrew/Cellar/openjdk@21/21.0.6/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# 检查 MySQL 是否运行
check_mysql() {
    echo -e "${YELLOW}检查 MySQL 连接...${NC}"
    if ! mysqladmin ping -h localhost -u root -p216699 --silent 2>/dev/null; then
        echo -e "${RED}警告: 无法连接到 MySQL 数据库${NC}"
        echo -e "${YELLOW}请确保 MySQL 已启动，并且用户名/密码为 root/216699${NC}"
        read -p "是否继续? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}MySQL 连接正常${NC}"
    fi
}

# 启动后端
start_server() {
    echo -e "${GREEN}启动后端服务器...${NC}"
    echo -e "${YELLOW}使用 Java 版本: $(java -version 2>&1 | head -1)${NC}"
    cd "$SERVER_DIR"
    
    # 检查是否已编译
    if [ ! -d "target" ]; then
        echo -e "${YELLOW}首次运行，正在编译...${NC}"
        mvn clean install -DskipTests
    fi
    
    # 启动 Spring Boot
    mvn spring-boot:run > "$PROJECT_ROOT/server.log" 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$PROJECT_ROOT/server.pid"
    echo -e "${GREEN}后端服务器已启动 (PID: $SERVER_PID)${NC}"
    echo -e "${YELLOW}日志文件: $PROJECT_ROOT/server.log${NC}"
    echo -e "${YELLOW}等待服务器启动...${NC}"
    
    # 等待服务器启动
    sleep 5
    
    # 检查服务器是否启动成功
    if curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1; then
        echo -e "${GREEN}后端服务器启动成功!${NC}"
        echo -e "${GREEN}API 地址: http://localhost:8080/api${NC}"
    else
        echo -e "${YELLOW}后端服务器正在启动中...${NC}"
        echo -e "${YELLOW}请查看日志文件: $PROJECT_ROOT/server.log${NC}"
    fi
}

# 停止服务
stop_server() {
    echo -e "${YELLOW}停止后端服务器...${NC}"
    
    if [ -f "$PROJECT_ROOT/server.pid" ]; then
        SERVER_PID=$(cat "$PROJECT_ROOT/server.pid")
        if ps -p $SERVER_PID > /dev/null 2>&1; then
            kill $SERVER_PID
            echo -e "${GREEN}后端服务器已停止${NC}"
        else
            echo -e "${YELLOW}服务器进程不存在${NC}"
        fi
        rm -f "$PROJECT_ROOT/server.pid"
    else
        echo -e "${YELLOW}未找到运行中的服务器${NC}"
    fi
}

# 主逻辑
case "${1:-start}" in
    start)
        check_mysql
        start_server
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}后端服务器运行中${NC}"
        echo -e "${GREEN}API 地址: http://localhost:8080/api${NC}"
        echo -e "${YELLOW}按 Ctrl+C 停止服务器${NC}"
        echo -e "${YELLOW}或运行 ./stop.sh 停止服务器${NC}"
        echo -e "${GREEN}========================================${NC}"
        
        # 等待用户中断
        trap stop_server EXIT INT TERM
        wait
        ;;
    stop)
        stop_server
        ;;
    *)
        echo "使用方法: $0 [start|stop]"
        echo "  start  - 启动后端服务器 (默认)"
        echo "  stop   - 停止后端服务器"
        exit 1
        ;;
esac
