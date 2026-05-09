# 大模型 Transformer 架构详解

## 一、什么是 Transformer

Transformer 是 2017 年由 Google 团队在论文 **"Attention Is All You Need"** 中提出的神经网络架构，最初用于机器翻译。它完全基于**注意力机制（Attention）**，摒弃了传统 RNN/CNN 的序列依赖，实现了**并行计算**和**长距离依赖建模**，成为当今所有大语言模型（LLM）的基础架构。

核心定位：

| 维度 | 说明 |
|------|------|
| **提出时间** | 2017 年 |
| **提出者** | Google（Vaswani et al.） |
| **核心创新** | 自注意力机制（Self-Attention），完全抛弃循环和卷积 |
| **核心优势** | 并行计算、长距离依赖、可扩展性 |
| **影响** | GPT、BERT、LLaMA、Claude、DeepSeek 等所有主流 LLM 均基于 Transformer |

---

## 二、Transformer 整体架构

原始 Transformer 采用**编码器-解码器（Encoder-Decoder）** 结构：

```
┌─────────────────────────────────────────────────────────────┐
│                  Original Transformer                        │
│                                                              │
│  输入: "我爱学习"                          输出: "I love learning" │
│       │                                        ▲             │
│       ▼                                        │             │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │   Encoder Stack   │              │  Decoder Stack    │     │
│  │  ┌──────────────┐ │              │ ┌──────────────┐ │     │
│  │  │ Encoder Layer │ │   K, V       │ │ Decoder Layer │ │     │
│  │  │ ┌──────────┐ │ │ ──────────▶  │ │ ┌──────────┐ │ │     │
│  │  │ │Self-Attn │ │ │              │ │ │Masked Attn│ │ │     │
│  │  │ ├──────────┤ │ │              │ │ ├──────────┤ │ │     │
│  │  │ │  FFN     │ │ │              │ │ │Cross-Attn │ │ │     │
│  │  │ └──────────┘ │ │              │ │ ├──────────┤ │ │     │
│  │  └──────────────┘ │              │ │ │  FFN     │ │ │     │
│  │       × N 层      │              │ │ └──────────┘ │ │     │
│  └──────────────────┘              │ └──────────────┘ │     │
│                                     │      × N 层      │     │
│                                     └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 三大变体演进

```
                    Original Transformer (2017)
                    ┌─────────┬─────────┐
                    │Encoder  │ Decoder │
                    └────┬────┴────┬────┘
                         │         │
              ┌──────────┘         └──────────┐
              ▼                               ▼
     Encoder-Only                      Decoder-Only
         │                                 │
         ▼                                 ▼
       BERT (2018)                      GPT (2018)
    双向理解/分类                    自回归生成
         │                                 │
         ▼                                 ▼
    RoBERTa, DeBERTa               GPT-2/3/4, LLaMA
    文本分类、NER、QA               文本生成、对话、代码
