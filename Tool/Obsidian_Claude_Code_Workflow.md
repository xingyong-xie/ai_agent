---
title: Obsidian + Claude Code：AI 驱动的本地知识管理工作流
created: 2026-05-13
updated: 2026-05-13
tags: [Obsidian, Claude-Code, 知识管理, 工作流, AI]
related: "[[Obsidian_Introduction]], [[LLM_Transformer_Architecture]]"
---

# Obsidian + Claude Code：AI 驱动的本地知识管理工作流

> 本文介绍如何将 **Obsidian**（本地知识管理）与 **Claude Code**（AI 编程助手）结合，打造 AI 驱动的知识管理闭环。

## 一、为什么 Obsidian + Claude Code

两者的结合并非偶然——它们在数据格式和工作方式上天然互补：

```
┌──────────────────────────────────────────────────────────┐
│            Obsidian + Claude Code 互补性                  │
│                                                           │
│  Obsidian 的优势:          Claude Code 的优势:            │
│  ┌──────────────┐          ┌──────────────┐              │
│  │ 可视化浏览    │          │ AI 生成内容   │              │
│  │ 双向链接      │          │ 智能搜索整理  │              │
│  │ 知识图谱      │          │ 批量操作文件  │              │
│  │ 图形化编辑    │          │ Git 版本管理  │              │
│  │ 人工审阅      │          │ 自动化脚本    │              │
│  └──────┬───────┘          └──────┬───────┘              │
│         │                         │                       │
│         └───────── 共同基础 ────────┘                      │
│                  纯 Markdown 文件                         │
│                  本地文件系统                              │
│                  命令行可操作                              │
└──────────────────────────────────────────────────────────┘
```

| 维度        | Obsidian 单独使用 | Claude Code 单独使用 | Obsidian + Claude Code |
| --------- | ------------- | ---------------- | ---------------------- |
| **内容创建**  | 手动编写          | AI 生成但无结构        | AI 生成 + 结构化组织          |
| **知识关联**  | 手动建立链接        | 无链接能力            | AI 自动发现 + 手动确认         |
| **批量操作**  | 逐个操作          | 可批量脚本            | Claude Code 批量执行       |
| **搜索整理**  | 关键词搜索         | 语义理解搜索           | 关键词 + AI 语义理解          |
| **版本管理**  | 需装 Git 插件     | 内置 Git 操作        | Claude Code 自动管理       |
| **知识可视化** | 图谱/Canvas     | 无                | AI 构建 + Obsidian 可视化   |
| **内容质量**  | 取决于个人         | AI 辅助提升          | AI 生成 + 人工审校           |

**核心理念**：Claude Code 是"笔"，Obsidian 是"书架"——AI 负责高效生产和整理，Obsidian 负责优雅呈现和互联。

---

## 二、架构总览

