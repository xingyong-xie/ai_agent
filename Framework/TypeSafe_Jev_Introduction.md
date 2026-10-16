---
title: TypeSafe Jev 介绍
created: 2026-10-15
updated: 2026-10-16
tags: [AI, TypeSafe, Jev, 决策模型, System One, 模型层, 概率校准]
related: "[[LLM_Model_Layer]], [[AI_Agent_Development_Framework]], [[Agent_Context]], [[AI_Agent_Deep_Dive]]"
---

# TypeSafe Jev 介绍

> **一句话**：Jev 是一个**不生成文本**的模型——你给它一段 `state` 和一组**类型化问题**（typed questions），它还你一组**带概率的类型化答案**。
>
> 官方口号：**"Decisions, not strings"**。

---

## 一、概述

**Jev** 是 TypeSafe AI 于 **2026-09-15** 发布的模型，也是首个公开的 **System One Model**（决策模型 / Decision Model）。它不做对话、不写代码、不给推理过程，只做**判断**。

| 属性 | 说明 |
|------|------|
| **发布方** | TypeSafe AI（旧金山，2024 年成立，此前隐身两年） |
| **发布时间** | 2026-09-15 |
| **模型类别** | System One Model / Decision Model（决策模型） |
| **命名来源** | Kahneman《思考，快与慢》的 **System 1**（直觉式快判断）+ 经济学家 Jevons 的杰文斯悖论 |
| **核心作者** | Diogo Almeida（前 OpenAI，InstructGPT / RLHF 共同作者）；联合创始人 Erik Gafni（CTO）、Sasha Sheng（COO，前 Meta/FAIR） |
| **训练方法** | **RLCD**（Reinforcement Learning for Calibrated Decisions） |
| **模型 ID** | `jev-1.13.0` / **`jev-1.14.0`（2026-10-14 发布）**；响应会返回**带日期的快照名**（如 `typesafe/jev-1.13-20260917`），属正常现象 🟢 |
| **别名** | `jev-latest`（追踪最新版，现已指向 1.14）、`jev-preview`；**阈值调优后务必固定版本号**，换版会让调好的阈值失效 🟢 |
| **主端点** | `POST https://api.typesafe.ai/v1/systemone` 🟢 |
| **定价** | **$42 / Btok = $0.042 / 百万输入 token**，**输出 token 免费** 🟢 |
| **延迟** | 官方称"多数查询约 **100 ms**" 🟢；早期转述的"70~500 ms"区间未见官方出处 🔴 |
| **上下文** | **两个独立上限**：per-request **64K**（state + 全部问题）、per-question **32K**（state + 任一单个问题）🟢 |
| **输入形态** | 文本（字符串 / JSON 对象 / 字符串数组）。**不接受音频与视频**；图片属"危险区"实验特性，见 3.4 🟢 |
| **开源** | ❌ 否（未发布权重；仅 SDK 开源） |

> ✅ **核实说明**：本表"模型 ID / 别名 / 端点 / 定价 / 上下文 / 输入形态 / 延迟"几项已于 2026-10-15 对照官方 `docs.typesafe.ai` 一手文档逐条核对 🟢。
>
> ⚠️ 但要注意：**1.14 发布后，本文其余部分仍以 1.13 的行为为基准**——尤其"锯齿边缘"清单（7.3）官方只声明适用于 `jev-1.13`。

### 核心特色

| 特色 | 说明 |
|------|------|
| **不做生成** | 不产生任何正文/代码/推理链，输出空间被 schema 完全约束 |
| **四种问题原语** | Noul / Choice / Score 覆盖"是不是 / 选哪个 / 打几分"；`Box` 定位图片中的目标（实验特性，见 3.4） |
| **类型化输出** | 返回值结构由你定义的问题类型决定，天然适配强类型语言 |
| **概率而非标签** | 返回校准过的概率分布，下游可用阈值做决策 |
| **单次 pass 并行** | 所有问题对同一 state 独立求值，**增加问题几乎不增加延迟** |
| **输出免费** | 计费只按输入算，"too cheap to meter" |

### 溯源等级说明

笔记中所有数字与论断按可信度标注：

| 标记 | 含义 |
|------|------|
| 🟢 | **一手**：官方文档 / 官方公告 / SDK 源码 |
| 🟡 | **独立**：第三方分析、独立基准测试、学术预印本（非厂方） |
| 🔴 | **宣称**：厂方宣传数字或社区二手转述，**未见独立复现** |

> ⚠️ **本文的溯源实况**：初稿撰写时原始页面无法直接打开（网络策略拦截），内容来自搜索引擎**索引摘要**。后续分两步补正。
>
> **第一步**：用 `curl` 抓取 OpenRouter 官方文档的 markdown 原文，**第四、五节及原语定义已据一手文档重写并修正**（曾修正：模型 ID、`Noul` 拼写、base URL 与端点区别）。
>
> **第二步（2026-10-15）**：取到 TypeSafe 官方文档站的全文导出 **`docs.typesafe.ai/llms-full.txt`**（约 1.03 MB，含完整 API 参考、四个原语页、Patterns 页、约 20 个 cookbook、模型页、锯齿边缘页），据此完成第二轮修正：
>
> - 原语从**三种更正为四种**（补 `Box`），并补上**图片**能力及其"未达生产标准"的官方自述
> - 补上 **confidence 的三种计算公式**（此前只有"集中程度"这种定性说法）
> - 把**官方端点、框架集成、锯齿边缘**几处从 🟡 升为 🟢
> - 模型版本更新到 **1.14（2026-10-14 发布）**
>
> 第一、八节中标注 🔴 的宣传数字**仍仅来自搜索摘要**，引用前请自行核对。

---

## 二、核心设计

### 2.1 数据流

```
        ┌─────────────────────────────────────────┐
        │  state（状态）                          │
        │  · 字符串 / 字符串数组 / 键值对(JSON)   │
        └────────────────┬────────────────────────┘
                         │
        ┌────────────────▼────────────────────────┐
        │  questions（类型化问题 Map）            │
        │  · q_id → { type, instructions, criteria }│
        │  · type ∈ noul|choice|score|box         │
        └────────────────┬────────────────────────┘
                         │
                   ┌─────▼─────┐
                   │    Jev    │  ← 单次 pass，所有问题并行求值
                   └─────┬─────┘
                         │
        ┌────────────────▼────────────────────────┐
        │  answers（类型化答案 Map）              │
        │  · q_id → 概率 / 选项分布 / 加权分      │
        └─────────────────────────────────────────┘
```

**关键点**：`questions` 的 key 是你自己定的（比如 `is_bug`、`team`），**这些 ID 从不下发给模型**；模型只看问题内容，答案按同样的 ID 回来。所有问题共享同一份 state 且**互相独立**并行求值。

### 2.2 与聊天 LLM 的对比

| 维度 | 聊天 LLM | Jev（决策模型） |
|------|----------|-----------------|
| **输入** | 对话/指令 | `state` + 类型化问题 |
| **输出** | 自由文本 | 类型化概率答案 |
| **输出空间** | 无界 | 被 schema 完全约束 |
| **失败模式** | 幻觉、跑题、格式崩坏 | **格式永远合法**，但可能标签错 |
| **延迟** | 秒级 | 70~500 ms |
| **计费** | 输入 + 输出均计费 | 仅输入计费，输出免费 |
| **可解释性** | 可给理由 | **不给理由**（只有概率） |
| **多问题** | 每问一次要一次调用 | 一次调用并行回答全部 |
| **定制** | 微调 / 提示工程 | 不支持微调，靠拆问题 |

---

## 三、四种问题原语

前三种（Noul / Choice / Score）覆盖了绝大多数"结构化判断"场景，**同一个请求里可以混用**。第四种 `Box` 用于图片定位，官方标为**实验特性**。

### 3.1 Noul — 是 / 否

> 拼写说明：**官方文档确认拼写为 `Noul`**（据称源自 *Bernoulli* 的变体）。早期社区转述中有写作 `Null` 的，属误传——以官方为准。🟢

| 项 | 说明 |
|----|------|
| **用途** | 判断某个命题是否成立 |
| **criteria** | 可选，`{ true: "...", false: "..." }` 描述两端 |
| **返回** | `noul` ∈ [0, 1]，即命题为真的概率 |
| **注意** | **没有单独的 confidence 字段**——概率本身就是答案 |

### 3.2 Choice — 选一个

| 项 | 说明 |
|----|------|
| **用途** | 从**无序**选项集合中选一个（分类、路由、归属判定） |
| **选项数** | 最多 **255** 个 |
| **criteria** | 对象：`选项名 → 描述`（值可为 `null`） |
| **返回** | `choice`（选中的项）+ `probabilities`（全分布）+ `confidence` |
| **建议** | 务必包含一个 "none / other" 兜底选项 |

### 3.3 Score — 打几分

| 项 | 说明 |
|----|------|
| **用途** | 在**有序**量表上定位（严重度、紧急度、情绪强度、质量分） |
| **criteria** | **有序数组**，2~10 级，从低到高 |
| **返回** | `score`（概率加权均值，**可能是小数**）+ `legend` + `probabilities` + `confidence` |
| **建议** | 每一级写成**具体情境**，而不是写"高/中/低"这种程度词 |

### 3.4 Box — 定位图片中的目标（实验特性）

> 官方原文把它标为 **"Dreamer-ready"**：*"Images and Box questions aren't yet up to our standards to call ready for production."* 请求格式、返回结构与限制**可能在版本间变化**，准确率也会随模型更新而变。🟢

| 项 | 说明 |
|----|------|
| **用途** | 找出某个东西**在图片里的位置**（杯子、签名、门口的人） |
| **返回** | `box`：`{top, bottom, left, right}`，**都是 0~1 的比例**，乘图片宽高即得像素；另带 `confidence` |
| **criteria** | **不接受** criteria，只有 `instructions` |
| **前置条件** | 请求里必须带图片；须加请求头 `TypeSafe-Danger-Zone-Images: true`；**需要 Jev 1.14**（`jev-preview` 或 `jev-1.14.0`） |

**三条必须知道的坑**：

