---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 timm 1.0.28 官方文档（Feature Extraction / Training Script / Source 结构）+ GitHub README 编写

## 速查

- **核心工厂**：`timm.create_model(name, pretrained=, num_classes=, features_only=, out_indices=, output_stride=, global_pool=, checkpoint_path=, pretrained_cfg=, **kwargs)`
- **特征提取三件套**：`forward_features(x)`（倒数第二层）/ `features_only=True`（多尺度金字塔）/ `forward_intermediates(x)`（任意中间层）
- **改分类头**：`num_classes=N` 替换最后线性层；`num_classes=0` 去掉分类头只留特征；`reset_classifier(0, '')` 运行时去掉
- **池化控制**：`global_pool='avg'/'max'/'avgmax'/'catavgmax'/''`（空串表示不池化，返回 spatial 特征图）
- **pretrained_cfg 自定义**：传 `pretrained_cfg=dict(url=..., input_size=..., ...)` 覆盖默认；`pretrained_cfg_overlay` 增量覆盖个别字段
- **外部权重**：`checkpoint_path='xxx.pth'` 加载自训或第三方权重
- **预处理**：`timm.data.resolve_data_config(cfg)` + `timm.data.create_transform(**cfg, is_training=False)`
- **训练 transforms**：`is_training=True` 加 RandAugment/Mixup；或自建 `timm.data.create_dataset` + `create_loader`
- **损失**：`timm.loss.LabelSmoothingCrossEntropy` / `SoftTargetCrossEntropy`（配 Mixup）/ `JsdCrossEntropy`（知识蒸馏）
- **优化器**：`timm.optim.create_optimizer_v2`（Lamb/Lion/AdamW）+ `timm.optim.Lookahead` 包装
- **训练脚本**：`python train.py data_dir -b 256 --model resnet50 --pretrained --amp`
- **模型注册**：`@register_model` 装饰器把自定义架构注册进 timm，即可被 `create_model` 与 `list_models` 发现

## create_model 全参数详解

```python
model = timm.create_model(
    'resnet50',
    pretrained=True,            # 下载并加载 ImageNet 预训练权重
    num_classes=100,            # 替换分类头为 100 类（默认 1000）；0 表示不要分类头
    features_only=False,        # True 则返回多尺度特征提取器（不做分类）
    out_indices=(0, 1, 2, 3, 4), # features_only 时选哪些层（支持负索引）
    output_stride=32,           # 控制最大下采样（部分网络支持 8/16，用膨胀卷积）
    global_pool='avg',          # 全局池化方式：avg/max/avgmax/catavgmax/''（空=不池化）
    checkpoint_path='',         # 加载外部权重文件（与 pretrained 互斥语义）
    pretrained_cfg=None,        # 完全覆盖默认 pretrained_cfg
    pretrained_cfg_overlay=None, # 增量覆盖个别字段（如自定义 url）
    drop_rate=0.0,              # 分类头前 Dropout
    drop_path_rate=0.0,         # Stochastic Depth（残差块随机跳层）
    **kwargs,                   # 传给具体模型 __init__ 的架构超参（如 depths、dims）
)
```

关键约束：

- `features_only=True` 与 `num_classes` 互斥（特征提取器没有分类头）
- `global_pool=''` 时 `forward` 返回 spatial 特征图（未池化），配合 `num_classes=0` 等价于手动调 `forward_features`
- `output_stride` 非所有模型支持，ResNet 系列支持 8/16/32，ViT 等非层级结构通常只支持默认 stride

## 特征提取进阶

### 选定层级与限制 stride

```python
# 只要 stride 8 和 stride 32 两层（用膨胀卷积把 stride 32 压到 8）
model = timm.create_model(
    'ecaresnet101d',
    pretrained=True,
    features_only=True,
    output_stride=8,
    out_indices=(2, 4),
).eval()
outputs = model(torch.randn(2, 3, 320, 320))
print(model.feature_info.channels())    # [512, 2048]
print(model.feature_info.reduction())   # [8, 8]  两层都是 stride 8
```

### 池化特征（无分类头，已池化）

```python
# num_classes=0 保留池化、去掉分类头 → 输出 [N, C] 的特征向量（常用于检索/度量学习）
model = timm.create_model('resnet50', pretrained=True, num_classes=0).eval()
features = model(torch.randn(2, 3, 224, 224))   # [2, 2048]
```

### ViT 中间 block 特征与裁剪

ViT 这类 block 化模型，`forward_intermediates` 返回每个 transformer block 的输出，配合 `prune_intermediate_layers` 可裁掉尾部 block 省显存：

```python
model = timm.create_model('vit_base_patch16_224', pretrained=True)
# 只要倒数第 2 个 block，并裁掉 head/norm/最后 block
indices = model.prune_intermediate_layers(indices=(-2,), prune_head=True, prune_norm=True)
output, intermediates = model.forward_intermediates(
    torch.randn(2, 3, 224, 224), indices=indices, intermediates_only=True
)
```

## 训练栈：timm 不只是模型库