```
┌──────────────────────────────────────────────────────────────┐
│              Obsidian + Claude Code 工作流架构                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                  Claude Code (CLI)                    │     │
│  │                                                       │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │     │
│  │  │ 读取现有  │ │ AI 生成  │ │   批量操作            │ │     │
│  │  │ 文档内容  │ │ 新文档   │ │ 重命名/链接/标签      │ │     │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │     │
│  │  │ Web 搜索  │ │ Git 管理 │ │   CLAUDE.md 指令     │ │     │
│  │  │ 研究资料  │ │ 版本控制 │ │   项目规范/模板      │ │     │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │     │
│  └──────────────────────────┬───────────────────────────┘     │
│                             │ 读写 Markdown 文件              │
│                             ▼                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              本地文件系统 (Vault)                      │     │
│  │                                                       │     │
│  │  *.md 文件 ← Claude Code 和 Obsidian 共同操作        │     │
│  │  CLAUDE.md ← Claude Code 的项目指令                  │     │
│  │  .claude/  ← Claude Code 配置                        │     │
│  │  .obsidian/← Obsidian 配置                            │     │
│  └──────────────────────────┬───────────────────────────┘     │
│                             │                                 │
│                             ▼                                 │
│  ┌─────────────────────────────────────────────────────┐     │
│  │                Obsidian (GUI)                         │     │
│  │                                                       │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │     │
│  │  │ 知识图谱  │ │ 双向链接  │ │   Canvas 画布        │ │     │
│  │  │ 可视化    │ │ 关联发现  │ │   架构图/思维导图    │ │     │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │     │
│  │  │ 阅读审校  │ │ Dataview │ │   插件生态            │ │     │
│  │  │ 人工确认  │ │ 查询聚合  │ │   主题/扩展          │ │     │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 三、当前 Vault 实战结构

当前 `/Users/xiexingyong/ai_agent` 已经是一个 Obsidian + Claude Code 协同工作的 Vault：

```
ai_agent/                         ← Obsidian Vault 根目录
│
├── CLAUDE.md                     ← Claude Code 项目指令
├── .claude/                      ← Claude Code 配置
│   └── settings.local.json       ← 权限与工具配置
│
├── README.md                     ← AI 智能体完整介绍
├── AI_Agent_Development_Framework.md
├── AutoGPT_Introduction.md       ← Claude Code 生成 → Obsidian 浏览
├── AgentGPT_Introduction.md      ← Claude Code 生成 → Obsidian 浏览
├── LLM_MoE_Architecture.md       ← Claude Code 生成 → Obsidian 浏览
├── LLM_Transformer_Architecture.md ← Claude Code 生成 → Obsidian 浏览
├── Self_Attention_Algorithm.md   ← Claude Code 生成/拆分 → Obsidian 浏览
├── Obsidian_Introduction.md      ← Claude Code 生成 → Obsidian 浏览
├── Claude_Beta_Products.md
├── Claude_Design_Artifacts_Introduction.md
├── OpenClaw_Architecture_Design.md
├── Hermes_Agent_Architecture_Design.md
├── Anthropic_Harness_Engineering_AI_Agent.md
├── Install_Claude_Code_on_Windows10.md
└── GPU_price_202604.md

协作流程:
  用户提需求 → Claude Code 研究+生成 → 写入 .md 文件 → Obsidian 图谱/链接浏览
  Obsidian 发现关联 → 用户补充需求 → Claude Code 更新/拆分 → Git 版本控制
```

---

## 四、CLAUDE.md —— 协作的关键配置

`CLAUDE.md` 是 Obsidian + Claude Code 协作的核心，它告诉 Claude Code 如何在这个 Vault 中工作：

### 当前配置解读

```markdown
# CLAUDE.md 中的关键指令

## 仓库定位
→ 这是文档型仓库，不是软件项目
→ Claude Code 生成/编辑 Markdown 文档

## 文档规范
→ 中文为主
→ 表格结构一致
→ 独立文档自包含
→ 末尾附参考资源和创建日期

## 创建新文档规则
→ 独立 .md 文件
→ 包含: 概述、核心特性、对比表、架构图(ASCII)、应用场景、参考资源
→ 与已有文档交叉引用

## 工具权限
→ WebSearch / WebFetch / Python3 / Pip / MCP 文档查询
```

### 优化建议：增加 Obsidian 专用指令

可以在 `CLAUDE.md` 中追加以下指令，让 Claude Code 更好地适配 Obsidian 工作流：

```markdown
## Obsidian 集成规范

### 双向链接
- 在文档中引用相关主题时使用 [[页面名]] 语法
- 例: 关于 MoE 的内容应链接 [[LLM_MoE_Architecture]]
- 例: 自注意力内容应链接 [[Self_Attention_Algorithm]]

### YAML Frontmatter
- 每个文档顶部添加属性元数据:
  ---
  title: 文档标题
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  tags: [标签1, 标签2]
  related: "[[关联文档1]], [[关联文档2]]"
  ---

### 文档拆分
- 单个文档超过 500 行时，考虑拆分为独立文档
- 拆分后在原文档中保留链接指向新文档
- 例: Self-Attention 从 Transformer 文档中拆分

### MOC（内容地图）
- 维护一个 MOC 文档，汇总所有知识入口
- 新建文档后更新 MOC 中的链接

### 标签体系
- 使用层级标签: #AI/模型, #AI/框架, #AI/工具
- 统一标签命名规范
```

---

## 五、核心工作流详解

### 工作流 1：AI 研究与文档生成

```
用户: "介绍 AutoGPT 及其架构"

