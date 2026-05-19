---
title: Superpowers 技能框架
created: 2026-05-19
updated: 2026-05-19
tags: [AI, 智能体技能, Superpowers, Claude Code, TDD, 开发方法论]
related: "[[Agent_Skills_introduce]], [[Claude_Code_Introduction]], [[Agent_MCP_introduce]]"
---

# Superpowers 技能框架

## 一、概述

**Superpowers** 是一个为编程智能体打造的完整软件开发方法论框架，由 [Jesse Vincent](https://blog.fsck.com) 和 [Prime Radiant](https://primeradiant.com) 团队构建。它通过一组**可组合的 Skills（技能）**和初始化指令，让编程智能体遵循系统化的开发流程，而非随意写代码。

| 属性 | 说明 |
|------|------|
| **定位** | 编程智能体的完整软件开发方法论 |
| **作者** | Jesse Vincent / Prime Radiant |
| **开源** | MIT License |
| **GitHub** | https://github.com/obra/superpowers |
| **兼容平台** | Claude Code、Codex CLI、Codex App、Factory Droid、Gemini CLI、OpenCode、Cursor、GitHub Copilot CLI |

### 核心理念

| 原则              | 说明        |
| --------------- | --------- |
| **测试驱动开发（TDD）** | 先写测试，始终如此 |
| **系统化优于即兴**     | 流程优于猜测    |
| **复杂度削减**       | 简洁为首要目标   |
| **证据优于断言**      | 验证后再宣布成功  |

---

## 二、工作原理

Superpowers 从你启动编程智能体的那一刻就开始工作：

```
1. 智能体不会直接写代码，而是先问"你到底想做什么？"
2. 通过苏格拉底式提问，提炼出设计规格
3. 将设计分块展示，让你逐步确认
4. 你批准设计后，生成清晰的实施计划
5. 你说"开始"，启动子智能体驱动开发流程
6. 每个工程任务由独立子智能体完成，两阶段审查
7. 智能体可自主工作数小时而不偏离计划
```

**关键**：所有技能自动触发，无需手动操作。你的编程智能体自动拥有 Superpowers。

---

## 三、基础工作流

### 3.1 七步核心流程

| 步骤  | 技能                                 | 触发时机  | 说明                                                     |
| --- | ---------------------------------- | ----- | ------------------------------------------------------ |
| 1   | **brainstorming**                  | 写代码前  | 通过提问提炼想法，探索替代方案，分段展示设计，保存设计文档                          |
| 2   | **using-git-worktrees**            | 设计批准后 | 创建隔离工作区（新分支），运行项目设置，验证测试基线                             |
| 3   | **writing-plans**                  | 设计批准后 | 将工作拆分为小任务（每个 2-5 分钟），含精确文件路径、完整代码、验证步骤                 |
| 4   | **subagent-driven-development**    | 计划就绪后 | 每个任务派发独立子智能体，两阶段审查（规格合规 + 代码质量）                        |
| 4'  | **executing-plans**                | 计划就绪后 | 批量执行，人工检查点                                             |
| 5   | **test-driven-development**        | 实现过程中 | 强制 RED-GREEN-REFACTOR：写失败测试 → 看它失败 → 写最小代码 → 看它通过 → 提交 |
| 6   | **requesting-code-review**         | 任务之间  | 对照计划审查，按严重度报告问题，关键问题阻止进度                               |
| 7   | **finishing-a-development-branch** | 任务完成  | 验证测试，提供选项（合并/PR/保留/丢弃），清理工作树                           |

> 智能体在每个任务前**自动检查相关技能**。这些是强制工作流，而非建议。

### 3.2 工作流可视化

```
用户需求
  │
  ▼
┌─────────────┐
│ brainstorming │ ← 提问、探索、设计规格
└──────┬──────┘
       │ 用户批准设计
       ▼
┌──────────────────┐
│ using-git-worktrees │ ← 创建隔离工作区
└──────┬───────────┘
       │
       ▼
┌──────────────┐
│ writing-plans │ ← 拆分为小任务
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ subagent-driven-dev     │ ← 子智能体逐任务执行
│  ┌─────┐  ┌─────┐      │
│  │任务1│→│任务2│→ ...  │
│  └──┬──┘  └──┬──┘      │
│     │审查    │审查      │
└─────┼────────┼─────────┘
      │        │
      ▼        ▼
┌──────────────────────┐
│ test-driven-dev       │ ← RED-GREEN-REFACTOR
│ requesting-code-review│ ← 代码审查
└──────────┬───────────┘
           │
           ▼
┌────────────────────────────┐
│ finishing-a-development-branch│ ← 合并/PR/清理
└────────────────────────────┘
```

---

## 四、技能库详解

### 4.1 测试类

| 技能 | 说明 |
|------|------|
| **test-driven-development** | RED-GREEN-REFACTOR 循环，包含测试反模式参考 |

**TDD 循环**：

```
RED:    写一个失败的测试 → 看它失败
  ↓
GREEN:  写最少的代码让测试通过 → 看它通过
  ↓
REFACTOR: 重构代码（测试仍通过）
  ↓
COMMIT: 提交
  ↓
下一个测试...
```

> 关键规则：**先写测试的代码前写的代码会被删除**。

### 4.2 调试类

| 技能 | 说明 |
|------|------|
| **systematic-debugging** | 4 阶段根因分析流程（包含根因追踪、纵深防御、条件等待技术） |
| **verification-before-completion** | 确认问题真的被修复了 |

**系统化调试 4 阶段**：

```
1. 复现 → 稳定复现问题
2. 缩小 → 二分法缩小问题范围
3. 根因 → 找到根本原因
4. 修复 → 最小修复 + 防御性检查
```

### 4.3 协作类

| 技能                                 | 说明                        |
| ---------------------------------- | ------------------------- |
| **brainstorming**                  | 苏格拉底式设计提炼                 |
| **writing-plans**                  | 详细实施计划                    |
| **executing-plans**                | 批量执行 + 人工检查点              |
| **dispatching-parallel-agents**    | 并发子智能体工作流                 |
| **requesting-code-review**         | 审查前检查清单                   |
| **receiving-code-review**          | 响应反馈                      |
| **using-git-worktrees**            | 并行开发分支                    |
| **finishing-a-development-branch** | 合并/PR 决策工作流               |
| **subagent-driven-development**    | 快速迭代 + 两阶段审查（规格合规 → 代码质量） |

### 4.4 元技能

| 技能                    | 说明                 |
| --------------------- | ------------------ |
| **writing-skills**    | 按最佳实践创建新技能（含测试方法论） |
| **using-superpowers** | 技能系统入门介绍           |

---

## 五、安装方式

### Claude Code

```bash
# 方式一：官方插件市场
/plugin install superpowers@claude-plugins-official

# 方式二：Superpowers 市场
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

### Codex CLI

```bash
/plugins           # 打开插件搜索
# 搜索 "superpowers" → Install Plugin
```

### Codex App

侧边栏 → Plugins → Coding 部分 → Superpowers → 点击 `+`

### Gemini CLI

```bash
gemini extensions install https://github.com/obra/superpowers
```

### Cursor

在 Cursor Agent 聊天中：

```text
/add-plugin superpowers
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add obra/superpowers-marketplace
copilot plugin install superpowers@superpowers-marketplace
```

### OpenCode

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

### Factory Droid

```bash
droid plugin marketplace add https://github.com/obra/superpowers
droid plugin install superpowers@superpowers
```

---

## 六、与 Agent Skills 标准的关系

| 维度 | **Superpowers** | **Agent Skills（agentskills.io）** |
|------|----------------|-----------------------------------|
| **定位** | 完整开发方法论 | 技能格式标准 + 市场 |
| **格式** | SKILL.md（符合 agentskills.io 标准） | SKILL.md 标准规范 |
| **技能数量** | 13 个（专注开发流程） | 112+ 个（覆盖各类场景） |
| **自动化程度** | 自动触发，强制执行 | 按需调用 |
| **核心关注** | TDD + 系统化 + 子智能体驱动 | 通用技能扩展 |
| **兼容平台** | 8+ 编程智能体 | Claude Code + OpenAI Codex |

> Superpowers 是 Agent Skills 生态中的一个**重量级技能包**，遵循 SKILL.md 格式标准，但提供了完整的开发流程方法论。

---

## 七、适用场景

| 场景 | 说明 |
|------|------|
| **中大型功能开发** | 需要设计→计划→实现→审查的完整流程 |
| **团队协作项目** | 统一开发方法论，代码质量有保障 |
| **TDD 实践** | 强制测试驱动，杜绝无测试代码 |
| **子智能体协作** | 复杂任务拆分，并行开发，自动审查 |
| **长期自主开发** | 智能体可自主工作数小时不偏离计划 |

---

## 八、社区与资源

| 资源 | 链接 |
|------|------|
| GitHub | https://github.com/obra/superpowers |
| 发布公告 | https://blog.fsck.com/2025/10/09/superpowers/ |
| Discord | https://discord.gg/35wsABTejz |
| 赞助 | https://github.com/sponsors/obra |
| 版本通知 | https://primeradiant.com/superpowers/ |

---

*文档创建时间：2026年05月19日*
