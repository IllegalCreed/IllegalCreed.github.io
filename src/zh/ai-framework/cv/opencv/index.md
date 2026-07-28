---
layout: doc
---

# OpenCV

OpenCV（Open Source Computer Vision Library）是 Intel 发起、OpenCV.org 维护、Apache 基金会协同的开源计算机视觉与机器学习库，核心用 C++ 编写、官方绑定 C++/Python/Java，覆盖图像处理、视频分析、相机标定、特征提取、几何变换与深度学习推理等几乎全部传统 CV 任务。它的设计哲学是**「通用算法库 + 统一多维数组（cv::Mat）」**：所有视觉算法都以 `cv::Mat` 为数据载体，模块按职责切片（core/imgproc/imgcodecs/videoio/highgui/dnn/features2d），既能拼成端到端流水线，也能独立调用单个算子。5.0 是 2018 年以来最大的一次大版本升级：**彻底移除 legacy C API、强制 C++17、引入全新 ONNX 优先的 DNN 推理引擎（算子覆盖率从 4.x 的 23% 跃升到 80%+）、将 Calib3d 拆分为 geometry/calib/stereo/ptcloud 四模块、Features2d 重命名为 Features、并正式切换协议为 Apache 2.0**；Python 侧沿用 `cv2.&lt;func&gt;()` 调用约定、迁移成本极低。截至 2026 年 7 月，**5.0.0** 于 6 月 6 日发布、**4.14.0** 于 7 月 19 日同步发布，4.x 与 5.x 双分支并行维护（4.x 仅修 bug）。信源 docs.opencv.org/5.x 官方文档 + OpenCV 5 wiki + GitHub Releases。

## 评价

**优点**

- **算法覆盖最全**：从读图、滤波、形态学到相机标定、立体视觉、DNN 推理，传统 CV 几乎「一个库搞定」，无需在 10 个轮子里反复横跳
- **跨语言跨平台**：C++/Python/Java 官方绑定，Windows/Linux/macOS/Android/iOS 全平台，pip 一键安装，是 CV 教学与原型的事实标准
- **5.0 DNN 引擎飞跃**：ONNX 算子覆盖从 23% 跃升到 80%+，端侧/边缘部署可直接加载 PyTorch 导出的 ONNX，不再强依赖 OpenVINO/TensorRT
- **统一 cv::Mat 抽象**：所有算子共享同一数据容器，0 拷贝串联流水线，Python 侧 `numpy.ndarray` 与 `cv::Mat` 互转近乎零成本
- **性能持续优化**：5.0 引入新 DNN 引擎、G-API（Graph API）图调度与更广硬件加速（Vulkan/OpenCL/CUDA），ARM 推理较 4.x 显著提速
- **生态根基地位**：YOLO、MediaPipe、OpenVINO、许多 SDK 都以 OpenCV 作为图像 IO 与预处理底座

**缺点**

- **5.x 大版本断裂**：legacy C API 全部移除、Calib3d 拆分、Features2d 改名，老 C 代码与部分 contrib 模块需重写迁移（官方提供 4→5 迁移指南）
- **API 风格混杂**：C 时代遗留的 `cvCreate*`/`IplImage`、C++ 风格的 `cv::Mat`、函数式风格的 `cv::xxx` 三套历史层并存（5.0 终于清掉第一套）
- **DNN 模块非训练框架**：只能推理，无法训练；要做训练还得回到 PyTorch/TensorFlow
- **Python 文档滞后**：官方示例与教程长期偏 C++，Python 用法常要靠 `cv2.` 自动补全与社区博客补全
- **模块依赖膨胀**：装一个 imgproc 会拖入大量依赖；移动端常需定制编译裁剪模块
- **新特性落地慢**：5.0 的新 DNN 引擎仍处于与旧引擎并存阶段，`ENGINE_AUTO` 自动选择行为尚需观察

## 文档地址

- [OpenCV 5.x 官方文档（stable）](https://docs.opencv.org/5.x/index.html)
- [OpenCV 5 新特性 Wiki](https://github.com/opencv/opencv/wiki/OpenCV-5)
- [OpenCV 4→5 迁移指南](https://github.com/opencv/opencv/wiki/Opencv4-to-5-Migration)
- [Tutorials（5.x）](https://docs.opencv.org/5.x/d9/df8/tutorial_root.html)
- [OpenCV 5.0.0 Release](https://github.com/opencv/opencv/releases/tag/5.0.0)

## GitHub地址

[opencv/opencv](https://github.com/opencv/opencv)（核心库）/ [opencv/opencv_contrib](https://github.com/opencv/opencv_contrib)（额外模块）

## 幻灯片地址

<a href="/SlideStack/opencv-slide/" target="_blank">OpenCV</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">OpenCV 测试题</a>
