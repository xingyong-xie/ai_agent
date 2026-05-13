---
title: Obsidian 本地化知识管理工具详解
created: 2026-05-13
updated: 2026-05-13
tags: [Obsidian, 知识管理, Markdown, 双向链接]
related: "[[Obsidian_Claude_Code_Workflow]], [[README]]"
---

# Obsidian 本地化知识管理工具详解

## 一、什么是 Obsidian

Obsidian 是一款**基于本地 Markdown 文件的个人知识管理工具**，由 Steph Ango（aka licat）和 Erica Xu 于 2020 年发布。它以**双向链接**和**知识图谱**为核心，将零散的笔记编织成互联的知识网络，被誉为"第二大脑"构建工具。

核心定位：

| 维度 | 说明 |
|------|------|
| **定位** | 本地优先的个人知识管理与思维工具 |
| **开发团队** | Obsidian MD（Steph Ango, Erica Xu） |
| **首发时间** | 2020 年 |
| **开源情况** | 核心闭源，插件/主题生态开源 |
| **数据格式** | 纯 Markdown 文件，完全本地存储 |
| **平台支持** | macOS / Windows / Linux / iOS / Android |
| **商业模式** | 免费（个人使用）+ 付费增值服务 |
| **核心特色** | 双向链接、知识图谱、插件生态、完全本地 |

---

## 二、为什么选择 Obsidian

### 与同类工具对比

| 维度 | Obsidian | Notion | Roam Research | Logseq | Bear |
|------|----------|--------|---------------|--------|------|
| **数据存储** | 本地 Markdown | 云端私有格式 | 云端 | 本地 Markdown | 本地 |
| **数据所有权** | 完全自有 | 依赖服务商 | 依赖服务商 | 完全自有 | 完全自有 |
| **离线访问** | 完全支持 | 有限 | 有限 | 完全支持 | 完全支持 |
| **双向链接** | 支持 | 有限 | 核心功能 | 核心功能 | 不支持 |
| **知识图谱** | 支持 | 不支持 | 支持 | 支持 | 不支持 |
| **插件生态** | 2000+ 插件 | 有限 API | 有限 | 插件系统 | 无 |
| **主题自定义** | CSS 主题 | 有限 | 无 | 有限 | 内置主题 |
| **实时协作** | 付费 Publish | 核心功能 | 有限 | 无 | 无 |
| **跨平台** | 全平台 | 全平台 | Web/iOS/Android | 全平台 | Apple 生态 |
| **免费程度** | 个人免费 | 有额度 | 付费 | 个人免费 | 订阅制 |
| **速度** | 极快 | 依赖网络 | 依赖网络 | 快 | 快 |

### Obsidian 的核心优势

```
┌────────────────────────────────────────────────────────┐
│              Obsidian 核心优势                           │
│                                                         │
│  1. 数据自主 — 纯 Markdown, 永不锁定                    │
│     • 文件存储在本地, 不依赖任何云服务                   │
│     • 用任何文本编辑器都能打开                           │
│     • 即使 Obsidian 停止维护, 数据依然可用               │
│                                                         │
│  2. 双向链接 — 知识互联                                  │
│     • [[页面名]] 创建链接                               │
│     • 自动发现反向链接 (Backlinks)                      │
│     • 非结构化关联, 无需预设分类                         │
│                                                         │
│  3. 知识图谱 — 可视化知识网络                            │
│     • 节点 = 笔记, 边 = 链接                            │
│     • 发现隐藏的知识关联                                 │
│     • 局部图谱 + 全局图谱                                │
│                                                         │
│  4. 插件生态 — 无限扩展                                  │
│     • 2000+ 社区插件                                    │
│     • 500+ 社区主题                                     │
│     • 从知识管理到任务管理, 从 AI 到编程                 │
│                                                         │
│  5. 极速 — 本地渲染                                      │
│     • 无网络延迟                                         │
│     • 毫秒级搜索                                        │
│     • 流畅的编辑体验                                     │
└────────────────────────────────────────────────────────┘
```

---

## 三、核心概念

### 1. Vault（仓库）

Vault 是 Obsidian 的基本组织单元，对应文件系统中的一个文件夹：

