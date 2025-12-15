#!/bin/bash

###############################################################################
# AsteriTime 统一管理脚本
# 
# 功能：
#   - 环境配置检查与设置
#   - 项目编译
#   - 本地开发运行
#   - 调试与日志查看
#
# 使用方法：
#   ./asteritime.sh [command] [options]
#
# 命令列表：
#   setup       - 初始环境配置（检查 Java、Maven、MySQL 等）
#   build       - 编译项目
#   backend     - 启动后端服务器（单独启动）
#   frontend    - 启动前端服务器（单独启动）
#   dev         - 启动开发服务器（后端 + 前端，后台运行）
#   stop        - 停止所有开发服务器
#   stop:backend - 停止后端服务器
#   stop:frontend - 停止前端服务器
#   logs        - 查看后端日志（添加 -f 实时跟踪）
#   logs frontend - 查看前端日志（添加 -f 实时跟踪）
#   clean       - 清理编译产物和日志
#   help        - 显示帮助信息
###############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/asteritime-server"
CLIENT_DIR="$PROJECT_ROOT/asteritime-client"

# 日志文件
SERVER_LOG="$PROJECT_ROOT/server.log"
SERVER_PID="$PROJECT_ROOT/server.pid"
CLIENT_LOG="$PROJECT_ROOT/client.log"
CLIENT_PID="$PROJECT_ROOT/client.pid"

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

# 设置 Java 21 环境
setup_java() {
    local os=$(detect_os)
    
    if [ "$os" == "macos" ]; then
        # macOS: 尝试使用 Homebrew 安装的 Java 21
        if [ -d "/opt/homebrew/Cellar/openjdk@21" ]; then
            local java_path=$(find /opt/homebrew/Cellar/openjdk@21 -name "openjdk.jdk" -type d | head -1)
            if [ -n "$java_path" ]; then
                export JAVA_HOME="$java_path/Contents/Home"
                export PATH="$JAVA_HOME/bin:$PATH"
                return 0
            fi
        fi
        # 尝试使用 /usr/libexec/java_home
        if command -v /usr/libexec/java_home &> /dev/null; then
            local java_home=$(/usr/libexec/java_home -v 21 2>/dev/null)
            if [ -n "$java_home" ]; then
                export JAVA_HOME="$java_home"
                export PATH="$JAVA_HOME/bin:$PATH"
                return 0
            fi
        fi
    elif [ "$os" == "linux" ]; then
        # Linux: 尝试常见的 Java 21 路径
        local possible_paths=(
            "/usr/lib/jvm/java-21-openjdk"
            "/usr/lib/jvm/java-21"
            "/opt/java/jdk-21"
        )
        for path in "${possible_paths[@]}"; do
            if [ -d "$path" ]; then
                export JAVA_HOME="$path"
                export PATH="$JAVA_HOME/bin:$PATH"
                return 0
            fi
        done
    fi
    
    # 如果找不到，检查系统默认 Java 版本
    if command -v java &> /dev/null; then
        local java_version=$(java -version 2>&1 | head -1 | grep -oP 'version "?(1\.)?\K\d+' || echo "0")
        if [ "$java_version" -ge 21 ]; then
            echo -e "${GREEN}使用系统默认 Java (版本 $java_version)${NC}"
            return 0
        fi
    fi
    
    return 1
}

# 加载环境变量
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${BLUE}加载环境变量: .env${NC}"
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        return 0
    elif [ -f "$PROJECT_ROOT/.env.example" ]; then
        echo -e "${YELLOW}警告: .env 文件不存在，自动从 .env.example 创建${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}已创建 .env 文件${NC}"
        echo -e "${YELLOW}提示: 请编辑 .env 文件设置数据库密码等配置${NC}"
        # 加载刚创建的文件
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        return 0
    else
        echo -e "${YELLOW}警告: 未找到环境变量配置文件${NC}"
        return 1
    fi
}