```

| 变体 | 代表模型 | 特点 | 擅长 |
|------|---------|------|------|
| **Encoder-Only** | BERT, RoBERTa, DeBERTa | 双向注意力，看到全部上下文 | 理解、分类、抽取 |
| **Decoder-Only** | GPT 系列, LLaMA, Claude, DeepSeek | 单向（因果）注意力，只看前文 | 生成、对话、推理 |
| **Encoder-Decoder** | T5, BART, 原始 Transformer | 编码看全部，解码看前文+编码输出 | 翻译、摘要 |

**当前主流 LLM 几乎全部采用 Decoder-Only 架构**。

---

## 三、Transformer 核心组件详解

### 1. 自注意力机制（Self-Attention）

自注意力是 Transformer 的灵魂，核心公式：

```
Attention(Q, K, V) = softmax(Q · K^T / √d_k) · V
```

其中 Q = X·W_Q（查询）、K = X·W_K（键）、V = X·W_V（值），每个 Token 同时扮演三个角色：发出查询（Q）、被查询（K）、提供信息（V）。

缩放因子 √d_k 的作用：当 d_k 较大时，点积结果方差也大，Softmax 容易进入梯度极小区域。除以 √d_k 使方差回归正常，保证训练稳定。

> **详细内容请参阅**：[自注意力算法（Self-Attention）详解](Self_Attention_Algorithm.md)
>
> 包含：为什么需要自注意力、Q/K/V 直觉理解、完整 5 步计算过程（附数值示例）、因果注意力与掩码、复杂度分析、数学性质、9 种变体总览、PyTorch 完整代码实现（MHA + GQA）、注意力可视化模式

### 2. 多头注意力（Multi-Head Attention, MHA）

将注意力拆分为多个"头"，每个头关注不同的子空间：

```
┌──────────────────────────────────────────────────┐
│            Multi-Head Attention                   │
│                                                   │
│  Input X                                          │
│    │                                              │
│    ├──▶ Head 1: Q₁=XW_Q₁, K₁=XW_K₁, V₁=XW_V₁  │
│    │         → Attn₁ = softmax(Q₁K₁^T/√d_k)·V₁  │
│    │                                              │
│    ├──▶ Head 2: Q₂=XW_Q₂, K₂=XW_K₂, V₂=XW_V₂  │
│    │         → Attn₂ = softmax(Q₂K₂^T/√d_k)·V₂  │
│    │                                              │
│    ├──▶ ...                                       │
│    │                                              │
│    └──▶ Head h: Qₕ=XW_Qₕ, Kₕ=XW_Kₕ, Vₕ=XW_Vₕ  │
│              → Attnₕ = softmax(QₕKₕ^T/√d_k)·Vₕ  │
│                                                   │
│    Concat = [Attn₁; Attn₂; ...; Attnₕ]           │
│                                                   │
│    Output = Concat · W_O                          │
└──────────────────────────────────────────────────┘
```

**多头的意义**：
- **Head 1** 可能关注语法关系（主谓一致）
- **Head 2** 可能关注语义关联（指代消解）
- **Head 3** 可能关注位置关系（相邻词）
- 不同头自动学习不同的注意力模式

**参数关系**：

```
设 h = 头数, d_model = 模型维度
则 d_k = d_v = d_model / h

例: d_model = 4096, h = 32
→ d_k = d_v = 128
→ 每个头在 128 维子空间计算注意力
```

### 3. 前馈神经网络（FFN）

每个 Transformer 层在注意力之后都有一个 FFN：

```
标准 FFN:
┌────────────────────────────────────┐
│  Input (d_model)                   │
│    │                               │
│    ▼                               │
│  Linear: d_model → d_ff (通常 4×)  │
│    │                               │
│    ▼                               │
│  Activation (ReLU / GELU / SwiGLU) │
│    │                               │
│    ▼                               │
│  Linear: d_ff → d_model            │
│    │                               │
│    ▼                               │
│  Output (d_model)                  │
└────────────────────────────────────┘
```

FFN 的作用：注意力负责**信息路由**（Token 之间传递信息），FFN 负责**信息加工**（对每个 Token 独立做非线性变换）。可以理解为：
- **Attention = 检索**：从全序列中找到相关信息
- **FFN = 处理**：对检索到的信息进行加工和记忆

### 4. 残差连接与层归一化

```
┌──────────────────────────────────────┐
│  两种排列方式                         │
│                                       │
│  Post-LN（原始 Transformer）:         │
│    x = LayerNorm(x + Sublayer(x))    │
│    ⚠ 训练不稳定，需要 warm-up         │
│                                       │
│  Pre-LN（现代 LLM 标配）:             │
│    x = x + Sublayer(LayerNorm(x))    │
│    ✅ 训练更稳定，不需要 warm-up       │
└──────────────────────────────────────┘
```

**残差连接的作用**：
- 缓解梯度消失，允许梯度直接流过
- 使深层网络可训练（几十层甚至上百层）
- 每层只需学习增量变化（residual = 残差 = 增量）

### 5. 位置编码（Positional Encoding）

Transformer 本身没有位置感知能力（与 RNN 不同），需要显式注入位置信息。

#### 演进历程

| 方案 | 原理 | 代表模型 | 优劣 |
|------|------|---------|------|
| **正弦位置编码** | sin/cos 函数生成固定编码 | 原始 Transformer | 简单，可外推，但效果有限 |
| **可学习位置编码** | 随机初始化，训练学习 | GPT-2, BERT | 灵活，但不能超出训练长度 |
| **RoPE** | 旋转矩阵编码相对位置 | LLaMA, Qwen, Mistral | 可外推，相对位置，当前主流 |
| **ALiBi** | 注意力分数加距离偏置 | BLOOM | 简单有效，直接外推 |
| **MLA 位置编码** | 压缩到潜在空间 | DeepSeek-V2/V3 | 减少 KV Cache |

#### RoPE（旋转位置编码）详解

RoPE 是当前最主流的位置编码方案，核心思想：**将位置信息融入 Q 和 K 的点积计算中**。

```
RoPE 核心公式：
  q_m = R(m) · q    (m 位置处的 Query)
  k_n = R(n) · k    (n 位置处的 Key)

  其中 R(θ) 是旋转矩阵：
  ┌              ┐
  │ cos(mθ) -sin(mθ) │
  │ sin(mθ)  cos(mθ) │
  └              ┘

