# 福建非遗美食助手

基于 CodeBuddy Agent SDK 构建的 AI 应用，专注于福建非物质文化遗产美食的智能问答、文化介绍和视频资源推荐。

## 特性

- 🍜 **福建非遗美食问答** - 智能回答关于佛跳墙、沙县小吃、福州鱼丸等非遗美食的问题
- 🎬 **视频资源搜索** - 自动搜索并推荐相关美食介绍视频和纪录片
- 💬 **流式对话** - 实时显示 AI 回复
- 🔧 **工具调用** - 可视化展示 Agent 工具使用（WebSearch、WebFetch 等）
- 🔒 **权限控制** - 支持多种权限模式
- 📝 **会话管理** - 多会话切换和持久化
- 🎨 **主题切换** - 支持深色/浅色主题
- 🤖 **自定义 Agent** - 创建和管理 4 种美食相关 Agent 配置
- 🖥️ **Electron 封装** - 可作为桌面应用运行

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: React 18 + TypeScript + Vite
- **UI**: TDesign React 组件库
- **AI**: CodeBuddy Agent SDK
- **数据库**: SQLite (better-sqlite3)
- **桌面**: Electron 28

## 快速开始

### 环境要求

- Node.js 18+

### 1. 安装依赖

```bash
cd fujian-food-ai
npm install
```

### 2. 配置 API Key

编辑 `.env` 文件，填入你的 CodeBuddy API Key：

```bash
CODEBUDDY_API_KEY=你的API_Key
```

获取 API Key: https://www.codebuddy.cn

### 3. Web 浏览器开发

```bash
npm run dev
```

浏览器访问 http://localhost:5173

### 4. Electron 桌面应用开发

```bash
npm run electron:dev
```

## 项目结构

```
fujian-food-ai/
├── electron/                  # Electron 桌面封装
│   ├── main.cjs              # Electron 主进程
│   └── preload.cjs           # 预加载脚本
├── server/                    # 后端服务
│   ├── index.ts              # Express 服务器（含福建非遗美食系统提示词）
│   └── db.ts                 # 数据库操作
├── src/                      # 前端源码
│   ├── components/           # React 组件（含 AgentConfigDialog 预设模板）
│   ├── hooks/                # 自定义 Hooks
│   ├── pages/                # 页面组件
│   ├── types.ts              # 类型定义
│   ├── config.ts             # 应用配置（品牌信息）
│   └── App.tsx               # 应用入口
├── data/                     # 数据存储
│   └── chat.db               # SQLite 数据库
├── .env                      # 环境变量配置
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 预设 Agent 模板

应用内置 4 个福建非遗美食相关的 Agent 模板：

| Agent | 描述 |
|-------|------|
| 🍜 闽味美食专家 | 专注福建非遗美食的问答与推荐 |
| 🎬 美食视频猎手 | 搜索和推荐福建非遗美食的视频资源 |
| 👨‍🍳 闽菜烹饪导师 | 教授非遗美食的制作方法和工艺 |
| 📖 美食文化导游 | 讲述美食背后的历史故事和文化 |

## 使用示例

向 Agent 提问：
- "介绍一下佛跳墙的历史和制作工艺"
- "沙县小吃有哪些经典品种？"
- "帮我找福州鱼丸的制作视频"
- "推荐几道闽南地区的非遗美食"
- "泉州面线糊怎么做？"

Agent 会自动搜索网络获取最新信息，并提供相关视频链接。

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/check-login` | GET | 检查 CodeBuddy 登录状态 |
| `/api/models` | GET | 获取可用模型列表 |
| `/api/sessions` | GET | 获取所有会话 |
| `/api/sessions` | POST | 创建新会话 |
| `/api/sessions/:id` | GET | 获取单个会话 |
| `/api/sessions/:id` | PATCH | 更新会话 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/chat` | POST | 发送消息（SSE 流式响应） |
| `/api/permission-response` | POST | 响应权限请求 |

## 开发命令

```bash
# Web 开发模式（浏览器）
npm run dev              # 同时启动前后端

# 单独启动
npm run dev:server       # 后端 (port 3000)
npm run dev:client       # 前端 (port 5173)

# Electron 开发模式
npm run electron:dev     # Electron + 前后端

# 构建
npm run build            # 前端构建
npm run electron:build   # Electron 打包

# 生产运行
npm run server           # 仅后端
npm run preview          # 预览构建结果
```

## 配置

### 方式一：环境变量配置 (.env)

```bash
PORT=3000
CODEBUDDY_API_KEY=your_api_key
CODEBUDDY_INTERNET_ENVIRONMENT=external
```

### 方式二：使用 CodeBuddy CLI 登录

```bash
codebuddy login
npm run dev
```

### 方式三：Web UI 配置

在应用的设置页面中配置（仅在当前服务器进程有效）。

## License

MIT
