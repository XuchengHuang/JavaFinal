#!/bin/bash

###############################################################################
# AsteriTime Unified Management Script
# 
# Features:
#   - Environment configuration check and setup
#   - Project compilation
#   - Local development server
#   - Debugging and log viewing
#
# Usage:
#   ./asteritime.sh [command] [options]
#
# Commands:
#   setup       - Initial environment setup (check Java, Maven, MySQL, etc.)
#   build       - Build project
#   backend     - Start backend server (standalone)
#   frontend    - Start frontend server (standalone)
#   dev         - Start development servers (backend + frontend, background)
#   stop        - Stop all development servers
#   stop:backend - Stop backend server
#   stop:frontend - Stop frontend server
#   logs        - View backend logs (add -f for real-time tracking)
#   logs frontend - View frontend logs (add -f for real-time tracking)
#   clean       - Clean build artifacts and logs
#   help        - Show help information
###############################################################################

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/asteritime-server"
CLIENT_DIR="$PROJECT_ROOT/asteritime-client"

# Log files
SERVER_LOG="$PROJECT_ROOT/server.log"
SERVER_PID="$PROJECT_ROOT/server.pid"
CLIENT_LOG="$PROJECT_ROOT/client.log"
CLIENT_PID="$PROJECT_ROOT/client.pid"

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    else
        echo "unknown"
    fi
}

# Setup Java 21 environment
setup_java() {
    local os=$(detect_os)
    
    if [ "$os" == "macos" ]; then
        # macOS: Try to use Homebrew installed Java 21
        if [ -d "/opt/homebrew/Cellar/openjdk@21" ]; then
            local java_path=$(find /opt/homebrew/Cellar/openjdk@21 -name "openjdk.jdk" -type d | head -1)
            if [ -n "$java_path" ]; then
                export JAVA_HOME="$java_path/Contents/Home"
                export PATH="$JAVA_HOME/bin:$PATH"
                return 0
            fi
        fi
        # Try to use /usr/libexec/java_home
        if command -v /usr/libexec/java_home &> /dev/null; then
            local java_home=$(/usr/libexec/java_home -v 21 2>/dev/null)
            if [ -n "$java_home" ]; then
                export JAVA_HOME="$java_home"
                export PATH="$JAVA_HOME/bin:$PATH"
                return 0
            fi
        fi
    elif [ "$os" == "linux" ]; then
        # Linux: Try common Java 21 paths
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
    
    # If not found, check system default Java version
    if command -v java &> /dev/null; then
        local java_version=$(java -version 2>&1 | head -1 | grep -oP 'version "?(1\.)?\K\d+' || echo "0")
        if [ "$java_version" -ge 21 ]; then
            echo -e "${GREEN}Using system default Java (version $java_version)${NC}"
            return 0
        fi
    fi
    
    return 1
}

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${BLUE}Loading environment variables: .env${NC}"
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        return 0
    elif [ -f "$PROJECT_ROOT/.env.example" ]; then
        echo -e "${YELLOW}Warning: .env file does not exist, creating from .env.example${NC}"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        echo -e "${GREEN}.env file created${NC}"
        echo -e "${YELLOW}Tip: Please edit .env file to set database password and other configurations${NC}"
        # Load the newly created file
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        return 0
    else
        echo -e "${YELLOW}Warning: Environment variable configuration file not found${NC}"
        return 1
    fi
}

# Check dependencies
check_dependencies() {
    local missing=()
    
    # Check Java
    if ! setup_java; then
        missing+=("Java 21")
    else
        local java_version=$(java -version 2>&1 | head -1)
        echo -e "${GREEN}✓ Java: $java_version${NC}"
    fi
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        missing+=("Maven")
    else
        local mvn_version=$(mvn -version | head -1)
        echo -e "${GREEN}✓ Maven: $mvn_version${NC}"
    fi
    
    # Check MySQL client
    if command -v mysql &> /dev/null || command -v mysqladmin &> /dev/null; then
        echo -e "${GREEN}✓ MySQL client installed${NC}"
    else
        echo -e "${YELLOW}⚠ MySQL client not installed${NC}"
    fi
    
    # Check Node.js and npm (required for frontend)
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        echo -e "${GREEN}✓ Node.js: $node_version${NC}"
    else
        echo -e "${YELLOW}⚠ Node.js not installed (required for frontend)${NC}"
        missing+=("Node.js")
    fi
    
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        echo -e "${GREEN}✓ npm: $npm_version${NC}"
    else
        echo -e "${YELLOW}⚠ npm not installed (required for frontend)${NC}"
        missing+=("npm")
    fi
    
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Missing dependencies: ${missing[*]}${NC}"
        return 1
    fi
    
    return 0
}

