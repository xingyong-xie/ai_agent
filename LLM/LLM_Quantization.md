---
title: 大模型量化详解
created: 2026-10-22
updated: 2026-11-02
tags: [AI, 大模型, 量化, 推理优化, GPTQ, AWQ, FP8, GGUF, KV Cache, PTQ, QAT]
related: "[[LLM_Transformer_Architecture]], [[LLM_MoE_Architecture]], [[LLM_Model_Layer]]"
---

# 大模型量化详解

> 本文由两个独立版本合并而成（2026-10-22 版 + 2026-10-24 版）。合并原则：保留前者的工程/产品/评测视角，吸收后者的数学原理、误差分析、代码实现与显存测算。

---

## 一、什么是大模型量化

**量化（Quantization）** 是把神经网络中的浮点数（FP16/BF16/FP32）用低位宽的整数（INT8/INT4）或低精度浮点（FP8/FP4）表示的压缩技术。核心目标：**用更少的比特承载相近的模型能力**。

从工程角度看，量化首先是一种**模型压缩与推理优化技术**：

```
量化前（FP16）                      量化后（INT4）
┌──────────────────────┐          ┌──────────────────────┐
│ 权重 0.0234, -1.207, │   ──▶    │ 权重  3, -7, 12, ... │
│      0.881, ...      │          │ + scale / zero-point │
│ 每参数 16 bit        │          │ 每参数 4 bit + 少量元数据 │
└──────────────────────┘          └──────────────────────┘
       7B ≈ 14 GB                       7B ≈ 3.9 GB
```

```
FP16 / BF16 权重
       │
       ▼
计算缩放因子 Scale、零点 Zero Point
       │
       ▼
映射为 INT8 / INT4 / FP8 等低精度数值
       │
       ▼
量化权重 + Scale + Zero Point + 量化配置
       │
       ▼
推理框架加载，直接低精度计算或在 Kernel 中反量化
```

量化与“蒸馏”“剪枝”解决的问题不同：

| 技术 | 核心手段 | 主要收益 | 是否保留原模型结构 |
|------|----------|----------|--------------------|
| **量化** | 降低数值位宽 | 显存、带宽、存储下降 | 是 |
| **剪枝** | 删除部分参数或结构 | 参数和计算量下降 | 通常会改变 |
| **蒸馏** | 小模型学习大模型输出 | 获得更小的新模型 | 否 |
| **低秩分解** | 用低秩矩阵近似权重 | 参数和计算量下降 | 结构会改变 |

需要特别区分两个概念：

1. **量化存储**：权重以 INT4 保存，显存占用显著下降。
2. **低精度计算**：GPU 或 NPU 直接使用 INT4/FP8 Tensor Core 完成矩阵运算。

很多所谓的 “4-bit 模型” 只做到了第一点。推理时仍可能把权重反量化到 BF16/FP16 再计算，因此能省显存，但吞吐和延迟不一定提升 4 倍。

### 关键术语

| 术语 | 含义 |
|------|------|
| **bit width（位宽）** | 每个权重/激活值占多少位：FP16=16、INT8=8、INT4=4、1.58bit（三值） |
| **W/A** | 权重（Weight）与激活（Activation）各自的量化位宽，如 W4A16 = 权重 4bit、激活保持 16bit |
| **granularity（粒度）** | 共享同一组 scale 的范围：per-tensor / per-channel / per-group |
| **scale / zero-point** | 浮点与整数之间的线性映射参数 |
| **calibration（校准）** | 用少量样本统计激活分布，确定 scale 的过程（PTQ 需要） |
| **QAT / PTQ** | 量化感知训练 / 训练后量化 |
| **bpw** | bits per weight，含元数据的平均每权重比特数（如 Q4_K_M ≈ 4.5 bpw） |

---

## 二、为什么需要量化

### 1. 降低权重显存

只考虑权重时，理论存储量为：

```
权重显存（GB） ≈ 参数量 × 每参数位数 ÷ 8 ÷ 10^9
```

| 参数规模 | BF16 | FP8 / INT8 | INT4 |
|----------|------|------------|------|
| **1B** | 约 2 GB | 约 1 GB | 约 0.5 GB |
| **7B** | 约 14 GB | 约 7 GB | 约 3.5 GB |
| **8B** | 约 16 GB | 约 8 GB | 约 4 GB |
| **32B** | 约 64 GB | 约 32 GB | 约 16 GB |
| **70B** | 约 140 GB | 约 70 GB | 约 35 GB |
| **671B** | 约 1.34 TB | 约 671 GB | 约 336 GB |

以上只是**理论权重下限**，没有计算：

- KV Cache
- 推理框架运行时开销
- 临时激活张量
- 量化的 Scale / Zero Point
- 显存碎片和分配冗余
- 编译后的 Kernel 与图缓存

对于 MoE 模型，显存要按照**总参数量**估算，因为专家权重通常都要被加载；计算量则主要参考**激活参数量**。例如 DeepSeek-V3 拥有 671B 总参数、约 37B 激活参数，不能按 37B 估算显存。

### 2. 降低内存带宽压力

自回归推理的 Decode 阶段通常具有明显的**内存带宽受限**特征：

- 每生成一个 Token，都要读取大量模型权重。
- 算术强度较低，计算单元经常等待权重从显存加载。
- 权重从 16-bit 降到 8-bit 或 4-bit 后，单次读取的数据量减少。

因此在 Kernel 足够高效时，量化可以改善：

- 首 Token 延迟（TTFT）
- 每 Token 延迟（TPOT / ITL）
- 单卡吞吐
- 相同显存下可部署的模型规模或并发数

> **一句话**：训练追求精度（BF16/FP32），推理追求"精度够用的最便宜表示"，量化就是这条曲线上的折中。

### 3. 降低存储与分发成本

量化模型文件更小，适合：

- 边缘设备和端侧应用
- 多副本模型仓库
- 容器镜像分发
- 冷启动加载
- 私有化离线部署

### 4. 量化不等于等比例提速

| 阶段          | 主要瓶颈                 | 量化可能的效果                 |
| ----------- | -------------------- | ----------------------- |
| **Prefill** | 矩阵计算、注意力计算           | 取决于硬件是否原生支持低精度 Kernel   |
| **Decode**  | 权重和 KV Cache 的内存带宽   | 通常收益更明显                 |
| **长上下文**    | Attention 和 KV Cache | 权重量化帮助有限，需要 KV Cache 量化 |
| **大 Batch** | 计算吞吐                 | 需要 W8A8/FP8 等激活量化       |

如果推理框架把 INT4 权重实时反量化成 BF16 后再做矩阵乘法，那么主要收益是显存和带宽，计算吞吐不会自动提高。

---

## 三、量化的数学原理

### 1. 仿射量化（Affine Quantization）

最通用的线性映射：

```
量化：    q = clip( round(x / s) + z , 0, 2^b - 1 )
反量化：  x̂ = s · (q - z)
```

- `x`：原始浮点值
- `s`：scale（缩放因子，浮点）
- `z`：zero-point（零点，整数），保证浮点 0 能精确表示
- `b`：位宽
- `q_min/q_max`：低精度格式可表示的最小值/最大值
- `x_hat`：反量化后的近似值

```
浮点域                         整数域 [0, 2^b-1]
 min ─┐                         0 ─┐
      │      ×1/s, +z              │
      │  ───────────────────▶      │
 max ─┘                     2^b-1 ─┘
       ◀───────────────────
            ×s, -z
```

误差主要来自两处：

1. **舍入误差**：连续的浮点数被映射到有限数量的离散值。
2. **截断误差**：超过范围的异常值被 `clip` 截断。

### 2. 对称量化与非对称量化

| 类型 | 公式 | zero-point | 适用 | 特点 |
|------|------|-----------|------|------|
| **对称（signed）** | `q = clip(round(x/s), -2^(b-1), 2^(b-1)-1)` | z = 0 | 权重（分布近似零中心） | 计算简单、Kernel 高效、无零点开销 |
| **非对称（unsigned）** | `q = clip(round(x/s + z), 0, 2^b-1)` | z ≠ 0 | 激活（ReLU 后非负、分布偏斜）、非对称分布 | 表达范围利用更充分，多一个零点元数据 |

