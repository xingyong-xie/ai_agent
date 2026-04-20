# OpenClaw 架构与设计详解

## 一、概述

**OpenClaw** 是一个自托管的多平台 AI 助手网关，采用本地优先的设计理念。其核心架构基于 **Gateway（网关）** + **Agent（智能体）** 的双组件模型，提供统一的消息平台接入和智能体管理能力。

| 属性 | 说明 |
|------|------|
| **开源** | 完全开源，代码透明 |
| **本地优先** | 数据存储在本地，用户可控 |
| **多平台支持** | 10+ 消息平台集成 |
| **多智能体路由** | 支持多个隔离的智能体工作空间 |

---

## 二、核心架构

### 2.1 架构概览图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OpenClaw 系统架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│   │  WhatsApp    │     │  Telegram    │     │   Discord    │        │
│   │   Channel    │     │   Channel    │     │   Channel    │        │
│   └──────────────┘     └──────────────┘     └──────────────┘        │
│          │                    │                    │                │
│          └────────────────────┼────────────────────┘                │
│                               │                                      │
│                               ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Gateway (网关)                              │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│   │  │  WebSocket  │  │  HTTP API   │  │  Channel Providers  │  │  │
│   │  │   Server    │  │ (OpenAI兼容)│  │    (连接器)         │  │  │
│   │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│   │                                                              │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │  │
│   │  │   Router    │  │   Session   │  │   Event Manager     │  │  │
│   │  │  (路由器)   │  │  Manager    │  │    (事件管理)       │  │  │
│   │  └─────────────┘  └─────────────┘  └─────────────────────┘  │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│                               ▼                                      │
│   ┌────────────────┐     ┌────────────────┐     ┌────────────────┐  │
│   │  Agent: main   │     │  Agent: work   │     │  Agent: coder  │  │
│   │  (默认智能体)  │     │  (工作智能体)  │     │  (编码智能体)  │  │
│   │                │     │                │     │                │  │
│   │  ┌──────────┐  │     │  ┌──────────┐  │     │  ┌──────────┐  │  │
│   │  │ Workspace│  │     │  │ Workspace│  │     │  │ Workspace│  │  │
│   │  │   Skills │  │     │  │   Skills │  │     │  │   Skills │  │  │
│   │  │   Tools  │  │     │  │   Tools  │  │     │  │   Tools  │  │  │
│   │  │   Memory │  │     │  │   Memory │  │     │  │   Memory │  │  │
│   │  └──────────┐  │     │  └──────────┘  │     │  └──────────┘  │  │
│   └────────────────┘     └────────────────┘     └────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件说明

| 组件 | 功能 | 说明 |
|------|------|------|
| **Gateway** | 网关服务器 | 唯一控制平面，管理连接、路由、会话、事件 |
| **Channels** | 消息通道 | 连接各种消息平台的 Provider（连接器） |
| **Router** | 路由器 | 根据规则将消息分发到对应智能体 |
| **Session Manager** | 会话管理 | 管理对话上下文、历史、状态 |
| **Agents** | 智能体 | 独立的工作空间，各自拥有 Skills、Tools、Memory |
| **Bindings** | 绑定规则 | 定义消息路由到智能体的匹配规则 |

---

## 三、Gateway（网关）设计

### 3.1 Gateway 核心职责

Gateway 是 OpenClaw 的**核心控制平面**，承担以下职责：

| 职责 | 说明 |
|------|------|
| **连接管理** | 维护所有 Channel Provider 的连接状态 |
| **消息路由** | 根据Bindings规则将消息路由到对应Agent |
| **会话管理** | 创建、维护、重置对话会话 |
| **事件分发** | 处理和分发系统事件（presence、health、tick等） |
| **API服务** | 提供WebSocket和HTTP API接口 |

### 3.2 Gateway 通信协议

Gateway 采用 **WebSocket + JSON-RPC 2.0** 协议：

**协议帧类型**：