# 检查依赖
check_dependencies() {
    local missing=()
    
    # 检查 Java
    if ! setup_java; then
        missing+=("Java 21")
    else
        local java_version=$(java -version 2>&1 | head -1)
        echo -e "${GREEN}✓ Java: $java_version${NC}"
    fi
    
    # 检查 Maven
    if ! command -v mvn &> /dev/null; then
        missing+=("Maven")
    else
        local mvn_version=$(mvn -version | head -1)
        echo -e "${GREEN}✓ Maven: $mvn_version${NC}"
    fi
    
    # 检查 MySQL 客户端
    if command -v mysql &> /dev/null || command -v mysqladmin &> /dev/null; then
        echo -e "${GREEN}✓ MySQL 客户端已安装${NC}"
    else
        echo -e "${YELLOW}⚠ MySQL 客户端未安装${NC}"
    fi
    
    # 检查 Node.js 和 npm（前端需要）
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        echo -e "${GREEN}✓ Node.js: $node_version${NC}"
    else
        echo -e "${YELLOW}⚠ Node.js 未安装（前端需要）${NC}"
        missing+=("Node.js")
    fi
    
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        echo -e "${GREEN}✓ npm: $npm_version${NC}"
    else
        echo -e "${YELLOW}⚠ npm 未安装（前端需要）${NC}"
        missing+=("npm")
    fi
    
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}缺少以下依赖: ${missing[*]}${NC}"
        return 1
    fi
    
    return 0
}

# 检查 MySQL 连接和数据库
check_mysql() {
    local db_user=${DB_USERNAME:-root}
    local db_pass=${DB_PASSWORD:-}
    
    if [ -z "$db_pass" ]; then
        echo -e "${YELLOW}提示: DB_PASSWORD 未设置，跳过 MySQL 连接检查${NC}"
        return 0
    fi
    
    if ! command -v mysqladmin &> /dev/null && ! command -v mysql &> /dev/null; then
        echo -e "${YELLOW}⚠ MySQL 客户端未安装，跳过数据库检查${NC}"
        return 0
    fi
    
    # 检查 MySQL 服务是否运行
    if command -v mysqladmin &> /dev/null; then
        if ! mysqladmin ping -h localhost -u "$db_user" -p"$db_pass" --silent 2>/dev/null; then
            echo -e "${YELLOW}⚠ MySQL 服务未运行或连接失败${NC}"
            echo -e "${YELLOW}提示: 请确保 MySQL 服务已启动${NC}"
            return 1
        fi
        echo -e "${GREEN}✓ MySQL 服务运行正常${NC}"
    fi
    
    # 检查数据库是否存在
    if command -v mysql &> /dev/null; then
        local db_exists=$(mysql -h localhost -u "$db_user" -p"$db_pass" -e "SHOW DATABASES LIKE 'asteritime';" 2>/dev/null | grep -c asteritime || echo "0")
        if [ "$db_exists" -eq 0 ]; then
            echo -e "${YELLOW}⚠ 数据库 'asteritime' 不存在${NC}"
            echo -e "${YELLOW}提示: 运行以下命令创建数据库:${NC}"
            echo -e "  mysql -u $db_user -p -e \"CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
            return 1
        else
            echo -e "${GREEN}✓ 数据库 'asteritime' 已存在${NC}"
        fi
    fi
    
    return 0
}

