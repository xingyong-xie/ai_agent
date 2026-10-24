---
title: 大模型量化详解
created: 2026-10-24
updated: 2026-10-24
tags: [AI, 大模型, 量化, 推理优化, GPTQ, AWQ, FP8, GGUF]
related: "[[LLM_Transformer_Architecture]], [[LLM_MoE_Architecture]], [[LLM_Model_Layer]]"
---

# 大模型量化详解

## 一、什么是模型量化

**量化（Quantization）** 是把神经网络中的浮点数（FP16/BF16/FP32）用低位宽的整数（INT8/INT4）或低精度浮点（FP8/FP4）表示的压缩技术。核心目标：**用更少的比特承载相近的模型能力**。

```
量化前（FP16）                      量化后（INT4）
┌──────────────────────┐          ┌──────────────────────┐
│ 权重 0.0234, -1.207, │   ──▶    │ 权重  3, -7, 12, ... │
│      0.881, ...      │          │ + scale / zero-point │
│ 每参数 16 bit        │          │ 每参数 4 bit + 少量元数据 │
└──────────────────────┘          └──────────────────────┘
       7B ≈ 14 GB                       7B ≈ 3.9 GB
```

### 为什么需要量化

| 维度 | 问题 | 量化的作用 |
|------|------|-----------|
| **显存容量** | 70B FP16 需 ~140GB，单卡放不下 | INT4 后 ~39GB，可塞进单张 48GB 卡 |
| **显存带宽** | 自回归解码每生成 1 个 Token 要把全部权重读一遍，是 decode 的瓶颈 | 位宽减半 → 带宽压力减半 → decode 提速 |
| **算力** | INT8/FP8 张量核心吞吐是 FP16 的 2~4 倍 | 适合 prefill / 高吞吐批处理 |
| **成本** | 显存与能耗直接换算成钱 | 同硬件跑更大模型 / 同模型用更小卡 |
| **端侧部署** | 手机、笔记本、树莓派内存有限 | 4-bit 让 7B 模型进入消费级设备 |

> **一句话**：训练追求精度（BF16/FP32），推理追求"精度够用的最便宜表示"，量化就是这条曲线上的折中。

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

## 二、量化的数学原理

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

```
浮点域                         整数域 [0, 2^b-1]
 min ─┐                         0 ─┐
      │      ×1/s, +z              │
      │  ───────────────────▶      │
 max ─┘                     2^b-1 ─┘
       ◀───────────────────
            ×s, -z
```

**对称 vs 非对称**：

| 类型 | 公式 | zero-point | 适用 | 特点 |
|------|------|-----------|------|------|
| **对称（signed）** | `q = clip(round(x/s), -2^(b-1), 2^(b-1)-1)` | z = 0 | 权重（分布近似零中心） | 计算简单，无零点开销 |
| **非对称（unsigned）** | `q = clip(round(x/s + z), 0, 2^b-1)` | z ≠ 0 | 激活（ReLU 后非负、分布偏斜） | 表达范围利用更充分 |

对称量化中 `s = max(|x|) / (2^(b-1) - 1)`；非对称中 `s = (max - min) / (2^b - 1)`，`z = round(-min / s)`。

### 2. 量化粒度

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

> 粒度越细，越能隔离离群值（outlier），但反量化开销和元数据越多。**INT4 必须配细粒度**，否则精度崩溃。

### 3. 误差来源

| 误差 | 原因 | 缓解 |
|------|------|------|
| **舍入误差** | round 到最近整数 | 提高位宽、细粒度 |
| **截断误差（clipping）** | 离群值把 scale 撑大，导致大多数值落到很少的量化档位 | 截断阈值搜索（如 percentile）、离群值保留 FP16、旋转 |
| **分组边界效应** | 同一 group 内分布差异大 | 减小 group size、按通道重排 |
| **累积误差** | 逐层量化误差在深层放大 | 逐层校准（GPTQ）而非独立最小二乘 |

量化误差常用 **SQNR（信噪比）** 衡量：`SQNR ≈ 6.02·b + 常数` dB —— 每多 1 bit 约 +6dB。这也是为什么 8bit 通常"无损"，4bit 开始需要精心设计。

### 4. QAT 的伪量化与 STE

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

## 三、量化方案分类

### 1. PTQ vs QAT

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

### 2. 量化对象组合

