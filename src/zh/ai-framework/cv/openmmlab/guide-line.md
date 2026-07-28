---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 MMEngine 官方文档（mmengine.readthedocs.io Registry / Config / Runner / Hook / Visualization 章节）+ OpenMMLab 2.0 设计文档编写

## 速查

- **Registry**：`REGISTRY = Registry('name', scope='mmengine')` → `@REGISTRY.register_module()` 装饰类 → `REGISTRY.build(dict(type='Xxx'))` 实例化
- **跨库复用**：`scope` 形成层级树，子库设 `parent`，查找时本节点找不到自动上溯父节点
- **显式跨库**：`type='mmdet.FasterRCNN'`（父库）或 config 内 `_scope_='mmpretrain'`（兄弟库临时切换）
- **20+ root registry**：`MODELS` / `DATASETS` / `OPTIMIZERS` / `HOOKS` / `TRANSFORMS` / `METRICS` / `VISUALIZERS` / `PARAM_SCHEDULERS` ...
- **Config 纯 Python**：`*.py` 文件，顶层是 Python 变量赋值（`model = dict(...)`），不是 YAML
- **Config 继承**：`_base_ = ['./a.py', './b.py']`，后定义的覆盖先定义的，多文件按顺序合并
- **Config 修改语法**：`_delete_=True` 删除父字段；`dict(a=1, b=2)` 覆盖；列表整体替换
- **Config lazy import**：只 import 用到的库，避免装一堆没用的算法库
- **Runner 生命周期**：`train` / `val` / `test` 三循环，每个循环内是「epoch → iter」两级
- **Hook**：`before_run` / `before_train` / `before_train_epoch` / `before_train_iter` / `after_train_iter` / ... 全生命周期钩子
- **OptimWrapper**：封装 optimizer，原生支持混合精度（AMP）`optim_wrapper = dict(type='OptimWrapper', optimizer=dict(type='SGD'))`，配 `Scaler`
- **ParamScheduler**：替代 step LR，支持 CosineAnnealing / Linear / Step / CosineRestarts 等
- **Visualizer 多后端**：`vis_backends=[dict(type='LocalVisBackend'), dict(type='TensorboardVisBackend'), dict(type='WandbVisBackend')]` 同时挂多个

## Registry：OpenMMLab 的灵魂

Registry 解决的核心问题是「**用字符串名字驱动类的实例化**」。这样 config 里写 `type='ResNet'`，运行时就能找到对应的类并构造——模型架构、数据集、优化器全部可序列化进配置文件。

### 基本用法

```python
from mmengine import Registry
import torch.nn as nn

# 1. 创建注册器（scope 是命名域，用于跨库隔离与查找）
MODELS = Registry('model', scope='myproj')

# 2. 注册类（装饰器写法，名字默认取类名）
@MODELS.register_module()
class ResNet(nn.Module):
    def __init__(self, depth=50):
        super().__init__()
        self.depth = depth
    def forward(self, x):
        return x

# 3. 注册函数（也行）
@MODELS.register_module(name='my_loss')
def my_loss(pred, target):
    return (pred - target).abs().mean()

# 4. 从 config 实例化
model = MODELS.build(dict(type='ResNet', depth=101))
loss = MODELS.build(dict(type='my_loss'))
```

也可以用 `force=True` 覆盖已注册项（同名重复注册默认报错）：

```python
@MODELS.register_module(force=True)
class ResNet(nn.Module):   # 覆盖原 ResNet
    ...
```

### scope 层级与跨库查找

`scope` 让注册器形成树：子库注册器声明 `parent` 指向父库注册器，查找时**本节点找不到就上溯父节点**。OpenMMLab 2.0 内置 20+ 个 root registry（`MODELS`、`DATASETS`、`OPTIMIZERS` 等）作为顶层父节点。

```python
# mmdet 的 MODELS 注册器，parent 指向 mmengine 的 root MODELS
from mmdet.registry import MODELS as DET_MODELS   # scope='mmdet'
from mmengine.registry import MODELS as ROOT       # scope='mmengine'

# mmdet 里注册一个模型，mmdet 自己找得到
@DET_MODELS.register_module()
class FasterRCNN: ...

# mmengine 里注册一个通用 backbone
@ROOT.register_module()
class ResNet: ...

# 在 mmdet 的 config 里，可以同时用两个库的模块：
#   type='FasterRCNN'  → 本库找到
#   type='mmengine.ResNet' → 显式指定从父库找（前缀写法）
```

**查找规则**：

