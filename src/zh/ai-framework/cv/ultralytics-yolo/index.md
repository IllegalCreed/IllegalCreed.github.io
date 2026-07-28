---
layout: doc
---

# Ultralytics YOLO

Ultralytics YOLO 是 Ultralytics 公司（YOLOv5 作者 Glenn Jocher 团队）维护的实时视觉模型家族与统一训练推理框架，以「YOLO」命名但已远超传统目标检测——**同一套 Python API 与同一份模型权重覆盖检测、实例分割、姿态估计、图像分类、旋转目标检测（OBB）乃至单目深度估计与语义分割**。它的核心抽象是 `from ultralytics import YOLO; model = YOLO("yolo11n.pt")`：传入 `.pt` 权重或 `.yaml` 配置即可获得 train/predict/val/export/track 五大模式的完整工作流，配套命令行 `yolo` 工具与 HUB 云端标注训练平台。架构层面 YOLOv8 起全面转向 **anchor-free（无锚框）+ 解耦检测头（classification/box regression 分支独立）**，告别了 YOLOv3/v4/v5 时代的 anchor 与 IoU 损失调参负担。版本演进迅速：YOLOv8（2023-01，多任务统一）、YOLO11（2024-09，更少参数更高精度）、YOLO12（2025，注意力机制中心）、**YOLO26（2025-09，原生端到端 NMS-free 推理、双头训练、CPU ONNX 较 YOLO11n 提速最高 43%）**。截至 2026 年 7 月，Python 包 `ultralytics` 最新版 **8.4.108**，YOLO26 是官方主推的最新一代。信源 docs.ultralytics.com 官方文档 + GitHub Releases。

## 评价

**优点**

- **极简 Python API**：`YOLO("xxx.pt")` 一行加载，`model.train/predict/export` 三件套覆盖 90% 工作流，学习曲线极低
- **多任务统一**：检测/分割/姿态/分类/OBB/深度共用同一框架，切换只需换权重后缀（`-seg`/`-pose`/`-cls`/`-obb`）
- **导出格式最全**：ONNX/TensorRT/CoreML/TFLite/OpenVINO/NCNN/PaddlePaddle/TorchScript/TF 等 15+ 格式，端到云全覆盖
- **anchor-free + 解耦头**：v8 起摆脱锚框先验与 NMS 调参，YOLO26 进一步原生 NMS-free，部署延迟更低
- **精度速度前沿**：每代都在 COCO 上刷新 SOTA-速度权衡，YOLO26 较 YOLO11 检测 mAP 40.9→57.5、姿态 +7.2 AP
- **生态活跃**：HUB 平台（标注+训练+部署）、CLI、Python、移动端示例齐全；社区模型（YOLO-NAS/RT-DETR/SAM）一并托管

**缺点**

- **版本迭代过快**：v8/v9/v10/v11/v12/v26 三年六代，旧教程迅速过时，生产锁定版本要谨慎
- **API 兼容性弱**：`ultralytics` 包虽同名，但跨大版本（如 v8→YOLO11）配置项、结果对象字段常有微调
- **依赖较重**：默认拉入 PyTorch、OpenCV、PIL、pandas、matplotlib 等，最小化部署需裁剪
- **训练显存敏感**：默认配置在 8GB 显存上只能跑 n/s 档，更大模型需 24GB+ 或多卡
- **NMS-free 仍在过渡**：YOLO26 默认端到端但精度略低于 one-to-many+NMS 模式，需按场景权衡
- **企业级特性需付费**：HUB 的高级数据集管理、自动训练等是 Pro/Enterprise 付费功能

## 文档地址

- [Ultralytics 官方文档](https://docs.ultralytics.com/)
- [YOLO26 模型页](https://docs.ultralytics.com/models/yolo26/)
- [YOLO11 模型页](https://docs.ultralytics.com/models/yolo11/)
- [Python API 速查](https://docs.ultralytics.com/usage/python/)
- [Export 导出指南](https://docs.ultralytics.com/modes/export/)

## GitHub地址

[ultralytics/ultralytics](https://github.com/ultralytics/ultralytics)

## 幻灯片地址

<a href="/SlideStack/ultralytics-yolo-slide/" target="_blank">Ultralytics YOLO</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Ultralytics YOLO 测试题</a>