对称量化中 `s = max(|x|) / (2^(b-1) - 1)`；非对称中 `s = (max - min) / (2^b - 1)`，`z = round(-min / s)`。

以 INT4 对称量化为例，可表示范围为 `[-8, 7]`，一种常见 Scale 计算方式是：

```
s = max(abs(x)) / 7
```

4-bit 表示只有 16 个离散档位。为了减少精度损失，通常会按更小的数据块分别计算 Scale。

### 3. 量化粒度

粒度决定了"多少个数共享一个 scale"，是**精度与开销的核心权衡**：

```
per-tensor（整个张量 1 个 scale）
┌──────────────────────────────┐
│  W: [ d_out × d_in ]   s=0.02│
└──────────────────────────────┘

per-channel（每行/每个输出通道 1 个 scale）
┌──────────────────────────────┐
│ row0: s=0.01                 │
│ row1: s=0.03                 │
│ row2: s=0.007                │
└──────────────────────────────┘

per-group（每 128 个权重 1 个 scale，GPTQ/AWQ 常用）
┌──────────────────────────────┐
│ [128 w] s0 | [128 w] s1 | ...│
└──────────────────────────────┘
```

| 粒度 | scale 数量 | 精度 | 元数据开销 | 典型场景 |
|------|-----------|------|-----------|----------|
| **per-tensor** | 1 | 低 | 可忽略 | 早期 INT8、激活量化 |
| **per-channel** | d_out | 中 | 很小 | 权重量化（INT8） |
| **per-group（g=128）** | d_out·d_in/128 | 高 | 每 128 权重 1 个 FP16 ≈ 0.125 bit/权重 | INT4 权重（GPTQ/AWQ） |
| **per-token（激活）** | 每 Token 1 个 | 高 | 小 | LLM 激活离群值处理 |
| **block/tile（FP8）** | 128×128 块或 1×128 tile | 高 | 很小 | DeepSeek-V3 的 FP8 训练 |

INT4 模型常见 `group_size = 128`。组越小，量化误差通常越低，但 Scale 数量和反量化开销也越大。

> 粒度越细，越能隔离离群值（outlier），但反量化开销和元数据越多。**INT4 必须配细粒度**，否则精度崩溃。

实际模型不一定严格达到 4.00 bit/参数，因为还要保存 Scale、Zero Point、分组边界等元数据。文件中的“有效位宽”可能接近 4.2-4.6 bit/参数。

### 4. 误差来源

| 误差 | 原因 | 缓解 |
|------|------|------|
| **舍入误差** | round 到最近整数 | 提高位宽、细粒度 |
| **截断误差（clipping）** | 离群值把 scale 撑大，导致大多数值落到很少的量化档位 | 截断阈值搜索（如 percentile）、离群值保留 FP16、旋转 |
| **分组边界效应** | 同一 group 内分布差异大 | 减小 group size、按通道重排 |
| **累积误差** | 逐层量化误差在深层放大 | 逐层校准（GPTQ）而非独立最小二乘 |

量化误差常用 **SQNR（信噪比）** 衡量：`SQNR ≈ 6.02·b + 常数` dB —— 每多 1 bit 约 +6dB。这也是为什么 8bit 通常"无损"，4bit 开始需要精心设计。

### 5. 离线量化与在线量化

| 模式 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| **离线量化（Pre-quantized）** | 预先产出量化模型文件 | 部署启动快、格式稳定 | 需要制作和验证流程 |
| **在线量化（On-the-fly）** | 加载模型时临时量化 | 接入简单 | 启动慢，显存峰值可能较高 |

生产环境通常优先使用离线量化产物，避免每次启动都重新执行量化。

### 6. QAT 的伪量化与 STE

QAT 在前向中插入"伪量化"节点（量化→反量化），保持浮点计算，但让梯度感知量化误差：

```
前向： x ──▶ quant ──▶ dequant ──▶ x̂ ≈ x
反向： round() 不可导 ──▶ 直通估计器 STE：∂L/∂x ≈ ∂L/∂x̂
```

```python
class FakeQuant(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, s, z, b):
        q = torch.clamp(torch.round(x / s) + z, 0, 2**b - 1)
        return (q - z) * s
    @staticmethod
    def backward(ctx, grad):
        return grad, None, None, None   # STE：梯度直通
```

---

## 四、大模型中的量化对象

### 1. 按量化对象分类

| 量化对象 | 说明 | 主要收益 | 难度 |
|----------|------|----------|------|
| **权重（Weight）** | 压缩 Linear、Embedding 等参数 | 显存、文件大小、带宽 | 低 |
| **激活（Activation）** | 压缩前向计算中的中间张量 | 计算吞吐 | 高，受异常值影响 |
| **KV Cache** | 压缩历史 Key/Value | 长上下文和高并发显存 | 中高 |
| **梯度** | 训练时使用低精度梯度 | 训练显存与带宽 | 高 |
| **注意力计算** | FP8 Attention 等 | Prefill 和长上下文性能 | 中高 |

### 2. 按位宽组合命名

| 表示 | 含义 |
|------|------|
| **W8A16** | 8-bit 权重，16-bit 激活 |
| **W4A16** | 4-bit 权重，16-bit 激活，常见的权重量化 |
| **W8A8** | 8-bit 权重和激活，适合高吞吐服务 |
| **W4A8** | 4-bit 权重，8-bit 激活，对 Kernel 要求较高 |
| **W4A4** | 4-bit 权重和激活，激进且对精度/硬件要求高 |

| 方案 | 权重 | 激活 | 特点 | 典型用途 |
|------|------|------|------|---------|
| **W16A16** | FP16 | FP16 | 基线 | 原始模型 |
| **W8A16** | INT8 | FP16 | 只省显存，算力不变 | 老卡/兼容性 |
| **W4A16** | INT4 | FP16 | 显存省 4 倍，decode 快 | 单卡/本地推理（GPTQ/AWQ） |
| **W8A8** | INT8 | INT8 | 显存 + 算力双收益 | 高吞吐服务（SmoothQuant） |
| **W4A8** | INT4 | INT8 | 折中方案 | 研究/新硬件 |
| **W8A8 FP8** | FP8 | FP8 | Hopper+ 原生支持，精度近 BF16 | 生产级训练/推理（DeepSeek-V3） |
| **W4A4 / FP4** | FP4 | FP4 | 极致压缩 | Blackwell、研究阶段 |

不要只看 “W4”，还要确认激活格式、Kernel、硬件和后端支持。

### 3. KV Cache 量化

KV Cache 的大小近似为：

```
KV Cache 字节数 = 2 × L × H_kv × d_head × seq_len × batch × bytes_per_elem
                  ↑   ↑      ↑        ↑          ↑
                  K和V 层数 KV头数 每头维度   序列长度

例：Llama-3-70B（L=80, H_kv=8, d_head=128），seq=32K，batch=1，FP16：
    2 × 80 × 8 × 128 × 32768 × 2 B ≈ 10.7 GB   ← 已接近权重的一半（INT4 权重才 39GB）
```

其中 `2` 表示 Key 和 Value。GQA/MQA 会显著减少 KV Heads，从而降低 KV Cache。

BF16 KV Cache 改为 FP8 后，理论存储下降约一半。但 KV Cache 量化与权重量化是两个独立能力：

- 权重 4-bit 不代表 KV Cache 也是 4-bit。
- 长上下文场景即使权重很小，KV Cache 仍可能成为主要显存开销。
- KV Cache 量化可能影响长距离检索、精确引用和数值稳定性，必须单独评测。

常用方案：

