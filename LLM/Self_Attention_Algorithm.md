---
title: 自注意力算法（Self-Attention）详解
created: 2026-05-08
updated: 2026-05-13
tags: [AI, 大模型, Transformer, 自注意力, 注意力机制]
related: "[[LLM_Transformer_Architecture]], [[LLM_MoE_Architecture]]"
---

# 自注意力算法（Self-Attention）详解

> 本文为 [大模型 Transformer 架构详解](LLM_Transformer_Architecture.md) 中自注意力部分的扩展文档。

## 一、为什么需要自注意力

```
RNN 的困境:
┌───────────────────────────────────────────────────────┐
│  "我 昨天 在 公园 里 遇到 了 一个 非常 有趣 的 人"      │
│   ↓  ↓   ↓  ↓   ↓  ↓   ↓   ↓    ↓    ↓    ↓  ↓     │
│  h₁→h₂→h₃→h₄→h₅→h₆→h₇→h₈→h₉→h₁₀→h₁₁→h₁₂        │
│                                                        │
│  问题1: h₁₂ 需要经过 11 步才能看到 h₁ → 长距离依赖衰减 │
│  问题2: 必须按顺序计算 h₁→h₂→...→h₁₂ → 无法并行       │
│  问题3: 序列越长, 早期信息越容易丢失                    │
└───────────────────────────────────────────────────────┘

Self-Attention 的解决:
┌───────────────────────────────────────────────────────┐
│  "我 昨天 在 公园 里 遇到 了 一个 非常 有趣 的 人"      │
│   ↕  ↕   ↕  ↕   ↕  ↕   ↕   ↕    ↕    ↕    ↕  ↕     │
│  每个 Token 直接与所有其他 Token 交互                    │
│                                                        │
│  优势1: 任意两个 Token 距离为 1 → 无长距离依赖衰减     │
│  优势2: 所有 Token 同时计算 → 完全并行                  │
│  优势3: 动态权重, 语义相关者获得更高关注                │
└───────────────────────────────────────────────────────┘
```

---

## 二、Q、K、V 的直觉理解

自注意力借用了**信息检索**的思想，每个 Token 都会生成三个向量：

```
┌──────────────────────────────────────────────────────────┐
│                 Q / K / V 类比信息检索                     │
│                                                           │
│  场景: 你去图书馆找书                                     │
│                                                           │
│  Query (Q) = 你的搜索关键词                               │
│    "我想找关于量子计算的书"                                │
│    → 代表"我在找什么"                                     │
│                                                           │
│  Key (K) = 书架上每本书的标签/索引                        │
│    "量子物理导论"、"量子计算基础"、"经典力学"             │
│    → 代表"我是什么"                                       │
│                                                           │
│  Value (V) = 书的具体内容                                 │
│    每本书的实际文本                                       │
│    → 代表"我包含的实质信息"                               │
│                                                           │
│  匹配过程:                                                │
│  Q·K = 你的需求与每本书标签的匹配度                       │
│  → "量子计算基础" 匹配度最高 (0.8)                       │
│  → "量子物理导论" 匹配度其次 (0.5)                       │
│  → "经典力学"   匹配度最低 (0.05)                        │
│                                                           │
│  输出 = 0.8×V(量子计算基础) + 0.5×V(量子物理导论)        │
│        + 0.05×V(经典力学)                                 │
│  → 按匹配度加权, 获得最相关的信息组合                     │
└──────────────────────────────────────────────────────────┘
```

在自注意力中，**每个 Token 同时扮演 Q、K、V 三个角色**：
- 作为 **Q**：向其他 Token 发出查询
- 作为 **K**：被其他 Token 查询
- 作为 **V**：向其他 Token 提供信息

---

## 三、完整计算过程（逐步详解）

**输入**：一个包含 n 个 Token 的序列，每个 Token 表示为 d_model 维向量

```
X = [x₁, x₂, ..., xₙ]    形状: [n, d_model]
```

---

### 步骤 1：线性投影生成 Q、K、V

每个 Token 通过三个不同的权重矩阵，投影为 Query、Key、Value：

```
Q = X · W_Q     形状: [n, d_model] × [d_model, d_k] → [n, d_k]
K = X · W_K     形状: [n, d_model] × [d_model, d_k] → [n, d_k]
V = X · W_V     形状: [n, d_model] × [d_model, d_v] → [n, d_v]

其中:
  W_Q, W_K, W_V 是可学习的参数矩阵
  d_k = d_v = d_model (单头注意力时)
  d_k = d_v = d_model / h (多头注意力时, h 为头数)
```

