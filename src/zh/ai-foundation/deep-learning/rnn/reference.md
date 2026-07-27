---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PyTorch 2.x `torch.nn` RNN/LSTM/GRU 官方 API + cs224n 课程整理

## 速查

- **PyTorch 版本**：2.x；RNN 系列在 `torch.nn` 内置
- **核心类**：`nn.RNN` / `nn.LSTM` / `nn.GRU`
- **默认输入维度**：`[seq_len, batch, input_size]`；设 `batch_first=True` 改成 `[batch, seq_len, input_size]`
- **返回值**：RNN/GRU 返回 `(output, h_n)`；LSTM 返回 `(output, (h_n, c_n))`
- **梯度裁剪**：`torch.nn.utils.clip_grad_norm_(params, max_norm)` 防爆炸，RNN 训练必备
- **打包变长序列**：`nn.utils.rnn.pack_padded_sequence` / `pad_packed_sequence` 处理不等长 batch

## RNN 系列构造函数

```python
nn.RNN(input_size, hidden_size, num_layers=1,
       nonlinearity='tanh', bias=True, batch_first=False,
       dropout=0.0, bidirectional=False)

nn.LSTM(input_size, hidden_size, num_layers=1,
        bias=True, batch_first=False, dropout=0.0,
        bidirectional=False, proj_size=0)

nn.GRU(input_size, hidden_size, num_layers=1,
       bias=True, batch_first=False, dropout=0.0, bidirectional=False)
```

**关键参数**：

| 参数 | 含义 | 常用值 |
| --- | --- | --- |
| `input_size` | 输入特征维（如词向量维度） | 64-768 |
| `hidden_size` | 隐藏状态维 | 128-1024 |
| `num_layers` | 堆叠层数 | 1-4（多了易过拟合） |
| `batch_first` | 输入 batch 是否在第一维 | True（推荐） |
| `dropout` | 层间 dropout（仅 num_layers>1 生效） | 0.3-0.5 |
| `bidirectional` | 是否双向 | 理解任务 True，生成任务 False |

## 输入输出维度速查

假设 `input_size=I, hidden_size=H, num_layers=L, batch=B, seq_len=T`：

| 项 | shape（batch_first=True） |
| --- | --- |
| **输入 x** | `[B, T, I]` |
| **初始 h_0** | `[L*num_directions, B, H]` |
| **初始 c_0**（LSTM） | `[L*num_directions, B, H]` |
| **输出 output** | `[B, T, H*num_directions]`（每个时间步） |
| **h_n**（最终隐藏态） | `[L*num_directions, B, H]` |
| **c_n**（LSTM 最终细胞态） | `[L*num_directions, B, H]` |

```python
lstm = nn.LSTM(64, 128, num_layers=2, batch_first=True, bidirectional=True, dropout=0.5)
x = torch.randn(32, 10, 64)          # [B, T, I]
output, (h_n, c_n) = lstm(x)
output.shape   # [32, 10, 256]   ← 128 * 2（双向）
h_n.shape      # [4, 32, 128]    ← 2 层 * 2 方向
c_n.shape      # [4, 32, 128]
```

## 处理变长序列

实际 NLP batch 里句子长短不一，直接补零会让 RNN 处理 padding 词浪费计算且污染状态。用 `pack_padded_sequence` 让 RNN 跳过 padding。

```python
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence

# sentences 已按长度降序排列，lengths 是每句实际长度
packed = pack_padded_sequence(embedded, lengths, batch_first=True, enforce_sorted=True)
packed_out, (h_n, c_n) = lstm(packed)
output, _ = pad_packed_sequence(packed_out, batch_first=True)  # 还原成 padded 张量
```

## 梯度裁剪

RNN/LSTM/GRU 训练必备，防梯度爆炸：

```python
# 在 backward 后、step 前
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
optimizer.step()
```

- `max_norm`：梯度 L2 范数上限，常用 1.0-5.0
- 原理：若总范数超过 max_norm，按比例缩放整个梯度向量

## 超参默认值表

| 超参 | 文本分类 | 机器翻译（历史） | 时间序列预测 |
| --- | --- | --- | --- |
| **架构** | BiLSTM | LSTM Seq2Seq | GRU |
| **hidden_size** | 128-256 | 512-1024 | 64-128 |
| **num_layers** | 1-2 | 2-4 | 1-2 |
| **dropout** | 0.5 | 0.3 | 0.2 |
| **optimizer** | Adam | Adam | Adam |
| **lr** | 1e-3 | 1e-3~5e-4 | 1e-3 |
| **clip_grad_norm** | 5.0 | 5.0 | 5.0 |
| **batch_size** | 32-64 | 64-128 | 32-128 |

## Seq2Seq 模板

```python
class Encoder(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden, batch_first=True)
    def forward(self, x):
        emb = self.embed(x)
        _, (h_n, c_n) = self.lstm(emb)
        return h_n, c_n            # 上下文向量

class Decoder(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden, batch_first=True)
        self.fc = nn.Linear(hidden, vocab_size)
    def forward(self, x, h, c):    # x: 上一步生成的词
        emb = self.embed(x)
        out, (h, c) = self.lstm(emb, (h, c))
        return self.fc(out), h, c   # 下一步词分布 + 新状态
```

> 注意：基础 Seq2Seq 的上下文向量是固定长度瓶颈。现代实践已转向 Transformer + Attention，此模板仅作历史参考与教学。

## 官方资源

- [PyTorch LSTM 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.LSTM.html)
- [PyTorch GRU 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.GRU.html)
- [PyTorch RNN 教程（语言模型）](https://docs.pytorch.org/tutorials/intermediate/char_rnn_classification_tutorial.html)
- [cs224n 课程主页](https://web.stanford.edu/class/cs224n/)
- [Understanding LSTM Networks（Chris Olah）](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [Jurafsky & Martin SLP3（RNN 与 MT 章节）](https://web.stanford.edu/~jurafsky/slp3/)
- [Attention Is All You Need（Transformer，对照理解 RNN 局限）](https://arxiv.org/abs/1706.03762)