关键性质：
  q_m · k_n = f(m - n)

→ Q·K 点积只依赖相对位置 (m-n)
→ 天然编码相对位置关系
→ 支持位置外推（通过 NTK-aware 插值等）
```

### 6. 词嵌入（Token Embedding）

将离散的 Token ID 映射为连续向量：

```
Tokenizer: "我爱学习" → [101, 2345, 6789, 3456]
                          │     │     │     │
                          ▼     ▼     ▼     ▼
Embedding Matrix:       [0.1,  [0.3,  [0.7,  [0.2,
                  4096维  0.5,  0.1,  0.4,  0.8,
                         ...]  ...]  ...]  ...]
                          │     │     │     │
                          ▼     ▼     ▼     ▼
                  X = [e_101, e_2345, e_6789, e_3456]
```

**现代 Tokenizer 特点**：

| Tokenizer | 词表大小 | 特点 | 代表模型 |
|-----------|---------|------|---------|
| BPE | 32K-128K | 按字节对合并，多语言友好 | GPT-4, LLaMA 3 |
| SentencePiece | 32K-128K | 语言无关，子词分割 | LLaMA, Qwen |
| Tiktoken | 100K+ | BPE 变体，高效 | GPT-4, Claude |

---

## 四、现代 LLM 的 Transformer 改进

原始 Transformer 提出后，各模型做了大量架构改进。以 LLaMA 系列为代表，形成了一套"现代标准"：

```
┌─────────────────────────────────────────────────────────────┐
│              现代 Decoder-Only Transformer Block              │
│              (以 LLaMA / Qwen / Mistral 为代表)              │
│                                                              │
│  Input x                                                     │
│    │                                                         │
│    ▼                                                         │
│  ┌──────────────────┐                                        │
│  │ RMSNorm          │  ← 改进: LayerNorm → RMSNorm          │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ Grouped-Query    │  ← 改进: MHA → GQA                    │
│  │ Attention (GQA)  │     + RoPE 位置编码                    │
│  │ + RoPE           │     + FlashAttention 加速              │
│  └────────┬─────────┘                                        │
│           │                                                  │
│     ┌─────┴─────┐                                           │
│     │  残差连接   │  ← Pre-Norm 残差                         │
│     └─────┬─────┘                                           │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ RMSNorm          │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │ SwiGLU FFN       │  ← 改进: ReLU → SwiGLU               │
│  └────────┬─────────┘                                        │
│           │                                                  │
│     ┌─────┴─────┐                                           │
│     │  残差连接   │                                           │
│     └─────┬─────┘                                           │
│           │                                                  │
│           ▼                                                  │
│        Output                                                │
└─────────────────────────────────────────────────────────────┘
```

### 改进 1：RMSNorm 替代 LayerNorm

```
LayerNorm (原始):
  y = (x - μ) / √(σ² + ε) · γ + β
  需要计算均值 μ 和方差 σ²

