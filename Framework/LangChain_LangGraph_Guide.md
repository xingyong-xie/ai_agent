---
title: LangChain 与 LangGraph 实战指南
created: 2026-11-02
updated: 2026-11-02
tags: [AI, 智能体, 框架, LangChain, LangGraph, ReAct, Plan-and-Execute, ToT, Reflection]
related: "[[AI_Agent_Development_Framework]], [[Agent_Tool_Layer]], [[Loop_Engineering]], [[AI_Agent_Deep_Dive]], [[TypeSafe_Jev_Introduction]], [[Anthropic_Harness_Engineering_AI_Agent]]"
---

# LangChain 与 LangGraph 实战指南

> 本篇聚焦「范式 → 框架实现」的落地映射：**ReAct / Plan & Execute / Tree of Thoughts / Self-Reflection** 这四种规划范式，在 LangChain 与 LangGraph 生态里究竟对应什么组件、成熟度如何、哪些仍是实验品。

---

## 〇、溯源说明

本文的版本与 API 信息来自 **2026-11-02** 的实际核实，不是搜索摘要转述。标记含义：

| 标记 | 含义 | 本文中的来源 |
|------|------|------------|
| 🟢 | 一手 | 直接抓取官方页面 / 下载 PyPI wheel 检查文件内容 |
| 🟡 | 独立第三方 | 社区仓库、教程、示例（含旧官方教程） |
| 🔴 | 宣称 / 未经核实 | 厂方营销、二手转述 |

**核实方法记录**：

- 官方文档：`curl` 抓取 `docs.langchain.com` 页面正文；旧 `langchain-ai.github.io/langgraph/tutorials/...` 地址做了重定向检测
- 包内容：下载 `langchain-experimental==0.4.2` 的 wheel 并 `unzip -l` 检查模块，解包阅读 `tot/`、`plan_and_execute/`、`smart_llm/` 源码
- 文档规模：抓取 `docs.langchain.com/sitemap.xml` 统计分区页数

> ⚠️ **方法论限制**：`WebFetch` 在本环境被网络策略拦截，全部改用 `curl`；官方页面为前端渲染，正文通过 HTML 去标签提取，可能有少量排版噪声。LangChain 生态 API 变动频繁，落地前请以本地安装版本为准。

**版本快照**：

| 组件 | 版本 / 时间 | 核实方式 |
|------|------------|---------|
| `langchain-experimental` | `0.4.2`（当前最新） | PyPI JSON + wheel 内容 🟢 |
| `RubricMiddleware` | 需 `deepagents>=0.6.5`，beta | 官方 middleware 文档 🟢 |
| `docs.langchain.com` | 页面 `lastModified` = 2026-10-14 | 页面元数据 🟢 |

---

## 一、先厘清坐标系：范式 ≠ 框架 ≠ 运行时

这是理解后续一切的前提——三者不在同一层级：

| 维度 | ReAct | LangChain | LangGraph |
|------|-------|-----------|-----------|
| **本质** | 推理-行动**范式** | **开发框架**（库） | **状态图编排引擎** |
| **形态** | 无实体，一段循环逻辑 | 组件 + 工具集成 + RAG | 有向图（节点 / 边 / 共享 State） |
| **状态** | 仅 Context Window，隐式 | 组件间传递，`Memory` 管理 | **显式 State 对象**，跨节点持久 |
| **控制流** | 线性循环：思考→行动→观察 | `AgentExecutor` / `create_agent` 内置 | 分支、并行、条件边、人工中断 |
| **对应 [[Loop_Engineering]] 层级** | **R1** | 构建 R2 的工具 | 构建 **R2 / R4** 的运行时 |

```
范式层    ReAct / Plan & Execute / ToT / Self-Reflection
             │ 由谁实现
实现层    LangChain（库）──────────► LangGraph（图运行时）
             │                          │
产品层    create_agent + middleware     自定义状态图
```

**一句话记法**：

- **ReAct**：怎么想、怎么做的**方法论**
- **LangChain**：把方法论**打包成组件**给你用
- **LangGraph**：当方法论不够用（需要状态、分支、中断）时，**换成图来编排**