# 初始环境配置
cmd_setup() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}AsteriTime 环境配置检查${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # 设置 Java
    if ! setup_java; then
        echo -e "${RED}错误: 未找到 Java 21${NC}"
        echo -e "${YELLOW}请安装 Java 21:${NC}"
        echo -e "  macOS: brew install openjdk@21"
        echo -e "  Linux: sudo apt-get install openjdk-21-jdk"
        exit 1
    fi
    
    echo -e "${GREEN}Java 环境已配置${NC}"
    echo -e "  JAVA_HOME: $JAVA_HOME"
    echo -e "  Java 版本: $(java -version 2>&1 | head -1)"
    echo ""
    
    # 检查依赖
    echo -e "${BLUE}检查依赖...${NC}"
    if ! check_dependencies; then
        echo -e "${RED}请安装缺失的依赖后重试${NC}"
        exit 1
    fi
    echo ""
    
    # 加载环境变量
    echo -e "${BLUE}配置环境变量...${NC}"
    if ! load_env; then
        echo -e "${YELLOW}环境变量配置不完整，但可以继续${NC}"
    fi
    echo ""
    
    # 检查 MySQL
    echo -e "${BLUE}检查数据库连接...${NC}"
    check_mysql
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}环境配置完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 编译项目
cmd_build() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}编译 AsteriTime 项目${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if ! setup_java; then
        echo -e "${RED}错误: 未找到 Java 21${NC}"
        exit 1
    fi
    
    load_env
    
    cd "$PROJECT_ROOT"
    echo -e "${YELLOW}Java 版本: $(java -version 2>&1 | head -1)${NC}"
    echo -e "${YELLOW}Maven 版本: $(mvn -version | head -1)${NC}"
    echo ""
    
    echo -e "${YELLOW}开始编译...${NC}"
    mvn clean install -DskipTests
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}编译完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 启动后端服务器
start_backend() {
    if ! setup_java; then
        echo -e "${RED}错误: 未找到 Java 21${NC}"
        return 1
    fi
    
    # 加载环境变量（如果失败会尝试自动创建）
    if ! load_env; then
        echo -e "${YELLOW}警告: 环境变量配置不完整，使用默认值继续${NC}"
    fi
    
    # 检查是否已在运行
    if [ -f "$SERVER_PID" ]; then
        local pid=$(cat "$SERVER_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}后端服务器已在运行 (PID: $pid)${NC}"
            return 0
        fi
    fi
    
    # 检查 MySQL（可选，失败不会阻止启动）
    echo -e "${BLUE}检查数据库...${NC}"
    if ! check_mysql; then
        echo -e "${YELLOW}警告: 数据库检查失败，但将继续启动应用${NC}"
        echo -e "${YELLOW}提示: 应用启动后会自动创建表结构，但数据库必须已存在${NC}"
    fi
    echo ""
    
    cd "$SERVER_DIR"
    
    # 检查是否需要编译
    if [ ! -d "target" ] || [ ! -f "target/asteritime-server-1.0.0.jar" ]; then
        echo -e "${YELLOW}首次运行，正在编译后端...${NC}"
        cd "$PROJECT_ROOT"
        mvn clean install -DskipTests
        cd "$SERVER_DIR"
    fi
    
    echo -e "${YELLOW}启动后端服务器 (Spring Boot)...${NC}"
    echo -e "${YELLOW}日志文件: $SERVER_LOG${NC}"
    
    # 启动服务器
    nohup mvn spring-boot:run > "$SERVER_LOG" 2>&1 &
    local pid=$!
    echo $pid > "$SERVER_PID"
    
    echo -e "${GREEN}后端服务器已启动 (PID: $pid)${NC}"
    echo -e "${YELLOW}等待后端启动...${NC}"
    
    # 等待服务器启动
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 后端服务器启动成功！${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    
    echo ""
    echo -e "${YELLOW}后端服务器启动中，请查看日志: $SERVER_LOG${NC}"
    return 0
}

# 启动前端服务器
start_frontend() {
    # 检查 Node.js 和 npm
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: Node.js 未安装${NC}"
        echo -e "${YELLOW}请安装 Node.js: https://nodejs.org/${NC}"
        return 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: npm 未安装${NC}"
        return 1
    fi
    
    # 检查是否已在运行
    if [ -f "$CLIENT_PID" ]; then
        local pid=$(cat "$CLIENT_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}前端服务器已在运行 (PID: $pid)${NC}"
            return 0
        fi
    fi
    
    cd "$CLIENT_DIR"
    
    # 检查 node_modules 是否存在
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}首次运行，正在安装前端依赖...${NC}"
        npm install
    fi
    
    echo -e "${YELLOW}启动前端服务器 (React)...${NC}"
    echo -e "${YELLOW}日志文件: $CLIENT_LOG${NC}"
    
    # 启动前端服务器
    nohup npm start > "$CLIENT_LOG" 2>&1 &
    local pid=$!
    echo $pid > "$CLIENT_PID"
    
    echo -e "${GREEN}前端服务器已启动 (PID: $pid)${NC}"
    echo -e "${YELLOW}等待前端启动...${NC}"
    
    # 等待前端启动
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 前端服务器启动成功！${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    
    echo ""
    echo -e "${YELLOW}前端服务器启动中，请查看日志: $CLIENT_LOG${NC}"
    return 0
}

# 启动后端服务器（单独）
cmd_backend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}启动后端服务器${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    if ! start_backend; then
        echo -e "${RED}后端启动失败，请查看日志: $SERVER_LOG${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}后端服务器启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}后端 API:${NC}  http://localhost:8080/api"
    echo -e "${GREEN}日志文件:${NC}  $SERVER_LOG"
    echo ""
    echo -e "${YELLOW}提示:${NC}"
    echo -e "  - 在另一个终端运行 './asteritime.sh frontend' 启动前端"
    echo -e "  - 使用 './asteritime.sh logs -f' 查看实时日志"
    echo -e "  - 使用 './asteritime.sh stop:backend' 停止后端"
}

# 启动前端服务器（单独）
cmd_frontend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}启动前端服务器${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    if ! start_frontend; then
        echo -e "${RED}前端启动失败，请查看日志: $CLIENT_LOG${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}前端服务器启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}前端应用:${NC}  http://localhost:3000"
    echo -e "${GREEN}日志文件:${NC}  $CLIENT_LOG"
    echo ""
    echo -e "${YELLOW}提示:${NC}"
    echo -e "  - 确保后端已启动: './asteritime.sh backend'"
    echo -e "  - 使用 './asteritime.sh logs frontend -f' 查看实时日志"
    echo -e "  - 使用 './asteritime.sh stop:frontend' 停止前端"
}

# 启动开发服务器（后端 + 前端，后台运行）
cmd_dev() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}启动开发服务器（后端 + 前端，后台运行）${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}提示: 推荐使用以下方式分别启动，便于调试:${NC}"
    echo -e "  终端1: ./asteritime.sh backend"
    echo -e "  终端2: ./asteritime.sh frontend"
    echo ""
    read -p "是否继续后台启动? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}已取消${NC}"
        exit 0
    fi
    echo ""
    
    # 启动后端
    echo -e "${BLUE}[1/2] 启动后端服务器...${NC}"
    if ! start_backend; then
        echo -e "${RED}后端启动失败，请查看日志: $SERVER_LOG${NC}"
        exit 1
    fi
    echo ""
    
    # 启动前端
    echo -e "${BLUE}[2/2] 启动前端服务器...${NC}"
    if ! start_frontend; then
        echo -e "${RED}前端启动失败，请查看日志: $CLIENT_LOG${NC}"
        exit 1
    fi
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}所有服务启动成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}后端 API:${NC}  http://localhost:8080/api"
    echo -e "${GREEN}前端应用:${NC}  http://localhost:3000"
    echo ""
    echo -e "${YELLOW}使用以下命令查看日志:${NC}"
    echo -e "  ./asteritime.sh logs          # 后端日志"
    echo -e "  ./asteritime.sh logs -f       # 实时跟踪后端日志"
    echo -e "  ./asteritime.sh logs frontend  # 前端日志"
    echo -e "${YELLOW}使用以下命令停止服务:${NC}"
    echo -e "  ./asteritime.sh stop"
}

