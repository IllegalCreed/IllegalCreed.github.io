---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Albumentations 官方文档（albumentations.ai docs Bounding Boxes / Keypoints / Pipeline / Performance 章节）+ GitHub README 编写

## 速查

- **管线构建块**：Compose（顺序串接）/ OneOf（随机选一种）/ SomeOf（随机选 N 种）/ OneOrOther（二选一带条件）/ Sequential
- **概率**：所有变换与容器都接受 `p`，控制触发概率
- **bbox 声明**：`A.BboxParams(format=, label_fields=, min_area=, min_visibility=)`
- **keypoint 声明**：`A.KeypointParams(format=, label_fields=, remove_invisible=, angle_in_degrees=)`
- **bbox 格式**：pascal_voc / coco / yolo / albumentations
- **keypoint 格式**：xy / yx / xya / xys / xyas / xysa
- **几何变换同步**：Compose 自动让 flip/rotate/crop 在 image/mask/bboxes/keypoints 上保持一致
- **越界处理**：`min_area` 与 `min_visibility` 过滤掉变换后过小或过偏的框
- **自定义变换**：继承 `A.DualTransform`（影响多目标）或 `A.ImageOnlyTransform`（仅图像）
- **复现**：Compose 传 `seed=` 与 `strict=True` 固定结果（仅用于调试可视化，训练别固定）
- **性能**：`A.Compose(..., num_threads=...)` / `cv2.setNumThreads(0)` / 选合适图像读取模式
- **图像读取**：建议 `cv2.imread` 或 `skimage.io.imread` 后转 numpy；Albumentations 接受 HWC uint8/float32

## Compose / OneOf / SomeOf 进阶

### Compose：顺序串接

```python
transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.2, rotate_limit=30, p=0.7),
    A.OneOf([
        A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20),
    ], p=0.5),
    A.CoarseDropout(max_holes=8, max_height=16, max_width=16, p=0.3),
    A.Normalize(),
])
```

Compose 内的变换按声明顺序执行，前一个的输出是后一个的输入。

### OneOf：随机选一种

```python
A.OneOf([
    A.GaussianBlur(blur_limit=(3, 7)),
    A.MotionBlur(blur_limit=7),
    A.MedianBlur(blur_limit=7),
], p=0.3)
# 30% 概率从三种模糊中均匀随机选一种执行
```

### SomeOf：随机选 N 种

```python
A.SomeOf(2, [   # 从 4 种里随机选 2 种执行
    A.GaussianBlur(),
    A.RandomBrightnessContrast(),
    A.HueSaturationValue(),
    A.ToGray(),
], p=0.5)
```

### OneOrOther：二选一带条件

```python
A.OneOrOther(
    A.HorizontalFlip(p=1),   # 第一种
    A.VerticalFlip(p=1),     # 否则第二种
    p=0.5,
)
```

## BboxParams 全字段

```python
A.Compose([...], bbox_params=A.BboxParams(
    format='pascal_voc',          # 必填：pascal_voc / coco / yolo / albumentations
    label_fields=['labels'],      # 必填：标签来自哪些传入字段（可与 bbox 分开传）
    min_area=0,                   # 过滤变换后面积 < 此值的框（像素）
    min_visibility=0.0,           # 过滤变换后可见比例 < 此值的框（裁剪后部分出界的框）
))
```

- `min_area`：变换后面积过小的框直接丢弃（避免无效小框污染训练）
- `min_visibility`：裁剪/旋转后只剩一部分的框，若剩余面积比 < 此值则丢弃

```python
transform = A.Compose([
    A.RandomCrop(256, 256),
    A.HorizontalFlip(p=0.5),
], bbox_params=A.BboxParams(
    format='coco',
    label_fields=['class_labels'],
    min_area=100,            # 丢弃面积 < 100 像素的框
    min_visibility=0.3,      # 丢弃可见比 < 30% 的框
))

result = transform(image=image, bboxes=bboxes, class_labels=labels)
```

## KeypointParams 全字段

```python
A.Compose([...], keypoint_params=A.KeypointParams(
    format='xy',                 # 必填：xy / yx / xya / xys / xyas / xysa
    label_fields=['labels'],     # 必填：标签来自哪些字段
    remove_invisible=True,       # 是否丢弃变换后越界的点
    angle_in_degrees=True,       # xya/xyas 格式的 angle 单位（度 vs 弧度）
))
```

## 自定义变换

### ImageOnlyTransform：只改图像

