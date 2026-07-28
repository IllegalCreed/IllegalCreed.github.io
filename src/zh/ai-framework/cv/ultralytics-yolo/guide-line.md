---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Ultralytics 官方文档（Train / Predict / Export / YOLO26 / Architecture）+ GitHub Releases 编写

## 速查

- **训练入口**：`model.train(data=, epochs=, imgsz=640, batch=16, device=0)`
- **关键超参**：`lr0`(初始学习率) / `optimizer`(SGD/AdamW/Adam) / `momentum` / `weight_decay` / `warmup_epochs`
- **数据增强**：`mosaic`(默认 1.0) / `mixup` / `hsv_h/s/v` / `fliplr` / `scale` / `translate`
- **迁移学习**：加载 `.pt` 即迁移；从零训练用 `YOLO("yolo11n.yaml")`（无权重）
- **断点续训**：`model.train(resume=True)`
- **推理加速**：`model.predict(half=True)`(FP16) / `device=0` / `imgsz` 降低 / 导出 TensorRT
- **流式推理**：`model.predict(source=0, stream=True)`（摄像头逐帧，省内存）
- **跟踪**：`model.track(source="v.mp4", tracker="bytetrack.yaml")`（BoT-SORT/ByteTrack）
- **导出**：`model.export(format="onnx")`；GPU 用 `engine`，CPU 用 `openvino`
- **YOLO26 端到端**：默认 `end2end=True` 无 NMS；高精度模式 `end2end=False` 走 one-to-many+NMS

## 训练参数详解

```python
model.train(
    data="coco.yaml",
    epochs=300,
    imgsz=640,
    batch=16,                  # 或 -1（自动找最大 batch）
    device=0,                  # 多卡 [0,1]；CPU "cpu"

    # 优化器
    optimizer="auto",          # auto/SGD/AdamW/Adam；auto 根据数据集选
    lr0=0.01,                  # 初始学习率
    lrf=0.01,                  # 最终学习率 = lr0 * lrf（余弦退火）
    momentum=0.937,
    weight_decay=0.0005,
    warmup_epochs=3.0,
    warmup_momentum=0.8,

    # 数据增强
    mosaic=1.0,                # 4 图拼接（YOLO 标志性增强）
    mixup=0.0,                 # 图像混合
    hsv_h=0.015, hsv_s=0.7, hsv_v=0.4,   # 色彩抖动
    degrees=0.0, translate=0.1, scale=0.5, shear=0.0,
    perspective=0.0,
    fliplr=0.5,                # 水平翻转
    flipud=0.0,

    # 正则与损失
    box=7.5, cls=0.5, dfl=1.5, # box/cls/DFL 损失权重
    label_smoothing=0.0,
    patience=100,              # 早停：100 轮无提升则停
)
```

**经验法则**：

- 小数据集（<1k 图）优先迁移学习（加载 `.pt`）+ 强增强
- 大数据集可从零训练（`YOLO("yolo11n.yaml")`）
- 显存不足：降 `batch`、降 `imgsz`、开 `half=True`、关 `mosaic`（最后 10 轮）
- 优化器：`auto` 大多数情况选 AdamW；CNN 上 SGD+momentum 常更稳

## 推理与流处理

```python
# 单图
results = model("img.jpg")

# 批量
results = model(["a.jpg", "b.jpg", "c.jpg"])

# 视频/流（stream=True 逐帧产出，避免一次性载入）
for r in model.predict(source="video.mp4", stream=True, save=True):
    boxes = r.boxes

# 摄像头
results = model(0, show=True)            # source=0 摄像头索引；show=True 弹窗

# 推理参数
results = model("img.jpg",
    conf=0.25,                # 置信度阈值
    iou=0.7,                  # NMS IoU 阈值
    imgsz=640,
    half=True,                # FP16（GPU）
    device=0,
    max_det=300,              # 每图最大检测数
    classes=[0, 2],           # 只保留 person/car
)
```

## 目标跟踪

```python
# BoT-SORT（默认，精度高）
results = model.track(source="v.mp4", tracker="botsort.yaml", save=True)

# ByteTrack（更快）
results = model.track(source="v.mp4", tracker="bytetrack.yaml")

# 每帧结果含 track id
for r in model.track(source="v.mp4", stream=True):
    if r.boxes.id is not None:
        print(r.boxes.xyxy, r.boxes.id.int())
```