RMSNorm (现代):
  y = x / √(mean(x²) + ε) · γ
  只计算均方根，省去均值计算

优势:
  ✅ 计算更快（减少约 10-20% 归一化开销）
  ✅ 效果相当甚至更好
  ✅ 去掉偏置项 β，简化参数
```

### 改进 2：GQA 替代 MHA

```
MHA (Multi-Head Attention):
  每个 Q 头都有独立的 K、V 头
  Q: 32 头, K: 32 头, V: 32 头
  → KV Cache 大，推理慢

GQA (Grouped-Query Attention):
  多个 Q 头共享一组 K、V 头
  Q: 32 头, K: 8 组, V: 8 组 (每 4 个 Q 头共享 1 组 KV)
  → KV Cache 减少75%，推理更快

MQA (Multi-Query Attention, GQA 的极端情况):
  所有 Q 头共享 1 组 K、V
  Q: 32 头, K: 1 组, V: 1 组
  → KV Cache 最小，但可能损失质量
```

```
┌──────────────────────────────────────────────────┐
│  MHA vs GQA vs MQA 对比                          │
│                                                   │
│  MHA (h=4):                                      │
│  Q: [Q1] [Q2] [Q3] [Q4]                         │
│  K: [K1] [K2] [K3] [K4]  ← 4 组 KV             │
│  V: [V1] [V2] [V3] [V4]                         │
│                                                   │
│  GQA (g=2):                                      │
│  Q: [Q1] [Q2] [Q3] [Q4]                         │
│  K: [K1] [K1] [K3] [K3]  ← 2 组 KV (共享)       │
│  V: [V1] [V1] [V3] [V3]                         │
│                                                   │
│  MQA:                                            │
│  Q: [Q1] [Q2] [Q3] [Q4]                         │
│  K: [K1] [K1] [K1] [K1]  ← 1 组 KV (全部共享)   │
│  V: [V1] [V1] [V1] [V1]                         │
└──────────────────────────────────────────────────┘
```

### 改进 3：SwiGLU 替代 ReLU

```
ReLU (原始):
  FFN(x) = max(0, xW₁) · W₂

GELU (GPT-2/BERT):
  FFN(x) = GELU(xW₁) · W₂

SwiGLU (现代标准):
  FFN(x) = (Swish(xW₁) ⊙ xW_gate) · W₂
         = (xW₁ · σ(β·xW_gate) ⊙ xW_gate) · W₂

  其中 Swish(x) = x · sigmoid(βx)

优势:
  ✅ 门控机制提供更好的表达能力
  ✅ 实验表明在相同参数下优于 ReLU/GELU
  ✅ 已成为 LLaMA/Qwen/Mistral 等主流模型的标配

代价:
  ⚠ 额外的门控投影矩阵，参数量略增
  → 通常将 d_ff 从 4d 调整为 (8/3)d 来补偿
```

### 改进 4：FlashAttention

```
标准 Attention:
  Q, K, V 全部加载到 HBM (高带宽显存)
  → 中间矩阵 S = QK^T 占用 O(n²) 显存
  → 频繁的 HBM 读写成为瓶颈

FlashAttention:
  利用 SRAM (片上缓存) 进行分块计算
  → 不需要物化完整的 n×n 注意力矩阵
  → 减少 HBM 读写次数 (从 O(n²) → O(n²d²/M))
  → 实际加速 2-4 倍，显存节省 5-20 倍

FlashAttention-2/3:
  进一步优化: 并行化、减少非矩阵乘法操作
  → 接近理论峰值算力利用率
