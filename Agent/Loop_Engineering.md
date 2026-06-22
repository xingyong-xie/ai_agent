---
title: Loop Engineering — 智能体循环工程深度分析
created: 2026-06-22
updated: 2026-06-22
tags: [AI, 智能体, 架构, Loop, 工程框架, 设计模式]
related: "[[AI_Agent_Deep_Dive]], [[Claude_Beta_Products]], [[Hermes_Agent_Architecture_Design]], [[AgentGPT_Introduction]], [[AutoGPT_Introduction]], [[AIGC_Agent_Introduction]], [[Anthropic_Harness_Engineering_AI_Agent]], [[Superpowers_Skill_Introduction]], [[Obsidian_Claude_Code_Workflow]], [[AI_Agent_Development_Framework]]"
---

# Loop Engineering — 智能体循环工程深度分析

> **Loop Engineering** 是对智能体系统中"感知-决策-行动-反馈"循环的设计、分类与优化方法论。它不是单一技术，而是一组循环模式的工程化组合，决定了智能体如何分解任务、执行操作、观察结果、调整策略，以及从经验中持续进化。

---

## 一、概述

### 1.1 什么是 Loop Engineering

在 AI 智能体语境下，**Loop（循环）** 是智能体的核心运行时机制。一个智能体本质上就是一个**持续运行的循环**：

```
感知环境 → 推理决策 → 执行行动 → 观察反馈 → 调整策略 → 重复
```

Loop Engineering 研究的是：如何设计这个循环的结构、粒度、终止条件和学习机制，以在**正确性、效率、成本、安全性**之间取得平衡。

### 1.2 Loop 与 Harness 的关系

在 [[Anthropic_Harness_Engineering_AI_Agent]] 框架下，Loop 嵌入在 Harness 的各个组件中：

```
Harness Engineering
├── Planning（规划）    → 任务分解，形成循环起点
├── Memory（记忆）      → 跨循环上下文保持
├── Tool Calling（工具） → 循环中的"行动"环节
├── Evaluation（评估）  → 循环终止判定 + 质量检查
├── Safety（安全）      → 循环边界约束
└── Monitoring（监控）  → 循环轨迹追踪
```

**简言之：Harness 是循环的"运行环境"，Loop 是 Harness 的"运行时引擎"。**

---

## 二、五种核心循环模式

通过对当前主流智能体系统的交叉分析，我提炼出 **五种递进式的循环模式**，按复杂度和学习深度从低到高排列。

### 2.1 R1 — ReAct 循环（基础推理-行动层）

> **定义**：LLM 交替进行推理（Reasoning）和行动（Acting），每次行动后观察结果并进入下一轮推理。

**执行流程**：

```
思考 → 行动 → 观察 → 思考 → 行动 → 观察 → …… → 任务完成
```

| 维度 | 特征 |
|------|------|
| **核心驱动** | LLM 的即时推理能力 |
| **循环粒度** | 单步行动级别 |
| **记忆持久性** | 仅 Context Window 内 |
| **跨会话学习** | ❌ 无 |
| **终止条件** | 隐式（LLM 判断任务完成） |
| **典型实现** | Claude Code、Claude Agent SDK、OpenAI Function Calling |
| **适用场景** | 编码调试、信息检索、多步推理、问答 |

**ReAct 循环伪代码**：

```python
def react_loop(goal: str):
    context = [{"role": "user", "content": goal}]
    while not task_complete(context):
        thought = llm_reason(context)           # 思考
        action = select_tool(thought)            # 选择工具
        observation = action.execute()           # 执行并观察
        context.append({"role": "assistant", "content": observation})
    return extract_result(context)
```

**工程要点**：
- 每一步的输出质量决定下一步的决策质量
- 工具返回信息的结构化程度至关重要
- 无任务边界意识，需要外层控制

**来源**：[[AI_Agent_Deep_Dive]]

---

### 2.2 R2 — Agent Loop（产品级执行框架层）

