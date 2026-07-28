---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MediaPipe 官方文档（Tasks API / Framework / Migration）+ GitHub Releases（v0.10.x）整理

## 速查

- **包**：Python `mediapipe` / GenAI `mediapipe-tasks-genai`；Web `@mediapipe/tasks-vision`
- **导入**：`import mediapipe as mp`；任务在 `mp.tasks.vision/text/audio/genai`
- **核心类**：`BaseOptions` / `XxxOptions` / `Xxx.create_from_options()` / `Xxx.detect()`
- **图像容器**：`mp.Image`（与 numpy 通过 `numpy_view()` 互转）
- **运行模式**：`RunningMode.IMAGE` / `VIDEO` / `LIVE_STREAM`
- **推理方法**：`detect` / `detect_for_video` / `detect_async`（图像类）；`classify`/`segment`/`recognize` 按任务
- **关键点类型**：`NormalizedLandmark`（归一化）/ `Landmark`（世界坐标，米）
- **Delegate**：`Delegate.CPU`（默认）/ `Delegate.GPU`
- **平台**：Android（Kotlin/Java）、iOS（Swift/ObjC）、Web（JS）、Python、C++
- **版本**：最新 **0.10.35**（2026-04）；Legacy Solutions 2023-03 退役

## Tasks API 总览

| 任务类 | 模块 | 输入 | 输出 |
| --- | --- | --- | --- |
| FaceLandmarker | vision | 图像/视频/流 | 478 关键点 + blendshapes + 变换矩阵 |
| FaceDetector | vision | 图像/视频/流 | 检测框 + 关键点 |
| HandLandmarker | vision | 图像/视频/流 | 每手 21 关键点 + handedness + world_landmarks |
| PoseLandmarker | vision | 图像/视频/流 | 33 关键点 + world_landmarks + 分割掩码 |
| HolisticLandmarker | vision | 图像/视频/流 | 人脸+姿态+双手融合 |
| ObjectDetector | vision | 图像/视频/流 | 检测框 + 类别 + 置信度 |
| ImageClassifier | vision | 图像/视频/流 | 类别 + 概率 |
| ImageSegmenter | vision | 图像/视频/流 | 类别掩码 / 置信度掩码 |
| InteractiveSegmenter | vision | 图像 + 点/框 | 前景掩码 |
| GestureRecognizer | vision | 图像/视频/流 | 手势类别 + 手部关键点 |
| ImageEmbedder | vision | 图像 | 嵌入向量（相似度检索） |
| FaceStylizer | vision | 图像 | 风格化图像 |
| ImageGenerator | vision (Android) | 文本 | 生成图像 |
| TextClassifier | text | 文本 | 类别 + 概率 |
| LanguageDetector | text | 文本 | 语言 + 概率 |
| TextEmbedder | text | 文本 | 嵌入向量 |
| AudioClassifier | audio | 音频 | 类别 + 概率 |
| LlmInference | genai | 文本 | 生成文本（Gemma/Phi/Llama） |

## 平台支持矩阵

| 任务 | Android | iOS | Web | Python | C++ |
| --- | --- | --- | --- | --- | --- |
| FaceLandmarker | ✓ | ✓ | ✓ | ✓ | ✓ |
| HandLandmarker | ✓ | ✓ | ✓ | ✓ | ✓ |
| PoseLandmarker | ✓ | ✓ | ✓ | ✓ | ✓ |
| HolisticLandmarker | ✓ | ✓ | ✓ | ✓ | ✓ |
| ObjectDetector | ✓ | ✓ | ✓ | ✓ | ✓ |
| ImageClassifier | ✓ | ✓ | ✓ | ✓ | ✓ |
| ImageSegmenter | ✓ | ✓ | ✓ | ✓ | ✓ |
| GestureRecognizer | ✓ | ✓ | ✓ | ✓ | ✓ |
| LlmInference | ✓ | ✓ | ✓ | 部分 | 部分 |
| RAG / Function Calling | ✓ | — | — | — | — |
| ImageGenerator | ✓ | — | — | — | — |

## BaseOptions

```python
from mediapipe.tasks import python

base = python.BaseOptions(
    model_asset_path='model.task',          # 本地路径
    model_asset_buffer=b'...',              # 或内存 buffer
    delegate=python.BaseOptions.Delegate.CPU,  # CPU / GPU
)
```

## mp.Image

