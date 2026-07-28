---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 MediaPipe 官方文档（Vision Tasks / GenAI / Framework / Migration）+ GitHub Releases 编写

## 速查

- **FaceLandmarker**：人脸 478 个关键点（含瞳孔）、表情、blendshapes
- **HandLandmarker**：每只手 21 个关键点 + 左右手判定
- **PoseLandmarker**：全身 33 个关键点
- **HolisticLandmarker**：人脸 + 姿态 + 双手 同时检测（融合）
- **ObjectDetector**：目标检测（含 EfficientDet/YOLO 等模型）
- **ImageClassifier**：图像分类（EfficientNet/MobileNet）
- **ImageSegmenter**：语义/实例分割（含 SelfieSegmentation）
- **GestureRecognizer**：手势识别（预置常见手势）
- **LLM Inference API**：端侧大模型推理（Gemma/Phi/Llama），maintenance-only
- **GPU 加速**：`BaseOptions(delegate=Delegate.GPU)`
- **Legacy 迁移**：2023-03 起 mp.solutions.* 退役，全切 Tasks API

## FaceLandmarker

人脸关键点检测，支持 478 个精细关键点（旧 FaceMesh 是 468，新版增加瞳孔虹膜 10 个点）与 blendshapes（表情系数）：

```python
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

base = python.BaseOptions(model_asset_path='face_landmarker.task')
opts = vision.FaceLandmarkerOptions(
    base_options=base,
    running_mode=vision.RunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_face_blendshapes=True,        # 输出表情系数（52 个 ARKit 兼容）
    output_facial_transformation_matrixes=True,  # 输出 3D 变换矩阵
)
with vision.FaceLandmarker.create_from_options(opts) as lm:
    res = lm.detect(mp_image)
    # res.face_landmarks[0]: 478 个 NormalizedLandmark
    # res.face_blendshapes[0]: 52 个 blendshape 得分
```

应用：AR 试妆/试镜、表情驱动动画（虚拟主播）、人脸识别前置对齐、疲劳检测。

## HandLandmarker

```python
opts = vision.HandLandmarkerOptions(
    base_options=base,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=2,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5,
)
res = lm.detect(mp_image)
# res.hand_landmarks: list[list[NormalizedLandmark]]（每手 21 点）
# res.handedness: list[Category]（Left/Right，注意镜像问题）
# res.world_landmarks: 真实世界坐标（米为单位）
```

21 个关键点索引：0=WRIST、1-4=THUMB、5-8=INDEX_FINGER、9-12=MIDDLE_FINGER、13-16=RING_FINGER、17-20=PINKY。

应用：手势交互、手语翻译、AR 涂鸦、虚拟键盘。

## PoseLandmarker

全身 33 个关键点（覆盖头、肩、肘、腕、髋、膝、踝），含 2D 与 3D 世界坐标：

```python
opts = vision.PoseLandmarkerOptions(
    base_options=base,
    running_mode=vision.RunningMode.IMAGE,
    num_poses=1,
    min_pose_detection_confidence=0.5,
    min_pose_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_segmentation_masks=True,
)
res = lm.detect(mp_image)
# res.pose_landmarks: list[list[NormalizedLandmark]]（每人 33 点）
# res.pose_world_landmarks: 真实 3D 坐标（米）
# res.segmentation_masks: 前景掩码
```

应用：健身计数、动作矫正、运动分析、虚拟试衣。

## HolisticLandmarker

Holistic = Face + Pose + Hands 三者融合，单次推理同时输出：

```python
opts = vision.HolisticLandmarkerOptions(
    base_options=base,
    running_mode=vision.RunningMode.IMAGE,
    min_face_detection_confidence=0.5,
    min_hand_detection_confidence=0.5,
    min_pose_detection_confidence=0.5,
)
res = lm.detect(mp_image)
# res.face_blendshapes / res.pose_landmarks / res.left_hand_landmarks / res.right_hand_landmarks
```

适合需要全身上下文一致的场景：全身 AR 滤镜、舞蹈游戏、全身动作捕捉。

## ObjectDetector

```python
from mediapipe.tasks.python import vision

opts = vision.ObjectDetectorOptions(
    base_options=base,
    running_mode=vision.RunningMode.IMAGE,
    max_results=5,                  # 每图最大检测数
    score_threshold=0.5,            # 置信度阈值
    category_allowlist=['person', 'car'],   # 只保留指定类别（可选）
)
with vision.ObjectDetector.create_from_options(opts) as det:
    res = det.detect(mp_image)
    for d in res.detections:
        bbox = d.bounding_box       # xmin/ymin/width/height
        for c in d.categories:
            print(c.category_name, c.score)
```

