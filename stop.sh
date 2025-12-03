#!/bin/bash

# AsteriTime 停止脚本

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}停止所有服务...${NC}"

# 停止后端
if [ -f "$PROJECT_ROOT/server.pid" ]; then
    SERVER_PID=$(cat "$PROJECT_ROOT/server.pid")
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        kill $SERVER_PID
        echo -e "${GREEN}后端服务器已停止${NC}"
    fi
    rm -f "$PROJECT_ROOT/server.pid"
fi

# 停止前端
if [ -f "$PROJECT_ROOT/client.pid" ]; then
    CLIENT_PID=$(cat "$PROJECT_ROOT/client.pid")
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        kill $CLIENT_PID
        echo -e "${GREEN}前端客户端已停止${NC}"
    fi
    rm -f "$PROJECT_ROOT/client.pid"
fi

# 清理日志文件（可选）
read -p "是否删除日志文件? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$PROJECT_ROOT/server.log" "$PROJECT_ROOT/client.log"
    echo -e "${GREEN}日志文件已删除${NC}"
fi

echo -e "${GREEN}完成!${NC}"

