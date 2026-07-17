#!/bin/bash
# 福建非遗美食助手 - 一键启动 (Bash / Git Bash / macOS / Linux)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🍜 福建非遗美食助手                    ║${NC}"
echo -e "${CYAN}║       一键启动                               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# [1/4] 检查 Node.js
echo -e "${BOLD}[1/4]${NC} 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}[错误] 未找到 Node.js，请安装 Node.js 18+${NC}"
    echo "  下载地址: https://nodejs.org/"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# [2/4] 检查 .env 配置
echo -e "${BOLD}[2/4]${NC} 检查 API 配置..."
if [ ! -f ".env" ]; then
    echo -e "  ${RED}[错误] 未找到 .env 配置文件${NC}"
    echo -e "  请在项目根目录创建 ${YELLOW}.env${NC} 并填写以下内容:"
    echo ""
    echo "    CODEBUDDY_API_KEY=你的API密钥"
    echo ""
    exit 1
fi

if ! grep -q "CODEBUDDY_API_KEY=ck_" .env; then
    echo -e "  ${YELLOW}[警告] .env 中未检测到有效的 CODEBUDDY_API_KEY${NC}"
    echo -e "  服务可能无法正常工作，请确认已填写以 ${CYAN}ck_${NC} 开头的 API 密钥"
    echo ""
    read -p "  是否继续启动？(y/N) " continue
    if [ "${continue,,}" != "y" ]; then
        exit 1
    fi
fi
echo -e "  ${GREEN}✓${NC} 配置文件就绪"

# [3/4] 检查端口占用 & 安装依赖
echo -e "${BOLD}[3/4]${NC} 检查运行环境..."

# 端口检查函数
check_port() {
    local port=$1
    local name=$2
    if command -v lsof &> /dev/null; then
        if lsof -i:"$port" &> /dev/null; then
            echo -e "  ${YELLOW}[警告]${NC} 端口 ${port} (${name}) 已被占用"
            return 1
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
            echo -e "  ${YELLOW}[警告]${NC} 端口 ${port} (${name}) 已被占用"
            return 1
        fi
    fi
    return 0
}

check_port 3000 "后端" || true
check_port 5173 "前端" || true

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}正在安装依赖，首次启动可能需要几分钟...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "  ${RED}[错误] 依赖安装失败${NC}"
        echo "  请检查网络连接后重试，或手动运行 npm install"
        exit 1
    fi
fi
echo -e "  ${GREEN}✓${NC} 依赖就绪"

# [4/4] 启动服务
echo -e "${BOLD}[4/4]${NC} 启动服务..."
echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "  前端页面:  ${CYAN}http://localhost:5173${NC}"
echo -e "  后端 API:  ${CYAN}http://localhost:3000${NC}"
echo -e "  API 端点:  copilot.tencent.com (直连)"
echo -e "  可用模型:  auto / deepseek-v4-pro / glm-5.2 / hy3"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止服务"
echo -e "  浏览器将在 5 秒后自动打开..."
echo ""

# 跨平台延迟打开浏览器
open_browser() {
    sleep 5
    local url="http://localhost:5173"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url" 2>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url" 2>/dev/null
    else
        # Git Bash on Windows
        cmd //c start "" "$url" 2>/dev/null
    fi
}
open_browser &

# 启动前后端开发服务
npm run dev
