---
layout: doc
outline: [2, 3]
---

# 参考

> 基于原始论文《Attention Is All You Need》(2017) + Annotated Transformer + 现代位置编码文献整理

## 速查

- **核心公式**：`Attention(Q,K,V) = softmax(QK^T/√dk) · V`
- **原论文参数**：d_model=512, h=8 头, dk=dv=64, d_ff=2048, N=6 层 Encoder + 6 层 Decoder
- **三大变体**：BERT（Enc-only）/ GPT（Dec-only）/ T5（Enc-Dec）
- **位置编码选型**：现代 LLM 首选 **RoPE**（LLaMA/Qwen）；超长上下文外推可选 **ALiBi**（BLOOM/MPT）
- **复杂度**：注意力 O(n²) 时间+空间；FFN O(n·d²)；KV Cache 让推理 O(n) 每步
- **优化标配**：Flash Attention（IO 优化）+ KV Cache（推理加速）+ Pre-Norm（训练稳定）
- **PyTorch API**：`nn.MultiheadAttention` / `nn.TransformerEncoderLayer` / `nn.TransformerDecoderLayer`

## 原始 Transformer 参数表

| 组件 | 参数 | 值（base 模型） | 说明 |
| --- | --- | --- | --- |
| 模型维度 | d_model | 512 | 所有子层输出的统一维度 |
| 注意力头数 | h | 8 | Multi-Head 并行头数 |
| 每头维度 | dk = dv | 64 | d_model / h |
| FFN 内层维度 | d_ff | 2048 | 4 × d_model |
| Encoder 层数 | N_enc | 6 | 编码器堆叠层数 |
| Decoder 层数 | N_dec | 6 | 解码器堆叠层数 |
| Dropout | — | 0.1 | 残差+注意力+Embedding 都加 |
| Label Smoothing | — | 0.1 | 训练时标签平滑 |

> Big 模型：d_model=1024, h=16, d_ff=4096, N=6，参数量约 213M。

## 三大变体对比

| 维度 | Encoder-only | Decoder-only | Encoder-Decoder |
| --- | --- | --- | --- |
| **代表** | BERT、RoBERTa、DeBERTa | GPT、LLaMA、Qwen、Claude | T5、BART、Whisper |
| **结构** | 仅编码器 | 仅解码器 | 完整 Enc-Dec |
| **注意力方向** | 双向（看全序列） | 单向（只看前面，自回归） | Enc 双向 + Dec 单向 |
| **训练目标** | Masked LM（完形填空） | Next Token Prediction | Seq2Seq（翻译/摘要） |
| **擅长任务** | 理解：分类、NER、抽取 | 生成：对话、代码、创作 | 翻译、摘要、语音识别 |
| **LLM 主流** | （理解类已多被 Decoder-only 覆盖） | ✅ **当前绝对主流** | 特定场景（翻译/语音） |

## 位置编码选型决策表

| 方案 | 类型 | 外推性 | 代表模型 | 适用场景 |
| --- | --- | --- | --- | --- |
| **Sinusoidal** | 固定绝对 | 一般 | 原始 Transformer | 入门理解，新项目少用 |
| **学习式绝对** | 可学习绝对 | ❌ 无 | BERT、GPT-2 | 固定长度任务（如 BERT 的 512） |
| **相对（T5）** | 相对偏置 | 中 | T5、Transformer-XL | 兼容性差（不友好的高效注意力） |
| **RoPE** | 旋转（绝对形式相对效果） | ✅ 强 | LLaMA、Qwen、Mistral | **现代 LLM 首选** |
| **ALiBi** | 线性偏置（无嵌入） | ✅ 极强 | BLOOM、MPT | 超长上下文外推 |

## PyTorch Transformer API 速查

```python
import torch.nn as nn

# 1. 单层多头注意力（手控灵活）
mha = nn.MultiheadAttention(
    embed_dim=512,        # d_model
    num_heads=8,          # 头数
    dropout=0.1,
    batch_first=True,     # 输入 shape [batch, seq, dim]
)
attn_out, attn_weights = mha(query, key, value, attn_mask=mask)

# 2. Encoder 层（封装自注意力+FFN+残差+LayerNorm）
enc_layer = nn.TransformerEncoderLayer(
    d_model=512, nhead=8, dim_feedforward=2048,
    dropout=0.1, batch_first=True, norm_first=True,  # Pre-Norm
)
encoder = nn.TransformerEncoder(enc_layer, num_layers=6)
enc_out = encoder(src)  # src: [batch, seq, d_model]

# 3. Decoder 层（含交叉注意力）
dec_layer = nn.TransformerDecoderLayer(
    d_model=512, nhead=8, dim_feedforward=2048,
    dropout=0.1, batch_first=True, norm_first=True,
)
decoder = nn.TransformerDecoder(dec_layer, num_layers=6)
dec_out = decoder(tgt, memory=enc_out)  # tgt: 目标序列

# 4. 完整 Transformer（封装好）
transformer = nn.Transformer(
    d_model=512, nhead=8, num_encoder_layers=6, num_decoder_layers=6,
    dim_feedforward=2048, dropout=0.1, batch_first=True,
)
out = transformer(src, tgt)
```

> 生产 LLM 不直接用 `nn.Transformer`（灵活性差），而是基于 `nn.Linear`+`F.scaled_dot_product_attention`（内置 Flash Attention）手写，方便加 RoPE/KV Cache/GQA 等定制。

## 经典论文与资源

- [Attention Is All You Need（Vaswani et al. 2017）](https://arxiv.org/abs/1706.03762) —— 开山之作
- [The Annotated Transformer（哈佛 NLP）](https://nlp.seas.harvard.edu/annotated-transformer/) —— 逐行注释实现
- [The Illustrated Transformer（Jay Alammar）](https://jalammar.github.io/illustrated-transformer/) —— 可视化讲解
- [RoFormer: Enhanced Transformer with Rotary Position Embedding（苏剑林 2021）](https://arxiv.org/abs/2104.09864) —— RoPE 原始论文
- [Train Short, Test Long: Attention with Linear Biases（ALiBi, Press et al. 2021）](https://arxiv.org/abs/2108.12409) —— ALiBi 原始论文
- [FlashAttention: Fast and Memory-Efficient Exact Attention（Tri Dao 2022）](https://arxiv.org/abs/2205.14135) —— IO 优化
- [BERT（Devlin et al. 2018）](https://arxiv.org/abs/1810.04805) —— Encoder-only 范式
- [GPT-3（Brown et al. 2020）](https://arxiv.org/abs/2005.14165) —— Decoder-only + Scaling Law
- [T5（Raffel et al. 2019）](https://arxiv.org/abs/1910.10683) —— Encoder-Decoder 统一框架
- [EleutherAI — Rotary Embeddings 博客](https://blog.eleuther.ai/rotary-embeddings/) —— RoPE 直观讲解