| 写法 | 行为 |
| --- | --- |
| `type='FasterRCNN'` | 先查当前 scope（mmdet），找不到上溯父节点 |
| `type='mmengine.ResNet'` | 显式从父库 mmengine 查（前缀语法） |
| `type='mmpretrain.VisionTransformer'` | 从兄弟库 mmpretrain 查 |
| config 内 `_scope_='mmpretrain'` | 临时把当前块的查找 scope 切到 mmpretrain |

`Runner` 启动时会调 `init_default_scope('mmdet')` 把搜索路径对齐到具体算法库，确保 config 里的 `type` 能被解析。

### 注册时机：必须先 import

Registry 是**按需加载**的——只有当包含 `@register_module()` 的文件被 import 过，类才进注册表。所以推理/训练脚本第一步往往是 `register_all_modules()`：

```python
from mmdet.utils import register_all_modules
register_all_modules()   # 触发 mmdet 全部 model/dataset/... 模块的 import
```

自定义模块若不在默认 import 链上，需在 config 顶部写 `custom_imports = dict(imports=['my_proj.models'], allow_failed_imports=False)`，MMEngine 会帮你 import。

## Config：纯 Python 配置系统

OpenMMLab 的 config 是 **`.py` 文件**，顶层是变量赋值。这比 YAML/JSON 表达力强得多——能用 Python 的条件、循环、`dict` 嵌套组装复杂模型。

```python
# configs/my_config.py
model = dict(
    type='FasterRCNN',
    data_preprocessor=dict(
        type='DetDataPreprocessor',
        mean=[123.675, 116.28, 103.53],
        std=[58.395, 57.12, 57.375],
        bgr_to_rgb=True),
    backbone=dict(
        type='ResNet',
        depth=50,
        num_stages=4,
        out_indices=(0, 1, 2, 3),
        frozen_stages=1,
        norm=dict(type='BN', requires_grad=True),
        norm_eval=True,
        style='pytorch'),
    neck=dict(type='FPN', in_channels=[256, 512, 1024, 2048], out_channels=256, num_outs=5),
    rpn_head=dict(...),
    roi_head=dict(...),
)

train_dataloader = dict(
    batch_size=2,
    num_workers=2,
    dataset=dict(type='CocoDataset', data_root='data/coco/', ann_file='annotations/instances_train2017.json', ...),
)

optim_wrapper = dict(type='OptimWrapper', optimizer=dict(type='SGD', lr=0.02, momentum=0.9, weight_decay=0.0001))
param_scheduler = [dict(type='LinearLR', start_factor=0.001, by_epoch=False, begin=0, end=500), ...]
train_cfg = dict(type='EpochBasedTrainLoop', max_epochs=12, val_interval=1)
```

### 继承：_base_ 与覆盖

复杂模型不重复写，靠 `_base_` 继承：

```python
# configs/faster-rcnn_r50_fpn_1x_coco.py
_base_ = [
    '../_base_/models/faster-rcnn_r50_fpn.py',
    '../_base_/datasets/coco_detection.py',
    '../_base_/schedules/schedule_1x.py',
    '../_base_/default_runtime.py',
]
```

子 config 覆盖父字段，按 dict 递归合并：

```python
# 把 backbone 从 ResNet-50 换成 ResNet-101
_base_ = './faster-rcnn_r50_fpn_1x_coco.py'
model = dict(
    backbone=dict(depth=101),   # 只改 depth，其他字段继承父 config
)
```

需要**整体替换**而非合并时，加 `_delete_=True`：

```python
model = dict(
    backbone=dict(_delete_=True, type='MobileNetV3', ...),   # 删除父 backbone 全部字段，只保留这里写的
)
```

### 加载与运行时修改

```python
from mmengine.config import Config
cfg = Config.fromfile('configs/faster-rcnn_r50_fpn_1x_coco.py')

# 运行时改字段（Python dict 风格，点号取值）
cfg.model.backbone.depth = 101
cfg.train_dataloader.batch_size = 4
cfg.optimizer.lr = 0.01   # 注意：嵌套字段是 ConfigDict，支持点号

# 命令行 --cfg-options 走同一套机制
# python tools/train.py config.py --cfg-options model.backbone.depth=101
```

> **lazy import**：Config 只 import config 里实际引用的库。`custom_imports` 里没写就不 import，避免装一堆没用算法库。这也是为什么 `register_all_modules` 是显式调用而非自动触发。

## Runner：训练生命周期编排

Runner 是 OpenMMLab 训练流程的中枢，把模型、数据、优化器、Hook、可视化、分布式全部编排起来。

### 内部循环结构

```
Runner.train()
└── for epoch in range(max_epochs):              # EpochBasedTrainLoop
      ├── hook.before_train_epoch()
      └── for data_batch in dataloader:
            ├── hook.before_train_iter()
            ├── model.train_step(data_batch) → optim_wrapper.update_params(loss)
            ├── hook.after_train_iter()       # ← 记录 loss、调参、存 checkpoint
      └── hook.after_train_epoch()            # ← 评估、调 LR
```