```
我的知识库/                    ← Vault 根目录
├── 01-日记/                   ← 日记文件夹
│   ├── 2026-05-13.md
│   └── 2026-05-12.md
├── 02-项目/                   ← 项目文件夹
│   ├── AI Agent 开发.md
│   └── Transformer 学习.md
├── 03-资料/                   ← 参考资料
│   ├── MoE 架构.md
│   └── Self-Attention.md
├── 04-MOC/                    ← Map of Content (内容地图)
│   ├── AI 学习路线.md
│   └── 编程知识地图.md
├── 05-模板/                   ← 模板文件夹
│   ├── 日记模板.md
│   └── 读书笔记模板.md
├── 06-附件/                   ← 图片/文件附件
│   └── screenshot.png
└── .obsidian/                 ← Obsidian 配置 (自动生成)
    ├── app.json
    ├── appearance.json
    ├── community-plugins.json
    └── plugins/
```

**关键特性**：
- Vault = 普通文件夹，完全由文件系统管理
- 可以用 Git 版本控制
- 可以用任何同步工具（iCloud、Dropbox、Syncthing）跨设备同步
- `.obsidian/` 目录存放配置，可以 `.gitignore` 排除

### 2. 双向链接（Bidirectional Links）

```
┌──────────────────────────────────────────────────────────┐
│              双向链接的工作原理                             │
│                                                           │
│  笔记 A: "深度学习"                                       │
│  内容: 深度学习使用 [[Transformer]] 架构...               │
│                     ↓ 链接到                               │
│  笔记 B: "Transformer"                                    │
│  内容: Transformer 是 [[深度学习]] 的基础架构...          │
│                     ↑ 反向链接自动出现                     │
│                                                           │
│  在笔记 B 中, "深度学习" 会自动出现在:                    │
│  ┌──────────────────────────────┐                        │
│  │  Backlinks (反向链接)         │                        │
│  │  • 深度学习 → 第1行           │                        │
│  │  • AI 发展史 → 第3行          │                        │
│  │  • LLM 综述 → 第5行           │                        │
│  └──────────────────────────────┘                        │
│                                                           │
│  不需要在 A 中手动添加 "被引用" 信息!                     │
│  Obsidian 自动维护双向关系                                 │
└──────────────────────────────────────────────────────────┘
```

**链接语法**：

| 语法 | 效果 | 示例 |
|------|------|------|
| `[[页面名]]` | 链接到指定页面 | `[[Transformer]]` |
| `[[页面名\|显示文本]]` | 自定义显示文本 | `[[Transformer\|TF架构]]` |
| `[[页面名#标题]]` | 链接到页面内标题 | `[[Transformer#多头注意力]]` |
| `[[页面名#标题\|显示]]` | 自定义显示+锚点 | `[[Transformer#多头注意力\|MHA]]` |
| `![[页面名]]` | 嵌入页面内容 | `![[Self-Attention]]` |
| `![[图片.png]]` | 嵌入图片 | `![[architecture.png]]` |
| `![[音频.mp3]]` | 嵌入音频 | `![[recording.mp3]]` |

### 3. 知识图谱（Graph View）

```
全局图谱 (Global Graph):
                    ┌──────────┐
              ┌────▶│  MoE     │────┐
              │     └──────────┘    │
              │                     ▼
        ┌──────────┐         ┌──────────┐
        │Transformer│────────▶│DeepSeek  │
        └────┬─────┘         └──────────┘
             │                     ▲
             ▼                     │
     ┌──────────────┐       ┌──────────┐
     │Self-Attention │       │  LLaMA   │
     └──────────────┘       └────┬─────┘
                                  │
                            ┌──────────┐
                            │  GQA     │
                            └──────────┘

局部图谱 (Local Graph, 以 Transformer 为中心):
              ┌──────────┐
              │  MoE     │
              └──────────┘
                   ▲
                   │
        ┌──────────┤──────────┐
        │          │          │
  ┌──────────┐ ┌────────┐ ┌────────┐
  │Self-Attn │ │  RoPE  │ │  FFN   │
  └──────────┘ └────────┘ └────────┘
        │          │          │
        ▼          ▼          ▼
   ┌───────┐ ┌──────┐  ┌───────┐
   │  QKV  │ │位置编码│ │SwiGLU │
   └───────┘ └──────┘  └───────┘
```

**图谱操作**：
- 拖拽节点调整位置
- 滚轮缩放
- 点击节点跳转笔记
- 按标签/文件夹/链接数过滤
- 调整节点力度、距离等参数

### 4. 标签（Tags）与属性（Properties）