| 方案 | 精度 | 收益 | 说明 |
|------|------|------|------|
| **FP8 KV Cache** | 几乎无损 | 减半 | vLLM/SGLang 一行开关，Hopper 首选 |
| **INT8 KV** | 轻微损失 | 减半 | 需 per-token/per-head scale，通用性好 |
| **KIVI（2bit）** | 有明显损失 | 4× | Key 按 token 量化（K 的离群值集中在少数通道），Value 按 channel 量化 |
| **KV eviction / 稀疏** | 取决于策略 | 2~10×+ | 丢弃/合并不重要 token（H2O、StreamingLLM），与量化可叠加 |

注意事项：

| 问题 | 说明 |
|------|------|
| **Attention Sink** | 序列开头几个 Token 的 KV 幅值极大，量化时容易失真，通常保留高精度或特殊处理 |
| **Key 的离群通道** | K 的离群值集中在固定通道（channel-wise），适合 per-channel；V 分布更均匀，适合 per-token |
| **长上下文放大误差** | 误差随 seq_len 累积，长文本任务要单独评测（RULER、长文摘要） |

### 4. MoE 模型量化

MoE 量化有两个容易混淆的维度：

| 维度 | 需要关注的问题 |
|------|----------------|
| **总参数量** | 决定加载权重所需的显存 |
| **激活参数量** | 决定单 Token 的主要计算量 |
| **Expert 分布** | 不同 Expert 的量化误差可能不同 |
| **负载均衡** | 热点 Expert 会造成带宽和 Kernel 压力 |
| **并行策略** | Expert Parallel、TP、PP 与量化格式是否兼容 |
| **路由稳定性** | 极低比特量化是否改变 Top-K Expert 选择 |

MoE 模型可能适合 4-bit 权重以降低显存压力，但不代表它能按激活参数的比例直接缩小。

额外的 MoE 量化问题：

| 问题 | 说明 |
|------|------|
| **路由敏感** | Router 的 top-k 选择对微小扰动敏感，量化 router/gate 可能改变专家分配 |
| **专家负载不均** | 热门 Expert 的量化误差被更多 Token 放大 |
| **逐专家量化** | 大 MoE 可对每个 Expert 单独校准/量化，避免全局 scale 被极端专家主导 |
| **显存 vs 通信** | 量化也减少了 Expert 并行时的通信量，是 MoE 部署的重要收益 |

---

## 五、量化方法分类

### 1. 训练后量化与量化感知训练

```
PTQ（训练后量化）
┌──────────┐   ┌───────────┐   ┌──────────┐
│ 预训练权重 │──▶│ 校准数据统计 │──▶│ 量化权重  │
└──────────┘   └───────────┘   └──────────┘
  无需训练，分钟级完成，主流选择

QAT（量化感知训练）
┌──────────┐   ┌──────────────────┐   ┌──────────┐
│ 预训练权重 │──▶│ 微调 + 伪量化节点  │──▶│ 量化权重  │
└──────────┘   │ (STE 反传梯度)     │   └──────────┘
               └──────────────────┘
  需要训练算力，但极低位宽（≤2bit）几乎必需
```

| 维度 | PTQ | QAT |
|------|-----|-----|
| **成本** | 低（校准几分钟~几小时） | 高（需训练数据与 GPU 算力） |
| **精度** | 8bit 基本无损；4bit 接近无损 | 2~4bit 精度最好 |
| **灵活性** | 换模型即可重跑 | 每个模型都要单独训练 |
| **代表** | GPTQ / AWQ / SmoothQuant / GGUF | LLM-QAT / BitNet / QLoRA（微调场景） |

PTQ 是当前大模型部署的主流。QAT 在训练前向中模拟量化误差，让模型主动适应低精度，但需要训练数据和算力。

### 2. 是否使用校准数据

| 类型 | 说明 | 代表方法 |
|------|------|----------|
| **需要校准数据** | 用代表性输入统计激活范围或权重重要性 | GPTQ、AWQ、SmoothQuant |
| **不依赖业务校准数据** | 基于权重统计量直接量化 | LLM.int8、NF4、部分 HQQ 配置 |

校准数据不是越多越好。通常几十到几百条代表性样本即可，但必须覆盖目标业务分布：

- 中文和英文
- 代码和数学
- 长上下文
- 结构化 JSON
- 工具调用
- 行业术语

不能直接使用最终评测集做校准，否则会高估量化效果。

### 3. 静态 vs 动态量化

| 类型 | 激活 scale 何时确定 | 开销 | 精度 |
|------|-------------------|------|------|
| **静态** | 校准阶段一次性统计 | 推理零额外开销 | 依赖校准数据分布 |
| **动态** | 推理时按实际输入实时计算 | 少量运行时开销 | 对分布漂移更鲁棒 |

LLM 的激活分布随输入变化大（长文本/代码/多语言差异明显），因此**权重静态 + 激活动态/per-token** 是常见组合。

### 4. 量化流程

```
基础模型
   │
   ▼
选择目标硬件与推理后端
   │
   ▼
选择量化格式：AWQ / GPTQ / FP8 / GGUF / MLX
   │
   ▼
准备校准数据（如方法需要）
   │
   ▼
执行量化并保存 Scale / Zero Point / 配置
   │
   ▼
加载量化产物
   │
   ├── 精度评测
   ├── 性能评测
   └── 兼容性验证
   │
   ▼
发布为部署配置
```

---

## 六、主流量化方法

### 1. GPTQ

**GPTQ（Generative Pre-trained Transformer Quantization）** 是面向大模型权重的训练后量化方法，通常用于 3-bit 或 4-bit 权重量化。

**核心思想**：逐层做"带 Hessian 信息的误差补偿"。不是独立量化每个权重，而是量化一列后，**把产生的误差按比例补偿到尚未量化的列上**，使该层输出 `WX` 的整体误差最小。

```
目标： min || W X - Ŵ X ||²
方法： 逐列量化，用 H = 2XXᵀ（Hessian）决定补偿方向
       δ_j = - (w_j - quant(w_j)) / [H⁻¹]_jj  ·  H⁻¹[:, j]
       把 δ_j 加到剩余未量化的列上
```

| 特性 | 说明 |
|------|------|
| **类型** | PTQ，weight-only（W4A16 / W3A16） |
| **校准数据** | 128~1024 条样本，统计每层输入 |
| **优点** | 4bit 精度好、生态成熟（vLLM/TensorRT-LLM/ExLlama 全支持） |
| **缺点** | 量化耗时（每层解一次 Hessian 逆）、对激活离群值敏感 |
| **关键参数** | group_size（128/64）、desc_act（激活重排，提升精度但略降速） |

GPTQ 常见于 `AutoGPTQ`、vLLM、SGLang 等生态。不同实现支持的模型结构、Group Size 和 Kernel 可能不同。

### 2. AWQ

**AWQ（Activation-aware Weight Quantization）** 根据激活分布识别重要权重通道，并通过缩放保护这些通道，降低权重量化误差。

**核心观察**：权重的重要性不由权重本身决定，而由**对应激活通道的幅度**决定；只需保护约 **0.1%~1%** 的显著通道，就能保住大部分精度。

```
做法：按激活幅值找出显著通道 → 给这些通道乘一个放大因子 s
      W' = W · diag(s)⁻¹ ，  X' = X · diag(s)
      量化 W'（等效于让显著权重获得更细的量化刻度）
      s 的指数 α 在 [0,1] 网格搜索，α=0.5 附近通常最优
```

| 特性 | 说明 |
|------|------|
| **类型** | PTQ，weight-only |
| **优点** | 不依赖反向传播、量化快、泛化好（换数据集精度稳定） |
| **缺点** | 4bit 以下收益下降；需要激活统计 |
| **生态** | vLLM、TensorRT-LLM、AutoAWQ、lmdeploy |

> **GPTQ vs AWQ**：GPTQ 逐层误差补偿、精度略高但量化慢且对校准集敏感；AWQ 简单稳健、部署友好。实际项目中两者都跑一遍、在自有评测集上比一比最稳。

AWQ 适合单卡或显存受限的 GPU 推理，是当前较常见的 4-bit 部署方案之一。

### 3. SmoothQuant

