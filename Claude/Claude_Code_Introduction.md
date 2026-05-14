---
title: Claude Code 介绍
created: 2026-05-14
updated: 2026-05-14
tags: [AI, Claude, 编程智能体, CLI, Anthropic]
related: "[[Claude_Beta_Products]], [[Install_Claude_Code_on_Windows10]], [[Anthropic_Harness_Engineering_AI_Agent]]"
---

# Claude Code 介绍

**Claude Code** 是 Anthropic 官方推出的 **命令行 AI 编程智能体**，是目前最强大的 CLI 编程助手之一。

## 一、产品定位

| 属性 | 说明 |
|------|------|
| **出品方** | Anthropic |
| **类型** | CLI 编程智能体 |
| **运行环境** | 终端 / IDE / GitHub |
| **计费方式** | 按 API 使用量计费 |
| **支持模型** | Claude Opus 4.6 / Sonnet 4.6 / Haiku 4.5 |

## 二、核心能力

Claude Code 是一个**具备自主能力的编程智能体**，通过自然语言指令即可完成复杂编程任务：

| 能力 | 说明 |
|------|------|
| **代码库理解** | 深度分析项目结构，理解代码上下文 |
| **文件操作** | 读、写、编辑文件，多文件同时修改 |
| **命令执行** | 运行 shell 命令、测试、构建脚本 |
| **Git 工作流** | 提交代码、创建分支、处理 PR |
| **代码搜索** | 搜索文件、查找代码、正则匹配 |
| **代码解释** | 解释复杂代码逻辑、技术文档生成 |

## 三、内置工具列表

Claude Code 提供丰富的工具集，可自主选择调用：

| 工具 | 功能 |
|------|------|
| **Read** | 读取文件内容 |
| **Write** | 写入新文件 |
| **Edit** | 编辑现有文件（精确字符串替换） |
| **Bash** | 执行 shell 命令 |
| **Glob** | 文件模式匹配搜索 |
| **Grep** | 代码内容搜索（支持正则） |
| **LSP** | 代码智能（跳转定义、查找引用、悬停信息） |
| **WebFetch** | 获取网页内容 |
| **WebSearch** | 网络搜索 |
| **TaskCreate** | 任务管理与追踪 |
| **NotebookEdit** | Jupyter Notebook 编辑 |

## 四、IDE 集成

Claude Code 支持多种开发环境集成：

| 环境 | 集成方式 |
|------|----------|
| **VS Code** | 通过 `/ide` 命令连接 |
| **JetBrains** | 支持 IntelliJ、PyCharm 等 IDE |
| **终端** | 直接在命令行运行 `claude` |
| **GitHub** | 通过 GitHub Actions 自动化，可 @claude 评论触发 |

## 五、MCP 协议支持

Claude Code 支持 **MCP（Model Context Protocol）**，可扩展连接外部工具和服务：

- 连接数据库、API 服务
- 集成 Figma、Linear 等工具
- 自定义 MCP Server 扩展能力

## 六、Agent SDK

Claude Code 提供 **Agent SDK**，支持构建自定义智能体应用：

| SDK 特性 | 说明 |
|----------|------|
| **TypeScript SDK** | 嵌入 Claude Code 到应用中 |
| **自定义工具** | 定义专属工具和命令 |
| **权限控制** | 精细化权限管理 |
| **多智能体** | 支持子智能体并行执行 |
| **文件追踪** | 文件修改检查点，支持回滚 |

## 七、典型使用场景

```bash
# 启动 Claude Code
claude

# 常见任务示例
"帮我重构这个函数，提高性能"
"搜索项目中所有的 SQL 查询"
"运行测试并修复失败的用例"
"创建一个 PR 并写好描述"
"解释这个复杂模块的工作原理"
```

## 八、与同类产品对比

| 产品 | 类型 | IDE集成 | Git支持 | 自主性 | 价格 |
|------|------|---------|---------|--------|------|
| **Claude Code** | CLI | VS Code/JetBrains | 完整 | 高 | 按用量 |
| **Cursor** | IDE | 深度集成 | 基本 | 中 | $20/月 |
| **Aider** | CLI | 无 | Git集成 | 中 | 免费 |
| **GitHub Copilot** | 插件 | VS Code等 | 无 | 低 | $10/月 |
| **Devin** | 云端 | 无 | 完整 | 最高 | 企业定制 |

## 九、适用人群

- **资深开发者** - 喜欢终端工作流，追求高效
- **全栈工程师** - 需要处理多类型任务
- **开源贡献者** - 频繁处理 Git/GitHub 工作流
- **团队开发** - 通过 GitHub Actions 实现自动化

## 十、参考资源

- [Claude Code 官网](https://claude.ai/code)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [Claude Code 文档](https://code.claude.com/docs)
- [Claude Code 工具](https://code.claude.com/docs/tools)

---

*文档创建时间：2026年05月14日*
