---
title: GStack 插件详细说明
created: 2026-05-25
updated: 2026-05-25
tags: [AI, 工具, Claude Code, GStack, 工作流]
related: "[[Obsidian_Claude_Code_Workflow]], [[Claude]]"
---

# GStack 插件详细说明

> GStack 是 Y Combinator 总裁 Garry Tan 开源的个人 Claude Code 技能包，将 Claude Code 变为虚拟工程团队 —— CEO、设计师、工程经理、发布经理、文档工程师、QA 等 23 个专家角色，全部通过 slash 命令触发，MIT 开源协议。

---

## 一、背景与动机

### 创始人

**Garry Tan**，Y Combinator 总裁兼 CEO，拥有 20 年产品构建经验。曾参与 Palantir 早期工程/PM/设计工作，联合创建 Posterous（被 Twitter 收购），构建了 YC 内部社交网络 Bookface。

### 核心理念

Garry Tan 在 2026 年前 60 天内交付了 3 个生产服务、40+ 功能，同时全职运营 YC。他声称 2026 年的逻辑代码产出速率是 2013 年的 **810 倍**（11,417 vs 14 逻辑行/天），全年产出已达 2013 年全年的 **240 倍**。

> "我不觉得我从 12 月开始手写过一行代码 —— 这是极其巨大的变化。" —— Andrej Karpathy

### 解决的问题

大多数早期创业公司面临同一个瓶颈：工作太多，人手不够。工程、产品、研究、运营 —— 每个职能都需要关注，但 1-2 人的团队无法同时覆盖所有领域。GStack 通过结构化的 AI 工作流，让个人开发者能覆盖多个创业职能。

---

## 二、系统要求与安装

### 系统要求

| 依赖 | 说明 |
|------|------|
| **Claude Code** | 已安装并配置（需要 Anthropic API Key） |
| **Git** | 版本控制 |
| **Bun** | v1.0+ |
| **Node.js** | 仅 Windows 需要（Bun 在 Windows 上有 Playwright 兼容问题） |

### 快速安装（30 秒）

在 Claude Code 中粘贴以下命令：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack \
  && cd ~/.claude/skills/gstack && ./setup
```

安装脚本会自动：
1. 将技能文件符号链接到 `~/.claude/skills/` 目录
2. 在项目的 `CLAUDE.md` 中添加 gstack 配置段
3. 注册所有 slash 命令

### 团队模式安装（推荐共享仓库使用）

```bash
(cd ~/.claude/skills/gstack && ./setup --team) \
  && ~/.claude/skills/gstack/bin/gstack-team-init required \
  && git add .claude/ CLAUDE.md \
  && git commit -m "require gstack for AI-assisted work"
```

特点：
- 无需在仓库中 vendored 文件，无版本漂移
- 每次 Claude Code 会话自动更新检查（每小时一次，网络故障安全，静默运行）
- 可选 `required`（强制）或 `optional`（建议）模式

### 多 AI Agent 支持

GStack 支持 10+ 种 AI 编程 Agent，自动检测已安装的 Agent：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack && ./setup
```

或指定目标 Agent：

| Agent | 安装标志 | 技能安装路径 |
|-------|----------|-------------|
| Claude Code | （默认） | `~/.claude/skills/gstack-*/` |
| OpenAI Codex CLI | `--host codex` | `~/.codex/skills/gstack-*/` |
| Cursor | `--host cursor` | `~/.cursor/skills/gstack-*/` |
| OpenCode | `--host opencode` | `~/.config/opencode/skills/gstack-*/` |
| Factory Droid | `--host factory` | `~/.factory/skills/gstack-*/` |
| Slate | `--host slate` | `~/.slate/skills/gstack-*/` |
| Kiro | `--host kiro` | `~/.kiro/skills/gstack-*/` |
| Hermes | `--host hermes` | `~/.hermes/skills/gstack-*/` |
| GBrain (mod) | `--host gbrain` | `~/.gbrain/skills/gstack-*/` |

### OpenClaw 集成

OpenClaw 通过 ACP 生成 Claude Code 会话，gstack 技能自动可用。将以下内容添加到 OpenClaw 的 `AGENTS.md`：

