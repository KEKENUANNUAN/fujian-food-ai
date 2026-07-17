@echo off
chcp 65001 >nul
setlocal
title 福建非遗美食助手

echo.
echo ╔════════════════════════════════════════════╗
echo ║       🍜 福建非遗美食助手                    ║
echo ║       一键启动                               ║
echo ╚════════════════════════════════════════════╝
echo.

:: [1/4] 检查 Node.js
echo [1/4] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 未找到 Node.js，请安装 Node.js 18+
    echo   下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo   ✓ Node.js %%i

:: [2/4] 检查 .env 配置
echo [2/4] 检查 API 配置...
if not exist ".env" (
    echo   [错误] 未找到 .env 配置文件
    echo   请在项目根目录创建 .env 并填写以下内容:
    echo.
    echo     CODEBUDDY_API_KEY=你的API密钥
    echo.
    pause
    exit /b 1
)
findstr /c:"CODEBUDDY_API_KEY=ck_" .env >nul 2>&1
if %errorlevel% neq 0 (
    echo   [警告] .env 中未检测到有效的 CODEBUDDY_API_KEY
    echo   服务可能无法正常工作，请确认已填写以 ck_ 开头的 API 密钥
    echo.
    choice /c yn /m "  是否继续启动"
    if errorlevel 2 exit /b 1
)
echo   ✓ 配置文件就绪

:: [3/4] 检查端口占用 & 安装依赖
echo [3/4] 检查运行环境...

:: 检查端口 3000
netstat -ano 2>nul | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [警告] 端口 3000 已被占用，后端可能无法启动
    echo   请关闭占用该端口的程序后重试
)

:: 检查端口 5173
netstat -ano 2>nul | findstr ":5173 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [警告] 端口 5173 已被占用，前端可能无法启动
    echo   请关闭占用该端口的程序后重试
)

:: 安装依赖
if not exist "node_modules\" (
    echo   正在安装依赖，首次启动可能需要几分钟...
    call npm install
    if %errorlevel% neq 0 (
        echo   [错误] 依赖安装失败
        echo   请检查网络连接后重试，或手动运行 npm install
        echo.
        pause
        exit /b 1
    )
)
echo   ✓ 依赖就绪

:: [4/4] 启动服务
echo [4/4] 启动服务...
echo.
echo ════════════════════════════════════════════
echo   前端页面:  http://localhost:5173
echo   后端 API:  http://localhost:3000
echo   API 端点:  copilot.tencent.com (直连)
echo   可用模型:  auto / deepseek-v4-pro / glm-5.2 / hy3
echo ════════════════════════════════════════════
echo.
echo   按 Ctrl+C 停止服务
echo   浏览器将在 5 秒后自动打开...
echo.

:: 延迟 5 秒后前台打开浏览器（新窗口可见倒计时）
start "正在打开浏览器..." cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:5173"

:: 启动前后端开发服务
npm run dev

:: 如果服务异常退出
echo.
echo 服务已停止。
pause