> 关键事实：LangChain v1 的 `create_agent` **底层就构建在 LangGraph 之上** 🟢（官方文档 "Custom workflow" 页面在节点内使用 `langchain.agents.create_agent`）。两者正在收敛，不是竞争关系。

---

## 二、LangChain v1 的当前形态

### 2.1 `create_agent` + Middleware

LangChain v1 的主干是 **agent + 中间件**模式。官方文档示例：

```python
from langchain.agents import create_agent

agent = create_agent(
    model="...",            # 官方示例用 gpt-5.5；此处不构成模型推荐
    tools=[read_file, write_file, run_tests],
    middleware=[...],
)
```

中间件（middleware）是 v1 的核心扩展点，官方内置了一批可配置的预构建中间件 🟢：

| 中间件 | 作用 | 与本文范式的关系 |
|--------|------|----------------|
| **To-do list** (`TodoListMiddleware`) | 给 agent 注入 `write_todos` 工具，做任务规划与追踪 | Plan & Execute 的软实现 |
| **Rubric grading** (`RubricMiddleware`) | LLM-as-a-judge 自评，迭代到满足 rubric | Self-Reflection（多轮） |
| Human-in-the-loop | 暂停等待人工审批工具调用 | 图级中断 ⚠️ |
| Summarization | 接近 token 上限时自动摘要历史 | 与上下文工程相关 |
| Tool retry / Model fallback / Model call limit | 错误重试、模型降级、调用次数上限 | 生产稳定性 |

> ⚠️ 「Human-in-the-loop」在 LangChain 里以中间件出现，但真正的中断/恢复靠 LangGraph 的 checkpointer + interrupt 机制。

### 2.2 旧 API 的迁移

LangChain 的 agent API 经历过较大变动，笔记里常见的写法可能已过时：

| 写法 | 时代 | 现状 |
|------|------|------|
| `AgentExecutor` + `create_react_agent` | LangChain 0.x | 旧版路线，逐步退出 |
| `langgraph.prebuilt.create_react_agent` | LangGraph 早期 | 图化 ReAct，仍常见 🟡 |
| `langchain.agents.create_agent` | LangChain v1 | **当前主推** 🟢 |

> 落地前先确认 `pip show langchain langgraph` 的版本，不要照搬旧教程。

---

## 三、四种规划范式的实现映射

> 四种范式的定义出处：[[AI_Agent_Deep_Dive]] 的「规划（Planning）」一节。

### 3.1 ReAct —— 一等公民

ReAct 是 LangChain / LangGraph 的**默认循环**，不需要额外组件：

```python
# LangChain v1：create_agent 本身就是 ReAct 风格的循环
from langchain.agents import create_agent
agent = create_agent(model="...", tools=[...])
```

```python
# LangGraph prebuilt（早期常见路径，需按版本核实）
from langgraph.prebuilt import create_react_agent
agent = create_react_agent(llm, tools)
```

| 维度 | 说明 |
|------|------|
| 成熟度 | 🟢 生产可用 |
| 规划与执行 | 每步现想现做，无显式计划 |
| 记忆 | 默认仅 Context Window；持久化需 LangGraph checkpointer |

### 3.2 Plan & Execute —— 三种形态，严格程度不同

#### 形态 A：严格实现（LangChain 实验包）

🟢 实测 `langchain-experimental==0.4.2` 的 `__init__.py` 导出：

```python
from langchain_experimental.plan_and_execute import (
    PlanAndExecute, load_agent_executor, load_chat_planner)

planner  = load_chat_planner(model)            # 一次性生成完整步骤列表
executor = load_agent_executor(model, tools)   # 每步用 agent 执行
agent    = PlanAndExecute(planner=planner, executor=executor)
agent.run("...")
```

- 模块 docstring："planning tasks with a language model (LLM) and executing them with a separate agent"
- planner 输出以 `<END_OF_PLAN>` 结束
- 属 `experimental`，官方不保证 API 稳定
- ⚠️ GitHub 主分支的 `libs/experimental/.../plan_and_execute` 路径返回 404，但 PyPI 发布版仍有——说明主仓库托管方式有调整，使用前先确认本地版本