**具体数值示例**（d_model=4, n=3）：

```
输入 X (3 个 Token, 每个维度 4):
         d₁  d₂  d₃  d₄
  x₁ = [ 1,  0,  2,  1]    (Token "猫")
  x₂ = [ 0,  1,  1,  0]    (Token "坐在")
  x₃ = [ 2,  1,  0,  1]    (Token "垫子")

W_Q (4×4, 随机初始化后训练学习):
  [0.1, 0.3, 0.0, 0.2]
  [0.2, 0.1, 0.3, 0.0]
  [0.0, 0.2, 0.1, 0.3]
  [0.3, 0.0, 0.2, 0.1]

Q = X · W_Q → 每个 Token 得到自己的 Query 向量
K = X · W_K → 每个 Token 得到自己的 Key 向量
V = X · W_V → 每个 Token 得到自己的 Value 向量
```

---

### 步骤 2：计算注意力分数（QK^T）

```
Scores = Q · K^T    形状: [n, d_k] × [d_k, n] → [n, n]

这个矩阵乘法的含义:
  Score[i][j] = Q_i · K_j = Token_i 对 Token_j 的原始关注度

结果是一个 n×n 的矩阵:
         K₁    K₂    K₃    ...  Kₙ
  Q₁  [s₁₁,  s₁₂,  s₁₃,  ..., s₁ₙ]   ← Token₁ 对所有 Token 的关注分数
  Q₂  [s₂₁,  s₂₂,  s₂₃,  ..., s₂ₙ]   ← Token₂ 对所有 Token 的关注分数
  Q₃  [s₃₁,  s₃₂,  s₃₃,  ..., s₃ₙ]   ← Token₃ 对所有 Token 的关注分数
  ...
  Qₙ  [sₙ₁,  sₙ₂,  sₙ₃,  ..., sₙₙ]   ← Tokenₙ 对所有 Token 的关注分数
```

**具体数值示例**：

```
         猫(K₁)  坐在(K₂)  垫子(K₃)
猫(Q₁)  [  24,      8,       18  ]    ← "猫"对"猫"关注24, 对"坐在"关注8, ...
坐在(Q₂) [  8,       6,       4   ]
垫子(Q₃) [  18,      4,       20  ]
```

---

### 步骤 3：缩放（Scale）

```
Scaled_Scores = Scores / √d_k

为什么需要缩放?
┌──────────────────────────────────────────────────────────┐
│  当 d_k 较大时, Q·K 的点积值方差也会很大                 │
│                                                           │
│  数学推导:                                                │
│  假设 q, k 的各分量独立, 均值0, 方差1                    │
│  则 q·k = Σ qᵢkᵢ, 其方差 = d_k                          │
│                                                           │
│  d_k=64 时: 点积方差 ≈ 64, 标准差 ≈ 8                   │
│  d_k=128 时: 点积方差 ≈ 128, 标准差 ≈ 11.3              │
│                                                           │
│  不缩放时:                                                │
│  点积值可能很大 → Softmax 输出接近 one-hot                │
│  → 梯度极小 → 训练几乎停滞                                │
│                                                           │
│  缩放后:                                                  │
│  方差归一化到 1 → Softmax 输出更平滑                      │
│  → 梯度正常 → 训练稳定                                    │
└──────────────────────────────────────────────────────────┘

例: d_k = 4, √d_k = 2
         猫(K₁)  坐在(K₂)  垫子(K₃)
猫(Q₁)  [  12,      4,       9   ]   ← 24/2, 8/2, 18/2
坐在(Q₂) [  4,       3,       2   ]
垫子(Q₃) [  9,       2,       10  ]
```

---

### 步骤 4：Softmax 归一化