```json
// 请求帧 (Request)
{
  "type": "req",
  "id": "unique-request-id",
  "method": "methodName",
  "params": { ... }
}

// 响应帧 (Response)
{
  "type": "res",
  "id": "request-id",
  "ok": true,
  "payload": { ... },
  "error": null
}

// 事件帧 (Event)
{
  "type": "event",
  "event": "eventName",
  "payload": { ... },
  "seq": 123,
  "stateVersion": { ... }
}
```

### 3.3 连接握手流程

```
客户端                        Gateway
   │                             │
   │──── connect (握手请求) ────▶│
   │                             │
   │◀─── hello-ok (握手成功) ────│
   │                             │
   │──── req (业务请求) ────────▶│
   │                             │
   │◀─── res (业务响应) ─────────│
   │                             │
   │◀─── event (服务端推送) ─────│
   │                             │
```

**握手请求示例**：

```json
{
  "type": "req",
  "id": "connect-001",
  "method": "connect",
  "params": {
    "minProtocol": "1.0",
    "maxProtocol": "2.0",
    "client": {
      "id": "client-123",
      "displayName": "My App",
      "version": "1.0.0",
      "platform": "web"
    },
    "auth": {
      "token": "your-gateway-token"
    }
  }
}
```

**握手响应示例**：

```json
{
  "type": "res",
  "id": "connect-001",
  "ok": true,
  "payload": {
    "hello-ok": {
      "snapshot": {
        "presence": [...],
        "health": { ... },
        "uptimeMs": 3600000,
        "policy": {
          "maxPayload": 10485760,
          "maxBufferedBytes": 5242880
        }
      }
    }
  }
}
```

### 3.4 Gateway 事件类型

| 事件 | 说明 |
|------|------|
| **presence** | 客户端/节点在线状态变化 |
| **health** | 系统健康状态更新 |
| **tick** | 定期心跳事件 |
| **agent** | 智能体相关事件（流式输出） |
| **chat** | 聊天消息事件 |
| **heartbeat** | 心跳事件 |
| **cron** | 定时任务状态事件 |

### 3.5 Gateway HTTP API

Gateway 提供 **OpenAI兼容的 HTTP API**：

```
POST /v1/chat/completions
POST /v1/embeddings
POST /v1/completions
POST /v1/image/generations
POST /v1/moderations
```

**Chat Completions 示例**：

```json
{
  "model": "openclaw:main",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false
}
```

---

## 四、Channel（通道）设计

### 4.1 Channel Provider 架构

每个消息平台对应一个 Channel Provider（连接器）：

```
┌─────────────────────────────────────────────┐
│               Channel Provider               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐     ┌─────────────────┐   │
│  │  Connector  │────▶│  Platform API   │   │
│  │  (连接器)   │     │  (平台接口)     │   │
│  └─────────────┘     └─────────────────┘   │
│                                             │
│  ┌─────────────┐     ┌─────────────────┐   │
│  │  Handler    │────▶│  Gateway        │   │
│  │  (处理器)   │     │  WebSocket      │   │
│  └─────────────┘     └─────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           Policy Layer              │   │
│  │  (dmPolicy, groupPolicy, allowlist) │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 支持的消息平台

| 平台 | Provider类型 | 特点 |
|------|--------------|------|
| **WhatsApp** | baileys | 私有协议，需要配对认证 |
| **Telegram** | Bot API | 官方API，Bot模式 |
| **Discord** | Bot API | 官方API，Guild集成 |
| **Slack** | Bot API | 企业集成，Slash Command支持 |
| **Signal** | libsignal | 加密通信 |
| **iMessage** | Apple Script | macOS本地集成 |
| **Matrix** | Matrix SDK | 开源协议 |
| **Mattermost** | Bot API | 开源企业聊天 |
| **Google Chat** | Bot API | Google企业生态 |
| **WebChat** | WebSocket | 内置网页聊天 |

### 4.3 Channel 配置结构

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",       // 私聊策略
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",  // 群聊策略
      groupAllowFrom: ["+15551234567"],
      textChunkLimit: 4000,      // 消息分块限制
      chunkMode: "newline",      // 分块模式
      sendReadReceipts: true,    // 发送已读回执
      ackReaction: { emoji: "👀", direct: true },
    },
    
    telegram: {
      enabled: true,
      botToken: "${TELEGRAM_BOT_TOKEN}",
      dmPolicy: "pairing",
      allowFrom: ["123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          requireMention: false,
          topics: {
            "42": { agentId: "coder" }
          }
        }
      },
      streaming: "partial",      // 流式输出模式
      customCommands: [
        { command: "backup", description: "Git backup" }
      ]
    },
    
    discord: {
      enabled: true,
      botToken: "${DISCORD_BOT_TOKEN}",
      dmPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          slug: "my-server",
          channels: {
            "general": { allow: true },
            "help": { requireMention: true }
          }
        }
      }
    }
  }
}
```