```

---

## 五、主流大模型架构参数对比

| 模型 | 架构 | 参数量 | 层数 | d_model | 头数 | 注意力 | FFN 激活 | 位置编码 | Norm |
|------|------|--------|------|---------|------|--------|---------|---------|------|
| **GPT-2** | Decoder | 1.5B | 48 | 1600 | 25 | MHA | GELU | 可学习 | Post-LN |
| **GPT-3** | Decoder | 175B | 96 | 12288 | 96 | MHA | GELU | 可学习 | Pre-LN |
| **GPT-4** | Decoder* | ~1.8T* | - | - | - | MQA* | - | - | - |
| **LLaMA 1** | Decoder | 7-65B | 32-80 | 4096-8192 | 32-64 | MHA | SwiGLU | RoPE | RMSNorm |
| **LLaMA 2** | Decoder | 7-70B | 32-80 | 4096-8192 | 32-64 | GQA(70B) | SwiGLU | RoPE | RMSNorm |
| **LLaMA 3** | Decoder | 8-70B | 32-80 | 4096-8192 | 32-64 | GQA | SwiGLU | RoPE | RMSNorm |
| **LLaMA 3.1** | Decoder | 8-405B | - | - | - | GQA | SwiGLU | RoPE | RMSNorm |
| **Qwen2** | Decoder | 0.5-72B | 24-80 | 896-8192 | 14-64 | GQA | SwiGLU | RoPE | RMSNorm |
| **Qwen2.5** | Decoder | 0.5-72B | - | - | - | GQA | SwiGLU | RoPE | RMSNorm |
| **Mistral 7B** | Decoder | 7B | 32 | 4096 | 32 | GQA | SwiGLU | RoPE | RMSNorm |
| **Mixtral 8x7B** | MoE | 47B | 32 | 4096 | 32 | GQA | SwiGLU | RoPE | RMSNorm |
| **DeepSeek-V2** | MoE | 236B | 60 | 5120 | 128 | MLA | SwiGLU | RoPE | RMSNorm |
| **DeepSeek-V3** | MoE | 671B | 61 | 7168 | 128 | MLA | SwiGLU | RoPE | RMSNorm |
| **Claude** | Decoder* | - | - | - | - | - | - | - | - |

> 带 * 的为推测/未公开信息

### 现代标准配置总结

当前主流开源 LLM 几乎统一采用以下架构选择：

| 组件 | 原始 Transformer | 现代标准 | 改进收益 |
|------|-----------------|---------|---------|
| **归一化** | LayerNorm | RMSNorm | 更快，更稳定 |
| **归一化位置** | Post-LN | Pre-LN | 训练更稳定 |
| **注意力** | MHA | GQA | KV Cache 减少，推理更快 |
| **激活函数** | ReLU | SwiGLU | 更好表达力 |
| **位置编码** | 正弦编码 | RoPE | 支持外推，相对位置 |
| **注意力实现** | 标准 | FlashAttention | 2-4x 加速，省显存 |
| **偏置项** | 有 bias | 无 bias | 略微加速，效果不减 |

---

## 六、训练与推理

### 1. 训练过程

```
┌──────────────────────────────────────────────────┐
│              LLM 训练三阶段                       │
│                                                   │
│  Stage 1: 预训练 (Pre-training)                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ 目标: 下一个 Token 预测 (Next Token Pred)   │ │
│  │ 数据: 万亿级互联网文本                       │ │
│  │ 损失: Cross-Entropy                         │ │
│  │ 成本: 数百万 GPU 小时                        │ │
│  │ 输出: Base Model (基座模型)                  │ │
│  └─────────────────────────────────────────────┘ │
│                    │                              │
│                    ▼                              │
│  Stage 2: 监督微调 (SFT)                          │
│  ┌─────────────────────────────────────────────┐ │
│  │ 目标: 学习对话格式和指令遵循                 │ │
│  │ 数据: 数万条高质量问答对                     │ │
│  │ 成本: 数百 GPU 小时                          │ │
│  │ 输出: SFT Model (对话模型)                   │ │
│  └─────────────────────────────────────────────┘ │
│                    │                              │
│                    ▼                              │
│  Stage 3: 对齐训练 (RLHF / DPO / KTO)            │
│  ┌─────────────────────────────────────────────┐ │
│  │ 目标: 对齐人类偏好 (有用、安全、诚实)       │ │
│  │ 方法: 强化学习 (RLHF) 或直接偏好优化 (DPO)  │ │
│  │ 数据: 人类偏好比较数据                       │ │
│  │ 输出: Aligned Model (对齐模型)               │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 2. 推理过程（自回归生成）