# Check MySQL connection and database
check_mysql() {
    local db_user=${DB_USERNAME:-root}
    local db_pass=${DB_PASSWORD:-}
    
    if [ -z "$db_pass" ]; then
        echo -e "${YELLOW}Tip: DB_PASSWORD not set, skipping MySQL connection check${NC}"
        return 0
    fi
    
    if ! command -v mysqladmin &> /dev/null && ! command -v mysql &> /dev/null; then
        echo -e "${YELLOW}⚠ MySQL client not installed, skipping database check${NC}"
        return 0
    fi
    
    # Check if MySQL service is running
    if command -v mysqladmin &> /dev/null; then
        if ! mysqladmin ping -h localhost -u "$db_user" -p"$db_pass" --silent 2>/dev/null; then
            echo -e "${YELLOW}⚠ MySQL service not running or connection failed${NC}"
            echo -e "${YELLOW}Tip: Please ensure MySQL service is started${NC}"
            return 1
        fi
        echo -e "${GREEN}✓ MySQL service running normally${NC}"
    fi
    
    # Check if database exists
    if command -v mysql &> /dev/null; then
        local db_exists=$(mysql -h localhost -u "$db_user" -p"$db_pass" -e "SHOW DATABASES LIKE 'asteritime';" 2>/dev/null | grep -c asteritime || echo "0")
        if [ "$db_exists" -eq 0 ]; then
            echo -e "${YELLOW}⚠ Database 'asteritime' does not exist${NC}"
            echo -e "${YELLOW}Tip: Run the following command to create database:${NC}"
            echo -e "  mysql -u $db_user -p -e \"CREATE DATABASE asteritime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
            return 1
        else
            echo -e "${GREEN}✓ Database 'asteritime' exists${NC}"
        fi
    fi
    
    return 0
}

