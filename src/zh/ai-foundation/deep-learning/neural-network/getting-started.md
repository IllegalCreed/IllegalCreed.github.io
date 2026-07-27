---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 PyTorch 2.x 官方 `torch.nn` / `torch.optim` 文档 + cs231n 神经网络章节（neural-networks-1/2/3）编写，对照当前版本行为

## 速查

- **核心定义**：感知机=单层线性神经元；MLP=至少一个隐藏层的全连接网络，靠通用近似定理拟合任意连续函数
- **前向传播**：`a = activation(W·x + b)`，逐层矩阵乘 + 激活，输出层一般不加激活（得原始分数 logits）
- **反向传播**：链式法则把 ∂L/∂y 逐层回传成 ∂L/∂W，PyTorch 用 `loss.backward()` 自动求
- **激活函数**：ReLU `max(0,x)` 默认首选 / Sigmoid `[0,1]` 易饱和 / Tanh `[-1,1]` 零均值 / GELU·SiLU 现代 Transformer 默认
- **损失函数**：MSE 回归 / CrossEntropy 分类（内含 Softmax）/ Focal Loss 类别极不平衡
- **优化器**：Adam 默认首选（`lr=1e-3, beta1=0.9, beta2=0.999`）/ SGD+Momentum 大模型精调 / RMSProp 自适应学习率
- **初始化**：ReLU 系用 He（`std=sqrt(2/fan_in)`）/ Tanh·Sigmoid 用 Xavier（`std=sqrt(2/(fan_in+fan_out))`）
- **正则化**：Dropout 训练随机置零概率 p（默认 0.5）/ L2 weight_decay / 早停
- **归一化**：BatchNorm 按 batch 维度归一（CNN 友好）/ LayerNorm 按特征维度归一（RNN/Transformer 友好）
- **训练三件套**：`model.zero_grad()` 清旧梯度 → `loss.backward()` 算新梯度 → `optimizer.step()` 更新参数
- **学习率是第一超参**：太大发散震荡，太小收敛慢，常用 `1e-3`（Adam）或 `1e-2`（SGD）起步

## 神经网络是什么

神经网络（Neural Network）由若干「神经元」层叠而成，每个神经元本质是一个可微的算子：把输入加权求和再过一次非线性激活函数。把单层神经元（无隐藏层）单独看，就是**感知机**，退化为线性分类器（逻辑回归是它的概率版）。当网络至少有一个隐藏层时，称为**多层感知机（MLP）**，由通用近似定理保证：只要隐藏单元够多，它能以任意精度逼近紧致集上的任何连续函数。

- **输入**：特征向量 `x`（shape `[batch, in_features]`）
- **隐藏层**：`h = activation(W·x + b)`，`W` shape `[in_features, out_features]`
- **输出**：回归直接出数值；分类先出 logits 再经 Softmax 得概率
- **学习信号**：损失函数 `L(ŷ, y)` 衡量预测错多少，反向传播把这个误差变成每个参数的修正方向

> 生物学类比只是启发，真正的工程价值在于「可微 + 链式法则 + 梯度下降」这套数学机制——它让上亿参数的联合优化变得可计算。

### 感知机 vs MLP

| 维度 | 感知机（单层） | MLP（多层） |
| --- | --- | --- |
| **结构** | 输入直连输出，无隐藏层 | 至少一个隐藏层 |
| **表达能力** | 仅线性可分（异或 XOR 都解不了） | 通用近似，可拟合任意连续函数 |
| **决策边界** | 超平面 | 任意非线性曲面 |
| **训练** | 感知机算法 / 等价逻辑回归 | 反向传播 + 梯度下降 |
| **典型用途** | 线性二分类基线 | 函数逼近、特征学习主干 |

> 经典例子：单层感知机解不了 XOR（`0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0`），但加一个 2 单元隐藏层 + ReLU 即可——这是「深度」必要性的最小演示。

## PyTorch 的 nn 模块积木

PyTorch 把神经网络的所有零件都做成 `nn.Module` 子类，可任意嵌套组合：

```python
import torch
import torch.nn as nn

# 1. 线性层：W·x + b，weight 默认 Kaiming uniform 初始化
fc = nn.Linear(in_features=784, out_features=128, bias=True)

# 2. 激活函数（无参数，可直接当函数用）
relu, gelu = nn.ReLU(), nn.GELU()

# 3. Dropout：训练时随机置零概率 p，推理时恒等
dropout = nn.Dropout(p=0.5)

# 4. 归一化
bn = nn.BatchNorm1d(128)   # 按 batch 归一，CNN/NLP 全连接常用
ln = nn.LayerNorm(128)     # 按特征归一，Transformer/RNN 默认

# 5. 损失函数
mse = nn.MSELoss()                              # 回归
ce = nn.CrossEntropyLoss()                      # 分类（内含 Softmax，输入原始 logits）

# 前向：积木像函数一样调用
x = torch.randn(32, 784)
h = relu(fc(x))        # shape [32, 128]
h = dropout(bn(h))
print(h.shape)
```

