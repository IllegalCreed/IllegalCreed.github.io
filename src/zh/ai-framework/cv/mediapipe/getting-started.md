---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MediaPipe 官方文档（developers.google.com/edge/mediapipe：Solutions Guide / Tasks Python / Hand Landmarker）+ GitHub Releases（v0.10.x）编写

## 速查

- **安装（Python）**：`pip install mediapipe`（含预编译模型运行时）
- **导入**：`import mediapipe as mp`；任务在 `mp.tasks.vision` / `mp.tasks.text` / `mp.tasks.audio` / `mp.tasks.genai`
- **核心范式**：`BaseOptions(model_asset_path='xxx.task')` → `XxxOptions(base_options=, running_mode=)` → `Xxx.create_from_options(options)`
- **三种运行模式**：`RunningMode.IMAGE`（单图，阻塞）、`VIDEO`（视频帧，需 timestamp）、`LIVE_STREAM`（实时流，异步回调）
- **推理方法**：`detect()`（图像）/ `detect_for_video()`（视频）/ `detect_async()`（流，非阻塞）
- **模型文件**：每个 Task 用 `.task` 格式（含模型 + 元数据），从 Google 模型仓下载
- **五端支持**：Android（Kotlin/Java）、iOS（Swift/Objective-C）、Web（JS）、Python、C++
- **Legacy 已退役**：2023-03 起 `mp.solutions.*` 停止维护，必须用 Tasks API
- **GPU 加速**：`BaseOptions(delegate=Delegate.GPU)`（移动端默认，桌面 Python 通常 CPU）
- **Holistic**：`HolisticLandmarker` 同时检测人脸+姿态+双手关键点
- **最新版**：0.10.35（2026-04）

## 安装

```bash
pip install mediapipe              # Python 端
pip install mediapipe-tasks-genai  # GenAI（LLM Inference）额外包
```

> Python 版 MediaPipe 在桌面端默认 CPU 推理；移动端（Android/iOS）通过 Gradle/CocoaPods 集成，默认走 GPU/NNAPI/Core ML。Web 端用 `@mediapipe/tasks-vision` npm 包。

## Tasks API 三步范式

所有 Vision Task 都遵循同一套三步范式：

```python
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# 1. 配置 BaseOptions（指定模型路径 + 设备）
base_options = python.BaseOptions(model_asset_path='/path/hand_landmarker.task')

# 2. 配置 Task 专属 Options
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,     # IMAGE / VIDEO / LIVE_STREAM
    num_hands=2,
)

# 3. 用 create_from_options 创建 Task（推荐 with 上下文管理资源）
with vision.HandLandmarker.create_from_options(options) as landmarker:
    mp_image = mp.Image.create_from_file('hand.jpg')
    result = landmarker.detect(mp_image)
    print(result.hand_landmarks)              # 每只手 21 个关键点
```

## 运行模式

三种模式对应不同输入场景，**模式必须与 detect 方法匹配**：

| 模式 | 输入 | 方法 | 阻塞 |
| --- | --- | --- | --- |
| `IMAGE` | 单张静态图 | `detect(image)` | 是 |
| `VIDEO` | 解码后的视频帧序列 | `detect_for_video(image, timestamp_ms)` | 是 |
| `LIVE_STREAM` | 摄像头实时流 | `detect_async(image, timestamp_ms)` | 否（回调） |

```python
# LIVE_STREAM 模式需提供回调函数
def result_callback(result, output_image, timestamp_ms):
    print(timestamp_ms, result.hand_landmarks)

options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.LIVE_STREAM,
    result_callback=result_callback,
)
with vision.HandLandmarker.create_from_options(options) as landmarker:
    # 摄像头循环（配 OpenCV 读流）
    import cv2
    cap = cv2.VideoCapture(0)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        landmarker.detect_async(mp_image, int(cap.get(cv2.CAP_PROP_POS_MSEC)))
```

## mp.Image 与 numpy 互转

Tasks API 用 `mp.Image` 作为图像容器，与 numpy/OpenCV 互转：

```python
import mediapipe as mp
import numpy as np
import cv2

# numpy/ndarray → mp.Image
img = cv2.imread('a.jpg')                       # BGR ndarray
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # 必须转 RGB！
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

# mp.Image → numpy
ndarray = mp_image.numpy_view()                 # 共享内存，HWC RGB
```

> **关键坑**：MediaPipe 内部用 RGB，OpenCV 默认 BGR，喂入前必须 `cvtColor(BGR2RGB)`，否则关键点检测会错乱。

## 第一个 Solution：HandLandmarker

完整可运行的「读图 → 检测 21 个手部关键点 → 绘制」示例：

```python
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2

# 下载 hand_landmarker.task（官方模型仓）
base = python.BaseOptions(model_asset_path='hand_landmarker.task')
opts = vision.HandLandmarkerOptions(base_options=base, num_hands=2)

with vision.HandLandmarker.create_from_options(opts) as lm:
    img = cv2.cvtColor(cv2.imread('hand.jpg'), cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)
    res = lm.detect(mp_img)

    # res.hand_landmarks: list[list[NormalizedLandmark]]
    # 每只手 21 个关键点，每个含 x/y/z（归一化 0-1）
    for hand in res.hand_landmarks:
        for lm in hand:
            print(f"x={lm.x:.3f} y={lm.y:.3f} z={lm.z:.3f}")
        print("handedness:", res.handedness)
```

21 个关键点含义（按顺序）：0=手腕、1-4=拇指、5-8=食指、9-12=中指、13-16=无名指、17-20=小指。

## 模型下载

每个 Task 需要对应的 `.task` 模型文件（含 TFLite 模型 + 元数据 + 标签）。从官方模型仓获取：

- 模型列表页：developers.google.com/edge/mediapipe/solutions/...
- 常用：`hand_landmarker.task`、`face_landmarker.task`、`pose_landmarker.task`、`holistic_landmarker.task`、`efficientdet_lite0.tflite`（检测）、`efficientnet_lite0.tflite`（分类）

下载后放本地，`BaseOptions(model_asset_path=...)` 指向即可。

## 下一步

- 各 Task 详解（Face/Pose/Object/Holistic）见「指南」
- GPU 加速、自定义模型见「指南 → 进阶」
- 完整 API 速查见「参考」
- 旧 Solutions 迁移见「指南 → Legacy 迁移」