#### 形态 B：LangGraph 三节点图（教程级）

🟡 官方旧教程与社区实现的结构一致：

```
planner（生成步骤列表）
   ↓
executor（逐项执行，内部通常是 ReAct agent）
   ↓
replanner（检查结果 → 继续 / 修订计划 / 结束）
   ↺
```

State 典型字段：

```python
class PlanExecute(TypedDict):
    input: str
    plan: list[str]                      # 剩余待执行步骤
    past_steps: list[tuple[str, str]]    # (任务, 结果) 历史
    response: str
```

- **不是** `create_plan_and_execute` 这种 prebuilt 函数，需自己连节点
- 旧教程地址 `langgraph/tutorials/plan-and-execute/...` 实测 302 重定向到 LangChain v1 middleware 文档的 `#to-do-list` 锚点 🟢
- 参考实现（社区）：Daytona 的六节点数据 Agent（`provision → plan → execute → check → summarize → cleanup`）

#### 形态 C：软实现（LangChain v1 TodoListMiddleware）

🟢 官方文档原文：

```python
from langchain.agents import create_agent
from langchain.agents.middleware import TodoListMiddleware

agent = create_agent(
    model="...",
    tools=[read_file, write_file, run_tests],
    middleware=[TodoListMiddleware()],
)
```

- 自动提供 `write_todos` 工具 + 引导提示
- 适用：跨多工具协调的复杂多步任务、需要进度可见的长任务
- **语义差异**：规划内嵌在 ReAct 循环里，边执行边维护，没有独立的 planner 阶段

#### 三者对比

| 形态 | 规划与执行关系 | 独立 planner | 成熟度 |
|------|---------------|-------------|--------|
| A. `PlanAndExecute` | 先规划完，再执行 | ✅ | 实验性 🟢 |
| B. LangGraph 三节点 | planner → executor → replanner | ✅ | 教程级 🟡 |
| C. `TodoListMiddleware` | 边执行边维护 todo | ❌ 内嵌 | 内置中间件 🟢 |

### 3.3 Tree of Thoughts —— 实验包里有，但已边缘化

🟢 实测 `langchain-experimental==0.4.2` 含完整 `tot/` 模块：

```
langchain_experimental/tot/
├── base.py            # ToTChain
├── checker.py         # ToTChecker（抽象类，需子类化）
├── controller.py
├── memory.py          # ToTDFSMemory（深度优先搜索）
├── thought.py
├── thought_generation.py
└── prompts.py
```