**标签**：
```markdown
#深度学习 #Transformer #架构 #2026

标签可以嵌套:
#AI/模型/Transformer
#AI/模型/MoE
#AI/框架/LangChain
```

**属性（YAML Frontmatter）**：
```markdown
---
title: Transformer 架构详解
created: 2026-05-08
updated: 2026-05-13
tags: [AI, Transformer, 深度学习]
type: 技术文档
status: 已完成
difficulty: ⭐⭐⭐⭐
related: "[[Self-Attention]], [[MoE]]"
---
```

属性可以被 Dataview 等插件查询和聚合。

---

## 四、核心功能

### 1. 编辑器

| 功能 | 说明 |
|------|------|
| **所见即所得（Live Preview）** | 编辑时实时预览 Markdown 渲染效果 |
| **源码模式** | 纯 Markdown 源码编辑 |
| **阅读模式** | 只读渲染视图 |
| **多光标编辑** | Ctrl/Cmd + 点击多处同时编辑 |
| ** Vim 模式** | 可选 Vim 键位绑定 |
| **搜索替换** | 支持正则表达式 |
| **折叠** | 标题和列表可折叠 |

### 2. 搜索

```
Obsidian 搜索语法:
─────────────────────────────────────
关键词         搜索包含关键词的笔记
"精确短语"     搜索精确匹配的短语
-tag          排除包含某标签的笔记
file:名称     按文件名搜索
path:路径     按路径搜索
content:内容  按内容搜索
line:(A B)    同一行包含 A 和 B
section:(A B) 同一节包含 A 和 B
task:         搜索任务
task-todo:    搜索未完成任务
task-done:    搜索已完成任务
─────────────────────────────────────
```

### 3. Canvas（画布）

Canvas 是 Obsidian 内置的可视化思维空间：

```
┌──────────────────────────────────────────────────────┐
│                   Obsidian Canvas                     │
│                                                       │
│  ┌─────────────┐      ┌─────────────────┐           │
│  │ 📝 核心概念  │─────▶│ 📝 Transformer  │           │
│  │  • 注意力    │      │  • Encoder-Only  │           │
│  │  • 编码器    │      │  • Decoder-Only  │           │
│  └─────────────┘      └────────┬────────┘           │
│                                │                     │
│                    ┌───────────┼───────────┐         │
│                    ▼           ▼           ▼         │
│             ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│             │ 📝 MHA   │ │ 📝 MoE   │ │ 📝 RoPE  │  │
│             │          │ │          │ │          │  │
│             └──────────┘ └──────────┘ └──────────┘  │
│                    │                                  │
│                    ▼                                  │
│             ┌──────────────────┐                     │
│             │ 🖼️ 架构图.png    │                     │
│             └──────────────────┘                     │
│                                                       │
│  支持: 笔记卡片 / 图片 / PDF / 网页 / 视频 / 分组    │
└──────────────────────────────────────────────────────┘
```

Canvas 特点：
- 无限画布，自由布局
- 支持嵌入笔记、图片、PDF、网页、视频
- 卡片之间可连线表示关系
- 支持分组和嵌套
- `.canvas` 格式存储（JSON），可版本控制

### 4. 命令面板（Command Palette）

`Cmd/Ctrl + P` 打开，快速访问所有功能：

```
命令面板示例:
> 打开今日日记
> 切换阅读模式
> 插入模板
> 打开图谱
> 搜索并替换
> 导出为 PDF
> 切换主题
> ...
```

### 5. 大纲与书签

- **大纲**：自动提取当前笔记的标题层级结构，快速导航
- **书签**：标记常用笔记/搜索，快速访问

---

## 五、核心插件

Obsidian 内置以下核心插件（可按需启用）：

| 插件 | 功能 | 推荐场景 |
|------|------|---------|
| **Daily notes** | 自动创建日期命名的日记 | 每日记录、日志 |
| **Templates** | 插入预设模板 | 重复结构的笔记 |
| **Slash commands** | `/` 触发命令 | 快速操作 |
| **Outgoing links** | 显示当前笔记的出链 | 知识关联 |
| **Backlinks** | 显示反向链接 | 知识发现 |
| **Graph view** | 知识图谱 | 可视化关联 |
| **Canvas** | 无限画布 | 思维梳理、架构设计 |
| **Search** | 全文搜索 | 快速查找 |
| **File explorer** | 文件浏览 | 文件管理 |
| **Word count** | 字数统计 | 写作 |
| **Slides** | 幻灯片演示 | 演讲展示 |
| **Audio recorder** | 录音 | 语音备忘 |
| **Unique note creator** | 创建唯一 ID 笔记 | Zettelkasten |
| **Random note** | 随机打开笔记 | 复习、灵感 |
| **Sync** | 官方同步服务（付费） | 跨设备同步 |
| **Publish** | 官方发布服务（付费） | 公开分享 |