### 4.4 安全策略

| 策略 | 说明 |
|------|------|
| **pairing** | 需要配对认证，首次连接需确认 |
| **allowlist** | 白名单模式，只允许指定用户/群组 |
| **open** | 开放模式，允许所有人 |
| **disabled** | 禁用通道 |

---

## 五、Agent（智能体）设计

### 5.1 Agent 组件结构

每个 Agent 是一个**隔离的智能体工作空间**：

```
┌─────────────────────────────────────────────┐
│                   Agent                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │            Workspace                 │   │
│  │  ~/.openclaw/workspace-{agent-id}   │   │
│  │                                     │   │
│  │  ┌───────────┐  ┌───────────────┐  │   │
│  │  │  Memory   │  │   Sessions    │  │   │
│  │  │  (记忆)   │  │   (会话)      │  │   │
│  │  └───────────┘  └───────────────┘  │   │
│  │                                     │   │
│  │  ┌───────────┐  ┌───────────────┐  │   │
│  │  │  Skills   │  │   Commands    │  │   │
│  │  │  (技能)   │  │   (命令)      │  │   │
│  │  └───────────┘  └───────────────┘  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           Model Config               │   │
│  │  primary: claude-sonnet-4-6         │   │
│  │  fallbacks: [gpt-5.4, opus]         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           Tool Permissions           │   │
│  │  allow: [read, exec, message]       │   │
│  │  deny: [browser, canvas]            │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.2 Agent 配置结构

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["openai/gpt-5.4"]
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "openai/gpt-5.4": { alias: "GPT" }
      },
      imageModel: { primary: "openai/gpt-4o" },
      imageGenerationModel: { primary: "openai/dall-e-3" },
      skills: ["github", "weather", "web-search"],
      maxConcurrent: 3,
      sandbox: {
        mode: "non-main",
        scope: "agent"
      },
      heartbeat: {
        every: "30m",
        target: "last"
      }
    },
    
    list: [
      { id: "main", default: true },
      { id: "work", workspace: "~/.openclaw/workspace-work", skills: ["jira", "slack"] },
      { id: "coder", skills: ["github", "code-review"], model: { primary: "anthropic/claude-opus-4-6" } }
    ]
  }
}
```

### 5.3 Agent 工具权限

| 权限类型 | 工具示例 |
|----------|----------|
| **read** | 文件读取、搜索 |
| **write** | 文件写入、编辑 |
| **exec** | Bash命令执行 |
| **message** | 发送消息 |
| **browser** | 浏览器控制 |
| **canvas** | 可视化画布 |
| **cron** | 定时任务管理 |

### 5.4 Agent Sandboxing

| Sandbox 模式 | 说明 |
|--------------|------|
| **off** | 不启用沙箱 |
| **non-main** | 非默认智能体启用沙箱 |
| **all** | 所有智能体启用沙箱 |

