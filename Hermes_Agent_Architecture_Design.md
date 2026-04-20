# Hermes Agent 架构与设计详解

## 一、概述

**Hermes Agent** 是由 **Nous Research** 开发的**自我改进型 AI 智能体**，是目前唯一具备内置闭环学习循环的开源智能体框架。其核心创新在于能够从经验中自主创建技能、在使用过程中改进技能，并跨会话积累用户模型。

| 属性 | 说明 |
|------|------|
| **出品方** | Nous Research |
| **开源** | MIT 许可证，完全开源 |
| **GitHub Stars** | 95,000+ |
| **核心创新** | 闭环学习循环（Closed Learning Loop） |
| **官网** | https://hermes-agent.nousresearch.com |
| **GitHub** | https://github.com/NousResearch/hermes-agent |

### 核心特性

| 特性 | 说明 |
|------|------|
| **自我改进** | 从经验创建技能，使用中改进 |
| **闭环学习** | Generator-Reflector-Curator 三角色协作 |
| **用户建模** | Honcho 对话式用户建模，跨会话个性化 |
| **持久记忆** | FTS5 跨会话搜索 + LLM 总结 |
| **多平台支持** | 15+ 消息平台接入 |
| **技能系统** | agentskills.io 开放标准兼容 |
| **MCP 集成** | 连接任意 MCP 服务器 |

---

## 二、核心架构

### 2.1 架构概览图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Hermes Agent 系统架构                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│   │   Telegram   │     │   Discord    │     │    Slack     │                │
│   │   Channel    │     │   Channel    │     │   Channel    │                │
│   └──────────────┘     └──────────────┘     └──────────────┘                │
│          │                    │                    │                        │
│          └────────────────────┼────────────────────┘                        │
│                               │                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│   │   WhatsApp   │     │    Signal    │     │     Email    │                │
│   │   Channel    │     │   Channel    │     │   Channel    │                │
│   └──────────────┘     └──────────────┘     └──────────────┘                │
│          │                    │                    │                        │
│          └────────────────────┼────────────────────┘                        │
│                               │                                              │
│                               ▼                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    Gateway (多平台消息网关)                            │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │ │
│   │  │  Channel Providers│ │  Session Manager │ │   Router (路由器)   │  │ │
│   │  │   (平台连接器)    │ │   (会话管理)     │ │                     │  │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │ │
│   │                                                                     │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │ │
│   │  │   Cron Scheduler │ │  Media Handler  │ │   Voice Gateway     │  │ │
│   │  │   (定时调度器)    │ │   (媒体处理)    │ │   (语音网关)        │  │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                               │                                              │
│                               ▼                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    Learning Loop (闭环学习系统)                        │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │ │
│   │  │    Generator    │ │     Reflector   │ │      Curator        │  │ │
│   │  │   (生成器)      │ │    (反思器)     │ │     (管理者)        │  │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │ │
│   │                                                                     │ │
│   │  ┌───────────────────────────────────────────────────────────────┐ │ │
│   │  │                    Playbook (策略知识库)                       │ │ │
│   │  │    · 成功模式 · 失败教训 · 工具用法 · 边缘情况               │ │ │
│   │  └───────────────────────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                               │                                              │
│                               ▼                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    Honcho (用户建模与记忆系统)                         │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │ │
│   │  │  User Modeling  │ │  Memory System  │ │  Session Context    │  │ │
│   │  │  (用户建模)     │ │  (记忆系统)     │ │  (会话上下文)       │  │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │ │
│   │                                                                     │ │
│   │  ┌───────────────────────────────────────────────────────────────┐ │ │
│   │  │                    Recall Modes                               │ │ │
│   │  │    hybrid | context | tools                                  │ │ │
│   │  └───────────────────────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                               │                                              │
│                               ▼                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    Skills & Tools System                              │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │ │
│   │  │  Skills System  │ │  Tools Registry │ │   MCP Integration   │  │ │
│   │  │  (技能系统)     │ │  (工具注册)     │ │   (MCP集成)         │  │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │ │
│   │                                                                     │ │
│   │  ┌───────────────────────────────────────────────────────────────┐ │ │
│   │  │                    Terminal Backends                           │ │ │
│   │  │    local | docker | ssh | daytona | modal | singularity      │ │ │
│   │  └───────────────────────────────────────────────────────────────┘ │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                    Terminal UI / Web Interface                         │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │ │
│   │  │   TUI (终端)    │ │   Hermes UI     │ │   Slash Commands    │  │ │
│   │  │                 │ │   (Web界面)     │ │   (斜杠命令)        │  │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件说明

