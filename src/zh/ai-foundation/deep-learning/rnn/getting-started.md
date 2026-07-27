---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 PyTorch 2.x `torch.nn` RNN/LSTM/GRU 文档 + cs224n 课程讲义 + Understanding LSTM Networks（Chris Olah）编写，对照当前版本行为

## 速查

- **核心定义**：用隐藏状态 `h_t` 在时间步之间传递记忆，建模「当前输出依赖历史上下文」的序列依赖
- **朴素 RNN 公式**：`h_t = tanh(W_h·h_{t-1} + W_x·x_t + b)`，每个时间步共享同一组权重
- **两大致命问题**：**梯度消失**（连乘 <1，长距离梯度归零）/ **梯度爆炸**（连乘 >1，梯度发散为 NaN）
- **LSTM 三门一态**：遗忘门 / 输入门 / 输出门 + 细胞状态（cell state），让信息长距离无衰减流动
- **GRU 简化**：合并成更新门 + 重置门，合并细胞状态与隐藏状态，参数少速度快效果相当
- **BPTT**：Backpropagation Through Time，沿时间展开的反向传播，长序列需截断（truncated BPTT）
- **双向 RNN**：同时跑正向与逆向 RNN，每位置拼接左右上下文，提升表示质量
- **Seq2Seq**：编码器把变长输入压成向量，解码器再展开成变长输出，机器翻译开山范式
- **梯度裁剪**：`clip_grad_norm_(params, max_norm)` 防梯度爆炸，RNN 训练必备
- **PyTorch 入口**：`nn.RNN` / `nn.LSTM` / `nn.GRU`，输入 `[seq_len, batch, features]`（默认）
- **被取代的根本原因**：串行无法并行 + 长距离建模仍弱 → Transformer 用 Attention 直接「直连」任意两位置

## 循环神经网络是什么

循环神经网络（RNN）是一类处理**序列数据**的神经网络。与 CNN 处理空间网格、MLP 处理固定向量不同，RNN 的核心是引入**时间维度上的循环连接**：在每个时间步 `t`，网络接收当前输入 `x_t` 与上一时刻的隐藏状态 `h_{t-1}`，计算出新的隐藏状态 `h_t`，既作为该步的输出表示，也作为「记忆」传给下一步。

```text
时间步：    t=1      t=2      t=3      ...    t=T
            ↓        ↓        ↓                ↓
输入：      x_1      x_2      x_3              x_T
            ↓        ↓        ↓                ↓
         ┌─────┐ ┌─────┐ ┌─────┐           ┌─────┐
隐藏态：  │ RNN │→│ RNN │→│ RNN │→ ... →   │ RNN │
         └─────┘ └─────┘ └─────┘           └─────┘
            ↓        ↓        ↓                ↓
输出：      h_1      h_2      h_3              h_T

所有 RNN 单元共享同一组权重 W_h, W_x
```

- **输入**：序列 `x = [x_1, x_2, ..., x_T]`，每个 `x_t` 是一个向量（如词向量）
- **隐藏状态**：`h_t` 是截至第 t 步所有历史信息的压缩表示
- **权重共享**：每个时间步用完全相同的 `W_h, W_x, b`——这是「循环」的本质，也是参数高效的原因

> 生物学类比是「短期记忆」：`h_t` 就像人的工作记忆，边读句子边更新，理解「它」指代谁需要把前面几个词的信息保留在记忆里。RNN 让神经网络获得这种「边读边记」的能力。

### 为什么序列要用 RNN 而非 MLP

把整句话喂给 MLP 有三个问题：

1. **长度固定**：MLP 输入维度固定，但句子长短不一，截断或补零都会丢信息
2. **位置无关**：打乱词序 MLP 给出同样结果，但「狗咬人」和「人咬狗」语义完全不同
3. **参数不共享**：第 1 个词和第 100 个词用不同权重，无法学到「语法规则在每个位置都适用」

RNN 用权重共享 + 时序展开同时解决这三点。

## PyTorch RNN 入门