```python
import numpy as np

class RandomAdd(A.ImageOnlyTransform):
    def __init__(self, value=10, always_apply=False, p=0.5):
        super().__init__(always_apply, p)
        self.value = value

    def apply(self, img, **params):
        return np.clip(img.astype(np.int32) + self.value, 0, 255).astype(np.uint8)
```

### DualTransform：影响多目标（图像 + mask + bbox + keypoint）

```python
class HalfScale(A.DualTransform):
    def apply(self, img, **params):
        h, w = img.shape[:2]
        return cv2.resize(img, (w // 2, h // 2))

    def apply_to_keypoint(self, keypoint, **params):
        x, y = keypoint[:2]
        return [x / 2, y / 2] + list(keypoint[2:])   # 坐标也要同步缩放

    def apply_to_bbox(self, bbox, **params):
        return [b / 2 for b in bbox[:4]]              # 框坐标同步缩放

    def apply_to_mask(self, img, **params):
        return cv2.resize(img, (img.shape[1] // 2, img.shape[0] // 2))
```

DualTransform 要求分别实现 `apply_to_*`，保证几何变换在所有目标上一致。

## 复现与调试

```python
# 固定 seed 复现（仅用于调试可视化，训练别固定）
transform = A.Compose([
    A.HorizontalFlip(p=0.5),
    A.Rotate(limit=30, p=0.5),
], seed=42, strict=True)

result1 = transform(image=image)
result2 = transform(image=image)
# result1['image'] 与 result2['image'] 完全一致
```

> **铁律**：固定 seed 会削弱增强意义（每次得到相同结果）。训练管线里**不要固定 seed**，只在调试时用 `strict=True` 观察单次效果。

## 性能调优

Albumentations 底层用 OpenCV + NumPy，以下手段进一步提升速度：

```python
# ① Compose 启用多线程（部分变换受益）
transform = A.Compose([...], num_threads=4)

# ② 关闭 OpenCV 全局线程（避免与 DataLoader 冲突）
import cv2
cv2.setNumThreads(0)
cv2.ocl.setUseOpenCL(False)

# ③ DataLoader 用 num_workers > 0 让增强并行
loader = DataLoader(dataset, batch_size=32, num_workers=8, shuffle=True)

# ④ 图像读取用更快的后端
# cv2.imread 比 PIL 通常快；turbojpeg 对 JPEG 更快但需额外库
```

官方 Performance 文档还建议：

- 避免在 `__getitem__` 里做重 IO（图像路径预解析、缓存）
- 高分辨率图先 Resize 再做重变换（如 ElasticTransform）
- `ToFloat(max_value=255)` 提前转 float32 可让部分变换更快

## 与 torchvision.transforms 对比

| 维度 | Albumentations | torchvision.transforms |
| --- | --- | --- |
| 多目标同步 | image + mask + bboxes + keypoints 一条管线 | 主要面向 image，多目标需手动同步 |
| 变换种类 | 50+，含 Dropout/形变/天气模拟 | 数十个，偏基础 |
| 性能 | OpenCV 底层，主打快 | PyTorch tensor 操作 |
| API 风格 | Compose 返回 dict | callable 流式 |
| 集成 | 框架无关，配 Dataset 用 | 与 torchvision 生态紧耦合 |

## 与 imgaug 对比

| 维度 | Albumentations | imgaug |
| --- | --- | --- |
| 维护状态 | 活跃（AlbumentationsX 主线） | 维护停滞 |
| 多目标 | bbox + keypoint + mask 完善支持 | 支持但 API 较繁琐 |
| API 风格 | 现代（Compose/OneOf） | 较老 |
| 文档 | 完善 + 示例丰富 | 基础 |
| 性能 | 相当或更优 | 快 |

## 陷阱与最佳实践

- **忘记取 `result['image']`**：transform 返回字典，不是数组
- **bbox 坐标格式声明错**：传 coco 格式但 format 写 pascal_voc 会导致框错位；务必核对
- **keypoint 格式与数据不符**：传 [x, y, angle] 但 format 写 xy 会报错或截断
- **训练固定 seed**：削弱增强意义，只在调试用
- **min_area/min_visibility 不设**：裁剪后的小残框会污染训练，检测任务建议设阈值
- **未关 cv2 线程**：DataLoader 多 worker 下 OpenCV 线程竞争会拖慢，建议 `cv2.setNumThreads(0)`
- **Normalize 用错均值方差**：要匹配下游模型（ImageNet vs 自训），别套通用值
- **BGR vs RGB**：cv2.imread 默认 BGR，若下游期望 RGB 需先 `cvtColor`