| 组件 | 功能 | 说明 |
|------|------|------|
| **Gateway** | 多平台消息网关 | 统一管理15+消息平台的连接和路由 |
| **Learning Loop** | 闭环学习系统 | Generator-Reflector-Curator协作学习 |
| **Playbook** | 策略知识库 | 动态策略存储，持续积累改进 |
| **Honcho** | 用户建模系统 | 对话式用户建模，跨会话个性化 |
| **Skills System** | 技能系统 | 自主创建、改进、复用技能 |
| **Terminal Backend** | 终端执行环境 | 6种后端执行Shell命令 |
| **MCP Integration** | MCP集成 | 连接任意MCP服务器扩展能力 |
| **Cron Scheduler** | 定时调度器 | 内置cron任务调度 |

---

## 三、Learning Loop（闭环学习系统）

### 3.1 设计理念

Hermes Agent 的核心创新是 **闭环学习循环（Closed Learning Loop）**，这是其区别于其他智能体的关键特性：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Learning Loop 工作流程                        │
│                                                                 │
│    ┌─────────────┐                                             │
│    │   用户任务   │                                             │
│    └─────────────┘                                             │
│          │                                                     │
│          ▼                                                     │
│    ┌─────────────┐                                             │
│    │  Generator  │  ←─── 使用 Playbook 中的策略                 │
│    │   生成方案   │                                             │
│    └─────────────┘                                             │
│          │                                                     │
│          ▼                                                     │
│    ┌─────────────┐                                             │
│    │   执行任务   │                                             │
│    └─────────────┘                                             │
│          │                                                     │
│          ▼                                                     │
│    ┌─────────────┐                                             │
│    │  Reflector  │  ←─── 分析成功/失败原因                      │
│    │   反思结果   │                                             │
│    └─────────────┘                                             │
│          │                                                     │
│          ▼                                                     │
│    ┌─────────────┐                                             │
│    │   Curator   │  ←─── 更新 Playbook                          │
│    │   管理策略   │                                             │
│    └─────────────┘                                             │
│          │                                                     │
│          ▼                                                     │
│    ┌─────────────┐                                             │
│    │  Playbook   │  ←─── 持久化学习成果                         │
│    │   知识更新   │                                             │
│    └─────────────┘                                             │
│          │                                                     │
│          └─── 循环继续 ───▶                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 三角色协作

| 角色 | 功能 | 说明 |
|------|------|------|
| **Generator** | 策略生成 | 基于Playbook中的学习模式生成执行策略 |
| **Reflector** | 结果反思 | 分析执行结果，识别成功/失败原因 |
| **Curator** | 策略管理 | 更新Playbook，添加新策略或改进现有策略 |

### 3.3 Playbook 系统

Playbook 是 Hermes Agent 的**动态策略知识库**：

| 存储内容 | 说明 |
|----------|------|
| **成功模式** | 哪些策略在什么场景下成功 |
| **失败教训** | 哪些做法导致了问题 |
| **工具用法** | 最佳的工具使用方式 |
| **边缘情况** | 特殊场景的处理方法 |

**Playbook 特点**：
- 每次任务后自动更新
- 无需传统微调或训练数据
- 纯上下文学习，完全透明
- 跨会话持久化保存

### 3.4 学习收益

| 收益 | 数据 |
|------|------|
| **复杂任务性能提升** | 20-35% |
| **Token 使用减少** | 49% |
| **技能积累** | 随使用时间持续增长 |
| **用户建模深度** | 跨会话持续深化 |

