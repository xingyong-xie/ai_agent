# Anthropic Harness Engineering 与 AI 智能体

## 一、概念区分

在 **AI 智能体** 的语境下，"Harness Engineering" 有特殊的含义，不同于传统的 CI/CD 平台 Harness.io。

| 概念 | 定义 | 例子 |
|------|------|------|
| **传统 Harness.io** | CI/CD 平台，软件交付自动化 | 持续集成、持续交付、DevOps 工具 |
| **AI Agent Harness** | 智能体框架，包裹 LLM 提供结构化能力 | MCP、Claude Code、评估框架 |

---

## 二、Agent Harness（智能体框架）概念

**Agent Harness** 是包裹在基础 LLM 之上的**工程框架**，为智能体提供结构化的支撑能力。

### 2.1 Agent Harness 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Harness 架构                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              Agent Harness (智能体框架)                  │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│   │  │  Planning   │  │   Memory    │  │   Tool Calling  │  │  │
│   │  │  (规划)     │  │  (记忆)     │  │   (工具调用)    │  │  │
│   │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│   │                                                       │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│   │  │  Evaluation │  │   Safety    │  │    Monitoring   │  │  │
│   │  │  (评估)     │  │  (安全)     │  │    (监控)       │  │  │
│   │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                               │                                 │
│                               ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                 Base LLM (Claude/GPT/Gemini)             │  │
│   │                 基础大语言模型                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Agent Harness 核心组件

| 组件 | 功能 | 说明 |
|------|------|------|
| **Planning（规划）** | 任务分解、策略生成 | 将复杂任务拆分为可执行步骤 |
| **Memory（记忆）** | 上下文管理、历史追踪 | 维护对话和任务状态 |
| **Tool Calling（工具调用）** | API集成、函数执行 | 连接外部系统和数据源 |
| **Evaluation（评估）** | 性能测试、质量度量 | 评估智能体执行效果 |
| **Safety（安全）** | 输出过滤、行为约束 | 防止有害输出和行为 |
| **Monitoring（监控）** | 可观测性、日志追踪 | 监控智能体运行状态 |

---

## 三、Anthropic 的 Harness Engineering 实践

Anthropic 在 AI 智能体工程方面的核心贡献：

### 3.1 Anthropic 产品与协议

| 产品/协议 | Harness 能力 | 说明 |
|----------|--------------|------|
| **MCP (Model Context Protocol)** | 工具连接框架 | 开放标准，连接数据源和工具 |
| **Claude Code** | 智能体框架 | CLI编程智能体，内置工具集 |
| **Claude Agent SDK** | 开发框架 | 构建自定义智能体的 SDK |
| **Tool Use API** | 工具调用机制 | Function Calling 标准 |

### 3.2 MCP 协议作为 Harness

**MCP (Model Context Protocol)** 是 Anthropic 推出的 **开放标准**，本质上是一个 **Agent Harness**：

| MCP 能力 | Harness 功能 |
|----------|--------------|
| **Resources** | 数据访问（文件、数据库、API） |
| **Tools** | 可执行函数（操作外部系统） |
| **Prompts** | 预定义模板（标准化交互） |
| **Sampling** | LLM 生成请求（智能体推理） |

**MCP 作为 Harness 的价值**：

| 价值 | 说明 |
|------|------|
| **统一接口** | 标准化的工具接入方式 |
| **解耦设计** | AI应用与数据源分离 |
| **可组合性** | 一个客户端连接多个 Server |
| **开源生态** | 跨平台兼容，社区共建 |

---

## 四、Claude Code 作为 Harness 工程

Claude Code 是 Anthropic 官方的 **智能体 Harness 实现**：

### 4.1 Claude Code Harness 能力

| 能力 | 说明 |
|------|------|
| **内置工具集** | Read、Write、Edit、Bash、Grep、Glob、LSP 等 11+ 工具 |
| **MCP 集成** | 连接任意 MCP Server 扩展能力 |
| **Agent SDK** | TypeScript SDK，构建自定义智能体 |
| **权限控制** | 精细化的工具权限管理 |
| **IDE 集成** | VS Code、JetBrains 连接 |
| **GitHub Actions** | 自动化 CI/CD 集成 |