```markdown
## Coding Tasks
When spawning Claude Code sessions for coding work, tell the session to use gstack skills.
Examples:
- Security audit: "Load gstack. Run /cso"
- Code review: "Load gstack. Run /review"
- QA: "Load gstack. Run /qa https://..."
- Feature: "Load gstack. Run /autoplan, implement, then /ship"
```

### 卸载

```bash
~/.claude/skills/gstack/bin/gstack-uninstall
```

选项：`--keep-state`（保留配置和分析数据）、`--force`（跳过确认）

---

## 三、核心工作流：Sprint 模型

GStack 的核心是一个完整的 **Sprint 工作流**，每个技能按顺序衔接，模拟真实团队的协作流程：

```
思考 → 规划 → 构建 → 审查 → 测试 → 发布 → 反思
Think → Plan → Build → Review → Test → Ship → Reflect
```

每个技能的输出自动成为下一个技能的输入：
- `/office-hours` 生成的产品文档被 `/plan-ceo-review` 读取
- `/plan-eng-review` 生成的测试计划被 `/qa` 采用
- `/review` 发现的 bug 在 `/ship` 中验证已修复

### 端到端示例

```
You:    I want to build a daily briefing app for my calendar.
You:    /office-hours
Claude: [追问痛点 — 要具体案例，不要假设]
You:    Multiple Google calendars, events with stale info, wrong locations...
Claude: 我要挑战你的描述。你说了"daily briefing app"，
        但你描述的是个人 AI 首席参谋。
        [提取 5 个你没意识到的能力]
        [挑战 4 个前提假设]
        [生成 3 种实现方案 + 工作量估算]
        建议：明天先发最窄的切入版本，从真实使用中学习。

You:    /plan-ceo-review       → [读取设计文档，挑战范围]
You:    /plan-eng-review       → [ASCII 架构图、状态机、测试矩阵]
You:    批准计划 → [写入 2,400 行 / 11 个文件，约 8 分钟]
You:    /review                → [自动修复 2 个问题，标记竞态条件]
You:    /qa https://staging... → [打开浏览器测试，发现并修复 bug]
You:    /ship                  → [测试 42→51，PR 已创建]
```

---

## 四、技能详细说明（23 + 扩展）

### 4.1 思考阶段（Think）

#### `/office-hours` — YC Office Hours

**角色：** YC 合伙人

**功能：** 入口技能。6 个强制性问题，在写代码之前重新定义你的产品。

**工作方式：**
- 追问具体痛点，拒绝假设性描述
- 挑战你的前提假设
- 生成实现替代方案 + 工作量估算
- 输出设计文档，自动传递给下游技能

#### `/plan-ceo-review` — CEO / 创始人

**角色：** CEO / 创始人

**功能：** 重新思考问题，找到隐藏在需求中的 10 星产品。

**四种模式：**
| 模式 | 说明 |
|------|------|
| **Expansion** | 扩展范围，寻找更大的产品愿景 |
| **Selective Expansion** | 选择性扩展 |
| **Hold Scope** | 保持当前范围 |
| **Reduction** | 缩小范围，聚焦核心 |

**审查维度：** 10 个板块的战略性审查

### 4.2 规划阶段（Plan）

#### `/plan-eng-review` — 工程经理

**角色：** 工程经理

**功能：** 锁定架构、数据流、边界情况、测试计划。

**输出：**
- ASCII 架构图（数据流、状态机、错误路径）
- 测试矩阵
- 故障模式分析
- 安全隐患清单

#### `/plan-design-review` — 高级设计师

**角色：** 高级设计师

**功能：** 对设计各维度评分（0-10），解释 10 分的标准，然后编辑计划以达到目标。

**特性：**
- AI Slop（AI 生成的低质量内容）检测
- 每个设计决策一次 AskUserQuestion 交互
- 具体的改进建议

#### `/plan-devex-review` — 开发者体验负责人

**角色：** DX Lead

**功能：** 交互式 DX 审查。

**三种模式：** DX 扩展 / DX 打磨 / DX 分诊

**审查内容：**
- 开发者画像研究
- 与竞品 TTHW（Time To Hello World）对比
- 设计你的"魔法时刻"
- 逐步追踪摩擦点
- 20-45 个强制性问题

