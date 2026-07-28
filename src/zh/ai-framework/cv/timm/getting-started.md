---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 timm 1.0.28 官方文档（huggingface.co/docs/timm Quickstart + Feature Extraction）编写，对照当前稳定版行为

## 速查

- **安装**：`pip install timm`（PyPI 包名即 timm）
- **核心入口**：`timm.create_model('模型名', pretrained=True)` 返回 PyTorch `nn.Module`
- **eval 必做**：`create_model` 默认返回 train 模式，推理前务必 `.eval()`
- **列模型**：`timm.list_models()` 全部；`timm.list_models(pretrained=True)` 仅含预训练权重；`timm.list_models('*resne*t*')` 通配符过滤
- **改分类头**：`create_model('xxx', pretrained=True, num_classes=10)` 自动替换最后一层做微调
- **特征提取**：`model.forward_features(x)` 取倒数第二层（未过分类头）；`features_only=True` 取多尺度特征金字塔
- **预处理**：`timm.data.resolve_data_config(model.pretrained_cfg)` + `timm.data.create_transform(**cfg)` 自动生成正确 transforms
- **pretrained_cfg**：每个模型的元数据字典（input_size/mean/std/crop_pct/interpolation/url）
- **模型数量**：700+ 预训练权重，覆盖 ResNet/EfficientNet/ViT/ConvNeXt/DeiT/Swin/MobileNet/RegNet 等
- **当前版本**：1.0.28（2026-07-11）
- **非官方**：timm 是第三方库，不属于 PyTorch 官方；与 torchvision.models 并行存在

## 安装与验证

```bash
pip install timm      # 或 pip install --upgrade timm 升级
```

验证安装与版本：

```python
import timm
print(timm.__version__)   # 1.0.28
```

## 加载预训练模型并推理

最小可用流程——加载 MobileNetV3、预处理图片、前向、取 top-5：

```python
import timm
import torch
import requests
from PIL import Image

# ① 加载模型（pretrained=True 自动下载权重；推理前务必 .eval()）
model = timm.create_model('mobilenetv3_large_100', pretrained=True).eval()

# ② 预处理：从 pretrained_cfg 解析每个模型专属的 transforms
data_cfg = timm.data.resolve_data_config(model.pretrained_cfg)
transform = timm.data.create_transform(**data_cfg)

image = Image.open(requests.get('https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/timm/cat.jpg', stream=True).raw)
image_tensor = transform(image).unsqueeze(0)   # [1, 3, 224, 224]

# ③ 前向（no_grad 省显存）
with torch.no_grad():
    output = model(image_tensor)               # [1, 1000] ImageNet logits
    probs = torch.nn.functional.softmax(output[0], dim=0)

# ④ top-5
values, indices = torch.topk(probs, 5)
print(indices)   # tensor([281, 282, 285, 673, 670])
```

> **铁律 1**：`create_model` 默认返回训练模式（含 Dropout/BN 训练态），推理前必须 `.eval()`，否则结果不稳。
>
> **铁律 2**：每个模型的 input_size/mean/std/interpolation 不同，**必须用 `resolve_data_config` 从 `pretrained_cfg` 解析**，别套通用 ImageNet 归一化——有的模型用 bicubic、有的 crop_pct 是 0.9。

## 列出与查找模型

```python
import timm
from pprint import pprint

# 全部模型名
all_models = timm.list_models()                        # 1000+ 字符串

# 仅有预训练权重的
pretrained = timm.list_models(pretrained=True)         # 700+ 个

# 通配符过滤（* 匹配任意字符）
resnet_variants = timm.list_models('*resne*t*')        # ['cspresnet50', 'resnet50', ...]
vit_variants = timm.list_models('vit_*_patch16_224*')  # ['vit_base_patch16_224', ...]

# 查单个模型是否有预训练权重
'convnext_tiny' in timm.list_models(pretrained=True)   # True/False
```

## 微调：替换分类头

改 `num_classes` 即可让预训练模型适配自定义类别数——timm 会自动把最后一层分类器替换为新的线性层（旧权重丢弃，其余层继承预训练权重）：

```python
NUM_CLASSES = 10   # 你的数据集类别数
model = timm.create_model('mobilenetv3_large_100', pretrained=True, num_classes=NUM_CLASSES)
# model.classifier 现在是 Linear(960, 10)，其余层带 ImageNet 预训练权重
```

