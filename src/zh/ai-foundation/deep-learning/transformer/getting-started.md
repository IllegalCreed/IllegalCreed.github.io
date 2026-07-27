---
layout: doc
outline: [2, 3]
---

# 入门

> 基于原始论文《Attention Is All You Need》(2017) + 哈佛 Annotated Transformer + EleutherAI RoPE 文档编写，对照 PyTorch 当前实现

## 速查

- **Self-Attention 公式**：`Attention(Q,K,V) = softmax(QK^T / √dk) · V` —— Q·K 点积算相关性，softmax 归一化，加权 V
- **为何除以 √dk**：dk 维度大时点积值变大，把 softmax 推入梯度极小区域（饱和），除以 √dk 稳定梯度
- **Multi-Head（多头）**：并行 h 个注意力头（原论文 h=8），每头维度 dk=d_model/h=64，捕捉不同子空间的关系
- **位置编码必要性**：Self-Attention 本身**排列不变**（permutation-invariant），必须加位置信息才能感知顺序
- **原始 sinusoidal**：`PE(pos,2i)=sin(pos/10000^(2i/d))`、`PE(pos,2i+1)=cos(...)`，正余弦不同频率，可外推到更长序列
- **Encoder-Decoder**：6 层编码器（自注意力+FFN）+ 6 层解码器（掩码自注意力+交叉注意力+FFN）
- **残差+LayerNorm**：每个子层 `LayerNorm(x + Sublayer(x))`，深网络梯度流通的关键
- **FFN**：两层线性变换+ReLU，`FFN(x)=max(0, xW1+b1)W2+b2`，d_model=512→d_ff=2048→512
- **三大变体**：Encoder-only（BERT 双向）/ Decoder-only（GPT 自回归）/ Encoder-Decoder（T5 序列到序列）
- **RoPE**（现代主流）：旋转位置编码，把位置表为复数旋转，Q·K 只依赖相对位置，外推性强（LLaMA/Qwen 用）
- **ALiBi**：免位置嵌入，attention 直接加 `-m·距离` 线性偏置（BLOOM/MPT 用）
- **复杂度 O(n²)**：n 是序列长度，注意力矩阵 n×n，长上下文是主要瓶颈

## Transformer 是什么

Transformer 是 2017 年 Google 提出的**完全基于注意力**的序列架构。它回答了一个核心问题：**不靠循环（RNN）也不靠卷积（CNN），能否建模序列？** 答案是 Self-Attention——让序列中任意两个位置直接「互相看一眼」算相关性。

- **核心思想**：用注意力机制替代 RNN 的逐步计算，让所有位置并行交互
- **革命性**：训练全并行（GPU 友好）+ 长程依赖 O(1)（克服 RNN 梯度消失）
- **统一底座**：BERT/GPT/T5 三大范式都建立在 Transformer 之上，是现代 LLM 的基石

> 「Attention Is All You Need」——这句话确立了注意力机制的核心地位，Transformer 之后几乎所有 NLP 突破都建立在它之上。

### 为何取代 RNN

RNN 的致命伤是**逐步计算**——t 时刻的输出依赖 t-1 时刻的隐状态，无法并行，且长序列梯度消失。Transformer 用 Self-Attention 让所有位置同时计算：

| 维度 | RNN | Transformer |
| --- | --- | --- |
| **并行性** | ❌ 必须逐步 | ✅ 全并行 |
| **长程依赖** | O(n) 路径，易梯度消失 | **O(1)** 任意位置直接交互 |
| **训练效率** | 低（GPU 利用率差） | 高（充分利用 GPU 并行） |
| **位置感知** | 天然有序（计算顺序即位置） | 需额外位置编码 |

## Self-Attention：核心公式

注意力机制三要素 Query（查询）、Key（键）、Value（值）——借用信息检索的术语：

```text
Attention(Q, K, V) = softmax(Q · K^T / √dk) · V

其中：
Q = X · W_Q   (查询矩阵，shape: [n, dk])
K = X · W_K   (键矩阵，shape: [n, dk])
V = X · W_V   (值矩阵，shape: [n, dv])
```

**直觉理解**：对每个 Query 位置，算它与所有 Key 的点积（相关性分数），softmax 归一化成权重，再加权求和对应的 Value——「**我问（Q），谁相关（K），取它的内容（V）**」。

### 为何除以 √dk

点积 `Q·K^T` 的方差随维度 dk 线性增长。dk=64 时点积值可能很大，把 softmax 推入饱和区（梯度接近 0，学习停滞）。除以 `√dk` 把方差缩回 1 量级，稳定梯度。

> 这是数值稳定性技巧——不除会导致深网络训练崩溃，除以 dk（而非 dk）是经验最优（使方差为 1）。

## Multi-Head Attention（多头注意力）

单个注意力头只能学一种关系模式。Multi-Head 把 Q/K/V 拆成 h 份（原论文 h=8），每份独立做注意力，再拼接：

```text
MultiHead(Q,K,V) = Concat(head_1, ..., head_h) · W_O

其中 head_i = Attention(Q·W_Q_i, K·W_K_i, V·W_V_i)

每头维度：dk = dv = d_model / h = 512 / 8 = 64
总参数量与单头 d_model 相同（计算量不增）
```

**好处**：不同头关注不同子空间——有的头看语法关系（主谓）、有的看语义相似、有的看长距离指代，模型表达能力更强。

> 经验：8-16 头是常见配置。头数太多每头维度太小（信息不足），太少则表达力不够。

## 第一个 Transformer（PyTorch 30 行）

```python
import torch
import torch.nn as nn
import math

class SelfAttention(nn.Module):
    def __init__(self, d_model=512, num_heads=8):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads  # 每头维度 64

        # Q/K/V 投影（合并成一个大矩阵提高效率）
        self.W_qkv = nn.Linear(d_model, 3 * d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x, mask=None):
        batch, seq_len, _ = x.shape
        # 1. 投影 Q/K/V 并拆分多头
        qkv = self.W_qkv(x).reshape(batch, seq_len, 3, self.num_heads, self.d_k)
        q, k, v = qkv.permute(2, 0, 3, 1, 4)  # [batch, heads, seq, d_k]

        # 2. 注意力分数：Q·K^T / √dk
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        # 3. softmax 归一化 + 加权 V
        attn = torch.softmax(scores, dim=-1)
        out = attn @ v  # [batch, heads, seq, d_k]

        # 4. 合并多头 + 输出投影
        out = out.transpose(1, 2).reshape(batch, seq_len, self.d_model)
        return self.W_o(out)

# 使用
attn = SelfAttention(d_model=512, num_heads=8)
x = torch.randn(2, 10, 512)  # batch=2, seq=10, d_model=512
output = attn(x)  # shape: [2, 10, 512]
```

> 生产代码用 `nn.MultiheadAttention`（内置优化）或 Flash Attention（IO 感知的极速实现）。这里手写仅为理解原理。

## 下一步

- [架构深度与位置编码演进](./guide-line.md)：Encoder-Decoder 结构 + 四代位置编码 + 三大变体 + 复杂度分析
- [参考](./reference.md)：架构参数表 + 变体对比 + 经典论文资源