Claude Code 执行流程:
┌───────────────────────────────────────────────────────┐
│ 1. WebSearch 搜索 AutoGPT 最新信息                     │
│ 2. WebFetch/curl 获取 GitHub README                    │
│ 3. Read 读取 CLAUDE.md 了解项目规范                    │
│ 4. Read 读取已有文档避免重复                            │
│ 5. 综合 research 结果，按规范生成文档                   │
│ 6. Write 写入 AutoGPT_Introduction.md                  │
│ 7. 文档包含: 概述/架构/组件/对比/参考资源/创建日期     │
└───────────────────────────────────────────────────────┘
                          │
                          ▼
Obsidian 中:
  → 自动出现在文件列表
  → 其他文档的 [[AutoGPT_Introduction]] 链接生效
  → 知识图谱中出现新节点
  → Backlinks 面板显示反向链接
```

### 工作流 2：文档拆分与链接维护

```
用户: "自注意力算法独立为一个文档"

Claude Code 执行流程:
┌───────────────────────────────────────────────────────┐
│ 1. Read 读取源文档，定位拆分边界                        │
│ 2. Write 创建独立文档 Self_Attention_Algorithm.md      │
│ 3. Edit 在源文档中将长内容替换为:                      │
│    > 详细内容请参阅: [[Self_Attention_Algorithm]]      │
│ 4. 在独立文档中添加反向链接:                            │
│    > 本文为 [[LLM_Transformer_Architecture]] 的扩展    │
│ 5. 两边都保留关联                                      │
└───────────────────────────────────────────────────────┘
                          │
                          ▼
Obsidian 中:
  → 图谱显示两个节点的连接线
  → 从任一文档均可跳转到另一文档
  → Backlinks 面板互相关联
```

### 工作流 3：批量更新与一致性维护

```
用户: "给所有文档添加 YAML frontmatter"

Claude Code 执行流程:
┌───────────────────────────────────────────────────────┐
│ 1. Glob 查找所有 *.md 文件                             │
│ 2. 逐个 Read 读取文件内容                              │
│ 3. 分析每个文件的标题和主题                             │
│ 4. Edit 在每个文件顶部插入 YAML 属性块:               │
│    ---                                                 │
│    title: 文档标题                                     │
│    created: 推断的创建日期                             │
│    tags: [相关标签]                                    │
│    related: "[[关联文档]]"                             │
│    ---                                                │
│ 5. 保持原有内容不变                                    │
└───────────────────────────────────────────────────────┘
                          │
                          ▼
Obsidian 中:
  → Dataview 插件可查询 YAML 属性
  → Properties 面板显示结构化元数据
  → 按标签/日期/类型筛选和聚合
```

### 工作流 4：知识图谱构建

```
用户: "构建 AI 学习路线的 MOC"

Claude Code 执行流程:
┌───────────────────────────────────────────────────────┐
│ 1. Glob 找到所有现有文档                               │
│ 2. Read 每个文档，理解主题和层级关系                   │
│ 3. Write 创建 MOC 文档:                               │
│                                                       │
│    # AI 学习路线                                      │
│                                                       │
│    ## 基础理论                                        │
│    - [[LLM_Transformer_Architecture]]                │
│    - [[Self_Attention_Algorithm]]                    │
│    - [[LLM_MoE_Architecture]]                        │
│                                                       │
│    ## 智能体平台                                      │
│    - [[AutoGPT_Introduction]]                         │
│    - [[AgentGPT_Introduction]]                        │
│                                                       │
│    ## 开发框架与工具                                  │
│    - [[AI_Agent_Development_Framework]]               │
│    - [[Obsidian_Introduction]]                        │
│                                                       │
│    ## Claude 生态                                     │
│    - [[Claude_Beta_Products]]                         │
│    - [[Claude_Design_Artifacts_Introduction]]         │
│                                                       │
│ 4. 所有 [[链接]] 在 Obsidian 中自动生效               │
└───────────────────────────────────────────────────────┘
                          │
                          ▼
Obsidian 中:
  → MOC 成为知识图谱的中心枢纽节点
  → 从 MOC 可一键跳转到任何主题
  → 图谱可视化展示完整的知识结构
```

### 工作流 5：Git 版本控制

```
Claude Code 自动管理 Vault 的版本历史:

