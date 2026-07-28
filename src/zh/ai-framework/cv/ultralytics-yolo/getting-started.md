---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Ultralytics 官方文档（docs.ultralytics.com：Quickstart / Install / Predict / YOLO11 / YOLO26）+ GitHub Releases（v8.4.x）编写，对照 2026-07 最新行为

## 速查

- **安装**：`pip install ultralytics`（含 PyTorch、OpenCV 等依赖）
- **CLI**：`yolo predict model=yolo11n.pt source='img.jpg'`；`yolo train data=coco8.yaml ...`
- **Python 入口**：`from ultralytics import YOLO`；`model = YOLO("yolo11n.pt")`
- **五大模式**：`model.train()` / `model.predict()` / `model.val()` / `model.export()` / `model.track()`
- **任务后缀**：Detect `yolo11n.pt`、Segment `-seg`、Pose `-pose`、Classify `-cls`、OBB `-obb`
- **模型档位**：n(nano) / s(small) / m(medium) / l(large) / x(extra)，精度与算力递增
- **数据集**：默认 COCO 格式（YOLO txt 标注）；内置 `coco8.yaml` 小数据集便于练手
- **默认图像尺寸**：`imgsz=640`（检测/分割/姿态/OBB）；分类 `224`
- **结果对象**：`results[0].boxes`（检测）/ `.masks`（分割）/ `.keypoints`（姿态）/ `.probs`（分类）
- **导出**：`model.export(format="onnx")`；GPU 用 `engine`(TensorRT)、CPU 用 `openvino`
- **最新代**：YOLO26（2025-09，原生 NMS-free 端到端）

## 安装

```bash
# 标准（含 PyTorch CUDA 依赖，体积较大）
pip install ultralytics

# 仅 CPU（更轻）
pip install ultralytics --extra-index-url https://download.pytorch.org/whl/cpu

# 升级到最新
pip install -U ultralytics
```

验证安装：

```python
import ultralytics
ultralytics.checks()      # 打印版本、PyTorch、CUDA、依赖兼容性
# 或命令行：yolo version  /  yolo checks
```

## 三行推理

最快上手路径——下载权重、读图、推理：

```python
from ultralytics import YOLO

# 1. 加载模型（首次会自动下载到本地缓存）
model = YOLO("yolo11n.pt")          # 检测；分割用 yolov8n-seg.pt，姿态用 yolov8n-pose.pt

# 2. 推理（接受 路径 / ndarray / URL / 目录 / 视频 / 摄像头索引）
results = model("bus.jpg")          # 等价 model.predict("bus.jpg")

# 3. 查看结果
for r in results:
    print(r.boxes.xyxy)             # 检测框 [x1,y1,x2,y2]
    print(r.boxes.conf)             # 置信度
    print(r.boxes.cls)              # 类别 id
    r.show()                        # 弹窗显示
    r.save("out.jpg")               # 保存带标注图
```

CLI 等价：

```bash
yolo predict model=yolo11n.pt source='bus.jpg' save=True
```

## 模型档位与任务

同一代模型按参数量分 5 档（n/s/m/l/x），按任务分 5 类（后缀不同）。以 YOLO11 检测在 COCO 上的官方指标为例（imgsz=640，T4 TensorRT10）：

| 模型 | mAP50-95 | 参数 | FLOPs | T4 速度 |
| --- | --- | --- | --- | --- |
| YOLO11n | 39.5 | 2.6M | 6.5B | 1.5ms |
| YOLO11s | 47.0 | 9.4M | 21.5B | 2.5ms |
| YOLO11m | 51.5 | 20.1M | 68.0B | 4.7ms |
| YOLO11l | 53.4 | 25.3M | 86.9B | 6.2ms |
| YOLO11x | 54.7 | 56.9M | 194.9B | 11.3ms |

任务后缀对应权重命名：

| 任务 | 权重示例 | 结果字段 |
| --- | --- | --- |
| 检测 Detect | `yolo11n.pt` | `r.boxes` |
| 实例分割 Segment | `yolo11n-seg.pt` | `r.boxes` + `r.masks` |
| 姿态 Pose | `yolo11n-pose.pt` | `r.boxes` + `r.keypoints` |
| 分类 Classify | `yolo11n-cls.pt` | `r.probs` |
| OBB 旋转框 | `yolo11n-obb.pt` | `r.obb` |

## 第一个训练

内置 `coco8.yaml`（COCO 的 8 张图小数据集）用于跑通流程：

```python
from ultralytics import YOLO

model = YOLO("yolo11n.pt")                 # 加载预训练权重（迁移学习）
results = model.train(
    data="coco8.yaml",                     # 数据集配置
    epochs=100,                            # 训练轮数
    imgsz=640,                             # 输入尺寸
    batch=16,                              # 批大小
    device=0,                              # GPU 索引；CPU 用 "cpu"
    workers=8,                             # 数据加载进程
    project="runs/train",                  # 输出目录
    name="exp1",                           # 实验名
)
```

训练产物保存在 `runs/train/exp1/`：`weights/best.pt`（最佳）、`weights/last.pt`（最新）、`results.png`（曲线）、`confusion_matrix.png` 等。

CLI 等价：

```bash
yolo train model=yolo11n.pt data=coco8.yaml epochs=100 imgsz=640 batch=16 device=0
```

## 数据集格式

YOLO 检测标注为每图一个 `.txt`，每行 `class x_center y_center width height`（均归一化到 0–1）：

```
0 0.512 0.430 0.235 0.476
2 0.318 0.618 0.108 0.244
```

数据集 `.yaml` 配置：

```yaml
# mydata.yaml
path: /datasets/mydata           # 根目录
train: images/train              # 训练图相对路径
val: images/val
names:
  0: person
  1: bicycle
  2: car
```

> 分割标注每行多了多边形点：`class x1 y1 x2 y2 ...`；姿态标注额外含关键点。

## 下一步

- 训练参数详解（lr0、optimizer、augment、mosaic）见「指南」
- 导出部署（ONNX/TensorRT/CoreML）见「指南 → 导出」
- 架构原理（anchor-free、解耦头、YOLO26 双头）见「指南 → 架构」
- 完整 API 速查见「参考」