#### `/autoplan` — 自动审查管线

**功能：** 一条命令，完全审查的计划。自动运行 CEO → 设计 → 工程审查，内置决策原则，仅将品味决策提交给你审批。

### 4.3 构建阶段（Build）

#### `/design-consultation` — 设计合作伙伴

**角色：** 设计合作伙伴

**功能：** 从零构建完整设计系统。
- 研究竞品格局
- 提出创意性风险
- 生成逼真的产品模型

#### `/design-shotgun` — 设计探索器

**角色：** 设计探索器

**功能：** "给我看看选项。"

**工作流程：**
1. 你描述想要什么
2. 使用 GPT Image 生成 4-6 个 AI 模型变体
3. 在浏览器中打开对比看板
4. 你选择喜欢的，留下反馈（"更多留白"、"更大标题"）
5. 生成新一轮迭代
6. **品味记忆**：经过几轮后，系统自动倾向你实际喜欢的风格

#### `/design-html` — 设计工程师

**角色：** 设计工程师

**功能：** 将模型转化为真正可用的生产级 HTML/CSS。

**技术特性：**
- **Pretext 预计算布局**：文本真实重排，高度自适应，布局动态
- 30KB 开销，零依赖
- 自动检测框架（React / Svelte / Vue）并输出正确格式
- 智能路由：根据设计类型（落地页 vs 仪表板 vs 表单）选择不同模式
- 输出是可发布的，不是演示

### 4.4 审查阶段（Review）

#### `/review` — Staff 工程师

**角色：** Staff 工程师

**功能：** 找出通过 CI 但在生产环境爆炸的 bug。

**特性：**
- 自动修复明显的问题
- 标记完整性缺口
- 代码质量与安全性并重

#### `/design-review` — 懂代码的设计师

**角色：** 懂代码的设计师

**功能：** 执行与 `/plan-design-review` 相同的审计，然后直接修复发现的问题。原子提交，前后截图对比。

#### `/devex-review` — DX 测试员

**角色：** DX 测试员

**功能：** 实时开发者体验审计。
- 实际测试你的 onboarding 流程
- 浏览文档、尝试入门流程
- 计时 TTHW、截取错误截图
- 与 `/plan-devex-review` 评分对比（计划 vs 现实的回旋镖）

#### `/codex` — 第二意见

**角色：** OpenAI Codex CLI

**功能：** 来自不同 AI 的独立代码审查。

**三种模式：**
| 模式 | 说明 |
|------|------|
| **review** | 通过/失败门控 |
| **adversarial** | 主动尝试破坏你的代码 |
| **open** | 开放咨询，保持会话连续性 |

当 `/review`（Claude）和 `/codex`（OpenAI）都审查同一分支时，生成跨模型分析。

### 4.5 测试阶段（Test）

#### `/qa` — QA 负责人

**角色：** QA 负责人

**功能：** 测试你的应用，找 bug，修 bug，生成回归测试，重新验证。

**特性：**
- 打开真实浏览器，点击流程，截图
- 每个 bug 修复自动生成回归测试
- 原子提交

#### `/qa-only` — QA 报告员

**功能：** 与 `/qa` 相同的方法论，但仅生成报告，不修改代码。

#### `/browse` — QA 工程师

**功能：** 给 Agent 一双眼睛。

**特性：**
- 真实 Chromium 浏览器，真实点击，真实截图
- ~100ms/命令的响应速度
- `/open-gstack-browser` 启动带侧边栏的 GStack Browser

#### `/cso` — 首席安全官

**角色：** 首席安全官

**功能：** OWASP Top 10 + STRIDE 威胁建模。

**特性：**
- 零噪音：17 个误报排除规则
- 8/10+ 置信度门槛
- 独立发现验证
- 每个发现附带具体利用场景

#### `/investigate` — 调试器

**角色：** 调试专家

**功能：** 系统化根因调试。

**铁律：** 没有调查就没有修复。
- 追踪数据流
- 测试假设
- 连续 3 次修复失败后停止

### 4.6 发布阶段（Ship）

#### `/ship` — 发布工程师

**角色：** 发布工程师

