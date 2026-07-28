---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Albumentations 官方文档（albumentations.ai docs + Getting Started + Examples）编写，对照 AlbumentationsX / 2.0.x 当前行为

## 速查

- **安装**：`pip install albumentationsx`（新主线）或 `pip install albumentations`（原包，归档仍可用）
- **核心三件套**：Transform（单个变换）/ Compose（串接管线的）/ OneOf（随机选一种）
- **概率**：每个变换带 `p` 参数（0–1），如 `A.HorizontalFlip(p=0.5)` 一半概率翻转
- **调用方式**：`result = transform(image=img)` → `result['image']` 取结果（返回字典）
- **多目标**：`transform(image=img, mask=mask, bboxes=bboxes, keypoints=kps)` 一次同步变换
- **bbox 格式**：`A.Compose([...], bbox_params=A.BboxParams(format='coco'/'pascal_voc'/'yolo'/'albumentations', label_fields=['labels']))`
- **keypoint 格式**：`A.Compose([...], keypoint_params=A.KeypointParams(format='xy'/'xya'/'xys'/'xyas', label_fields=['labels']))`
- **常用变换**：HorizontalFlip / VerticalFlip / RandomRotate90 / Rotate / ShiftScaleRotate / RandomBrightnessContrast / Blur / GaussianBlur / HueSaturationValue / CoarseDropout / Normalize / Resize / RandomResizedCrop
- **50+ 变换**：覆盖空间几何、像素颜色、模糊、形变、裁剪、丢弃（Dropout/Cutout）等
- **底层**：OpenCV + NumPy，主打比 torchvision.transforms 快
- **当前版本**：AlbumentationsX（主线）/ Albumentations 2.0.x（归档）

## 安装

```bash
# 新主线包（推荐）
pip install albumentationsx

# 或原包（归档但仍可用，行为基本一致）
pip install albumentations
```

额外依赖按需装：`opencv-python-headless`（图像处理）、`scikit-image`（部分变换）、`scipy`（ElasticTransform）。

```python
import albumentations as A   # 两个包的 import 名都是 albumentations
print(A.__version__)
```

## 第一个例子：图像增强

最小可用流程——定义管线、传入图像、取结果：

```python
import albumentations as A
import cv2

# ① 读图（Albumentations 接受 numpy 数组，HWC, BGR 或 RGB 都行，但下游模型期望要匹配）
image = cv2.imread('cat.jpg')
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)   # 若下游期望 RGB

# ② 定义管线（Compose 串接，每个变换带概率 p）
transform = A.Compose([
    A.HorizontalFlip(p=0.5),           # 50% 概率水平翻转
    A.RandomBrightnessContrast(p=0.2), # 20% 概率调亮度对比度
    A.Rotate(limit=30, p=0.5),         # 50% 概率旋转 ±30 度
])

# ③ 调用（注意返回的是字典，不是数组！）
result = transform(image=image)
augmented_image = result['image']   # 必须从字典取 'image' 键
```

> **铁律**：`transform()` 返回**字典**（`{'image': ...}`），不是直接返回数组。忘记取 `['image']` 是新手第一坑。

## 概率参数 p

每个变换（包括 Compose 与 OneOf）都接受 `p` 参数，控制该变换被触发的概率：

```python
A.HorizontalFlip(p=1.0)   # 必定翻转
A.HorizontalFlip(p=0.5)   # 一半概率翻转
A.HorizontalFlip(p=0.0)   # 永不翻转（等于禁用）
```

训练时 `p` 是数据多样性的来源——同一图像每次过管线得到不同结果。调试时可用 `p=1` 固定观察变换效果。

## Compose 与 OneOf

`Compose` 把多个变换按顺序串接；`OneOf` 从组内**随机选一种**变换执行：

```python
transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.OneOf([
        A.MotionBlur(p=1),     # 这三者在 OneOf 内
        A.MedianBlur(p=1),     # 每次只随机选一个执行
        A.GaussianBlur(p=1),
    ], p=0.3),                 # OneOf 整体 30% 概率触发
    A.RandomBrightnessContrast(p=0.3),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
])
```

- `OneOf`：组内选**一种**（适合「同类增强择一」策略，如多种模糊）
- `SomeOf(n, [...])`：组内选 **n 种**（按需组合）
- `Compose`/`OneOf`/`SomeOf` 都可设 `p` 控制整体触发概率

## 多目标同步增强：核心能力

Albumentations 最被依赖的能力是**一条管线同时变换图像 + 掩码 + 边界框 + 关键点**，几何变换自动保持一致。

### 图像 + 掩码（分割任务）

```python
image = cv2.imread('img.png')
mask = cv2.imread('mask.png', cv2.IMREAD_GRAYSCALE)   # 分割标注图

transform = A.Compose([
    A.RandomCrop(256, 256),
    A.HorizontalFlip(p=0.5),
    A.Rotate(limit=45, p=0.7),
])

result = transform(image=image, mask=mask)
aug_image, aug_mask = result['image'], result['mask']
# 翻转/旋转/裁剪在图像与掩码上完全同步
```