## 导出与部署

```python
# ONNX（最通用，CPU/GPU 都行）
path = model.export(format="onnx", imgsz=640, dynamic=True, simplify=True)

# TensorRT（NVIDIA GPU 最快，5x 提速）
path = model.export(format="engine", device=0, half=True)

# CoreML（Apple 生态）
path = model.export(format="coreml")

# OpenVINO（Intel CPU 提速 3x）
path = model.export(format="openvino")

# TFLite（移动端/Edge TPU）
path = model.export(format="tflite")

# NCNN（移动端，腾讯）
path = model.export(format="ncnn")
```

| 格式 | 适用场景 | 备注 |
| --- | --- | --- |
| onnx | 通用，跨框架 | 配 ONNX Runtime |
| engine (TensorRT) | NVIDIA GPU | 最快，编译机与目标机架构需匹配 |
| openvino | Intel CPU/iGPU | CPU 提速 3x |
| coreml | Apple iOS/macOS | 含 NeuralNetwork 与 MIL 两种 |
| tflite | Android/Edge TPU | 量化可选 int8 |
| ncnn | 移动端 Vulkan | 腾讯，无依赖 |
| torchscript | PyTorch 环境 | 无需 Python |

**加载导出后的模型**：直接 `YOLO("best.onnx")` / `YOLO("best.engine")`，API 与 `.pt` 一致。

## 架构演进

### YOLOv8：anchor-free + 解耦头（2023）

YOLOv8 是当代 YOLO 的奠基版本，三大架构变化：

1. **Anchor-free**：不再预设锚框尺寸，直接预测中心点 + 宽高，省去 k-means 聚类与 IoU 损失调参
2. **解耦头（Decoupled Head）**：分类与回归分支独立卷积，避免任务冲突，收敛更快
3. **TaskAlignedAssigner**：正样本分配同时考虑分类得分与定位质量

骨干（C2f 模块，C3 的演进）+ Neck（PAN-FPN）+ Head 三段式结构。

### YOLO11：更少参数更高精度（2024）

改进骨干与 Neck 设计，YOLO11m 较 YOLOv8m **参数减少 22%** 但 COCO mAP 更高。C3k2 模块、C2PSA 注意力等创新。

### YOLO12：注意力中心（2025）

引入区域注意力模块（A2），让 CNN 与注意力机制协同，在保持实时速度的同时获得 Transformer 级别的全局建模能力。

### YOLO26：原生端到端（2025-09，最新主推）

YOLO26 是当前最新一代，三大革新：

1. **原生 NMS-free**：默认 one-to-one 检测头，推理**无需 NMS 后处理**，端到端延迟更低
2. **双头训练**：训练时同时用 one-to-one 头（用于推理）+ one-to-many 辅助头（提升精度），推理只留前者
3. **去除 DFL**：简化 box 回归，降低检测头复杂度

训练管线：MuSGD（混合 SGD 与 Muon 优化器）+ Progressive Loss + STAL（小目标感知标签分配）。

**性能对比（vs YOLO11）**：

- CPU ONNX 推理：YOLO26n 较 YOLO11n 提速最高 **43%**
- 实例分割：+2.5 box AP / +3.7 mask AP
- 姿态估计：+7.2 AP
- OBB（DOTA-v1.0）：+3.4 mAP

切换端到端 / NMS 模式：

```python
# 默认端到端（无 NMS）
results = model("img.jpg")                     # end2end=True 隐含

# 切回 one-to-many + NMS（精度略高，需后处理）
results = model("img.jpg", end2end=False)
model.export(format="onnx", end2end=False)     # 导出时也可指定
```

## 与其他检测器对比

| 检测器 | 维护方 | 特点 |
| --- | --- | --- |
| **Ultralytics YOLO** | Ultralytics | 多任务统一、生态最全、迭代最快 |
| RT-DETR | 百度 | Transformer 检测器，精度高但速度略慢 |
| YOLO-NAS | Deci | 神经架构搜索，端侧优化 |
| YOLO-World | 腾讯 | 开放词表检测 |
| MMDetection | OpenMMLab | 检测算法库，研究友好 |
| Detectron2 | Meta | 学术经典，工业部署弱 |

Ultralytics 的核心优势是**「最快上手 + 最全部署 + 最强多任务」**，劣势是单框架锁定（不像 MMDetection 那样可插拔换 backbone）。
