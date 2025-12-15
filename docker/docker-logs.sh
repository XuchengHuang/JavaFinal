#!/bin/bash

###############################################################################
# AsteriTime Docker 日志查看脚本
# 
# 功能：
#   - 查看Docker容器日志
#   - 支持实时跟踪日志
#   - 支持查看特定服务的日志
#
# 使用方法：
#   ./docker-logs.sh [service] [options]
#
# 参数：
#   service   可选，指定服务：mysql|backend|frontend|all
#             默认：all（所有服务）
#
# 选项：
#   -f, --follow    实时跟踪日志（默认）
#   -n, --lines N   显示最后N行（默认：100）
#   --tail N        显示最后N行（默认：100）
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR"

# 默认参数
SERVICE="all"
FOLLOW=true
LINES=100

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        mysql|backend|frontend|all)
            SERVICE=$1
            shift
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines|--tail)
            FOLLOW=false
            LINES=$2
            shift 2
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            exit 1
            ;;
    esac
done

# 查看日志
view_logs() {
    cd "$DOCKER_DIR"
    
    case "$SERVICE" in
        mysql)
            echo -e "${BLUE}MySQL 日志:${NC}"
            if [ "$FOLLOW" = true ]; then
                docker-compose logs -f mysql
            else
                docker-compose logs --tail=$LINES mysql
            fi
            ;;
        backend)
            echo -e "${BLUE}后端日志:${NC}"
            if [ "$FOLLOW" = true ]; then
                docker-compose logs -f backend
            else
                docker-compose logs --tail=$LINES backend
            fi
            ;;
        frontend)
            echo -e "${BLUE}前端日志:${NC}"
            if [ "$FOLLOW" = true ]; then
                docker-compose logs -f frontend
            else
                docker-compose logs --tail=$LINES frontend
            fi
            ;;
        all|*)
            echo -e "${BLUE}所有服务日志:${NC}"
            if [ "$FOLLOW" = true ]; then
                docker-compose logs -f
            else
                docker-compose logs --tail=$LINES
            fi
            ;;
    esac
}

# 主函数
main() {
    view_logs
}

# 执行主函数
main "$@"