> 「Module 即可调用对象」的设计哲学：自定义网络只需继承 `nn.Module`、实现 `__init__`（声明子模块）和 `forward`（定义前向计算），PyTorch 自动追踪所有参数并支持 `.to(device)`、`.parameters()`、`state_dict` 序列化。

## 第一个神经网络（MNIST MLP 30 行）

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# 1. 数据：MNIST 手写数字，28x28=784 像素
transform = transforms.Compose([transforms.ToTensor()])
train_ds = datasets.MNIST("./data", train=True, download=True, transform=transform)
loader = DataLoader(train_ds, batch_size=64, shuffle=True)

# 2. 模型：784 → 128 → 64 → 10 的 MLP
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Flatten(),                 # [B,1,28,28] → [B,784]
            nn.Linear(784, 128), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(128, 64),  nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(64, 10),           # 输出 logits，不加激活（CrossEntropyLoss 内含 Softmax）
        )
    def forward(self, x):
        return self.net(x)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = MLP().to(device)

# 3. 损失 + 优化器（Adam 默认 lr=1e-3）
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# 4. 训练循环
for epoch in range(3):
    for X, y in loader:
        X, y = X.to(device), y.to(device)
        pred = model(X)                  # 前向
        loss = loss_fn(pred, y)          # 算损失
        optimizer.zero_grad()            # 清旧梯度
        loss.backward()                  # 反向求梯度
        optimizer.step()                 # 更新参数
    print(f"epoch {epoch} loss={loss.item():.4f}")
```

> MNIST 是神经网络的「Hello World」——一个 3 层 MLP 在 GPU 上 30 秒可训到 97% 准确率。换数据集只需改 `DataLoader`，模型结构、训练循环完全通用。

## 前向传播：从输入到预测

前向传播是「数据从输入层逐层流到输出层」的过程，每层做两件事：线性变换 `W·x + b`，再过非线性激活。

```text
输入 x  →  [Linear: W₁x+b₁]  →  ReLU  →  [Linear: W₂x+b₂]  →  ReLU  →  [Linear: W₃+b₃]  →  logits
                                          ↑隐藏层 1↑                       ↑隐藏层 2↑          ↑输出层（无激活）↑
```

**为什么输出层不加激活**：分类任务的 Softmax 放在损失函数 `CrossEntropyLoss` 内部，避免数值不稳定；回归任务的输出就是原始数值，也不该被压扁到 `[0,1]`。

**为什么隐藏层必须加激活**：如果所有隐藏层都是纯线性 `W·x + b`，多层堆叠等价于一个单层线性变换（`W₂(W₁x) = (W₂W₁)x`），完全失去拟合非线性的能力——网络退化成感知机。

## 反向传播：链式法则的工业化

反向传播用链式法则计算损失对每个参数的偏导数，是神经网络训练的核心引擎。

```text
前向：x  →  z=Wx+b  →  a=ReLU(z)  →  ...  →  L
反向：    ← ∂L/∂W = ∂L/∂a · ∂a/∂z · ∂z/∂W ←  ∂L/∂a  ←  ...  ←  ∂L/∂L = 1
```

PyTorch 的 `autograd` 在前向时自动构建计算图并缓存中间值，调用 `loss.backward()` 时沿图反向遍历，对每个 `requires_grad=True` 的张量算出梯度并存入 `.grad` 属性。

```python
# autograd 自动算梯度
x = torch.tensor([2.0], requires_grad=True)
y = (x ** 2).sum()       # y = x²
y.backward()             # 反向求导
print(x.grad)            # tensor([4.])  ← dy/dx = 2x = 4
```

> 「清梯度」是必做动作：PyTorch 默认梯度累加，不清零会把上一 batch 的梯度叠进来导致训练发散。每个 batch 开头务必 `optimizer.zero_grad()`。

## 下一步

- [指南](./guide-line.md)：激活函数深析 + 损失函数选型 + 优化器对比 + 正则化与归一化
- [参考](./reference.md)：nn 模块速查 + 超参默认值 + 反模式 + 官方资源
