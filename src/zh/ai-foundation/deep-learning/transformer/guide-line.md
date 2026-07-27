---
layout: doc
outline: [2, 3]
---

# 指南

> 基于原始论文《Attention Is All You Need》(2017) + Annotated Transformer + EleutherAI RoPE/ALiBi 文档编写

## 速查

- **Encoder-Decoder**：编码器（自注意力+FFN，双向看全序列）+ 解码器（掩码自注意力+交叉注意力+FFN，自回归生成）
- **三大变体**：Encoder-only（BERT，理解类任务）/ Decoder-only（GPT，生成类任务）/ Encoder-Decoder（T5/BART，翻译/摘要）
- **位置编码四代**：sinusoidal（原始）→ 学习式绝对（BERT/GPT-2）→ 相对（T5）→ RoPE（LLaMA/Qwen）/ ALiBi（BLOOM/MPT）
- **RoPE 原理**：把位置表为复数旋转，乘性地作用于 Q/K，使 Q·K 只依赖相对位置，外推性强
- **ALiBi 原理**：免位置嵌入，attention 直接加 `-m·距离` 线性偏置，训练短推理长
- **注意力复杂度 O(n²)**：n 是序列长度，Flash Attention/稀疏注意力/线性注意力是优化方向
- **KV Cache**：自回归解码缓存历史 K/V，避免重复计算，是推理加速关键
- **Pre-Norm vs Post-Norm**：原论文 Post-Norm（`LN(x+Sub(x))`）难训练；现代多用 Pre-Norm（`x+Sub(LN(x))`）更稳
- **d_model/h/d_ff 关系**：d_model=512, h=8, dk=64, d_ff=2048（4×d_model）

## Encoder-Decoder 结构

原始 Transformer 是 Encoder-Decoder 架构，用于机器翻译（序列到序列）：

```text
输入序列 → [Embedding + 位置编码] → Encoder（N=6 层）→ 编码表示
                                                  ↓
输出序列 → [Embedding + 位置编码] → Decoder（N=6 层）→ 输出概率
```

### Encoder 块（每层 2 个子层）

1. **Multi-Head Self-Attention**：输入序列自己和自己算注意力（双向，每个位置能看到所有位置）
2. **Feed-Forward Network**：两层线性+ReLU，对每个位置独立变换

每个子层外包残差连接 + LayerNorm：`output = LayerNorm(x + Sublayer(x))`

### Decoder 块（每层 3 个子层）

1. **Masked Multi-Head Self-Attention**：掩码注意力，当前位置只能看前面（保证自回归生成不偷看未来）
2. **Cross-Attention（交叉注意力）**：Q 来自解码器，K/V 来自编码器输出——这是解码器「看」编码信息的地方
3. **Feed-Forward Network**：同 Encoder

> 掩码机制：上三角 mask，把未来位置的注意力分数设为 -inf，softmax 后权重为 0。

## 三大变体

Transformer 演化出三大范式，分别适合不同任务：

| 变体 | 代表 | 结构 | 注意力方向 | 适用任务 |
| --- | --- | --- | --- | --- |
| **Encoder-only** | BERT、RoBERTa | 仅编码器 | 双向（看全序列） | 理解类：分类、NER、问答 |
| **Decoder-only** | GPT、LLaMA、Qwen | 仅解码器 | 单向（只看前面） | 生成类：文本生成、代码、对话 |
| **Encoder-Decoder** | T5、BART、Whisper | 完整 Enc-Dec | 编码双向+解码单向 | 序列到序列：翻译、摘要 |

**Decoder-only 为何成为 LLM 主流**：生成任务天然自回归，Decoder-only 结构简单、Scaling 友好、训练数据利用率高（每个 token 都是训练信号），GPT 系列证明了「足够大的 Decoder-only + 海量数据」能涌现出通用能力。

## 位置编码四代演进

Self-Attention 本身**排列不变**——打乱输入顺序注意力输出不变（除了位置编码）。所以必须注入位置信息。

### 第一代：Sinusoidal（原始 Transformer）

固定正弦余弦编码，加到词嵌入上：