```
Attention_Weights = softmax(Scaled_Scores, dim=-1)

Softmax 公式: softmax(zᵢ) = eᵢ^z / Σⱼ e^zⱼ

作用: 将原始分数转为概率分布 (每行和为1, 均为正数)

具体计算 (以第一行为例):
  z = [12, 4, 9]
  e^12 ≈ 162754.79
  e^4  ≈ 54.60
  e^9  ≈ 8103.08
  总和  ≈ 170912.47

  猫→猫:   162754.79 / 170912.47 ≈ 0.952
  猫→坐在:   54.60 / 170912.47 ≈ 0.0003
  猫→垫子: 8103.08 / 170912.47 ≈ 0.047

完整注意力权重矩阵:
           猫      坐在     垫子
猫     [  0.952,  0.0003,  0.047  ]    ← "猫"主要关注自身
坐在   [  0.844,  0.073,   0.027  ]    ← "坐在"主要关注"猫"
垫子   [  0.268,  0.0001,  0.731  ]    ← "垫子"关注"猫"和自身
```

**注意**：上述数值仅为示例，实际训练后的权重分布会更有意义。

---

### 步骤 5：加权求和

```
Output = Attention_Weights · V    形状: [n, n] × [n, d_v] → [n, d_v]

每个 Token 的输出是所有 Token 的 Value 加权求和:

  Output_i = Σⱼ Attention_Weights[i][j] · V_j

直观理解:
  Token_i 的输出 = 它"看到"的所有信息的加权混合
  权重越高 → 该 Token 对当前 Token 的影响越大

例: "猫" 的输出
  = 0.952 × V_猫 + 0.0003 × V_坐在 + 0.047 × V_垫子
  ≈ V_猫 (几乎只看到自己, 因为在这个示例中自身分数最高)
```

---

### 完整公式汇总

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  Attention(Q, K, V) = softmax(Q · K^T / √d_k) · V      │
│                                                           │
│  其中:                                                    │
│    Q = X · W_Q     Query 矩阵                            │
│    K = X · W_K     Key 矩阵                              │
│    V = X · W_V     Value 矩阵                            │
│    d_k = Key 向量维度                                     │
│    X = 输入序列 [n, d_model]                              │
│                                                           │
│  维度变化:                                                │
│    X: [n, d_model]                                        │
│    Q: [n, d_k]                                            │
│    K: [n, d_k]                                            │
│    V: [n, d_v]                                            │
│    QK^T: [n, n]                                           │
│    softmax(QK^T/√d_k): [n, n]                            │
│    Output: [n, d_v]                                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 四、因果注意力（Causal Attention / Masked Self-Attention）

在 Decoder-Only 模型（如 GPT、LLaMA）中，Token 不能"看到"未来的 Token，需要使用**因果掩码**：

```
标准 Self-Attention (BERT 等 Encoder-Only 模型):
  每个 Token 可以看到所有其他 Token
           猫    坐在   垫子    上
  猫     [  ✓,    ✓,    ✓,    ✓  ]
  坐在   [  ✓,    ✓,    ✓,    ✓  ]
  垫子   [  ✓,    ✓,    ✓,    ✓  ]
  上     [  ✓,    ✓,    ✓,    ✓  ]

Causal Self-Attention (GPT/LLaMA 等 Decoder-Only 模型):
  每个 Token 只能看到自己和之前的 Token
           猫    坐在   垫子    上
  猫     [  ✓,    ✗,    ✗,    ✗  ]   ← "猫"只能看到自己
  坐在   [  ✓,    ✓,    ✗,    ✗  ]   ← "坐在"能看到"猫"和自身
  垫子   [  ✓,    ✓,    ✓,    ✗  ]   ← "垫子"能看到前3个
  上     [  ✓,    ✓,    ✓,    ✓  ]   ← "上"能看到全部
```

**掩码实现方式**：

```
Mask 矩阵 (上三角为 -∞):
           猫    坐在   垫子    上
  猫     [  0,   -∞,   -∞,   -∞  ]
  坐在   [  0,    0,   -∞,   -∞  ]
  垫子   [  0,    0,    0,   -∞  ]
  上     [  0,    0,    0,    0  ]

将 Mask 加到注意力分数上:
  Scaled_Scores + Mask → Softmax

  Softmax(-∞) = 0 → 未来 Token 的权重为零
  Softmax(0)  = 正常值 → 过去 Token 正常参与
```

**为什么 Decoder-Only 需要因果掩码**：
- 自回归生成：模型逐 Token 生成，生成第 t 个 Token 时，第 t+1 及之后的 Token 尚不存在
- 训练时需要模拟推理条件：如果训练时能看到未来，推理时看不到，会导致训练/推理不一致
- 掩码保证了训练和推理的行为一致

---

## 五、注意力分数的直觉理解

