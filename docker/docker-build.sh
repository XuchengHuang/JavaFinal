#!/bin/bash

###############################################################################
# AsteriTime Docker 构建脚本
# 
# 功能：
#   - 构建所有Docker镜像（MySQL、后端、前端）
#   - 支持单独构建某个服务
#
# 使用方法：
#   ./docker-build.sh [service]
#
# 参数：
#   service   可选，指定要构建的服务：mysql|backend|frontend|all
#             默认：all（构建所有服务）
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
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$SCRIPT_DIR"

# 加载环境变量
if [ -f "$DOCKER_DIR/.env" ]; then
    echo -e "${BLUE}加载环境变量: .env${NC}"
    set -a
    source "$DOCKER_DIR/.env"
    set +a
elif [ -f "$DOCKER_DIR/.env.example" ]; then
    echo -e "${YELLOW}警告: .env 文件不存在，从 .env.example 创建${NC}"
    cp "$DOCKER_DIR/.env.example" "$DOCKER_DIR/.env"
    echo -e "${GREEN}已创建 .env 文件，请根据需要修改配置${NC}"
    set -a
    source "$DOCKER_DIR/.env"
    set +a
fi

# 检查Docker和Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: Docker 未安装${NC}"
        echo -e "${YELLOW}请安装 Docker: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}错误: Docker Compose 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker 已安装${NC}"
}

# 构建MySQL（实际上只是拉取镜像）
build_mysql() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}准备 MySQL 镜像${NC}"
    echo -e "${BLUE}========================================${NC}"
    docker pull mysql:8.0
    echo -e "${GREEN}✓ MySQL 镜像准备完成${NC}"
}

# 构建后端
build_backend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}构建后端镜像${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    cd "$PROJECT_ROOT"
    docker build -f "$DOCKER_DIR/asteritime-server/Dockerfile" \
        -t asteritime-backend:latest \
        .
    
    echo -e "${GREEN}✓ 后端镜像构建完成${NC}"
}

# 构建前端
build_frontend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}构建前端镜像${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    cd "$PROJECT_ROOT/asteritime-client"
    docker build -f "$DOCKER_DIR/asteritime-client/Dockerfile" \
        --build-arg REACT_APP_API_URL="${REACT_APP_API_URL:-/api}" \
        -t asteritime-frontend:latest \
        .
    
    echo -e "${GREEN}✓ 前端镜像构建完成${NC}"
}

# 构建所有服务
build_all() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}AsteriTime Docker 镜像构建${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    check_docker
    
    build_mysql
    echo ""
    
    build_backend
    echo ""
    
    build_frontend
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}所有镜像构建完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}使用以下命令启动服务:${NC}"
    echo -e "  cd $DOCKER_DIR"
    echo -e "  ./docker-deploy.sh"
}

# 主函数
main() {
    local service=${1:-all}
    
    case "$service" in
        mysql)
            check_docker
            build_mysql
            ;;
        backend)
            check_docker
            build_backend
            ;;
        frontend)
            check_docker
            build_frontend
            ;;
        all|*)
            build_all
            ;;
    esac
}

# 执行主函数
main "$@"

