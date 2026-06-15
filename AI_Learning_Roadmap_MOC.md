---
title: AI 学习路线（MOC）
created: 2026-05-13
updated: 2026-05-19
tags: [MOC, AI, 学习路线, 知识地图]
related: "[[README]], [[Obsidian_Claude_Code_Workflow]]"
---

# AI 学习路线（MOC）

> 本文档是 AI Agent 知识库的内容地图（Map of Content），汇总所有知识入口与学习路径。
> 目录结构同步更新，各分组对应 Vault 中的文件夹。

---

## 一、AI 智能体基础

入门必读，建立 AI 智能体的全局认知：

- [[README]] — AI 智能体综述（定义、流行智能体、模型层/工具层/技能/上下文/MCP 概览 + 链接导航）

---

## 二、开发框架与标准 `Framework/`

智能体开发的框架支撑与开放标准：

- [[AI_Agent_Development_Framework]] — 开发框架总览（LangChain / LlamaIndex / AutoGen / CrewAI / Deer-Flow）
- [[Agent_MCP_introduce]] — 模型上下文协议（MCP 原理 / 工具集成 / 生态）
- [[Agent_Skills_introduce]] — 智能体技能标准（agentskills.io / SKILL.md 格式）
- [[Superpowers_Skill_Introduction]] — Superpowers 技能框架（TDD / 子智能体驱动开发 / 8+ 编程智能体兼容）
- [[Agent_Tool_Layer]] — 智能体工具层（Function Calling / 工具定义 / LangChain 工具开发 / 安全权限）
- [[Agent_Context]] — 智能体上下文（Context Engineering / Context Mode / ACE / Context Hub）
- [[Zeabur_Platform_Introduction]] — Zeabur AI DevOps 平台（AI 智能体部署 / AI Hub / Wonder Mesh BYOH / MCP 集成）
- [[PaaS_Platform_Comparison]] — PaaS 托管平台对比（Vercel / Railway / Render / Fly.io / Heroku / Zeabur 六平台全维度对比）
---

## 三、大模型核心架构 `LLM/`

从 Transformer 到 MoE，理解大模型底层原理：

### 架构原理

- [[LLM_Transformer_Architecture]] — Transformer 完整架构（组件/改进/模型对比/训练推理）
  - [[Self_Attention_Algorithm]] — 自注意力算法深度解析（QKV/因果掩码/复杂度/代码实现/9种变体）
- [[LLM_MoE_Architecture]] — MoE 稀疏激活架构（Router/Expert/共享专家/负载均衡/DeepSeek创新）

### 模型层

- [[LLM_Model_Layer]] — 智能体模型层（LLM 提供商 / 国内 Top 10 / LiteLLM / 模型路由 / 成本管理）

---

## 四、智能体平台 `Agent/`

各大智能体平台的设计与实现：

- [[AutoGPT_Introduction]] — AutoGPT 开源智能体平台（Frontend/Server/Block工作流/Marketplace）
- [[AgentGPT_Introduction]] — AgentGPT Web 端智能体平台（Next.js + FastAPI/Plan-and-Solve/工具系统）
- [[Hermes_Agent_Architecture_Design]] — Hermes 自我改进型智能体（闭环学习/15+平台/95K stars）
- [[OpenClaw_Architecture_Design]] — OpenClaw 多平台 AI 助手网关（WhatsApp/Telegram/Discord）
- [[Trae_Introduction]] — Trae AI 原生 IDE（字节跳动/双模式/SOLO Coder+Builder/Trae Agent CLI）

---

## 五、Claude 生态 `Claude/`

Anthropic Claude 系列产品与工程框架：

- [[Claude_Code_Introduction]] — Claude Code CLI 编程智能体（核心能力/内置工具/IDE集成/Agent SDK）
- [[Claude_Beta_Products]] — Claude Beta 产品（Cowork / Chrome / Excel / PowerPoint 智能体）
- [[Claude_Design_Artifacts_Introduction]] — Claude Artifacts Canvas（前端设计/代码生成/实时预览）
- [[Anthropic_Harness_Engineering_AI_Agent]] — Anthropic Harness 工程框架（评估/安全/部署）
- [[Install_Claude_Code_on_Windows10]] — Claude Code Windows 安装指南

---

## 六、工具与工作流 `Tool/`

构建个人知识管理与 AI 驱动工作流：

- [[Obsidian_Introduction]] — Obsidian 本地知识管理工具（双向链接/图谱/插件生态/工作流）
- [[Obsidian_Claude_Code_Workflow]] — Obsidian + Claude Code AI 驱动工作流（研究生成/拆分/批量更新/Git管理）
- [[GStack_Introduction]] — GStack Claude Code 技能包（23 个专家角色 / Sprint 工作流 / 思考→规划→构建→审查→测试→发布→反思）
- [[GCode_Programming_Introduction]] — G 代码编程入门（CNC 数控编程 / 手工编程 / CAM 自动生成 / Fusion 360 流程）

---

## 七、市场与硬件 `Market/`

AI 训练与推理的硬件基础：

- [[GPU_price_202604]] — 主流商用显卡价格参考（消费级/数据中心级）

---

## 八、游戏框架 `Game/`

游戏引擎与开发框架知识库：

- [[Game/Unity_README]] — Unity 游戏引擎完整指南

---

## 学习路径建议