timm 自带完整的图像分类训练栈，复现论文 SOTA 一键起步。

### 数据与增强

```python
from timm.data import create_dataset, create_loader, resolve_data_config, create_transform

# 数据集（ImageFolder 格式或自定义 torch.Dataset）
dataset = create_dataset('image_folder', root='data/train/', transform=None)

# 训练 transforms（含 RandAugment/Mixup）
train_cfg = resolve_data_config({}, model=model, use_test_size=False, verbose=True)
train_transform = create_transform(**train_cfg, is_training=True, auto_augment='rand-m9-mstd0.5')

# DataLoader（自动组批、mixup 在 collate）
loader = create_loader(
    dataset,
    input_size=(3, 224, 224),
    batch_size=256,
    is_training=True,
    auto_augment='rand-m9-mstd0.5',
    mixup_cfg=dict(mixup_alpha=0.2, cutmix_alpha=1.0),   # Mixup + CutMix
    num_workers=8,
)
```

### 损失与优化器

```python
from timm.loss import LabelSmoothingCrossEntropy, SoftTargetCrossEntropy
from timm.optim import create_optimizer_v2

# 配合 Mixup 用 SoftTarget（标签是软分布）；不用 Mixup 用 LabelSmoothing
train_loss_fn = SoftTargetCrossEntropy()
eval_loss_fn = torch.nn.CrossEntropyLoss()

# 优化器（timm 的 create_optimizer_v2 支持新的 Lion/Lamb/AdamW 等）
optimizer = create_optimizer_v2(model, opt='adamw', lr=1e-3, weight_decay=0.05)
# 可再包 Lookahead 提升泛化
from timm.optim import Lookahead
optimizer = Lookahead(optimizer)
```

### 训练脚本（train.py）

仓库根目录的 `train.py` 是完整训练入口，常见用法：

```bash
python train.py /data/imagenet \
    --model resnet50 \
    --pretrained \                       # 加载 ImageNet 预训练做微调
    -b 256 \                             # batch size
    --amp \                              # 混合精度
    --opt adamw --lr 1e-4 --weight-decay 0.05 \
    --epochs 30 \
    --aug-rand-m9 \                      # RandAugment magnitude 9
    --mixup 0.2 --cutmix 1.0 \
    --smoothing 0.1 \                    # Label Smoothing
    --output train_logs/
```

## 权重迁移与自定义 pretrained_cfg

### 加载自训或第三方权重

```python
# checkpoint_path 加载本地权重（timm 会处理 key 前缀匹配）
model = timm.create_model('resnet50', checkpoint_path='my_weights.pth', num_classes=10)

# 或手动加载（更灵活，处理 key 不完全匹配）
model = timm.create_model('resnet50', num_classes=10)
state_dict = torch.load('my_weights.pth', map_location='cpu')
model.load_state_dict(state_dict, strict=False)   # strict=False 容忍部分 key 不匹配
```

### 自定义 pretrained_cfg（用自训权重的预处理参数）

```python
model = timm.create_model(
    'resnet50',
    pretrained=True,
    pretrained_cfg_overlay=dict(
        url='https://my.server/resnet50_custom.pth',
        mean=(0.5, 0.5, 0.5),      # 自训时用了不同的归一化
        std=(0.5, 0.5, 0.5),
        crop_pct=0.9,
    ),
)
```

## 注册自定义模型

把自研架构注册进 timm，即可被 `create_model` 与 `list_models` 统一发现：

```python
from timm.models import register_model
import torch.nn as nn

@register_model
def my_cnn(pretrained=False, **kwargs):
    model = nn.Sequential(nn.Conv2d(3, 64, 3), nn.AdaptiveAvgPool2d(1), nn.Linear(64, kwargs.get('num_classes', 1000)))
    if pretrained:
        # 加载预训练权重的逻辑
        ...
    return model

# 之后即可
m = timm.create_model('my_cnn', pretrained=False)
' my_cnn' in timm.list_models()
```

## 陷阱与最佳实践

- **推理忘 `.eval()`**：`create_model` 默认 train 模式，BN 用 batch 统计、Dropout 生效，结果会抖——务必 `.eval()`
- **用错预处理**：每个模型 input_size/mean/std/crop_pct/interpolation 不同，**别套通用 ImageNet 归一化**，用 `resolve_data_config(model.pretrained_cfg)`
- **features_only 模型仍要 .eval()**：特征提取器同样受 train/eval 影响（尤其 BN）
- **output_stride 兼容性**：非所有模型支持 stride < 32，查 `feature_info.reduction()` 确认实际下采样
- **pretrained 与 checkpoint_path**：同时传时 pretrained 优先下载官方权重，自训权重用 checkpoint_path
- **ViT 的 cls token**：ViT 类模型 `forward_features` 返回含 cls token 的序列（[N, 1+H*W, C]），后续处理要剥离首列
- **模型命名查不准**：700+ 模型无强命名规范，用 `list_models('*pattern*')` 通配符模糊查找
- **旧权重精度**：早期权重可能与 README 性能表有差异，生产前查对应模型 tag 的精度
