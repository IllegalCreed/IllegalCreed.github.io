---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 timm 1.0.28 官方 API 文档（huggingface.co/docs/timm/reference）+ GitHub README 模型清单整理

## 速查

- **核心入口**：`timm.create_model(name, pretrained=True, ...)` → PyTorch `nn.Module`
- **列模型**：`timm.list_models(pretrained=True)` / `timm.list_models('*pattern*')`
- **特征提取**：`model.forward_features(x)` / `features_only=True` / `model.forward_intermediates(x)`
- **改分类头**：`num_classes=N` / `model.reset_classifier(N, global_pool='')`
- **预处理**：`timm.data.resolve_data_config(model.pretrained_cfg)` + `timm.data.create_transform(**cfg)`
- **训练栈**：`timm.data.create_dataset` / `create_loader` / `timm.loss.*` / `timm.optim.create_optimizer_v2`
- **注册模型**：`@timm.models.register_model`
- **当前版本**：1.0.28（2026-07-11）
- **维护方**：Ross Wightman（HuggingFace 组织托管，非 PyTorch 官方）
- **模型数量**：700+ 预训练权重，覆盖 30+ 模型族

## create_model 参数全集

| 参数 | 类型 | 作用 |
| --- | --- | --- |
| `name` | str | 模型名（如 `'resnet50'`、`'vit_base_patch16_224'`） |
| `pretrained` | bool | 是否加载预训练权重 |
| `pretrained_cfg` | dict/None | 完全覆盖默认 pretrained_cfg |
| `pretrained_cfg_overlay` | dict/None | 增量覆盖 pretrained_cfg 个别字段 |
| `checkpoint_path` | str | 加载外部权重文件路径 |
| `num_classes` | int | 分类头类别数；0 表示无分类头 |
| `global_pool` | str | 池化方式：`'avg'`/`'max'`/`'avgmax'`/`'catavgmax'`/`''`（空=不池化） |
| `features_only` | bool | True 返回多尺度特征提取器（无分类头） |
| `out_indices` | tuple | features_only 时选哪些层（支持负索引） |
| `output_stride` | int | 最大下采样倍数（用膨胀卷积，部分模型支持 8/16） |
| `drop_rate` | float | 分类头前 Dropout |
| `drop_path_rate` | float | Stochastic Depth 比例 |
| `**kwargs` | | 传给具体模型 __init__ 的架构超参 |

## 主要模型族对照

| 模型族 | 代表名 | 特点 |
| --- | --- | --- |
| **ResNet** | `resnet50` `resnet101` `resnest26d` `resnetv2_50` | 经典残差网络及变体（ResNeSt/ResNet-V2） |
| **EfficientNet** | `efficientnet_b0`–`b7` `efficientnetv2_s/m/l` | 复合缩放；V2 为改进版 |
| **Vision Transformer** | `vit_base_patch16_224` `vit_large_patch14_224` | 原版 ViT，多分辨率多 patch 尺寸 |
| **DeiT** | `deit_base_patch16_224` `deit3_base_patch16_224` | 数据高效 ViT（蒸馏） |
| **ConvNeXt** | `convnext_tiny/small/base/large` | 现代化 CNN，对标 ViT |
| **Swin** | `swin_base_patch4_window7_224` | 层级移窗 Transformer |
| **MobileNet** | `mobilenetv3_large_100` `mobilenetv2_100` | 轻量化移动端 |
| **RegNet** | `regnety_032` `regnetz_040` | 设计空间搜索的网络族 |
| **XCiT** | `xcit_medium_24_p8_224` | 交叉协差注意力（高效） |
| **MaxViT** | `maxvit_tiny/small/base` | 多轴注意力混合 CNN |
| **CaiT** | `cait_m36_224` | Class-Attention in Image Transformers |
| **CoatNet** | `coatnet_0_rw_224` | CNN 与 Attention 混合 |
| **VoVNet** | `ese_vovnet19b_dw` | One-Shot Aggregate 高效 CNN |
| **DenseNet** | `densenet121/169/201/161` | 密集连接 |
| **DLA** | `dla34/46/60/102` | Deep Layer Aggregation |
| **CSPNet** | `cspresnet50` `cspresnext50` `cspdarknet53` | Cross Stage Partial |

> 模型名常带后缀标识权重来源：`.augreg_in21k`（AugReg 21k 预训练）、`.fb_in22k`（FAIR 22k）、`.ra_in1k`（ResArch 重训）、`.sun`（Unnatural 数据）。`list_models(pretrained=True)` 看全名。

## pretrained_cfg 字段

```python
{
    'url': str,              # 权重下载地址
    'num_classes': int,      # 预训练类别数（通常 1000）
    'input_size': (3, H, W), # 模型期望输入尺寸
    'crop_pct': float,       # 推理时中心裁剪比例（如 0.875）
    'interpolation': str,    # 插值方式：bilinear/bicubic
    'mean': (r, g, b),       # 归一化均值
    'std': (r, g, b),        # 归一化标准差
    'first_conv': str,       # 第一个卷积层名（权重迁移用）
    'classifier': str,       # 分类头层名（替换分类头用）
    'architecture': str,     # 架构名（去掉 tag 的纯名）
    'dataset': str,          # 预训练数据集（如 'imagenet-1k'）
    'license': str,          # 权重许可证
}
```