# Initial environment setup
cmd_setup() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}AsteriTime Environment Configuration Check${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    # Setup Java
    if ! setup_java; then
        echo -e "${RED}Error: Java 21 not found${NC}"
        echo -e "${YELLOW}Please install Java 21:${NC}"
        echo -e "  macOS: brew install openjdk@21"
        echo -e "  Linux: sudo apt-get install openjdk-21-jdk"
        exit 1
    fi
    
    echo -e "${GREEN}Java environment configured${NC}"
    echo -e "  JAVA_HOME: $JAVA_HOME"
    echo -e "  Java version: $(java -version 2>&1 | head -1)"
    echo ""
    
    # Check dependencies
    echo -e "${BLUE}Checking dependencies...${NC}"
    if ! check_dependencies; then
        echo -e "${RED}Please install missing dependencies and try again${NC}"
        exit 1
    fi
    echo ""
    
    # Load environment variables
    echo -e "${BLUE}Configuring environment variables...${NC}"
    if ! load_env; then
        echo -e "${YELLOW}Environment variable configuration incomplete, but can continue${NC}"
    fi
    echo ""
    
    # Check MySQL
    echo -e "${BLUE}Checking database connection...${NC}"
    check_mysql
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Environment setup completed!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Build project
cmd_build() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Building AsteriTime Project${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    if ! setup_java; then
        echo -e "${RED}Error: Java 21 not found${NC}"
        exit 1
    fi
    
    load_env
    
    cd "$PROJECT_ROOT"
    echo -e "${YELLOW}Java version: $(java -version 2>&1 | head -1)${NC}"
    echo -e "${YELLOW}Maven version: $(mvn -version | head -1)${NC}"
    echo ""
    
    echo -e "${YELLOW}Starting build...${NC}"
    mvn clean install -DskipTests
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Build completed!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Start backend server
start_backend() {
    if ! setup_java; then
        echo -e "${RED}Error: Java 21 not found${NC}"
        return 1
    fi
    
    # Load environment variables (will try to auto-create if failed)
    if ! load_env; then
        echo -e "${YELLOW}Warning: Environment variable configuration incomplete, continuing with defaults${NC}"
    fi
    
    # Check if already running
    if [ -f "$SERVER_PID" ]; then
        local pid=$(cat "$SERVER_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Backend server already running (PID: $pid)${NC}"
            return 0
        fi
    fi
    
    # Check MySQL (optional, failure won't prevent startup)
    echo -e "${BLUE}Checking database...${NC}"
    if ! check_mysql; then
        echo -e "${YELLOW}Warning: Database check failed, but will continue to start application${NC}"
        echo -e "${YELLOW}Tip: Application will auto-create table structure after startup, but database must exist${NC}"
    fi
    echo ""
    
    cd "$SERVER_DIR"
    
    # Check if compilation is needed
    if [ ! -d "target" ] || [ ! -f "target/asteritime-server-1.0.0.jar" ]; then
        echo -e "${YELLOW}First run, compiling backend...${NC}"
        cd "$PROJECT_ROOT"
        mvn clean install -DskipTests
        cd "$SERVER_DIR"
    fi
    
    echo -e "${YELLOW}Starting backend server (Spring Boot)...${NC}"
    echo -e "${YELLOW}Log file: $SERVER_LOG${NC}"
    
    # Start server
    nohup mvn spring-boot:run > "$SERVER_LOG" 2>&1 &
    local pid=$!
    echo $pid > "$SERVER_PID"
    
    echo -e "${GREEN}Backend server started (PID: $pid)${NC}"
    echo -e "${YELLOW}Waiting for backend to start...${NC}"
    
    # Wait for server to start
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8080/api/auth/login > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend server started successfully!${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    
    echo ""
    echo -e "${YELLOW}Backend server starting, please check logs: $SERVER_LOG${NC}"
    return 0
}

# Start frontend server
start_frontend() {
    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js not installed${NC}"
        echo -e "${YELLOW}Please install Node.js: https://nodejs.org/${NC}"
        return 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm not installed${NC}"
        return 1
    fi
    
    # 检查是否已在运行
    if [ -f "$CLIENT_PID" ]; then
        local pid=$(cat "$CLIENT_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Frontend server already running (PID: $pid)${NC}"
            return 0
        fi
    fi
    
    cd "$CLIENT_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}First run, installing frontend dependencies...${NC}"
        npm install
    fi
    
    echo -e "${YELLOW}Starting frontend server (React)...${NC}"
    echo -e "${YELLOW}Log file: $CLIENT_LOG${NC}"
    
    # Start frontend server
    nohup npm start > "$CLIENT_LOG" 2>&1 &
    local pid=$!
    echo $pid > "$CLIENT_PID"
    
    echo -e "${GREEN}Frontend server started (PID: $pid)${NC}"
    echo -e "${YELLOW}Waiting for frontend to start...${NC}"
    
    # Wait for frontend to start
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend server started successfully!${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    
    echo ""
    echo -e "${YELLOW}Frontend server starting, please check logs: $CLIENT_LOG${NC}"
    return 0
}

# Start backend server (standalone)
cmd_backend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Starting Backend Server${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    if ! start_backend; then
        echo -e "${RED}Backend startup failed, please check logs: $SERVER_LOG${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Backend Server Started Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Backend API:${NC}  http://localhost:8080/api"
    echo -e "${GREEN}Log file:${NC}  $SERVER_LOG"
    echo ""
    echo -e "${YELLOW}Tips:${NC}"
    echo -e "  - Run './asteritime.sh frontend' in another terminal to start frontend"
    echo -e "  - Use './asteritime.sh logs -f' to view real-time logs"
    echo -e "  - Use './asteritime.sh stop:backend' to stop backend"
}

# Start frontend server (standalone)
cmd_frontend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Starting Frontend Server${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    if ! start_frontend; then
        echo -e "${RED}Frontend startup failed, please check logs: $CLIENT_LOG${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Frontend Server Started Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Frontend app:${NC}  http://localhost:3000"
    echo -e "${GREEN}Log file:${NC}  $CLIENT_LOG"
    echo ""
    echo -e "${YELLOW}Tips:${NC}"
    echo -e "  - Ensure backend is started: './asteritime.sh backend'"
    echo -e "  - Use './asteritime.sh logs frontend -f' to view real-time logs"
    echo -e "  - Use './asteritime.sh stop:frontend' to stop frontend"
}

# Start development servers (backend + frontend, background)
cmd_dev() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Starting Development Servers (Backend + Frontend, Background)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Tip: Recommended to start separately for easier debugging:${NC}"
    echo -e "  Terminal 1: ./asteritime.sh backend"
    echo -e "  Terminal 2: ./asteritime.sh frontend"
    echo ""
    read -p "Continue with background startup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    echo ""
    
    # Start backend
    echo -e "${BLUE}[1/2] Starting backend server...${NC}"
    if ! start_backend; then
        echo -e "${RED}Backend startup failed, please check logs: $SERVER_LOG${NC}"
        exit 1
    fi
    echo ""
    
    # Start frontend
    echo -e "${BLUE}[2/2] Starting frontend server...${NC}"
    if ! start_frontend; then
        echo -e "${RED}Frontend startup failed, please check logs: $CLIENT_LOG${NC}"
        exit 1
    fi
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}All Services Started Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Backend API:${NC}  http://localhost:8080/api"
    echo -e "${GREEN}Frontend app:${NC}  http://localhost:3000"
    echo ""
    echo -e "${YELLOW}Use the following commands to view logs:${NC}"
    echo -e "  ./asteritime.sh logs          # Backend logs"
    echo -e "  ./asteritime.sh logs -f       # Real-time backend logs"
    echo -e "  ./asteritime.sh logs frontend  # Frontend logs"
    echo -e "${YELLOW}Use the following commands to stop services:${NC}"
    echo -e "  ./asteritime.sh stop"
}

# Stop backend server
cmd_stop_backend() {
    echo -e "${YELLOW}Stopping backend server...${NC}"
    
    if [ -f "$SERVER_PID" ]; then
        local pid=$(cat "$SERVER_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}Backend server stopped (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}Backend server process does not exist${NC}"
        fi
        rm -f "$SERVER_PID"
    else
        echo -e "${YELLOW}No running backend server found${NC}"
    fi
}

# Stop frontend server
cmd_stop_frontend() {
    echo -e "${YELLOW}Stopping frontend server...${NC}"
    
    if [ -f "$CLIENT_PID" ]; then
        local pid=$(cat "$CLIENT_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}Frontend server stopped (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}Frontend server process does not exist${NC}"
        fi
        rm -f "$CLIENT_PID"
    else
        echo -e "${YELLOW}No running frontend server found${NC}"
    fi
}

# Stop all development servers
cmd_stop() {
    echo -e "${YELLOW}Stopping all development servers...${NC}"
    
    local stopped=0
    
    # Stop backend
    if [ -f "$SERVER_PID" ]; then
        local pid=$(cat "$SERVER_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}Backend server stopped (PID: $pid)${NC}"
            stopped=1
        fi
        rm -f "$SERVER_PID"
    fi
    
    # Stop frontend
    if [ -f "$CLIENT_PID" ]; then
        local pid=$(cat "$CLIENT_PID")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            echo -e "${GREEN}Frontend server stopped (PID: $pid)${NC}"
            stopped=1
        fi
        rm -f "$CLIENT_PID"
    fi
    
    if [ $stopped -eq 0 ]; then
        echo -e "${YELLOW}No running servers found${NC}"
    else
        echo -e "${GREEN}All services stopped!${NC}"
    fi
}

# View application logs
cmd_logs() {
    local log_type=${1:-backend}
    local follow=${2:-}
    
    if [ "$log_type" == "frontend" ] || [ "$log_type" == "client" ]; then
        if [ ! -f "$CLIENT_LOG" ]; then
            echo -e "${YELLOW}Frontend log file does not exist: $CLIENT_LOG${NC}"
            return 1
        fi
        
        if [ "$follow" == "-f" ] || [ "$follow" == "--follow" ]; then
            tail -f "$CLIENT_LOG"
        else
            tail -n 100 "$CLIENT_LOG"
        fi
    else
        if [ ! -f "$SERVER_LOG" ]; then
            echo -e "${YELLOW}Backend log file does not exist: $SERVER_LOG${NC}"
            return 1
        fi
        
        if [ "$log_type" == "-f" ] || [ "$log_type" == "--follow" ]; then
            tail -f "$SERVER_LOG"
        else
            tail -n 100 "$SERVER_LOG"
        fi
    fi
}

# Clean
cmd_clean() {
    echo -e "${YELLOW}Cleaning build artifacts and logs...${NC}"
    
    # Stop servers
    if [ -f "$SERVER_PID" ]; then
        cmd_stop
    fi
    
    # Clean Maven build artifacts
    echo -e "${YELLOW}Cleaning Maven build artifacts...${NC}"
    cd "$PROJECT_ROOT"
    mvn clean
    
    # Clean logs
    if [ -f "$SERVER_LOG" ]; then
        rm -f "$SERVER_LOG"
        echo -e "${GREEN}Deleted backend log file${NC}"
    fi
    
    if [ -f "$CLIENT_LOG" ]; then
        rm -f "$CLIENT_LOG"
        echo -e "${GREEN}Deleted frontend log file${NC}"
    fi
    
    # Clean PID files
    rm -f "$SERVER_PID"
    rm -f "$CLIENT_PID"
    
    echo -e "${GREEN}Clean completed!${NC}"
}

# Show help information
cmd_help() {
    cat << EOF
${BLUE}AsteriTime Unified Management Script${NC}

${GREEN}Usage:${NC}
  ./asteritime.sh [command] [options]

${GREEN}Commands:${NC}
  ${YELLOW}setup${NC}             Initial environment setup (check Java, Maven, MySQL, etc.)
  ${YELLOW}build${NC}             Build project
  ${YELLOW}backend${NC}           Start backend server (standalone, recommended)
  ${YELLOW}frontend${NC}          Start frontend server (standalone, recommended)
  ${YELLOW}dev${NC}               Start development servers (backend + frontend, background)
  ${YELLOW}stop${NC}              Stop all development servers
  ${YELLOW}stop:backend${NC}      Stop backend server
  ${YELLOW}stop:frontend${NC}     Stop frontend server
  ${YELLOW}logs${NC}              View backend logs (add -f for real-time tracking)
  ${YELLOW}logs frontend${NC}     View frontend logs (add -f for real-time tracking)
  ${YELLOW}clean${NC}             Clean build artifacts and logs
  ${YELLOW}help${NC}              Show this help information

${GREEN}Examples:${NC}
  # First time: configure environment
  ./asteritime.sh setup

  # Build project
  ./asteritime.sh build

  # Start development servers
  ./asteritime.sh dev

  # View logs
  ./asteritime.sh logs             # Backend logs
  ./asteritime.sh logs -f          # Real-time backend logs
  ./asteritime.sh logs frontend    # Frontend logs
  ./asteritime.sh logs frontend -f # Real-time frontend logs

  # Clean
  ./asteritime.sh clean

${GREEN}Environment Variables:${NC}
  Config file: .env
  Template file: .env.example
  
  Required variables:
    DB_USERNAME     Database username (default: root)
    DB_PASSWORD     Database password
    JWT_SECRET      JWT secret (must be set in production)

${GREEN}More Information:${NC}
  See documentation in docs/ directory for detailed instructions
EOF
}

# Main function
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
            echo -e "${RED}Unknown command: $command${NC}"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"