```
入门: [[README]] → 了解 AI 智能体全貌
  ↓
基础: [[LLM_Transformer_Architecture]] → 理解大模型基础架构
  ↓
深入: [[Self_Attention_Algorithm]] → 掌握注意力机制核心算法
  ↓
进阶: [[LLM_MoE_Architecture]] → 了解最新 MoE 稀疏架构创新
  ↓
模型: [[LLM_Model_Layer]] → 选择 LLM 提供商，掌握路由与成本管理
  ↓
框架: [[AI_Agent_Development_Framework]] → 学习智能体开发工具
  ↓
工具: [[Agent_Tool_Layer]] + [[Agent_Context]] → 掌握工具调用与上下文管理
  ↓
协议: [[Agent_MCP_introduce]] + [[Agent_Skills_introduce]] → 掌握工具/技能集成标准
  ↓
平台: [[AutoGPT_Introduction]] / [[OpenClaw_Architecture_Design]] → 了解主流智能体平台
  ↓
编程: [[Claude_Code_Introduction]] / [[Trae_Introduction]] → 选择编程智能体工具
  ↓
生态: [[Claude_Beta_Products]] → 探索 Claude 产品生态
  ↓
工具: [[Obsidian_Introduction]] → 搭建个人知识管理系统
```

---

## 文档索引

| 文档 | 目录 | 主题 | 标签 |
|------|------|------|------|
| [[README]] | `/` | AI 智能体综述 | `#AI/智能体` |
| [[AI_Agent_Development_Framework]] | `Framework/` | 开发框架 | `#AI/框架` |
| [[Agent_MCP_introduce]] | `Framework/` | MCP 协议 | `#AI/协议` |
| [[Agent_Skills_introduce]] | `Framework/` | 智能体技能 | `#AI/技能` |
| [[Agent_Tool_Layer]] | `Framework/` | 工具层 | `#AI/工具层` |
| [[Agent_Context]] | `Framework/` | 智能体上下文 | `#AI/上下文` |
| [[Zeabur_Platform_Introduction]] | `Framework/` | Zeabur 平台 | `#云平台/Zeabur` |
| [[PaaS_Platform_Comparison]] | `Framework/` | PaaS 对比 | `#云平台/PaaS` |
| [[Superpowers_Skill_Introduction]] | `Framework/` | Superpowers | `#AI/技能/Superpowers` |
| [[LLM_Transformer_Architecture]] | `LLM/` | Transformer | `#AI/模型/Transformer` |
| [[Self_Attention_Algorithm]] | `LLM/` | 自注意力 | `#AI/模型/注意力` |
| [[LLM_MoE_Architecture]] | `LLM/` | MoE 架构 | `#AI/模型/MoE` |
| [[LLM_Model_Layer]] | `LLM/` | 模型层 | `#AI/模型/提供商` |
| [[AutoGPT_Introduction]] | `Agent/` | AutoGPT | `#AI/智能体/AutoGPT` |
| [[AgentGPT_Introduction]] | `Agent/` | AgentGPT | `#AI/智能体/AgentGPT` |
| [[Hermes_Agent_Architecture_Design]] | `Agent/` | Hermes | `#AI/智能体/Hermes` |
| [[OpenClaw_Architecture_Design]] | `Agent/` | OpenClaw | `#AI/智能体/OpenClaw` |
| [[Trae_Introduction]] | `Agent/` | Trae | `#AI/智能体/Trae` |
| [[Claude_Code_Introduction]] | `Claude/` | Claude Code | `#AI/Claude/编程` |
| [[Claude_Beta_Products]] | `Claude/` | Claude Beta | `#AI/Claude/产品` |
| [[Claude_Design_Artifacts_Introduction]] | `Claude/` | Artifacts | `#AI/Claude/设计` |
| [[Anthropic_Harness_Engineering_AI_Agent]] | `Claude/` | Harness | `#AI/Claude/工程` |
| [[Install_Claude_Code_on_Windows10]] | `Claude/` | 安装指南 | `#AI/Claude/安装` |
| [[Obsidian_Introduction]] | `Tool/` | Obsidian | `#工具/Obsidian` |
| [[Obsidian_Claude_Code_Workflow]] | `Tool/` | 工作流 | `#工具/Obsidian` |
| [[GStack_Introduction]] | `Tool/` | GStack | `#工具/GStack` |
| [[GPU_price_202604]] | `Market/` | 显卡价格 | `#硬件/GPU` |
| [[Game/Unity_README]] | `Game/` | Unity | `#游戏/Unity` |

---

## 六、阅读笔记 `Reading/`

个人读书笔记，涵盖中国文学、外国文学、人文社科：

| 文档 | 位置 | 标签 |
|------|------|------|
| [[Reading/MOC]] | `Reading/` | 阅读笔记索引 | `#阅读` |
| [[红楼梦]] | `Reading/` | 曹雪芹 | `#阅读/中国文学` |
| [[红楼梦-双线结构]] | `Reading/` | 红楼专题 | `#阅读/中国文学` |
| [[了不起的盖茨比]] | `Reading/` | 菲茨杰拉德 | `#阅读/外国文学` |
| [[克林索尔的夏天]] | `Reading/` | 黑塞 | `#阅读/外国文学` |
| [[刀锋]] | `Reading/` | 毛姆 | `#阅读/外国文学` |

---

*文档创建时间：2026年05月13日*