**功能：** 同步 main、运行测试、审计覆盖率、推送、创建 PR。

**特性：**
- 如果没有测试框架，自动引导创建
- 每次运行生成覆盖率审计
- 自动调用 `/document-release` 更新文档

#### `/land-and-deploy` — 发布工程师

**功能：** 合并 PR → 等待 CI → 部署 → 验证生产健康。一条命令从"已批准"到"生产已验证"。

#### `/canary` — SRE

**角色：** SRE

**功能：** 部署后监控循环。监控控制台错误、性能回归和页面故障。

#### `/benchmark` — 性能工程师

**角色：** 性能工程师

**功能：** 基准测试页面加载时间、Core Web Vitals 和资源大小。每次 PR 前后对比。

### 4.7 文档阶段（Document）

#### `/document-release` — 技术文档工程师

**功能：** 自动更新所有项目文档以匹配刚发布的内容。
- 交叉引用 diff，更新所有漂移的文档
- README、ARCHITECTURE、CONTRIBUTING、CLAUDE.md、TODOS
- 构建 Diataxis 覆盖图（参考/操作指南/教程/解释）使缺口可见

#### `/document-generate` — 文档作者

**功能：** 使用 Diataxis 框架从零生成缺失的文档。先研究代码库，再编写匹配实际代码的文档。

### 4.8 反思阶段（Reflect）

#### `/retro` — 工程经理

**角色：** 工程经理

**功能：** 团队感知的每周回顾。
- 每人分解、发布连续性、测试健康趋势、成长机会
- `/retro global` 跨所有项目和 AI 工具运行

#### `/learn` — 记忆管理

**功能：** 管理 gstack 跨会话的学习成果。审查、搜索、修剪和导出项目特定的模式、陷阱和偏好。学习成果跨会话累积。

---

## 五、审查路由指南

根据你的目标用户选择正确的审查技能：

| 构建目标... | 规划阶段（写代码前） | 实时审计（发布后） |
|-------------|---------------------|-------------------|
| **终端用户**（UI、Web、移动端） | `/plan-design-review` | `/design-review` |
| **开发者**（API、CLI、SDK、文档） | `/plan-devex-review` | `/devex-review` |
| **架构**（数据流、性能、测试） | `/plan-eng-review` | `/review` |
| **以上全部** | `/autoplan` | — |

---

## 六、安全与防护工具

### `/careful` — 安全护栏

说"be careful"激活，在破坏性命令前警告（`rm -rf`、`DROP TABLE`、`force-push`）。可覆盖任何警告。

### `/freeze` — 编辑锁定

将文件编辑限制到一个目录，防止调试时意外修改范围外的代码。

### `/guard` — 全面安全

`/careful` + `/freeze` 合一。生产环境工作的最高安全级别。

### `/unfreeze` — 解除锁定

### `/investigate` 自动冻结

调试时自动冻结到被调查的模块。

---

## 七、浏览器与自动化

### GStack Browser

`/open-gstack-browser` 启动专属浏览器：

- AI 控制的 Chromium，反机器人隐身
- 自定义品牌（菜单栏显示 "GStack Browser"）
- 侧边栏 Agent（Chrome 侧面板中的 AI 助手）
  - 自然语言输入："导航到设置页面并截图"
  - 自动路由：Sonnet 处理快速操作，Opus 处理分析
  - 一键 Cookie 导入
- 常规 Chrome 完全不受影响
- 所有现有 browse 命令保持不变

### 浏览器交接

遇到 CAPTCHA、认证墙或 MFA 时：
- `$B handoff` 在同一页面打开可见 Chrome
- 解决问题后 `$B resume` 继续

### `/pair-agent` — 多 Agent 协调

让多个 AI Agent 共享浏览器：
- 每个代理获得独立标签页
- 自动启动 ngrok 隧道（支持远程代理）
- 作用域令牌、标签隔离、速率限制、活动归因

### Cookie 管理

`/setup-browser-cookies` 从真实浏览器（Chrome、Arc、Brave、Edge）导入 Cookie 到无头会话。

### Prompt 注入防御

