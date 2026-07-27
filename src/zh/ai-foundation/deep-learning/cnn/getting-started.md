---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 PyTorch 2.x `torchvision` 文档 + cs231n 卷积网络章节（convolutional-networks）编写，对照当前版本行为

## 速查

- **CNN 三大特性**：**局部连接**（只看感受野内一块）/ **参数共享**（同一核全图复用）/ **平移等变性**（特征随物体位置移动）
- **卷积四超参**：kernel 核大小 F / stride 步长 S / padding 零填充 P / dilation 空洞率
- **输出尺寸公式**：`(W - F + 2P) / S + 1`，必须为整数，否则配置非法
- **同型卷积**：`F=1, S=1, P=(F-1)/2` 时输出尺寸=输入尺寸（常用 3×3 padding=1）
- **感受野**：堆叠小核等价扩大感受野——3 个 3×3 卷积感受野=1 个 7×7，但参数少得多
- **池化**：Max Pooling 最常用（2×2, stride=2 减半尺寸）；现役网络多用 stride 卷积替代池化做下采样
- **通道**：输入通道=in_ch（如 RGB=3）；输出通道=卷积核个数（学多少种特征）；每个核深度=in_ch
- **经典架构演化**：LeNet → AlexNet → VGG → GoogLeNet/Inception → ResNet → EfficientNet
- **ResNet 关键**：残差连接 `y = F(x) + x` 让梯度直通，突破上百层训练难题
- **PyTorch 入口**：`nn.Conv2d`、`nn.MaxPool2d`、`nn.AdaptiveAvgPool2d`、`torchvision.models`

## 卷积神经网络是什么

卷积神经网络（CNN）是一种用**卷积运算**替代全连接的神经网络，专为图像等空间网格数据设计。cs231n 用「输入体积（input volume）」「神经元只看局部区域」「参数共享」三个概念定义它。

```text
输入图像 [H, W, C_in]
   ↓ 卷积核 [F, F, C_in, C_out] 滑动
特征图 [H', W', C_out]      ← 学到边缘/纹理等局部特征
   ↓ 池化（2×2 stride 2）
特征图 [H'/2, W'/2, C_out]  ← 降分辨率，扩感受野
   ↓ ... 重复若干 Conv+Pool
   ↓ 全局平均池化 + 全连接
分类 logits
```

**为什么图像要用卷积而非 MLP**：一张 224×224 RGB 图有 `224×224×3=150528` 个输入。若第一层 MLP 有 1000 个神经元，仅这一层就要 1.5 亿参数——既过拟合又算不动。卷积用局部连接 + 参数共享，同样 1000 个 3×3 核只要 `3×3×3×1000=27000` 参数，少了 5000 倍。

### 三大设计支柱

| 设计 | 含义 | 作用 |
| --- | --- | --- |
| **局部连接** | 每个神经元只连接输入的一个小区域（感受野），而非全部像素 | 参数量随核大小而非输入大小增长 |
| **参数共享** | 同一卷积核在整张特征图上滑动复用同一组权重 | 假设「特征平移不变」，大幅减参 |
| **多通道堆叠** | 一层用多个核学不同特征，输出在深度方向堆叠 | 同时捕捉边缘、颜色、纹理等多种模式 |

> cs231n 实例：AlexNet 第一层若用全连接需 1.05 亿参数，用卷积（11×11×3×96 + 偏置）只有约 3.5 万参数——这就是 CNN 能在 ImageNet 上跑通的工程根基。

## PyTorch 卷积层入门

```python
import torch
import torch.nn as nn

# 1. 卷积层：四超参 + 通道数
conv = nn.Conv2d(
    in_channels=3,        # 输入通道（RGB=3）
    out_channels=64,      # 输出通道=卷积核个数
    kernel_size=3,        # 核大小 F（常用 3 或 1）
    stride=1,             # 步长 S
    padding=1,            # 零填充 P（3×3 核配 padding=1 保持尺寸）
    dilation=1,           # 空洞率（默认 1，>1 扩大感受野不减参）
    bias=True,            # 是否加偏置
)

# 2. 池化层
maxpool = nn.MaxPool2d(kernel_size=2, stride=2)  # 最常用：尺寸减半
avgpool = nn.AdaptiveAvgPool2d((1, 1))           # 全局平均池化，输出 1×1

# 前向：输入 [B, C, H, W]
x = torch.randn(1, 3, 224, 224)
y = conv(x)       # [1, 64, 224, 224]  ← padding=1 保持 224
y = maxpool(y)    # [1, 64, 112, 112]  ← 减半
print(y.shape)
```

> 维度约定：PyTorch 图像张量永远是 `[Batch, Channel, Height, Width]`（NCHW）。常见错误是漏掉 batch 维或把 H/W 放在 Channel 前。