## timm.data 模块

| API | 作用 |
| --- | --- |
| `resolve_data_config(cfg, model=, use_test_size=)` | 从 pretrained_cfg 解析预处理参数（可合并模型默认） |
| `create_transform(input_size, is_training=, auto_augment=, ...)` | 生成 transforms.Compose |
| `create_dataset(name, root, transform=, ...)` | 创建数据集（image_folder / torch / custom） |
| `create_loader(dataset, input_size, batch_size, is_training=, auto_augment=, mixup_cfg=, ...)` | 创建 DataLoader（含 mixup collate） |
| `Mixup(mixup_alpha=, cutmix_alpha=, ...)` | Mixup/CutMix 增强 |
| `FastCollateMixup` | 高效 mixup collate 函数 |

## timm.loss 模块

| 损失类 | 适用场景 |
| --- | --- |
| `LabelSmoothingCrossEntropy` | 标签平滑交叉熵（不用 Mixup 时） |
| `SoftTargetCrossEntropy` | 软目标交叉熵（配 Mixup/CutMix 用） |
| `JsdCrossEntropy` | Jensen-Shannon 散度（知识蒸馏） |
| `BceLoss` | 二分类（多标签场景） |

## timm.optim 模块

| API / 类 | 作用 |
| --- | --- |
| `create_optimizer_v2(model_or_params, opt='adamw', lr=, weight_decay=, ...)` | 统一创建优化器（支持 adamw/lamb/lion/sgd 等） |
| `Lookahead(optimizer, ...)` | Lookahead 优化器包装 |
| `NvLamb` / `Lamb` | Layer-wise Adaptive Moment |
| `Lion` | Lion 优化器（符号动量） |
| `create_scheduler(args, optimizer)` | 创建学习率调度器（cosine/step/t-vars） |

## timm.utils 模块

| API | 作用 |
| --- | --- |
| `dispatch_clip_grad` | 梯度裁剪（支持 norm/value 模式） |
| `AverageMeter` | 指标均值统计 |
| `accuracy(output, target, topk=(1,))` | Top-K 准确率 |
| `ModelEmaV2` | 模型 EMA（指数滑动平均，提升泛化） |
| `CheckpointSaver` | checkpoint 保存（含 best 跟踪） |

## 版本与兼容

### 近期版本要点

| 版本 | 发布时间 | 关键变化 |
| --- | --- | --- |
| 1.0.28 | 2026-07-11 | 当前稳定版；模型与权重持续扩充 |
| 1.0.27 | 2026-05 | bugfix 与新权重 |
| 1.0.26 | 2026-03 | 新增模型族权重 |
| 1.0.25 | 2026-02 | forward_intermediates API 增强 |
| 1.0.x | 2024 起 | HuggingFace 托管主线，API 趋稳 |
| 0.4.x | 2020–2021 | rwightman 时代，create_model 主接口定型 |

### 兼容性

- **Python**：≥ 3.8（推荐 3.9–3.11）
- **PyTorch**：≥ 1.13（推荐 2.x）
- **依赖**：`torch` / `torchvision`（仅 transforms 兼容）/ `huggingface_hub`（权重托管）

## 与同类库对比

| 维度 | timm | torchvision.models | OpenMMLab (MMPreTrain) |
| --- | --- | --- | --- |
| 维护方 | Ross Wightman / HF | PyTorch 官方 | OpenMMLab 社区 |
| 模型数量 | 700+ 预训练 | ~50 模型 | 数十种（含自监督） |
| 论文跟进 | 最快 | 慢 | 快 |
| 任务焦点 | 分类 + 特征提取 | 分类 + 特征 | 分类 + 自监督 + 多模态 |
| 训练栈 | 完整（loss/optim/aug） | 无 | 完整（基于 MMEngine） |
| 配置 | 函数式 kwargs | 函数式 kwargs | 纯 Python Config |
| 上手曲线 | 平（一行 create_model） | 极平 | 陡（Registry/Config） |

## 官方资源

- [timm 文档（HuggingFace）](https://huggingface.co/docs/timm/index)
- [Quickstart](https://huggingface.co/docs/timm/quickstart)
- [Feature Extraction 指南](https://huggingface.co/docs/timm/feature_extraction)
- [Pretrained Configs 性能表](https://huggingface.co/docs/timm/pretrained_configs)
- [GitHub huggingface/pytorch-image-models](https://github.com/huggingface/pytorch-image-models)
- [Releases](https://github.com/huggingface/pytorch-image-models/releases)
- [论文笔记（rwightman/pytorch-image-models README）](https://github.com/huggingface/pytorch-image-models#models)