多层防御体系：
1. 22MB ML 分类器（本地扫描每个页面）
2. Claude Haiku 转录检查
3. 随机金丝雀令牌
4. 判定合并器（需要两个分类器同意才阻止）
5. 可选 721MB DeBERTa-v3 集成

### 域技能与 CDP 逃生舱

- `$B domain-skill save` — 保存每站点笔记，下次访问自动触发
- `$B cdp <Domain.method>` — 原始 Chrome DevTools Protocol 逃生舱

---

## 八、GBrain 持久知识库

GBrain 是 AI Agent 的持久知识库 —— Agent 在会话之间真正保留的记忆。

### 四种初始化路径

| 路径 | 说明 | 耗时 |
|------|------|------|
| **PGLite 本地** | 零账户，零网络，完全隔离 | ~30 秒 |
| **Supabase 自动配置** | 粘贴 Personal Access Token，自动创建项目 | ~90 秒 |
| **Supabase 已有 URL** | 直接粘贴 Session Pooler URL | 即时 |
| **远程 MCP** | 通过 Tailscale/ngrok 连接远程 gbrain | 取决于网络 |

### 每仓库信任策略

| 策略 | 权限 |
|------|------|
| `read-write` | 可搜索 + 写回新页面 |
| `read-only` | 仅搜索（适合多客户顾问） |
| `deny` | 完全禁止 |

### 保持知识最新

```bash
/sync-gbrain              # 增量同步
/sync-gbrain --full       # 全量重新索引
/sync-gbrain --dry-run    # 预览模式
```

---

## 九、独立 CLI 工具

| 命令 | 功能 |
|------|------|
| `gstack-model-benchmark` | 跨模型基准测试（Claude / GPT / Gemini），比较延迟、Token、成本 |
| `gstack-taste-update` | 设计品味学习，将审批/拒绝写入持久品味档案，每周衰减 5% |
| `gstack-ios-qa-daemon` | iOS QA 守护进程，Mac 与 iPhone USB CoreDevice 之间的代理 |
| `gstack-ios-qa-mint` | iOS 白名单管理器 |

### iOS QA 能力（v1.43.0.0+）

通过 USB CoreDevice 驱动真实 iPhone：
- 读取 Swift 源码，生成类型化 `@Observable` 访问器
- `--tailnet` 选项暴露设备到 Tailscale 网络
- 能力层级白名单（observe / interact / mutate / restore）
- 完整 iOS 子技能：`/ios-qa`、`/ios-fix`、`/ios-design-review`、`/ios-clean`、`/ios-sync`

---

## 十、高级特性

### 并行 Sprint

GStack 支持同时运行 10-15 个并行 Sprint，每个在独立工作空间中：
- 一个运行 `/office-hours` 探索新想法
- 另一个做 `/review`
- 第三个实现功能
- 第四个在 staging 运行 `/qa`
- 更多在其他分支上工作

Sprint 结构使并行性成为可能：没有流程，10 个 Agent 就是 10 个混乱源；有流程，每个 Agent 知道做什么以及何时停止。

### 持续检查点模式（可选）

```bash
gstack-config set checkpoint_mode continuous
```

技能自动提交你的工作，带 `WIP:` 前缀 + 结构化 `[gstack-context]` 正文（决策、剩余工作、失败方法）。`/ship` 在 PR 之前过滤压缩 WIP 提交。

### 语音输入

gstack 技能有语音友好的触发短语：
- "run a security check" → `/cso`
- "test the website" → `/qa`
- "do an engineering review" → `/plan-eng-review`

### 主动技能建议

gstack 检测你当前阶段（头脑风暴、审查、调试、测试）并建议合适的技能。可说"stop suggesting"关闭。

---

## 十一、与 Karpathy 四种失败模式的对应

Andrej Karpathy 的 AI 编程规则（17K Stars）指出四种失败模式：

| Karpathy 失败模式 | GStack 对应 |
|------------------|-------------|
| **错误假设** | `/office-hours` 在写代码前强制暴露假设 |
| **过度复杂** | `/review` 捕捉不必要的复杂性 |
| **正交编辑** | `/review` 捕捉 drive-by 编辑 |
| **命令式而非声明式** | `/ship` 将任务转化为可验证目标，测试优先执行 |