支持两种循环：`EpochBasedTrainLoop`（按 epoch，默认）与 `IterBasedTrainLoop`（按 iteration，常用于大模型/扩散）。Hook 在每个节点都能插入自定义逻辑。

### OptimWrapper：封装优化器

```python
optim_wrapper = dict(
    type='OptimWrapper',
    optimizer=dict(type='SGD', lr=0.02, momentum=0.9, weight_decay=0.0001),
    # 自动混合精度（AMP）：训练 float16、主权重 float32
    accumulative_counts=2,   # 梯度累积 2 步再 step，等效翻倍 batch
)
```

- `accumulative_counts`：梯度累积，小显存跑大 batch
- 配合 `OptimWrapper` 的 `scale` 机制支持 AMP，无需手写 GradScaler

### ParamScheduler：学习率调度

OpenMMLab 2.0 用 `ParamScheduler` 替代旧版 `step LR`，更灵活：

```python
param_scheduler = [
    dict(type='LinearLR', start_factor=0.001, by_epoch=False, begin=0, end=500),  # warmup 500 iter
    dict(type='MultiStepLR', by_epoch=True, milestones=[8, 11], gamma=0.1),        # 之后阶梯衰减
]
```

支持的类型：`CosineAnnealingLR` / `LinearLR` / `StepLR` / `MultiStepLR` / `CosineRestarts` / `ExponentialLR` 等，可组合成多段调度。

## Visualizer：一致的可视化抽象

`Visualizer` 把「画图 + 落盘/上报」解耦。画图 API（`draw_bboxes` / `draw_masks` / `draw_keypoints` / `draw_texts` / `draw_lines`）只负责往当前图像上叠加；落盘/上报由 `vis_backends` 决定。

```python
from mmengine.visualization import Visualizer
import torch

visualizer = Visualizer(
    vis_backends=[dict(type='LocalVisBackend'),
                  dict(type='TensorboardVisBackend'),
                  dict(type='WandbVisBackend')],
    save_dir='vis_results',
)

# 画检测框（可叠加多次）
visualizer.set_image(image=image)
visualizer.draw_bboxes(torch.tensor([[33, 120, 209, 220]]), edge_colors='red')
visualizer.draw_texts('cat', torch.tensor([33, 110]))
visualizer.add_image('demo', visualizer.get_image())   # 同时写本地/TB/WandB

# 记录标量（loss / lr）
visualizer.add_scalar('loss', loss_value, step=iter)
```

各任务算法库继承 `Visualizer` 实现专用绘图（如 `DetLocalVisualizer.add_datasample` 直接吃 DetDataSample 画出完整检测结果），避免用户手写坐标转换。

## 分布式训练

```bash
# 多卡 DDP
./tools/dist_train.sh configs/xxx.py 8

# slurm 集群
GPUS=8 GPUS_PER_NODE=8 ./tools/slurm_train.sh partition jobname configs/xxx.py
```

Runner 内部已封装 `init_dist` + `DistributedDataParallel`，config 里只需保证 `batch_size` 是单卡的（总 batch = batch_size × GPU 数）。注意学习率要按总 batch 调整（线性缩放规则）。

## 常见陷阱与最佳实践

- **import 报 undefined symbol**：MMCV 与 PyTorch/CUDA 版本不匹配——回 [mmcv 安装文档](https://mmcv.readthedocs.io/en/latest/get_started/installation.html) 查兼容矩阵，用 `mim install` 或指定 `-f` 索引
- **KeyError: 'Xxx is not in the xxx registry'**：忘了调 `register_all_modules()`，或自定义模块没在 `custom_imports` 里声明
- **config 继承后字段没生效**：列表字段（如 `param_scheduler`）是**整体替换**不是合并，要在子 config 完整重写
- **同名注册冲突**：默认禁止重复注册同名模块，确实要覆盖用 `@REGISTRY.register_module(force=True)`
- **跨库模块找不到**：父库用 `type='parent_scope.Xxx'`，兄弟库用 `type='sibling_scope.Xxx'` 或 config 内 `_scope_='sibling_scope'`
- **`--cfg-options` 改不动嵌套字段**：用点号分隔路径，如 `--cfg-options model.backbone.depth=101`
- **训练 loss 不降先查 LR**：`param_scheduler` 的 `by_epoch` 与 `by_iter` 混用容易配错，建议先 `visualizer.add_scalar` 画出 lr 曲线确认
- **Visualizer 不出图**：确认 `vis_backends` 配置正确，`save_dir` 有写权限；多后端要 backend 各自的库装好（tensorboard / wandb）
