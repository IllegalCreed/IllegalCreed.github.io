---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Albumentations 官方文档（albumentations.ai docs Transforms and Targets + API Reference）+ GitHub 整理

## 速查

- **核心类**：`A.Compose` / `A.OneOf` / `A.SomeOf` / `A.OneOrOther` / `A.BboxParams` / `A.KeypointParams`
- **变换调用**：`transform(image=, mask=, bboxes=, keypoints=, **labels)` → dict
- **bbox 格式**：`pascal_voc` / `coco` / `yolo` / `albumentations`
- **keypoint 格式**：`xy` / `yx` / `xya` / `xys` / `xyas` / `xysa`
- **安装**：`pip install albumentationsx`（主线）/ `pip install albumentations`（归档）
- **import 名**：`import albumentations as A`（两个包都是这个名）
- **当前版本**：AlbumentationsX 主线 / Albumentations 2.0.x（2024 年发布，2026 维护）
- **底层**：OpenCV + NumPy
- **变换数量**：50+ 种 2D 变换
- **适用任务**：分类 / 分割（语义+实例）/ 检测 / 关键点（姿态）

## 容器与参数类 API

### Compose

```python
A.Compose(
    transforms,                    # 变换列表
    bbox_params=None,              # A.BboxParams 或 dict
    keypoint_params=None,          # A.KeypointParams 或 dict
    additional_targets=None,       # 额外目标（如 {'image2': 'image'}）
    p=1.0,                         # 整体触发概率
    is_check_shapes=True,          # 校验 image 与 mask 形状一致
)
```

### BboxParams

```python
A.BboxParams(
    format='pascal_voc',   # pascal_voc / coco / yolo / albumentations
    label_fields=None,     # 标签字段名列表，如 ['class_labels']
    min_area=0.0,          # 过滤面积过小的框
    min_visibility=0.0,    # 过滤可见比过低的框
)
```

### KeypointParams

```python
A.KeypointParams(
    format='xy',           # xy / yx / xya / xys / xyas / xysa
    label_fields=None,
    remove_invisible=True, # 丢弃越界点
    angle_in_degrees=True, # angle 单位
)
```

### OneOf / SomeOf / OneOrOther

```python
A.OneOf(transforms, p=0.5)            # 随机选一种
A.SomeOf(n, transforms, p=0.5)        # 随机选 n 种
A.OneOrOther(first, second, p=0.5)    # 二选一
```

## 坐标格式对照

### bbox 格式

| format | 坐标含义 | 单位 | 示例（100×100 图） |
| --- | --- | --- | --- |
| `pascal_voc` | `[x_min, y_min, x_max, y_max]` | 绝对像素 | `[10, 20, 80, 90]` |
| `coco` | `[x_min, y_min, width, height]` | 绝对像素 | `[10, 20, 70, 70]` |
| `yolo` | `[x_center, y_center, width, height]` | 归一化 [0,1] | `[0.45, 0.55, 0.70, 0.70]` |
| `albumentations` | `[x_min, y_min, x_max, y_max]` | 归一化 [0,1] | `[0.1, 0.2, 0.8, 0.9]` |

### keypoint 格式

| format | 含义 |
| --- | --- |
| `xy` | `[x, y]` |
| `yx` | `[y, x]` |
| `xya` | `[x, y, angle]` |
| `xys` | `[x, y, scale]` |
| `xyas` | `[x, y, angle, scale]` |
| `xysa` | `[x, y, scale, angle]` |

## 变换速查表

### 几何（空间）变换

| 变换 | 作用 |
| --- | --- |
| `HorizontalFlip` | 水平翻转 |
| `VerticalFlip` | 垂直翻转 |
| `RandomRotate90` | 随机 90 度倍数旋转 |
| `Rotate` | 任意角度旋转（limit 控制范围） |
| `ShiftScaleRotate` | 平移+缩放+旋转组合 |
| `Transpose` | 转置（沿主对角线翻转） |
| `RandomResizedCrop` | 随机裁剪并缩放到目标尺寸 |
| `RandomCrop` / `RandomSizedCrop` | 随机裁剪 |
| `CenterCrop` | 中心裁剪 |
| `Crop` | 指定区域裁剪 |
| `PadIfNeeded` | 必要时填充到目标尺寸 |
| `ElasticTransform` | 弹性形变 |
| `OpticalDistortion` / `GridDistortion` | 光学/网格畸变 |
| `Flip` | 随机水平或垂直翻转 |

### 颜色与像素变换