---

## 四、Honcho（用户建模与记忆系统）

### 4.1 Honcho 设计

Honcho 是 Hermes Agent 的**对话式用户建模系统**，采用双 Peer 模型：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Honcho 双 Peer 模型                           │
│                                                                 │
│   ┌─────────────────────────────┐                              │
│   │           User Peer          │                              │
│   │   · 用户画像                  │                              │
│   │   · 偏好习惯                  │                              │
│   │   · 工作项目                  │                              │
│   │   · 重要记忆                  │                              │
│   └─────────────────────────────┘                              │
│                                                                 │
│   ┌─────────────────────────────┐                              │
│   │            AI Peer           │                              │
│   │   · Agent 自我认知           │                              │
│   │   · 行为倾向                  │                              │
│   │   · 技能掌握                  │                              │
│   │   · 交互风格                  │                              │
│   └─────────────────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Recall Modes（召回模式）

Honcho 提供三种召回模式：

| 模式 | 自动注入上下文 | 工具可用 | 适用场景 |
|------|----------------|----------|----------|
| **hybrid**（默认） | 是 | 是 | Agent自主决定何时用工具 |
| **context** | 是 | 否（隐藏） | 最小Token成本，无工具调用 |
| **tools** | 否 | 是 | Agent完全自主控制记忆访问 |

### 4.3 Honcho 工具集

| 工具 | 功能 | Token成本 |
|------|------|-----------|
| **honcho_profile** | 快速获取用户画像 | 无LLM成本 |
| **honcho_context** | 获取完整记忆快照 | 无LLM成本 |
| **honcho_search** | 搜索特定记忆 | 无LLM成本 |
| **honcho_reasoning** | 综合推理分析 | 有LLM成本（慎用） |
| **honcho_conclude** | 记录新结论 | 无LLM成本 |

### 4.4 Honcho 配置

```json
{
  "recallMode": "hybrid",
  "observationMode": "directional",
  "observation": {
    "user": { "enabled": true },
    "ai": { "enabled": true }
  }
}
```

### 4.5 Honcho CLI 命令

```bash
# 设置 Honcho 集成
hermes honcho setup

# 检查连接状态
hermes honcho status

# 映射目录到会话名
hermes honcho map my-project

# 配置记忆模式
hermes honcho mode hybrid  # hybrid|honcho|local
```

---

## 五、Skills（技能）系统

### 5.1 技能自主创建

Hermes Agent 能够**自主创建技能**：

```
复杂任务 → 执行成功 → 提取工作流程 → 创建 SKILL.md → 持久化存储
```

**技能示例**：

```
skills/
├── deploy-k8s/
│   └── SKILL.md         # Kubernetes部署流程
├── code-review/
│   └── SKILL.md         # 代码审查流程
├── github/
│   └── SKILL.md         # GitHub操作技能
│   └── scripts/
│       └── pr_create.sh
└── web-search/
    └── SKILL.md         # 网络搜索技能
```

### 5.2 技能自我改进

技能在使用过程中持续改进：

| 改进类型 | 说明 |
|----------|------|
| **补充细节** | 发现遗漏步骤后补充 |
| **优化流程** | 发现更高效方式后更新 |
| **增加异常处理** | 发现边缘情况后添加 |
| **参数调整** | 根据效果调整配置 |

### 5.3 skill_manage 工具

Agent 通过 `skill_manage` 工具自主管理技能：

```json
{
  "action": "patch",
  "name": "deploy-k8s",
  "old_string": "kubectl apply -f config.yaml",
  "new_string": "kubectl apply -f config.yaml --validate=false"
}
```

**支持的操作**：

| Action | 说明 |
|--------|------|
| **create** | 创建新技能 |
| **patch** | 部分修改技能 |
| **edit** | 完全替换技能内容 |
| **delete** | 删除技能 |
| **write_file** | 添加技能辅助文件 |
| **remove_file** | 移除技能辅助文件 |

