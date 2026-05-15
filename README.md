---
title: AI智能体介绍
created: 2025-04-10
updated: 2026-05-14
tags: [AI, 智能体, 综述, 入门]
related: "[[AI_Agent_Development_Framework]], [[Agent_MCP_introduce]], [[Agent_Skills_introduce]]"
---

# AI智能体介绍

> 本文档是 AI 智能体知识库的主入口，提供全局概览和各专题的导航链接。详细内容请参阅各独立文档。

---

## 一、什么是AI智能体

AI智能体（AI Agent）是一个能够**感知环境、做出决策、执行动作**以实现目标的自主系统。

### 核心特征

1. **自主性** - 不需要人工干预就能独立完成任务
2. **感知能力** - 能理解环境信息（文本、图像、数据等）
3. **决策能力** - 能规划步骤、选择工具、调用API
4. **执行能力** - 能实际执行操作（写代码、发消息、控制设备等）
5. **学习能力** - 能从反馈中改进

### 与传统程序的区别

| 传统程序 | AI智能体 |
|---------|---------|
| 固定逻辑流程 | 动态规划决策 |
| 输入→输出一对一 | 目标导向，多步骤推理 |
| 无法处理意外情况 | 适应性强，可处理模糊指令 |

### 工作流程

```
目标 → 感知/理解 → 规划/推理 → 工具调用/执行 → 观察结果 → 调整策略 → 达成目标
```

---

## 二、当前流行的AI智能体（2025-2026）

### 编程开发类智能体

| 智能体 | 类型 | 价格 | 特点 |
|--------|------|------|------|
| **Cursor** | AI IDE | $20/月 | VS Code深度集成，多文件编辑，体验最佳 |
| **Claude Code** | CLI Agent | 按使用计费 | 命令行工具，自主能力强，适合终端用户 |
| **Trae** | AI IDE | 免费 | 字节跳动出品，国内首个AI原生IDE，双模式切换 |
| **Trae Agent** | CLI Agent | 免费 | 字节跳动开源，多模型支持，研究友好 |
| **Windsurf** | AI IDE | $15/月 | Codeium出品，性价比高，协作友好 |
| **GitHub Copilot** | IDE插件 | $10-19/月 | GitHub生态无缝集成，普及度最高 |
| **Devin** | 自主工程师 | 企业定制 | 可独立完成整个项目，自主性最强 |
| **Aider** | CLI工具 | 免费 | 开源，支持多种LLM，Git集成 |
| **Tabnine** | 代码补全 | $12/月 | 隐私优先，可本地部署 |

> 详细介绍：[[Claude_Code_Introduction]] | [[Trae_Introduction]]

### 通用型智能体

| 智能体 | 特点 | 状态 |
|--------|------|------|
| **Manus AI** | 首个通用AI智能体，处理研究、规划、内容创作等多种任务 | 邀请制内测 |
| **OpenAI Operator** | GPT驱动的自主执行智能体 | 发布中 |
| **Hermes Agent** | 自我改进型AI智能体，闭环学习，15+平台支持，95K stars | 公开可用 |
| **AutoGPT** | 开源先驱，自主规划执行任务 | 公开可用 |
| **AgentGPT** | Web端自主智能体平台 | 公开可用 |
| **BabyAGI** | 轻量级任务驱动自主智能体 | 公开可用 |
| **OpenClaw** | 自托管多平台AI助手网关，支持WhatsApp/Telegram/Discord等 | 公开可用 |

> 平台详解：[[AutoGPT_Introduction]] | [[AgentGPT_Introduction]] | [[Hermes_Agent_Architecture_Design]] | [[OpenClaw_Architecture_Design]]

### 企业级智能体

| 智能体 | 厂商 | 特点 |
|--------|------|------|
| **Claude Agent** | Anthropic | 安全性和推理能力强，适合企业应用 |
| **Google Gemini Agent** | Google | 结合Google生态优势 |
| **Jina AI DocArray** | Jina AI | 文档处理和知识管理 |

---

## 三、智能体模型层（Model Layer）

模型层是智能体的核心组成，负责推理、决策和生成能力。

