---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Ultralytics 官方文档（Python API / CLI / Tasks / Modes）+ GitHub Releases（v8.4.x）整理

## 速查

- **入口**：`from ultralytics import YOLO`；`YOLO("xxx.pt")` / `YOLO("xxx.yaml")` / `YOLO("xxx.onnx")`
- **五大模式**：`train` / `predict` / `val` / `export` / `track`（+ `benchmark`）
- **五大任务**：detect / segment / pose / classify / obb
- **模型代**：YOLOv8 / YOLO11 / YOLO12 / YOLO26（最新主推）
- **档位**：n / s / m / l / x（参数递增）
- **CLI**：`yolo TASK MODE ARGS`，如 `yolo detect predict model=yolo11n.pt source=img.jpg`
- **结果对象**：`Results` 含 `.boxes` / `.masks` / `.keypoints` / `.probs` / `.obb`
- **默认尺寸**：检测/分割/姿态/OBB `imgsz=640`；分类 `224`
- **包版本**：`ultralytics` 最新 **8.4.108**（2026-07）
- **依赖**：Python ≥ 3.8；PyTorch ≥ 1.8；OpenCV、PIL、pandas、matplotlib

## YOLO 类 API

```python
from ultralytics import YOLO, RTDETR, SAM, YOLOWorld

# 加载（按扩展名自动判断）
model = YOLO("yolo11n.pt")          # PyTorch 权重
model = YOLO("yolo11n.yaml")        # 从配置建空模型（从零训练）
model = YOLO("best.onnx")           # 加载导出格式
model = YOLO("best.engine")         # TensorRT

# 五大模式
model.train(data="coco.yaml", epochs=100)
results = model.predict("img.jpg", conf=0.25)
metrics = model.val(data="coco.yaml")     # 评估
path = model.export(format="onnx")        # 导出
results = model.track(source="v.mp4")     # 跟踪

# 信息查询
model.info()                              # 打印层结构、参数量
model.names                               # 类别字典 {0: 'person', ...}
model.model                               # 底层 nn.Module
```

## Predict 参数

```python
model.predict(
    source="img.jpg",       # 路径/ndarray/URL/目录/视频/摄像头索引/RTSP
    conf=0.25,              # 置信度阈值
    iou=0.7,                # NMS IoU 阈值
    imgsz=640,              # 推理尺寸
    half=False,             # FP16
    device=None,            # 0 / "cpu" / [0,1]
    max_det=300,            # 每图最大检测数
    classes=None,           # [0,2] 过滤类别
    agnostic_nms=False,     # 类别无关 NMS
    stream=False,           # True 返回生成器（省内存）
    verbose=True,           # 打印日志
    save=False,             # 保存结果图
    save_txt=False,         # 保存标注 txt
    save_conf=False,        # 标注含置信度
    project="runs/predict",
    name="exp",
    exist_ok=False,
    end2end=True,           # YOLO26 端到端（无 NMS）
)
```

## Results 对象

```python
results = model("img.jpg")
r = results[0]                      # 单图取第一个

# 检测
r.boxes.xyxy                        # (N,4) tensor [x1,y1,x2,y2]
r.boxes.xywh                        # (N,4) [x,y,w,h]
r.boxes.conf                        # (N,) 置信度
r.boxes.cls                         # (N,) 类别 id
r.boxes.id                          # (N,) 跟踪 id（track 模式）
r.boxes.data                        # (N,6) 拼接 [xyxy, conf, cls]

# 分割
r.masks.data                        # (N,H,W) 二值掩码
r.masks.xy                          # list of 多边形点
r.masks.xyn                         # 归一化多边形

# 姿态
r.keypoints.xy                      # (N,17,2) 关键点坐标
r.keypoints.conf                    # (N,17) 关键点置信度

# 分类
r.probs                             # Probs 对象
r.probs.top1                        # top1 类别 id
r.probs.top1conf                    # top1 置信度
r.probs.data                        # (num_classes,) 全概率

# OBB
r.obb.xywhr                         # (N,5) [x,y,w,h,angle]
r.obb.conf                          # (N,)
r.obb.cls                           # (N,)

# 元数据
r.orig_img                          # 原始 ndarray
r.path                              # 源路径
r.speed                             # {'preprocess':, 'inference':, 'postprocess':} ms

# 输出
r.show()                            # 弹窗
r.save("out.jpg")                   # 保存
r.tojson("out.json")                # COCO JSON
```

## Train 参数（关键子集）

