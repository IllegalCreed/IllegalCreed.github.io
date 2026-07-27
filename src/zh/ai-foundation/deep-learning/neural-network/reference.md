---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PyTorch 2.x `torch.nn` / `torch.optim` 官方 API 整理

## 速查

- **PyTorch 版本**：2.x（2026 当前稳定线），Python ≥ 3.9
- **安装**：`pip install torch torchvision`（CPU 版）；CUDA 版按官网命令选
- **核心模块**：`torch`（张量/autograd）/ `torch.nn`（层与损失）/ `torch.optim`（优化器）/ `torch.utils.data`（数据加载）
- **训练四步**：`forward` → `loss` → `zero_grad` → `backward` → `step`
- **超参默认**：Adam `lr=1e-3 betas=(0.9,0.999) eps=1e-8`；SGD `lr=1e-2 momentum=0.9`；Dropout `p=0.5`；weight_decay `1e-4`
- **激活默认**：隐藏层 ReLU；Transformer GELU/SiLU；输出层二分类 Sigmoid
- **初始化默认**：PyTorch `nn.Linear` 默认 Kaiming uniform（He 初始化一族）

## nn 模块速查

### 线性与卷积层

```python
nn.Linear(in_features, out_features, bias=True)       # 全连接 W·x+b
nn.Conv2d(in_ch, out_ch, kernel_size, stride=1, padding=0, dilation=1, bias=True)
nn.Flatten(start_dim=1)                               # 多维→一维，接全连接前用
nn.Embedding(num_embeddings, embedding_dim)           # 离散ID→稠密向量（NLP必备）
```

### 激活函数

```python
nn.ReLU()              # max(0,x)，隐藏层默认
nn.LeakyReLU(0.01)     # 解决死亡 ReLU
nn.PReLU()             # 可学习负斜率
nn.GELU()              # BERT/GPT 默认
nn.SiLU()              # Swish，现代大模型
nn.Sigmoid()           # 输出层二分类
nn.Tanh()              # 早期隐藏层（现少用）
nn.Softmax(dim=-1)     # 一般不直接用（CE 内含）
```

### 正则化与归一化

```python
nn.Dropout(p=0.5)              # 训练随机置零
nn.BatchNorm1d(num_features)   # 全连接层后，按 batch 归一
nn.BatchNorm2d(num_features)   # 卷积层后
nn.LayerNorm(normalized_shape) # 按特征归一，Transformer/RNN 默认
nn.GroupNorm(num_groups, num_channels)  # batch 小时 BN 替代
nn.Identity()                  # 占位，调试删层用
```

### 循环层

```python
nn.RNN(input_size, hidden_size, num_layers=1, batch_first=False)
nn.LSTM(input_size, hidden_size, num_layers=1, batch_first=False)
nn.GRU(input_size, hidden_size, num_layers=1, batch_first=False)
# 返回 (output, (h_n, c_n))；LSTM 多返回 cell state
```

### 损失函数

```python
nn.MSELoss()                  # 回归，mean((y-ŷ)²)
nn.L1Loss()                   # 回归，mean(|y-ŷ|)，对异常值鲁棒
nn.CrossEntropyLoss()         # 多分类，内含 Softmax，输入 logits
nn.BCEWithLogitsLoss()        # 二分类，内含 Sigmoid，输入 logits
nn.NLLLoss()                  # 负对数似然，需先 log_softmax
nn.SmoothL1Loss()             # Huber，回归对异常值鲁棒
nn.TripletMarginLoss()        # 度量学习
```

### 容器与组装

```python
nn.Sequential(layer1, layer2, ...)   # 顺序堆叠
nn.ModuleList([layer1, layer2])      # 列表（可迭代，可索引）
nn.ModuleDict({"a": layer1})         # 字典
nn.ParameterList / nn.ParameterDict # 参数容器
```

## optim 模块速查

```python
torch.optim.SGD(params, lr, momentum=0, weight_decay=0)
torch.optim.Adam(params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0)
torch.optim.AdamW(params, lr=1e-3, weight_decay=0.01)   # 解耦权重衰减，Transformer 首选
torch.optim.RMSprop(params, lr=1e-2, alpha=0.99)
torch.optim.Adagrad(params, lr=1e-2)                    # 学习率单调衰减，稀疏特征

# 学习率调度
torch.optim.lr_scheduler.StepLR(opt, step_size, gamma=0.1)
torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max)
torch.optim.lr_scheduler.ReduceLROnPlateau(opt, mode="min", patience=5)  # 按验证指标
torch.optim.lr_scheduler.OneCycleLR(opt, max_lr, total_steps)           # 超收敛
```

## 超参默认值表

| 超参 | MLP 小任务 | CV 大模型 | Transformer |
| --- | --- | --- | --- |
| **优化器** | Adam | SGD+Momentum | AdamW |
| **学习率** | 1e-3 | 0.1 | 1e-4 ~ 5e-5 |
| **batch size** | 32-128 | 256 | 32-2048（梯度累积） |
| **weight_decay** | 0 | 1e-4 | 0.01 |
| **Dropout** | 0.5 | 0.5（FC） | 0.1 |
| **激活** | ReLU | ReLU | GELU |
| **归一化** | BatchNorm | BatchNorm | LayerNorm |
| **学习率调度** | Step | Step/Cosine | Warmup+Cosine |

## 训练循环模板

```python
import torch

def train_one_epoch(model, loader, loss_fn, optimizer, device):
    model.train()                              # 训练模式（启用 Dropout/BN 训练统计）
    for X, y in loader:
        X, y = X.to(device), y.to(device)
        pred = model(X)                        # 前向
        loss = loss_fn(pred, y)                # 算损失
        optimizer.zero_grad()                  # 清旧梯度
        loss.backward()                        # 反向求梯度
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # 防梯度爆炸（可选）
        optimizer.step()                       # 更新参数

@torch.no_grad()
def evaluate(model, loader, device):
    model.eval()                               # 推理模式（关闭 Dropout，BN 用滑动统计）
    correct = total = 0
    for X, y in loader:
        X, y = X.to(device), y.to(device)
        pred = model(X).argmax(dim=1)
        correct += (pred == y).sum().item()
        total += y.size(0)
    return correct / total
```

> `model.train()` 与 `model.eval()` 必须成对使用：前者启用 Dropout 与 BN 训练统计；后者关闭 Dropout、BN 切换到推理用的滑动均值方差。漏掉 eval 会让验证集指标不稳。

## 官方资源

- [PyTorch torch.nn 文档](https://docs.pytorch.org/docs/stable/nn.html)
- [PyTorch torch.optim 文档](https://docs.pytorch.org/docs/stable/optim.html)
- [PyTorch autograd 教程](https://docs.pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html)
- [PyTorch 60 分钟入门](https://docs.pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html)
- [cs231n 神经网络笔记](https://cs231n.github.io/neural-networks-1/)
- [PyTorch GitHub](https://github.com/pytorch/pytorch)
