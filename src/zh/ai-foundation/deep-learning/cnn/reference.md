---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PyTorch 2.x torchvision 模型文档 + cs231n 卷积网络章节整理

## 速查

- **PyTorch 版本**：2.x；`torchvision` ≥ 0.15 提供 weights API
- **安装**：`pip install torch torchvision`
- **预训练模型入口**：`torchvision.models`（含 resnet/vgg/efficientnet/mobilenet 等 40+ 架构）
- **维度约定**：图像张量 `[B, C, H, W]`（NCHW）
- **预处理标准**：ImageNet 归一化 `mean=[0.485,0.456,0.406] std=[0.229,0.224,0.225]`
- **输出尺寸公式**：`(W - F + 2P) / S + 1`

## 卷积层 API 速查

```python
nn.Conv2d(in_channels, out_channels, kernel_size,
          stride=1, padding=0, dilation=1, groups=1, bias=True)
nn.Conv1d(in_channels, out_channels, kernel_size, ...)   # 序列/音频
nn.Conv3d(in_channels, out_channels, kernel_size, ...)   # 视频/体素
nn.ConvTranspose2d(in_channels, out_channels, kernel_size, ...)  # 上采样（分割用）

# 池化
nn.MaxPool2d(kernel_size, stride=None, padding=0)
nn.AvgPool2d(kernel_size, stride=None, padding=0)
nn.AdaptiveAvgPool2d(output_size)   # 自适应到指定尺寸（GAP 用 (1,1)）
nn.AdaptiveMaxPool2d(output_size)

# 归一化（CNN 主力）
nn.BatchNorm2d(num_features)
nn.GroupNorm(num_groups, num_channels)
```

## 经典架构参数表

| 架构 | 层数 | 参数量 | 主干特点 | torchvision 名 |
| --- | --- | --- | --- | --- |
| LeNet | 5 | 60K | 2 卷积 + 3 全连接 | （需自定义） |
| AlexNet | 8 | 60M | 5 卷积 + 3 全连接，ReLU+Dropout | `alexnet` |
| VGG11/13/16/19 | 11-19 | 133M-144M | 全 3×3 堆叠 | `vgg11`~`vgg19` |
| ResNet18/34/50/101 | 18-101 | 11M-45M | 残差块，工业默认 | `resnet18`~`resnet101` |
| ResNeXt | 50-101 | 25M-90M | 分组卷积残差 | `resnext50_32x4d` |
| GoogLeNet/Inception v3 | 22 | 6-24M | Inception 多尺度 | `googlenet`、`inception_v3` |
| DenseNet121 | 121 | 8M | 密集连接 | `densenet121` |
| MobileNetV2/V3 | - | 3-5M | 深度可分离卷积，移动端 | `mobilenet_v2`、`mobilenet_v3` |
| EfficientNet B0-B7 | - | 5M-66M | 复合缩放 + NAS | `efficientnet_b0`~`efficientnet_b7` |
| ConvNeXt | - | 28M-650M | 现代化 CNN，对标 ViT | `convnext_tiny`~`convnext_large` |

## 加载预训练模型

```python
import torchvision
import torch.nn as nn

# 新 API（推荐）：weights 参数指定预训练权重
model = torchvision.models.resnet50(weights="IMAGENET1K_V2")  # V2 是改进版权重
model = torchvision.models.efficientnet_b0(weights="DEFAULT")  # 用默认最新权重

# 替换分类头做迁移学习
model.fc = nn.Linear(model.fc.in_features, num_my_classes)

# 冻结主干
for p in model.parameters():
    p.requires_grad = False
model.fc.requires_grad_(True)  # 只训新头
```

## ImageNet 预处理标准

```python
from torchvision import transforms

# ImageNet 训练常用预处理
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),                  # 或 RandomResizedCrop 训练时
    transforms.ToTensor(),                       # [0,1]
    transforms.Normalize(                        # ImageNet 统计
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])
```

> `mean/std` 是 ImageNet 120 万张图的统计值，几乎所有预训练模型都基于它。用自己的数据时仍建议沿用这套归一化（与预训练分布对齐），不要重算。

## 感受野计算

```text
单层感受野 = F（核大小）
第 i 层累积感受野 RF_i = RF_{i-1} + (F_i - 1) · Π stride_j   (j < i)
```

经验：

- 3×3 stride=1 堆叠：每加一层感受野 +2
- stride=2 下采样后，后续每层感受野翻倍增长
- ResNet50 最后一层感受野约 485×485，足够覆盖 224×224 输入

## 输出尺寸速算

| 操作 | 输入 | 输出 |
| --- | --- | --- |
| Conv3×3, S1, P1（同型） | [B,C,224,224] | [B,C',224,224] |
| Conv3×3, S2, P1（下采样） | [B,C,224,224] | [B,C',112,112] |
| Conv1×1, S1（通道变换） | [B,C,224,224] | [B,C',224,224] |
| MaxPool2×2, S2 | [B,C,224,224] | [B,C,112,112] |
| AdaptiveAvgPool2d((1,1)) | [B,C,H,W] | [B,C,1,1] |
| ConvTranspose2d k2 s2 | [B,C,H,W] | [B,C',2H,2W] |

## 官方资源

- [PyTorch torchvision.models 文档](https://docs.pytorch.org/vision/stable/models.html)
- [PyTorch Conv2d 文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html)
- [cs231n 卷积网络章节](https://cs231n.github.io/convolutional-networks/)
- [cs231n 案例研究（架构）](https://cs231n.github.io/neural-networks-case-study/)
- [Papers with Code 图像分类](https://paperswithcode.com/task/image-classification)
- [Papers with Code 目标检测](https://paperswithcode.com/task/object-detection)
- [PyTorch vision GitHub](https://github.com/pytorch/vision)