| 变换 | 作用 |
| --- | --- |
| `RandomBrightnessContrast` | 随机亮度对比度 |
| `RandomGamma` | 随机 Gamma 校正 |
| `HueSaturationValue` | 色调/饱和度/明度 |
| `RGBShift` | RGB 通道偏移 |
| `ChannelShuffle` | 通道随机重排 |
| `ColorJitter` | 颜色抖动（亮度/对比度/饱和度/色调） |
| `ToGray` / `ToSepia` | 灰度 / 棕褐色 |
| `CLAHE` | 自适应直方图均衡 |
| `Posterize` / `Solarize` | 色彩量化 / 反相 |
| `FancyPCA` | PCA 颜色增强（AlexNet 风格） |

### 模糊与噪声

| 变换 | 作用 |
| --- | --- |
| `Blur` | 通用模糊 |
| `GaussianBlur` | 高斯模糊 |
| `MotionBlur` | 运动模糊 |
| `MedianBlur` | 中值模糊 |
| `GaussianNoise` / `ISONoise` | 高斯 / ISO 噪声 |
| `ImageCompression` | JPEG 压缩失真 |

### 丢弃与遮挡

| 变换 | 作用 |
| --- | --- |
| `CoarseDropout` | 粗粒度随机遮挡（矩形块） |
| `Cutout` | 随机方形遮挡（旧版，被 CoarseDropout 取代） |
| `GridDropout` | 网格状丢弃 |
| `ChannelDropout` | 随机丢弃颜色通道 |

### 天气与场景模拟

| 变换 | 作用 |
| --- | --- |
| `RandomRain` | 雨滴 |
| `RandomSnow` | 积雪 |
| `RandomFog` | 雾 |
| `RandomSunFlare` | 镜头眩光 |
| `RandomShadow` | 阴影 |
| `RandomGravel` | 砾石 |
| `Spatter` | 泥点溅射 |

### 数值与格式

| 变换 | 作用 |
| --- | --- |
| `Normalize` | 归一化（mean/std） |
| `ToFloat` | 转 float32（按 max_value 归一） |
| `FromFloat` | float 转回 uint8 |
| `ToTensor` | 转 PyTorch tensor（部分版本） |

## 自定义变换基类

| 基类 | 作用 |
| --- | --- |
| `A.ImageOnlyTransform` | 只影响图像，实现 `apply` |
| `A.DualTransform` | 影响多目标，需实现 `apply` + `apply_to_mask` + `apply_to_bbox` + `apply_to_keypoint` |
| `A.BasicTransform` | 最基础，所有变换的父类 |

## 版本与兼容

### 近期版本要点

| 版本线 | 状态 | 关键点 |
| --- | --- | --- |
| AlbumentationsX | 活跃主线（2026） | 持续更新，新变换与性能优化；`pip install albumentationsx` |
| Albumentations 2.0.x | 归档（仍可用） | 2024 年发布；2.0.0 重构 API（always_apply 等参数调整） |
| Albumentations 1.4.x | 旧版 | 1.x 系列最后维护线 |

### 兼容性

- **Python**：≥ 3.7（推荐 3.8–3.11）
- **依赖**：`opencv-python`（或 `opencv-python-headless`）/ `numpy` / `scipy`（部分变换）/ `scikit-image`（部分变换）
- **import 名**：`import albumentations as A`（无论装 `albumentations` 还是 `albumentationsx`）
- **2.0 迁移**：`always_apply` 参数在 2.0 后弃用，统一用 `p`；部分变换重命名

## 与同类库对比

| 维度 | Albumentations | torchvision.transforms | imgaug |
| --- | --- | --- | --- |
| 多目标同步 | image/mask/bbox/keypoint 一条管线 | 主要 image | 支持 bbox/keypoint |
| 变换种类 | 50+ | 数十个 | 丰富 |
| 性能 | OpenCV 底层快 | tensor 操作 | 快 |
| 维护 | 活跃（AlbumentationsX） | PyTorch 官方 | 停滞 |
| API | Compose 返回 dict | callable 流式 | 较老 |
| 文档 | 完善 | 完善 | 基础 |

## 官方资源

- [Albumentations 官方文档](https://albumentations.ai/docs/)
- [Getting Started](https://albumentations.ai/docs/getting_started/installation/)
- [Transforms and Targets](https://albumentations.ai/docs/getting_started/transforms_and_targets/)
- [Examples（含 bbox/keypoint/3D/视频）](https://albumentations.ai/docs/examples/)
- [Performance Tuning](https://albumentations.ai/docs/examples/performance/)
- [GitHub albumentations-team/albumentations](https://github.com/albumentations-team/albumentations)
- [Releases](https://github.com/albumentations-team/albumentations/releases)
- [在线 Demo（explore.albumentations.ai）](https://albumentations.ai/explore)
