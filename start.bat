@echo off
REM AsteriTime 一键启动脚本 (Windows)
REM 使用方法: start.bat [server|client|all]

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set SERVER_DIR=%PROJECT_ROOT%asteritime-server
set CLIENT_DIR=%PROJECT_ROOT%asteritime-client

if "%1"=="" set MODE=all
if "%1"=="server" set MODE=server
if "%1"=="client" set MODE=client
if "%1"=="all" set MODE=all
if "%1"=="stop" set MODE=stop

if "%MODE%"=="stop" (
    echo 停止所有服务...
    taskkill /F /FI "WINDOWTITLE eq AsteriTime*" 2>nul
    if exist "%PROJECT_ROOT%server.pid" del "%PROJECT_ROOT%server.pid"
    if exist "%PROJECT_ROOT%client.pid" del "%PROJECT_ROOT%client.pid"
    echo 所有服务已停止
    exit /b
)

if "%MODE%"=="server" (
    echo 启动后端服务器...
    cd /d "%SERVER_DIR%"
    if not exist "target" (
        echo 首次运行，正在编译...
        call mvn clean install -DskipTests
    )
    start "AsteriTime Server" mvn spring-boot:run
    echo 后端服务器已启动
    pause
    exit /b
)

if "%MODE%"=="client" (
    echo 启动前端客户端...
    cd /d "%CLIENT_DIR%"
    if not exist "target" (
        echo 首次运行，正在编译...
        call mvn clean install -DskipTests
    )
    start "AsteriTime Client" mvn exec:java
    echo 前端客户端已启动
    pause
    exit /b
)

if "%MODE%"=="all" (
    echo 启动所有服务...
    
    REM 启动后端
    echo 启动后端服务器...
    cd /d "%SERVER_DIR%"
    if not exist "target" (
        echo 首次运行，正在编译...
        call mvn clean install -DskipTests
    )
    start "AsteriTime Server" mvn spring-boot:run
    
    REM 等待后端启动
    timeout /t 5 /nobreak >nul
    
    REM 启动前端
    echo 启动前端客户端...
    cd /d "%CLIENT_DIR%"
    if not exist "target" (
        echo 首次运行，正在编译...
        call mvn clean install -DskipTests
    )
    start "AsteriTime Client" mvn exec:java
    
    echo.
    echo ========================================
    echo 所有服务已启动!
    echo 后端: http://localhost:8080/api
    echo 前端: Swing GUI 窗口
    echo ========================================
    pause
    exit /b
)

echo 使用方法: start.bat [server^|client^|all^|stop]
echo   server  - 只启动后端
echo   client  - 只启动前端
echo   all     - 启动后端和前端 (默认)
echo   stop    - 停止所有服务