**SmoothQuant** 主要解决激活值中的异常值（Outliers）问题，常用于 W8A8 量化。

**核心观察**：LLM 激活存在**极端离群值**（某些通道幅值可达均值的几十倍），直接 INT8 量化激活会崩。而权重分布相对平缓。

```
Y = X · W = (X · diag(s)⁻¹) · (diag(s) · W)
            ↑ 激活变平缓        ↑ 权重变难一点
s_j = max|X_j|^α / max|W_j|^(1-α)   （α≈0.5）
```

把量化难度从激活"迁移"一部分给权重，实现 W8A8。

| 特性 | 说明 |
|------|------|
| **类型** | PTQ，W8A8 |
| **收益** | INT8 张量核心，prefill 吞吐显著提升 |
| **局限** | 8bit 已接近无损上限；4bit 场景不适用 |

SmoothQuant 与权重量化不是替代关系。W4A16 更关注省显存和内存带宽，W8A8 更关注计算吞吐。

### 4. bitsandbytes、LLM.int8 与 NF4

**bitsandbytes** 提供多种易用的量化能力，常见于 Transformers 和 QLoRA 工作流。

| 方法 | 原理 | 用途 |
|------|------|------|
| **LLM.int8()** | 绝大多数维度做 INT8 向量量化，检测到幅值 > 6.0 的**离群维度**（约占 0.1%）单独保留 FP16 计算 | 8bit 推理，改动最小 |
| **NF4（4-bit NormalFloat）** | 假设权重近似正态，按分位数设计 16 个非均匀量化档位（信息论最优），并二次量化 scale | **QLoRA 微调**的事实标准 |
| **Double Quantization** | 对 scale 本身再量化一次（FP32→FP8），省 ~0.37 bit/权重 | 与 NF4 搭配降低显存 |

LLM.int8 使用混合精度分解处理激活异常值：

- 大部分常规数值使用 INT8。
- 少量异常值通道保留较高精度。
- 降低纯粹 INT8 量化造成的显著精度损失。

它更适合快速验证和显存压缩，不应默认认为在所有 GPU 上都能获得最佳吞吐。

NF4 常见组合：

- NF4 存储基础模型权重
- Double Quantization 进一步压缩量化元数据
- BF16 计算适配器或部分激活
- LoRA 只训练少量参数

```python
# QLoRA / NF4 加载示例
from transformers import BitsAndBytesConfig
bnb = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = AutoModelForCausalLM.from_pretrained(path, quantization_config=bnb)
```

NF4 非常适合低显存微调，但微调后的合并、导出和部署要单独验证。

### 5. GGUF 与 K-quants

**GGUF** 是 llama.cpp 生态常用的模型文件格式，不只是单一量化算法，而是包含模型结构、Token、权重和量化元数据的容器格式。

| 量化类型 | 平均 bpw | 7B 体积 | 质量 | 建议 |
|---------|---------|---------|------|------|
| **Q2_K** | ~2.6 | ~2.3GB | 明显下降 | 仅极限内存 |
| **Q3_K_M** | ~3.9 | ~3.4GB | 可接受 | 内存紧张 |
| **Q4_K_S** | ~4.6 | ~4.0GB | 好 | 小内存首选 |
| **Q4_K_M** | ~4.8 | ~4.2GB | 很好 | **通用推荐** |
| **Q5_K_M** | ~5.7 | ~5.0GB | 接近无损 | 内存充裕 |
| **Q6_K** | ~6.6 | ~5.8GB | 几乎无损 | 追求质量 |
| **Q8_0** | ~8.5 | ~7.5GB | 基本无损 | 对照基线 |

`K_M` 等后缀通常表示不同的层或张量采用混合量化策略。具体含义应以 llama.cpp 当前版本的量化文档为准。

配套技术：

| 技术 | 作用 |
|------|------|
| **k-quants** | 按张量重要性混合不同位宽（注意力/FFN 用不同 Q），块内多级 scale |
| **imatrix（importance matrix）** | 用校准数据统计每个权重的重要性，指导分配位宽，提升低比特质量 |
| **混合精度** | 嵌入层、输出层、norm 保持高精度，只压 FFN/注意力 |
| **GGUF 格式** | 单文件打包权重 + tokenizer + 元数据，mmap 加载，跨 CPU/GPU 分片 |

GGUF 的优势：

- CPU、Apple Silicon、部分 GPU 后端支持好
- 单文件分发
- 内存映射加载
- 适合 Ollama、LM Studio、llama.cpp 等本地工具

> Ollama、LM Studio、llama.cpp 服务默认吃的都是 GGUF；Apple Silicon 上另有 MLX 的 4-bit 方案（利用统一内存）。

### 6. FP8

FP8 是浮点低精度格式，保留指数位，动态范围远大于 INT8，**精度损失小且无需复杂校准**，是 Hopper（H100/H200）及之后 GPU 的原生能力。

| 格式 | 指数位 | 尾数位 | 最大范围 | 典型用途 |
|------|-------|-------|---------|---------|
| **E4M3** | 4 | 3 | ±448 | 前向权重/激活（精度优先） |
| **E5M2** | 5 | 2 | ±57344 | 反向梯度（范围优先） |

```
DeepSeek-V3 的 FP8 训练配方（代表性做法）：
  · 权重：128×128 分块（block-wise）缩放
  · 激活：1×128 分片（tile-wise）缩放
  · 主权重保持 BF16/FP32 更新，GEMM 用 FP8 累加走 FP32
  · 前向 E4M3，反向梯度 E5M2
  → 在 671B MoE 上把训练算力开销显著压低，精度损失 <0.25%
```

FP8 相比 INT4，通常精度更稳，但压缩率较低。实际价值依赖：

- GPU 是否原生支持 FP8 Tensor Core
- 推理框架是否有高效 FP8 Kernel
- 模型是否有可靠的 Scale 方案
- 注意力、LayerNorm 等非矩阵算子是否保持合适精度

推理侧：vLLM/SGLang 支持 **FP8 weight-only** 和 **FP8 KV Cache**，H100 上通常能拿到接近 2 倍的 GEMM 吞吐，且几乎无损。

### 7. MLX 量化

MLX 是 Apple Silicon 上的机器学习框架，支持面向统一内存架构的量化推理。

常见特点：

- 使用 Apple Silicon 的 CPU/GPU 共享内存
- 通常采用分组权重量化
- 与 GGUF 类似适合 Mac 本地模型
- 具体量化配置和 Kernel 由 MLX 生态决定

对于 Mac 本地部署，GGUF 和 MLX 都值得测试。选择不能只看文件更小，还要看：

- Prompt Processing 速度
- Token 生成速度
- 首 Token 延迟
- 长上下文显存
- 模型转换是否方便

### 8. 新一代方法一览

| 方法 | 核心思路 | 特点 |
|------|---------|------|
| **QuIP#** | 随机旋转 + 格点量化（E8 lattice） | 2bit 可用，需自定义 kernel |
| **QuaRot / SpinQuant** | 用正交/学习到的旋转矩阵把离群值"打散"到所有通道 | 让 4bit 激活量化可行，常与其他方法叠加 |
| **HQQ** | 无校准、半二次求解 scale | 量化极快，适合大模型批量处理 |
| **BitNet b1.58** | 权重限制为 {-1, 0, +1}，从训练就量化 | 1.58bit 原生训练，CPU 也能跑，但需重训 |
| **NVFP4 / MXFP4** | 微缩放（micro-scaling）FP4，每 16/32 权重共享指数 | Blackwell 原生支持，旗舰模型开始采用 |
| **KIVI** | KV Cache 的 per-token key + per-channel value 2bit 量化 | 长上下文显存大幅下降 |

### 9. 方法对比