| Sandbox Scope | 说明 |
|---------------|------|
| **session** | 会话级隔离 |
| **agent** | 智能体级隔离 |
| **shared** | 共享空间 |

---

## 六、Bindings（绑定规则）设计

### 6.1 绑定规则作用

Bindings 定义**消息路由规则**，决定哪些消息分发到哪个 Agent：

```
消息来源                        目标Agent
    │                              │
    │  WhatsApp DM from +1555xxx   │───▶ Agent: main
    │                              │
    │  Telegram group -100xxx      │───▶ Agent: coder
    │                              │
    │  Slack message               │───▶ Agent: work
    │                              │
```

### 6.2 绑定规则配置

```json5
{
  bindings: [
    // 按渠道路由
    { agentId: "work", match: { channel: "slack" } },
    
    // 按渠道路由（指定账号）
    { agentId: "delegate", match: { channel: "whatsapp", accountId: "org" } },
    
    // 按群组路由
    { 
      agentId: "coder", 
      match: { 
        channel: "telegram", 
        peer: { kind: "group", id: "-1001234567890" }
      }
    },
    
    // 按Discord Guild路由
    {
      agentId: "delegate",
      match: { channel: "discord", guildId: "123456789012345678" }
    },
    
    // 按私聊路由
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "dm", id: "+15551230001" } }
    }
  ]
}
```

### 6.3 匹配规则优先级

| 优先级 | 匹配条件 | 说明 |
|--------|----------|------|
| 1 | `peer.id`精确匹配 | 最高优先级 |
| 2 | `accountId`精确匹配 | 指定账号 |
| 3 | `channel`匹配 | 渠道级别 |
| 4 | 默认Agent | 无匹配时使用default agent |

---

## 七、Session（会话）管理设计

### 7.1 Session Scope 类型

| Scope | 说明 |
|-------|------|
| **main** | 全局单一会话 |
| **per-peer** | 每个用户独立会话 |
| **per-channel-peer** | 每个渠道+用户独立会话（推荐） |
| **per-account-channel-peer** | 每个账号+渠道+用户独立会话 |

### 7.2 Session 配置结构

```json5
{
  session: {
    dmScope: "per-channel-peer",
    
    // Thread绑定
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0
    },
    
    // 会话重置策略
    reset: {
      mode: "daily",       // daily | idle
      atHour: 4,           // 每日4点重置
      idleMinutes: 120     // 空闲120分钟重置
    },
    
    // 维护策略
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      maxDiskBytes: "500mb"
    }
  }
}
```

### 7.3 Session 重置触发

| 触发方式 | 说明 |
|----------|------|
| **定时重置** | 每日指定时间自动重置 |
| **空闲重置** | 空闲超过指定时间后重置 |
| **命令触发** | 用户发送 `/new` 或 `/reset` |

---

## 八、Skills（技能）与 Plugins（插件）设计

### 8.1 Skills 系统

Skills 是 Agent 的**能力扩展模块**：

```json5
{
  skills: {
    load: {
      watch: true,              // 热加载监控
      watchDebounceMs: 250,
      extraDirs: ["~/custom-skills"]
    },
    entries: {
      "github": { enabled: true },
      "weather": { enabled: true, apiKey: "${WEATHER_API_KEY}" },
      "web-search": { enabled: true },
      "code-review": { enabled: true },
      "image-lab": {
        enabled: true,
        apiKey: "${GEMINI_API_KEY}",
        env: { GEMINI_API_KEY: "${GEMINI_API_KEY}" }
      }
    }
  }
}
```

### 8.2 Plugins 系统