```
句子: "那只 猫 坐在 柔软的 垫子 上 因为 它 很累"

训练后的注意力权重可能呈现以下模式:

Token "它" 的注意力分布:
  ┌──────────┬────────┬──────────────────────────┐
  │ Token    │ 权重   │ 原因                      │
  ├──────────┼────────┼──────────────────────────┤
  │ 它       │ 0.05   │ 自身                      │
  │ 猫       │ 0.65   │ "它"指代"猫" (指代消解)   │
  │ 垫子     │ 0.03   │ 语义关联弱                │
  │ 坐在     │ 0.12   │ 动作关联                  │
  │ 很累     │ 0.10   │ 因果关系 (因为累所以坐)   │
  │ 其他     │ 0.05   │ 弱关联                    │
  └──────────┴────────┴──────────────────────────┘

  "它" 的输出 = 0.65×V_猫 + 0.12×V_坐在 + 0.10×V_很累 + ...
  → "它"的表示被"猫"的信息主导 → 成功解决指代消解
```

---

## 六、自注意力的计算复杂度分析

```
┌──────────────────────────────────────────────────────────┐
│  设: n = 序列长度, d = 向量维度 (d_k = d_v = d)         │
│                                                           │
│  步骤 1: Q=XW_Q, K=XW_K, V=XW_V                        │
│    计算: 3 次 [n,d]×[d,d] 矩阵乘法                       │
│    复杂度: O(3nd²) = O(nd²)                              │
│                                                           │
│  步骤 2: QK^T                                            │
│    计算: [n,d]×[d,n] 矩阵乘法                            │
│    复杂度: O(n²d)                                         │
│    ⚠ 这是瓶颈! 与序列长度呈平方关系                       │
│                                                           │
│  步骤 3: Softmax                                          │
│    计算: 对 n×n 矩阵每行做 Softmax                        │
│    复杂度: O(n²)                                          │
│                                                           │
│  步骤 4: Weights · V                                      │
│    计算: [n,n]×[n,d] 矩阵乘法                            │
│    复杂度: O(n²d)                                         │
│                                                           │
│  总复杂度: O(n²d + nd²)                                   │
│                                                           │
│  当 n > d 时 (长序列): O(n²d) 主导 → 序列越长越慢        │
│  当 n < d 时 (短序列): O(nd²) 主导 → 投影是瓶颈          │
│                                                           │
│  空间复杂度: O(n²) (需存储 n×n 注意力矩阵)               │
│  ⚠ 这是长上下文的核心瓶颈                                 │
└──────────────────────────────────────────────────────────┘

实际数值感受:
  n=1K,  d=4096: QK^T 矩阵 = 1M 元素 → 可处理
  n=8K,  d=4096: QK^T 矩阵 = 64M 元素 → 压力增大
  n=32K, d=4096: QK^T 矩阵 = 1B 元素 → 显存挑战
  n=128K,d=4096: QK^T 矩阵 = 16B 元素 → 必须优化!
```

---

## 七、自注意力的数学性质

### 置换不变性（Permutation Invariance）

```
自注意力本身不关心 Token 的顺序:
  Attention([x₁, x₂, x₃]) 和 Attention([x₃, x₁, x₂])
  → 输出只是重新排列, 没有本质区别

这就是为什么需要位置编码 (Positional Encoding)!
  没有 RoPE/ALiBi 等位置信息:
  "猫咬狗" 和 "狗咬猫" 对模型来说没有区别
  → 必须通过位置编码注入位置信息
```

### 注意力权重作为软寻址（Soft Addressing）

```
自注意力可以看作一种"可微分的软寻址":

硬寻址 (传统数据库):
  SELECT * FROM memory WHERE key = "猫"   → 精确匹配一条

软寻址 (自注意力):
  Q="猫" 与所有 K 计算相似度
  → 按相似度加权读取所有 V
  → 多条记录按相关性混合返回

优势: 可微分 → 可以端到端训练
优势: 软选择 → 不遗漏可能相关的信息
劣势: O(n) 访问 → 必须扫描全部 Token
```

### 自注意力 vs 卷积 vs 循环