| 方法 | 常见精度 | 量化对象 | 是否校准 | 主要硬件/生态 | 适用场景 |
|------|----------|----------|----------|----------------|----------|
| **GPTQ** | W4A16 / W3A16 | 权重 | 是 | NVIDIA GPU、vLLM/SGLang | 单卡 4-bit 部署 |
| **AWQ** | W4A16 | 权重 | 是，少量 | NVIDIA GPU、vLLM/SGLang | 显存受限、精度较敏感 |
| **SmoothQuant** | W8A8 | 权重 + 激活 | 是 | NVIDIA GPU、专用推理后端 | 高吞吐在线服务 |
| **LLM.int8** | W8A16 | 权重 | 否 | Transformers、bitsandbytes | 快速实验、显存压缩 |
| **NF4** | W4A16 | 权重 | 否 | QLoRA、bitsandbytes | 低显存微调 |
| **GGUF K-quants** | 2-8 bit | 权重 | 取决于格式 | CPU / Mac / llama.cpp | 本地与边缘部署 |
| **FP8** | W8A8 / 混合 | 权重、激活 | 取决于方案 | 新 NVIDIA GPU | 精度与吞吐平衡 |
| **MLX 量化** | 常见 4/8 bit | 权重 | 取决于方案 | Apple Silicon | Mac 本地推理 |
| **HQQ** | 常见 4/8 bit | 权重 | 通常不需要 | 多种后端 | 快速低比特压缩 |

---

## 七、量化位宽 × 算子组合

不同 W/A 组合解决的瓶颈不同，**不是位宽越低越快**：

```
Decode（逐 Token 生成）—— 访存受限（memory-bound）
  瓶颈 = 读权重 + 读 KV Cache
  → 权重量化直接生效：W4 比 W16 快约 2~3 倍（同卡）

Prefill（吃 Prompt）—— 计算受限（compute-bound）
  瓶颈 = 矩阵乘 FLOPs
  → 必须用 INT8/FP8 张量核心才有收益，W4A16 帮助很小
```

| 组合 | 显存下降 | Decode 加速 | Prefill 加速 | 硬件要求 | 代表工具 |
|------|---------|------------|-------------|---------|---------|
| W8A16 | 2× | ~1.5× | 无 | 任意 | bitsandbytes |
| **W4A16** | 4× | **2~3×** | 无 | 任意（反量化用 FP16） | GPTQ / AWQ / GGUF |
| **W8A8** | 2× | 1.5× | **~1.8~2×** | INT8 张量核心（Ampere+） | SmoothQuant / TensorRT-LLM |
| **FP8 W8A8** | 2× | 1.5× | **~2×** | Hopper+ 原生 FP8 | vLLM / SGLang / TRT-LLM |
| W4A8 | 4× | 2~3× | ~1.5× | 支持 INT4/INT8 混合 | 研究/新硬件 |
| FP4 | 8× | 3~4× | 2~3× | Blackwell | TensorRT-LLM / vLLM（逐步支持） |

> 实际加速比受 batch size 影响：**batch 越大越偏 compute-bound**，此时 W4A16 的优势会被摊薄；小 batch / 单并发才是 W4A16 的主场。

---

## 八、显存与性能测算

### 1. 权重显存速算

```
权重显存 ≈ 参数量 × bpw / 8
```

| 模型 | FP16 | INT8 | INT4（Q4_K_M ≈4.8bpw） | 3bit |
|------|------|------|----------------------|------|
| 7B / 8B | ~15 GB | ~7.5 GB | ~4.2 GB | ~3 GB |
| 32B | ~64 GB | ~32 GB | ~19 GB | ~13 GB |
| 70B | ~140 GB | ~70 GB | ~40 GB | ~28 GB |
| 671B（MoE） | ~1.3 TB | ~670 GB | ~400 GB | ~280 GB |

> 实际可用显存还要扣掉 KV Cache、激活、框架开销（通常留 10~20% 余量）。MoE 模型虽然激活参数少，但**全部 Expert 都要驻留显存**，量化对 MoE 的收益同样直接。

### 2. 精度—体积—速度三角

```
     精度
      ▲
      │   ● FP16/BF16
      │      ● FP8 / INT8      ← 通常被认为"无损"
      │          ● INT4         ← 主流甜点位
      │              ● INT3
      │                  ● INT2  ← 需要旋转/QAT 等特殊手段
      └──────────────────────────▶ 速度 / 体积收益
         位宽越低，收益越大，但精度风险非线性上升
```

经验值（以主流开源模型、通用基准为参考，任务相关波动大）：

| 位宽 | 通用任务精度损失 | 适用判断 |
|------|----------------|---------|
| FP8 / INT8 | < 0.5% | 几乎可直接替换 |
| INT4（GPTQ/AWQ，g=128） | 0.5% ~ 2% | 多数场景可接受，需自测 |
| INT4（粗糙 per-tensor） | 5%+ | 不建议 |
| 3bit | 2% ~ 5% | 仅显存极紧张 |
| 2bit | 显著 | 需要 QuIP#/QAT 等专门方案 |

---

## 九、模型格式、推理后端与硬件

### 1. 格式与后端不是同一概念

| 层级 | 示例 |
|------|------|
| **模型格式** | Safetensors + 量化配置、GGUF、MLX、TensorRT Engine |
| **量化算法** | GPTQ、AWQ、SmoothQuant、NF4、FP8 |
| **推理后端** | vLLM、SGLang、TensorRT-LLM、llama.cpp、Transformers |
| **硬件** | NVIDIA GPU、AMD GPU、CPU、Apple Silicon、NPU |

一个 AWQ 模型通常不是直接拿给 llama.cpp 使用；GGUF 文件也不能直接作为 vLLM 的 AWQ 模型加载。选型顺序应是：

```
硬件 → 推理后端 → 支持的量化格式 → 量化方法与产物
```

### 2. 常见后端能力

| 后端 | 常见量化格式 | 优势 | 注意事项 |
|------|--------------|------|----------|
| **vLLM** | AWQ、GPTQ、FP8、部分 bitsandbytes、GGUF（实验性） | GPU 服务吞吐高、OpenAI 兼容接口、PagedAttention + 连续批处理 | 模型结构、量化和 Kernel 版本需匹配 |
| **SGLang** | AWQ、GPTQ、FP8、INT4 | 高吞吐、结构化生成和调度能力 | 以具体版本支持列表为准 |
| **TensorRT-LLM** | FP8、FP4、INT4 AWQ/GPTQ、INT8 | NVIDIA GPU 深度优化 | 编译和硬件绑定较强 |
| **llama.cpp / Ollama / LM Studio** | GGUF | CPU、Mac、边缘设备友好 | 4-bit 不代表所有硬件同样快 |
| **Transformers + bitsandbytes** | INT8、NF4 | 接入简单、适合实验 | 生产吞吐不一定是最好 |
| **MLX** | MLX 量化格式 | Apple Silicon 优化 | 主要服务 Apple 生态 |
| **ExLlamaV2** | GPTQ/EXL2 | 单卡低延迟 | 生态相对垂直 |
| **lmdeploy** | AWQ、W4A16 | 国产模型适配好、TurboMind 引擎 | 以版本支持为准 |

功能上线前必须做一次真实兼容性测试：**同一模型、同一量化产物、同一后端版本、同一硬件**。只查看文档中的“支持”不够。

### 3. 硬件选型

| 硬件场景 | 推荐优先测试 | 原因 |
|----------|--------------|------|
| **CPU 服务器** | GGUF Q4_K_M / Q5_K_M | 生态成熟、内存占用低 |
| **Apple Silicon** | GGUF Q4_K_M / MLX 4-bit | 统一内存和本地框架支持好 |
| **消费级 NVIDIA GPU** | AWQ/GPTQ 4-bit、GGUF CUDA | 显存优先 |
| **数据中心 NVIDIA GPU** | FP8、W8A8、AWQ/GPTQ | 同时追求吞吐和显存 |
| **长上下文服务** | 权重 FP8/AWQ + KV Cache 量化 | 权重不是唯一显存瓶颈 |
| **低显存微调** | NF4 + QLoRA | 降低基础模型占用 |
| **边缘 NPU** | 厂商支持的 INT8/INT4 格式 | 依赖专用编译器和算子 |

---