Plugins 是**更强大的扩展机制**，可以提供完整的 Provider 实现：

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call", "matrix"],      // 允许的插件
    deny: ["untrusted-plugin"],           // 禁止的插件
    load: { paths: ["~/my-plugins"] },
    
    // 插槽配置（系统组件替换）
    slots: {
      memory: "memory-core"               // 或 "memory-lancedb"
    },
    
    entries: {
      "voice-call": {
        enabled: true,
        config: { provider: "twilio" }
      }
    }
  }
}
```

### 8.3 内置技能示例

| Skill | 功能 |
|-------|------|
| **github** | GitHub API集成，PR/Issue操作 |
| **weather** | 天气查询 |
| **web-search** | 网络搜索 |
| **code-review** | 代码审查 |
| **image-lab** | 图像处理 |

---

## 九、Cron（定时任务）设计

### 9.1 Cron 配置结构

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    sessionRetention: "24h",
    
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"]
    }
  }
}
```

### 9.2 Cron 任务特性

| 特性 | 说明 |
|------|------|
| **并发限制** | 最大同时运行任务数 |
| **会话保持** | 任务执行后的会话保留时间 |
| **重试机制** | 失败自动重试，支持退避策略 |
| **触发条件** | 可指定哪些错误类型触发重试 |

---

## 十、Hooks（Webhook）设计

### 10.1 Hooks 配置结构

```json5
{
  hooks: {
    enabled: true,
    token: "your-webhook-secret",
    path: "/hooks",
    defaultSessionKey: "hook:ingress",
    
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "main",
        deliver: true
      },
      {
        match: { path: "calendar" },
        action: "agent",
        agentId: "work"
      }
    ]
  }
}
```

### 10.2 Hook 工作流程

```
外部服务                     Gateway                    Agent
    │                           │                         │
    │── POST /hooks/gmail ────▶│                         │
    │                           │── 触发Agent ──────────▶│
    │                           │                         │
    │                           │◀── Agent响应 ───────────│
    │                           │                         │
    │                           │── 回调(可选) ──────────▶│
```

---

## 十一、设计理念与最佳实践

### 11.1 核心设计理念

| 理念 | 说明 |
|------|------|
| **本地优先** | 所有数据存储在本地，用户完全控制 |
| **单一控制平面** | Gateway作为唯一入口，统一管理 |
| **隔离架构** | 多Agent工作空间隔离，独立配置 |
| **开放标准** | WebSocket、JSON-RPC、OpenAI API兼容 |
| **可扩展性** | Skills/Plugins双层扩展机制 |

### 11.2 配置最佳实践

| 建议 | 说明 |
|------|------|
| **多Agent分工** | 不同渠道/任务使用不同Agent |
| **安全策略** | 生产环境使用 `allowlist` 策略 |
| **Sandbox隔离** | 敏感操作启用Sandbox |
| **会话管理** | 使用 `per-channel-peer` scope |
| **热加载** | 开启Skills watch，实时更新 |
| **监控健康** | 定期检查 Gateway health/status |

### 11.3 CLI 常用命令

```bash
# Gateway 管理
openclaw gateway              # 启动Gateway
openclaw gateway start        # 后台启动
openclaw gateway stop         # 停止
openclaw gateway status       # 状态查看
openclaw health               # 健康检查

# Agent 管理
openclaw agents list          # 列出所有Agent
openclaw agents add work      # 创建新Agent
openclaw agents bindings      # 查看绑定规则
openclaw agents bind --agent work --bind telegram  # 添加绑定

# 系统诊断
openclaw status               # 系统状态
openclaw doctor               # 诊断检查
openclaw doctor --fix         # 自动修复
openclaw logs --follow        # 日志跟踪

# 配置管理
openclaw config get           # 获取当前配置
openclaw config patch         # 部分更新配置
```

---

## 十二、参考资源

- [OpenClaw 官网](https://openclaw.ai)
- [OpenClaw 文档](https://docs.claw.so)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Gateway API 文档](https://docs.claw.so/engine/gateway)
- [配置参考](https://docs.claw.so/engine/concepts/configuration)
- [多Agent路由](https://docs.claw.so/engine/concepts/multi-agent)
- [Channel配置](https://docs.claw.so/engine/channels)

---

*文档创建时间：2026年4月20日*