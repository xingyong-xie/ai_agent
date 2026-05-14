---
title: Trae 介绍
created: 2026-05-14
updated: 2026-05-14
tags: [AI, 智能体, Trae, IDE, 字节跳动, 编程]
related: "[[AutoGPT_Introduction]], [[Claude_Code_Introduction]], [[AI_Agent_Development_Framework]]"
---

# Trae 介绍

**Trae** 是字节跳动推出的 **国内首个 AI 原生 IDE**，提供深度 AI 集成的开发环境。

## 一、产品定位

| 属性 | 说明 |
|------|------|
| **出品方** | 字节跳动 (ByteDance) |
| **类型** | AI 原生 IDE |
| **特点** | 国内首个AI原生IDE |
| **价格** | 免费 |
| **网址** | https://trae.ai/ |

## 二、双开发模式

Trae 提供两种开发模式，可自由切换：

| 模式 | 特点 | 适用场景 |
|------|------|----------|
| **IDE 模式** | 保留传统工作流，开发者主导 | 需要精细控制的复杂任务 |
| **SOLO 模式** | AI 主导任务，自动推进开发 | 快速原型、自动化任务 |

## 三、内置 AI 编程智能体

SOLO 模式内置两个专业智能体：

| 智能体 | 功能 | 特点 |
|--------|------|------|
| **SOLO Coder** | 复杂项目开发 | 从需求迭代到架构重构，完成全流程开发 |
| **SOLO Builder** | 快速构建 Web 应用 | 自然语言描述需求 → 自动选模型 → 生成 PRD → 写代码 → 预览结果 |

## 四、核心功能

| 功能 | 说明 |
|------|------|
| **智能代码补全** | AI 驱动的代码自动补全 |
| **AI Q&A 助手** | 内置 AI 对话，解答编程问题 |
| **Agent 编程** | 智能体自主执行复杂任务 |
| **多模态输入** | 支持文本、语音等多种输入方式 |
| **MCP 协议** | 支持 MCP 扩展，连接外部工具 |
| **中文优化** | 针对中文开发场景深度优化 |

## 五、Trae Agent（CLI 版本）

字节跳动还开源了 **Trae Agent**，一个命令行 AI 编程智能体：

| 属性 | 说明 |
|------|------|
| **类型** | CLI 编程智能体 |
| **开源** | GitHub 开源项目 |
| **多模型支持** | OpenAI、Anthropic、Google Gemini、Ollama 等 |
| **特点** | 研究友好，透明模块化架构 |

Trae Agent 核心特性：
- **多 LLM 提供商支持** - OpenAI、Anthropic、Google、OpenRouter、Ollama
- **丰富工具生态** - 文件操作、Bash 执行等
- **轨迹记录** - 详细记录任务执行过程，便于研究调试
- **Docker 沙箱** - 安全隔离的执行环境
- **交互模式** - 支持对话式交互开发

## 六、与同类产品对比

| 产品 | 出品方 | 类型 | 模式 | 价格 | 中文支持 |
|------|--------|------|------|------|----------|
| **Trae** | 字节跳动 | AI IDE | IDE + SOLO | 免费 | 优秀 |
| **Trae Agent** | 字节跳动 | CLI Agent | CLI | 免费 | 良好 |
| **Cursor** | 美国 | AI IDE | IDE | $20/月 | 基本 |
| **Claude Code** | Anthropic | CLI Agent | CLI | 按用量 | 基本 |
| **Windsurf** | Codeium | AI IDE | IDE | $15/月 | 基本 |

## 七、适用人群

- **国内开发者** - 中文优化，本地化体验好
- **快速原型开发** - SOLO Builder 快速生成 Web 应用
- **研究学习** - Trae Agent 架构透明，适合学术研究
- **预算有限** - 完全免费，无使用成本

## 八、参考资源

- [Trae 官网](https://trae.ai/)
- [Trae 文档](https://docs.trae.ai/)
- [Trae Agent GitHub](https://github.com/bytedance/trae-agent)

---

*文档创建时间：2026年05月14日*