┌───────────────────────────────────────────────────────┐
│ Claude Code 内置 Git 操作:                             │
│                                                       │
│ 创建文档后:                                           │
│   git add 具体文件.md                                 │
│   git commit -m "添加 XXX 文档"                       │
│                                                       │
│ 修改文档后:                                           │
│   git add 修改文件.md                                 │
│   git commit -m "更新 XXX 的 YYY 部分"               │
│                                                       │
│ 不需要手动操作 Git, Claude Code 全部处理              │
│ 每次变更都有记录, 可随时回溯                           │
│ .obsidian/ 可加入 .gitignore 避免提交配置冲突         │
└───────────────────────────────────────────────────────┘
```

---

## 六、进阶技巧

### 1. 利用 Claude Code Memory 持久化知识

Claude Code 的记忆系统可以跨会话保存关于 Vault 的知识：

```
记忆系统位置: ~/.claude/projects/-Users-xiexingyong-ai-agent/memory/

可保存的记忆类型:
┌────────────────────────────────────────────────────┐
│ user 类型:                                         │
│   "用户偏好中文文档，表格为主"                      │
│   "用户喜欢架构图用 ASCII art"                      │
│                                                    │
│ feedback 类型:                                     │
│   "文档拆分后原文件保留链接指向" ← 成功经验         │
│   "不要在文档末尾加总结段落" ← 用户纠正             │
│                                                    │
│ project 类型:                                      │
│   "Vault 正在从 10 篇扩展到 20 篇"                 │
│   "下一步计划: 添加多模态模型文档"                  │
│                                                    │
│ reference 类型:                                    │
│   "Obsidian 插件列表在 GitHub obsidian-releases"   │
└────────────────────────────────────────────────────┘
```

### 2. 利用 MCP 工具增强研究

```
Claude Code + MCP 的研究增强:

┌───────────────────────────────────────────────────┐
│ context7 MCP:                                      │
│   resolve-library-id → 查找库的 ID                 │
│   query-docs → 查询最新官方文档                    │
│                                                    │
│   例: 研究 LangChain 时:                           │
│   → resolve "langchain" → 获得库 ID               │
│   → query-docs → 获取最新 API 文档                 │
│   → 生成准确的技术文档                             │
│                                                    │
│ 其他 MCP 可扩展:                                   │
│   → 数据库 MCP: 查询结构化数据                     │
│   → 搜索引擎 MCP: 增强网络搜索                     │
│   → 文件系统 MCP: 操作更多文件格式                 │
└───────────────────────────────────────────────────┘
```

### 3. Claude Code Hooks 自动化

可以在 `.claude/settings.json` 中配置 Hooks，实现自动化：

```json
{
  "hooks": {
    "afterWrite": [{
      "command": "cd /Users/xiexingyong/ai_agent && git add $FILE && git commit -m \"更新: $FILE\""
    }]
  }
}
```

### 4. Dataview 查询 Claude Code 生成的属性

如果所有文档都有 YAML frontmatter，Dataview 可以做强大的聚合查询：

```markdown
```dataview
TABLE created, tags, length(file.content) AS 字数
FROM ""
WHERE file.path != "CLAUDE.md"
SORT created DESC
```