### 5.4 agentskills.io 标准兼容

Hermes Agent 的技能系统兼容 **agentskills.io** 开放标准：

- 技能可跨平台移植
- 与其他智能体框架兼容
- 标准化 SKILL.md 格式

---

## 六、Gateway（多平台消息网关）

### 6.1 Gateway 核心职责

| 职责 | 说明 |
|------|------|
| **平台连接** | 维护各消息平台的连接状态 |
| **消息路由** | 统一消息格式，路由到Agent |
| **会话管理** | 跨平台的会话状态维护 |
| **媒体处理** | 图片、音频、视频处理 |
| **语音集成** | 语音输入/输出 |
| **定时调度** | Cron任务执行和结果投递 |

### 6.2 支持的消息平台

| 平台 | 特点 |
|------|------|
| **Telegram** | Bot模式，支持群组、话题、流式输出 |
| **Discord** | Guild集成，支持频道、语音频道 |
| **Slack** | 企业协作，Slash Command支持 |
| **WhatsApp** | 私有协议，配对认证 |
| **Signal** | 加密通信 |
| **iMessage** | macOS本地集成 |
| **Matrix** | 开源协议 |
| **Email** | 邮件收发 |
| **Home Assistant** | 智能家居集成 |
| **WebChat** | 内置网页聊天 |

### 6.3 Gateway CLI 命令

```bash
# 交互式设置
hermes gateway setup

# 前台运行
hermes gateway

# 后台服务
hermes gateway start
hermes gateway stop
hermes gateway status

# 安装为系统服务
hermes gateway install
```

### 6.4 Gateway 配置示例

```yaml
gateway:
  platforms:
    telegram:
      enabled: true
      bot_token: "${TELEGRAM_BOT_TOKEN}"
      allow_from: ["123456789"]
      
    discord:
      enabled: true
      bot_token: "${DISCORD_BOT_TOKEN}"
      guilds:
        "123456789":
          channels:
            "general": { require_mention: false }
            
    slack:
      enabled: true
      bot_token: "xoxb-xxx"
      app_token: "xapp-xxx"
```

---

## 七、Terminal Backend（终端执行环境）

### 7.1 六种执行后端

| 后端 | 说明 | 适用场景 |
|------|------|----------|
| **local** | 本地执行 | 开发调试、快速任务 |
| **docker** | Docker容器 | 隔离执行、一致性环境 |
| **ssh** | 远程服务器 | 云端执行、服务器管理 |
| **daytona** | Daytona云 | 无服务器、持久化 |
| **modal** | Modal云 | 无服务器、GPU支持 |
| **singularity** | Singularity容器 | HPC环境 |

### 7.2 Backend 配置

```yaml
terminal:
  backend: docker      # local|docker|ssh|modal|daytona|singularity
  cwd: "."             # 工作目录
  timeout: 180         # 命令超时（秒）
  
  # 容器资源配置
  container_cpu: 1              # CPU核心数
  container_memory: 5120        # 内存（MB）
  container_disk: 51200         # 磁盘（MB）
  container_persistent: true    # 文件系统持久化
  
  # 云后端镜像
  modal_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  daytona_image: "nikolaik/python-nodejs:python3.11-nodejs20"
  singularity_image: "docker://nikolaik/python-nodejs:python3.11-nodejs20"
```

### 7.3 Terminal Tool 使用

```python
from tools.terminal_tool import terminal_tool

# 执行命令
result = terminal_tool("ls -la", task_id="task_001")
# {"success": true, "output": "...", "exit_code": 0}

# 后台执行
result = terminal_tool(
    "python long_script.py",
    background=True,
    notify_on_complete=True
)
# {"background": true, "task_id": "bg_123"}

# 自定义超时
result = terminal_tool("npm install", timeout=120)
```

---

## 八、Cron Scheduler（定时调度系统）

### 8.1 Cron 设计

Hermes Agent 内置完整的 **Cron 定时调度系统**：