## 十、大模型量化的特殊挑战

### 1. 激活离群值（Activation Outliers）

```
某层激活的第 137 通道：
  正常通道幅值 ≈ 1~5
  离群通道幅值 ≈ 50~200   ← 若用 per-tensor scale，其他通道全被压扁
```

| 现象 | 说明 |
|------|------|
| **系统性离群** | 不是随机噪声，而是训练中稳定出现的少数通道（LLM.int8() 论文称约 0.1% 维度） |
| **随规模增强** | 模型越大，离群越明显（>6.7B 后出现"涌现"离群特征） |
| **与层相关** | 残差流、特定 FFN 通道最严重 |

应对：per-token/per-channel 粒度、SmoothQuant 迁移、旋转（QuaRot/SpinQuant）、离群值保留 FP16（LLM.int8()）。

### 2. 层级敏感度不均

| 张量 | 敏感度 | 建议 |
|------|--------|------|
| Embedding / LM Head | 高 | 保留 8/16bit 或 per-channel |
| 第一层 / 最后一层 | 高 | 保留较高精度 |
| 中间 FFN / Attention 投影 | 低 | 可到 4bit |
| LayerNorm / RMSNorm | 极高 | 不量化（参数本身极少） |

### 3. 校准集偏差

PTQ 的 scale 与离群值统计来自校准数据。**用英文通用语料校准的模型，跑中文/代码时可能明显掉点**。建议校准集覆盖实际业务分布，并在自有评测集上验证。

### 4. 评测陷阱

| 陷阱 | 说明 |
|------|------|
| **只看 Perplexity** | PPL 掉 0.1 仍可能让指令跟随/代码能力明显下降，需任务级评测 |
| **只看平均分** | 量化误差集中在少数能力（数学、长上下文、多语言），平均分掩盖短板 |
| **忽略采样参数** | 温度/重复惩罚会放大量化模型的退化（重复、胡言） |
| **未测长上下文** | KV Cache 量化 + 长序列是误差重灾区 |

推荐流程：`lm-evaluation-harness` / 自建任务集 → 对比 FP16 基线 → 关注最差任务而非平均。

---

## 十一、量化功能的产品化设计

如果在一个模型平台中提供“大模型量化”功能，核心不是暴露算法参数，而是提供可验证、可部署、可回滚的量化任务。

### 1. 功能输入

| 输入项 | 说明 |
|--------|------|
| **基础模型** | 模型仓库、版本、权重路径、Tokenizer |
| **目标硬件** | NVIDIA/CPU/Mac/NPU、显存规模、架构 |
| **推理后端** | vLLM、SGLang、TensorRT-LLM、llama.cpp 等 |
| **量化方法** | AWQ、GPTQ、FP8、GGUF、NF4 等 |
| **位宽与粒度** | 4-bit/8-bit、Group Size、对称性 |
| **校准数据集** | 业务样本、语言、领域、长度分布 |
| **资源规格** | CPU、GPU、内存、超时时间 |
| **评测配置** | 精度集、性能集、验收阈值 |

### 2. 任务流水线

```
创建量化任务
   │
   ▼
校验模型格式、授权和硬件兼容性
   │
   ▼
准备校准数据并记录数据版本
   │
   ▼
分配量化资源并执行转换
   │
   ▼
生成量化产物和元数据
   │
   ▼
启动临时推理实例
   │
   ├── 功能正确性测试
   ├── 精度回归测试
   ├── 性能基准测试
   └── 长上下文与并发测试
   │
   ▼
通过阈值 → 发布为模型版本
未通过   → 标记失败并保留诊断信息
```

### 3. 量化产物应包含什么

| 内容 | 作用 |
|------|------|
| **量化权重** | 实际模型文件 |
| **量化配置** | 方法、位宽、Group Size、目标后端 |
| **Scale / Zero Point** | 反量化和低精度计算所需元数据 |
| **Tokenizer 与模型配置** | 保证推理一致 |
| **校准数据指纹** | 追溯量化输入，不暴露原始数据 |
| **量化工具与版本** | 支持结果复现 |
| **评测报告** | 精度、性能、显存和失败样本 |
| **部署配置模板** | 减少手工配置错误 |
| **模型卡** | 说明适用场景、限制和许可 |

### 4. 任务状态与可观测性

建议至少提供以下状态：

- `queued`
- `preparing`
- `quantizing`
- `evaluating`
- `succeeded`
- `failed`
- `canceled`

可观测指标：

- 当前阶段和进度
- GPU 显存峰值
- 量化耗时
- 吞吐和延迟
- 精度回归结果
- 失败日志和失败样本
- 产物大小

### 5. 关键产品原则

1. **量化产物和部署配置分离**：同一个量化模型可以对应多个推理服务配置。
2. **评测不通过禁止自动发布**：低比特模型必须经过业务回归。
3. **保留原始模型引用**：支持回滚和重新量化。
4. **记录工具链版本**：量化结果与工具、Kernel、后端版本强相关。
5. **明确兼容性矩阵**：用户应该知道某产物能部署到哪里。
6. **不承诺固定压缩倍数**：实际大小受元数据和格式影响。
7. **不承诺低比特一定更快**：结果必须来自目标硬件基准测试。

---

## 十二、量化评测

### 1. 精度评测

只比较 Perplexity 不够。大模型量化后可能出现“整体困惑度正常，但关键任务明显退化”。

| 评测维度 | 示例指标 |
|----------|----------|
| **语言建模** | Perplexity、Loss |
| **通用能力** | MMLU、C-Eval、GSM8K 等 |
| **业务任务** | 准确率、召回率、人工偏好胜率 |
| **生成稳定性** | 重复率、截断率、拒答率 |
| **结构化输出** | JSON 合法率、Schema 通过率 |
| **工具调用** | 工具选择准确率、参数正确率 |
| **长上下文** | 检索准确率、引用一致性 |
| **多语言** | 各语言子集独立统计 |
| **安全能力** | 安全测试集通过率、误拒率 |

### 2. 对照实验设计

量化模型和原始模型必须使用相同条件：

- Prompt 模板
- 系统提示词
- 采样参数
- 最大输出长度
- 推理后端版本
- Batch Size 和并发数
- 硬件型号
- 测试数据版本

建议保存原始模型输出和量化模型输出，进行逐样本对比，而不只记录聚合分数。

### 3. 性能评测

| 指标 | 含义 | 关注点 |
|------|------|--------|
| **模型加载时间** | 从磁盘加载到可服务 | 冷启动 |
| **峰值显存** | 推理期间最大显存 | 是否可部署 |
| **TTFT** | 首 Token 时间 | 交互体验 |
| **TPOT / ITL** | 后续 Token 间隔 | 生成流畅度 |
| **Tokens/s** | 单请求输出速度 | 延迟 |
| **Requests/s** | 请求吞吐 | 服务容量 |
| **Output Tokens/s** | 总输出吞吐 | 成本 |
| **P50/P95/P99** | 分位延迟 | 用户体验稳定性 |
| **并发上限** | OOM 前最大并发 | 容量规划 |
| **单位 Token 成本** | 计算与硬件折算 | 商业可行性 |

### 4. 分阶段测试

1. **Smoke Test**：模型能加载、能生成、无 NaN/崩溃。
2. **单请求测试**：短 Prompt、长 Prompt、短输出、长输出。
3. **精度回归**：业务样本与基准集。
4. **并发压测**：逐步增加并发，观察 P95/P99 和显存。
5. **长稳测试**：持续运行，观察内存泄漏和性能漂移。
6. **故障恢复**：模型重新加载、节点重启、降级路由。

### 5. 验收阈值示例

阈值应该由业务决定，例如：

- JSON Schema 合法率下降不超过 0.5 个百分点。
- 核心业务准确率相对下降不超过 1%。
- P95 TTFT 改善至少 20%。
- 峰值显存下降至少 40%。
- 并发吞吐不低于原模型。

这些数字只是示例，不是通用标准。

---

## 十三、量化选型建议

### 1. 决策流程

