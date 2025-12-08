@echo off
REM AsteriTime 后端启动脚本 (Windows)
REM 使用方法: start.bat [start|stop]

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set SERVER_DIR=%PROJECT_ROOT%asteritime-server

if "%1"=="" set MODE=start
if "%1"=="start" set MODE=start
if "%1"=="stop" set MODE=stop

if "%MODE%"=="stop" (
    echo 停止后端服务器...
    if exist "%PROJECT_ROOT%server.pid" (
        for /f %%i in (%PROJECT_ROOT%server.pid) do (
            taskkill /F /PID %%i >nul 2>&1
        )
        del "%PROJECT_ROOT%server.pid"
        echo 后端服务器已停止
    ) else (
        echo 未找到运行中的服务器
    )
    exit /b
)

if "%MODE%"=="start" (
    echo 启动后端服务器...
    cd /d "%SERVER_DIR%"
    if not exist "target" (
        echo 首次运行，正在编译...
        call mvn clean install -DskipTests
    )
    start "AsteriTime Server" mvn spring-boot:run
    echo.
    echo ========================================
    echo 后端服务器已启动
    echo API 地址: http://localhost:8080/api
    echo ========================================
    echo.
    echo 提示: 运行 start.bat stop 可以停止服务器
    pause
    exit /b
)

echo 使用方法: start.bat [start^|stop]
echo   start  - 启动后端服务器 (默认)
echo   stop   - 停止后端服务器
