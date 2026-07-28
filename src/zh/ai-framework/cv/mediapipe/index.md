---
layout: doc
---

# MediaPipe

MediaPipe 是 Google Research 开发的**端侧（on-device）跨平台机器学习框架**，专为在移动设备、浏览器与边缘设备上低延迟运行感知类模型而设计。它的核心抽象是**「Tasks API」**——一组开箱即用的预训练解决方案（FaceLandmarker、HandLandmarker、PoseLandmarker、ObjectDetector、ImageClassifier、ImageSegmenter、GestureRecognizer、HolisticLandmarker 等），覆盖人脸/手势/姿态关键点检测、目标检测、图像分割、手势识别乃至大模型推理（LLM Inference API），统一通过 `BaseOptions(model_asset_path=)` + `Task.create_from_options()` 的范式调用，跨 Android/iOS/Web/Python/C++ 五端 API 一致。底层架构基于**有向图（Graph）+ 计算单元（Calculator）**：每个视觉流水线由若干 Calculator 节点（解码/推理/渲染）通过 Packet 数据流串联，可在 CPU/GPU/NNAPI/Core ML/EGL 多后端间无缝切换，实现实时视频流处理。**2023 年 3 月 1 日 Google 正式停止 Legacy Solutions（旧 API）支持**，全面迁移到 Tasks API：Face Mesh/Iris 合并为 FaceLandmarker、Hands 升级为 HandLandmarker、Pose 升级为 PoseLandmarker、Holistic 升级为 HolisticLandmarker，Box Tracking/Objectron/KNIFT/AutoFlip 等实验项目下线。截至 2026 年 7 月，MediaPipe 最新版 **0.10.35**（2026-04），由 google-ai-edge 团队维护，GenAI 任务（LLM Inference API）官方推荐迁移到 LiteRT-LM。信源 developers.google.com/edge/mediapipe 官方文档 + GitHub Releases。

## 评价

**优点**

- **端侧低延迟**：模型专为移动端优化，人脸/手势/姿态关键点在手机上实时 30+ FPS，无需云端往返
- **跨平台一致**：Android/iOS/Web/Python/C++ 五端 Tasks API 几乎同构，一份逻辑多处部署
- **开箱即用 Solutions**：FaceLandmarker 等 Solution 内置 Google 训练好的模型，无需自训练即可集成
- **多后端加速**：GPU（OpenGL ES/Metal）、NNAPI（Android）、Core ML（iOS）、Delegate 机制，硬件利用充分
- **图架构可扩展**：Calculator + Graph 的组合模式支持自定义节点，复用性强
- **隐私友好**：所有推理在设备本地完成，图像数据不离开设备，符合隐私合规要求

**缺点**

- **Legacy Solutions 已退役**：2023-03 起旧 API（mp.solutions.face_mesh 等）停止维护，老代码必须迁移到 Tasks API
- **自定义模型门槛高**：要训练自己的 Task 模型需走 Google 的 Model Maker + 转换流程，不如 PyTorch 直接
- **Web 端体积大**：JS/wasm 包含模型与运行时，首屏加载较重，需按需懒加载
- **GenAI 路线摇摆**：LLM Inference API 进入 maintenance-only，官方建议迁移到 LiteRT-LM，存量代码面临二次迁移
- **文档示例偏 Android/iOS**：Python/Web 端示例相对薄弱，社区资料不如 OpenCV 丰富
- **模型选择受限**：每个 Task 官方只提供有限几种预训练模型，难做架构实验

## 文档地址

- [MediaPipe 官方文档](https://developers.google.com/edge/mediapipe)
- [Solutions 总览](https://developers.google.com/edge/mediapipe/solutions/guide)
- [Tasks Python 快速开始](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/python)
- [MediaPipe Framework（C++ Graph）](https://developers.google.com/edge/mediapipe/framework)
- [Legacy Solutions 迁移指南](https://developers.google.com/edge/mediapipe/migration/legacy_solutions)

## GitHub地址

[google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)

## 幻灯片地址

<a href="/SlideStack/mediapipe-slide/" target="_blank">MediaPipe</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">MediaPipe 测试题</a>