---

## 六、必装社区插件推荐

### 知识管理类

| 插件 | 功能 | 必要性 |
|------|------|--------|
| **Dataview** | SQL 式查询笔记数据，动态生成表格和列表 | ⭐⭐⭐⭐⭐ |
| **Templater** | 高级模板引擎，支持变量、JS 脚本 | ⭐⭐⭐⭐⭐ |
| **Calendar** | 日历视图，快速创建/跳转日记 | ⭐⭐⭐⭐ |
| **Periodic Notes** | 周/月/季度/年度笔记 | ⭐⭐⭐⭐ |
| **Tag Wrangler** | 标签批量重命名和管理 | ⭐⭐⭐ |
| **Banners** | 笔记封面图 | ⭐⭐⭐ |

### 编辑增强类

| 插件 | 功能 | 必要性 |
|------|------|--------|
| **Editing Toolbar** | 可视化编辑工具栏 | ⭐⭐⭐⭐ |
| **Linter** | 自动格式化 Markdown | ⭐⭐⭐⭐ |
| **Easy Typing** | 中文编辑增强（标点、空格等） | ⭐⭐⭐⭐ |
| **Outliner** | 列表大纲增强 | ⭐⭐⭐ |
| **Hover Editor** | 悬浮预览编辑 | ⭐⭐⭐⭐ |

### 可视化类

| 插件 | 功能 | 必要性 |
|------|------|--------|
| **Excalidraw** | 手绘风格白板/流程图 | ⭐⭐⭐⭐⭐ |
| **Mermaid** | 代码生成图表 | 内置支持 |
| **Mind Map** | Markdown 转思维导图 | ⭐⭐⭐ |
| **Kanban** | 看板任务管理 | ⭐⭐⭐⭐ |
| **Timeline** | 时间线视图 | ⭐⭐⭐ |

### AI 集成类

| 插件 | 功能 | 必要性 |
|------|------|--------|
| **Copilot** | AI 对话助手，支持多种 LLM | ⭐⭐⭐⭐ |
| **Smart Connections** | AI 语义搜索，发现相关笔记 | ⭐⭐⭐⭐ |
| **Text Generator** | AI 文本生成 | ⭐⭐⭐ |
| **ChatGPT MD** | ChatGPT 对话集成 | ⭐⭐⭐ |
| **Local REST API** | 本地 API，供外部程序集成 | ⭐⭐⭐⭐ |

### 同步与发布类

| 插件 | 功能 | 必要性 |
|------|------|--------|
| **Obsidian Git** | Git 自动同步 | ⭐⭐⭐⭐⭐ |
| **Remotely Save** | S3/WebDAV 同步 | ⭐⭐⭐⭐ |
| **Digital Garden** | 免费发布为网站 | ⭐⭐⭐⭐ |

### Dataview 插件详解

Dataview 是 Obsidian 最重要的社区插件，允许用类 SQL 语法查询笔记数据：

```markdown
<!-- 查询所有标签为 AI 的笔记，按创建日期排序 -->
```dataview
TABLE created, tags, difficulty
FROM #AI
SORT created DESC
```

<!-- 查询所有未完成的任务 -->
```dataview
TASK
WHERE !completed
SORT file.name ASC
```

<!-- 查询特定文件夹下的笔记 -->
```dataview
LIST
FROM "02-项目"
WHERE status = "进行中"
```

<!-- 按属性聚合统计 -->
```dataview
TABLE length(rows) AS 数量
FROM #AI
GROUP BY type
```
```

---

## 七、Obsidian 工作流

### 1. Zettelkasten（卡片盒笔记法）