### 4.2 Claude Code 内置工具

| 工具 | 功能 |
|------|------|
| **Read** | 读取文件内容 |
| **Write** | 写入新文件 |
| **Edit** | 编辑现有文件 |
| **Bash** | 执行 Shell 命令 |
| **Glob** | 文件模式匹配搜索 |
| **Grep** | 内容正则搜索 |
| **LSP** | 代码智能（跳转定义、查找引用） |
| **WebFetch** | 获取网页内容 |
| **WebSearch** | 网络搜索 |
| **TaskCreate** | 创建和管理子任务 |
| **NotebookEdit** | Jupyter Notebook 编辑 |

---

## 五、评估 Harness（Evaluation Harness）

### 5.1 评估类型

Anthropic 强调 **智能体评估** 的 Harness 工程：

| 评估类型 | 说明 |
|----------|------|
| **轨迹评估** | 分析智能体的执行路径 |
| **步骤评估** | 逐步骤检查决策质量 |
| **输出评估** | 最终结果的准确性和质量 |
| **工具使用评估** | 工具选择的合理性 |
| **安全评估** | 是否存在安全风险 |

### 5.2 评估指标

| 指标类型 | 具体指标 |
|----------|----------|
| **性能指标** | 任务完成率、执行时间、步骤数量 |
| **质量指标** | 输出准确性、工具使用正确率 |
| **效率指标** | Token消耗、成本、资源利用 |
| **安全指标** | 有害输出率、安全违规次数 |

### 5.3 测试 Harness 工具

| 测试工具 | 说明 |
|----------|------|
| **AgentBench** | 综合基准测试平台 |
| **LangSmith** | 轨迹分析和反馈收集 |
| **Arize Phoenix** | 可观测性和评估工具 |
| **AgentOps** | 会话监控、成本追踪 |
| **Hammer AI Agent Harness** | 开源测试 Harness |

---

## 六、Harness Engineering 工作流程

### 6.1 开发流程

```
需求定义 → Harness设计 → 工具集成 → 评估配置 → 测试验证 → 生产部署 → 监控优化
```

### 6.2 各阶段 Harness 工程

| 阶段 | Harness 工作 |
|------|--------------|
| **需求定义** | 确定智能体能力边界、工具需求 |
| **Harness设计** | 选择框架（MCP/LangChain）、规划架构 |
| **工具集成** | 开发 MCP Server、定义工具 Schema |
| **评估配置** | 设置评估指标、创建测试用例 |
| **测试验证** | 运行测试 Harness、分析轨迹 |
| **生产部署** | 部署智能体、配置监控 Harness |
| **监控优化** | 收集数据、迭代改进 Harness |

---

## 七、Harness vs 传统框架对比

### 7.1 Agent Harness 与传统 SDK/框架

| 维度 | Agent Harness | 传统 SDK/框架 |
|------|---------------|--------------|
| **核心目标** | 评估、测试、监控智能体 | 构建智能体应用 |
| **关注点** | 智能体行为质量 | 智能体功能实现 |
| **典型工具** | AgentBench、LangSmith、AgentOps | LangChain、AutoGen、CrewAI |
| **Anthropic贡献** | MCP协议、评估方法论 | Claude SDK、Claude Code |

### 7.2 主流框架对比

| 框架 | 类型 | 特点 |
|------|------|------|
| **LangChain** | 开发框架 | 生态丰富，预构建集成 |
| **LangGraph** | 状态机框架 | 复杂工作流控制 |
| **AutoGen** | 多智能体框架 | Agent间对话协作 |
| **CrewAI** | 多智能体平台 | 角色扮演式协作 |
| **MCP** | 连接标准 | Anthropic开放标准 |
| **Claude Code** | 智能体实现 | CLI编程智能体 |