```text
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

不同维度用不同频率的正余弦（波长几何级数增长）。优点：无需训练、理论上可外推到更长序列；缺点：外推效果实际一般。

### 第二代：学习式绝对位置编码（BERT/GPT-2）

为每个绝对位置学一个嵌入向量（类似词嵌入）。简单有效，但**无法外推**——训练时只见过 512 位置，推理时遇到 1024 就崩。BERT/GPT-2/早期 GPT-3 都用这种。

### 第三代：相对位置编码（T5/Transformer-XL）

不编码绝对位置，而是编码 token 间的**相对距离**（如「相隔 3 个位置」）。T5 在 attention score 上加一个基于相对距离的偏置。缺点：需构造完整 n×n 相对距离矩阵，与 Flash Attention 等高效注意力不兼容。

### 第四代：RoPE（现代主流）

旋转位置编码（Rotary Position Embedding，苏剑林 2021）——把位置表示为**复数旋转**，乘性地作用于 Q 和 K：

```text
核心思想：把位置 m 的 Q/K 向量旋转角度 m·θ
数学性质：旋转后 Q_m · K_n 的点积只依赖 (m-n) 相对位置
```

**优势**：

- **统一绝对与相对**：形式上是绝对旋转，效果上是相对注意力
- **外推性强**：训练短序列，推理长序列仍有效（配合 NTK-aware scaling 更佳）
- **兼容高效注意力**：不破坏 Flash Attention 的计算流程

**使用者**：LLaMA 全系、Qwen、GPT-NeoX、PaLM、Mistral——几乎所有现代开源 LLM。

### 第四代（并列）：ALiBi

另一条路线——**完全不要位置编码**，直接在 attention score 上加线性偏置：

```text
attention_score(i, j) = Q_i · K_j - m · (i - j)
                                      ↑ 距离越远惩罚越大
```

**优势**：免位置嵌入、结构简单、外推性极强（训练 1024 推理 2048 不重训）。

**使用者**：BLOOM、MPT。

> RoPE vs ALiBi：RoPE 是当前绝对主流（生态、效果、外推均优），ALiBi 在超长上下文外推有独特优势但用得较少。

## 复杂度与优化

### 注意力的 O(n²) 之痛

序列长度 n 的自注意力需构造 n×n 注意力矩阵——显存与计算都是 O(n²)：

| 序列长度 n | 注意力矩阵大小 | 显存（FP16） |
| --- | --- | --- |
| 512 | 256K | 0.5 MB |
| 4K | 16M | 32 MB |
| 32K | 1G | 2 GB |
| 128K | 16G | 32 GB（单层！） |
| 1M | 1T | 爆炸 |

### KV Cache：自回归推理加速

Decoder 生成时，每生成一个新 token 都要对所有历史 token 算注意力。若不缓存，第 t 步要重算 t-1 次历史 K/V。KV Cache 把历史 K/V 缓存起来，新 token 只算自己的 Q 去查缓存：

```text
无 KV Cache：第 t 步计算量 O(t²)
有 KV Cache：第 t 步计算量 O(t)（只算新 token 的 Q·历史KV）
```

代价：显存随序列长度线性增长（这也是长上下文推理贵的原因）。

### Flash Attention：IO 感知优化

标准注意力的瓶颈是**显存读写**（要把 n×n 矩阵写到 HBM 再读回）。Flash Attention（Tri Dao 2022）把注意力分块在 SRAM 内计算，避免中间矩阵落盘，**不改变数学结果但快 2-4 倍、省 5-20 倍显存**。现代 LLM 训练标配。

## Pre-Norm vs Post-Norm

原论文用 Post-Norm（残差后做 LayerNorm），但深网络训练不稳定。现代实现多用 Pre-Norm（先 LayerNorm 再做子层）：

```text
Post-Norm（原论文）：output = LayerNorm(x + Sublayer(x))
Pre-Norm（现代主流）：output = x + Sublayer(LayerNorm(x))
```

Pre-Norm 让残差路径「干净」（无 LayerNorm 阻挡），深网络梯度更稳定，GPT-2 之后几乎所有 LLM 都用 Pre-Norm。

## 反模式（生产坑）

1. **忘加位置编码**：Self-Attention 排列不变，不加位置信息则「猫咬狗」和「狗咬猫」输出相同——必须加位置编码
2. **Decoder 不加掩码**：自回归生成时若不 mask 未来位置，模型偷看答案导致训练/推理不一致
3. **用学习式绝对编码做长上下文**：训练 512 推理 8K 必然崩溃，应换 RoPE/ALiBi
4. **除以 dk 而非 √dk**：除以 dk 缩放过度导致注意力过于平均（信息丢失），经验最优是 √dk
5. **忽视 KV Cache**：自回归推理不缓存 KV，每步重算历史，速度慢几十倍
6. **多头数设置不当**：头数太多（如 d_model=128 配 32 头，每头才 4 维）信息不足；太少表达力差

## 下一步

- [参考](./reference.md)：架构参数表 + 三大变体对比 + 经典论文
