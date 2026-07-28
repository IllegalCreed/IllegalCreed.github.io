---
layout: doc
---

# OpenMMLab

OpenMMLab 是由商汤科技（SenseTime）联合多所高校于 2018 年发起、现由 OpenMMLab 开源社区维护的**计算机视觉算法体系**。其第二代架构 **OpenMMLab 2.0**（2022 年正式发布）以 **MMEngine**（统一训练引擎）为底座，把「训练流程 / 配置 / 注册 / 可视化 / 通信」抽到通用层，再在其上构建三十多个**任务专用算法库**——MMDetection（目标检测、实例分割、全景分割，含自研 RTMDet）、MMDetection3D（激光雷达/多模态 3D 检测）、MMPose（2D/3D 人体姿态、人脸、手部、动物关键点）、MMSegmentation（语义分割，DeepLab/PSPNet/Mask2Former）、**MMPreTrain**（由 MMClassification 与 MMSelfSup 合并而来，覆盖图像分类、自监督学习 MAE/BEiT、乃至图像描述/VQA 等多模态推理）、MMRotate（旋转目标检测）、MMOCR（文字检测识别）、MMTracking（视频感知）、MMagic（生成式）等。三个贯穿全栈的核心机制是：**Registry（注册器）**用「字符串 → 类」映射让模块跨库复用、支持 `scope` 层级命名与父注册表查找；**Config（配置系统）**采用纯 Python 语法（非 YAML），支持 `_base_` 继承与运行时 `dict` 修改；**Runner** 编排训练/测试/推理生命周期，挂载 OptimWrapper（含混合精度与梯度累积）、Hook 体系、ParamScheduler、Visualizer（本地/TensorBoard/WandB）。整套体系覆盖 Linux/Windows/macOS，与 Ultralytics「单库聚焦 YOLO 端到端」的定位互补——OpenMMLab 强在多任务广度与可组合性，Ultralytics 强在「装完即用」的极简 API。信源 openmmlab.com 官网 + mmengine.readthedocs.io 官方文档。

## 评价

**优点**

- **任务覆盖最全**：检测、分割、姿态、分类、旋转框、OCR、3D、跟踪、生成式一应俱全，单一体系内即可打通多任务数据流，跨任务复用 backbone/dataset
- **OpenMMLab 2.0 架构解耦彻底**：MMEngine 把训练引擎下沉，各算法库只关注任务逻辑，新算法库可快速孵化（继承 root registry 即享全套训练能力）
- **Registry 机制是真正的解耦利器**：`type='ResNet'` 字符串驱动实例化，配合 `_scope_` 实现跨库模块无缝调用，配置即架构
- **Config 纯 Python 语法表达力强**：`_base_` 继承 + 运行时覆盖，比 YAML 更适合复杂模型组装，且支持 lazy import 避免无用依赖
- **训练引擎工业级**：Runner 统一编排，Hook 体系覆盖训练全生命周期，OptimWrapper 原生支持混合精度（AMP）与梯度累积，分布式开箱即用
- **Visualizer 一致体验**：本地文件 / TensorBoard / WandB 多后端可同时挂载，检测框/分割掩码/关键点都有现成绘图 API

**缺点**

- **学习曲线陡峭**：Registry + Config + Runner + 各库约定，新人上手成本明显高于 Ultralytics 的「一行 train」
- **配置文件冗长**：复杂模型的 config 动辄数百行，`_base_` 多层继承后实际生效的配置需要 `--cfg-options` 或打印才能确认，调试心智负担重
- **版本与依赖矩阵复杂**：MMEngine / MMCV / 各算法库版本须严格对齐（如 MMDetection 3.x 要求 MMEngine ≥ 0.7），错配即 import 报错
- **文档分散**：每个算法库独立文档站，跨库组合用法（如把 MMPreTrain 的 backbone 接到 MMDetection）常需查源码
- **生态重心偏向研究**：推理部署、模型压缩等「生产化」环节相对弱于训练，端到端产品链路需配合 MMDeploy 额外接入

## 文档地址

- [OpenMMLab 官网（生态总览）](https://openmmlab.com/)
- [MMEngine 官方文档（训练引擎核心）](https://mmengine.readthedocs.io/en/latest/)
- [MMDetection 文档](https://mmdetection.readthedocs.io/en/latest/)
- [MMPose 文档](https://mmpose.readthedocs.io/en/latest/)
- [MMSegmentation 文档](https://mmsegmentation.readthedocs.io/en/latest/)
- [MMPreTrain 文档](https://mmpretrain.readthedocs.io/en/latest/)

## GitHub地址

- [open-mmlab 组织（全部算法库）](https://github.com/open-mmlab)
- [open-mmlab/mmdetection](https://github.com/open-mmlab/mmdetection)
- [open-mmlab/mmpose](https://github.com/open-mmlab/mmpose)
- [open-mmlab/mmsegmentation](https://github.com/open-mmlab/mmsegmentation)
- [open-mmlab/mmpretrain](https://github.com/open-mmlab/mmpretrain)
- [open-mmlab/mmengine](https://github.com/open-mmlab/mmengine)

## 幻灯片地址

<a href="/SlideStack/openmmlab-slide/" target="_blank">OpenMMLab</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">OpenMMLab 测试题</a>