### 图像 + 边界框（检测任务）

声明 `BboxParams` 指定 bbox 坐标格式与标签字段：

```python
import numpy as np

image = cv2.imread('img.png')
# bboxes: 每行一个框，格式由 BboxParams(format=) 决定
bboxes = [[10, 20, 100, 150, 'cat'], [200, 50, 280, 200, 'dog']]
labels = [b[-1] for b in bboxes]   # 标签单独放一个字段
bboxes_xy = [b[:4] for b in bboxes]

transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.RandomBrightnessContrast(p=0.2),
], bbox_params=A.BboxParams(
    format='pascal_voc',           # [x_min, y_min, x_max, y_max]，绝对像素
    label_fields=['labels'],        # 标签来自哪个传入字段
))

result = transform(image=image, bboxes=bboxes_xy, labels=labels)
aug_image = result['image']
aug_bboxes = result['bboxes']   # 框坐标已随翻转同步更新
aug_labels = result['labels']
```

bbox 格式选项：

| format | 坐标含义 |
| --- | --- |
| `pascal_voc` | `[x_min, y_min, x_max, y_max]`，绝对像素 |
| `coco` | `[x_min, y_min, width, height]`，绝对像素 |
| `yolo` | `[x_center, y_center, width, height]`，归一化到 [0, 1] |
| `albumentations` | `[x_min, y_min, x_max, y_max]`，归一化到 [0, 1] |

### 图像 + 关键点（姿态任务）

```python
image = cv2.imread('person.png')
# keypoints: 每个 [x, y] 或 [x, y, angle, scale]
keypoints = [[50, 100], [120, 80], [200, 150]]
labels = ['nose', 'left_eye', 'right_shoulder']

transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.Rotate(limit=30, p=0.5),
], keypoint_params=A.KeypointParams(
    format='xy',                    # [x, y]
    label_fields=['labels'],
))

result = transform(image=image, keypoints=keypoints, labels=labels)
aug_keypoints = result['keypoints']   # 点坐标已随几何变换同步更新
```

keypoint 格式选项：

| format | 含义 |
| --- | --- |
| `xy` | `[x, y]` |
| `yx` | `[y, x]` |
| `xya` | `[x, y, angle]` |
| `xys` | `[x, y, scale]` |
| `xyas` | `[x, y, angle, scale]` |
| `xysa` | `[x, y, scale, angle]` |

### 四者同时

```python
result = transform(
    image=image,
    mask=mask,
    bboxes=bboxes_xy,
    keypoints=keypoints,
    labels=labels,
)
# 一条管线同步处理所有目标
```

## 常用变换分类

| 类别 | 变换 |
| --- | --- |
| 几何（空间） | HorizontalFlip, VerticalFlip, RandomRotate90, Rotate, ShiftScaleRotate, RandomResizedCrop, RandomCrop, CenterCrop, Crop, PadIfNeeded, Transpose, RandomSizedCrop |
| 颜色/像素 | RandomBrightnessContrast, RandomGamma, HueSaturationValue, RGBShift, ChannelShuffle, ColorJitter, ToGray, ToSepia, CLAHE, Posterize, Solarize, FancyPCA |
| 模糊/噪声 | Blur, GaussianBlur, MotionBlur, MedianBlur, GaussianNoise, ISONoise, ImageCompression |
| 形变 | OpticalDistortion, GridDistortion, ElasticTransform |
| 丢弃/遮挡 | CoarseDropout, Cutout, GridDropout, ChannelDropout, RandomRain, RandomShadow, RandomSunFlare |
| 数值 | Normalize, ToFloat, FromFloat, ToTensor（转 PyTorch tensor） |

## 集成 PyTorch Dataset

```python
from torch.utils.data import Dataset
import albumentations as A

class SegDataset(Dataset):
    def __init__(self, image_paths, mask_paths, transform=None):
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.transform = transform

    def __getitem__(self, idx):
        image = cv2.imread(self.image_paths[idx])
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        mask = cv2.imread(self.mask_paths[idx], cv2.IMREAD_GRAYSCALE)
        if self.transform:
            result = self.transform(image=image, mask=mask)
            image, mask = result['image'], result['mask']
        return image, mask
```

`A.Normalize` + `ToTensor(max_value=255)`（或外部用 `torch.from_numpy`）把数据转成模型期望的格式。

## 下一步

- 入门后请读 **指南**：Compose/OneOf/SomeOf 进阶、BboxParams/KeypointParams 细节、自定义变换、性能调优
- 推理跑通后看 **参考**：变换速查表、格式对照、版本与兼容、与 torchvision/imgaug 对比
- 想看完整训练集成，参考各框架（MMDetection/timm）的 Dataset 接入示例