```python
model.train(
    data="coco.yaml",
    epochs=100,
    time=None,              # 时间预算（与 epochs 二选一），如 "1.5h"
    patience=100,           # 早停耐心
    batch=16,               # 或 -1 自动
    imgsz=640,
    save=True,              # 保存权重
    save_period=-1,         # 每 N 轮存一次 checkpoint
    cache=False,            # 'ram'/'disk' 缓存数据集
    device=0,
    workers=8,
    project="runs/train",
    name="exp",
    exist_ok=False,
    pretrained=True,
    optimizer="auto",       # auto/SGD/AdamW/Adam/NAdam/RAdam/RMSProp
    verbose=True,
    seed=0,
    deterministic=True,
    single_cls=False,
    rect=False,             # 矩形训练
    cos_lr=False,           # 余弦学习率
    close_mosaic=10,        # 最后 10 轮关 mosaic
    resume=False,
    amp=True,               # 自动混合精度
    # 优化器超参
    lr0=0.01, lrf=0.01, momentum=0.937, weight_decay=0.0005,
    warmup_epochs=3.0, warmup_momentum=0.8, warmup_bias_lr=0.1,
    # 损失权重
    box=7.5, cls=0.5, dfl=1.5,
    label_smoothing=0.0,
    # 数据增强
    hsv_h=0.015, hsv_s=0.7, hsv_v=0.4,
    degrees=0.0, translate=0.1, scale=0.5, shear=0.0,
    perspective=0.0, flipud=0.0, fliplr=0.5,
    mosaic=1.0, mixup=0.0, copy_paste=0.0,
)
```

## Export 参数

```python
model.export(
    format="onnx",          # torchscript/onnx/openvino/engine/coreml/tflite/ncnn/...
    imgsz=640,
    half=False,             # FP16
    int8=False,             # INT8 量化
    dynamic=False,          # 动态输入尺寸
    simplify=True,          # ONNX simplify
    opset=12,               # ONNX opset 版本
    workspace=4,            # TensorRT workspace GB
    nms=False,              # 导出含 NMS
    batch=1,
    device=None,
    end2end=True,           # YOLO26 端到端
)
```

支持的全部格式（按 docs.ultralytics.com/modes/export）：

| format | 后缀 | 平台 |
| --- | --- | --- |
| torchscript | `.torchscript` | PyTorch |
| onnx | `.onnx` | 通用 |
| openvino | `_openvino_model/` | Intel |
| engine | `.engine` | NVIDIA |
| coreml | `.mlpackage` | Apple |
| tflite | `_tflite_model/` | 移动/Edge TPU |
| ncnn | `_ncnn_model/` | 移动 Vulkan |
| pb / saved_model | `_saved_model/` | TensorFlow |
| paddle | `_paddle_model/` | PaddlePaddle |
| mnn | `.mnn` | 阿里 MNN |
| rknn | `.rknn` | Rockchip |
| qnn | `.qnn` | Qualcomm |

## CLI 速查

```bash
# 训练
yolo train model=yolo11n.pt data=coco8.yaml epochs=100 imgsz=640

# 推理
yolo predict model=yolo11n.pt source='img.jpg' conf=0.25 save=True

# 评估
yolo val model=yolo11n.pt data=coco.yaml

# 导出
yolo export model=yolo11n.pt format=onnx

# 跟踪
yolo track model=yolo11n.pt source='video.mp4' tracker=botsort.yaml

# 分割/姿态/分类（自动从权重判断任务）
yolo segment predict model=yolo11n-seg.pt source='img.jpg'
yolo pose predict model=yolo11n-pose.pt source='img.jpg'
yolo classify predict model=yolo11n-cls.pt source='img.jpg'
```

## 模型代速查

| 代 | 发布 | 关键创新 | 状态 |
| --- | --- | --- | --- |
| YOLOv5 | 2020 | 工程、CLI、易用 | 维护 |
| YOLOv8 | 2023-01 | anchor-free、解耦头、多任务统一 | 主流 |
| YOLOv9/v10 | 2024 | PGI、NMS-free（外部） | 有限支持 |
| YOLO11 | 2024-09 | 更少参数更高精度（C3k2、C2PSA） | 主流 |
| YOLO12 | 2025 | 区域注意力 A2 | 维护 |
| **YOLO26** | **2025-09** | **原生端到端 NMS-free、双头、MuSGD** | **最新主推** |

> Ultralytics 还托管外部模型：RT-DETR（百度）、SAM/SAM2/SAM3（Meta）、YOLO-NAS（Deci）、YOLO-World（腾讯）、YOLOE（开放词表）。

## 官方资源

- [Ultralytics 文档](https://docs.ultralytics.com/)
- [YOLO26 模型页](https://docs.ultralytics.com/models/yolo26/)
- [Python API 参考](https://docs.ultralytics.com/reference/engine/model/)
- [HUB（云端平台）](https://hub.ultralytics.com/)
- [GitHub Releases](https://github.com/ultralytics/ultralytics/releases)