```python
import torch
import torch.nn as nn

# 1. 朴素 RNN
rnn = nn.RNN(input_size=64, hidden_size=128, num_layers=1, batch_first=False)
# 输入 shape: [seq_len, batch, input_size]
x = torch.randn(10, 32, 64)         # 序列长 10，batch 32，特征 64
output, h_n = rnn(x)                 # output: [10, 32, 128]，h_n: [1, 32, 128]

# 2. LSTM（推荐，解决梯度消失）
lstm = nn.LSTM(input_size=64, hidden_size=128, num_layers=2, batch_first=True, dropout=0.5)
x = torch.randn(32, 10, 64)          # batch_first=True 时 batch 在前
output, (h_n, c_n) = lstm(x)         # 多返回 cell state c_n

# 3. GRU（更轻量）
gru = nn.GRU(input_size=64, hidden_size=128, num_layers=1, batch_first=True)
output, h_n = gru(x)
```

> 维度坑：PyTorch RNN 默认输入是 `[seq_len, batch, input_size]`，与多数直觉相反。设 `batch_first=True` 可改成 `[batch, seq_len, input_size]`，后续处理更顺手。LSTM 与 RNN/GRU 的返回值不同：LSTM 额外返回细胞状态 `c_n`。

## 第一个 RNN（情感分类 30 行）

```python
import torch
import torch.nn as nn

# 假设已把每句话转成 [seq_len, embed_dim] 的张量
# vocab_size=10000, embed_dim=64, hidden=128, num_classes=2

class TextClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.embed = nn.Embedding(10000, 64)
        self.lstm = nn.LSTM(64, 128, batch_first=True, bidirectional=False)
        self.fc = nn.Linear(128, 2)

    def forward(self, x):                 # x: [B, seq_len] 词索引
        emb = self.embed(x)               # [B, seq_len, 64]
        out, (h_n, c_n) = self.lstm(emb)  # h_n: [1, B, 128]
        logits = self.fc(h_n[-1])         # 取最后层隐藏态做分类
        return logits

model = TextClassifier()
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# 训练循环（与 CNN/MLP 完全相同的四步）
for X, y in loader:
    loss = loss_fn(model(X), y)
    optimizer.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)  # 梯度裁剪防爆炸
    optimizer.step()
```

> 注意 `torch.nn.utils.clip_grad_norm_`——RNN/LSTM 训练几乎必备，防止梯度爆炸把权重打飞。`max_norm=5.0` 是常用经验值。

## 朴素 RNN 与梯度问题

朴素 RNN 的更新公式：

```text
h_t = tanh(W_h · h_{t-1} + W_x · x_t + b)
```

反向传播时，损失对 `h_1` 的梯度需要连乘 T 个雅可比矩阵：

```text
∂L/∂h_1 = ∂L/∂h_T · Π(t=2..T) ∂h_t/∂h_{t-1}
```

**两个极端**：

- **梯度消失**：当连乘的因子绝对值 <1，乘 T 次后梯度指数级衰减到 0，浅层（早期时间步）参数几乎不更新——网络「记不住」远距离信息。这是朴素 RNN 在长序列上失效的根本原因。
- **梯度爆炸**：当连乘因子 >1，梯度指数级增长到 NaN，训练直接崩溃。可用梯度裁剪缓解。

> cs224n 经验：朴素 RNN 实际只能学到约 20 步以内的依赖。要学长距离依赖，必须用 LSTM 或 GRU。

**梯度爆炸的对策**：梯度裁剪（gradient clipping）——反向后、更新前把梯度范数截断到上限。

```python
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
```

**梯度消失的对策**：换用门控架构（LSTM/GRU），它们的细胞状态梯度近似为 1，可长距离无衰减流动。

## 下一步

- [指南](./guide-line.md)：LSTM 门控机制深析 + GRU 简化 + 双向 RNN + Seq2Seq + 为何被 Transformer 取代
- [参考](./reference.md)：RNN API 速查 + 超参默认值 + 反模式 + 官方资源