| 功能 | 说明 |
|------|------|
| **任务创建** | 支持相对时间、自然语言、cron表达式 |
| **平台投递** | 结果自动投递到指定平台 |
| **技能绑定** | 任务可绑定特定技能执行 |
| **并行委托** | 支持委托子Agent并行执行 |

### 8.2 Cron CLI 命令

```bash
# 列出任务
hermes cron list

# 创建任务
hermes cron create "every 2h" "Check server status"
hermes cron create "every 1h" "Summarize feed" --skill blogwatcher

# 管理任务
hermes cron pause <job_id>
hermes cron resume <job_id>
hermes cron run <job_id>      # 手动触发
hermes cron remove <job_id>

# 查看状态
hermes cron status
hermes cron tick              # 执行到期任务
```

### 8.3 聊天中的 Cron 命令

```bash
/cron add 30m "Remind me to check the build"
/cron add "every 2h" "Check server status"
/cron add "every 1h" "Summarize feed" --skill blogwatcher
/cron add "0 8 * * *" "Morning briefing"
```

### 8.4 并行委托示例

```bash
/cron add "0 8 * * *" "
Delegate three parallel tasks:
1. Delegate: Search top 2 AI news
2. Delegate: Search top 2 crypto news  
3. Delegate: Search top 2 space news
Combine results into a briefing.
"
```

---

## 九、MCP 集成与工具系统

### 9.1 MCP Server 配置

```yaml
mcpServers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/data/workspace"]
    
  github:
    command: "node"
    args: ["mcp-server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
      
  postgres:
    command: "node"
    args: ["mcp-server-postgres"]
    env:
      DATABASE_URL: "${DATABASE_URL}"
```

### 9.2 工具权限配置

```json
{
  "permissions": {
    "allow": ["Bash(npm run lint:*)", "WebSearch", "Read"],
    "ask": ["Write(*.ts)", "Bash(git push*)"],
    "deny": ["Read(.env)", "Bash(rm -rf *)"]
  }
}
```

### 9.3 工具集分类

| 工具集 | 工具示例 |
|--------|----------|
| **文件操作** | read, write, edit, glob |
| **执行工具** | terminal, execute_code |
| **搜索工具** | web_search, grep |
| **浏览器** | browser_navigate, browser_screenshot |
| **语音工具** | voice_call, tts |
| **记忆工具** | honcho_profile, honcho_search |
| **技能工具** | skill_manage |
| **委托工具** | delegate, subagent |

---

## 十、Voice（语音交互）系统

### 10.1 语音能力

| 功能 | 说明 |
|------|------|
| **语音输入** | 实时语音识别 |
| **语音输出** | TTS文本转语音 |
| **语音唤醒** | macOS/iOS/Android支持 |
| **语音通话** | ElevenLabs或系统TTS |

### 10.2 语音平台支持

| 平台 | 语音支持 |
|------|----------|
| **CLI/TUI** | 完整语音交互 |
| **Telegram** | 语音频道实时交互 |
| **Discord** | 语音频道支持 |
| **WhatsApp** | 语音消息 |

---

## 十一、配置系统

### 11.1 配置文件结构

```yaml
# ~/.hermes/config.yaml

# 模型配置
model:
  base_url: "https://openrouter.ai/api/v1"
  default: "anthropic/claude-opus-4.6"
  
# 压缩配置  
compression:
  enabled: true
  threshold: 0.85
  summary_model: "google/gemini-3-flash-preview"

# 记忆配置
memory:
  memory_enabled: true
  user_profile_enabled: true

# 显示配置
display:
  compact: false
  personality: "kawaii"

# Agent配置
agent:
  max_turns: 60
  verbose: false

# 工具集
toolsets: ["all"]

# 终端配置
terminal:
  backend: local
  cwd: "."
  timeout: 180

# MCP服务器
mcpServers:
  filesystem:
    command: "npx"
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
```

### 11.2 文档系统

Hermes Agent 使用三个核心文档：