> **定义**：在 ReAct 基础上，由产品框架封装的标准化循环，包含用户意图理解、工具协调、安全控制和完成判定。

**执行流程**：

```
用户指令 → Claude 理解 → 工具选择 → 执行操作 → 观察结果 → 调整策略 → 完成任务
```

| 维度 | 特征 |
|------|------|
| **核心驱动** | 用户输入的指令目标 |
| **循环粒度** | 项目/任务级别 |
| **安全控制** | 权限白名单、审批机制 |
| **跨会话学习** | ❌ 无 |
| **终止条件** | 明确的"完成"判定 |
| **典型实现** | Claude Code、Claude Cowork、Claude in Chrome |
| **适用场景** | CLI 编程、桌面自动化、浏览器操作 |

**与 ReAct 的关键区别**：

| 维度 | ReAct 循环 | Agent Loop |
|------|-----------|------------|
| 驱动源 | LLM 自主推理 | 用户指令显式触发 |
| 任务边界 | 隐式 | 显式的开始和完成 |
| 安全性 | 无内置控制 | 集成的权限和安全 Harness |
| 工具协调 | 单一工具调用 | 多工具编排 |
| 错误处理 | LLM 自愈 | 框架级重试和回退 |

**来源**：[[Claude_Beta_Products]]

---

### 2.3 R3 — 评价-反馈-重做循环（质量迭代层）

> **定义**：智能体以质量阈值为驱动，对单次产出进行多轮自检和精修的迭代循环。

**执行流程**：

```
生成 ──→ 检查 ──→ 反馈 ──→ 修改 ──→ 循环……
                   │ 合格
                   └──→ 交付
```

| 维度 | 特征 |
|------|------|
| **核心驱动** | 质量评分阈值 |
| **循环粒度** | 单个产物的多轮精修 |
| **自检机制** | LLM 自评 / 工具执行反馈 |
| **跨会话学习** | ❌ 无（同一会话内迭代） |
| **终止条件** | quality ≥ THRESHOLD 或 max_rounds |
| **典型实现** | Claude Code（生成→测试→修复）、AIGC Agent |
| **适用场景** | 代码生成、内容创作、设计稿迭代、翻译润色 |

**伪代码实现**：

```python
def iterative_refine(step, initial_result, max_rounds=3):
    result = initial_result
    for round in range(max_rounds):
        quality = quality_check(result)
        if quality >= THRESHOLD:
            break
        feedback = analyze_failure(result, step)
        result = regenerate(step, feedback)
    return result
```

**关键工程设计参数**：

| 参数 | 影响 |
|------|------|
| **THRESHOLD** | 阈值太低 → 产出粗劣；太高 → Token 浪费 |
| **max_rounds** | 太少 → 质量不达标；太多 → 无限循环 |
| **反馈源** | LLM 自检 vs 测试工具 vs 人类反馈 |
| **自检 Prompt** | 决定反馈质量，进而决定迭代效果 |

**进阶：评价-反馈-重做循环的多模态版本**

在 AIGC Agent（[[AIGC_Agent_Introduction]]）中，该循环扩展为多步骤流水线：

```python
class AIGCAgent:
    def run(self, user_goal):
        plan = self.planner.decompose(user_goal)
        # plan = ["调研", "大纲", "正文", "配图", "合成", "质检"]

        results = []
        for step in plan:
            action = self.select_tool(step)
            result = action.execute(step.params, context=results)
            results.append(result)

            if self.quality_check(result) < THRESHOLD:
                result = self.iterative_refine(result, step, n_rounds=3)
                results[-1] = result

        return self.assemble(user_goal, results)
```

**来源**：[[AIGC_Agent_Introduction]]

---

### 2.4 R4 — 思考-分析-执行-学习循环（任务管理层）

> **定义**：智能体以"子任务"为粒度，动态分解目标、选择工具、执行操作、评估进展并生成新子任务的完整任务管理循环。

**执行流程**（以 [[AgentGPT_Introduction]] 为例）：