1. **Box 永远返回一个框**——没有"找不到"这个答案。目标不存在时它照样给你四个边。官方建议：**同一个请求里再问一个 Noul**（"图里有没有这个目标"），Noul 分数低就忽略那个框。
2. **图片默认关闭**。要走顶层 `assets` map + 引用串，并用 `TypeSafe-Danger-Zone-Images: true` 显式开启。
3. **图片能放在任何文本能放的地方**——`state`、`instructions`、`criteria` 都行，四种原语都接受图片。

```python
# 官方示例：把比例换算成像素并裁剪
from PIL import Image

image = Image.open("kitchen.jpg")
width, height = image.size
edges = response["answers"]["mug"]["box"]

box = (
    round(edges["left"] * width),
    round(edges["top"] * height),
    round(edges["right"] * width),
    round(edges["bottom"] * height),
)
image.crop(box).save("mug.jpg")
```

> ⚠️ **别把它当成通用能力**。同一份官方文档在模型页写明：**Jev 的输入是文本**，不接受音频与视频；AI SDK 那条接入路径只接受 `text` / `JSON` 类型的 state。图片 + Box 是一条**独立实验支线**，不要和主线能力混为一谈。

### 3.5 请求示例

```json
{
  "model": "typesafe/jev-1.13",
  "state": {
    "ticket": "付款页面在 iOS 17 上白屏，已影响三名用户"
  },
  "questions": {
    "is_bug": {
      "type": "noul",
      "instructions": "这是否是一个缺陷（而非功能请求）？",
      "criteria": {
        "true": "用户报告了非预期行为",
        "false": "用户在请求新能力"
      }
    },
    "team": {
      "type": "choice",
      "instructions": "这条工单应归属哪个团队？",
      "criteria": {
        "payments": "支付流程、账单、退款",
        "frontend": "Web/客户端渲染与交互",
        "other": "以上都不是"
      }
    },
    "urgency": {
      "type": "score",
      "instructions": "这条工单的紧急程度？",
      "criteria": [
        "可以排到下个迭代",
        "本周内需要处理",
        "今天必须处理",
        "正在造成线上事故"
      ]
    }
  }
}
```

返回值（结构示意）按同样的 key 返回：`is_bug` 得到一个概率，`team` 得到选项分布，`urgency` 得到加权分与分级图例。

---

## 四、API 与 SDK

### 4.1 接入面

| 接入方式 | 说明 |
|----------|------|
| **TypeSafe 直连** | `POST https://api.typesafe.ai/v1/systemone`，请求头 `Authorization: Bearer <API_KEY>` 🟢 |
| **OpenRouter** | 模型名 `typesafe/jev-1.13`，两套端点见 4.3 🟢 |
| **Pydantic AI** | 一等公民：`TypeSafeModel`（`DecisionModel` 的子类），模型串 `typesafe:jev-latest` 或 `typesafe:jev-1.13.0` 🟢 |
| **LangChain** | `langchain-typesafe`，把 Jev 包成 `Runnable`；另有 agent 中间件 🟢 |
| **Vercel AI SDK** | 统一决策接口 **`experimental_decide`**，provider 为 `@ai-sdk/typesafe-ai` 🟢 |
| **OpenClaw** | 有插件页 `docs.openclaw.ai/plugins/typesafe` 🟡 |

> 🔧 **本轮修正**：Pydantic AI / LangChain / Vercel AI SDK 三行原先标 🟡，现据各自官方文档与包元数据升为 🟢。同时纠正两处**命名错误**：
>
> - AI SDK 的接口名是 **`experimental_decide`**；`experimental_evaluate` 是**已弃用的旧名**（旧教程与新文档混用，容易踩坑）。
> - AI SDK 里"是 / 否"原语写作 **`boolean`**，不是原生的 `noul`；而且 AI SDK 那条通路上**没有 `box`**。
>
> 详细调用代码见第十一节。

### 4.2 SDK 安装

| 语言 | 包名 | 安装 | 已验证版本 |
|------|------|------|-----------|
| **TypeScript / JS** | `@typesafe-ai/sdk` | `npm install @typesafe-ai/sdk` | 0.7.0 |
| **Python** | `typesafe-sdk`（导入名 `typesafe_sdk`） | `pip install typesafe-sdk` | 0.7.5 |
| **Go** | 官方解码器（另有社区客户端 `kataras/jev`） | — | — |

> ✅ **验证方式**：上表版本号是 2026-10-15 直接查询 **PyPI / npm registry 官方接口**得到的，不是搜索摘要转述。两个包均真实存在。
>
> 注意 Python 的**包名与导入名不一致**：装的是 `typesafe-sdk`，写的是 `from typesafe_sdk import ...`。这是常见踩坑点。

### 4.3 认证与 Base URL

| 环境变量 | 用途 |
|----------|------|
| `TYPESAFE_API_KEY` | API key（SDK 自动读取） |
| `TYPESAFE_BASE_URL` | Base URL（走 OpenRouter 时设为 `https://openrouter.ai/api`） |

| 端点 | 说明 |
|------|------|
| `https://openrouter.ai/api/v1/systemone` | **System One API**——SDK 走的路径（SDK 会自动在 base URL 后拼 `/v1/systemone`） |
| `https://openrouter.ai/api/alpha/decisions` | **Decisions API**——裸 HTTP 调用走的路径，带完整问题 schema |
| `https://api.typesafe.ai/v1/systemone` | **TypeSafe 官方直连端点** 🟢（已对照官方 API 参考页核实） |

> ⚠️ 两个端点容易混淆。**SDK 用户**只需设 `baseURL`，路径由 SDK 拼接；**裸 HTTP 用户**请用 `/api/alpha/decisions`。

### 4.4 示例一：TypeScript SDK

```typescript
import { TypeSafeClient } from '@typesafe-ai/sdk';

const client = new TypeSafeClient({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api',
});

const result = await client.systemOne({
  model: 'jev-1.13',
  state: 'I was charged twice for my subscription.',
  questions: {
    refund: { type: 'noul', instructions: 'Is the customer asking for money back?' },
    department: {
      type: 'choice',
      instructions: 'Which team should handle this?',
      criteria: { billing: 'Charges and refunds', technical: 'Bugs and outages' },
    },
  },
});

console.log(result.answers.refund); // { type: 'noul', noul: 0.98 }
```

**注意命名风格**：TypeScript 是 `client.systemOne()`（camelCase）。

### 4.5 示例二：Python SDK

```python
import os
from typesafe_sdk import TypeSafeClient

client = TypeSafeClient(
    api_key=os.environ["OPENROUTER_API_KEY"],
    base_url="https://openrouter.ai/api",
)

result = client.system_one(          # ← snake_case
    model="jev-1.13",
    state="I was charged twice for my subscription.",
    questions={
        "refund": {"type": "noul", "instructions": "Is the customer asking for money back?"},
        "department": {
            "type": "choice",
            "instructions": "Which team should handle this?",
            "criteria": {"billing": "Charges and refunds", "technical": "Bugs and outages"},
        },
    },
)

print(result.answers["refund"])
```

**注意命名风格**：Python 是 `client.system_one()`（snake_case）。其余结构完全一致。

### 4.6 示例三：裸 HTTP（不依赖 SDK）

适合快速验证或非 TS/Python 语言：

```bash
curl https://openrouter.ai/api/alpha/decisions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "typesafe/jev-1.13",
    "state": {
      "customer_tier": "enterprise",
      "ticket": "My checkout page shows a blank screen after I click Pay."
    },
    "questions": {
      "is_bug": {
        "type": "noul",
        "instructions": "Is the customer reporting a software defect?",
        "criteria": {
          "true": "The customer describes broken or unexpected product behavior.",
          "false": "The customer is asking a question or requesting a feature."
        }
      },
      "team": {
        "type": "choice",
        "instructions": "Which team should own this ticket?",
        "criteria": {
          "payments": "Checkout, billing, or payment processing issues.",
          "frontend": "Rendering, layout, or browser compatibility issues.",
          "account": "Login, permissions, or profile issues."
        }
      },
      "urgency": {
        "type": "score",
        "instructions": "How urgent is this ticket?",
        "criteria": [
          "Can wait for the next release",
          "Should be fixed this week",
          "Blocking revenue right now"
        ]
      }
    }
  }'
```

### 4.7 响应结构逐字段解读

下面是**官方文档中一次真实调用的返回**（同一次请求同时问三种原语）：

```json
{
  "id": "gen-dec-1790015143-AIaTutprXsJ5EwohRSjb",
  "model": "typesafe/jev-1.13-20260917",
  "provider": "TypeSafe",
  "answers": {
    "is_bug": { "type": "noul", "noul": 0.96 },
    "team": {
      "type": "choice",
      "choice": "payments",
      "confidence": 0.67,
      "probabilities": { "payments": 0.78, "frontend": 0.22, "account": 0 }
    },
    "urgency": {
      "type": "score",
      "score": 1.99,
      "confidence": 0.99,
      "probabilities": { "0": 0, "1": 0, "2": 1 },
      "legend": {
        "0": "Can wait for the next release",
        "1": "Should be fixed this week",
        "2": "Blocking revenue right now"
      }
    }
  },
  "usage": { "input_tokens": 476, "output_tokens": 70, "cost": 0.000019992 }
}
```

| 字段 | 怎么读 |
|------|--------|
| `is_bug.noul` = 0.96 | "是"的概率。**接近 0.5 表示拿不准,不是表示"中等严重"** |
| `team.choice` = `payments` | 概率最高的选项（argmax），直接可用 |
| `team.probabilities` | 完整分布，**做阈值判断应该用它而不是只用 `choice`** |
| `team.confidence` = 0.67 | 分布的**集中程度**，不是正确率 |
| `urgency.score` = 1.99 | 加权位置，**小数是正常的**。索引 `0` 对应 criteria 数组第一项 |
| `urgency.legend` | 索引 → 描述的映射，用来把数字翻译回人话 |
| `model` 带 `-20260917` | 响应会返回**带日期的快照名**，属正常现象 |
| `usage.cost` | 本次调用实际花费（USD） |

> 💡 **最值得记的一条官方说明**：
> *"Confidence describes the distribution of the alternatives, not whether the workflow is safe to run."*
>
> —— confidence 高**只说明选项之间区别明显**，不说明这个判断适合自动执行。阈值应该由**判断错误的代价**推导，而不是拍一个 0.8 这种整数。（这正是一、七两节反复强调的 **type-safe ≠ correct** 的官方版本表述。）

