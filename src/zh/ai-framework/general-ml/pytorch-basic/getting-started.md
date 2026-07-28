---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 PyTorch 2.13.0 官方文档（Learn the Basics: Quickstart / Tensors / Datasets & DataLoaders / Build Model）+ pytorch.org 安装向导编写，对照当前稳定版行为

## 速查

- **安装**：`pip install torch torchvision`（PyPI 默认 CUDA 13.0 wheel；旧驱动用 `--index-url https://download.pytorch.org/whl/cu126`）
- **Python**：支持 **3.10–3.14**（Linux 另有 3.15 wheel；2.9 起最低 3.10）
- **验证 GPU**：`torch.cuda.is_available()`；Apple Silicon 用 `torch.backends.mps.is_available()`
- **建张量**：`torch.rand(5, 3)` / `torch.zeros(2, 3)` / `torch.tensor([1, 2, 3])`，指定 `dtype=`、`device=`
- **设备搬运**：`x.to("cuda")` 或 `x.cuda()` / `x.cpu()`；运算双方必须同设备
- **关键属性**：`x.shape` / `x.dtype` / `x.device`
- **数据管线**：`Dataset`（`__len__` + `__getitem__`）→ `DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4)`
- **模型骨架**：继承 `nn.Module`，`__init__` 里定义层、`forward(x)` 里写前向；`model(x)` 直接调用（别显式调 `.forward()`）
- **训练循环**：`optimizer.zero_grad()` → `loss = criterion(model(x), y)` → `loss.backward()` → `optimizer.step()`
- **eval 模式**：`model.eval()` + `with torch.no_grad():`（推理）或 `torch.inference_mode()`（更彻底）

## 安装与验证

PyPI 默认 wheel 自 2.11 起捆绑 **CUDA 13.0**（仅支持 Turing/SM 7.5 及以上 NVIDIA 显卡）；旧驱动（Maxwell/Pascal/Volta）需显式选 cu126：

```bash
# 默认（CUDA 13.0）
pip install torch torchvision

# 旧驱动回退（CUDA 12.6，含 Volta/Maxwell/Pascal）
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# 纯 CPU
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

安装后验证（官方样例）：

```python
import torch

x = torch.rand(5, 3)
print(x)                       # tensor([[...5×3 随机数...]])

torch.cuda.is_available()      # True = GPU(CUDA/ROCm) 可用
torch.backends.mps.is_available()  # Apple Silicon 专用
```

> **注意**：2.13 源码构建最低要求 CUDA 12.6 + C++20；从源码构建 NCCL ≥ 2.23。pip 用户不受影响。

## Tensor：一切皆张量

`torch.Tensor` 是统一的数据容器——标量是 0 维、向量是 1 维、矩阵是 2 维、图像是 3/4 维（`C×H×W` / `N×C×H×W`）。

```python
import torch

# 创建
a = torch.rand(2, 3)                      # 均匀分布 [0,1)
b = torch.zeros(2, 3, dtype=torch.long)   # 全 0，指定 dtype
c = torch.tensor([[1, 2], [3, 4]])        # 从 Python 数据
d = torch.empty_like(c)                   # 同形状未初始化

# 三个关键属性
print(a.shape, a.dtype, a.device)         # torch.Size([2, 3]) torch.float32 cpu

# 设备搬运：运算双方必须在同一设备
if torch.cuda.is_available():
    a = a.to("cuda")                      # 或 a.cuda()；回 CPU 用 a.cpu()
```

常用运算与 NumPy 高度同构：

```python
x = torch.ones(3, 4)
y = torch.rand(3, 4)

z = x + y            # 逐元素加（广播）
z = x @ y.T          # 矩阵乘（等价 x.matmul(y.T)）
z = x * y            # 逐元素乘（Hadamard，不是矩阵乘！）
x.add_(5)            # 原地操作：以下划线结尾，改自身
v = y.view(12)       # 形状变换（共享内存）
v = y.reshape(2, 6)  # 更宽容的重排（必要时拷贝）
s = y.sum(dim=0)     # 规约：按维求和
```

**与 NumPy 互转**（CPU 上共享内存，改一边影响另一边）：

```python
import numpy as np
arr = x.numpy()                 # Tensor → ndarray
t = torch.from_numpy(arr)       # ndarray → Tensor
```

## Dataset 与 DataLoader

数据侧两件套：**`Dataset` 定义「怎么取一条样本」，`DataLoader` 负责「批量、打乱、并行加载」**。

```python
from torch.utils.data import Dataset, DataLoader
from torchvision import datasets, transforms