# 停止后端服务器
cmd_stop_backend() {
    echo -e "${YELLOW}停止后端服务器...${NC}"
    
    if [ -f "$SERVER_PID" ]; then
        local pid=$(cat "$SERVER_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}后端服务器已停止 (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}后端服务器进程不存在${NC}"
        fi
        rm -f "$SERVER_PID"
    else
        echo -e "${YELLOW}未找到运行中的后端服务器${NC}"
    fi
}

# 停止前端服务器
cmd_stop_frontend() {
    echo -e "${YELLOW}停止前端服务器...${NC}"
    
    if [ -f "$CLIENT_PID" ]; then
        local pid=$(cat "$CLIENT_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}前端服务器已停止 (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}前端服务器进程不存在${NC}"
        fi
        rm -f "$CLIENT_PID"
    else
        echo -e "${YELLOW}未找到运行中的前端服务器${NC}"
    fi
}

# 停止所有开发服务器
cmd_stop() {
    echo -e "${YELLOW}停止所有开发服务器...${NC}"
    
    local stopped=0
    
    # 停止后端
    if [ -f "$SERVER_PID" ]; then
        local pid=$(cat "$SERVER_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}后端服务器已停止 (PID: $pid)${NC}"
            stopped=1
        fi
        rm -f "$SERVER_PID"
    fi
    
    # 停止前端
    if [ -f "$CLIENT_PID" ]; then
        local pid=$(cat "$CLIENT_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}前端服务器已停止 (PID: $pid)${NC}"
            stopped=1
        fi
        rm -f "$CLIENT_PID"
    fi
    
    if [ $stopped -eq 0 ]; then
        echo -e "${YELLOW}未找到运行中的服务器${NC}"
    else
        echo -e "${GREEN}所有服务已停止！${NC}"
    fi
}

# 查看应用日志
cmd_logs() {
    local log_type=${1:-backend}
    local follow=${2:-}
    
    if [ "$log_type" == "frontend" ] || [ "$log_type" == "client" ]; then
        if [ ! -f "$CLIENT_LOG" ]; then
            echo -e "${YELLOW}前端日志文件不存在: $CLIENT_LOG${NC}"
            return 1
        fi
        
        if [ "$follow" == "-f" ] || [ "$follow" == "--follow" ]; then
            tail -f "$CLIENT_LOG"
        else
            tail -n 100 "$CLIENT_LOG"
        fi
    else
        if [ ! -f "$SERVER_LOG" ]; then
            echo -e "${YELLOW}后端日志文件不存在: $SERVER_LOG${NC}"
            return 1
        fi
        
        if [ "$log_type" == "-f" ] || [ "$log_type" == "--follow" ]; then
            tail -f "$SERVER_LOG"
        else
            tail -n 100 "$SERVER_LOG"
        fi
    fi
}

# 清理
cmd_clean() {
    echo -e "${YELLOW}清理编译产物和日志...${NC}"
    
    # 停止服务器
    if [ -f "$SERVER_PID" ]; then
        cmd_stop
    fi
    
    # 清理 Maven 编译产物
    echo -e "${YELLOW}清理 Maven 编译产物...${NC}"
    cd "$PROJECT_ROOT"
    mvn clean
    
    # 清理日志
    if [ -f "$SERVER_LOG" ]; then
        rm -f "$SERVER_LOG"
        echo -e "${GREEN}已删除后端日志文件${NC}"
    fi
    
    if [ -f "$CLIENT_LOG" ]; then
        rm -f "$CLIENT_LOG"
        echo -e "${GREEN}已删除前端日志文件${NC}"
    fi
    
    # 清理 PID 文件
    rm -f "$SERVER_PID"
    rm -f "$CLIENT_PID"
    
    echo -e "${GREEN}清理完成！${NC}"
}

# 显示帮助信息
cmd_help() {
    cat << EOF
${BLUE}AsteriTime 统一管理脚本${NC}

${GREEN}使用方法:${NC}
  ./asteritime.sh [command] [options]

${GREEN}命令列表:${NC}
  ${YELLOW}setup${NC}             初始环境配置（检查 Java、Maven、MySQL 等）
  ${YELLOW}build${NC}             编译项目
  ${YELLOW}backend${NC}           启动后端服务器（单独启动，推荐）
  ${YELLOW}frontend${NC}          启动前端服务器（单独启动，推荐）
  ${YELLOW}dev${NC}               启动开发服务器（后端 + 前端，后台运行）
  ${YELLOW}stop${NC}              停止所有开发服务器
  ${YELLOW}stop:backend${NC}      停止后端服务器
  ${YELLOW}stop:frontend${NC}     停止前端服务器
  ${YELLOW}logs${NC}              查看后端日志（添加 -f 实时跟踪）
  ${YELLOW}logs frontend${NC}     查看前端日志（添加 -f 实时跟踪）
  ${YELLOW}clean${NC}             清理编译产物和日志
  ${YELLOW}help${NC}              显示此帮助信息

${GREEN}示例:${NC}
  # 首次使用：配置环境
  ./asteritime.sh setup

  # 编译项目
  ./asteritime.sh build

  # 启动开发服务器
  ./asteritime.sh dev

  # 查看日志
  ./asteritime.sh logs             # 后端日志
  ./asteritime.sh logs -f          # 实时跟踪后端日志
  ./asteritime.sh logs frontend    # 前端日志
  ./asteritime.sh logs frontend -f # 实时跟踪前端日志

  # 清理
  ./asteritime.sh clean

${GREEN}环境变量:${NC}
  配置文件: .env
  模板文件: .env.example
  
  必需变量:
    DB_USERNAME     数据库用户名（默认: root）
    DB_PASSWORD     数据库密码
    JWT_SECRET      JWT 密钥（生产环境必须设置）

${GREEN}更多信息:${NC}
  查看 docs/ 目录下的文档获取详细说明
EOF
}

# 主函数
main() {
    local command=${1:-help}
    
    case "$command" in
        setup)
            cmd_setup
            ;;
        build)
            cmd_build
            ;;
        backend)
            cmd_backend
            ;;
        frontend)
            cmd_frontend
            ;;
        dev|start)
            cmd_dev
            ;;
        stop)
            cmd_stop
            ;;
        stop:backend)
            cmd_stop_backend
            ;;
        stop:frontend)
            cmd_stop_frontend
            ;;
        logs)
            cmd_logs "$2" "$3"
            ;;
        clean)
            cmd_clean
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            echo -e "${RED}未知命令: $command${NC}"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