| 方案 | 权重 | 激活 | 特点 | 典型用途 |
|------|------|------|------|---------|
| **W16A16** | FP16 | FP16 | 基线 | 原始模型 |
| **W8A16** | INT8 | FP16 | 只省显存，算力不变 | 老卡/兼容性 |
| **W4A16** | INT4 | FP16 | 显存省 4 倍，decode 快 | 单卡/本地推理（GPTQ/AWQ） |
| **W8A8** | INT8 | INT8 | 显存 + 算力双收益 | 高吞吐服务（SmoothQuant） |
| **W4A8** | INT4 | INT8 | 折中方案 | 研究/新硬件 |
| **W8A8 FP8** | FP8 | FP8 | Hopper+ 原生支持，精度近 BF16 | 生产级训练/推理（DeepSeek-V3） |
| **W4A4 / FP4** | FP4 | FP4 | 极致压缩 | Blackwell、研究阶段 |

### 3. 静态 vs 动态量化

| 类型 | 激活 scale 何时确定 | 开销 | 精度 |
|------|-------------------|------|------|
| **静态** | 校准阶段一次性统计 | 推理零额外开销 | 依赖校准数据分布 |
| **动态** | 推理时按实际输入实时计算 | 少量运行时开销 | 对分布漂移更鲁棒 |

LLM 的激活分布随输入变化大（长文本/代码/多语言差异明显），因此**权重静态 + 激活动态/per-token** 是常见组合。

---

## 四、主流量化方法

### 1. GPTQ（Generative Pre-trained Transformer Quantization）

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

### 2. AWQ（Activation-aware Weight Quantization）

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

### 3. SmoothQuant

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

### 4. GGUF（llama.cpp）

**定位**：不是一种量化算法，而是 llama.cpp 的**模型文件格式 + 一套 k-quant 量化方案**，面向 CPU / Metal / 消费级 GPU 的本地推理。

| 量化类型 | 平均 bpw | 7B 体积 | 质量 | 建议 |
|---------|---------|---------|------|------|
| **Q2_K** | ~2.6 | ~2.3GB | 明显下降 | 仅极限内存 |
| **Q3_K_M** | ~3.9 | ~3.4GB | 可接受 | 内存紧张 |
| **Q4_K_S** | ~4.6 | ~4.0GB | 好 | 小内存首选 |
| **Q4_K_M** | ~4.8 | ~4.2GB | 很好 | **通用推荐** |
| **Q5_K_M** | ~5.7 | ~5.0GB | 接近无损 | 内存充裕 |
| **Q6_K** | ~6.6 | ~5.8GB | 几乎无损 | 追求质量 |
| **Q8_0** | ~8.5 | ~7.5GB | 基本无损 | 对照基线 |

配套技术：

| 技术 | 作用 |
|------|------|
| **k-quants** | 按张量重要性混合不同位宽（注意力/FFN 用不同 Q），块内多级 scale |
| **imatrix（importance matrix）** | 用校准数据统计每个权重的重要性，指导分配位宽，提升低比特质量 |
| **混合精度** | 嵌入层、输出层、norm 保持高精度，只压 FFN/注意力 |
| **GGUF 格式** | 单文件打包权重 + tokenizer + 元数据，mmap 加载，跨 CPU/GPU 分片 |

> Ollama、LM Studio、llama.cpp 服务默认吃的都是 GGUF；Apple Silicon 上另有 MLX 的 4-bit 方案（利用统一内存）。

### 5. bitsandbytes：LLM.int8() 与 NF4

| 方法 | 原理 | 用途 |
|------|------|------|
| **LLM.int8()** | 绝大多数维度做 INT8 向量量化，检测到幅值 > 6.0 的**离群维度**（约占 0.1%）单独保留 FP16 计算 | 8bit 推理，改动最小 |
| **NF4（4-bit NormalFloat）** | 假设权重近似正态，按分位数设计 16 个非均匀量化档位（信息论最优），并二次量化 scale | **QLoRA 微调**的事实标准 |
| **Double Quantization** | 对 scale 本身再量化一次（FP32→FP8），省 ~0.37 bit/权重 | 与 NF4 搭配降低显存 |

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

### 6. FP8（E4M3 / E5M2）

FP8 保留指数位，动态范围远大于 INT8，**精度损失小且无需复杂校准**，是 Hopper（H100/H200）及之后 GPU 的原生能力。

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

推理侧：vLLM/SGLang 支持 **FP8 weight-only** 和 **FP8 KV Cache**，H100 上通常能拿到接近 2 倍的 GEMM 吞吐，且几乎无损。

### 7. 新一代方法一览