```
① start_goal_agent：用户输入目标 → LLM 生成初始任务列表（最多 5 个子任务）
② analyze_task_agent：对每个子任务 → 分析应使用的工具
③ execute_task_agent：调用选定工具执行
④ create_tasks_agent：根据执行结果 → 评估是否需要新任务
    ├── 目标未完成 → 生成新的子任务 → 回到 ②
    └── 目标已完成 → 调用 conclude 工具 → 结束
```

| 维度 | 特征 |
|------|------|
| **核心驱动** | 任务队列 + 目标达成判定 |
| **循环粒度** | 子任务级别 |
| **动态扩展** | 执行结果可触发新子任务生成 |
| **跨会话学习** | ❌ 无（会话内） |
| **终止条件** | 任务完成 或 硬上限（默认 MAX_LOOP=100） |
| **典型实现** | AgentGPT、AutoGPT |
| **适用场景** | 开放目标、端到端自动化、复杂项目 |

**AutoGPT 版本的运行循环**（[[AutoGPT_Introduction]]）：

```
接收目标 → 自主规划 → 工具执行 → 结果评估 → 记忆存储 → 循环迭代
```

| 与 AgentGPT 的区别 | 说明 |
|-------------------|------|
| 更强的记忆系统 | 支持向量存储长时记忆 |
| Agent Protocol | 通过标准协议与 UI/Forge/Benchmark 通信 |
| 完整工具链 | 包含 Forge 构建工具和 Benchmark 评估框架 |

**这个层级的关键工程问题**：

1. **任务分解粒度**：拆得太细 → 循环次数多、Token 消耗大；拆得太粗 → 单步执行困难
2. **动态任务生成**：子任务可能发散或无限递归，必须设计收敛机制
3. **循环上限**：AgentGPT 默认 MAX_LOOP=100；AutoGPT 有类似超时机制
4. **记忆管理**：中间结果存储方式决定循环效率

**来源**：[[AgentGPT_Introduction]]、[[AutoGPT_Introduction]]

---

### 2.5 R5 — 闭环学习循环（系统进化层）

> **定义**：智能体在执行任务的同时进行反思，将成功/失败经验持久化到知识库，实现跨会话的持续进化。这是目前最具创新性的循环模式。

**执行流程**（以 [[Hermes_Agent_Architecture_Design]] 为例）：

```
用户任务 → Generator → 执行任务 → Reflector → Curator → Playbook → 循环继续
              ↑_______________________________________________|
```

| 角色 | 功能 | 说明 |
|------|------|------|
| **Generator** | 策略生成 | 基于 Playbook 中的学习模式生成执行策略 |
| **Reflector** | 结果反思 | 分析执行结果，识别成功/失败原因 |
| **Curator** | 策略管理 | 更新 Playbook，添加新策略或改进现有策略 |
| **Playbook** | 知识存储 | 持久化学习成果的动态策略知识库 |

**Playbook 存储内容**：

| 存储内容 | 说明 |
|----------|------|
| **成功模式** | 哪些策略在什么场景下成功 |
| **失败教训** | 哪些做法导致了问题 |
| **工具用法** | 最佳的工具使用方式 |
| **边缘情况** | 特殊场景的处理方法 |

**量化收益**（来自 Hermes Agent 架构设计文档）：

| 指标 | 提升 |
|------|------|
| 复杂任务性能 | 提升 **20-35%** |
| Token 使用 | 减少 **49%** |
| 技能积累 | 随使用时间持续增长 |

**与 R4 任务管理循环的本质区别**：

```
R4 思考-分析-执行-学习：
   执行 → 结果评估 → 新任务生成（仅同一会话内改善）

R5 闭环学习循环：
   执行 → 反思 → Curator → Playbook 持久化 → 下次任务更好（跨会话进化）
```

**核心创新**：
- 无需传统微调或训练数据
- 纯上下文学习，完全透明
- Playbook 跨会话持久化
- 随使用时间持续累积策略知识

