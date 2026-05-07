# AgentGPT 介绍及架构分析

## 一、什么是 AgentGPT

AgentGPT 是由 **Reworkd** 团队开发的开源 Web 端自主 AI 智能体平台，允许用户**在浏览器中组装、配置和部署自主 AI 智能体**。用户只需为自定义 AI 命名并设定目标，智能体便会自主思考任务、执行操作、并从结果中学习，循环迭代直至达成目标。

核心定位：

| 维度 | 说明 |
|------|------|
| **定位** | 浏览器内自主 AI 智能体部署平台 |
| **开发团队** | Reworkd (awtkns, asim-shrestha) |
| **开源协议** | GNU General Public License v3.0 |
| **GitHub 星标** | 36,000+ |
| **在线体验** | [agentgpt.reworkd.ai](https://agentgpt.reworkd.ai) |
| **核心能力** | 自主任务规划、工具调用、结果学习、循环执行 |

---

## 二、整体架构

AgentGPT 采用**前后端分离**的 B/S 架构，基于 **T3 Stack** + **FastAPI** 构建：

```
┌─────────────────────────────────────────────────────────────┐
│                     AgentGPT 架构                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Frontend (Next.js)                    │   │
│  │  ┌───────────┐ ┌──────────┐ ┌────────────────────┐  │   │
│  │  │  Pages    │ │   UI     │ │    tRPC Client     │  │   │
│  │  │ (React)   │ │Components│ │   (类型安全API)    │  │   │
│  │  └───────────┘ └──────────┘ └────────────────────┘  │   │
│  │  ┌───────────┐ ┌──────────┐ ┌────────────────────┐  │   │
│  │  │  Zustand  │ │ NextAuth │ │   Prisma Client    │  │   │
│  │  │ (状态管理)│ │(用户认证)│ │   (ORM客户端)      │  │   │
│  │  └───────────┘ └──────────┘ └────────────────────┘  │   │
│  └─────────────────────────┬────────────────────────────┘   │
│                            │ HTTP / SSE (流式响应)           │
│  ┌─────────────────────────┴────────────────────────────┐   │
│  │                 Backend (FastAPI)                     │   │
│  │  ┌───────────────┐ ┌───────────────┐                 │   │
│  │  │  Agent Service│ │  Tool System  │                 │   │
│  │  │ (智能体核心)  │ │  (工具系统)   │                 │   │
│  │  └───────────────┘ └───────────────┘                 │   │
│  │  ┌───────────────┐ ┌───────────────┐                 │   │
│  │  │ Memory Service│ │ Model Factory │                 │   │
│  │  │ (记忆服务)    │ │ (模型工厂)    │                 │   │
│  │  └───────────────┘ └───────────────┘                 │   │
│  └─────────────────────────┬────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────┐  ┌───────┴───────┐  ┌──────────────────┐  │
│  │ MySQL 数据库 │  │ Pinecone 向量 │  │  外部 API        │  │
│  │ (持久化存储) │  │ (长期记忆)    │  │  OpenAI/Serper/  │  │
│  └─────────────┘  └───────────────┘  │  Replicate/Wiki  │  │
│                                       └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、技术栈详解

### 1. 前端技术栈（T3 Stack）

| 技术 | 版本/说明 | 用途 |
|------|----------|------|
| **Next.js** | React 框架 | SSR/SSG 页面渲染、路由 |
| **TypeScript** | 主要语言 | 类型安全 |
| **tRPC** | 端到端类型安全 | 前后端 API 通信 |
| **Prisma** | ORM | 数据库操作 |
| **TailwindCSS** | CSS 框架 | UI 样式 |
| **Zustand** | 状态管理 | 客户端状态 |
| **NextAuth** | 认证框架 | Google/GitHub/Discord OAuth |
| **React Query** | 数据请求 | 服务端状态缓存 |
| **Framer Motion** | 动画库 | UI 交互动画 |
| **react-markdown** | Markdown 渲染 | 智能体输出展示 |
| **i18next** | 国际化 | 多语言支持 |

### 2. 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.11+ | 主要语言 |
| **FastAPI** | 0.98+ | Web 框架 |
| **LangChain** | 0.0.295+ | LLM 编排框架 |
| **OpenAI SDK** | 0.28+ | GPT 模型调用 |
| **SQLAlchemy** | 2.0+ | 异步 ORM |
| **aiomysql** | - | 异步 MySQL 驱动 |
| **Pinecone** | 2.2+ | 向量数据库（长期记忆） |
| **Lanarky** | 0.7+ | LangChain 流式响应集成 |
| **aiokafka** | 0.8+ | 异步消息队列 |
| **uvicorn** | 0.22+ | ASGI 服务器 |
| **tiktoken** | 0.5+ | Token 计算 |
| **Sentry SDK** | - | 错误监控 |
| **Stripe** | - | 支付集成 |

### 3. 基础设施

| 组件 | 说明 |
|------|------|
| **MySQL** | 主数据库，用户/智能体/任务持久化 |
| **Pinecone** | 向量数据库，长期记忆存储与检索 |
| **Docker** | 容器化部署 |
| **AWS (boto3)** | 云服务集成（Secrets Manager 等） |
| **Kafka** | 异步消息处理 |

---

## 四、核心模块架构

### 1. Agent Service（智能体服务）

AgentGPT 的核心智能体逻辑位于 `platform/reworkd_platform/web/api/agent/`，包含以下关键模块：

```
agent/
├── agent_service/            # 智能体服务实现
│   ├── agent_service.py      # 抽象基类
│   ├── open_ai_agent_service.py  # OpenAI 实现核心
│   ├── mock_agent_service.py # Mock 模式（开发/测试）
│   └── agent_service_provider.py # 工厂/提供者
├── tools/                    # 工具系统
│   ├── tool.py               # 工具抽象基类
│   ├── tools.py              # 工具注册表
│   ├── search.py             # 网络搜索 (Serper API)
│   ├── code.py               # 代码编写
│   ├── image.py              # 图像生成 (Replicate)
│   ├── wikipedia_search.py   # 维基百科搜索
│   ├── sidsearch.py          # SID 搜索
│   ├── conclude.py           # 任务结论
│   ├── reason.py             # 推理工具
│   └── open_ai_function.py   # OpenAI Function Calling 适配
├── prompts.py                # Prompt 模板
├── analysis.py               # 任务分析（工具选择）
├── model_factory.py          # LLM 模型工厂
├── task_output_parser.py     # 任务输出解析器
└── views.py                  # API 视图
```

### 2. 智能体运行流程

AgentGPT 的核心执行流程是一个**思考-分析-执行-学习**的循环：

```
┌──────────────────────────────────────────────────────┐
│              AgentGPT 智能体运行流程                  │
│                                                       │
│  1. start_goal_agent                                  │
│     ┌──────────────────────────────────────────┐     │
│     │  用户输入目标 → LLM 生成初始任务列表      │     │
│     │  (Plan-and-Solve Prompting 策略)          │     │
│     │  最多 5 个搜索查询/子任务                 │     │
│     └──────────────────┬───────────────────────┘     │
│                        ▼                              │
│  2. analyze_task_agent                                │
│     ┌──────────────────────────────────────────┐     │
│     │  对每个任务 → 分析应使用哪个工具          │     │
│     │  (OpenAI Function Calling 选择工具)       │     │
│     │  search / code / image / wikipedia / ...  │     │
│     └──────────────────┬───────────────────────┘     │
│                        ▼                              │
│  3. execute_task_agent                                │
│     ┌──────────────────────────────────────────┐     │
│     │  调用选定的工具执行任务                    │     │
│     │  获取执行结果                              │     │
│     └──────────────────┬───────────────────────┘     │
│                        ▼                              │
│  4. create_tasks_agent                                │
│     ┌──────────────────────────────────────────┐     │
│     │  根据执行结果 → 评估是否需要新任务        │     │
│     │  如有未完成目标 → 生成新的子任务           │     │
│     │  如目标已达成 → 输出最终结论               │     │
│     └──────────────────┬───────────────────────┘     │
│                        │                              │
│           ┌────────────┴────────────┐                │
│           ▼                         ▼                │
│     继续循环                     任务完成              │
│     (回到步骤2)              (conclude 工具)           │
└──────────────────────────────────────────────────────┘
```

### 3. 工具系统

AgentGPT 的工具系统采用**基类 + 注册表**模式：

| 工具 | 类名 | 功能 | 外部依赖 |
|------|------|------|----------|
| **Search** | `Search` | 网络搜索（默认工具） | Serper API |
| **Code** | `Code` | 代码编写与执行 | OpenAI |
| **Image** | `Image` | AI 图像生成 | Replicate API |
| **Wikipedia** | `Wikipedia` | 维基百科搜索 | Wikipedia API |
| **SID** | `SID` | SID 搜索 | SID API |
| **Reason** | `Reason` | 推理与逻辑分析 | OpenAI |
| **Conclude** | `Conclude` | 任务结论生成 | OpenAI |

工具选择机制：
- 每个工具继承 `Tool` 基类，实现 `execute()` 方法
- `analyze_task_agent` 通过 OpenAI Function Calling 自动选择最佳工具
- 支持动态可用性检查（`dynamic_available`），根据用户权限决定工具是否可用
- 默认工具为 **Search**，兜底保证总有可用工具

### 4. 记忆系统

```
┌─────────────────────────────────────────────┐
│           AgentGPT 记忆架构                  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         短期记忆 (Short-term)          │  │
│  │  • 当前会话的上下文和任务历史          │  │
│  │  • 存储在 MySQL 中                    │  │
│  │  • 通过 API 请求传递                  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         长期记忆 (Long-term)           │  │
│  │  • 跨会话的知识积累                    │  │
│  │  • 存储在 Pinecone 向量数据库          │  │
│  │  • 语义搜索检索相关记忆                │  │
│  │  • 支持回退机制 (memory_with_fallback) │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         Null Memory                    │  │
│  │  • 无记忆模式（降级/禁用时使用）       │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

记忆服务提供三种实现：
- **Pinecone Memory**：基于向量数据库的长期记忆，支持语义相似性搜索
- **Memory with Fallback**：带降级回退的记忆，Pinecone 不可用时自动切换
- **Null Memory**：无记忆模式，确保系统在记忆服务不可用时仍可运行

### 5. Prompt 工程体系

AgentGPT 的智能体行为由 5 个核心 Prompt 模板驱动：

| Prompt | 用途 | 关键策略 |
|--------|------|----------|
| `start_goal_prompt` | 根据用户目标生成初始任务列表 | **Plan-and-Solve Prompting**，限制最多 5 个查询 |
| `analyze_task_prompt` | 分析当前任务，选择最佳工具 | 强制选择 Function，要求提供 reasoning |
| `execute_task_prompt` | 执行具体子任务 | 理解问题→提取变量→高效执行 |
| `create_tasks_prompt` | 根据执行结果创建新任务 | 评估未完成任务，动态扩展 |
| `code_prompt` | 代码生成专用 | 分步骤、分文件，Markdown 格式输出 |

---

## 五、前端架构

### 目录结构

```
next/src/
├── components/       # React 组件
├── env/              # 环境变量配置
├── hooks/            # 自定义 React Hooks
├── layout/           # 布局组件
├── lib/              # 工具库
├── pages/            # Next.js 页面路由
├── server/           # tRPC 服务端
├── services/         # API 服务层
├── stores/           # Zustand 状态管理
├── styles/           # 全局样式
├── types/            # TypeScript 类型定义
├── ui/               # UI 组件库
└── utils/            # 工具函数
```

### 核心交互流程

```
用户浏览器
    │
    ▼
┌──────────────┐     SSE 流式传输     ┌──────────────┐
│  Next.js 页面 │ ◀───────────────── │  FastAPI 后端  │
│              │ ─────────────────▶ │              │
│  • 目标输入   │    HTTP 请求       │  • Agent 逻辑  │
│  • 实时展示   │                    │  • 工具调用    │
│  • 任务监控   │                    │  • 结果流式返回 │
└──────────────┘                    └──────────────┘
```

前端通过 **SSE (Server-Sent Events)** 实时接收智能体的思考过程和执行结果，用户可以看到智能体逐步完成任务的全过程。

---

## 六、API 路由结构

后端 API 采用模块化路由设计：

| 路由模块 | 路径 | 功能 |
|----------|------|------|
| **agent** | `/api/agent/` | 智能体核心接口（启动、分析、执行、创建任务） |
| **memory** | `/api/memory/` | 记忆管理（存储、检索、重置） |
| **auth** | `/api/auth/` | 用户认证（OAuth 回调、SID 集成） |
| **models** | `/api/models/` | LLM 模型配置与选择 |
| **monitoring** | `/api/monitoring/` | 系统监控与健康检查 |
| **metadata** | `/api/metadata/` | 平台元数据 |

---

## 七、与同类产品对比

| 维度 | AgentGPT | AutoGPT | BabyAGI | ChatGPT |
|------|----------|---------|---------|---------|
| **交互方式** | Web 浏览器 | CLI / Web 平台 | CLI | Web / API |
| **使用门槛** | 低（开箱即用） | 中（需部署） | 低（轻量脚本） | 极低 |
| **技术栈** | Next.js + FastAPI | Python + Docker | Python | 闭源 |
| **前端** | 完整 Web UI | 平台化 UI | 无 | 官方 UI |
| **后端框架** | FastAPI + LangChain | 自研平台 | 简单脚本 | 闭源 |
| **记忆系统** | MySQL + Pinecone | 文件存储 | 基础 | 有限上下文 |
| **工具系统** | 6 种内置工具 | Block + 插件 | 简单 | 插件/工具 |
| **部署方式** | Docker 自托管 / 在线 | Docker 自托管 | 本地 Python | SaaS |
| **流式输出** | SSE 实时流 | 支持 | 无 | 支持 |
| **认证系统** | NextAuth (多 Provider) | 无 | 无 | OpenAI 账号 |
| **开源协议** | GPL v3 | MIT / Polyform | MIT | 闭源 |

---

## 八、部署方式

### 在线体验

直接访问 [agentgpt.reworkd.ai](https://agentgpt.reworkd.ai)，无需本地安装。

### 自托管部署

**前置要求**：
- Node.js 18+
- Docker & Docker Compose
- Git
- OpenAI API Key
- Serper API Key（可选，用于搜索）
- Replicate API Token（可选，用于图像生成）

**快速安装**：

```bash
# 克隆仓库
git clone https://github.com/reworkd/AgentGPT.git
cd AgentGPT

# macOS/Linux
./setup.sh

# Windows
./setup.bat
```

**Docker Compose 启动的服务**：

| 服务 | 端口 | 说明 |
|------|------|------|
| Next.js Frontend | 3000 | Web 前端 |
| FastAPI Backend | 8000 | API 后端 |
| MySQL Database | 3307 | 数据库 |

---

## 九、AgentGPT 的核心优势与局限

### 优势

| 优势 | 说明 |
|------|------|
| **零门槛** | 浏览器即用，无需编码能力 |
| **可视化过程** | SSE 实时展示智能体思考和执行过程 |
| **Plan-and-Solve** | 先规划后执行，任务分解更合理 |
| **工具自动选择** | Function Calling 自动匹配最佳工具 |
| **长期记忆** | Pinecone 向量数据库支持跨会话记忆 |
| **完整认证** | 多 Provider OAuth，支持企业级用户管理 |
| **流式体验** | 实时输出，无需等待完整执行结束 |

### 局限

| 局限 | 说明 |
|------|------|
| **OpenAI 依赖** | 核心逻辑强依赖 OpenAI API |
| **循环上限** | 默认最多 100 次循环（可配置） |
| **单智能体** | 不支持多智能体协作 |
| **GPL 协议** | 修改后必须开源，商业使用受限 |
| **工具数量** | 内置工具有限，扩展需修改源码 |

---

## 十、参考资源

- [AgentGPT GitHub 仓库](https://github.com/reworkd/AgentGPT)
- [AgentGPT 在线体验](https://agentgpt.reworkd.ai)
- [Reworkd 官方文档](https://reworkd.ai/docs)
- [Plan-and-Solve Prompting 论文](https://github.com/AGI-Edgerunners/Plan-and-Solve-Prompting)
- [AgentGPT 中文 README](https://github.com/reworkd/AgentGPT/blob/main/docs/README.zh-HANS.md)
- [AgentGPT Discord 社区](https://discord.gg/gcmNyAAFfV)
- [Reworkd Twitter](https://twitter.com/reworkdai)

---

*文档创建时间：2026年05月07日*