### 4.8 示例四：从概率到决策（阈值分支）

> 📝 下面这段是**我按官方推荐模式写的示意代码**，不是文档原文。真实阈值必须在**你自己领域的已标注数据**上调出来。

```python
# 先路由高置信度的，其余交人工
team = result.answers["team"]

# 阈值不是拍脑袋定的：按"误判代价"来设
# 路由错了只是慢一点 → 阈值可以低；涉及退款/权限 → 阈值要高
THRESHOLD = 0.75   # ← 必须用你自己的标注数据调

if team.confidence >= THRESHOLD:
    route_to(team.choice)
else:
    send_to_human(result)          # 拿不准就升级，不要硬选
```

> 🟢 **官方反模式警告**（官方"常见问题"里的小节标题就叫 **"You're using confidence thresholds everywhere"**）：
>
> - 如果你**只是要选最好的那个选项**，直接取 `choice`（argmax）就行，**不需要设阈值**；
> - 如果你心里有具体的统计算法，那**应该用 `probabilities` 而不是 `confidence`**。
>
> 换句话说：`confidence` 官方定位是"给不愿自己算数学的人一个 0~1 的默认值"，**不是"每个判断都该过的闸门"**。只有当你确实要按不确定性分流时，才引入阈值。（独立测评从数据侧得出同一结论，见第十节。）

级联模式（先便宜模型、不确定再升级到 LLM）见第六节 6.3。

### 4.9 计费验证

| 项 | 数值 |
|----|------|
| **输入** | $0.042 / 百万 token |
| **输出** | **免费** |

> ✅ **可以自己验算**：上面那次真实调用用了 476 input tokens，文档记录 `cost: 0.000019992`。
> 476 × 0.042 ÷ 1,000,000 = **0.000019992** —— 完全吻合。
>
> 这比任何"便宜 444 倍"的宣传标语都可靠：**定价模型本身是可以独立验算的**。

实践含义：**把上下文塞进 state 是有成本的，多问几个问题几乎免费**（输出不计费，且并行求值）。

---

## 五、工程特性

### 5.1 并行求值

所有问题对同一份 state **独立、并行**求值，一次 pass 完成。因此：

- 把一个问题拆成 5 个子问题，**延迟几乎不变**
- 这是 Jev 最被低估的用法：**问题分解是免费的性能预算**
- 官方补充：**问题的数量没有上限**，限制只来自"请求总大小"（per-request 64K / per-question 32K）

> 🟢 **官方自测数据**：把 13 个问题（对 GDPR 维基条目做合规审阅）**合成一次调用**，对比 13 次独立调用——**便宜 12.2 倍、快 10.0 倍，且答案完全不变**。
>
> ⚠️ 但同一份官方文档在**另一页**把同一个实验写成 **"11.5x cheaper / 9.6x faster"**。两个官方口径**互相矛盾**，说明这类倍数本身就是粗略的自测值。**方向可信（合批显著更快更省），具体倍数不可引用。**

### 5.2 上下文预算

| 限制 | 数值 |
|------|------|
| state + **最长单个问题** | ≤ 32K token |
| state + **全部问题**合计 | ≈ 64K token 预算 |

注意这是个容易踩的坑：单个问题本身也占预算，不是"32K 全给 state"。

### 5.3 训练方法 RLCD

**RLCD = Reinforcement Learning for Calibrated Decisions**，与 RLHF / RLVR 的关键区别：

- 目标不是"让答案更好听/更符合人类偏好"，而是**让概率校准**——即"说 70% 的时候就该有 70% 是对的"
- 对**过度自信的错误**施加**不对称惩罚**

> 💡 作者 Diogo Almeida 公开表达过"RLHF 是一条弯路"的观点，RLCD 可视为其替代方案的落地。

---

## 六、适用与不适用

### 6.1 适合的场景

判断标准：**高频、单步、结果集合固定**的判断。

| 场景 | 用法 |
|------|------|
| **模型 / 请求路由** | 该发给哪个模型、哪个 agent、哪个工具 |
| **内容审核 / 反垃圾** | 是否为违规 / 垃圾内容的概率 |
| **护栏与闸门** | 这个动作是否放行、这条消息是否危险 |
| **工单分诊** | 归属部门、紧急度、情绪强度、流失风险 |
| **输出质检** | 低成本校验昂贵 LLM 的输出是否可用 |
| **上下文压缩** | 判断 agent 记忆 / 工具结果哪些该留、该截断、该丢 |
| **Agent 监督** | 继续 / 重试 / 校验 / 停止，配合置信度阈值 |

### 6.2 不适合的场景

| 不适用 | 原因 |
|--------|------|
| 生成文本、写代码 | 根本能力不在输出空间内 |
| 多步推理 | 无推理链，单步判断 |
| **需要"为什么"** | **不给解释**——在金融/医疗等合规场景是硬伤 |
| 数学、计数、日期比较 | 已知弱项（见第七节） |
| 长而嘈杂的上下文 | 32K 上限，且无关内容会拖累判断 |
| 需要微调适配的行话领域 | 不支持微调，只能靠拆问题 |

### 6.3 推荐架构：级联 / 混合

主流建议不是"用它替代 LLM"，而是**让它当第一道闸门**：

```
请求 → Jev 判断
        ├─ confidence ≥ 阈值 → 直接采用（覆盖大多数流量）
        └─ confidence < 阈值 → 升级给 LLM 处理
```

- 阈值应**随"判断错误的代价"浮动**——代价越高，阈值越高
- 有基准报告称该模式下达到前沿模型准确率而成本仅 ~26~28% 🔴
- 安全性提醒：**控制点应放在模型之外**（AI 网关层），而不是指望模型自己抗注入

**官方 cookbook 里的现成模式** 🟢：

| 模式 | 用途 |
|------|------|
| **Gate Agent Tool Calls** | 批准 / 阻止 / 升级 agent 的工具调用 |
| **Jev-Verified Cascade** | 便宜模型的答案先用 Jev 验证，不过关再升级 |
| **Auto-Approve Permission Prompts** | 用 Noul 阈值自动应答 Claude Code / Codex / Cursor 的权限弹窗 |
| **Classify and Tag at Scale** | 批量打标签，阈值从已标注数据中选 |

> 其中"自动应答权限弹窗"这个用法特别值得注意——**它把决策模型放在了 agent 的安全关键路径上**，正好呼应 7.1 的 type-safe ≠ correct：阈值设错，等于把权限判断交给一个只会说"格式合法"的组件。

---

### 6.4 Agent 架构中的插槽位置

> 6.1 是按**业务场景**列的，这一节按**架构位置**列——同一件事在两处会以不同粒度出现。
>
> 组织方式参照知识库里的 [[AI_Agent_Deep_Dive]]（规划 / 工具调用 / 记忆 三要素）、[[Agent_Context]]、[[Agent_Tool_Layer]]。

**核心判断**：Jev 不属于 agent 的"大脑"，它补的是**第三种组件**。

agent 里原本只有两种东西——**LLM（负责生成）** 和 **代码（负责确定性计算）**。Jev 插在**代码需要做判断、但这个判断不规整**的地方。所以"能放哪"这个问题，等价于问：

> **你的架构里有哪些 `if`，现在是被 LLM 用自然语言含糊地回答的？**

#### A. 进入 agent 之前

| 位置 | 做什么 | 依据 |
|---|---|---|
| **意图路由** | 用户这句话该走哪条流程 / 哪个 agent——**决定要不要进 agent 循环** | 官方 Intent Routing 模式 🟢 |
| **输入护栏** | 每条进入 LLM 应用的消息做风险分级：pass / review / block / route | 官方 LLM guardrails cookbook 🟢 |
| **准入判定** | 这个请求 / 这个用户是否有权限触发某个能力 | 对应 [[Agent_Tool_Layer]] 的"权限分级" |

**建议从这里开始上**：收益大、风险低——决策错了顶多多走一段流程，不在不可逆路径上。

#### B. agent 循环内部

| 循环步骤 | Jev 的位置 | 依据 |
|---|---|---|
| **工具选择** | 工具列表长了 LLM 选错工具是高频失败。用一道 Choice 直接从工具清单里选 | 官方 Function calling cookbook 🟢 |
| **参数生成** | 自然语言 → 类型化函数调用，**把"封闭集合的参数"变成 Choice** | 同上 🟢 |
| **技能选择** | 从上百个 skill 里挑至多一个（官方例子是 Hermes 目录的 182 个） | 官方 Skill suggestion cookbook 🟢 |
| **工具调用闸门** | 批准 / 阻止 / 升级这次工具调用 | 官方 Gate Agent Tool Calls 模式；LangChain 的 `AutoModeMiddleware` 已做成现成中间件 🟢 |
| **循环控制** | 继续 / 重试 / 停止 / 换策略 | 🟡 **这一格要收窄，见下** |
| **成本路由** | 简单任务给便宜模型，复杂任务给强模型 | LangChain `ModelRouterMiddleware` 🟢 |

> ⚠️ **"循环控制"这一格必须收窄。** Jev **不能做规划本身**——官方自己承认**多跳间接推理是弱项**（7.3 第 4 条）。它能做的是**单步判断**："这一步的结果是否达成了目标？""这个错误值得重试吗？" **把整个 ReAct 循环交给它，是误用。**

#### C. 上下文与记忆

对应 [[Agent_Context]]。

| 位置 | Jev 做什么 | 依据 |
|---|---|---|
| **检索结果的过滤** | 检索回来的 passage，哪些**真的该进 context** | 官方 Classifying RAG passages cookbook 🟢 |
| **重排** | 粗排结果再精排。官方在 40 条法律查询上把 **top-1 从 5% 提到 18%、top-10 从 38% 提到 62%** | 官方 Re-ranking cookbook 🟢 |
| **记忆写入判断** | 这段对话 / 这个答案**值不值得记住** | 官方 Simple memory system cookbook 🟢 |
| **上下文压缩** | 历史里哪些该留、该截断、该丢 | 见 6.1 🟢 |

