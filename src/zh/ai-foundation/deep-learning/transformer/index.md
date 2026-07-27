---
layout: doc
---

# Transformer

Transformer 是 2017 年 Google 论文《Attention Is All You Need》提出的**完全基于注意力机制**的序列建模架构，摒弃了 RNN 的循环结构和 CNN 的局部感受野，用 Self-Attention 让序列中任意两个位置直接交互，路径长度为常数级 O(1)。其核心公式 `Attention(Q,K,V) = softmax(QK^T/√dk)·V` 通过 Query-Key 点积算相关性、softmax 归一化得权重、再加权 Value，配合 Multi-Head（多头并行捕捉不同子空间）、Positional Encoding（注入位置信息）、Feed-Forward + 残差连接 + LayerNorm 构成完整的 Encoder-Decoder 块。原始论文用 6 层编码器 + 6 层解码器，d_model=512，8 头注意力。Transformer 的两大革命性优势：**全并行**（无需像 RNN 逐步计算，训练效率数量级提升）与**长程依赖**（任意距离 token 直接交互，克服 RNN 梯度消失）。它成为现代 NLP 的统一底座——BERT（仅 Encoder）、GPT（仅 Decoder）、T5（Encoder-Decoder）三大范式都建立在 Transformer 之上，并外溢到视觉（ViT）、语音、多模态等领域。位置编码经历四代演进：原始 sinusoidal（正弦余弦）→ 学习式绝对编码（BERT/GPT-2）→ 相对编码（T5）→ **RoPE 旋转编码**（LLaMA/Qwen 主流，外推性强）/ **ALiBi 线性偏置**（BLOOM/MPT，免位置嵌入直接外推）。Transformer 是理解一切现代大语言模型的必要前置知识。

## 评价

**优点**

- **全并行计算**：序列所有位置同时计算注意力，训练效率远超 RNN 的逐步计算，GPU 友好，是 LLM 能训到千亿参数的基础
- **长程依赖建模强**：任意两个 token 距离为 O(1)，无论多远都能直接交互，彻底解决 RNN 的梯度消失/长距离遗忘
- **统一架构**：Encoder-only（BERT）/ Decoder-only（GPT）/ Encoder-Decoder（T5）三大变体覆盖几乎所有 NLP 任务，跨任务迁移成本低
- **可解释性相对好**：注意力权重可视化能看出「模型在看哪里」，比 CNN/RNN 的黑盒程度低
- **跨模态通用**：文本（GPT/BERT）、图像（ViT）、语音（Whisper）、蛋白质（AlphaFold）、代码（Copilot）都能用 Transformer 建模
- **Scaling Law 友好**：参数/数据/算力增加时性能可预测地提升，这是 LLM 时代「大力出奇迹」的理论基础

**缺点**

- **注意力复杂度 O(n²)**：序列长度 n 的自注意力需 n×n 注意力矩阵，长上下文（百万 token）显存与计算爆炸，催生 Flash Attention / 稀疏注意力等优化
- **位置信息需外挂**：Self-Attention 本身是排列不变的（permutation-invariant），必须额外加位置编码才能感知顺序，位置编码方案直接影响外推能力
- **数据饥渴**：相比 CNN 的归纳偏置（局部性+平移不变性），Transformer 几乎无归纳偏置，需要海量数据才能学好，小数据集易过拟合
- **推理时 KV Cache 吃显存**：自回归解码需缓存所有历史 Key/Value，长上下文推理显存占用线性增长
- **二次复杂度的内存墙**：即使算力够，注意力矩阵的 O(n²) 内存也成了百万级上下文的主要瓶颈

## 文档地址

- [The Annotated Transformer（哈佛 NLP 带注释实现）](https://nlp.seas.harvard.edu/annotated-transformer/)
- [Attention Is All You Need（原始论文 arXiv）](https://arxiv.org/abs/1706.03762)
- [PyTorch Transformer 文档](https://pytorch.org/docs/stable/nn.html#transformer-layers)
- [Jay Alammar — The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)
- [EleutherAI — Rotary Embeddings 详解](https://blog.eleuther.ai/rotary-embeddings/)

## GitHub地址

[harvardnlp/annotated-transformer](https://github.com/harvardnlp/annotated-transformer) · [meta-llama/llama3](https://github.com/meta-llama/llama3)（RoPE 工业实现参考）

## 幻灯片地址

<a href="/SlideStack/transformer-slide/" target="_blank">Transformer</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Transformer 测试题</a>