```
是否只是快速验证？
  ├── 是：bitsandbytes / NF4 / 现成 GGUF
  └── 否
       │
       ▼
部署目标是否为 CPU / Mac / 边缘设备？
  ├── 是：GGUF Q4_K_M / Q5_K_M 或 MLX
  └── 否
       │
       ▼
目标硬件是否支持高效 FP8 Kernel？
  ├── 是：先测 FP8，再比较 AWQ/GPTQ
  └── 否
       │
       ▼
是否受显存限制？
  ├── 是：AWQ / GPTQ 4-bit
  └── 否
       │
       ▼
是否追求高并发吞吐？
  ├── 是：FP8 / W8A8 + KV Cache 优化
  └── 否：优先保证精度，使用 8-bit 或 FP8
```

### 2. 按场景选型

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **Mac / CPU 本地跑** | GGUF Q4_K_M / Q5_K_M；Apple Silicon 可用 MLX 4bit | llama.cpp 生态、mmap、统一内存 |
| **单张消费级 GPU（24GB）** | AWQ / GPTQ W4A16（vLLM） | 70B 放不下，32B/14B 4bit 正好 |
| **多卡生产推理（H100）** | FP8 W8A8 + FP8 KV Cache | 原生张量核心，吞吐翻倍 |
| **A100 集群** | AWQ W4A16（decode 密集）/ SmoothQuant W8A8（prefill 密集） | 无 FP8，按瓶颈选 |
| **显存受限但算力够** | W4A16 | 只省显存，几乎不改算力路径 |
| **高并发 API 服务** | FP8 / W8A8 + 大 batch | batch 大时 compute-bound，需要张量核心 |
| **微调（LoRA）** | QLoRA（NF4 + double quant） | 7B 可在 24GB 卡上微调 |
| **从头训练** | BF16 为主，FP8 混合精度（Hopper） | 参考 DeepSeek-V3 配方 |
| **端侧极限** | INT4 + 旋转 / BitNet（需重训） | 2bit 以下的现实路径 |

### 3. 按目标选择

| 目标 | 首选方案 | 备选方案 | 主要风险 |
|------|----------|----------|----------|
| **单卡部署 7B-70B** | AWQ/GPTQ 4-bit | FP8 + 多卡 | 精度退化、Kernel 兼容 |
| **高吞吐在线服务** | FP8 / W8A8 | AWQ + 高并发调度 | 激活异常值、后端实现 |
| **Mac 本地推理** | GGUF Q4_K_M | MLX 4-bit | 长上下文速度和内存 |
| **CPU 推理** | GGUF Q4_K_M / Q5_K_M | Q6_K | 生成速度受限 |
| **低显存微调** | NF4 + QLoRA | 8-bit LoRA | 微调质量、导出兼容 |
| **边缘设备** | 厂商 INT8/INT4 格式 | GGUF | 算子支持、许可和部署成本 |
| **极低比特研究** | QAT / HQQ / 2-bit 方法 | GPTQ 3-bit | 明显质量退化 |

### 4. 实际推荐

1. **优先从 8-bit 或 FP8 开始**：精度风险低，适合作为量化基线。
2. **显存不够再尝试 4-bit 权重**：AWQ/GPTQ 是常见选择。
3. **本地和 Mac 优先 GGUF/MLX**：生态完整，部署简单。
4. **服务端同时优化 KV Cache**：长上下文和高并发时，KV Cache 可能比权重更关键。
5. **不要只看模型文件大小**：必须测量实际峰值显存。
6. **不要只测单请求**：真实吞吐和 P95 延迟才决定服务成本。
7. **不要一次性跳到 2-bit**：先确认 4-bit 已经满足容量要求。

---

## 十四、常见误区

两个版本合并去重后的清单：

| 误区 | 正确认识 |
|------|----------|
| **4-bit 模型一定只占 1/4 显存** | KV Cache、激活、元数据和运行时开销仍存在 |
| **4-bit 一定比 BF16 快 4 倍** | 取决于硬件 Kernel，很多场景只是省显存和带宽 |
| **量化一定更快** | prefill 计算受限，W4A16 帮助很小；小 batch 才明显 |
| **位宽越低越好** | 低比特会增加误差，4bit 是甜点，3-bit/2-bit 需要严格验证 |
| **量化后精度几乎无损** | 与模型、方法、数据、位宽和任务强相关 |
| **PPL 没掉就是无损** | 任务能力可能已退化，必须任务级评测 |
| **任何后端都能加载 AWQ/GPTQ** | 格式和 Kernel 必须匹配 |
| **一个量化模型可部署到所有硬件** | TensorRT Engine 等产物可能有硬件绑定 |
| **校准数据随便选** | 分布偏差会直接带来业务退化 |
| **所有层一起量化** | 嵌入/输出/norm/首尾层应保留高精度 |
| **MoE 按激活参数估算显存** | 显存主要看总参数量，计算才看激活参数 |
| **权重量化后不需要管 KV Cache** | 长上下文和高并发仍可能被 KV Cache 占满 |
| **量化后可以直接微调** | 量化权重一般冻结；要微调用 QLoRA 或先反量化 |
| **量化任务成功就代表可上线** | 还必须通过精度、性能、稳定性和兼容性门禁 |

---

## 十五、未来趋势

| 趋势 | 说明 |
|------|------|
| **4bit 成为默认** | AWQ/GPTQ/GGUF 生态成熟，开源模型常同时发布 BF16/FP8/AWQ 版本 |
| **FP8 普及** | 新 GPU 原生支持增强，精度与性能平衡较好 |
| **FP4 / MXFP4 / NVFP4** | 更低比特和微块缩放格式推进，硬件依赖更强 |
| **硬件原生低精度** | 从“存储量化、反量化计算”走向真正低精度计算 |
| **量化感知服务** | 推理框架根据 Batch、序列长度和硬件动态选择精度 |
| **KV Cache 与注意力量化** | 长上下文和高并发的主要优化方向 |
| **自动量化搜索** | 根据模型层敏感性搜索混合位宽和 Group Size |
| **QAT 工具链成熟** | 极低比特和专用模型会更依赖量化感知训练 |
| **量化与 MoE 协同** | Expert 敏感度、路由稳定性和并行部署成为独立课题 |
| **旋转 + 低位宽** | QuaRot/SpinQuant 让 4bit 激活可行，与 per-group 量化结合冲击 W4A4 |
| **2bit / 1.58bit** | BitNet 需重训；QuIP# 需自定义 kernel，端侧/专用芯片可能先行 |
| **量化感知的架构设计** | 模型训练时就考虑量化友好：离群值抑制、量化友好初始化 |

**核心结论**：

1. **8bit（INT8/FP8）≈ 无损**，工程上可当作默认选项；
2. **4bit 是当前性价比甜点**，W4A16 解决显存与 decode 延迟，W8A8/FP8 解决吞吐；
3. **量化效果高度依赖粒度和校准数据**，必须用自有任务评测，不能只看 PPL；
4. **量化不是银弹**：prefill 阶段、大 batch、MoE 路由等场景要单独分析瓶颈。

量化不会脱离硬件和推理框架独立存在。未来真正可用的“量化功能”，重点是**模型、格式、Kernel、硬件和评测闭环**，而不是单独生成一个更低比特的文件。

---

## 十六、缩减大模型体积的主流方法

> ⚠️ **来源说明**：本节为社区/厂商宣传口径的汇总，其中的倍数类数字（如“提速 40 倍”“精度损失 2% 以内”）未逐条核实，属于 🔴 宣称级信息，仅用于了解方向；可核实的数据以本文前文各章及参考论文为准。

缩减大模型体积的主流方法可分为 **量化、剪枝、知识蒸馏** 三大核心方向，不同方案在压缩率、精度损失、硬件适配性上各有侧重，可按需组合使用。

### 📉 量化技术

这是工业界最常用的轻量化手段，通过降低参数的数值表示位宽直接缩小体积：