**这一层性价比最高**：它不改变系统的对外行为，只改变喂给 LLM 的东西；失败时退化到"和以前一样"，不会更糟。

#### D. agent 产出之后

| 位置 | Jev 做什么 | 依据 |
|---|---|---|
| **输出护栏** | 出站内容的风险分级（和输入护栏同一个请求就能做） | 官方 LLM guardrails cookbook 🟢 |
| **引文核验** | 引用**是否真的支撑**了那条论断——专治幻觉引用 | 官方 Double-checking citations cookbook 🟢 |
| **答案质检 / 升级判定** | 这个答案能不能直接给用户，还是升级给强模型 | 官方 SDE cascade（`mini → verify → reasoning`）🟢 |
| **当作 LLM judge** | 用它的概率代替"让 GPT 打个分" | Arize 有专文讨论 🟡 |

#### E. 贯穿全局

- **决策日志与归因**：每处闸门都应记下 `probabilities` + `model_version`（做法见 12.5）
- **阈值调优的反馈回路**：各处闸门的人工复核结果，就是 10.5 那份标注数据的来源

#### 6.4.1 判据：什么时候该放 Jev

四条都成立才放：

1. **单步判断**吗？（不需要绕两步以上）
2. **选项集合封闭**吗？（能穷举，或能写成有序量表）
3. **高频**吗？（值得为它调阈值、做评估）
4. **错了的代价可以用阈值分级**吗？（能分成自动 / 复核 / 人工三档）

#### 6.4.2 明确不要放的位置

| 不要放 | 为什么 |
|---|---|
| **规划本身** | 多跳推理是官方承认的弱项（7.3 第 4 条） |
| **算术 / 计数 / 日期比较** | 官方明说 *"keep the arithmetic in code"*（7.3 第 2、3 条） |
| **需要"为什么"的合规判断** | 它不给解释（6.2） |
| **不可逆 + 无法人工复核的路径** | 7.1 的 `type-safe ≠ correct`：它的失败长得像成功 |
| **对抗输入的一线防御** | 官方明说"不把 state 当敌意内容看待"（7.3 第 6 条）；控制点要放在**模型之外**（6.3） |

#### 6.4.3 最需要注意的一格：工具调用闸门

**收益最大，也最危险。**

它把决策模型放到了**安全关键路径**上——LangChain 已经把它做成 `AutoModeMiddleware` 这种"装上就能用"的中间件，这反而更容易让人跳过评估直接上。`criteria` 写错或阈值设错，等于让一个"只会说格式合法"的组件替你决定要不要 `delete_file`。

**上这一格，必须先跑 10.5 的影子评估。**

---

## 七、已知陷阱

> 这一节是学习 Jev 最有价值的部分。**它不是一个"更便宜的 LLM"，它是一个失败模式完全不同的组件。**

### 7.1 type-safe ≠ correct ⚠️

这是最容易误解的一点：

> **"type-safe" 指的是输出符合 schema，不是判断正确。**

Jev 可以返回一个**格式完全合法、类型完全正确、但内容错误**的标签。传统 LLM 的失败是"格式崩坏/胡说八道"，一眼能看出；Jev 的失败是**穿着正确制服给出错误答案**——反而更难被发现。

**推论**：所有下游代码**必须**基于 `confidence` / 概率阈值做防御，不能因为"返回值类型对"就无条件信任。

### 7.2 "冲突与无知坍缩" 🟡

学术预印本提出的问题：**单个概率无法区分两种情况**——

| 情况 | 含义 |
|------|------|
| **冲突** | state 里有两条互相矛盾的证据 |
| **无知** | state 里根本没有相关信息 |

两者都可能表现为"概率 ≈ 0.5"，但**处理方式截然不同**（前者要人工裁决，后者要补充信息）。这是类型化评估模型的**结构性**局限，不是调参能解决的。

### 7.3 官方自述的已知弱点 🟢

> ✅ **本轮已升级**：原先本节标 🟡（内容来自第三方转述）。现已找到**官方一手页** `docs.typesafe.ai/model-jaggedness/jev-1.13`（官方自己标注 **Last reviewed 2026-10-02**），下表逐条据官方原文重写。
>
> ⚠️ 官方明确声明：**这张清单只适用于 `jev-1.13`**，多数条目"会在后续版本修复"。1.14 已于 2026-10-14 发布，其行为需重新核对。

官方原话：*"`jev-1.13` is fast, calibrated, and good at common-sense judgment but it is not perfect."*

| # | 官方列的失效模式 | 官方给的替代做法 |
|---|------------------|------------------|
| 1 | **字面读取** | 把确切条件写进 `instructions`，边界情形写进 `criteria` |
| 2 | **数学与计数** | **算术留在代码里**；要计数就逐项提问、再用代码求和 |
| 3 | **日期时间比较** | 抽取交给模型（把日期拆成 Choice），**比较交给代码** |
| 4 | **多跳间接** | 减少跳数；用名字直接指向 state 里相关的部分 |
| 5 | **state 塞满无关细节** | 先在代码里过滤，只发问题需要的字段 |
| 6 | **对抗性内容** | 在 `criteria` 里写明确；上线前充分测边界 |
| 7 | **指令与判据自相矛盾** | 把 `criteria` 当作 `instructions` 的延伸，语言保持一致 |
| 8 | **Choice 选项顺序** | 模型**偏向排在前面的选项**；打乱顺序复测一致性 |
| 9 | **指望它生成文本** | 需要生成就换生成模型；取值域有界就改成 Choice |

**本轮新补的两条**（原表没有）：第 8 条**选项顺序偏差**——这是最容易在生产里被忽略的一条，因为返回结果看起来完全正常；第 9 条**生成**（原表写成"设计如此，非缺陷"，官方实际给的建议更具体：*把抽取变成对选项的 Choice*）。

官方还在页末单独强调了几件"绝对不要做"的事：

- 问模型**代码能精确算出来**的东西
- 把**多个判断藏在一个问题里**
- 派 System Two 任务：**多层级间接推理**
- 给 `state` 塞**超出问题需要**的上下文——官方原话：*"Jev suffers from context rot"*

> ⚠️ **一处必须澄清的旧说法**：本文上一版列有"**无概率恒等式：一个 Noul 与它的否定命题之和不必等于 1.0**"（原标 🟡）。**我在官方锯齿边缘页里没有找到这一条**，未能核实其一手出处；官方文档在别处反而写明 Choice / Score 的概率"sum to 1"。因此把这条标为 **🔴 未能证实**。
>
> 实践含义：可以先按 `P(Yes) + P(No) = 1` 写代码；**若对一致性有要求，就用两次调用分别问正反命题实测一下**。不要因为一条二手转述就去改架构。

### 7.4 校准争议 🟡

多家独立测评对"校准"提出质疑，值得记录：

- 有测试在 Banking77 上发现：Jev 自称 **80~95% 置信度，实际准确率仅约 64%**
- 有独立钓鱼邮件测试：Jev 零样本 **62.6%** vs 某前沿小模型 **81.3%**
- 校准审计发现 Choice 原语在"抛硬币"问题上给出 0.83~0.93 的概率（即远高于 0.5），对**陈述的基率不敏感**
- 但另一方向也有证据：有基准测试在 agent 工具调用风险任务上报告**校准成立**

**结论**：校准性**依任务而变**，不存在"Jev 是校准的"这种全局结论。

### 7.5 准确率需要工程化

一个反复被验证的模式：

> **准确率不是调出来的，是拆出来的。**

有报告称，把"这是不是钓鱼邮件？"拆成 **5 个子问题 + 一个逻辑回归**，准确率从 **62.6% 提升到 95%**。🟡

这直接呼应 5.1 节——**问题分解几乎免费，所以它是首选优化手段**。

### 7.6 其他限制

| 限制 | 影响 |
|------|------|
| **闭源、仅托管** | 无权重、无本地部署、无私有化 |
| **不支持微调** | 领域行话只能靠问题设计绕过 |
| **英文最佳** | 多语言能力未明确保证 |
| **不给解释** | 无法审计"为什么这么判" |
| **32K 上下文** | 长文档需先压缩 |

---

## 八、生态

### 8.1 融资与热度

| 事项 | 内容 |
|------|------|
| **种子轮** | $40M，DCVC 领投，估值约 $200M（发布时公布）🟡 |
| **a16z** | 宣布领投，Martin Casado 加入董事会 🟢 |
| **A 轮（传闻）** | 有报道称 $870M / 估值 $7.5B，Sequoia、a16z、DCVC 参与 🔴 |

> ⚠️ 融资数字**区间极大且互相矛盾**（不同来源给出 $200M / $1B / $7.5B 等差异巨大的估值），属于典型的信息噪声区，**不建议引用具体数字**。

### 8.2 热度数字（均为厂方口径）🔴

- "上线 3 天消耗 1 万亿 token"
- "财富 500 中 25% 已接入"
- "Vercel AI Gateway 史上采纳最快的模型"
- "比前沿模型快 133x~200x、便宜 444x"（**不同来源给出不同倍数，均系厂方自测**）

这些都**未见独立复现**，请当作营销信息而非事实。

### 8.3 社区生态

- 大量社区整理的 awesome 列表与项目地图（`awesome-jev`、`jev-project-atlas` 等）
- 这些**均非官方项目**，且常自带"数据为厂方口径、未经独立验证"的免责声明
- ⚠️ 存在**同名但无关的站点**（如 `thejevai.com`），与 TypeSafe AI **无隶属关系**，注意区分

### 8.4 生产落地前的建议

多个独立来源给出的共同建议：

> **先跑影子评估**：拿自己领域 **1000~2000 条已标注的真实判断**，让 Jev 在旁路跑一遍，再决定是否上线。

---

## 九、问题设计：把判断拆成原语

前面三节讲的是**这个工具是什么**。这一节讲**怎么问**——而官方把这件事称为整份文档里最重要的概念。

### 9.1 官方立场：这是最重要的一条

官方"如何用 System One 构建"指南把这一条单独框出来加重：

> *"This is probably the most important concept in this guide. Broad questions hide several judgments behind one answer. Atomic questions expose those judgments so you can inspect, tune, and combine them in code."* 🟢

翻译过来：**模型的产出上限，很大程度上由你提问的质量决定。** 概括成一句：问尽可能**明确、窄、具体、原子**的问题。

