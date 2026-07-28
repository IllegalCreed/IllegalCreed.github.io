---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MMEngine 0.10.x + MMDetection 3.3.x + MMPose 1.3.x + MMSegmentation 1.2.x + MMPreTrain 1.2.x 官方文档与 GitHub README 整理

## 速查

- **核心三件套**：`mmengine`（训练引擎）/ `mmcv`（CV 算子）/ 各任务算法库（`mmdet` / `mmpose` / `mmseg` / `mmpretrain`）
- **Registry 入口**：`from mmengine.registry import Registry`；root 注册器：`MODELS / DATASETS / OPTIMIZERS / HOOKS / TRANSFORMS / METRICS / VISUALIZERS`
- **Config**：`from mmengine.config import Config` → `Config.fromfile('xxx.py')` → 点号取值、命令行 `--cfg-options`
- **Runner**：`from mmengine.runner import Runner` → `runner.train()` / `runner.val()` / `runner.test()`
- **推理 API**：`mmdet.apis.init_detector` + `inference_detector`；`mmpose.apis.init_model` + `inference_topdown`
- **注册全部模块**：`from {lib}.utils import register_all_modules` → `register_all_modules()`
- **安装命令**：`mim install mmengine mmcv mmdet`
- **预编译 MMCV**：`pip install mmcv -f https://download.openmmlab.com/mmcv/dist/{cu_version}/{torch_version}/index.html`
- **版本兼容**：MMEngine 0.10.x / MMCV 2.1.x / MMDetection 3.3.x（2026-07 当前线）
- **Python**：≥ 3.7（推荐 3.8–3.10）
- **训练入口**：`tools/train.py config.py`（单卡）/ `tools/dist_train.sh config.py N`（N 卡）

## OpenMMLab 2.0 体系总表

### 训练引擎层（MMEngine）

| 模块 | 关键类/函数 | 作用 |
| --- | --- | --- |
| Registry | `Registry(name, scope=, parent=)` / `register_module()` / `build(cfg)` | 字符串→类的映射，跨库模块复用基础 |
| Config | `Config.fromfile()` / `Config.dump()` / `_base_` / `_delete_` / `custom_imports` | 纯 Python 配置 + 继承 |
| Runner | `Runner(model, work_dir, train_dataloader, optim_wrapper, param_scheduler, train_cfg, ...)` | 训练/测试/推理生命周期编排 |
| OptimWrapper | `OptimWrapper(optimizer, accumulative_counts=)` / `AmpOptimWrapper` | 优化器封装 + AMP + 梯度累积 |
| ParamScheduler | `LinearLR` / `CosineAnnealingLR` / `MultiStepLR` / `CosineRestarts` / `StepLR` | 学习率调度（多段组合） |
| Hook | `CheckpointHook` / `LoggerHook` / `DistSamplerSeedHook` / `SyncBuffersHook` / 自定义 `before_/after_` 钩子 | 训练流程插桩 |
| Visualizer | `Visualizer(vis_backends=, save_dir=)` / `draw_bboxes` / `draw_texts` / `add_image` / `add_scalar` | 可视化（多后端） |
| File I/O | `mmengine.fileio`（`load` / `dump` / `get_file_backend`） | 统一文件后端（本地/S3/HTTP） |
| 通信 | `mmengine.dist`（`init_dist` / `get_dist_info` / `all_reduce`） | 分布式通信原语 |

### CV 基础算子层（MMCV）

| 模块 | 关键内容 |
| --- | --- |
| 图像读写 | `mmcv.imread` / `mmcv.imwrite` / `mmcv.imfrombytes` |
| transforms（旧） | `mmcv.image.Resize` / `Flip` / `ColorJitter`（新版推荐用 `mmcv.transforms`） |
| CV transforms（新） | `mmcv.transforms.LoadImageFromFile` / `Resize` / `RandomFlip` / `PackDetInputs` |
| CUDA 箱子 | `mmcv.ops`：`DeformConv2d` / `RoIAlign` / `nms` / `MultiScaleDeformableAttention` / `Carafe` / `ModulatedDeformConv2d` |
| Video | `mmcv.VideoReader` / `mmcv.frames2video` |

### 算法库层