- **FP16 量化**：将 FP32 参数转为 16 位浮点数，体积直接减半。
- **INT8 量化**：权重和激活值转为 8 位整数，理论体积为 FP32 的 1/4；推理加速幅度依赖硬件张量核心。
- **更低比特量化**：INT4/INT3/INT2 可进一步压缩体积，配合误差补偿框架可在边缘设备运行较小模型。
- 主流实现分为 **训练后量化（PTQ）** 和 **量化感知训练（QAT）** 两类。

### ✂️ 剪枝技术

针对大模型的过参数化特性，直接剔除冗余参数：

- **非结构化剪枝**：删除单个绝对值小的权重，理论上可实现高稀疏度，但需要支持稀疏张量核的硬件才能发挥加速效果。
- **结构化剪枝**：按通道、神经元或整层进行规则化裁剪，硬件友好度高，工业落地更广泛。
- 较新的方法会先用正交变换把参数重要性“浓缩”到少数子集，再执行剪枝，以缓解传统剪枝带来的性能跳水；相关效果需以论文和复现为准。

### 🧠 知识蒸馏

用“师生架构”把大模型的核心知识迁移到小模型中：

- 教师模型输出软标签（Soft Targets），学生模型同时学习硬标签和教师的输出分布，用更小的参数量逼近其能力。
- 结合 MoE 架构的动态路由蒸馏与蒸馏过程中的量化感知训练，是当前研究方向之一。

### 🛠️ 组合优化策略

实际项目中通常会叠加多种方法：先通过知识蒸馏得到目标参数量的小模型，再用结构化剪枝剔除冗余通道，最后用 INT8/INT4 量化完成体积压缩。组合后的实际压缩比与精度损失必须通过自有评测集验证。

---

## 十七、代码实现

### 1. 最小仿射量化

```python
import torch

def quantize_affine(x: torch.Tensor, bits: int = 8, group_size: int = -1):
    """对称 per-group 量化，返回量化整数与 scale。"""
    if group_size > 0:
        # [..., d] -> [..., d//g, g]
        orig_shape = x.shape
        x = x.reshape(-1, group_size)
    qmax = 2 ** (bits - 1) - 1
    scale = x.abs().amax(dim=-1, keepdim=True).clamp(min=1e-8) / qmax
    q = torch.round(x / scale).clamp(-qmax - 1, qmax).to(torch.int8)
    if group_size > 0:
        q = q.reshape(orig_shape)
        scale = scale.reshape(*orig_shape[:-1], orig_shape[-1] // group_size)
    return q, scale

def dequantize(q: torch.Tensor, scale: torch.Tensor, group_size: int = -1):
    if group_size > 0:
        orig_shape = q.shape
        q = q.reshape(-1, group_size).float()
        scale = scale.reshape(-1, 1)
        return (q * scale).reshape(orig_shape)
    return q.float() * scale

w = torch.randn(4096, 4096, dtype=torch.float16)
q, s = quantize_affine(w, bits=4, group_size=128)
w_hat = dequantize(q, s, 128)
print(f"位宽 4bit，误差: {(w.float() - w_hat).abs().mean():.6f}")
```

### 2. GPTQ 误差补偿伪代码

```python
# 对每一层 W ∈ R[d_out, d_in]，输入 X ∈ R[d_in, n_samples]
H = 2 * X @ X.T                      # Hessian 近似
H_inv = torch.linalg.cholesky_inverse(torch.linalg.cholesky(H))
H_inv = torch.linalg.cholesky(H_inv, upper=True)

for j in range(d_in):
    w = W[:, j]
    q = round(w / s)                 # 量化第 j 列
    err = (w - q * s) / H_inv[j, j]
    W[:, j:] -= err.outer(H_inv[j, :])  # 把误差补偿到未量化列
```

### 3. 常用工具命令

```bash
# AWQ 量化（AutoAWQ）
python -m awq.entry --model_path meta-llama/Llama-3.1-8B \
  --w_bit 4 --q_group_size 128 --save_dir llama3-8b-awq

# GPTQ 量化（AutoGPTQ / GPTQModel）
python -m gptqmodel.quantize --model meta-llama/Llama-3.1-8B \
  --bits 4 --group_size 128 --calib_dataset c4 --calib_samples 128

# GGUF 量化（llama.cpp）
python convert_hf_to_gguf.py ./llama3-8b --outfile llama3-8b-f16.gguf
./llama-quantize llama3-8b-f16.gguf llama3-8b-Q4_K_M.gguf Q4_K_M

# vLLM 加载 AWQ / FP8
vllm serve llama3-8b-awq --quantization awq --kv-cache-dtype fp8
```

---

## 十八、参考资源

### 论文与方法资料

- [GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers (Frantar et al., 2022)](https://arxiv.org/abs/2210.17323)
- [AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration (Lin et al., 2023)](https://arxiv.org/abs/2306.00978)
- [SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models (Xiao et al., 2022)](https://arxiv.org/abs/2211.10438)
- [LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale (Dettmers et al., 2022)](https://arxiv.org/abs/2208.07339)
- [QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., 2023)](https://arxiv.org/abs/2305.14314)
- [FP8 Formats for Deep Learning (Micikevicius et al., 2022)](https://arxiv.org/abs/2209.05433)
- [DeepSeek-V3 Technical Report (DeepSeek, 2024)](https://arxiv.org/abs/2412.19437) — FP8 训练配方
- [QuaRot: Outlier-Free 4-Bit Inference in Rotated LLMs (Ashkboos et al., 2024)](https://arxiv.org/abs/2404.00456)
- [SpinQuant: LLM Quantization with Learned Rotations (Liu et al., 2024)](https://arxiv.org/abs/2405.16406)
- [KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache (Liu et al., 2024)](https://arxiv.org/abs/2402.02750)
- [LLM-QAT: Data-Free Quantization Aware Training for Large Language Models (Liu et al., 2023)](https://arxiv.org/abs/2305.17888)
- [The Era of 1-bit LLMs: BitNet b1.58 (Ma et al., 2024)](https://arxiv.org/abs/2402.17764)
- [QuIP#: Even Better LLM Quantization with Hadamard Incoherence and Lattice Codebooks (Tseng et al., 2024)](https://arxiv.org/abs/2402.04396)
- [HQQ: Half-Quadratic Quantization of Large Neural Networks (Badri & Shaji, 2024)](https://arxiv.org/abs/2403.06162)
- [The case for 4-bit precision: k-bit Inference Scaling Laws (Dettmers & Zettlemoyer, 2022)](https://arxiv.org/abs/2212.09720) — 为什么 4bit 是甜点

### 工具与文档

- [GPTQ 官方实现](https://github.com/IST-DASLab/gptq)
- [AutoAWQ](https://github.com/casper-hansen/AutoAWQ) — AWQ 量化工具
- [GPTQModel](https://github.com/ModelCloud/GPTQModel) — GPTQ 生态维护分支
- [llama.cpp](https://github.com/ggml-org/llama.cpp) — GGUF 与 k-quants 参考实现
- [vLLM Quantization Docs](https://docs.vllm.ai/en/latest/features/quantization/index.html) — 各格式支持与用法
- [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM) — NVIDIA 量化推理
- [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes) — LLM.int8 / NF4
- [Neural Compressor (Intel)](https://github.com/intel/neural-compressor) — SmoothQuant/INT4 工具链
- [HuggingFace Quantization Guide](https://huggingface.co/docs/transformers/main/en/quantization/overview) — 各方案对比
- [MLX](https://github.com/ml-explore/mlx)

### 教程与阅读

- [A Visual Guide to Quantization (Maarten Grootendorst)](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-quantization) — 图解入门
- [Introduction to Weight Quantization (HuggingFace)](https://huggingface.co/blog/merve/quantization) — 概念与实战

> 量化格式、后端支持和推荐参数更新较快。实际部署前应以目标硬件、推理框架和模型仓库的最新官方文档为准，并使用业务样本重新评测。

---

*文档创建时间：2026年10月22日 · 合并更新：2026年11月2日*