```
┌──────────────┬─────────────────┬─────────────────┬─────────────────┐
│     维度      │    自注意力      │     卷积 CNN     │    循环 RNN      │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 最大路径长度  │      O(1)       │   O(n/k)        │     O(n)        │
│ (任意两Token) │  一步直达       │  需要多层堆叠    │  需要逐步传递    │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 每层计算复杂度│   O(n²d)        │   O(k·n·d²)     │    O(nd²)       │
│              │  n² 瓶颈        │  k 为卷积核大小  │  线性于序列长度  │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 并行度       │   完全并行       │   完全并行       │   顺序 (无法并行)│
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 长距离依赖   │   天然支持       │   受限于感受野   │   梯度消失       │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 位置信息     │   需要额外编码   │   卷积隐含位置   │   顺序隐含位置   │
├──────────────┼─────────────────┼─────────────────┼─────────────────┤
│ 适用场景     │  通用序列建模    │  局部特征提取    │  短序列/流式     │
└──────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

## 八、自注意力变体总览

针对 O(n²) 复杂度瓶颈，学术界提出了多种改进方案：

```
                    Self-Attention
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     稀疏注意力      线性注意力      压缩注意力
          │              │              │
    ┌─────┼─────┐   ┌────┼────┐   ┌────┼────┐
    │     │     │   │    │    │   │    │    │
  Long-  Big-  Pool-  Lin-  Per-  Linear  GQA  MQA  MLA
  former Bird  former  ar    former Transformer
                    (2019) (2020)
    局部+全局  随机+块   池化   核近似  随机特征
    窗口      注意力   压缩   近似    低秩
