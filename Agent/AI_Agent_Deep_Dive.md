---
title: AI Agent 深度介绍
created: 2026-06-18
updated: 2026-06-18
tags: [AI, 智能体, 架构, 深度]
related: "[[README]], [[AI_Agent_Development_Framework]], [[Agent_Tool_Layer]], [[Agent_Context]], [[Agent/AIGC_Agent_Introduction]]"
---

# AI Agent 深度介绍

> AI Agent（人工智能代理）是一个能够**感知环境、自主规划、调用工具、管理记忆**以达成目标的智能系统。LLM 是大脑，Agent 是有了手和脚的大脑。

---

## 一、核心架构

```
                    ┌─────────────────────┐
                    │       用户目标        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      规划模块        │
                    │  (Planning/Reasoning) │
                    │  思考→拆解→行动循环   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      工具调用        │
                    │    (Tool Use)       │
                    │  代码/API/搜索/文件   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      记忆管理        │
                    │     (Memory)        │
                    │   短期/长期/结构化    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      行动反馈        │
                    │       → 循环迭代      │
                    └─────────────────────┘
```

### 1. 规划（Planning）

Agent 自主分解任务，常见范式：

- **ReAct（Reasoning + Acting）**：交替进行"思考→行动→观察"循环
  ```
  思考：用户要分析销售数据，我需要先读取 CSV 文件
  行动：调用 read_file('sales.csv')
  观察：文件有 3 列，日期/金额/区域
  思考：接下来需要按区域汇总
  行动：调用 analyze(data, group_by='区域', agg='sum')
  ...
  ```

- **Plan & Execute**：先生成完整计划，再逐步执行
- **Tree of Thoughts (ToT)**：同时探索多条推理路径，回溯最优
- **Self-Reflection**：Agent 基于执行结果修正自己的策略

### 2. 工具调用（Tool Use）

Agent 与外部世界交互的接口：

| 工具类型 | 示例 | 用途 |
|---------|------|------|
| **代码执行** | Python REPL, Bash | 数据分析、文件操作 |
| **文件操作** | 读写、搜索、编辑 | 代码修改、文档处理 |
| **网络访问** | Web Fetch, Web Search | 实时信息获取 |
| **数据库** | SQL 查询、向量检索 | 结构化/语义搜索 |
| **外部 API** | GitHub、Slack、Notion | 接入业务系统 |
| **自定义工具** | MCP Server 注册 | 特定领域能力 |

### 3. 记忆管理（Memory）

| 类型 | 类比 | 实现 |
|------|------|------|
| **短期记忆** | 对话上下文 | Prompt 中的系统消息 + 历史 |
| **长期记忆** | 人的经验积累 | 向量数据库（RAG）、文件系统 |
| **结构化记忆** | 笔记本 | 配置文件、知识图谱 |

---

## 二、Agent 能力层级

```
Level 1: 单步工具调用
  用户：查天气 → Agent：调用天气 API → 返回结果

Level 2: 多步自主规划
  用户：分析这份财报 → Agent：读文件→查行业数据→对比→生成报告

Level 3: 协作多 Agent
  用户：开发一个功能 → PM Agent→开发Agent→测试Agent→部署Agent 协同

Level 4: 长期自主运行
  用户：持续监控线上服务 → Agent 24/7 值班，异常自动修复
```

---

## 三、主流 Agent 框架对比

| 框架 | 定位 | 特点 |
|------|------|------|
| **Claude Code** | 开发者内建 Agent | 深度集成终端，代码优先，MCP 生态 |
| **LangChain / LangGraph** | 通用 Agent 框架 | 图状工作流，多 Agent 编排，生态最成熟 |
| **AutoGen (Microsoft)** | 多 Agent 对话框架 | 专注于 Agent 间的对话协作 |
| **CrewAI** | 多角色 Agent | 像组建团队一样配置 Agents |
| **Semantic Kernel** | 企业级 .NET | 微软生态，Azure 集成 |
| **OpenAI Agents SDK** | 轻量 Agent | Assistants API + Function Calling |
| **Coze / Dify** | 低代码平台 | 拖拽式构建 Agent 工作流 |

> 详见 [[AI_Agent_Development_Framework]]

---

## 四、Agent 实战案例：Claude Code

以我当前的环境为例，Claude Code 作为一个 Agent 的工作流程：

```
用户请求："写一个部署脚本"

Agent 内部流程：
1. 规划 ──→ "首先需要了解项目结构"
2. 工具  ──→ 调用 Bash 查看项目文件
3. 规划 ──→ "然后需要构建一个部署脚本"
4. 工具  ──→ 调用 Write 创建 deploy.sh
5. 观察 ──→ "脚本已创建，需要验证语法"
6. 工具  ──→ 调用 Bash 运行语法检查
7. 反馈 ──→ "检查通过，任务完成"

同时管理：
   - 短期记忆：当前对话历史
   - 长期记忆：CLAUDE.md 项目文档
   - 工具调用：Bash / Read / Write / Edit / WebSearch...
```

> 详见 [[Claude_Code_Introduction]]

---

## 五、核心挑战

### 可靠性
- **错误累积**：多步执行中，一步出错后续全错
- **验证困难**：Agent 可能自信地执行错误方案
- **对策**：对抗验证（Adversarial Verify）、Human-in-the-Loop、Checkpoint 恢复

### 安全与管控
- **权限边界**：Agent 能执行命令，权限控制是关键
- **Prompt 注入**：外部内容可能诱导 Agent 做危险操作
- **对策**：最小权限原则、沙箱隔离、内容过滤

### 效率
- **Token 消耗**：思考链和工具调用大幅增加成本
- **延迟**：多轮规划-执行循环比单次回答慢得多
- **对策**：缓存、并行 Agent、任务优先级调度

---

## 六、未来方向

- **MCP（Model Context Protocol）**：标准化 Agent 与工具/数据源的连接协议，正在成为事实标准
- **Agent 间协作标准（A2A）**：让不同厂商的 Agent 能互相通信
- **Agent 即服务（AaaS）**：Agent 作为云原生的微服务部署
- **端侧 Agent**：手机/终端运行轻量 Agent，处理日常任务
- **长期持续 Agent**：不再是一次性对话，而是持续运行数天/周，自动适应环境变化

> 核心洞察：Agent 的瓶颈不再是"模型能做什么"，而是"我们敢让 Agent 做什么"。随着对齐技术、安全护栏和可靠性工程的进步，Agent 将从**辅助角色**演进为**半自主协作者**。

---

## 关联文档

- [[Agent_Tool_Layer]] — 智能体工具层
- [[Agent_Context]] — 智能体上下文管理
- [[Agent_MCP_introduce]] — MCP 协议详解
- [[AI_Agent_Development_Framework]] — 开发框架总览
- [[AIGC_Introduction]] — AIGC 内容生成
- [[Agent/AIGC_Agent_Introduction]] — AIGC × Agent