之后写标准 PyTorch 训练循环（或参考 timm 自带的 `train.py` 脚本）即可微调。

## 特征提取：三种用法

timm 的特征提取是其最被下游库（检测/分割/检索）依赖的能力。

### ① forward_features：倒数第二层（未池化）

```python
model = timm.create_model('xception41', pretrained=True).eval()
x = torch.randn(2, 3, 299, 299)
features = model.forward_features(x)   # [2, 2048, 10, 10]  跳过分类头与全局池化
logits = model.forward_head(features)  # 也可再喂回分类头 [2, 1000]
```

### ② features_only：多尺度特征金字塔（检测/分割主干）

```python
model = timm.create_model('resnest26d', pretrained=True, features_only=True).eval()
outputs = model(torch.randn(2, 3, 224, 224))
for o in outputs:
    print(o.shape)
# torch.Size([2, 64, 112, 112])    stride 2
# torch.Size([2, 256, 56, 56])     stride 4
# torch.Size([2, 512, 28, 28])     stride 8
# torch.Size([2, 1024, 14, 14])    stride 16
# torch.Size([2, 2048, 7, 7])      stride 32

# 查每层通道数与下采样倍数（喂给下游 head 不必硬编码）
print(model.feature_info.channels())    # [64, 256, 512, 1024, 2048]
print(model.feature_info.reduction())   # [2, 4, 8, 16, 32]
```

`out_indices` 选要哪些层（支持负索引，`out_indices=(-2,)` 取倒数第二层）；`output_stride` 用膨胀卷积控制最大下采样（部分网络仅支持 32）。

### ③ forward_intermediates：任意中间层（含 ViT 每个 block）

```python
model = timm.create_model('vit_medium_patch16_reg1_gap_256', pretrained=True)
output, intermediates = model.forward_intermediates(torch.randn(2, 3, 256, 256))
for i, o in enumerate(intermediates):
    print(f'block {i}: {o.shape}')   # 每个 transformer block 的输出

# 配合 prune_intermediate_layers 裁掉不需要的层（省显存）
indices = model.prune_intermediate_layers(indices=(-2,), prune_head=True, prune_norm=True)
intermediates = model.forward_intermediates(x, indices=indices, intermediates_only=True)
```

## pretrained_cfg：模型的元数据字典

每个预训练模型都带一个 `pretrained_cfg`，记录推理所需的全部预处理参数：

```python
model = timm.create_model('mobilenetv3_large_100', pretrained=True)
print(model.pretrained_cfg)
# {
#   'url': 'https://github.com/rwightman/pytorch-image-models/releases/.../mobilenetv3_large_100_ra-f55367f5.pth',
#   'num_classes': 1000,
#   'input_size': (3, 224, 224),
#   'crop_pct': 0.875,
#   'interpolation': 'bicubic',
#   'mean': (0.485, 0.456, 0.406),
#   'std': (0.229, 0.224, 0.225),
#   'first_conv': 'conv_stem',
#   'classifier': 'classifier',
#   'architecture': 'mobilenetv3_large_100',
# }
```

用它生成 transforms 是最稳妥的做法（避免用错归一化或裁剪比例）：

```python
data_cfg = timm.data.resolve_data_config(model.pretrained_cfg)
transform = timm.data.create_transform(**data_cfg)
```

## 与 torchvision.models 的关系

| 维度 | timm | torchvision.models |
| --- | --- | --- |
| 维护方 | Ross Wightman（HuggingFace 托管） | PyTorch 官方 |
| 模型数量 | 700+ 预训练权重 | 约 50 个模型 |
| 论文跟进速度 | 业界最快 | 滞后数月到一年 |
| 特征提取 API | `features_only` / `forward_intermediates` 完善 | 需手动改 forward |
| 训练技巧 | 内置 LabelSmoothing/Mixup/CutMix/SAM/Lamb | 无 |
| 定位 | SOTA 模型集合 + 训练栈 | 基础模型 + 与 torchvision 配套 |

两者**并行存在**：用 torchvision 做简单分类推理没问题；要做严肃训练或用最新架构，timm 是首选。

## 下一步

- 入门后请读 **指南**：自定义模型注册、训练栈（loss/optim/augment）、权重迁移细节
- 推理跑通后看 **参考**：API 速查表、模型族对照、pretrained_cfg 字段全集
- 想跑完整训练，参考 timm 仓库的 `train.py` 脚本与 `hparams` 配置