GStack 的工作流技能在整个 Sprint 中执行所有四条规则，而不仅仅是在单个提示中。

---

## 十二、隐私与遥测

- **默认关闭**，除非明确选择加入
- 首次运行时询问是否共享匿名使用数据
- **收集内容（如选择加入）：** 技能名、持续时间、成功/失败、版本、操作系统
- **从不收集：** 代码、文件路径、仓库名、分支名、提示、任何用户生成内容
- 随时更改：`gstack-config set telemetry off`
- 本地分析始终可用：`gstack-analytics`

---

## 十三、适用人群与场景

### 最适合

- **技术型创始人和 CEO** —— 仍想亲自写代码的人
- **Claude Code 新用户** —— 需要结构化角色而非空白提示
- **Tech Lead 和 Staff 工程师** —— 每个都需要严格审查、QA 和发布自动化
- **独立开发者** —— 需要覆盖产品、工程、研究多职能

### 不太适合

- 需要可视化/无代码界面的人 —— GStack 完全基于终端和 Markdown
- 有明确角色分工的大团队 —— 多角色设置变得冗余
- 期望零配置开箱即用的人 —— 设置需要实际的前期投入

---

## 十四、配置与故障排除

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 技能不显示 | `cd ~/.claude/skills/gstack && ./setup` |
| `/browse` 失败 | `cd ~/.claude/skills/gstack && bun install && bun run build` |
| 安装过时 | 运行 `/gstack-upgrade` 或设置 `auto_upgrade: true` |
| 想要更短命令 | `./setup --no-prefix`（`/gstack-qa` → `/qa`） |
| 想要命名空间命令 | `./setup --prefix`（`/qa` → `/gstack-qa`） |
| Codex 加载技能失败 | `cd ~/.codex/skills/gstack && git pull && ./setup --host codex` |
| Claude 看不到技能 | 确保 CLAUDE.md 有 gstack 段 |

### 命令前缀选项

```bash
./setup --no-prefix   # /qa（默认，更简洁）
./setup --prefix      # /gstack-qa（适合与其他技能包共存）
```

选择会被记住，未来升级时保持。

---

## 十五、文档资源

| 文档 | 内容 |
|------|------|
| [Skill Deep Dives](https://github.com/garrytan/gstack/blob/main/docs/skills.md) | 每个技能的哲学、示例和工作流 |
| [Builder Ethos](https://github.com/garrytan/gstack/blob/main/docs/builder-ethos.md) | 构建者哲学：Boil the Lake、Search Before Building |
| [Architecture](https://github.com/garrytan/gstack/blob/main/ARCHITECTURE.md) | 设计决策和系统内部 |
| [Browser Reference](https://github.com/garrytan/gstack/blob/main/docs/browser-reference.md) | `/browse` 完整命令参考 |
| [Contributing](https://github.com/garrytan/gstack/blob/main/CONTRIBUTING.md) | 开发设置、测试、贡献模式 |
| [Changelog](https://github.com/garrytan/gstack/blob/main/CHANGELOG.md) | 每个版本的更新内容 |

---

## 十六、总结

GStack 不是一个产品，而是一套**配置框架**。它通过结构化的 CLAUDE.md 文件和工作流模式，让 Claude Code 像一支专业团队一样运作。

**关键要点：**

1. **流程驱动，非工具堆叠** —— 23 个技能形成完整的 Sprint 工作流，不是零散的提示技巧
2. **角色感知** —— CEO 不需要看基础架构 bug，设计审查不需要看后端变更，智能路由自动处理
3. **测试一切** —— `/ship` 自动引导测试框架，每个 bug 修复生成回归测试
4. **持久学习** —— `/learn` 和 GBrain 让 Agent 跨会话积累知识
5. **多 Agent 协同** —— `/pair-agent` 让不同厂商的 AI Agent 共享浏览器协作
6. **安全第一** —— `/guard`、`/freeze`、prompt 注入防御、OWASP + STRIDE 审计
7. **完全免费** —— MIT 协议，无付费层级，无等待列表

> 许可证：MIT。永久免费。去构建一些东西吧。

---

**仓库地址：** [github.com/garrytan/gstack](https://github.com/garrytan/gstack)