| 算法库 | pip 名 | 当前版本 | 任务 |
| --- | --- | --- | --- |
| MMDetection | `mmdet` | 3.3.0（2024-05） | 目标检测、实例/全景分割 |
| MMDetection3D | `mmdet3d` | 1.4.x | 3D 检测（点云/多模态） |
| MMPose | `mmpose` | 1.3.0（2024-01） | 2D/3D 姿态、人脸/手/动物 |
| MMSegmentation | `mmseg` | 1.2.0（2023-10） | 语义分割 |
| MMPreTrain | `mmpretrain` | 1.2.0（2024-01） | 分类、自监督、多模态推理 |
| MMRotate | `mmrotate` | 1.0.x | 旋转目标检测 |
| MMOCR | `mmocr` | 1.0.x | 文字检测识别 |
| MMTracking | `mmtrack` | 1.0.x | 视频跟踪（MOT/VIS） |
| MMagic | `mmagic` | 1.0.x | 生成式（GAN/扩散） |
| MMDeploy | `mmdeploy` | 1.x | 部署（转 ONNX/TensorRT） |

## Registry API 速查

```python
from mmengine.registry import Registry

# 创建
REG = Registry('myreg', scope='myproj')                 # 独立注册器
REG = Registry('myreg', scope='myproj', parent=ROOT)    # 挂到父注册器

# 注册
@REG.register_module()                                  # 默认 name=类名
@REG.register_module(name='custom_name')                # 自定义名
@REG.register_module(force=True)                        # 覆盖同名
REG.register_module(module=MyClass)                     # 函数式注册

# 查询
REG.get('ResNet')                  # 取已注册的类（无则抛 KeyError）
name in REG                        # in 判断
REG.module_dict                    # dict[name, module]

# 实例化
obj = REG.build(dict(type='ResNet', depth=50))          # 标准
obj = REG.build(dict(type='mmengine.ResNet'))           # 显式父库
obj = REG.build(dict(type='Xxx', _scope_='mmpretrain')) # 临时切 scope
```

### OpenMMLab 内置 root registry

```python
from mmengine.registry import (
    MODELS, DATASETS, OPTIMIZERS, OPTIM_WRAPPERS,
    PARAM_SCHEDULERS, HOOKS, TRANSFORMS, METRICS,
    VISUALIZERS, VISBACKENDS, DATA_SAMPLERS, DATASETS,
    TASK_UTILS, FUNCTIONS, PARAM_SCHEDULERS, LOOPS, EVALUATOR,
)
```

下游算法库（mmdet / mmpose / ...）各自 `Registry('xxx', parent=MODELS)` 挂到这些 root 上。

## Config 速查

```python
from mmengine.config import Config

# 加载
cfg = Config.fromfile('configs/xxx.py')
cfg = Config.fromfile('configs/xxx.yaml')    # 也支持 yaml/json，但官方推荐 .py

# 取值（点号取嵌套字段）
cfg.model.backbone.depth          # int
cfg.train_dataloader.batch_size   # int
cfg['model']['backbone']['depth'] # dict 风格也行

# 修改
cfg.model.backbone.depth = 101
cfg.merge_from_dict({'model': {'backbone': {'depth': 101}}})

# 导出
cfg.dump('out.py')                # 写回文件
cfg.dump()                        # 返回合并后的完整 dict 字符串（调试用）

# 命令行 --cfg-options 等价于 merge_from_dict
```

### Config 文件约定字段

| 字段 | 含义 |
| --- | --- |
| `model` | 模型定义（backbone / neck / head / loss） |
| `train_dataloader` / `val_dataloader` / `test_dataloader` | 数据加载器（含 dataset、batch_size、num_workers） |
| `optim_wrapper` | 优化器封装（含 `accumulative_counts`） |
| `param_scheduler` | 学习率调度列表 |
| `train_cfg` / `val_cfg` / `test_cfg` | 训练/验证/测试循环配置（`EpochBasedTrainLoop` / `IterBasedTrainLoop`） |
| `default_scope` | 默认查找 scope（如 `'mmdet'`） |
| `custom_imports` | 额外 import 的模块（自定义代码） |
| `default_hooks` | 默认 Hook 配置（CheckpointHook / LoggerHook ...） |
| `vis_backends` / `visualizer` | 可视化后端与 Visualizer 配置 |
| `load_from` / `resume` | 加载 checkpoint / 断点续训 |

## 推理 API 速查

### MMDetection