```
┌──────────────────────────────────────────────────────────┐
│              Zettelkasten 工作流                           │
│                                                           │
│  1. 闪念笔记 (Fleeting Notes)                             │
│     → 临时想法, 快速记录                                   │
│     → 存放: 00-收件箱/                                     │
│                                                           │
│  2. 文献笔记 (Literature Notes)                            │
│     → 阅读/学习时摘录要点                                  │
│     → 存放: 01-文献/                                       │
│                                                           │
│  3. 永久笔记 (Permanent Notes)                             │
│     → 经过思考, 用自己语言重述                             │
│     → 一张卡片 = 一个想法                                  │
│     → 通过 [[双向链接]] 互联                               │
│     → 存放: 02-永久/                                       │
│                                                           │
│  4. 项目笔记 (Project Notes)                               │
│     → 特定项目的相关笔记                                   │
│     → 项目结束后可归档或整合                               │
│     → 存放: 03-项目/                                       │
│                                                           │
│  核心原则:                                                 │
│  • 原子性: 每张笔记只包含一个想法                          │
│  • 自足性: 每张笔记可独立理解                              │
│  • 关联性: 通过链接建立知识网络                            │
└──────────────────────────────────────────────────────────┘
```

### 2. MOC（Map of Content）工作流

MOC 是一种自上而下的知识组织方式，适合已有大量笔记后梳理结构：

```markdown
# AI 学习路线 (MOC)

## 基础理论
- [[Transformer 架构]]
- [[Self-Attention 算法]]
- [[位置编码 RoPE]]

## 模型架构
- [[MoE 架构]]
- [[LLaMA 架构]]
- [[DeepSeek 架构]]

## AI 智能体
- [[AutoGPT]]
- [[AgentGPT]]
- [[Claude Code]]
- [[AI Agent 开发框架]]

## 工具与平台
- [[Obsidian 知识管理]]
- [[Coze 工作流]]
```

### 3. PARA 工作流

```
Vault/
├── Projects/      ← 项目: 有明确目标和截止日期的工作
├── Areas/         ← 领域: 长期关注的责任区域
├── Resources/     ← 资源: 感兴趣的主题和参考材料
└── Archives/      ← 归档: 已完成或不活跃的内容
```

---

## 八、Obsidian 与 AI 结合

### AI 增强知识管理工作流

```
┌──────────────────────────────────────────────────────────┐
│           AI + Obsidian 工作流                             │
│                                                           │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐            │
│  │ Claude  │───▶│ 生成笔记  │───▶│ Obsidian │            │
│  │ ChatGPT │    │ 润色内容  │    │  Vault   │            │
│  │ DeepSeek│    │ 翻译文档  │    │          │            │
│  └─────────┘    └──────────┘    │  ┌─────┐ │            │
│                                 │  │链接  │ │            │
│  ┌─────────┐    ┌──────────┐    │  │图谱  │ │            │
│  │ Smart   │◀───│ 语义搜索  │◀───│  │查询  │ │            │
│  │Connect  │    │ 关联发现  │    │  └─────┘ │            │
│  └─────────┘    └──────────┘    └──────────┘            │
│                                                           │
│  Claude Code → 直接操作 Vault 中的 Markdown 文件          │
│  Smart Connections → AI 驱动的笔记关联推荐                 │
│  Copilot 插件 → 在 Obsidian 内直接与 AI 对话              │
└──────────────────────────────────────────────────────────┘
```

**使用 Claude Code 管理 Obsidian Vault**（当前仓库即可作为 Vault）：

```bash
# Claude Code 可以直接读写 Vault 中的 Markdown 文件
# 创建新笔记
写入文件: /Users/xiexingyong/ai_agent/新主题.md

# 查询现有笔记
搜索文件: Glob "**/*.md"

# 更新笔记内容
编辑文件: 在现有 .md 文件中添加内容或链接

# 使用 Git 版本控制 Vault
git add . && git commit -m "新增笔记"
```

---

## 九、主题与外观

### 推荐主题

| 主题 | 风格 | 特点 |
|------|------|------|
| **Minimal** | 极简 | 干净、高性能、高度可定制 |
| **Blue Topaz** | 华丽 | 功能丰富、多配色方案 |
| **Atom** | 经典 | 类似 Atom 编辑器风格 |
| **Dracula** | 暗色 | 经典 Dracula 配色 |
| **Things** | 清爽 | 类似 Things 3 风格 |
| **AnuPpuccin** | 多彩 | 多种风味配色 |

### 自定义 CSS

Obsidian 支持通过 CSS 代码片段自定义外观：