| 方法 | 核心思路 | 特点 |
|------|---------|------|
| **QuIP#** | 随机旋转 + 格点量化（E8 lattice） | 2bit 可用，需自定义 kernel |
| **QuaRot / SpinQuant** | 用正交/学习到的旋转矩阵把离群值"打散"到所有通道 | 让 4bit 激活量化可行，常与其他方法叠加 |
| **HQQ** | 无校准、半二次求解 scale | 量化极快，适合大模型批量处理 |
| **BitNet b1.58** | 权重限制为 {-1, 0, +1}，从训练就量化 | 1.58bit 原生训练，CPU 也能跑，但需重训 |
| **NVFP4 / MXFP4** | 微缩放（micro-scaling）FP4，每 16/32 权重共享指数 | Blackwell 原生支持，旗舰模型开始采用 |
| **KIVI** | KV Cache 的 per-token key + per-channel value 2bit 量化 | 长上下文显存大幅下降 |

---

## 五、量化位宽 × 算子组合

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

## 六、KV Cache 量化

长上下文场景下，KV Cache 往往比权重还占显存，量化它收益巨大。

### 1. 显存公式

```
KV Cache 字节数 = 2 × L × H_kv × d_head × seq_len × batch × bytes_per_elem
                  ↑   ↑      ↑        ↑          ↑
                  K和V 层数 KV头数 每头维度   序列长度

例：Llama-3-70B（L=80, H_kv=8, d_head=128），seq=32K，batch=1，FP16：
    2 × 80 × 8 × 128 × 32768 × 2 B ≈ 10.7 GB   ← 已接近权重的一半（INT4 权重才 39GB）
```

### 2. 常用方案

| 方案 | 精度 | 收益 | 说明 |
|------|------|------|------|
| **FP8 KV Cache** | 几乎无损 | 减半 | vLLM/SGLang 一行开关，Hopper 首选 |
| **INT8 KV** | 轻微损失 | 减半 | 需 per-token/per-head scale，通用性好 |
| **KIVI（2bit）** | 有明显损失 | 4× | Key 按 token 量化（K 的离群值集中在少数通道），Value 按 channel 量化 |
| **KV eviction / 稀疏** | 取决于策略 | 2~10×+ | 丢弃/合并不重要 token（H2O、StreamingLLM），与量化可叠加 |

**注意事项**：

| 问题 | 说明 |
|------|------|
| **Attention Sink** | 序列开头几个 Token 的 KV 幅值极大，量化时容易失真，通常保留高精度或特殊处理 |
| **Key 的离群通道** | K 的离群值集中在固定通道（channel-wise），适合 per-channel；V 分布更均匀，适合 per-token |
| **长上下文放大误差** | 误差随 seq_len 累积，长文本任务要单独评测（RULER、长文摘要） |

---

## 七、显存与性能测算

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

## 八、大模型量化的特殊挑战

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

### 4. MoE 的额外问题

| 问题 | 说明 |
|------|------|
| **路由敏感** | Router 的 top-k 选择对微小扰动敏感，量化 router/gate 可能改变专家分配 |
| **专家负载不均** | 热门 Expert 的量化误差被更多 Token 放大 |
| **逐专家量化** | 大 MoE 可对每个 Expert 单独校准/量化，避免全局 scale 被极端专家主导 |
| **显存 vs 通信** | 量化也减少了 Expert 并行时的通信量，是 MoE 部署的重要收益 |

### 5. 评测陷阱

| 陷阱 | 说明 |
|------|------|
| **只看 Perplexity** | PPL 掉 0.1 仍可能让指令跟随/代码能力明显下降，需任务级评测 |
| **只看平均分** | 量化误差集中在少数能力（数学、长上下文、多语言），平均分掩盖短板 |
| **忽略采样参数** | 温度/重复惩罚会放大量化模型的退化（重复、胡言） |
| **未测长上下文** | KV Cache 量化 + 长序列是误差重灾区 |

推荐流程：`lm-evaluation-harness` / 自建任务集 → 对比 FP16 基线 → 关注最差任务而非平均。

---

## 九、实践选型

### 1. 按场景选型

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

### 2. 部署生态支持

| 工具 | 支持格式 | 备注 |
|------|---------|------|
| **vLLM** | GPTQ、AWQ、FP8、INT8、bitsandbytes、GGUF（实验性） | 服务端首选，PagedAttention + 连续批处理 |
| **SGLang** | AWQ、GPTQ、FP8、INT4 | 结构化生成/前缀缓存强 |
| **TensorRT-LLM** | FP8、FP4、INT4 AWQ/GPTQ、INT8 | NVIDIA 极致性能，编译成本高 |
| **llama.cpp / Ollama / LM Studio** | GGUF | 本地/端侧标准 |
| **MLX** | 4bit/8bit（自有格式） | Apple Silicon |
| **ExLlamaV2** | GPTQ/EXL2 | 单卡低延迟 |
| **lmdeploy** | AWQ、W4A16 | 国产模型适配好、TurboMind 引擎 |