```python
from mmdet.apis import init_detector, inference_detector
from mmdet.utils import register_all_modules

register_all_modules()
model = init_detector('configs/faster-rcnn_r50_fpn_1x_coco.py',
                      'checkpoints/faster_rcnn_r50_fpn_1x_coco_20200130-047c8118.pth',
                      device='cuda:0')
result = inference_detector(model, 'demo.jpg')   # DetDataSample
result.pred_instances.bboxes   # [N, 4]
result.pred_instances.scores   # [N]
result.pred_instances.labels   # [N]
```

### MMPose

```python
from mmpose.apis import init_model, inference_topdown
from mmpose.utils import register_all_modules

register_all_modules()
model = init_model('configs/.../rtmpose-m_8xb256-420e_coco-256x192.py',
                   'checkpoints/rtmpose-m.pth', device='cuda:0')
result = inference_topdown(model, 'demo.jpg', bboxes=np.array([[50, 100, 250, 380]]))
# result 是 PoseDataSample，含 pred_instances.keypoints [N, K, 2] 与 keypoint_scores
```

### MMSegmentation

```python
from mmseg.apis import init_model, inference_model
from mmseg.utils import register_all_modules

register_all_modules()
model = init_model('configs/deeplabv3/deeplabv3_r50-d8_4xb2-80k_cityscapes-512x1024.py',
                   'checkpoints/deeplabv3_r50-d8.pth', device='cuda:0')
result = inference_model(model, 'demo.jpg')   # SegDataSample，pred_sem_seg.data 是分割图
```

## 版本兼容矩阵

OpenMMLab 各包版本强耦合，下表为典型组合（以 2026-07 主流线为准，具体以各库 README为准）：

| 算法库 | 算法库版本 | MMEngine | MMCV | Python |
| --- | --- | --- | --- | --- |
| MMDetection | 3.3.0 | ≥ 0.8.0 | ≥ 2.0.0 | ≥ 3.7 |
| MMPose | 1.3.0 | ≥ 0.8.0 | ≥ 2.0.0 | ≥ 3.7 |
| MMSegmentation | 1.2.0 | ≥ 0.8.0 | ≥ 2.0.0 | ≥ 3.7 |
| MMPreTrain | 1.2.0 | ≥ 0.8.0 | ≥ 2.0.0 | ≥ 3.7 |
| MMRotate | 1.0.x | ≥ 0.3.0 | ≥ 2.0.0 | ≥ 3.7 |

### MMCV ↔ PyTorch/CUDA 兼容

| MMCV | PyTorch | CUDA |
| --- | --- | --- |
| 2.1.0 | 2.1.0 | 11.8 / 12.1 |
| 2.0.1 | 2.0.1 | 11.7 / 11.8 |
| 1.7.x | 1.10–1.13 | 11.3–11.7 |

> 兼容查询：`python -c "import torch; print(torch.__version__, torch.version.cuda)"` 后对照 [mmcv 安装页](https://mmcv.readthedocs.io/en/latest/get_started/installation.html) 选 wheel。

## 与同类框架对比

| 维度 | OpenMMLab | Ultralytics | Detectron2 | MMYOLO（OpenMMLab 子集） |
| --- | --- | --- | --- | --- |
| 任务广度 | 检测/分割/姿态/OCR/3D/跟踪/生成 | YOLO 系（检测/分割/姿态/分类） | 检测/分割 | YOLO 检测/姿态 |
| 上手曲线 | 陡（Registry/Config） | 极平 | 中（FAIR 风格） | 中（OpenMMLab 风格） |
| 配置 | 纯 Python | YAML | YAML | 纯 Python |
| 多任务复用 | 强（跨库共享 backbone） | 弱 | 弱（仅检测/分割） | 中 |
| 维护方 | OpenMMLab 社区（商汤发起） | Ultralytics 公司 | Meta AI | OpenMMLab 社区 |

## 官方资源

- [OpenMMLab 官网](https://openmmlab.com/)
- [MMEngine 文档](https://mmengine.readthedocs.io/en/latest/)
- [MMCV 文档](https://mmcv.readthedocs.io/en/latest/)
- [MMDetection 文档](https://mmdetection.readthedocs.io/en/latest/)
- [MMPose 文档](https://mmpose.readthedocs.io/en/latest/)
- [MMSegmentation 文档](https://mmsegmentation.readthedocs.io/en/latest/)
- [MMPreTrain 文档](https://mmpretrain.readthedocs.io/en/latest/)
- [OpenMMLab GitHub 组织](https://github.com/open-mmlab)
- [预编译包索引（MMCV wheels）](https://download.openmmlab.com/mmcv/dist/index.html)
