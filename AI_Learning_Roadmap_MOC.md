---
title: AI 学习路线（MOC）
created: 2026-05-13
updated: 2026-05-13
tags: [MOC, AI, 学习路线, 知识地图]
related: "[[README]], [[Obsidian_Claude_Code_Workflow]]"
---

# AI 学习路线（MOC）

> 本文档是 AI Agent 知识库的内容地图（Map of Content），汇总所有知识入口与学习路径。

---

## 一、AI 智能体基础

入门必读，建立 AI 智能体的全局认知：

- [[README]] — AI 智能体完整介绍（10 章综述：定义、流行智能体、模型层、工具层、技能、上下文、MCP、趋势、场景）
- [[AI_Agent_Development_Framework]] — 开发框架总览（LangChain / LlamaIndex / AutoGen / CrewAI / Deer-Flow）
- [[Agent_Skills_introduce]] — 智能体技能标准（agentskills.io / SKILL.md 格式）
- [[Agent_MCP_introduce]] — 模型上下文协议（MCP 原理 / 工具集成 / 生态）

---

## 二、大模型核心架构

从 Transformer 到 MoE，理解大模型底层原理：

### Transformer 架构

- [[LLM_Transformer_Architecture]] — Transformer 完整架构（组件/改进/模型对比/训练推理）
  - [[Self_Attention_Algorithm]] — 自注意力算法深度解析（QKV/因果掩码/复杂度/代码实现/9种变体）

### MoE 架构

- [[LLM_MoE_Architecture]] — MoE 稀疏激活架构（Router/Expert/共享专家/负载均衡/DeepSeek创新）

### 学习路径建议

```
入门: [[README]] → 了解 AI 智能体全貌
  ↓
基础: [[LLM_Transformer_Architecture]] → 理解大模型基础架构
  ↓
深入: [[Self_Attention_Algorithm]] → 掌握注意力机制核心算法
  ↓
进阶: [[LLM_MoE_Architecture]] → 了解最新 MoE 稀疏架构创新
  ↓
框架: [[AI_Agent_Development_Framework]] → 学习智能体开发工具
  ↓
协议: [[Agent_MCP_introduce]] + [[Agent_Skills_introduce]] → 掌握工具/技能集成标准
```

---

## 三、智能体平台与架构

各大智能体平台的设计与实现：

- [[AutoGPT_Introduction]] — AutoGPT 开源智能体平台（Frontend/Server/Block工作流/Marketplace）
- [[AgentGPT_Introduction]] — AgentGPT Web 端智能体平台（Next.js + FastAPI/Plan-and-Solve/工具系统）
- [[Hermes_Agent_Architecture_Design]] — Hermes 自我改进型智能体（闭环学习/15+平台/95K stars）
- [[OpenClaw_Architecture_Design]] — OpenClaw 多平台 AI 助手网关（WhatsApp/Telegram/Discord）

---

## 四、Claude 生态

Anthropic Claude 系列产品与工程框架：

- [[Claude_Beta_Products]] — Claude Beta 产品（Cowork / Chrome / Excel / PowerPoint 智能体）
- [[Claude_Design_Artifacts_Introduction]] — Claude Artifacts Canvas（前端设计/代码生成/实时预览）
- [[Anthropic_Harness_Engineering_AI_Agent]] — Anthropic Harness 工程框架（评估/安全/部署）
- [[Install_Claude_Code_on_Windows10]] — Claude Code Windows 安装指南

---

## 五、知识管理与工具

构建个人知识管理系统：

- [[Obsidian_Introduction]] — Obsidian 本地知识管理工具（双向链接/图谱/插件生态/工作流）
- [[Obsidian_Claude_Code_Workflow]] — Obsidian + Claude Code AI 驱动工作流（研究生成/拆分/批量更新/Git管理）

---

## 六、硬件与基础设施

AI 训练与推理的硬件基础：

- [[GPU_price_202604]] — 主流商用显卡价格参考（消费级/数据中心级）

---

## 七、其他

- [[games/Unity_README]] — Unity 游戏引擎完整指南

---

## 文档索引

| 文档 | 主题 | 标签 |
|------|------|------|
| [[README]] | AI 智能体综述 | `#AI/智能体` |
| [[AI_Agent_Development_Framework]] | 开发框架 | `#AI/框架` |
| [[Agent_Skills_introduce]] | 智能体技能 | `#AI/技能` |
| [[Agent_MCP_introduce]] | MCP 协议 | `#AI/协议` |
| [[LLM_Transformer_Architecture]] | Transformer | `#AI/模型/Transformer` |
| [[Self_Attention_Algorithm]] | 自注意力 | `#AI/模型/注意力` |
| [[LLM_MoE_Architecture]] | MoE 架构 | `#AI/模型/MoE` |
| [[AutoGPT_Introduction]] | AutoGPT | `#AI/智能体/AutoGPT` |
| [[AgentGPT_Introduction]] | AgentGPT | `#AI/智能体/AgentGPT` |
| [[Hermes_Agent_Architecture_Design]] | Hermes | `#AI/智能体/Hermes` |
| [[OpenClaw_Architecture_Design]] | OpenClaw | `#AI/智能体/OpenClaw` |
| [[Claude_Beta_Products]] | Claude Beta | `#AI/Claude/产品` |
| [[Claude_Design_Artifacts_Introduction]] | Artifacts | `#AI/Claude/设计` |
| [[Anthropic_Harness_Engineering_AI_Agent]] | Harness | `#AI/Claude/工程` |
| [[Install_Claude_Code_on_Windows10]] | 安装指南 | `#AI/Claude/安装` |
| [[Obsidian_Introduction]] | Obsidian | `#工具/Obsidian` |
| [[Obsidian_Claude_Code_Workflow]] | 工作流 | `#工具/Obsidian` |
| [[GPU_price_202604]] | 显卡价格 | `#硬件/GPU` |

---

*文档创建时间：2026年05月13日*