`__init__.py` 仅导出 `ToTChain`、`ToTChecker`。模块 docstring 指向论文 [*Large Language Model Guided Tree-of-Thought*](https://arxiv.org/pdf/2305.08291.pdf)。

**关键参数**（源码定义）：

| 参数 | 含义 | 默认 |
|------|------|------|
| `k` | 最大对话轮数 | 10 |
| `c` | 每个节点探索的子节点数 | 3 |
| `checker` | 终止判定，必须自己实现 `evaluate()` | 无 |

```python
from langchain_experimental.tot.base import ToTChain
from langchain_experimental.tot.checker import ToTChecker

class MyChecker(ToTChecker):
    def evaluate(self, problem_description, thoughts):
        # 返回 (is_consistent, is_solved, feedback)
        ...

tot = ToTChain(llm=llm, checker=MyChecker(), k=3, c=1)
tot.run("...")
```

**局限**：

- 基于旧版 `Chain` 接口，不是 LCEL / LangGraph
- 单 LLM、无工具调用，只在文本层面分叉
- `ToTDFSMemory` 表明是**深度优先**展开，不是并行搜索
- 未进入 LangChain v1 的 agent / middleware 体系
- LangGraph 侧**没有**官方 ToT prebuilt

### 3.4 Self-Reflection —— 三处实现，官方方向是多轮自评

`langchain_experimental` 顶层**没有** `reflection` / `reflexion` 目录 🟢。能力分散在三个地方：

#### A. `SmartLLMChain`（实验包）—— 单次自批评

🟢 `langchain_experimental.smart_llm.SmartLLMChain` 的 docstring："Chain for applying self-critique using the SmartGPT workflow"：

```
1. Ideation  → 生成 n 个候选想法
2. Critique  → 批评 LLM 挑 flaws
3. Resolve   → resolver LLM 在批评基础上改进
```

```python
from langchain_experimental.smart_llm import SmartLLMChain
chain = SmartLLMChain(llm=llm, n_ideas=3)
chain.invoke({"question": "..."})
```

- 单次循环，不是多轮迭代
- 可分别指定 `ideation_llm` / `critique_llm` / `resolver_llm`

#### B. `RubricMiddleware`（LangChain v1）—— 多轮自评，当前官方方向

🟢 官方文档：

- 位于 `deepagents` 包，需 `deepagents>=0.6.5`
- 标记 **beta**，API 可能变动
- 用法：把「什么叫做好了」声明成 rubric，agent 用 LLM-as-a-judge **自评并迭代**，直到满足 rubric 或达到最大迭代次数

```python
# 伪代码示意；需 deepagents>=0.6.5
from deepagents.middleware.rubric import RubricMiddleware
agent = create_agent(model="...", tools=[...], middleware=[RubricMiddleware(...)])
```

这是最接近 [[Loop_Engineering]] **R3 评价-反馈-重做** 的内置能力。

#### C. LangGraph reflection / reflexion 教程

🟡 旧地址 `langgraph/tutorials/reflection/reflection/` 与 `.../reflexion/reflexion/` 实测均 302 重定向到 `docs.langchain.com/oss/python/langgraph/overview` 🟢。能力仍在（generator → critic → revise 图；Reflexion 额外维护外部反馈记忆），但官方已不再作为独立教程页维护。

#### 三者对比

| 实现 | 迭代性 | 位置 | 成熟度 |
|------|--------|------|--------|
| `SmartLLMChain` | 单次（ideation→critique→resolve） | 实验包 | 实验性 🟢 |
| `RubricMiddleware` | 多轮（自评→改→再评） | `deepagents` | beta 🟢 |
| reflection / reflexion 图 | 多轮 | LangGraph 教程 | 教程级 🟡 |

---

## 四、实现总表

| 范式 | 推荐实现 | 代码入口 | 成熟度 | 备注 |
|------|---------|---------|--------|------|
| **ReAct** | `create_agent` | `langchain.agents` | 🟢 生产 | 默认循环 |
| **Plan & Execute（严格）** | `PlanAndExecute` | `langchain_experimental.plan_and_execute` | 🟢 实验性 | 独立 planner |
| **Plan & Execute（图）** | planner/executor/replanner | LangGraph 自定义图 | 🟡 教程 | 状态显式 |
| **Plan & Execute（软）** | `TodoListMiddleware` | `langchain.agents.middleware` | 🟢 内置 | 规划内嵌 |
| **Tree of Thoughts** | `ToTChain` + `ToTChecker` | `langchain_experimental.tot` | 🟢 实验性 | 已边缘化 |
| **Self-Reflection（单次）** | `SmartLLMChain` | `langchain_experimental.smart_llm` | 🟢 实验性 | SmartGPT 流程 |
| **Self-Reflection（多轮）** | `RubricMiddleware` | `deepagents.middleware.rubric` | 🟢 beta | 官方方向 |
| **Self-Reflection（图）** | reflection / reflexion | LangGraph 自定义图 | 🟡 教程 | 文档已重组 |

---

## 五、选型建议

| 需求 | 选择 |
|------|------|
| 通用 agent、快速起步 | `create_agent` + 需要时加 middleware |
| 任务步骤明确、要进度可见 | `TodoListMiddleware` |
| 必须先出完整计划再执行 | `PlanAndExecute`（实验）或 LangGraph 三节点图 |
| 需要断点恢复 / 人工审批 / 并行分支 | 直接用 LangGraph 显式图 |
| 有明确的"验收标准" | `RubricMiddleware`（beta） |
| 探索型问题、要回溯 | ToT 可试，但更建议自己用图实现 |
| 生产环境 | 优先 🟢 内置组件，避开 experimental 包 |

> 与 [[TypeSafe_Jev_Introduction]] 的衔接：LangChain 把决策模型包成 `Runnable`，以 `AutoModeMiddleware` 形式接入 agent 中间件；那属于「单步判断」层，不能替整个 ReAct 循环做规划。

---

## 六、官方文档地图

`docs.langchain.com` 的 sitemap 统计（2026-11-02，🟢）：

| 分区 | 路径 | 页面数 |
|------|------|--------|
| LangChain Python | `/oss/python/langchain/` | 68 |
| LangChain JavaScript | `/oss/javascript/langchain/` | 68 |
| LangGraph Python | `/oss/python/langgraph/` | 35 |
| Deep Agents | `/oss/python/deepagents/` | 36 |
| 集成（Python） | `/oss/python/integrations/` | 25 |
| LangSmith | `/langsmith/` | 数百（以 API 参考为主） |

常用入口：

- 主文档：https://docs.langchain.com/oss/python/langchain/overview
- LangGraph：https://docs.langchain.com/oss/python/langgraph/overview
- API 参考：https://reference.langchain.com/python/
- 旧版 `python.langchain.com/docs/...` 仍可访问，但新内容已迁至 `docs.langchain.com`，部分旧教程会 302 重定向

---

## 七、与知识库其他笔记的关系

| 笔记 | 关系 |
|------|------|
| [[AI_Agent_Development_Framework]] | 框架**总览**；本篇是其 LangChain/LangGraph 部分的**展开与更新** |
| [[Agent_Tool_Layer]] | LangChain **工具开发**（`@tool`、`create_tool_calling_agent`）；本篇补充工具如何进入 agent 循环 |
| [[Loop_Engineering]] | 定义 **R1–R5 循环模型**；本篇把四种规划范式映射到具体组件 |
| [[AI_Agent_Deep_Dive]] | 四种规划范式的**定义出处**；本篇给实现 |
| [[Anthropic_Harness_Engineering_AI_Agent]] | Harness / Loop 的工程视角；本篇是具体框架落地 |
| [[TypeSafe_Jev_Introduction]] | `langchain-typesafe` 集成、`AutoModeMiddleware` 决策闸门 |
| [[AutoGPT_Introduction]] / [[AgentGPT_Introduction]] | 早期 LangChain 使用案例 |

---

## 八、待核实与变动风险

1. **LangChain v1 的 agent API 仍在演进**：`create_agent` 的参数、middleware 列表可能随版本变化。
2. **`PlanAndExecute` 的托管位置**：GitHub 主仓库路径 404、PyPI 发布版仍含——需持续观察是否被移除。
3. **`RubricMiddleware` 属 beta 且依赖 `deepagents`**：接口可能变动，接入前读当前文档。
4. **旧教程重定向不保证永久**：reflection / reflexion / plan-and-execute 的旧 URL 已重定向，新的稳定地址以 `docs.langchain.com` 为准。
5. **本篇未覆盖**：LCEL 语法细节、LangGraph checkpointer / interrupt 的完整用法、LangSmith 评估体系——需要时另开笔记。

---

## 参考

- [LangChain 官方文档](https://docs.langchain.com/oss/python/langchain/overview)
- [LangChain 内置 middleware（To-do list / Rubric grading）](https://docs.langchain.com/oss/python/langchain/middleware/built-in)
- [LangGraph 文档](https://docs.langchain.com/oss/python/langgraph/overview)
- [API Reference](https://reference.langchain.com/python/)
- [langchain-experimental on PyPI](https://pypi.org/project/langchain-experimental/)
- [Tree of Thoughts 论文](https://arxiv.org/pdf/2305.08291.pdf)
- [LangGraph Plan-and-Execute Data Agent（Daytona，社区示例）](https://github.com/daytonaio/daytona/blob/8c07569d1f4f88c4b84a8859c905da8b9cb7573f/guides/python/langgraph/plan-and-execute-data-agent/README.md)