| 组成部分      | 说明                 |
| --------- | ------------------ |
| **模型选择**  | 根据任务需求选择合适的 LLM    |
| **模型提供商** | 国际 + 国内 20+ 提供商    |
| **模型路由**  | LiteLLM 负载均衡、降级、重试 |
| **成本管理**  | Token 计费、预算控制、使用追踪 |

> 详见：[[LLM_Model_Layer]] — 主流 LLM 提供商（国际 + 国内 Top 10）、LiteLLM 统一接口、模型路由、成本管理、多模型协作

---

## 四、智能体工具层（Tool Layer）

工具层是智能体与外部世界交互的桥梁，让智能体执行实际操作。

| 组成部分 | 说明 |
|----------|------|
| **工具注册** | 维护可用工具及定义 |
| **工具路由** | 根据意图选择工具 |
| **参数映射** | 自然语言→结构化参数 |
| **执行引擎** | 调用实际 API/函数 |
| **结果解析** | 格式化为 LLM 可理解文本 |

> 详见：[[Agent_Tool_Layer]] — 工具定义规范（OpenAI/Anthropic/Gemini）、LangChain 工具开发、Claude Code 内置工具、安全与权限

---

## 五、智能体技能（Agent Skills）

技能是智能体能力扩展的开放格式标准，通过可复用的指令+脚本+资源文件夹扩展能力。

> 详见：[[Agent_Skills_introduce]] — agentskills.io 标准、SKILL.md 格式、112+ 技能分类、技能安装与创建

---

## 六、智能体上下文（Agent Context）

上下文是智能体执行任务时的信息环境，上下文管理直接影响性能、准确性和成本。

> 详见：[[Agent_Context]] — Context Engineering 原则、优化技术、Context Mode / ACE / Context Hub 工具对比、记忆-上下文集成

---

## 七、智能体MCP（Model Context Protocol）

MCP 是 Anthropic 推出的开放协议标准，标准化 AI 应用与数据源/工具的连接方式。

> 详见：[[Agent_MCP_introduce]] — MCP 架构（Host-Client-Server）、Resources/Tools/Prompts 能力、服务器开发、生态

---

## 八、发展趋势

1. **从单任务到多任务** - 智能体能力范围扩大，一个智能体可处理多种类型任务
2. **从单智能体到多智能体协作** - 团队化执行复杂任务，各司其职
3. **自主性增强** - 如Devin、Manus可独立完成完整项目
4. **企业级应用** - 安全、隐私、合规需求推动，成为重要发展方向
5. **CLI工具崛起** - 命令行智能体如Claude Code、Aider受到开发者青睐

---

## 九、典型应用场景

### 软件开发
- 代码编写与重构
- Bug调试与修复
- 代码审查与优化
- 项目文档生成

### 自动化办公
- 邮件处理与回复
- 会议安排与纪要
- 报告生成与分析
- 数据处理与可视化

### 研究分析
- 信息搜集与整理
- 文献综述
- 市场调研
- 竞品分析

### 客户服务
- 智能问答
- 问题诊断与解决
- 多轮对话管理
- 工单处理

---

## 十、参考资源

### AI智能体产品
- [2025年最值得关注的十大AI Agent](https://www.53ai.com/news/2025011615298.html)
- [Devin AI - Built In](https://builtin.com/artificial-intelligence/ai-coding-agents)
- [Manus AI](https://manus.im/)
- [Cursor](https://cursor.sh/)
- [Claude Code 官网](https://claude.ai/code)
- [Trae 官网](https://trae.ai/)
- [Hermes Agent 官网](https://hermes-agent.nousresearch.com)
- [OpenClaw 官网](https://openclaw.ai/)
- [Skills Hub](https://agentskills.io)

### 开发框架
- [AutoGen](https://microsoft.github.io/autogen/)
- [LangChain](https://www.langchain.com/)
- [CrewAI](https://www.crewai.com/)
- [Deer-Flow GitHub](https://github.com/volcengine/deer-flow)

### 模型层
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Anthropic Claude](https://www.anthropic.com)
- [OpenAI GPT](https://platform.openai.com)
- [DeepSeek](https://www.deepseek.com)
- [Ollama](https://ollama.ai)

### 工具层与协议
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [MCP 官网](https://modelcontextprotocol.io)
- [MCP Servers 目录](https://github.com/modelcontextprotocol/servers)

---

*文档创建时间：2026年4月17日*
