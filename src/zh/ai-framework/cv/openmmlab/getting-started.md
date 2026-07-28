---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenMMLab 2.0 官方文档（openmmlab.com 生态总览 + mmengine.readthedocs.io Getting Started）编写，对照 MMDetection 3.x / MMEngine 0.x 当前行为

## 速查

- **体系定位**：OpenMMLab 2.0 = MMEngine（训练引擎底座）+ MMCV（CV 基础算子）+ 30+ 任务算法库（MMDetection/MMPose/MMSegmentation/MMPreTrain/...）
- **安装算法库**：`pip install mmengine mmcv mmdet`——各库独立发版，版本须对齐（mmdet 3.x 配 mmengine ≥ 0.7）
- **-f 指定索引**：`pip install mmcv -f https://download.openmmlab.com/mmcv/dist/{cu118}/{torch2.1}/index.html` 选匹配 CUDA/Torch 的预编译包
- **三大核心机制**：Registry（注册器，字符串→类）、Config（纯 Python 配置）、Runner（训练编排）
- **最小训练三件套**：config 文件（`*.py`）+ 数据集 + `tools/train.py config.py`
- **配置即架构**：模型/数据/优化器全部写进 config 的 `dict`，`type='XXX'` 触发 Registry 实例化
- **配置继承**：`_base_ = ['./base.py']`，再在子 config 覆盖个别字段
- **命令行改配置**：`python tools/train.py config.py --cfg-options optimizer.lr=0.01`
- **推理**：`from mmdet.apis import init_detector, inference_detector`；`model = init_detector(config, checkpoint, device)`
- **可视化**：`from mmdet.utils import register_all_modules` 后 `DetLocalVisualizer` 即可画框
- **预训练库**：OpenMMLab 提供模型库（model zoo），checkpoint 在 GitHub Releases 或 openmmlab 云存储

## OpenMMLab 2.0 架构总览

OpenMMLab 2.0 把整个体系分三层：

| 层级 | 代表 | 职责 |
| --- | --- | --- |
| 训练引擎底座 | **MMEngine** | Runner、Registry、Config、OptimWrapper、Hook、Visualizer、分布式通信 |
| CV 基础算子 | **MMCV** | 图像读写、CV transforms、CUDA 算子（DCN/RoIAlign/Carafe）、Config 早期实现 |
| 任务算法库 | MMDetection / MMPose / MMSegmentation / MMPreTrain / MMRotate / MMOCR / MMTracking / MMDetection3D / MMagic ... | 具体任务的 model/dataset/metric/loss 实现 |

关键设计：**算法库只写任务逻辑，训练流程由 MMEngine 的 Runner 统一编排**。这意味着一旦学会在 MMDetection 里训练，迁移到 MMPose/MMSegmentation 的训练命令几乎一致——`tools/train.py config.py` 跨库通用。

## 算法库一览（按任务）

| 算法库 | 任务 | 典型模型/数据集 |
| --- | --- | --- |
| **MMDetection** | 目标检测、实例/全景分割 | Faster R-CNN、Mask R-CNN、DETR、**RTMDet**（自研实时检测）；COCO/VOC |
| **MMDetection3D** | 点云/多模态 3D 检测 | PointPillars、CenterPoint、BEVFormer；nuScenes/KITTI/Waymo |
| **MMPose** | 2D/3D 姿态、人脸/手部/动物 | top-down/bottom-up、RTMPose、RTMW3D；COCO/MPII/AI Challenger |
| **MMSegmentation** | 语义分割 | DeepLabV3+、FCN、PSPNet、UPerNet、Mask2Former；ADE20K/Cityscapes/COCO-Stuff |
| **MMPreTrain** | 分类、自监督、多模态推理 | ResNet、ViT、Swin、ConvNeXt、MAE、BEiT、LLaVA；ImageNet |
| **MMRotate** | 旋转目标检测 | RotatedRetinaNet、RoI Transformer；DOTA/HRSC2016 |
| **MMOCR** | 文字检测识别 | DBNet、CRNN、SAR；ICDAR |
| **MMTracking** | 视频感知（跟踪/MOT/VIS） | ByteTrack、Mask2Former-VIS；MOT17/LVIS |
| **MMagic** | 生成式（GAN/扩散） | Stable Diffusion、StyleGAN、ControlNet |

> **MMPreTrain 是合并产物**：原 MMClassification（图像分类）+ MMSelfSup（自监督 MAE/BEiT）于 2023 年合并为 MMPreTrain，并扩展到图像描述、VQA、视觉定位等多模态推理任务。提到「MMClassification」时，新代码应迁移到 MMPreTrain。