```python
import mediapipe as mp
import numpy as np

# 创建
mp_img = mp.Image.create_from_file('a.jpg')
mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=ndarray_rgb)
mp_img = mp.Image(image_format=mp.ImageFormat.RGBA, data=ndarray_rgba)

# 格式枚举
# ImageFormat.SRGB       (HWC, uint8, 3 通道)
# ImageFormat.RGBA       (HWC, uint8, 4 通道)
# ImageFormat.GRAY8      (HW, uint8)
# ImageFormat.SRGB48     (HWC, uint16, 3 通道)

# 转 numpy（共享内存）
arr = mp_img.numpy_view()

# 属性
mp_img.width        # 高
mp_img.height
mp_img.channels
```

## RunningMode 与方法

```python
from mediapipe.tasks.python import vision

# IMAGE
options = vision.XxxOptions(base_options=base, running_mode=vision.RunningMode.IMAGE)
result = task.detect(mp_image)

# VIDEO（需 timestamp_ms 单调递增）
options = vision.XxxOptions(base_options=base, running_mode=vision.RunningMode.VIDEO)
result = task.detect_for_video(mp_image, timestamp_ms)

# LIVE_STREAM（异步回调）
def callback(result, output_image, timestamp_ms):
    ...
options = vision.XxxOptions(
    base_options=base,
    running_mode=vision.RunningMode.LIVE_STREAM,
    result_callback=callback,
)
task.detect_async(mp_image, timestamp_ms)   # 立即返回，结果走回调
```

## Landmark 数据结构

```python
# NormalizedLandmark（归一化到 [0,1]，相对图像尺寸）
lm.x    # float [0,1]
lm.y    # float [0,1]
lm.z    # float（深度，相对参考点）
lm.visibility      # 0-1（是否可见，Pose 有）
lm.presence        # 0-1（是否在画面内）

# Landmark（世界坐标，米单位）
# res.world_landmarks: 与归一化同形，但单位是米
```

## 关键点数量速查

| 模型 | 关键点数 | 备注 |
| --- | --- | --- |
| FaceLandmarker | 478 | 含瞳孔虹膜（旧 FaceMesh 468） |
| HandLandmarker | 21 × 每手 | WRIST + 5 指 × 4 关节 |
| PoseLandmarker | 33 | 含头/肩/肘/腕/髋/膝/踝 |
| HolisticLandmarker | 478 + 33 + 21×2 | Face+Pose+Hands 融合 |
| FaceDetector | 6 | 双眼/鼻尖/嘴角/双耳 |

## 内置手势（GestureRecognizer）

| 手势名 | 含义 |
| --- | --- |
| `None` | 未识别 |
| `Closed_Fist` | 握拳 |
| `Open_Palm` | 张开手掌 |
| `Pointing` | 食指指向 |
| `Thumb_Up` | 大拇指上 |
| `Thumb_Down` | 大拇指下 |
| `Victory` | V 字（食指+中指） |
| `ILoveYou` | ILY（小指+食指+大拇指） |

## 版本与演进

| 版本 | 关键变化 |
| --- | --- |
| 0.8–0.9 (2020-2021) | Legacy Solutions 时代：mp.solutions.hands/pose/face_mesh/holistic |
| 0.10.0 (2023-03) | **Legacy Solutions 退役**，Tasks API 正式版；引入 mp.tasks.vision |
| 0.10.4–0.10.10 | LLM Inference API；Holistic 升级；Object Detection 增 YOLO 模型 |
| 0.10.14 | GenAI 扩展（RAG、Function Calling） |
| 0.10.20+ | SAM 集成、LLM Inference 进入 maintenance-only，推荐 LiteRT-LM |
| **0.10.35 (2026-04)** | **当前最新版**；持续 Bug 修复与新模型支持 |

## Framework（C++）核心概念

| 概念 | 说明 |
| --- | --- |
| Calculator | 最小计算单元，C++ 类，实现 Process() |
| Graph | Calculator 组成的有向图，.pbtxt 配置 |
| Packet | 节点间数据包，含类型与时间戳 |
| Stream | 实时数据流，按时间戳排序 |
| Side Packet | 图级静态参数（非流式） |
| Scheduler | 调度器，决定节点执行顺序 |

典型 Framework 用法：用 Bazel 构建 C++ binary，加载 .pbtxt 图配置，输入视频流输出结果。适合需要深度定制的工业场景。

## 官方资源

- [MediaPipe 文档主页](https://developers.google.com/edge/mediapipe)
- [Solutions Guide](https://developers.google.com/edge/mediapipe/solutions/guide)
- [Framework 文档](https://developers.google.com/edge/mediapipe/framework)
- [GitHub 仓库](https://github.com/google-ai-edge/mediapipe)
- [Legacy 迁移指南](https://developers.google.com/edge/mediapipe/migration/legacy_solutions)
- [模型仓（Hugging Face）](https://huggingface.co/litert-community)