### 3. 决策清单

```
1. 目标硬件是什么？
   ├─ CPU/Mac ──────────────▶ GGUF Q4_K_M / MLX
   ├─ Hopper(H100/H200) ────▶ FP8 W8A8
   ├─ Ampere(A100/3090) ────▶ AWQ(W4A16) 或 SmoothQuant(W8A8)
   └─ 消费级 24GB ──────────▶ AWQ / GPTQ W4A16

2. 瓶颈是显存、decode 延迟，还是 prefill 吞吐？
   ├─ 显存不够 ─────────────▶ 优先 W4A16
   ├─ 单请求延迟 ───────────▶ W4A16 + KV 量化
   └─ 吞吐/batch ───────────▶ FP8 / W8A8

3. 长上下文？
   └─ 是 ───────────────────▶ FP8 KV Cache（保底）+ 评测长文任务

4. 用自有数据做校准 + 跑任务级评测，对比 FP16 基线
5. 精度不达标：提高位宽 / 减小 group size / 混合精度回退敏感层
```

### 4. 常见误区

| 误区 | 纠正 |
|------|------|
| "量化一定更快" | prefill 计算受限，W4A16 帮助很小；小 batch 才明显 |
| "位宽越低越好" | 4bit 是甜点；3bit 以下收益递减、风险陡增 |
| "PPL 没掉就是无损" | 任务能力可能已退化，必须任务级评测 |
| "所有层一起量化" | 嵌入/输出/norm/首尾层应保留高精度 |
| "校准集随便找" | 校准分布决定量化质量，要贴近业务 |
| "量化后可以直接微调" | 量化权重一般冻结；要微调用 QLoRA 或先反量化 |

---

## 十、代码实现

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

## 十一、局限与未来

| 方向 | 现状 | 趋势 |
|------|------|------|
| **4bit 成为默认** | AWQ/GPTQ/GGUF 生态成熟 | 开源模型发布常同时给 BF16 + FP8 + AWQ 版本 |
| **FP8/FP4 硬件化** | Hopper FP8、Blackwell FP4 | 训练与推理统一低精度，量化从"后处理"变成"原生" |
| **旋转 + 低位宽** | QuaRot/SpinQuant 让 4bit 激活可行 | 与 per-group 量化结合，冲击 W4A4 |
| **2bit / 1.58bit** | BitNet 需重训；QuIP# 需自定义 kernel | 端侧/专用芯片可能先行 |
| **QAT 大模型化** | 成本高 | 蒸馏 + QAT 结合，小模型先行 |
| **量化感知的架构设计** | 模型训练时就考虑量化友好 | 离群值抑制、量化友好初始化 |
| **KV Cache 压缩** | FP8 已实用，2bit 研究阶段 | 长上下文/Agent 场景的关键降本点 |

**核心结论**：

1. **8bit（INT8/FP8）≈ 无损**，工程上可当作默认选项；
2. **4bit 是当前性价比甜点**，W4A16 解决显存与 decode 延迟，W8A8/FP8 解决吞吐；
3. **量化效果高度依赖粒度和校准数据**，必须用自有任务评测，不能只看 PPL；
4. **量化不是银弹**：prefill 阶段、大 batch、MoE 路由等场景要单独分析瓶颈。

---

## 十二、参考资源

### 核心论文

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

### 工具与文档

- [llama.cpp](https://github.com/ggml-org/llama.cpp) — GGUF 与 k-quants 参考实现
- [AutoAWQ](https://github.com/casper-hansen/AutoAWQ) — AWQ 量化工具
- [GPTQModel](https://github.com/ModelCloud/GPTQModel) — GPTQ 生态维护分支
- [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes) — LLM.int8 / NF4
- [vLLM Quantization Docs](https://docs.vllm.ai/en/latest/features/quantization/index.html) — 各格式支持与用法
- [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM) — NVIDIA 量化推理
- [Neural Compressor (Intel)](https://github.com/intel/neural-compressor) — SmoothQuant/INT4 工具链
- [HuggingFace Quantization Guide](https://huggingface.co/docs/transformers/main/en/quantization/overview) — 各方案对比

### 教程与阅读

- [A Visual Guide to Quantization (Maarten Grootendorst)](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-quantization) — 图解入门
- [Introduction to Weight Quantization (HuggingFace)](https://huggingface.co/blog/merve/quantization) — 概念与实战
- [The case for 4-bit precision: k-bit Inference Scaling Laws (Dettmers & Zettlemoyer, 2022)](https://arxiv.org/abs/2212.09720) — 为什么 4bit 是甜点

---

*文档创建时间：2026年10月24日*