---

## 八、Anthropic Harness Engineering 最佳实践

### 8.1 开发建议

| 建议 | 说明 |
|------|------|
| **使用 MCP** | 采用开放标准连接工具和数据源 |
| **定义评估指标** | 建立清晰的智能体性能度量标准 |
| **轨迹追踪** | 记录智能体的完整执行路径 |
| **安全 Harness** | 添加安全过滤和行为约束 |
| **增量测试** | 从简单场景逐步增加复杂度 |
| **人机协作** | 关键决策点添加人工审批 |

### 8.2 安全 Harness 配置

| 安全措施 | 配置示例 |
|----------|----------|
| **权限白名单** | `"allow": ["Read", "Bash(git:*)"]` |
| **权限黑名单** | `"deny": ["Bash(rm -rf *)"]` |
| **审批权限** | `"ask": ["Write(*.env)"]` |
| **沙箱执行** | 在隔离环境执行危险操作 |

### 8.3 MCP Server 配置示例

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "github": {
      "command": "node",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "database": {
      "command": "node",
      "args": ["mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

---

## 九、Harness Engineering 工具生态

### 9.1 Anthropic 工具

| 工具 | 用途 |
|------|------|
| **MCP Specification** | 协议定义和 Schema |
| **MCP SDK (Python/TS)** | Server 和 Client 开发 |
| **MCP Servers** | 预构建的官方服务器 |
| **Claude Code** | 智能体 Harness 实现 |
| **Claude Agent SDK** | 自定义智能体开发 |

### 9.2 社区工具

| 工具 | 用途 |
|------|------|
| **LangSmith** | 轨迹分析、评估 |
| **AgentOps** | 监控、成本追踪 |
| **Arize Phoenix** | 可观测性 |
| **AgentBench** | 基准测试 |
| **Hammer AI** | 开源测试 Harness |

---

## 十、总结

### 10.1 Anthropic Harness Engineering 定义

**Anthropic Harness Engineering** 指的是：

1. **Agent Harness 概念** - 包裹在 LLM 之上的工程框架，提供规划、记忆、工具、评估、安全等能力
2. **MCP 协议** - Anthropic 推出的开放标准，作为工具连接的 Harness
3. **Claude Code** - Anthropic 官方的智能体 Harness 实现
4. **评估工程** - Anthropic 强调的智能体测试和评估方法论

### 10.2 核心区别

| 概念 | 定义 |
|------|------|
| **传统 Harness.io** | CI/CD 平台，软件交付自动化 |
| **AI Agent Harness** | 智能体框架，包裹 LLM 提供结构化能力 |

### 10.3 Anthropic 的独特贡献

| 贡献 | 说明 |
|------|------|
| **开放标准** | MCP 作为开放协议，跨平台兼容 |
| **工程实践** | 强调评估、安全、可观测性 |
| **产品实现** | Claude Code 作为 Harness 实例 |
| **生态建设** | MCP Server 社区共建 |

---

## 十一、参考资源

### Anthropic 官方
- [Anthropic MCP 官网](https://modelcontextprotocol.io)
- [Anthropic MCP 发布公告](https://www.anthropic.com/news/model-context-protocol)
- [Claude Code 文档](https://docs.anthropic.com/en/docs/claude-code)
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/agent-sdk)
- [Anthropic 工程博客](https://www.anthropic.com/engineering)

### MCP 生态
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [MCP Servers 目录](https://github.com/modelcontextprotocol/servers)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

### 评估工具
- [AgentBench](https://github.com/THUDM/AgentBench)
- [LangSmith](https://docs.smith.langchain.com)
- [AgentOps](https://agentops.ai)
- [Arize Phoenix](https://docs.arize.com/phoenix)

### 学习资源
- [Eugene Yan - Agent Development Kits](https://eugeneyan.com/writing/adks/)
- [LangChain Agent Evaluation](https://python.langchain.com/docs/guides/evaluation/agents/)

---

*文档创建时间：2026年4月20日*