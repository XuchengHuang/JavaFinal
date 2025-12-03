#!/bin/bash

# AsteriTime 一键启动脚本
# 使用方法: ./start.sh [server|client|all]

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/asteritime-server"
CLIENT_DIR="$PROJECT_ROOT/asteritime-client"

# 检查 MySQL 是否运行
check_mysql() {
    echo -e "${YELLOW}检查 MySQL 连接...${NC}"
    if ! mysqladmin ping -h localhost -u root -proot --silent 2>/dev/null; then
        echo -e "${RED}警告: 无法连接到 MySQL 数据库${NC}"
        echo -e "${YELLOW}请确保 MySQL 已启动，并且用户名/密码为 root/root${NC}"
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
    if curl -s http://localhost:8080/api/tasks > /dev/null 2>&1; then
        echo -e "${GREEN}后端服务器启动成功!${NC}"
    else
        echo -e "${YELLOW}后端服务器正在启动中...${NC}"
    fi
}

# 启动前端
start_client() {
    echo -e "${GREEN}启动前端客户端...${NC}"
    cd "$CLIENT_DIR"
    
    # 检查是否已编译
    if [ ! -d "target" ]; then
        echo -e "${YELLOW}首次运行，正在编译...${NC}"
        mvn clean install -DskipTests
    fi
    
    # 启动 Swing 客户端
    mvn exec:java > "$PROJECT_ROOT/client.log" 2>&1 &
    CLIENT_PID=$!
    echo $CLIENT_PID > "$PROJECT_ROOT/client.pid"
    echo -e "${GREEN}前端客户端已启动 (PID: $CLIENT_PID)${NC}"
    echo -e "${YELLOW}日志文件: $PROJECT_ROOT/client.log${NC}"
}

# 停止所有服务
stop_all() {
    echo -e "${YELLOW}停止所有服务...${NC}"
    
    if [ -f "$PROJECT_ROOT/server.pid" ]; then
        SERVER_PID=$(cat "$PROJECT_ROOT/server.pid")
        if ps -p $SERVER_PID > /dev/null 2>&1; then
            kill $SERVER_PID
            echo -e "${GREEN}后端服务器已停止${NC}"
        fi
        rm -f "$PROJECT_ROOT/server.pid"
    fi
    
    if [ -f "$PROJECT_ROOT/client.pid" ]; then
        CLIENT_PID=$(cat "$PROJECT_ROOT/client.pid")
        if ps -p $CLIENT_PID > /dev/null 2>&1; then
            kill $CLIENT_PID
            echo -e "${GREEN}前端客户端已停止${NC}"
        fi
        rm -f "$PROJECT_ROOT/client.pid"
    fi
}

# 主逻辑
case "${1:-all}" in
    server)
        check_mysql
        start_server
        echo -e "${GREEN}后端服务器运行中，按 Ctrl+C 停止${NC}"
        wait
        ;;
    client)
        start_client
        echo -e "${GREEN}前端客户端运行中，按 Ctrl+C 停止${NC}"
        wait
        ;;
    all)
        check_mysql
        start_server
        sleep 3
        start_client
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}所有服务已启动!${NC}"
        echo -e "${GREEN}后端: http://localhost:8080/api${NC}"
        echo -e "${GREEN}前端: Swing GUI 窗口${NC}"
        echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
        echo -e "${GREEN}========================================${NC}"
        
        # 等待用户中断
        trap stop_all EXIT INT TERM
        wait
        ;;
    stop)
        stop_all
        ;;
    *)
        echo "使用方法: $0 [server|client|all|stop]"
        echo "  server  - 只启动后端"
        echo "  client  - 只启动前端"
        echo "  all     - 启动后端和前端 (默认)"
        echo "  stop    - 停止所有服务"
        exit 1
        ;;
esac

