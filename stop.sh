#!/bin/bash

# AsteriTime 后端停止脚本

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}停止后端服务器...${NC}"

# 停止后端
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

# 清理日志文件（可选）
read -p "是否删除日志文件? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$PROJECT_ROOT/server.log"
    echo -e "${GREEN}日志文件已删除${NC}"
fi

echo -e "${GREEN}完成!${NC}"