**来源**：[[Hermes_Agent_Architecture_Design]]

---

## 三、五种循环的完整对比

| 维度 | R1 ReAct | R2 Agent Loop | R3 评价-反馈-重做 | R4 任务管理 | R5 闭环学习 |
|------|----------|--------------|-----------------|------------|------------|
| **复杂度** | ☆☆☆☆☆ | ★☆☆☆☆ | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |
| **学习深度** | 无 | 无 | 会话内迭代 | 会话内任务级 | **跨会话进化** |
| **循环粒度** | 单步行动 | 产品任务 | 单产物精修 | 子任务 | 策略级 |
| **驱动源** | LLM 推理 | 用户指令 | 质量阈值 | 任务队列 | 策略 + Playbook |
| **Termination** | 隐式 | 完成判定 | 阈值/轮次 | 任务完成/上限 | 持续（永不终止的学习） |
| **记忆持久性** | Context | Context | Context | Context + 临时 | **跨会话持久化** |
| **Token 效率** | 中等 | 中等 | 低（多轮迭代） | 高（一次规划） | **49% 减少** |
| **典型实现** | Claude SDK | Claude Code | Claude Code 测试 | AgentGPT | Hermes Agent |

---

## 四、扩展循环模式

除了上述五种核心模式，你的知识库中还识别出以下**领域特定的循环模式**：

### 4.1 TDD 循环（软件工程领域）

> 来源：[[Superpowers_Skill_Introduction]]

```
RED:    写一个失败的测试 → 看它失败
  ↓
GREEN:  写最少的代码让测试通过 → 看它通过
  ↓
REFACTOR: 重构代码（测试仍通过）
  ↓
COMMIT: 提交
  ↓
下一个测试（循环）
```

这是 R3（评价-反馈-重做）在软件开发领域的特化版本。关键区别在于：
- 反馈源是**真实的测试运行**，而非 LLM 自检
- 有明确的验证机制（测试通过/失败）
- 形成完整的开发工作流闭环

### 4.2 知识管理闭环（文档工程领域）

> 来源：[[Obsidian_Claude_Code_Workflow]]

```
用户需求 → Claude Code 生成/修改 → Markdown 文件 → Obsidian 可视化审阅
    ↑                                                      │
    └────────────────── 新需求/修改反馈 ──────────────────────┘
```

这是 R2（Agent Loop）在知识管理场景的具体实现。循环中的关键环节是**人工审阅**（Human-in-the-Loop），利用 Obsidian 的知识图谱、Backlinks、Canvas 等工具进行质量把控。

### 4.3 自改进循环（上下文工具领域）

> 来源：[[Agent_Context]]

```
文档检索 → 本地注释 → 反馈提交 → 知识积累 → 更精准的检索
```

这是 R5 闭环学习的轻量版本，使用 Context Hub 实现，通过持续积累知识和经验来改善工具使用效果。效果指标：减少 LLM 幻觉，提高准确性。

---

## 五、Loop Engineering 的 7 个关键设计维度

通过交叉分析所有循环模式，我提炼出以下工程设计决策框架：

### 5.1 循环粒度

| 粒度级别 | 描述 | Token 消耗 | 灵活性 |
|---------|------|-----------|--------|
| **单步**（R1） | 每次循环 = 一次思考+行动 | 高 | 最高 |
| **子任务**（R4） | 每次循环 = 一个完整子任务 | 中 | 中 |
| **整任务**（R2/R3） | 一次循环完成完整产出 | 低 | 低 |

**设计原则**：粒度越细越灵活，但 Token 消耗越大。选择依据是**任务的可预测性**：高确定性任务用粗粒度，低确定性任务用细粒度。

### 5.2 终止条件

| 终止策略 | 说明 | 适用 |
|---------|------|------|
| **目标达成** | 检查是否完成任务目标 | R1/R2 |
| **质量阈值** | 产出质量 ≥ THRESHOLD | R3 |
| **硬上限** | MAX_LOOP / 超时 | R4（防止无限循环） |
| **持续运行** | 永不终止的学习循环 | R5 |

