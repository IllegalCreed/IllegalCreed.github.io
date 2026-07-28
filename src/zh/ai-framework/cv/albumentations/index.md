---
layout: doc
---

# Albumentations

Albumentations 是由团队（含 Mashkov 等人）发起、Albumentations-Team 维护的开源**计算机视觉数据增强库**，当前活跃主线包名为 **AlbumentationsX**（`pip install albumentationsx`），原 `albumentations`（2.0.x）归档但仍可用。它的核心定位是「**快速、广覆盖、多目标同步增强**」——用 `A.Compose([...])` 串接变换管线，`A.OneOf([...])` 随机选一种，内置 50+ 种空间与像素变换（HorizontalFlip/VerticalFlip/Rotate/ShiftScaleRotate/RandomBrightnessContrast/Blur/GaussianBlur/MotionBlur/ColorJitter/HueSaturationValue/CoarseDropout/Cutout/GridDropout/OpticalDistortion/GridDistortion/ElasticTransform/RandomResizedCrop/Normalize 等）。最关键的能力是**同一管线同时变换图像 + 掩码 + 边界框 + 关键点**：传 `image=` + `mask=` + `bboxes=` + `keypoints=` 给 `transform()`，Albumentations 自动保持几何变换在所有目标上一致（翻转图像时掩码、框、点同步翻转），通过 `BboxParams(format='coco'/'pascal_voc'/'yolo'/'albumentations')` 与 `KeypointParams(format='xy'/'xya'/'xys'/'xyas')` 声明各目标的坐标格式。性能上以 OpenCV + NumPy 为底，官方主打「比 torchvision.transforms 快」，且提供性能调优指南（`num_threads`、`IMAGEIO_READ_MODE`、`cv2.setNumThreads`）。适用分类、分割（语义/实例）、检测、关键点（姿态）等几乎全部视觉任务的训练数据增强，与 imgaug 相比 API 更现代、对多目标支持更完善。信源 albumentations.ai 官方文档。

## 评价

**优点**

- **多目标同步增强是杀手锏**：一条管线同时处理 image/mask/bboxes/keypoints，几何变换自动保持一致，分割与检测任务不必手写坐标同步逻辑
- **变换种类全**：50+ 种空间与像素变换，覆盖翻转/旋转/缩放/颜色/模糊/形变/裁剪/丢弃（Dropout/Cutout）等几乎全部常用增强
- **性能优于 torchvision.transforms**：底层用 OpenCV + NumPy 优化，官方文档明确主打速度优势，并提供性能调优指南
- **Compose/OneOf 组合表达力强**：Compose 串接、OneOf 随机选一种、SomeOf 随机选 N 种、概率参数 p 控制触发，复杂增强策略易表达
- **坐标格式声明式**：BboxParams 与 KeypointParams 用 format 字段声明坐标约定（coco/pascal_voc/yolo/xy/xya/...），内部自动处理格式转换与越界裁剪
- **多版本活跃维护**：AlbumentationsX 作为新主线持续更新，原包归档但仍可用，迁移成本低

**缺点**

- **API 风格偏函数式**：Compose 返回字典（`{'image': ..., 'mask': ..., 'bboxes': ...}`），不如 torchvision.transforms 的 callable 流式，需手动取 `result['image']`
- **3D/视频/医学影像支持有限**：主战场是 2D RGB 图像，3D 体数据与视频虽有支持但变换种类远不如 2D 丰富
- **文档与示例偶有滞后**：部分高级用法（如 3D、视频、自定义变换）文档较薄，需查源码或 issue
- **AlbumentationsX 与 Albumentations 双包并存**：新手易混淆该装哪个，迁移说明需查 README
- **部分变换随机种子复现需额外处理**：训练管线里固定 seed 会削弱增强意义，调试与复现之间需权衡

## 文档地址

- [Albumentations 官方文档（albumentations.ai）](https://albumentations.ai/docs/)
- [Getting Started（安装与基础）](https://albumentations.ai/docs/getting_started/installation/)
- [Transforms and Targets（变换与目标对照）](https://albumentations.ai/docs/getting_started/transforms_and_targets/)
- [Examples（代码示例集）](https://albumentations.ai/docs/examples/)
- [Performance Tuning（性能调优）](https://albumentations.ai/docs/examples/performance/)

## GitHub地址

- [albumentations-team/albumentations](https://github.com/albumentations-team/albumentations)
- [Releases（版本事实来源）](https://github.com/albumentations-team/albumentations/releases)

## 幻灯片地址

<a href="/SlideStack/albumentations-slide/" target="_blank">Albumentations</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Albumentations 测试题</a>