```

| 变体 | 核心思路 | 复杂度 | 代表模型 |
|------|---------|--------|---------|
| **Sparse Attention** | 只计算部分 Token 对的注意力 | O(n√n) | Longformer, BigBird |
| **Linear Attention** | 用核函数分解 QK^T，避免 n×n 矩阵 | O(nd²) | Linear Transformer |
| **Performer** | 随机特征近似 Softmax | O(nd) | Performer |
| **Sliding Window** | 限定每个 Token 只看窗口内 | O(n·w·d) | Mistral (SWA) |
| **GQA** | 多个 Q 头共享 KV 头 | O(n²d/g) | LLaMA 2/3 |
| **MQA** | 所有 Q 头共享 1 个 KV 头 | O(n²d/h) | PaLM, GPT-4 |
| **MLA** | KV 压缩到低维潜在空间 | O(n·d_c·d) | DeepSeek-V2/V3 |
| **FlashAttention** | 算法级优化，不改数学 | O(n²d) 但快 2-4x | 通用 |
| **Ring Attention** | 跨设备分片计算 | O(n²d/N) | 研究阶段 |

---

## 九、自注意力的代码实现（PyTorch）

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class SelfAttention(nn.Module):
    """标准的缩放点积自注意力"""

    def __init__(self, d_model):
        super().__init__()
        self.d_k = d_model
        # 三个线性投影矩阵
        self.W_Q = nn.Linear(d_model, d_model, bias=False)
        self.W_K = nn.Linear(d_model, d_model, bias=False)
        self.W_V = nn.Linear(d_model, d_model, bias=False)
        # 输出投影
        self.W_O = nn.Linear(d_model, d_model, bias=False)

    def forward(self, X, mask=None):
        """
        X: [batch, seq_len, d_model]
        mask: [batch, 1, seq_len, seq_len] (可选, 因果掩码)
        """
        batch_size, seq_len, _ = X.shape

        # 步骤 1: 线性投影
        Q = self.W_Q(X)  # [batch, seq_len, d_model]
        K = self.W_K(X)  # [batch, seq_len, d_model]
        V = self.W_V(X)  # [batch, seq_len, d_model]

        # 步骤 2: 计算注意力分数 (QK^T / √d_k)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        # scores: [batch, seq_len, seq_len]

        # 步骤 2.5: 应用掩码 (如因果掩码)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        # 步骤 3: Softmax 归一化
        attn_weights = F.softmax(scores, dim=-1)
        # attn_weights: [batch, seq_len, seq_len]

        # 步骤 4: 加权求和
        output = torch.matmul(attn_weights, V)
        # output: [batch, seq_len, d_model]

        # 步骤 5: 输出投影
        output = self.W_O(output)

        return output, attn_weights


class MultiHeadAttention(nn.Module):
    """多头自注意力"""

    def __init__(self, d_model, num_heads):
        super().__init__()
        assert d_model % num_heads == 0

        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        self.W_Q = nn.Linear(d_model, d_model, bias=False)
        self.W_K = nn.Linear(d_model, d_model, bias=False)
        self.W_V = nn.Linear(d_model, d_model, bias=False)
        self.W_O = nn.Linear(d_model, d_model, bias=False)

    def forward(self, X, mask=None):
        batch_size, seq_len, _ = X.shape

        # 线性投影
        Q = self.W_Q(X)  # [batch, seq_len, d_model]
        K = self.W_K(X)
        V = self.W_V(X)

        # 拆分为多头: [batch, seq_len, d_model] → [batch, num_heads, seq_len, d_k]
        Q = Q.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.num_heads, self.d_k).transpose(1, 2)

        # 缩放点积注意力
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attn_weights = F.softmax(scores, dim=-1)
        attn_output = torch.matmul(attn_weights, V)

        # 合并多头: [batch, num_heads, seq_len, d_k] → [batch, seq_len, d_model]
        attn_output = attn_output.transpose(1, 2).contiguous()
        attn_output = attn_output.view(batch_size, seq_len, self.d_model)

        # 输出投影
        output = self.W_O(attn_output)

        return output


class GroupedQueryAttention(nn.Module):
    """分组查询注意力 (GQA) — LLaMA 2/3 使用"""

    def __init__(self, d_model, num_q_heads, num_kv_heads):
        super().__init__()
        assert d_model % num_q_heads == 0
        assert num_q_heads % num_kv_heads == 0

        self.d_model = d_model
        self.num_q_heads = num_q_heads
        self.num_kv_heads = num_kv_heads
        self.d_k = d_model // num_q_heads
        self.num_groups = num_q_heads // num_kv_heads  # 每组 Q 头数

        self.W_Q = nn.Linear(d_model, num_q_heads * self.d_k, bias=False)
        self.W_K = nn.Linear(d_model, num_kv_heads * self.d_k, bias=False)
        self.W_V = nn.Linear(d_model, num_kv_heads * self.d_k, bias=False)
        self.W_O = nn.Linear(d_model, d_model, bias=False)

    def forward(self, X, mask=None):
        batch_size, seq_len, _ = X.shape

        Q = self.W_Q(X).view(batch_size, seq_len, self.num_q_heads, self.d_k).transpose(1, 2)
        K = self.W_K(X).view(batch_size, seq_len, self.num_kv_heads, self.d_k).transpose(1, 2)
        V = self.W_V(X).view(batch_size, seq_len, self.num_kv_heads, self.d_k).transpose(1, 2)

        # 扩展 KV 头以匹配 Q 头: [b, kv_heads, s, d] → [b, q_heads, s, d]
        K = K.repeat_interleave(self.num_groups, dim=1)
        V = V.repeat_interleave(self.num_groups, dim=1)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attn_weights = F.softmax(scores, dim=-1)
        attn_output = torch.matmul(attn_weights, V)

        attn_output = attn_output.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)
        output = self.W_O(attn_output)

        return output


def create_causal_mask(seq_len):
    """创建因果掩码 (下三角矩阵)"""
    mask = torch.tril(torch.ones(seq_len, seq_len))
    mask = mask.unsqueeze(0).unsqueeze(0)  # [1, 1, seq_len, seq_len]
    return mask


# ============ 使用示例 ============

d_model = 512
seq_len = 128
batch_size = 4

# 标准 MHA
mha = MultiHeadAttention(d_model, num_heads=8)
X = torch.randn(batch_size, seq_len, d_model)
causal_mask = create_causal_mask(seq_len)
output = mha(X, mask=causal_mask)
print(f"MHA 输入: {X.shape}, 输出: {output.shape}")

# GQA (LLaMA 2 风格: 32 Q头, 8 KV头)
gqa = GroupedQueryAttention(d_model=4096, num_q_heads=32, num_kv_heads=8)
X_gqa = torch.randn(2, 512, 4096)
output_gqa = gqa(X_gqa)
print(f"GQA 输入: {X_gqa.shape}, 输出: {output_gqa.shape}")
```

---

## 十、注意力可视化模式

训练后的 Transformer 中，不同层和不同头的注意力呈现出不同的模式：

