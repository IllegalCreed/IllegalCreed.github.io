---
layout: doc
---

# timm

timm（**PyTorch Image Models**）是 Ross Wightman 个人发起并主力维护、现托管于 HuggingFace 组织（github.com/huggingface/pytorch-image-models）的开源 PyTorch 视觉模型库。它的核心定位是「**SOTA 图像模型的一站式集合**」——收录 **700+ 个预训练权重**，覆盖 ResNet、EfficientNet、Vision Transformer（ViT）、ConvNeXt、DeiT、Swin、MobileNet、RegNet、XCiT、MaxViT 等几乎所有主流架构及其变体。统一入口是 `timm.create_model(name, pretrained=True, ...)`：一行加载任意架构与权重，`num_classes` 改分类头做微调，`features_only=True` 把分类网络改造成多尺度特征提取主干（喂给检测/分割头），`forward_features()` 取倒数第二层特征，`forward_intermediates()` 取任意中间层。配套还有 `timm.data`（图像预处理 transforms，能从 `pretrained_cfg` 自动解析每个模型的 input_size/mean/std/interpolation）、`timm.optim`（Lamb/LookaheadAdam 等优化器）、`timm.loss`（LabelSmoothingCrossEntropy、JsdCrossEntropy 等训练专用损失）与 `train.py` 训练脚本。**timm 是独立维护的第三方库，不是 PyTorch 官方项目**——与 `torchvision.models`（约 50 个模型、更新慢）相比，timm 模型数量多一个数量级、跟进论文最快、训练技巧齐全；与 OpenMMLab 的「多任务体系」不同，timm 只专注「图像分类与特征提取主干」这一件事，做得极致轻量。截至 2026 年 7 月，稳定版为 **1.0.28**（2026-07-11 发布）。信源 huggingface.co/docs/timm 官方文档 + GitHub Releases。

## 评价

**优点**

- **模型数量碾压**：700+ 预训练权重，几乎覆盖所有公开 SOTA 图像分类架构与变体，跟进论文速度业界最快
- **API 极简且一致**：`create_model('xxx', pretrained=True)` 一行加载任意模型，`num_classes`/`features_only`/`global_pool` 等参数跨架构统一
- **特征提取一等公民**：`features_only=True` + `out_indices` 把分类网络变成 FPN 主干，`forward_intermediates()` 灵活取任意中间层，检测/分割社区重度依赖
- **预处理自动匹配**：`pretrained_cfg` 自带 input_size/mean/std/crop_pct/interpolation，`resolve_data_config` + `create_transform` 自动生成正确 transforms，避免「用错归一化」的低级错误
- **训练栈完整**：内置 LabelSmoothingCrossEntropy、Mixup/CutMix、SAM、Lamb、Lookahead 等训练技巧实现与 `train.py` 脚本，复现论文一键起步
- **权重迁移友好**：`checkpoint_path` 加载外部权重、`pretrained_cfg` 可自定义 url 与裁剪策略，方便接入自训权重

**缺点**

- **作者依赖明显**：核心维护者是 Ross Wightman 一人，虽有 HuggingFace 托管，社区贡献门槛与可持续性仍依赖个人精力
- **非 PyTorch 官方**：与 `torchvision.models` 生态脱节，PyTorch 官方教程与部分下游库默认不引用，集成时需手动说明
- **任务范围窄**：只做图像分类与特征提取主干，检测/分割/姿态等完整任务链路需配合其他库（如 OpenMMLab、Detectron2）
- **模型命名约定松散**：700+ 模型的命名（如 `efficientnetv2_s`、`convnext_tiny.fb_in22k`、`vit_base_patch16_224.augreg_in21k`）没有强规范，查找需 `list_models('*pattern*')` 模糊匹配
- **部分老旧权重精度不一**：早期权重（如部分 EfficientNet 变体）与最新重训版本精度有差异，生产用需查 README 性能表确认

## 文档地址

- [timm 官方文档（HuggingFace）](https://huggingface.co/docs/timm/index)
- [Quickstart（create_model 与推理）](https://huggingface.co/docs/timm/quickstart)
- [Feature Extraction（特征提取指南）](https://huggingface.co/docs/timm/feature_extraction)
- [Pretrained Configs（权重性能表）](https://huggingface.co/docs/timm/pretrained_configs)
- [Installation](https://huggingface.co/docs/timm/installation)

## GitHub地址

- [huggingface/pytorch-image-models](https://github.com/huggingface/pytorch-image-models)
- [Releases（版本事实来源）](https://github.com/huggingface/pytorch-image-models/releases)

## 幻灯片地址

<a href="/SlideStack/timm-slide/" target="_blank">timm</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">timm 测试题</a>