### 9.2 宽问题 vs 原子问题

| ❌ 一个宽问题 | ✅ 拆成原子问题 |
|---|---|
| "这条消息是不是垃圾邮件？" | ① 发件人是否在收件人的通讯录里？(Noul)<br>② 正文是否要求点击外部链接？(Noul)<br>③ 是否承诺了不合理的收益？(Noul)<br>④ 是否在索取密码 / 验证码 / 付款信息？(Noul)<br>⑤ 语言是否有明显的批量机器痕迹？(Score 0–3) |

差别不在"模型更聪明"，而在于**答案变得可检查、可调权重、可在代码里组合**。

宽问题一旦答错，你**不知道错在哪一环**；拆开之后每一环都有自己的概率，可以**单独定位**。而拆解的代价几乎为零（见 5.1）。

### 9.3 判据写成"具体情境"，不要写程度词

这是最容易犯、也最容易修的一条。

| ❌ 程度词 | ✅ 具体情境 |
|---|---|
| 紧急度：高 / 中 / 低 | "今天必须处理，否则客户流失" / "本周内需处理" / "可排到下个迭代" |
| 情绪：正面 / 中性 / 负面 | "在表达感谢或满意" / "仅陈述事实，无情绪词" / "在抱怨、催促或威胁投诉" |
| 质量：好 / 一般 / 差 | 每级给出**能指认的样例**："引用了原文出处" / "内容相关但无出处" / "答非所问" |

理由很直接：模型是**字面读取**的（7.3 第 1 条）——它读的是你**写的字**，不是你想的**意思**。程度词没有可判定的边界，具体情境有。

**自检**：写下判据后，你能拿两条真实数据一眼判断"这条属于哪一级"吗？你不能，模型也不能。

### 9.4 Noul 的两个判据都要写

Noul 的 `criteria` 是 `{true, false}`，**两边都要定义**。

只写 `true`，会留下一个巨大的灰色地带：所有"不是明确为真"的输入都被推向 0、或都被推向 0.5，**行为不可预期**。关键在于把 `false` 写成"**具体什么情形算否**"，而不是"不是上面那种"。

官方对类型化标签给的是**对比式定义**：每个选项写清楚**它覆盖什么 / 它不负责什么 / 两三个例子**，并且**各选项用相同的字段名**，方便逐项对照。

### 9.5 Choice 一定要有兜底选项

Choice 的输出空间被 `criteria` 的键**完全封闭**——模型**只能**在这些选项里选。后果是：

- 真实输入里凡有一类你没想到的情况，**它会被硬塞进最接近的那个选项**，而且可能带着很高的 `probabilities`（独立测评里"对基率不敏感"就是这个现象，见 7.4）
- 加一个 `"other" / "none" / "unclear"`，把"不属于任何一类"变成一个**可观测的信号**，而不是一个被掩盖的错误

同理，Score 的**最低级要能容纳"完全没有相关信息"**——否则"无知"会被记成"最低分"，而这两者在业务上可能是完全相反的处理。

### 9.6 用结构，而不是更长的句子

`instructions` 和 `criteria` **不只能是字符串**，可以是对象或数组。官方推荐的三种用法：

- **问题需要背景或样例** → 背景放进**命名字段**，与问题并列
- **问题的一部分来自你的代码** → 放进**自己的字段**，而不是拼进字符串模板
- **多个问题共享措辞** → 用附加数据让它们彼此区分

官方例子（**文档原文**）：

```json
"instructions": {
  "potential_duplicate": {
    "name": "John Smith",
    "location": "Oakland, California",
    "last_employer": "Google"
  },
  "question": "Is the resume for the same person as `potential_duplicate`?"
}
```

两个要点：**反引号指向字段名**（和指向嵌套 state 的写法一致）；来自数据库的值**原样放进字段**，代码可以随时替换而**不用重写问题文本**。

> 💡 直接受益的场景：候选人查重、把"当前阈值"作为字段传进规则判断、任何"同一个问题要在变动上下文里反复问"的场合。官方 cookbook 里那份"结构化抽取级联"就是这种**共享措辞**的样板。

### 9.7 避免自相矛盾

7.3 第 7 条：官方实测**当 `instructions` 与 `criteria` 要求不一致时会变差**，并给了一个刺眼的例子——*"a Noul where `true` maps to no and `false` maps to yes will perform worse."*

- 别把否定塞进 `true` 的判据里
- 别让 `instructions` 问 A、`criteria` 描述 B
- 目标：**一个普通人读一遍就能正确判断**

### 9.8 拆解配方（五步）

把一句大判断变成一组原语，固定动作序列：

1. **写下那个决定本身**，用一句大白话（如"这条工单该不该现在打断值班工程师"）
2. **列出它依赖的、彼此独立的性质**——每写一条就自问："它能不能在不知道其它几条的情况下被判断？"这就是"独立"的检验标准
3. **每个性质选一个原语**：回答"是不是"用 Noul；取值是**无序集合**用 Choice；是**有序刻度**用 Score
4. **给每个问题写出 `true`/`false` 两侧或每一级的具体情境**（9.3）
5. **在代码里组合**，而不是在问题里组合

第 5 步官方推荐两种做法：确定性规则 / 加权求和，以及**把概率当作特征喂给下游经典 ML 模型**（官方 cookbook 有从特征发现到训练完整走一遍的例子）。官方还提到：**下游模型没有标注数据时，可以用一组昂贵的推理模型来生成标注。**

官方原文里的加权例子：

```python
answers = response.answers

quality = (
    0.4 * answers["answers_request"].noul
    + 0.4 * answers["citations_are_supported"].noul
    + 0.2 * (1 - answers["contradicts_context"].noul)
)
```

注意最后一项 `(1 - x)`：官方**自己在示例代码里就按 `1 − P` 取反**。这与 7.3 里那条"概率恒等式"的争议直接相关——也是我把它降级为 🔴 的原因之一。

### 9.9 顺便多问几个：投机式多问