```
┌──────────────────────────────────────────────────────────┐
│              常见的注意力模式                              │
│                                                           │
│  模式 1: 对角线模式 (自身关注)                            │
│  ┌─────────────┐                                         │
│  │ █ ░ ░ ░ ░  │  每个 Token 主要关注自身                 │
│  │ ░ █ ░ ░ ░  │  常见于低层/浅层                         │
│  │ ░ ░ █ ░ ░  │  功能: 保留 Token 自身信息               │
│  │ ░ ░ ░ █ ░  │                                         │
│  │ ░ ░ ░ ░ █  │                                         │
│  └─────────────┘                                         │
│                                                           │
│  模式 2: 前向关注模式 (局部上下文)                        │
│  ┌─────────────┐                                         │
│  │ █ ░ ░ ░ ░  │  Token 关注紧邻的前几个 Token            │
│  │ █ █ ░ ░ ░  │  类似 N-gram 语言模型                    │
│  │ ░ █ █ ░ ░  │  常见于低层                              │
│  │ ░ ░ █ █ ░  │  功能: 捕获局部语法/短语                 │
│  │ ░ ░ ░ █ █  │                                         │
│  └─────────────┘                                         │
│                                                           │
│  模式 3: 长距离关注模式 (远程依赖)                        │
│  ┌─────────────┐                                         │
│  │ █ ░ ░ ░ ░  │  Token 跳过中间, 关注远处                │
│  │ ░ █ ░ ░ ░  │  例: 代词→先行词, 句首→句尾             │
│  │ ░ ░ █ ░ ░  │  常见于高层                              │
│  │ ░ ░ ░ █ ░  │  功能: 指代消解, 句间关系               │
│  │ █ ░ ░ ░ █  │                                         │
│  └─────────────┘                                         │
│                                                           │
│  模式 4: 分隔符关注模式                                   │
│  ┌─────────────┐                                         │
│  │ █ ░ ░ ░ ░  │  所有 Token 都关注分隔符                 │
│  │ ░ █ ░ ░ ░  │  例: 句号, [SEP], [CLS]                 │
│  │ ░ ░ █ ░ ░  │  常见于 BERT 类模型                     │
│  │ ░ ░ ░ █ ░  │  功能: 聚合句子级信息                    │
│  │ █ █ █ █ █  │  ← 分隔符行                              │
│  └─────────────┘                                         │
│                                                           │
│  模式 5: 退化解模式 (均匀分布)                            │
│  ┌─────────────┐                                         │
│  │ ░ ░ ░ ░ ░  │  所有 Token 均匀关注所有位置             │
│  │ ░ ░ ░ ░ ░  │  常见于训练不充分或退化的头              │
│  │ ░ ░ ░ ░ ░  │  功能: 无显著作用 (可剪枝)               │
│  │ ░ ░ ░ ░ ░  │                                         │
│  │ ░ ░ ░ ░ ░  │                                         │
│  └─────────────┘                                         │
└──────────────────────────────────────────────────────────┘
```

---

## 十一、参考资源

### 核心论文

- [Attention Is All You Need (Vaswani et al., 2017)](https://arxiv.org/abs/1706.03762) — Transformer 原始论文
- [Longformer (Beltagy et al., 2020)](https://arxiv.org/abs/2004.05150) — 稀疏注意力
- [BigBird (Zaheer et al., 2020)](https://arxiv.org/abs/2007.14062) — 稀疏注意力
- [Performer (Choromanski et al., 2020)](https://arxiv.org/abs/2009.14794) — 线性注意力
- [Linear Transformer (Katharopoulos et al., 2020)](https://arxiv.org/abs/2006.16236) — 线性注意力
- [FlashAttention (Dao et al., 2022)](https://arxiv.org/abs/2205.14135) — IO 感知精确注意力
- [GQA (Ainslie et al., 2023)](https://arxiv.org/abs/2305.13245) — 分组查询注意力
- [MLA / DeepSeek-V2 (DeepSeek, 2024)](https://arxiv.org/abs/2405.04434) — 多头潜在注意力

### 可视化工具

- [Attention Visualizer (Jesse Vig)](https://github.com/jessevig/bertviz) — BERTViz 注意力可视化
- [Transformer Explainer](https://github.com/poloclub/transformer-explainer) — 交互式 Transformer 解释器

### 关联文档

- [大模型 Transformer 架构详解](LLM_Transformer_Architecture.md) — Transformer 完整架构分析
- [大模型 MoE 架构详解](LLM_MoE_Architecture.md) — MoE 稀疏激活架构

---

*文档创建时间：2026年05月08日*
