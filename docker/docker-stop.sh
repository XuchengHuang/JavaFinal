#!/bin/bash

###############################################################################
# AsteriTime Docker 停止脚本
# 
# 功能：
#   - 停止所有Docker容器
#   - 可选：删除容器和数据卷
#
# 使用方法：
#   ./docker-stop.sh [options]
#
# 选项：
#   -v, --volumes    同时删除数据卷（会删除数据库数据！）
#   -r, --remove     删除容器（默认只停止）
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

# 解析参数
REMOVE_VOLUMES=false
REMOVE_CONTAINERS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -r|--remove)
            REMOVE_CONTAINERS=true
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            exit 1
            ;;
    esac
done

# 停止服务
stop_services() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}停止 AsteriTime 服务${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    cd "$DOCKER_DIR"
    
    if [ "$REMOVE_VOLUMES" = true ]; then
        echo -e "${YELLOW}警告: 将删除所有数据卷（包括数据库数据）！${NC}"
        read -p "确认继续? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}已取消${NC}"
            exit 0
        fi
        echo ""
        echo -e "${YELLOW}停止并删除容器和数据卷...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✓ 容器和数据卷已删除${NC}"
    elif [ "$REMOVE_CONTAINERS" = true ]; then
        echo -e "${YELLOW}停止并删除容器...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ 容器已删除${NC}"
    else
        echo -e "${YELLOW}停止容器...${NC}"
        docker-compose stop
        echo -e "${GREEN}✓ 容器已停止${NC}"
        echo ""
        echo -e "${YELLOW}提示: 使用 './docker-stop.sh -r' 删除容器${NC}"
        echo -e "${YELLOW}提示: 使用 './docker-stop.sh -v' 删除容器和数据卷${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}操作完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 主函数
main() {
    stop_services
}

# 执行主函数
main "$@"