**设计原则**：每个循环必须有至少一个终止条件，硬上限作为兜底安全网。

### 5.3 记忆持久性

| 持久层级 | 生命周期 | 实现方式 | 复杂度 |
|---------|---------|---------|-------|
| **Context** | 单次推理 | LLM 上下文窗口 | 无 |
| **会话** | 单次对话 | 消息列表 + 临时变量 | 低 |
| **跨会话** | 永久 | Playbook / 向量数据库 | 高 |

### 5.4 反馈源

| 反馈源 | 可靠性 | 速度 | 成本 |
|-------|--------|------|------|
| **LLM 自检** | 低-中 | 快 | 低 |
| **工具执行**（测试/编译） | 高 | 中 | 中 |
| **外部评分**（Benchmark） | 高 | 慢 | 高 |
| **人类反馈** | 最高 | 最慢 | 最高 |

### 5.5 学习方式

| 方式 | 说明 | 跨会话 | 透明度 |
|------|------|--------|--------|
| **上下文学习**（In-Context） | Prompt 中加入示例 | ❌ | ✅ 完全透明 |
| **Playbook 更新** | 结构化策略知识库 | ✅ | ✅ 可审计 |
| **微调**（Fine-tuning） | 模型权重更新 | ✅ | ❌ 黑箱 |

### 5.6 并行度

| 模式 | 描述 | 加速比 | 协调成本 |
|------|------|--------|---------|
| **串行** | 前后依赖，顺序执行 | 1× | 无 |
| **并行**（Agent 间） | 独立任务同时执行 | N× | 中 |
| **流水线** | 阶段间无屏障，逐项推进 | 近 N× | 低 |

### 5.7 安全边界

| 措施 | 描述 | 对自主性的影响 |
|------|------|--------------|
| **权限白名单** | 仅允许指定操作 | 低 |
| **沙箱执行** | 隔离环境运行危险操作 | 中 |
| **Human-in-the-Loop** | 关键决策人工审批 | 高 |
| **行为约束 Prompt** | 在系统 Prompt 中约束 | 无 |

---

## 六、工程实践：如何选择循环模式

### 6.1 场景推荐矩阵

| 应用场景 | 推荐模式组合 | 理由 |
|---------|------------|------|
| **CLI 编程助手** | R1 ReAct + R3 评价-反馈-重做 | 执行→测试→修复的快速迭代闭环 |
| **代码审查** | R1 ReAct → R3 迭代 | 分析代码→发现问题→验证修复 |
| **内容创作** | R3 评价-反馈-重做 | 质量迭代是内容生产的关键 |
| **端到端自动化** | R4 任务管理 | 动态子任务生成应对不确定性 |
| **通用助手** | R2 Agent Loop | 产品级封装，安全和工具就绪 |
| **持续学习系统** | R5 闭环学习 | 跨会话进化是最具竞争力的能力 |
| **多智能体协作** | R2 上层 + R4 下层 | 主 Agent 分配 → 子 Agent 任务循环 |
| **文档知识管理** | R2 + 人工审阅 | 生成 → Obsidian 审阅 → 迭代 |

### 6.2 组合模式示例

**示例 1：软件开发的完整 Loop 栈**

```
R2 Agent Loop（产品框架）
  └── R1 ReAct（单步编码）
      └── R3 评价-反馈-重做（测试→修复）
          └── R4 任务管理（多文件/多模块并行）
              └── R5 闭环学习（从该项目的模式中学习）
```

**示例 2：持续进化的个人助手**

```
R5 闭环学习（Hermes Agent 架构）
  └── Playbook 持久化（跨会话学习）
      └── R1 ReAct（每次交互的推理-行动）

随着使用时间增长：
  → Playbook 积累更多策略
  → 准确率提升
  → Token 消耗下降（48% 减少）
```

### 6.3 常见反模式