## 第一个 CNN（CIFAR-10 分类 30 行）

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# 1. 数据：CIFAR-10，32x32 彩色图，10 类
transform = transforms.Compose([transforms.ToTensor()])
train_ds = datasets.CIFAR10("./data", train=True, download=True, transform=transform)
loader = DataLoader(train_ds, batch_size=64, shuffle=True)

# 2. 模型：经典 Conv-Pool-Conv-Pool-FC 结构
class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(),       # [B,32,32,32]
            nn.MaxPool2d(2),                                  # [B,32,16,16]
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),      # [B,64,16,16]
            nn.MaxPool2d(2),                                  # [B,64,8,8]
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 8 * 8, 128), nn.ReLU(), nn.Dropout(0.5),
            nn.Linear(128, 10),                               # logits
        )
    def forward(self, x):
        return self.classifier(self.features(x))

device = "cuda" if torch.cuda.is_available() else "cpu"
model = SimpleCNN().to(device)
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# 3. 训练循环
for epoch in range(5):
    for X, y in loader:
        X, y = X.to(device), y.to(device)
        loss = loss_fn(model(X), y)
        optimizer.zero_grad(); loss.backward(); optimizer.step()
    print(f"epoch {epoch} loss={loss.item():.4f}")
```

> 这是最小可用的 CNN 主干。换更大数据集（ImageNet）只需把 `SimpleCNN` 换成 `torchvision.models.resnet18(pretrained=True)`，训练循环完全不变。

## 卷积层四超参与输出尺寸

cs231n 给出卷积层输出空间尺寸的决定公式。

```text
输出尺寸 = (输入尺寸 W - 核大小 F + 2 * 填充 P) / 步长 S + 1
```

**四个超参的作用**：

- **kernel size F**：核的边长。小核（3×3、1×1）是现代主流，参数少、可堆叠扩感受野；大核（7×7、11×11）只在网络入口偶尔用
- **stride S**：滑动的步长。S=1 最常见；S=2 用于下采样（替代池化），输出尺寸减半
- **padding P**：边缘补零。配 `P=(F-1)/2` 可让输出尺寸=输入尺寸（同型卷积），保持特征图对齐
- **dilation**：核内元素间隔。>1 可在不增加参数的前提下扩大感受野，常用于语义分割

**三种典型配置**：

| 配置 | F, S, P | 效果 |
| --- | --- | --- |
| 同型卷积 | 3, 1, 1 | 输出尺寸=输入尺寸，最常用 |
| 步长下采样 | 3, 2, 1 | 输出尺寸减半，替代池化 |
| 1×1 卷积 | 1, 1, 0 | 不改变空间尺寸，只做通道变换/降维 |

> 公式结果必须是整数，否则配置非法。例如 `W=32, F=5, S=2, P=1` 得 `(32-5+2)/2+1=15.5`，PyTorch 会报错。

## 感受野与堆叠小核

**感受野（Receptive Field）**指一个神经元在原始输入上「看到」的区域大小。cs231n 强调：堆叠小卷积核比直接用大核更优。

```text
1 个 7×7 卷积：感受野 7×7，参数 49·C_in·C_out
3 个 3×3 卷积：感受野 7×7，参数 3·9·C_in·C_out = 27·C_in·C_out  ← 参数少近一半，且多了 3 次非线性
```

**堆叠小核的优势**：

1. **参数更少**：3 个 3×3（27 个参数）比 1 个 7×7（49 个）少
2. **非线性更多**：每层卷积后接 ReLU，3 个 3×3 有 3 次非线性，表达力更强
3. **可堆叠扩感受野**：每加一层 3×3 卷积，感受野扩大 2

> 这是 VGG 网络的核心洞察：全部用 3×3 卷积堆叠到 16-19 层，用更少参数获得更大感受野和更强表达力。

## 池化层

池化层下采样，减少参数与计算量，扩大感受野，并提供一定的平移不变性。

| 类型 | 操作 | 现状 |
| --- | --- | --- |
| **Max Pooling** | 取区域最大值 | **最常用**，保留最强响应 |
| **Average Pooling** | 取区域平均值 | 现代网络少用，多见于全局池化 |
| **Global Average Pooling** | 整张特征图取平均得 1 个值 | 替代末端全连接，大幅减参（GoogLeNet 起流行） |

```python
nn.MaxPool2d(2, 2)              # 2×2 步长 2，尺寸减半
nn.AdaptiveAvgPool2d((1, 1))    # 全局平均池化，输出 [B, C, 1, 1]
```

> cs231n 趋势：现代架构（ResNet 之后）倾向用 **stride=2 卷积**代替池化做下采样——卷积可学习如何降采样，比固定的 max 操作更灵活。池化层因无可学习参数，逐渐被替代，但全局平均池化仍是分类头标配。

## 下一步

- [指南](./guide-line.md)：经典架构演化 + 特征金字塔 + 语义分割 + 检测任务
- [参考](./reference.md)：架构参数表 + torchvision 速查 + 官方资源