| 文档 | 功能 |
|------|------|
| **SOUL.md** | Agent人格、行为准则、价值观 |
| **USER.md** | 用户画像、偏好、重要信息 |
| **MEMORY.md** | 会话记忆、关键事件 |

### 11.3 环境变量

```bash
# API Keys
OPENROUTER_API_KEY="sk-or-xxx"
ANTHROPIC_API_KEY="sk-ant-xxx"
OPENAI_API_KEY="sk-xxx"

# Gateway
HERMES_GATEWAY_TOKEN="your-token"

# Terminal
TERMINAL_ENV=docker    # 执行环境

# Honcho
HONCHO_API_URL="https://api.honcho.dev"
```

---

## 十二、委托与并行化

### 12.1 委托系统

Hermes Agent 支持将任务**委托给子Agent**：

```
主Agent → 委托任务 → 子Agent 1 (并行)
                 → 子Agent 2 (并行)
                 → 子Agent 3 (并行)
                 ↓
主Agent ← 收集结果 ← 合成最终回答
```

### 12.2 委托工作流程

| 步骤 | 说明 |
|------|------|
| **任务分解** | 将复杂任务拆分为子任务 |
| **并行委托** | 同时委托多个子Agent |
| **结果收集** | 等待所有子任务完成 |
| **结果合成** | 主Agent整合各子结果 |

### 12.3 委托示例

```python
# Agent 自主委托
"Delegate: Search for top AI news"  → 子Agent执行
"Delegate: Search for top crypto news" → 子Agent执行
"Combine results into briefing"  → 主Agent合成
```

---

## 十三、与 OpenClaw 的关系

### 13.1 迁移支持

Hermes Agent 支持**从 OpenClaw 无缝迁移**：

```bash
hermes claw migrate
```

### 13.2 自动导入内容

| 导入项 | 说明 |
|--------|------|
| **SOUL.md** | Agent人格文档 |
| **MEMORY.md** | 记忆文档 |
| **USER.md** | 用户画像 |
| **技能** | 已创建的技能 |
| **命令白名单** | 工具权限配置 |
| **消息设置** | 平台配置 |
| **API 密钥** | 认证信息 |

---

## 十四、设计理念与最佳实践

### 14.1 核心设计理念

| 理念 | 说明 |
|------|------|
| **自我改进** | Agent随使用时间能力增强 |
| **闭环学习** | Generator-Reflector-Curator协作 |
| **用户建模** | Honcho跨会话深化用户理解 |
| **开放标准** | agentskills.io兼容，MCP支持 |
| **多平台统一** | Gateway统一管理所有平台 |
| **无服务器支持** | Daytona/Modal持久化执行 |

### 14.2 最佳实践

| 建议 | 说明 |
|------|------|
| **善用Honcho** | 使用hybrid模式，平衡成本与效果 |
| **避免过度调用** | honcho_reasoning有LLM成本，谨慎使用 |
| **积累技能** | 复杂成功任务后创建技能 |
| **利用委托** | 并行任务委托子Agent |
| **配置压缩** | 开启compression节省Token |
| **安全沙箱** | 敏感任务使用容器后端 |

### 14.3 CLI 常用命令

```bash
# 启动
hermes                      # 交互式TUI

# 模型选择
hermes model                # 选择LLM模型

# Gateway管理
hermes gateway setup
hermes gateway start

# 记忆管理
hermes memory setup
hermes honcho status

# Cron管理
hermes cron list
hermes cron create

# 工具配置
hermes tools                # 配置工具权限

# 系统诊断
hermes doctor               # 诊断检查
hermes status               # 系统状态

# OpenClaw迁移
hermes claw migrate
```

---

## 十五、参考资源

- [Hermes Agent 官网](https://hermes-agent.nousresearch.com)
- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent)
- [Hermes Agent 文档](https://hermes-agent.nousresearch.com/docs)
- [Nous Research](https://nousresearch.com)
- [Honcho 文档](https://docs.honcho.dev)
- [agentskills.io](https://agentskills.io)
- [Skills Hub](https://agentskills.io/skills)

---

*文档创建时间：2026年4月20日*