```
输入: "人工智能的未来是"

Step 1: [人工智能的未来是] → Model → 预测 "充满"
Step 2: [人工智能的未来是充满] → Model → 预测 "无"
Step 3: [人工智能的未来是充满无] → Model → 预测 "限"
Step 4: [人工智能的未来是充满无限] → Model → 预测 "可能"
Step 5: [人工智能的未来是充满无限可能] → Model → 预测 "<EOS>"

输出: "人工智能的未来是充满无限可能"
```

**KV Cache 优化**：

```
无 KV Cache (每次重新计算所有 Token 的 K, V):
  Step 1: 计算 [人,工,智,能,的,未,来,是] 的 K, V    ← 8 Token
  Step 2: 计算 [人,工,智,能,的,未,来,是,充,满] 的 K, V ← 10 Token
  Step 3: 计算 [人,...,限] 的 K, V                     ← 11 Token
  → 重复计算，O(n²) 复杂度

有 KV Cache (缓存已计算的 K, V):
  Step 1: 计算并缓存 [人,...,是] 的 K, V
  Step 2: 只计算 [充满] 的 K, V，追加到缓存
  Step 3: 只计算 [限] 的 K, V，追加到缓存
  → 避免重复计算，O(n) 复杂度
  → 推理速度提升数倍
```

---

## 七、Transformer 的计算复杂度

| 操作 | 时间复杂度 | 空间复杂度 | 说明 |
|------|----------|----------|------|
| **Self-Attention** | O(n² · d) | O(n²) | n 为序列长度，**瓶颈** |
| **FFN** | O(n · d²) | O(n · d) | 与序列长度线性相关 |
| **词嵌入** | O(n · d) | O(n · d) | 查表操作 |
| **整体单层** | O(n² · d + n · d²) | O(n² + n · d) | |

**长上下文的挑战**：注意力复杂度是 O(n²)，序列长度翻倍，计算量翻 4 倍。

```
序列长度    注意力计算量 (相对值)
1K         1x
2K         4x
4K         16x
8K         64x
32K        1,024x
128K       16,384x
```

### 长上下文优化方案

| 方案 | 原理 | 代表 |
|------|------|------|
| **FlashAttention** | 分块计算，减少 HBM 读写 | 通用 |
| **GQA/MQA** | 减少 KV 头数，降低 Cache | LLaMA, Mistral |
| **MLA** | 压缩 KV 到低维潜在空间 | DeepSeek-V2/V3 |
| **Sliding Window** | 限定注意力窗口范围 | Mistral (SWA) |
| **Ring Attention** | 跨设备分片计算超长序列 | 研究阶段 |
| **RoPE 插值** | 位置编码外推到更长序列 | NTK-aware, YaRN |

---

## 八、Transformer 家族全景