## 安装：版本对齐是第一要务

OpenMMLab 各包**独立发版且强耦合**，CUDA / PyTorch / MMCV / MMEngine / 算法库必须版本一致，否则 `import` 即报 undefined symbol 或版本不符错误。

```bash
# ① 先确认已装好匹配 CUDA 的 PyTorch（以 torch 2.1.0 + cu118 为例）
python -c "import torch; print(torch.__version__, torch.version.cuda)"

# ② 装 MMEngine 与 MMCV（MMCV 选预编译包，别用源码编译）
pip install -U openmim
mim install mmengine
mim install "mmcv>=2.0.0"

# ③ 装任务算法库（按需）
mim install "mmdet>=3.0.0"      # 或 mmpose / mmsegmentation / mmpretrain
```

`mim`（OpenMMLab 的包管理器）会自动选对 MMCV 的预编译 wheel，省去手动拼 `-f` URL。手动方式：

```bash
pip install mmcv -f https://download.openmmlab.com/mmcv/dist/cu118/torch2.1/index.html
```

> **铁律**：装错 MMCV 版本是新手第一坑。务必先查 [openmmlab/mmcv 兼容矩阵](https://mmcv.readthedocs.io/en/latest/get_started/installation.html)，按 `{cuda}/{torch}` 选 wheel。

## 第一个例子：用 MMDetection 推理

安装完成后，最小可用流程是「加载 config + checkpoint → 推理单张图」：

```python
from mmdet.apis import init_detector, inference_detector
from mmdet.utils import register_all_modules

# ① 注册 MMDetection 的全部模块到 Registry（让 config 里的 type 能被找到）
register_all_modules()

# ② 初始化模型（config 文件 + checkpoint 路径）
config_file = 'configs/faster-rcnn_r50_fpn_1x_coco.py'
checkpoint_file = 'checkpoints/faster_rcnn_r50_fpn_1x_coco_20200130-047c8118.pth'
model = init_detector(config_file, checkpoint_file, device='cuda:0')

# ③ 推理
result = inference_detector(model, 'demo.jpg')
# result 是 DetDataSample，含 pred_instances.bboxes / scores / labels

# ④ 可视化
from mmdet.visualization import DetLocalVisualizer
visualizer = DetLocalVisualizer()
visualizer.add_datasample('result', image='demo.jpg', data_sample=result, draw_gt=False, pred_score_thr=0.5)
visualizer.show()
```

注册这一步（`register_all_modules`）不可省略——Registry 是按需加载的，不主动 import 算法库的 model 模块，config 里的 `type='FasterRCNN'` 就找不到对应类。

## 训练：tools/train.py 一行启动

```bash
# 单卡
python tools/train.py configs/faster-rcnn_r50_fpn_1x_coco.py

# 多卡（分布式数据并行）
./tools/dist_train.sh configs/faster-rcnn_r50_fpn_1x_coco.py 8

# 命令行临时改配置（不必改文件）
python tools/train.py config.py --cfg-options optimizer.lr=0.002 epochs=24
```

训练日志、checkpoint、config 快照默认落在 `work_dirs/{config_name}/`。`--work-dir` 可改输出目录。

## 与 Ultralytics 的定位差异

| 维度 | OpenMMLab | Ultralytics |
| --- | --- | --- |
| 任务广度 | 检测/分割/姿态/OCR/3D/跟踪/生成式 全覆盖 | 聚焦 YOLO（检测/分割/姿态/分类） |
| 上手曲线 | 陡（要懂 Registry/Config/Runner） | 平（`yolo train` 一行） |
| 可组合性 | 强（跨库复用 backbone/dataset） | 弱（单库封闭） |
| 配置形态 | 纯 Python config + 继承 | YAML（arg 富） |
| 适用场景 | 研究、多任务、复现论文、需精细控制 | 工程、快速 PoC、端到端产品 |

两者并非二选一：研究阶段用 OpenMMLab 复现与对比算法，工程落地若 YOLO 够用则 Ultralytics 更省事。

## 下一步

- 入门后请读 **指南**：深入 Registry / Config / Runner 三大机制
- 推理跑通后看 **参考**：API 速查表、版本兼容矩阵、常用 config 字段
- 想自训自定义数据集，参考各算法库的「Train with custom dataset」文档（如 MMDetection 的 2_label_train.md）