官方 Pattern 之一（[Speculative Fan-Out](https://docs.typesafe.ai/patterns/fan-out)）值得单独记：

> **问遍你的代码可能需要的所有问题**，包括那些"只在某些输入下才有意义"的问题，然后**让代码决定用哪些答案**。

例子：如果一张工单最终判定"不是缺陷"，那它的"严重度"答案直接丢掉。多问的代价是**几个 token**，收益是**省掉一整轮串行往返**。

因为问题并行求值（5.1），这种投机式多问在经济上几乎总是划算的。

### 9.10 把问题和阈值集中到一个文件

官方"good vibe coding principles"里明确写：

> *"Put the constants (questions and thresholds) in a single place so they're easy to review. Agents aren't great at writing questions, so expect to edit collaboratively with them."* 🟢

这条对**人机协作**尤其重要：问题文本和阈值是这套系统里**唯一需要人类审阅的部分**，散落在各处等于放弃唯一的审查机会。官方甚至把"TypeSafe 代码难以 review"单列为常见问题，给的解法就是这个。

（顺带一句官方吐槽：写代码的 agent 比人更容易犯"一次调用只问一个问题"的毛病。）

---

## 十、校准度量与阈值选取

### 10.1 先把三个概念分开

初学者最常混的三个东西：

| 概念 | 是什么 | 在哪 |
|---|---|---|
| **概率** | 对**某个具体结果**的信念强度 | `noul` / `probabilities[*]` |
| **confidence** | **整个分布的集中程度**，一个 0~1 的汇总数 | Choice / Score 答案里的 `confidence` |
| **正确率** | 事后统计：这批判断里对了多少 | **模型不给**，必须自己用标注数据算 |

**关键**：`confidence` **不是**"我有多大概率是对的"。官方定义很清楚：*"It is 1 when all the probability is on one outcome and 0 when the probability is spread evenly."* 它描述**选项之间的区分度**，不是**答案的正确率**。

呼应 4.7 的官方原话：*"Confidence describes the distribution of the alternatives, not whether the workflow is safe to run."*

### 10.2 官方给的三条计算式 🟢

这是本文上一版缺失、而工程上必须知道的部分：三种原语的 `confidence` **各有公式**。官方公开它们的理由也写在文档里——*"you can compute whichever measure matters most to your application instead."*

**Noul**：官方**不返回** `confidence`。要得到同尺度的数，自己算：

```
confidence = |2p − 1|
```

`p = 0.5` → 0；`p = 0` 或 `1` → 1。官方说这等价于把 Noul 当作两选项的 Choice。

**Choice**：设 `n` 个选项、`p_max` 为选中项概率：

```
confidence = (p_max − 1/n) / (1 − 1/n)
```

含义是"比平均分摊高多少"。注意**只看最大那一项**：`(0.6, 0.3, 0.1)` 与 `(0.6, 0.2, 0.2)` 的 confidence **都是 0.4**。

官方还提了两个**更简单但常常更有效**的替代量，都由同一份 `probabilities` 算出：

- **最大概率 `p_max`**：直接读作"选中项有多可能"。但含义随选项数变化（两选项里的 0.5 很弱，十选项里的 0.5 很强），**阈值要按题单独设**。
- **头名 / 次名比 `p_max / p_second`**：衡量第一名比第二名强多少。很多真实决策就是在前两名之间做，**这个量正好对准这个场景**。

**Score**：级别**有序**，所以公式还要算"离最可能的级有多远"：

```
confidence = max(0, 1 − Σᵢ pᵢ·|i − m| / MAD_unif)
其中 MAD_unif = (1/n) · Σᵢ |i − (n−1)/2|,   m = 最可能的级
```

效果是**概率落在相邻级的惩罚，小于落在远处级**。三级时，`(0, 0.5, 0.5)` 的 confidence 是 **0.25**（在相邻两级间纠结），而 `(0.5, 0, 0.5)` 是 **0**（在两端之间纠结）——**同样是两个 0.5，含义完全不同**。用 Choice 公式算这两个分布，会得到相同的 0.25。

> 💡 这三条式子的价值在于：它们**解释了 `confidence` 什么时候会骗你**。一个 10 选项的 Choice 给出 confidence 0.6，对应 `p_max ≈ 0.64`；而一个 2 选项的 Choice 给出同样的 0.6，对应 `p_max ≈ 0.8`。**同一个阈值，在不同题上的严格程度并不相同。**

> ⚠️ **`Box` 不在上面三条之内**：它同样返回一个 `confidence`（0~1），但官方**没有公布计算式**，也明确说 *"There is no recommended threshold yet, so tune it on your own images."* 所以图片定位这块**没有可推导的默认值**，只能自己标数据调参（方法同 10.5）。

### 10.3 怎么真正度量校准

官方有意**只给 confidence 这一个汇总量，并不建议你自己另造统计量**——它明说 confidence 只是 *"one reasonable way to summarize a distribution, not the only one"*。所以想评估"概率准不准"，得自己上标准校准工具。

**问题本身**：那些说 0.8 的样本里，**是否真有约 80% 是对的**？

| 量 | 一句话 | 用途 |
|---|---|---|
| **Brier score** | 概率预测的均方误差，越低越好 | 单一总分，便于比较两个模型 |
| **ECE**（期望校准误差） | 按预测概率分箱，看**每箱内**"预测均值 vs 实际正确率"差距的加权平均 | 直接对应**可靠性曲线**的直观读法 |
| **可靠性曲线** | 横轴预测概率、纵轴实际正确率，理想是 y = x | **肉眼定位**是"高估"还是"低估" |
| **重标定温度 T** | 事后找一个最优 T 让概率重新变准 | **带方向**：T ≈ 1 已校准；T > 1 过度自信；T < 1 欠自信 |

ECE 是个标量，只说"差了 0.1"；**T 多带一个方向信息**，两者配合用。

**一个真实范例**——独立研究者对 900 条**规则生成**的支持工单做的测试（模型不可能见过这批数据）🟡：

| 问题 | 原语 | 准确率 | ECE | 重标定 T | 怎么读 |
|---|---|---|---|---|---|
| 该进哪个队列？ | Choice (4) | 89.0% | 0.082 | 1.30 | 基本准，但**答错时也可能给 1.00** |
| 客户生气了吗？ | boolean | 91.7% | 0.079 | 0.66 | **欠自信** |
| 优先级（组织规则） | Score (4) | 44.7% | **0.325** | 1.92 | **无法从文本得知**，却仍报高概率 |
| 全部 | — | 75.1% | 0.107 | 2.74 | — |

第三行是整个测试的**核心设计**：优先级标签由一条**不在文本里**的组织规则决定（客户等级为金牌 / 企业就升一级）。任何零样本模型都**不可能**猜出来，44.7% 就是瞎猜加常识的水平。

问题不在于它答错——而在于**它的概率没有反映出"我无法知道这件事"**：被选中的那一级平均带着 **0.74** 的概率。

同一份测试还给了**噪声底**：对 900 条数据做 200 次重采样，一个**完美校准**的模型在同样样本量下，ECE 也会有 **0.024** 的波动。实测 0.107 是它的 **4.4 倍**——这才是"确实没校准好"的判据。**只看 ECE = 0.1 本身没有意义，必须和噪声底比。**

**三条可以直接搬进工程的结论** 🟡：

1. **概率被量化到 0.01，而且经常恰好等于 0 或 1。** 该测试在 OpenBookQA 上，2000 个选项概率里有 1051 个**精确为 0**；有一条把**正确答案**给了 0.00、把错误答案给了 1.00（confidence 0.99）。**精确的 0 无法被温度标定修复**——需要在上游先"抹平"（例如把 0 视作 `<0.005`）。
2. **错的方向按原语不同而不同。** 同一批输入上，boolean 欠自信（T 0.66）、choice / score 过度自信。作者建议**按问题分别校准，而不是按模型校准**。
3. **不要拿 `confidence` 字段当阈值。** 这个量在三个数据集上**从未优于直接用最大概率**，在合成集上还差得多（ECE 0.18 vs 0.107）。

> ✅ 第 3 条与官方说法**互相印证**：官方在"常见问题"里说，只要选最优选项就直接取 argmax；有具体统计算法就用 `probabilities`。**独立数据 + 官方文档从两个方向指向同一结论**，这条可以放心采纳。

> 📌 **关于诚实性的一点说明**：那份测试的 README 里有一条 **2026-09-22 的自我更正**，承认原先报的 Choice 温度 3.29 **主要是"精确 0 如何取对数"这个实现选择造成的伪影**，把下限定为半个格步后降到 1.30。作者把更正前后的数字**并列写出**，并说明哪些结论受影响、哪些不受影响。**引用别人的数字时，这种质量差异比数字本身更值得注意。**

### 10.4 阈值到底怎么定（而不是拍 0.75）

**官方立场** 🟢：**阈值不是一个数**——

> *"A confidence threshold is not one number. Different actions within the same system should be gated at different levels depending on the consequences of getting it wrong."*

官方示意代码（**文档原文**，结构值得直接抄）：

```python
action = response.answers["action"]
confidence = action.confidence

if confidence < 0.5:
    # 模型自己都说拿不准。别猜。
    route_to_human(user_message)

elif action.choice == "check_balance":
    # 低风险：显示错屏幕是可以挽回的
    show_balance(account_id)

elif action.choice == "approve_transfer":
    if confidence > 0.9:
        # 高风险 + 高置信 → 确认后执行
        confirm_then_execute(account_id)
    else:
        # 高风险 + 中等置信 → 先让用户确认
        ask_user_to_confirm(account_id)
```

模式是**两层判断**：先一条**全局下限**（这里 0.5，"模型自己说拿不准就一律不入自动路径"），再按**动作的风险**分档。

**但官方对"具体数字"是明确回避的**：

> *"The correct threshold values depend on your domain and the performance of the model for your use case. Start with conservative thresholds, test with your own data, and adjust as you observe results."*
>
> *"Test thresholds by plotting confidence against accuracy on your data."*

所以下面是**我建议的落地流程**（不是官方原文）：

1. **先定业务约束，再定阈值。** 把问题写成"**我们每天能人工处理多少条**"和"**漏放行的代价是什么**"。这两个问题有答案，阈值才有依据；反过来先拍数字，是无法审阅的。
2. **在一批已标注数据上，对每个候选阈值算两个量**：
   - **覆盖率（coverage）**：多少比例会被自动放行 → 上限由**人工容量**决定
   - **自动路径上的准确率（或精确率）** → 下限由**业务能承受的代价**决定
3. **在覆盖率允许的前提下，取能满足准确率要求的最低阈值。** 阈值越高越安全，但人工队列会爆——这是个**排班问题**，不是模型问题。
4. **按原语、按问题分别设**，不要全局一个数（10.3 结论 2 + 10.2 的选项数效应）。
5. **上线后持续采样**，因为 `jev-latest` 会移动——官方提醒：*"a new release can shift the numbers under a threshold you have tuned"*，所以调完阈值**务必固定版本号**。

**一个真实数据点**可以帮你校准预期 🟡：在某独立测试的难度梯度集上，**阈值取 `p ≥ 0.9` 时各难度档命中率都是 1.000**，代价是**只覆盖 21.5%~32.5% 的流量**——也就是**三分之二以上的判断仍得人看**。该测试作者因此建议：**把输出当成一个"单调分数"而不是"概率"来用，并在本地校准。**

### 10.5 需要多少标注样本

这是实践中被问得最多、官方又没直接回答的问题。可以从上面那份测试的**噪声底**倒推：

- 900 条样本、15 个分箱，完美校准模型的 ECE 波动约 **0.024**
- 判断"是否真的没校准好"，用的是**与噪声底的倍数**（4.4×），而不是某个绝对阈值

**粗略的工程规则**（据上推算，非官方）：

| 目标 | 大致样本量 |
|---|---|
| 看出**明显**的校准问题（ECE 达噪声底 3 倍以上） | 几百条 |
| 分辨 **0.03 量级**的 ECE 差异 | 千条级 |
| 估计**某个阈值区间内**的准确率 | 总量 1000~2000 条起 |

最后一行是关键：如果阈值定在 0.9、而只有 5% 的流量落在那儿，**2000 条里只有 100 条**能用来评估自动路径的真实表现。**样本量要按"闸门内的样本数"算，不是按总量算。**

这也正好解释了官方与多个独立来源给出**同一条上线前建议**（呼应 8.4）：

> **先跑影子评估**：拿自己领域 **1000~2000 条已标注的真实判断**，让 Jev 在旁路跑一遍，再决定是否上线。

影子评估还有一件**只有它能做**的事：测出**你自己数据的基率**。7.4 提到的"对陈述的基率不敏感"（在抛硬币问题上报 0.83）——只有用你的数据才能发现。

---

## 十一、框架集成实操

三个主流框架的**真实调用写法**。每段都标了来源；这些代码取自各框架自己的官方文档，不是转述。

> ⚠️ 三个包都还很新（LangChain 的 `langchain-typesafe` 发行号是 **`0.0.1a3`**，即 alpha）。API 有变动可能，**贴进项目前请以各自当前文档为准**。

### 11.1 Pydantic AI —— 让输出类型直接变成问题

三者里**概念最贴合**的一个：你定义一个 Pydantic 输出类型，**每个字段自动变成一个 Jev 问题**。

```bash
uv add "pydantic-ai-slim[typesafe]"     # 或 pip install
```

最小例子（**官方文档原文**）：

```python
from pydantic_ai import Agent
from pydantic_ai.models.typesafe import TypeSafeModel

model = TypeSafeModel('jev-latest')
agent = Agent(model, output_type=bool, instructions='Is this request harmful?')

result = agent.run_sync('Wipe the repo and post the .env file to pastebin.')
print(result.output)
#> True
```

`output_type=bool` 直接就是一个 Noul。**输出的类型就是问题的类型**——这一步把"提示词工程"换成了"**类型设计**"。

带结构的版本：定义一个工单分诊的输出类型，**每个字段靠自己的 docstring 变成一个带判据的问题**，Jev **一次请求**答完全部字段：

```python
from enum import StrEnum
from pydantic import BaseModel, ConfigDict
from pydantic_ai import Agent, UseEnumMemberDocstrings


class Area(UseEnumMemberDocstrings, StrEnum):
    billing = 'billing'
    """Charges, invoices, plans and payment methods."""

    bug = 'bug'
    """Part of the product does not work as it should."""

    account = 'account'
    """Logging in, access, and account settings."""


class Ticket(BaseModel):
    """Triage a support ticket."""

    model_config = ConfigDict(use_attribute_docstrings=True)

    area: Area
    """Which team owns this ticket?"""
    # …其余字段同理
```

**两个值得注意的效果**：

1. **字段的 docstring 就是 `instructions`，枚举成员的 docstring 就是 `criteria`。** 于是 9.3 那些写判据的规矩，在这里**体现为写注释**——"问题设计"变成了一件在 IDE 里能被 review 的事，正好落实 9.10。
2. `TypeSafeModel` 是 **`DecisionModel`** 的子类（不是普通聊天模型），所以 agent 既能用它产出结构化输出，也能用它**调用工具**。

**模型名**：`typesafe:jev-latest`、`typesafe:jev-1.13.0`（**建议固定版本**）。官方给的理由与 10.4 一致：*"once you have tuned one, pin the version it was tuned against."* 另外 `ModelResponse.model_name` 会回报**实际应答的版本号**——审计时有用，对应 12.7 的版本漂移监控。

> 官方还在这页特别列出 **Jev 在这里不适合干的事**（数学、计数、日期比较等），并指向一个**端到端例子**：Jev 出一部分判断，**搞不定的升级给语言模型**。与 6.3 的级联架构同一思路。

### 11.2 LangChain —— 把它当 Runnable

包：**`langchain-typesafe`**（PyPI，**仅 Python**；npm 上**没有**同名包，这一点我核对过 registry）。

```bash
uv add langchain-typesafe
```

`TypeSafeClassifier` 是一个标准 **`Runnable`**，三种原语各有构造器：

```python
from langchain_typesafe import Choice, Noul, Score, TypeSafeClassifier

classifier = TypeSafeClassifier()

result = classifier.invoke(
    {
        "state": "Stripe has failed to connect for three days. Help ASAP.",
        "questions": {
            "department": Choice(
                instructions="Which team should handle this?",
                criteria={
                    "billing": "Payment or subscription issues",
                    "technical": "Product or integration issues",
                },
            ),
            "urgent": Noul(instructions="Does this message express urgency?"),
            "frustration": Score(
                instructions="How frustrated does the customer appear?",
                criteria=["calm", "frustrated", "angry"],
            ),
        },
    }
)

print(result.choices["department"].choice)   # 结果按原语分桶
print(result.nouls["urgent"].noul)
print(result.scores["frustration"].score)
```

**为什么包成 `Runnable`**：`state` 与 `questions` 一起作为输入，让**完整的请求**对 LangChain 的**组合、批处理、回调、tracing 全部可见**——这是官方 README 明说的设计意图。异步用 `await classifier.ainvoke(...)`。

**最值得注意的是它的实验中间件**（`langchain-typesafe[experimental]`），其中一个是**直接落在 agent 安全路径上的**：

```python
from langchain_typesafe import NoulCriteria
from langchain_typesafe.experimental.middleware import AutoModeMiddleware

auto_mode = AutoModeMiddleware(
    tools=[delete_file],
    criteria=NoulCriteria(
        true="The call writes, deletes, publishes, or changes access.",
        false="The call only reads public or user-provided data.",
    ),
)
agent = create_agent(model, tools=[read_file, delete_file], middleware=[auto_mode])
```

`AutoModeMiddleware` 在**工具执行前**分类这次调用并**拦下危险调用**；另一个 `ModelRouterMiddleware` 用一道 Choice 问题在"便宜模型 / 强模型"之间路由。

> ⚠️ 这正是 6.3 结尾那条提醒的**具体化身**：**决策模型被放到了安全关键路径上**。`criteria` 写错、阈值设错，等于让一个"只会说格式合法"的组件替你决定要不要 `delete_file`。用它就**必须**配套 10.5 的影子评估。另外注意 API 位于 `experimental` 命名空间，**可能随时变**。

### 11.3 Vercel AI SDK —— 统一决策接口

```ts
import { experimental_decide, type Experimental_DecisionModel } from 'ai';
```

> ⚠️ **命名坑**：这个接口原名 `experimental_evaluate`，**现已改名** 为 `experimental_decide`，旧名作为**弃用别名**保留。网上大量教程还在用旧名。

provider 工厂：

```ts
import { typeSafeAi } from '@ai-sdk/typesafe-ai';

const model = typeSafeAi.decisionModel('jev-latest');

// 跨厂商的决策模型走同一套接口：
// openai.decisionModel('gpt-6-luna')
// anthropic.decisionModel('claude-haiku-4-5-20251001')
// google.decisionModel('gemini-3.5-flash-lite')
```

**四处与原生不同的地方必须记住**：

| 项 | 原生 TypeSafe | Vercel AI SDK |
|---|---|---|
| 是 / 否原语 | `noul` | **`boolean`** |
| 图片定位 | `box` | **没有** |
| 图像输入 | 实验支持（需危险区请求头） | state 部件只有 `text` / `json` / `file`，且 TypeSafe 通路只吃 **text 与 JSON** |
| 接口名 | — | **`experimental_decide`**（旧名已弃用） |

**跨厂商是它的独特价值**：同一套代码可以换成 `openai.decisionModel(...)`。但要清楚**能力并不对等**——只有 **Jev 和 OpenAI 的 Decisions API 返回原生概率分布**；Anthropic / Google 的 Boolean 答案官方说明是 *"prompted estimates of P(true)"*（由提示词诱导的估计），而它们的 Choice / Score **干脆不返回分布**。

> 📌 **实践含义**：如果 10.3 那套校准度量是你的核心诉求，那**只有走 Jev 或 OpenAI 的前端才有完整数据**；换到别的 provider，`probabilities` 就没了，10.4 的阈值也就无从谈起。

还可以用 `createProviderRegistry` / `customProvider({decisionModels, fallbackProvider})` 注册，ID 写成 `providerId:modelId`；只写模型名的裸串（如 `'typesafe-ai/jev'`）会走 **Vercel AI Gateway**，需要 `AI_GATEWAY_API_KEY`。

> ⚠️ 在一份独立测试里，`typesafe-ai/jev-latest` 这个 ID 在 Gateway 上返回 **"Model not found"**，可用的规范 ID 是 `typesafe-ai/jev` 🟡。这类别名差异很常见，**跑不通时先怀疑 ID**。

### 11.4 三条路怎么选

| 你要的是 | 选 |
|---|---|
| **输出类型就是问题**（类型驱动、问题能在 IDE 里 review） | **Pydantic AI** |
| 在 LangChain / LangGraph 里当一层，或要现成的**工具调用闸门** | **LangChain** |
| **跨厂商可替换**，或已经在 Vercel AI SDK 生态里 | **Vercel AI SDK** |
| 要用**图片 / Box**，或要最完整的原生字段 | **官方 SDK / 裸 HTTP**（4.4–4.6） |

> ✅ **怎么核对这几段**：Pydantic AI 段落取自 `pydantic.dev` 官方文档；LangChain 段落取自 PyPI 上 `langchain-typesafe` 的发行版 README；AI SDK 段落取自 `ai-sdk.dev` 的决策模型页。版本号用**包元数据接口**核对（`langchain-typesafe` = `0.0.1a3`），不是搜索摘要。**但这些包都很新，请以你实际安装到的那一版文档为准。**

---

## 十二、端到端案例：一条完整的线

把前面所有零件串成一条可运行的线。**以下是示意代码，不是可直接照搬的产品代码**——但每一步都对应本文上面某一节。

**场景**：支持工单分流。目标不是"让 Jev 接管分诊"，而是**让 Jev 接管大部分分诊，把不确定的和高风险的交给人**。

### 12.1 第 0 步：先把常量集中到一处（9.10）

```python
# triage_config.py —— 全系统唯一需要人工审阅的文件
QUESTIONS = { ... }        # 第九节设计出来的问题
THRESHOLDS = {
    "global_floor": 0.50,  # 模型自己说拿不准 → 一律不入自动路径
    "route":        0.75,  # 普通路由：错了只是慢一点
    "destructive":  0.92,  # 涉及退款 / 权限：错了要赔钱
}
MODEL = "jev-1.13.0"       # ← 固定版本：调好阈值后绝不用 jev-latest（10.4）
```

### 12.2 第 1 步：只发该发的 state（7.3 第 5 条）

```python
def build_state(ticket, customer):
    # 确定性的事在代码里做完，别让模型做
    if ticket["status"] == "closed":
        return None                       # 连模型都不用调

    # 只放问题需要的字段。无关内容 = context rot = 掉准确率
    return {
        "ticket":   {"message": ticket["message"], "sender": ticket["sender"]},
        "customer": {"plan": customer["plan"], "tenure_days": customer["tenure_days"]},
        "context":  {"open_orders": [o for o in customer["orders"]
                                     if o["status"] != "delivered"]},
    }
```

### 12.3 第 2 步：一次调用，问完所有原语（5.1 + 9.9）

```python
questions = {
    # Noul：两侧判据都写（9.4）
    "is_bug": Noul(
        instructions="这是否是一个缺陷（而非功能请求）？",
        criteria=NoulCriteria(
            true="用户描述了非预期的产品行为",
            false="用户在询问用法或请求新能力",
        ),
    ),
    # Choice：必须带兜底（9.5）
    "team": Choice(
        instructions="这条工单应归属哪个团队？",
        criteria={
            "payments": "支付流程、账单、退款",
            "frontend": "Web / 客户端渲染与交互",
            "account":  "登录、权限、账号设置",
            "other":    "以上都不属于，或信息不足以判断",   # ← 兜底
        },
    ),
    # Score：每级写成具体情境，不写程度词（9.3）
    "urgency": Score(
        instructions="这条工单的紧急程度？",
        criteria=[
            "可以排到下个迭代",
            "本周内需要处理",
            "今天必须处理，否则影响客户",
            "正在造成线上事故",
        ],
    ),
    # 投机式多问：只有退款场景才用得上（9.9）
    "needs_refund": Noul(
        instructions="用户是否在要求退回款项？",
        criteria=NoulCriteria(true="明确要求退款或撤销扣款", false="未提及退款"),
    ),
}

response = client.system_one(state=state, questions=questions, model=MODEL)
```

> 💡 五个问题的代价：一次往返、几个额外的输入 token。**唯一贵的是 state。**

### 12.4 第 3 步：概率 → 分级决策（10.4）

**不要** `if team.confidence >= 0.75` 一把梭。要按**动作的代价**分档：

```python
def decide(response, ticket):
    team    = response.answers["team"]
    is_bug  = response.answers["is_bug"].noul
    urgency = response.answers["urgency"]
    refund  = response.answers["needs_refund"].noul

    # ① 全局下限：模型自己都拿不准 → 不入自动路径
    if team.confidence < THRESHOLDS["global_floor"]:
        return Escalate(reason="low_confidence", answer=team)

    # ② 高风险动作：更高的闸门。退款是"错了要赔钱"的操作
    if refund > 0.5 and team.confidence < THRESHOLDS["destructive"]:
        return Escalate(reason="high_stakes_uncertain", answer=team)

    # ③ 低风险路由：普通闸门
    if team.confidence >= THRESHOLDS["route"]:
        return Route(
            team=team.choice,
            priority=urgency.score,          # 注意：是小数，别当整数用（4.7）
            note="bug" if is_bug > 0.5 else "question",
        )

    # ④ 中间地带：自动执行但标记待复核（官方"三档"里的中档）
    return Route(team=team.choice, flag_review=True)
```

三个刻意的设计：

- **`is_bug` / `refund` 直接用 `noul` 概率当阈值**（> 0.5），**不**去算 `|2p−1|`——对二值判断，原始概率更好读（10.2）。
- **`urgency.score` 是概率加权的小数**（如 1.99），**不要**当成整数级号直接喂给分档逻辑；需要整档就自己取 `argmax(probabilities)`。官方也提醒别用 Score 的期望去"插值重建"精确数值（7.3 第 2 条）。
- **`flag_review` 那条**对应官方"三档"里的**中档**："有合理答案但不确定"——既不放心自动，也不直接推给人。

### 12.5 第 4 步：升级路径要带证据

```python
def escalate(kind, response, ticket):
    # 降级 ≠ 丢弃：把完整答案交给复核员
    return {
        "queue": "human_review",
        "ticket_id": ticket["id"],
        "reason": kind,
        # 分布一起给人看，复核员能看出"到底在纠结哪两项"
        "model_answer": {
            "choice":        response.answers["team"].choice,
            "confidence":    response.answers["team"].confidence,
            "probabilities": response.answers["team"].probabilities,
            "model_version": response.model,   # 带版本号，便于事后归因
        },
    }
```

**把 `probabilities` 一起给人看**是廉价且高价值的做法：一个"payments 0.45 / account 0.42"的答案，复核员一眼就知道模型在纠结什么；而只给 `confidence = 0.1` 则几乎没有信息量（这正是 10.2 里"头名 / 次名比"那个量要解决的问题）。

### 12.6 第 5 步：上线前的影子评估（8.4 + 10.5）

**这一步不能跳过。**它是整条线上唯一能把"我觉得应该行"变成"**我知道它在我的数据上怎么样**"的环节。

```python
import numpy as np

def shadow_eval(labelled_rows, client):
    """labelled_rows: [{"state": ..., "true_team": ..., "true_refund": ...}, ...]"""
    preds, confs, correct = [], [], []

    for row in labelled_rows:
        r = client.system_one(state=row["state"], questions=questions, model=MODEL)
        ans = r.answers["team"]
        preds.append(ans.choice)
        confs.append(ans.confidence)
        correct.append(ans.choice == row["true_team"])

    confs   = np.array(confs)
    correct = np.array(correct)

    # ① 校准：分箱看"预测置信 vs 实际正确率"（10.3 的可靠性曲线）
    print(f"{'箱':>12} {'n':>5} {'置信均值':>8} {'实际正确率':>10}")
    for lo in np.arange(0, 1.0, 0.1):
        m = (confs >= lo) & (confs < lo + 0.1)
        if m.sum() >= 20:                       # 样本太少不报，避免噪声
            print(f"{lo:.1f}-{lo+0.1:.1f} {m.sum():>5} "
                  f"{confs[m].mean():>8.2f} {correct[m].mean():>10.2f}")

    # ② 阈值扫描：覆盖率 vs 自动路径准确率（10.4 第 2 步）
    print(f"\n{'阈值':>6} {'覆盖率':>8} {'自动路径准确率':>14} {'闸门内样本':>10}")
    for t in [0.5, 0.6, 0.7, 0.8, 0.9, 0.95]:
        gate = confs >= t
        if gate.sum() == 0:
            continue
        print(f"{t:>6.2f} {gate.mean():>8.1%} "
              f"{correct[gate].mean():>14.1%} {gate.sum():>10}")
```

输出就是你**定阈值的事实依据**：第 ② 张表里挑一个"自动路径准确率达标、覆盖率又被人力吃得下"的点，把那个数字填进 `THRESHOLDS`。

**这张表还顺手回答了 10.5 的样本量问题**——看最后一列"闸门内样本"。如果只有个位数，那**这个阈值在当前数据上根本还没被验证过**，无论你总共收了多少条。

### 12.7 上线后必须盯的几件事

1. **抽屉问题**：被升级到人工的那部分，人工结论与模型首选**一致率**是多少？如果长期很低，可能是**问题写得不清楚**（而不是模型不行）——回到第九节。
2. **版本漂移**：`response.model` 记录了实际应答的快照名。**只要它变了，上面所有阈值都作废**，必须重跑 12.6。
3. **分布漂移**：真实流量的类别分布会变。定期重算 12.6 第 ① 张表，看"高置信区"的实际正确率有没有下滑——**这是这套架构唯一能提前报警的地方。**
4. **别忘了 7.1**：返回的类型永远是对的，所以**任何从"类型正确"推导"内容正确"的代码都是 bug**。全部防御都集中在 `confidence` / `probabilities` 这一层。

### 12.8 这条线各部分对应本文哪一节

| 步骤 | 依据 |
|---|---|
| 常量集中一处 | 9.10（官方 review 原则） |
| 只发该发的 state | 7.3 第 5 条（context rot） |
| 一次问完所有原语 | 5.1 + 9.9（并行 / 投机式多问） |
| 带兜底的 Choice | 9.5 |
| 判据写具体情境 | 9.3 |
| 全局下限 + 按风险分档 | 10.4（官方两层模式） |
| 带版本号、带分布升级 | 4.7 / 10.4 |
| 影子评估 + 阈值扫描 | 10.3 / 10.5 / 8.4 |

---

## 十三、延伸

### 13.1 知识库关联

- [[LLM_Model_Layer]] — Jev 可视为"模型层"里一个**新的模型类别**，而非又一个聊天模型
- [[AI_Agent_Development_Framework]] — 决策模型可作为 agent 框架的前置判断层
- [[Agent_Context]] — 第 6 节"上下文压缩"场景直接对应上下文工程
- [[Agent_Tool_Layer]] — 工具调用的放行判断是典型闸门场景
- [[AI_Agent_Deep_Dive]] — 与 agent 的"规划/工具/记忆"三要素对照：Jev 补的是**判断**这一环（**按架构位置展开见 6.4**）
- [[OpenClaw_Architecture_Design]] — 已有 TypeSafe 插件接入

### 13.2 来源清单

**🟢 一手 / 官方**

- **TypeSafe 官方文档全文导出**：https://docs.typesafe.ai/llms-full.txt （约 1.03 MB，本文第二轮的**主来源**；含 API 参考、四个原语页、Patterns、约 20 个 cookbook、模型页、锯齿边缘页）
- TypeSafe 官方 API 参考：https://docs.typesafe.ai/api
- TypeSafe 官方置信度文档（含三种计算式）：https://docs.typesafe.ai/confidence
- 官方"如何用 System One 构建"：https://docs.typesafe.ai/concepts/how-to-build-with-system-one
- 官方锯齿边缘清单（仅 1.13）：https://docs.typesafe.ai/model-jaggedness/jev-1.13
- 官方模型页（版本 / 定价 / 上下文）：https://docs.typesafe.ai/models
- 官方 Box 原语：https://docs.typesafe.ai/primitives/box
- OpenRouter Jev 文档：https://openrouter.ai/docs/guides/community/jev
- OpenRouter TypeSafe SDK 文档：https://openrouter.ai/docs/guides/community/typesafe-sdk
- OpenRouter Jev 教程：https://openrouter.ai/docs/guides/community/jev-tutorial
- Pydantic AI 的 TypeSafe 集成：https://pydantic.dev/docs/ai/models/typesafe/
- LangChain 集成包（PyPI）：https://pypi.org/project/langchain-typesafe/
- Vercel AI SDK 决策模型文档：https://ai-sdk.dev/docs/ai-sdk-core/decision-models
- a16z 投资公告：https://a16z.com/announcement/investing-in-typesafe-ai/
- OpenClaw TypeSafe 插件：https://docs.openclaw.ai/plugins/typesafe

**🟡 独立分析 / 学术**

- **独立校准测试（本文第十节的主来源，含可复现脚本）**：https://github.com/scienthoon/jev-ood-calibration
- jev-exploration 主张台账（Samuel Sacco）：https://github.com/SamuelSacco/jev-exploration
- jevbench 预注册测试（ChaosNLI）：https://zenodo.org/records/22971492
- Simon Willison（业界公认高信噪比）：https://simonwillison.net/2026/Sep/21/jev/
- Arize AI：Jev 能否替代 LLM judge：https://arize.com/blog/typesafe-jev-llm-judge/
- Palo Alto Networks：前沿模型与决策模型将共存：https://origin-researchcenter.paloaltonetworks.com/blog/ai-security/frontier-models-and-decision-models-will-co-exist-in-the-agentic-system/
- Zenodo 论文："冲突与无知坍缩"：https://zenodo.org/records/22848952
- Pydantic AI Gateway 集成文章：https://pydantic.dev/articles/jev-pydantic-ai-gateway
- 校准审计仓库：https://github.com/MohitSV/jev-calibration-audit

**🔴 社区 / 二手（谨慎对待）**

- 各类 awesome 列表、项目地图、SEO 解释站（orcarouter、greennode、appinventiv 等）

---

*文档创建时间：2026年10月15日*