```dataview
TABLE file.outlinks AS "出链", file.inlinks AS "入链"
FROM ""
WHERE length(file.inlinks) = 0
SORT file.name ASC
```
```

---

## 七、Obsidian 插件增强 Claude Code 工作流

| 插件 | 与 Claude Code 的协同 |
|------|----------------------|
| **Obsidian Git** | Claude Code 已内置 Git，此插件在 Obsidian 内可视化版本历史 |
| **Dataview** | 查询 Claude Code 写入的 YAML 属性，动态聚合 |
| **Templater** | 可创建 Claude Code 生成文档的模板结构 |
| **Excalidraw** | Claude Code 无法生成图形，但可在 Excalidraw 中手绘架构图 |
| **Copilot** | 在 Obsidian 内直接调用 AI，补充 Claude Code CLI 之外的轻量需求 |
| **Smart Connections** | AI 语义搜索发现笔记关联，补充 [[链接]] 的手动关联 |
| **Canvas** | 用 Claude Code 生成的笔记在 Canvas 中可视化排布 |
| **Local REST API** | 让 Claude Code 通过 HTTP API 操作 Obsidian（高级） |

---

## 八、工作流全景图

```
┌──────────────────────────────────────────────────────────────┐
│           Obsidian + Claude Code 完整工作流                   │
│                                                               │
│  ┌──────────┐                                                │
│  │ 用户需求  │                                                │
│  └────┬─────┘                                                │
│       │                                                       │
│       ▼                                                       │
│  ┌──────────────────────────────────────────┐                │
│  │         Claude Code (终端)                │                │
│  │                                           │                │
│  │  ① WebSearch + WebFetch 研究              │                │
│  │  ② Read 已有文档避免重复                  │                │
│  │  ③ AI 综合分析生成内容                    │                │
│  │  ④ Write/Edit 写入 .md 文件               │                │
│  │  ⑤ 维护 [[双向链接]] 和文档关联           │                │
│  │  ⑥ Git add + commit 版本管理             │                │
│  │  ⑦ 更新 CLAUDE.md / Memory               │                │
│  └──────────────┬───────────────────────────┘                │
│                 │                                             │
│                 │ Markdown 文件                               │
│                 ▼                                             │
│  ┌──────────────────────────────────────────┐                │
│  │         Obsidian (可视化)                  │                │
│  │                                           │                │
│  │  ① 浏览审阅 Claude Code 生成的内容        │                │
│  │  ② 知识图谱发现隐藏关联                   │                │
│  │  ③ Backlinks 发现反向引用                 │                │
│  │  ④ Canvas 画布排布架构关系                │                │
│  │  ⑤ Dataview 查询聚合知识                 │                │
│  │  ⑥ 手动补充/编辑/完善内容                 │                │
│  │  ⑦ 发现新需求 → 反馈给 Claude Code        │                │
│  └──────────────┬───────────────────────────┘                │
│                 │                                             │
│                 │ 新需求/修改反馈                             │
│                 └──────▶ 回到 Claude Code ──▶ 循环            │
│                                                               │
│  ═══════════════════════════════════════════════════════      │
│  底层: 本地 Markdown 文件 + Git 版本控制 + .claude 配置       │
└──────────────────────────────────────────────────────────────┘
```

---

## 九、最佳实践总结

### DO（推荐做法）

| 实践 | 说明 |
|------|------|
| **用 CLAUDE.md 定义规范** | 让 Claude Code 生成的文档风格统一、结构一致 |
| **维护 [[双向链接]]** | 每个文档都应关联到相关主题，构建知识网络 |
| **添加 YAML Frontmatter** | 让 Dataview 等插件可查询，增强结构化 |
| **及时 Git 提交** | 每次有意义的变更后提交，保留历史 |
| **大文档及时拆分** | 超过 500 行考虑拆分，保持文档原子性 |
| **Obsidian 审阅** | AI 生成的内容应在 Obsidian 中人工审校 |
| **利用 Memory 系统** | 保存项目上下文和用户偏好，跨会话保持一致 |

### DON'T（避免做法）

| 实践 | 说明 |
|------|------|
| **不要忽略 CLAUDE.md** | 没有规范约束，AI 生成的文档风格会不一致 |
| **不要在 .obsidian/ 中操作** | 这是 Obsidian 的配置目录，不应由 Claude Code 修改 |
| **不要生成纯复制内容** | AI 应综合研究后产出，不是简单搬运 |
| **不要过度拆分** | 过小的碎片文档反而不利阅读，保持适度粒度 |
| **不要忘记人工审阅** | AI 可能产生事实错误，Obsidian 审阅是必要的质控环节 |
| **不要忽略链接维护** | 文档拆分/重命名后必须更新所有相关链接 |

---

## 十、参考资源

### 工具文档
- [Obsidian 官方文档](https://help.obsidian.md)
- [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)
- [CLAUDE.md 配置指南](https://docs.anthropic.com/en/docs/claude-code/memory)

### 关联文档
- [Obsidian 本地化知识管理工具详解](Obsidian_Introduction.md)
- [大模型 Transformer 架构详解](LLM_Transformer_Architecture.md)
- [大模型 MoE 架构详解](LLM_MoE_Architecture.md)
- [自注意力算法详解](Self_Attention_Algorithm.md)
- [AutoGPT 介绍及架构](AutoGPT_Introduction.md)
- [AgentGPT 介绍及架构](AgentGPT_Introduction.md)
- [AI Agent 知识库总览](README.md)

---

*文档创建时间：2026年05月13日*