支持 EfficientDet-Lite、SSD-MobileNet 等模型，端侧实时。

## ImageClassifier 与 ImageSegmenter

```python
# 分类
opts = vision.ImageClassifierOptions(base_options=base, max_results=3)
res = clf.classify(mp_image)
# res.classifications[0].categories: [Category(index, score, category_name, display_name)]

# 分割
opts = vision.ImageSegmenterOptions(
    base_options=base,
    output_category_mask=True,
    output_confidence_masks=True,
)
res = seg.segment(mp_image)
# res.category_mask: 类别掩码
# res.confidence_masks: 每类置信度掩码
```

## GestureRecognizer

```python
opts = vision.GestureRecognizerOptions(
    base_options=base,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=2,
)
res = rec.recognize(mp_image)
# res.gestures: list[list[Category]]  如 [{'category_name': 'Thumb_Up'}]
# 同时返回 hand_landmarks
```

内置常用手势：Thumb_Up/Down、Victory、Open_Palm、Closed_Fist、ILoveYou、Pointing。

## GPU 加速

通过 BaseOptions 的 delegate 参数切换 CPU/GPU：

```python
from mediapipe.tasks import python

# CPU（默认，桌面 Python 推荐）
base = python.BaseOptions(model_asset_path='m.task')

# GPU（移动端常用，桌面需 OpenGL 支持）
base = python.BaseOptions(
    model_asset_path='m.task',
    delegate=python.BaseOptions.Delegate.GPU,
)
```

> 桌面 Python 的 GPU 支持有限（依赖 OpenGL ES），多数场景 CPU 已够实时；移动端 Android/iOS 默认走 GPU/NNAPI/Core ML。

## LLM Inference API（GenAI）

端侧运行大语言模型（Gemma/Phi/Llama 等）：

```python
# Android Kotlin 示例（Python 端 GenAI 支持有限）
# val options = LlmInferenceOptions.builder()
#     .setModelPath("/data/local/tmp/gemma-2b-int8.task")
#     .setMaxTokens(1024)
#     .setTemperature(0.8f)
#     .setTopK(40)
#     .build()
# val llm = LlmInference.createFromOptions(context, options)
# val response = llm.generateResponse("讲个笑话")
```

支持模型：Gemma-3n（E2B/E4B）、Gemma-3 1B、Gemma-2 2B、Phi-2（含 LoRA）。GPU 加速主要在 Android；LoRA 仅兼容 GPU 模型。

> **注意**：MediaPipe LLM Inference API 已进入 maintenance-only，Google 官方建议新项目迁移到 **LiteRT-LM**（LiteRT 生态的 LLM 运行时）。

## Legacy Solutions 迁移

2023-03-01 起 `mp.solutions.*` 旧 API 停止维护，对应映射：

| Legacy Solution | 新 Tasks API |
| --- | --- |
| `mp.solutions.face_detection` | `FaceDetector` |
| `mp.solutions.face_mesh` + `iris` | `FaceLandmarker`（478 点） |
| `mp.solutions.hands` | `HandLandmarker`（21 点） |
| `mp.solutions.pose` | `PoseLandmarker`（33 点） |
| `mp.solutions.holistic` | `HolisticLandmarker` |
| `mp.solutions.selfie_segmentation` | `ImageSegmenter`（selfie 模型） |
| `mp.solutions.object_detection` | `ObjectDetector` |
| `mp.solutions.drawing_utils` | 自行用 OpenCV 绘制（无官方替代） |

旧代码典型差异：

```python
# Legacy（已废弃）
import mediapipe as mp
hands = mp.solutions.hands.Hands()
res = hands.process(img_rgb)

# Tasks API（推荐）
from mediapipe.tasks.python import vision
opts = vision.HandLandmarkerOptions(base_options=base)
with vision.HandLandmarker.create_from_options(opts) as lm:
    res = lm.detect(mp_image)
```

## Framework（C++ Graph）

进阶用户可用 MediaPipe Framework 自定义 Calculator + Graph，构建私有视觉流水线：

- **Calculator**：最小计算单元（解码/推理/渲染），C++ 实现
- **Graph**：Calculator 间的有向图（.pbtxt 配置）
- **Packet**：节点间传递的数据包
- **Stream**：实时数据流

适用于需要组合多个自定义模型、或精细控制推理调度的工业级场景。普通应用层用 Tasks API 即可，无需深入 Framework。