# 内置数据集（FashionMNIST 为例）
train_data = datasets.FashionMNIST(
    root="data", train=True, download=True,
    transform=transforms.ToTensor(),   # PIL → [0,1] 的 C×H×W 张量
)

# 自定义 Dataset：必须实现 __len__ 与 __getitem__
class MyDataset(Dataset):
    def __init__(self, features, labels):
        self.features, self.labels = features, labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

# DataLoader：迭代产出 (batch_x, batch_y)
train_loader = DataLoader(train_data, batch_size=64, shuffle=True, num_workers=4)

for images, labels in train_loader:
    print(images.shape, labels.shape)   # torch.Size([64, 1, 28, 28]) torch.Size([64])
    break
```

要点：`shuffle=True` 只给训练集；`num_workers>0` 用多进程预取（Linux 上常用 4–8）；验证/测试集不打乱。

## 第一个模型：nn.Module

所有神经网络都继承 `torch.nn.Module`：**`__init__` 定义可学习层（注册参数），`forward` 定义数据流向**。

```python
from torch import nn

class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()                  # 28×28 → 784
        self.linear_relu_stack = nn.Sequential(
            nn.Linear(28 * 28, 512),                 # 全连接 + 自动注册权重
            nn.ReLU(),
            nn.Linear(512, 512),
            nn.ReLU(),
            nn.Linear(512, 10),                      # 10 类输出 logits
        )

    def forward(self, x):
        return self.linear_relu_stack(self.flatten(x))

device = "cuda" if torch.cuda.is_available() else "cpu"
model = NeuralNetwork().to(device)

logits = model(torch.rand(64, 1, 28, 28, device=device))  # 直接 model(x)，别写 model.forward(x)
pred = logits.argmax(dim=1)                                # 取最大 logit 的类别
```

- `model(x)` 会经过 `__call__` 钩子再进 `forward`，**永远用 `model(x)` 而不是 `model.forward(x)`**
- 输出是 **logits**（未归一化分数），概率化交给损失函数或 `softmax`
- `model.to(device)` 把全部参数搬到 GPU；输入数据也要在同一设备

## 训练循环：五行骨架

```python
loss_fn = nn.CrossEntropyLoss()                    # 分类标准损失（内含 LogSoftmax+NLLLoss）
optimizer = torch.optim.SGD(model.parameters(), lr=1e-3)

model.train()                                      # 训练模式（Dropout/BatchNorm 生效）
for batch, (X, y) in enumerate(train_loader):
    X, y = X.to(device), y.to(device)

    optimizer.zero_grad()                          # ① 清上轮梯度（默认累加！）
    loss = loss_fn(model(X), y)                    # ② 前向 + 算损失
    loss.backward()                                # ③ autograd 反向求全部梯度
    optimizer.step()                               # ④ 按梯度更新参数

model.eval()                                       # 评估模式（Dropout/BatchNorm 切换行为）
with torch.no_grad():                              # 推理不建图、省显存
    correct = sum((model(X).argmax(1) == y).sum() for X, y in test_loader)
```

最易踩的三个坑：**忘 `zero_grad()` 导致梯度累加**、**忘了 `.to(device)` 导致设备不匹配报错**、**eval 时忘 `model.eval()` 导致 Dropout 仍在随机丢弃**。

## 保存与加载

```python
# 推荐：只存参数（state_dict）
torch.save(model.state_dict(), "model.pth")

model2 = NeuralNetwork().to(device)
model2.load_state_dict(torch.load("model.pth", map_location=device, weights_only=True))
model2.eval()
```

- **只存 `state_dict`（参数字典）是官方推荐方式**——不绑定类定义路径，安全且可移植
- `torch.load` 加 `weights_only=True`：2.6 起默认值，反序列化更安全
- `map_location` 解决「GPU 存的档在 CPU 机器上加载」
- 大模型场景优先考虑 **safetensors** 格式（零拷贝、安全，HF 生态标准）