| 反模式 | 问题 | 正确做法 |
|--------|------|---------|
| **无上限循环** | Token 爆炸，成本失控 | 始终设置硬上限和超时 |
| **过低质量阈值** | 产出粗劣，仍需人工大量修改 | 阈值应通过实验校准 |
| **过高质量阈值** | 多次迭代仍不通过，Token 浪费 | 加入最大轮次保护 |
| **忽视反馈质量** | "检查"环节不够严格，虚假通过 | 检查 Prompt 应与生成同等重要 |
| **未持久化学习** | 每次从零开始，缺乏进化 | 设计 Playbook 或记忆系统 |

---

## 七、进化趋势：从简单循环到复合架构

### 7.1 循环模式的演进路线

```
2023 ──── R1 ReAct（基础）                    ──── AutoGPT / AgentGPT
2024 ──── R2 Agent Loop（产品化）             ──── Claude Code / Claude Cowork
          R3 评价-反馈-重做（质量迭代）        ──── Claude Code 测试循环
2025 ──── R4 任务管理（动态分解）             ──── AgentGPT / BabyAGI
2026 ──── R5 闭环学习（系统进化）             ──── Hermes Agent
未来 ──── 多级循环嵌套 + 自适应切换            ──── 复合架构
```

### 7.2 未来方向

1. **自适应循环切换**：智能体根据任务难度自动选择循环模式（简单任务走 R1，复杂任务升到 R4-R5）
2. **循环级联**：多个不同粒度的循环嵌套运行，形成完整的执行+学习体系
3. **元循环控制**：一个"元循环"监控和优化下层循环的性能（如：分析哪些循环模式在什么场景下效率最高）
4. **分布式循环**：多个智能体的循环在网络中异步协调，形成分布式认知架构

---

## 八、参考文献

### 核心文档（本知识库内交叉引用）

| 文档 | 涉及的循环模式 |
|------|--------------|
| [[AI_Agent_Deep_Dive]] | R1 ReAct |
| [[Claude_Beta_Products]] | R2 Agent Loop |
| [[AIGC_Agent_Introduction]] | R3 评价-反馈-重做 |
| [[AgentGPT_Introduction]] | R4 任务管理 |
| [[AutoGPT_Introduction]] | R4 任务管理 |
| [[Hermes_Agent_Architecture_Design]] | R5 闭环学习 |
| [[Anthropic_Harness_Engineering_AI_Agent]] | Harness 与 Loop 的关系 |
| [[Superpowers_Skill_Introduction]] | TDD 循环 |
| [[Obsidian_Claude_Code_Workflow]] | 知识管理闭环 |
| [[Agent_Context]] | 自改进循环 |
| [[AI_Agent_Development_Framework]] | 总体框架 |

### 原始资料链接

- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Anthropic - Building effective agents](https://docs.anthropic.com/en/docs/build-with-claude/agentic-patterns)
- [AutoGPT GitHub](https://github.com/Significant-Gravitas/AutoGPT)
- [AgentGPT GitHub](https://github.com/reworkd/AgentGPT)

---

## 附录：术语对照表

| 英文 | 中文 | 本义 |
|------|------|------|
| Loop | 循环 | 智能体的核心运行时流程 |
| ReAct | 推理-行动交替 | 推理与行动交叉进行的决策模式 |
| Agent Loop | 智能体循环 | 产品级标准化的执行框架 |
| Iterative Refinement | 迭代精修 | 对单次产出的多轮改进 |
| Closed Learning Loop | 闭环学习循环 | 具有跨会话学习能力的循环 |
| Human-in-the-Loop | 人机协作 | 关键环节由人类介入 |
| Playbook | 策略手册 | 持久化的学习成果存储 |
| Termination Condition | 终止条件 | 循环停止的判断依据 |
| Quality Threshold | 质量阈值 | R3 循环中通过/重做的分界 |

---

*本文档创建于 2026 年 6 月 22 日，基于 /Users/xiexingyong/ai_agent 中 8 份文档的全量交叉分析。*