```css
/* 放入 .obsidian/snippets/custom.css */

/* 调整正文字体和大小 */
.markdown-source-view {
  font-family: "LXGW WenKai", sans-serif;
  font-size: 16px;
}

/* 调整标题颜色 */
h1 { color: #7c3aed; }
h2 { color: #2563eb; }
h3 { color: #0891b2; }

/* 调整链接样式 */
.internal-link {
  color: #8b5cf6;
  text-decoration: none;
  border-bottom: 1px dashed #8b5cf6;
}
```

---

## 十、Obsidian 付费服务

| 服务 | 价格 | 功能 |
|------|------|------|
| **个人使用** | 免费 | 所有核心功能，无限本地使用 |
| **Obsidian Sync** | $4/月（年付） | 端到端加密云同步，版本历史，10GB |
| **Obsidian Publish** | $8/月（年付） | 发布笔记为网站，自定义域名 |
| **商业使用** | $50/用户/年 | 商业场景下的使用许可 |

**免费替代方案**：
- 同步：Obsidian Git 插件 + GitHub/Gitea 私有仓库
- 发布：Digital Garden 插件 + Vercel/Netlify
- 同步：Remotely Save 插件 + S3/WebDAV

---

## 十一、常用快捷键

| 快捷键 (macOS) | 功能 |
|----------------|------|
| `Cmd + P` | 命令面板 |
| `Cmd + O` | 快速切换笔记 |
| `Cmd + Shift + F` | 全局搜索 |
| `Cmd + E` | 切换编辑/预览模式 |
| `Cmd + [` / `]` | 后退/前进导航 |
| `Cmd + N` | 新建笔记 |
| `Cmd + G` | 打开图谱 |
| `Cmd + K` | 插入链接 |
| `Cmd + Shift + K` | 插入反向链接 |
| `Option + Click` | 在新面板打开链接 |
| `Cmd + \` | 切换侧边栏 |
| `Cmd + T` | 打开今日日记 |

---

## 十二、将当前 AI Agent 仓库作为 Obsidian Vault

当前仓库 `/Users/xiexingyong/ai_agent` 已包含多个 Markdown 文档，可直接作为 Obsidian Vault 使用：

```
ai_agent/                    ← Obsidian Vault 根目录
├── README.md               ← AI 智能体完整介绍 (10章)
├── AI_Agent_Development_Framework.md  ← 开发框架
├── AutoGPT_Introduction.md          ← AutoGPT 架构
├── AgentGPT_Introduction.md         ← AgentGPT 架构
├── LLM_MoE_Architecture.md         ← MoE 架构
├── LLM_Transformer_Architecture.md  ← Transformer 架构
├── Self_Attention_Algorithm.md      ← 自注意力算法
├── Claude_Beta_Products.md          ← Claude Beta 产品
├── Claude_Design_Artifacts_Introduction.md ← Artifacts
├── OpenClaw_Architecture_Design.md  ← OpenClaw 架构
├── Hermes_Agent_Architecture_Design.md ← Hermes 架构
├── Anthropic_Harness_Engineering_AI_Agent.md ← Harness
├── Install_Claude_Code_on_Windows10.md  ← 安装指南
└── CLAUDE.md               ← Claude Code 项目指令
```

**启动方式**：
1. 打开 Obsidian
2. 选择 **"Open folder as vault"**
3. 选择 `/Users/xiexingyong/ai_agent`
4. 即可在 Obsidian 中浏览所有文档、查看双向链接和知识图谱

---

## 十三、参考资源

### 官方资源
- [Obsidian 官网](https://obsidian.md)
- [Obsidian 官方文档](https://help.obsidian.md)
- [Obsidian 开发者文档](https://docs.obsidian.md)
- [Obsidian 社区论坛](https://forum.obsidian.md)
- [Obsidian Discord](https://discord.gg/obsidianmd)

### 插件与主题
- [社区插件列表](https://obsidian.md/plugins)
- [社区主题列表](https://obsidian.md/themes)
- [Obsidian Releases (GitHub)](https://github.com/obsidianmd/obsidian-releases)

### 教程与方法论
- [Obsidian 中文教程 (PKMer)](https://pkmer.cn)
- [Zettelkasten 方法](https://zettelkasten.de)
- [PARA 方法](https://buildingasecondbrain.com)
- [Linking Your Thinking](https://www.linkingyourthinking.com)

### 关联文档
- [AI Agent 知识库总览](README.md)
- [大模型 Transformer 架构详解](LLM_Transformer_Architecture.md)
- [大模型 MoE 架构详解](LLM_MoE_Architecture.md)

---

*文档创建时间：2026年05月13日*