```
                          Transformer (2017)
                               │
                ┌──────────────┼──────────────┐
                │              │              │
          Encoder-Only   Encoder-Decoder  Decoder-Only
                │              │              │
             BERT(2018)    T5(2019)       GPT-2(2018)
                │              │              │
          RoBERTa(2019)  BART(2019)      GPT-3(2020)
          ALBERT(2019)   mT5(2020)       Codex(2021)
          DeBERTa(2020)                   PaLM(2022)
          Electra(2020)                   Chinchilla(2022)
                │                          LLaMA(2023)
                │              ┌───────────┼───────────┐
                │              │           │           │
                │         Dense LLM    MoE LLM    代码模型
                │              │           │           │
                │         GPT-4      Mixtral    Codex
                │         Claude     DeepSeek   Code LLaMA
                │         LLaMA 3    Qwen-MoE  DeepSeek-Coder
                │         Qwen 2.5                       │
                │         Mistral                        │
                │              │                         │
                │         ┌────┴────┐                    │
                │         │         │                    │
                │      通用LLM   多模态LLM              │
                │         │         │                    │
                │      ChatGPT   GPT-4V                 │
                │      Claude   Gemini                   │
                │               Qwen-VL                  │
                │               LLaVA                    │
                │                                        │
                └────────────────────────────────────────┘
```

---

## 九、Transformer 的局限与未来

### 局限性

| 局限 | 说明 | 影响 |
|------|------|------|
| **O(n²) 注意力** | 序列长度平方复杂度 | 长上下文成本极高 |
| **位置外推难** | 训练长度外的位置编码退化 | 需要额外工程支持 |
| **无真正推理** | 本质是模式匹配，非逻辑推理 | 复杂推理容易出错 |
| **幻觉问题** | 生成内容不一定符合事实 | 可靠性受限 |
| **训练成本高** | 大规模预训练消耗大量算力 | 只有少数机构能做 |

### 未来方向

| 方向 | 说明 | 代表工作 |
|------|------|---------|
| **线性注意力** | 用核函数近似替代 Softmax，复杂度 O(n) | Linear Attention, RetNet |
| **状态空间模型** | 用 SSM 替代注意力，线性复杂度 | Mamba, Jamba |
| **混合架构** | SSM + Attention 混合，兼顾效率和质量 | Jamba, Zamba |
| **长上下文优化** | 更高效的长序列处理 | Ring Attention, Blockwise Attention |
| **稀疏注意力** | 只计算重要的注意力连接 | Longformer, BigBird |
| **多模态融合** | 统一处理文本、图像、音频 | GPT-4o, Gemini |

---

## 十、参考资源

### 核心论文

- [Attention Is All You Need (Vaswani et al., 2017)](https://arxiv.org/abs/1706.03762) — Transformer 原始论文
- [BERT (Devlin et al., 2018)](https://arxiv.org/abs/1810.04805) — Encoder-Only 代表
- [GPT-2 (Radford et al., 2019)](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf) — Decoder-Only 代表
- [RoPE (Su et al., 2021)](https://arxiv.org/abs/2104.09864) — 旋转位置编码
- [SwiGLU (Shazeer, 2020)](https://arxiv.org/abs/2002.05202) — 门控线性单元
- [FlashAttention (Dao et al., 2022)](https://arxiv.org/abs/2205.14135) — 高效注意力实现
- [GQA (Ainslie et al., 2023)](https://arxiv.org/abs/2305.13245) — 分组查询注意力
- [LLaMA (Touvron et al., 2023)](https://arxiv.org/abs/2302.13971) — 现代标准架构
- [Mamba (Gu & Dao, 2023)](https://arxiv.org/abs/2312.00752) — 状态空间模型

### 教程与博客

- [The Illustrated Transformer (Jay Alammar)](https://jalammar.github.io/illustrated-transformer/) — 经典可视化教程
- [Transformer from Scratch (Peter Bloem)](https://peterbloem.nl/blog/transformers) — 代码级详解
- [HuggingFace Transformer Course](https://huggingface.co/learn/nlp-course/chapter1/4) — 实战课程

### 代码仓库

- [HuggingFace Transformers](https://github.com/huggingface/transformers) — 最流行的 Transformer 库
- [LLaMA (Meta)](https://github.com/meta-llama/llama3) — Meta 开源 LLM
- [Qwen (Alibaba)](https://github.com/QwenLM/Qwen) — 阿里开源 LLM
- [Mistral (Mistral AI)](https://github.com/mistralai/mistral-src) — Mistral 开源权重

---

*文档创建时间：2026年05月08日*
