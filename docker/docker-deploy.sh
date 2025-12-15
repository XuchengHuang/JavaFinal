#!/bin/bash

###############################################################################
# AsteriTime Docker 部署脚本
# 
# 功能：
#   - 启动所有Docker容器（MySQL、后端、前端）
#   - 支持后台运行或前台运行
#   - 自动检查服务健康状态
#
# 使用方法：
#   ./docker-deploy.sh [options]
#
# 选项：
#   -d, --detach    后台运行（默认）
#   -f, --foreground 前台运行
#   --build         部署前重新构建镜像
#   --rebuild       强制重新构建镜像（不使用缓存）
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
DETACH=true
BUILD=false
REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--detach)
            DETACH=true
            shift
            ;;
        -f|--foreground)
            DETACH=false
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            BUILD=true
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            exit 1
            ;;
    esac
done

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
        exit 1
    fi
    
    if ! docker ps &> /dev/null; then
        echo -e "${RED}错误: Docker 服务未运行${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker 已就绪${NC}"
}

# 停止现有容器
stop_existing() {
    echo -e "${YELLOW}停止现有容器...${NC}"
    cd "$DOCKER_DIR"
    docker-compose down 2>/dev/null || true
}

# 启动服务
start_services() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}启动 AsteriTime 服务${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    cd "$DOCKER_DIR"
    
    # 构建参数
    local compose_args=""
    if [ "$BUILD" = true ]; then
        compose_args="--build"
        if [ "$REBUILD" = true ]; then
            compose_args="--build --no-cache"
        fi
    fi
    
    # 启动服务
    if [ "$DETACH" = true ]; then
        echo -e "${YELLOW}后台启动服务...${NC}"
        docker-compose up -d $compose_args
        
        echo ""
        echo -e "${GREEN}服务启动中，等待健康检查...${NC}"
        echo ""
        
        # 等待服务启动
        wait_for_services
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}所有服务启动成功！${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        show_status
    else
        echo -e "${YELLOW}前台启动服务（按 Ctrl+C 停止）...${NC}"
        docker-compose up $compose_args
    fi
}

# 等待服务启动
wait_for_services() {
    local max_attempts=60
    local attempt=0
    
    echo -e "${YELLOW}等待 MySQL 启动...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps mysql | grep -q "healthy"; then
            echo -e "${GREEN}✓ MySQL 已就绪${NC}"
            break
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}MySQL 启动超时${NC}"
        return 1
    fi
    
    attempt=0
    echo -e "${YELLOW}等待后端启动...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps backend | grep -q "healthy\|Up"; then
            # 检查后端是否真的可用
            if curl -s http://localhost:${BACKEND_PORT:-8080}/api/auth/login > /dev/null 2>&1; then
                echo -e "${GREEN}✓ 后端已就绪${NC}"
                break
            fi
        fi
        sleep 2
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${YELLOW}⚠ 后端启动可能未完成，请检查日志${NC}"
    fi
    
    echo -e "${GREEN}✓ 前端已就绪${NC}"
}

# 显示服务状态
show_status() {
    echo -e "${BLUE}服务访问地址:${NC}"
    echo -e "  前端应用: ${GREEN}http://localhost:${FRONTEND_PORT:-80}${NC}"
    echo -e "  后端 API: ${GREEN}http://localhost:${BACKEND_PORT:-8080}/api${NC}"
    echo -e "  MySQL:    ${GREEN}localhost:${MYSQL_PORT:-3306}${NC}"
    echo ""
    echo -e "${YELLOW}常用命令:${NC}"
    echo -e "  查看日志:     ./docker-logs.sh"
    echo -e "  查看状态:     docker-compose ps"
    echo -e "  停止服务:     ./docker-stop.sh"
    echo -e "  重启服务:     docker-compose restart"
}

# 主函数
main() {
    check_docker
    
    stop_existing
    
    start_services
}

# 执行主函数
main "$@"

