---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 OpenCV 5.0.0 stable API 文档 + OpenCV 5 wiki + Release Notes（4.x→5.x）整理

## 速查

- **核心数据结构**：C++ `cv::Mat`；Python `numpy.ndarray`（HWC、BGR、uint8）
- **模块（5.0）**：core / imgproc / imgcodecs / videoio / highgui / dnn / features / calib / stereo / geometry / ptcloud / video / flann / photo
- ** imread 标志**：`IMREAD_COLOR`(1) / `IMREAD_GRAYSCALE`(0) / `IMREAD_UNCHANGED`(-1) / `IMREAD_REDUCED_COLOR_2/4/8`
- **cvtColor 码**：`COLOR_BGR2GRAY/RGB/HSV/LAB/YUV`；反向 `COLOR_GRAY2BGR`/`COLOR_RGB2BGR`
- **插值**：`INTER_NEAREST/INTER_LINEAR`(默认) / `INTER_CUBIC/INTER_AREA`(缩小) / `INTER_LANCZOS4`
- **形态学 op**：`MORPH_ERODE/DILATE/OPEN/CLOSE/GRADIENT/TOPHAT/BLACKHAT/HITMISS`
- **阈值 type**：`THRESH_BINARY/BINARY_INV/TRUNC/TOZERO/TOZERO_INV`；自适应 `ADAPTIVE_THRESH_MEAN_C/GAUSSIAN_C`
- **DNN 后端**：`DNN_BACKEND_OPENCV`(默认) / `DNN_BACKEND_CUDA` / `DNN_BACKEND_INFERENCE_ENGINE`(OpenVINO)
- **DNN 目标**：`DNN_TARGET_CPU`(默认) / `DNN_TARGET_CUDA` / `DNN_TARGET_OPENCL` / `DNN_TARGET_OPENCL_FP16`
- **findContours**：5.x/4.x 返回 `(contours, hierarchy)`；3.x 返回 `(image, contours, hierarchy)`
- **版本**：稳定版 **5.0.0**（2026-06）；4.x 同步维护 **4.14.0**（2026-07）；最低 C++17

## imread / imwrite 标志

```python
import cv2
img = cv2.imread("a.jpg", cv2.IMREAD_COLOR)         # 默认 3 通道 BGR
gray = cv2.imread("a.jpg", cv2.IMREAD_GRAYSCALE)    # 单通道
rgba = cv2.imread("a.png", cv2.IMREAD_UNCHANGED)    # 含 alpha
reduced = cv2.imread("a.jpg", cv2.IMREAD_REDUCED_COLOR_2)  # 1/2 尺寸

cv2.imwrite("out.png", img,
    [cv2.IMWRITE_PNG_COMPRESSION, 9])               # PNG 压缩 0-9
cv2.imwrite("out.jpg", img,
    [cv2.IMWRITE_JPEG_QUALITY, 95])                 # JPEG 质量 0-100
```

## cvtColor 常用码

| 源 → 目标 | 代码 |
| --- | --- |
| BGR → 灰度 | `cv2.COLOR_BGR2GRAY` |
| BGR → RGB | `cv2.COLOR_BGR2RGB` |
| BGR → HSV | `cv2.COLOR_BGR2HSV` |
| BGR → LAB | `cv2.COLOR_BGR2LAB` |
| BGR → YUV | `cv2.COLOR_BGR2YUV` |
| 灰度 → BGR | `cv2.COLOR_GRAY2BGR`（3 通道相同） |
| RGB → BGR | `cv2.COLOR_RGB2BGR` |
| HSV → BGR | `cv2.COLOR_HSV2BGR` |

> HSV 的 H 范围在 OpenCV 中是 **0–179**（不是 0–359），S/V 是 0–255，常踩坑。

## 几何变换 API

```python
cv2.resize(src, dsize, fx=, fy=, interpolation=)
cv2.warpAffine(src, M, dsize, flags=cv2.INTER_LINEAR, borderMode=)
cv2.warpPerspective(src, M, dsize)
cv2.getRotationMatrix2D(center, angle, scale)
cv2.getAffineTransform(src_3pts, dst_3pts)
cv2.getPerspectiveTransform(src_4pts, dst_4pts)
cv2.flip(src, flipCode)            # 0=垂直、1=水平、-1=双向
cv2.transpose(src)
cv2.warpPolar(src, dsize, center, maxRadius, flags)  # 极坐标
```

## 滤波 API

```python
cv2.GaussianBlur(src, (kx, ky), sigmaX, sigmaY=0)
cv2.blur(src, (kx, ky))                # 均值
cv2.medianBlur(src, ksize)             # 中值（ksize 必须正奇数）
cv2.bilateralFilter(src, d, sigmaColor, sigmaSpace)
cv2.filter2D(src, ddepth, kernel)      # 自定义卷积核
cv2.boxFilter(src, ddepth, (kx, ky))
cv2.Sobel(src, ddepth, dx, dy, ksize=3)
cv2.Laplacian(src, ddepth, ksize=3)
cv2.Canny(src, threshold1, threshold2, apertureSize=3)
```

## 形态学 API

```python
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))   # 矩形核
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5)) # 椭圆
kernel = cv2.getStructuringElement(cv2.MORPH_CROSS, (5,5))   # 十字

cv2.erode(src, kernel, iterations=1)
cv2.dilate(src, kernel, iterations=1)
cv2.morphologyEx(src, op, kernel)
# op: MORPH_ERODE/DILATE/OPEN/CLOSE/GRADIENT/TOPHAT/BLACKHAT/HITMISS
```

## 轮廓 API

```python
contours, hierarchy = cv2.findContours(
    binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# mode: RETR_EXTERNAL/RETR_LIST/RETR_CCOMP/RETR_TREE/RETR_FLOODFILL
# method: CHAIN_APPROX_SIMPLE/CHAIN_APPROX_NONE/CHAIN_APPROX_TC89_*

cv2.drawContours(img, contours, contourIdx, color, thickness)
cv2.contourArea(c)                    # 面积
cv2.arcLength(c, closed=True)         # 周长
cv2.boundingRect(c)                   # 正外接矩形
cv2.minAreaRect(c)                    # 旋转外接矩形（中心、尺寸、角度）
cv2.minEnclosingCircle(c)             # 最小外接圆
cv2.fitEllipse(c)                     # 最小外接椭圆
cv2.approxPolyDP(c, epsilon, closed)  # 多边形近似
cv2.convexHull(c)                     # 凸包
cv2.isContourConvex(c)                # 是否凸
cv2.moments(c)                        # 矩（算质心）
```

## 特征点 API

```python
# SIFT
sift = cv2.SIFT_create(nfeatures=0, nOctaveLayers=3, contrastThreshold=0.04, edgeThreshold=10, sigma=1.6)
kp, des = sift.detectAndCompute(gray, mask=None)

# ORB
orb = cv2.ORB_create(nfeatures=500, scaleFactor=1.2, nlevels=8, edgeThreshold=31, WTA_K=2)
kp, des = orb.detectAndCompute(gray, None)

# FAST（仅检测，无描述子）
fast = cv2.FastFeatureDetector_create(threshold=10)

# AKAZE
akaze = cv2.AKAZE_create()

# 匹配
bf = cv2.BFMatcher(normType=cv2.NORM_L2, crossCheck=True)   # SIFT: L2，ORB: HAMMING
flann = cv2.FlannBasedMatcher_create()                      # 近邻、更快但需 float

knn_matches = bf.knnMatch(des1, des2, k=2)
good = [m for m, n in knn_matches if m.distance < 0.75 * n.distance]  # Lowe 比率检验
```

## DNN 模块 API

```python
# 加载
net = cv2.dnn.readNetFromONNX("m.onnx")
net = cv2.dnn.readNetFromTensorFlow("f.pb")
net = cv2.dnn.readNetFromTorch("t.pt")      # TorchScript
net = cv2.dnn.readNetFromCaffe("d.prototxt", "w.caffemodel")
net = cv2.dnn.readNet("model.onnx")         # 按扩展名自动判断

# 预处理（img → NCHW blob）
blob = cv2.dnn.blobFromImage(img, scalefactor=1/255.0, size=(640,640),
                              mean=(0,0,0), swapRB=True, crop=False)
blob = cv2.dnn.blobFromImages([img1, img2], ...)   # 批量

# 推理
net.setInput(blob)
out = net.forward()
out = net.forward("output_name")            # 指定输出层名
outs = net.forward(["out0", "out1"])        # 多输出

# 后端/目标
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)   # 或 CUDA / INFERENCE_ENGINE
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)        # 或 CUDA / OPENCL / OPENCL_FP16

# 查询
layer_names = net.getLayerNames()
unconnected = net.getUnconnectedOutLayersNames()   # 末端输出层名
```

## 5.0 模块变化速查

| 4.x | 5.0 | 变化 |
| --- | --- | --- |
| `opencv_calib3d` | 拆分为 `calib`/`stereo`/`geometry`/`ptcloud` | 按职责切分；Python 调用名不变 |
| `opencv_features2d` | 重命名为 `features` | 含义扩展到深度特征 |
| `opencv_gapi` | 迁到 `opencv_contrib` | 仍在维护，但不在主库默认编译 |
| `opencv_ml` | 迁到 `opencv_contrib` | 经典机器学习（SVM/KNN/RTrees）下放 |
| legacy C API（`IplImage`/`cvLoadImage`） | **完全移除** | C++ 必须用 `cv::Mat`/`cv::imread` |
| `objdetect` Haar/HOG | 移到 contrib | 现代 DNN 检测替代 |

## 版本与兼容（4.x → 5.x）

| 版本 | 关键变化 |
| --- | --- |
| 4.4 (2020) | SIFT 专利过期，回主库；YOLOv4 支持 |
| 4.7 (2022) | DNN 大量新算子；QR Code 检测 |
| 4.8 (2023) | DNN TensorRT 后端；RISC-V 端口 |
| 4.10 (2024) | 微信扫码 WeChat QR；ArUco 进主库 |
| 4.14 (2026-07) | 4.x 维护版（与 5.0 并行） |
| **5.0.0 (2026-06)** | **legacy C API 移除**、**C++17 强制**、**新 DNN 引擎（ONNX 覆盖 23%→80%+）**、**Calib3d 拆分**、**Features2d→Features**、**协议改 Apache 2.0**、G-API/ML 迁 contrib |

升级要点：C++ 代码全面切到 `cv::` 命名空间；Python `cv2.&lt;func&gt;()` 调用约定不变，但若用到 `cv2.ml.*` / `cv2.xfeatures2d.*` 需安装 `opencv-contrib-python`；推荐生产环境锁定 `opencv-python==5.0.0.x`。

## 官方资源

- [OpenCV 5.x 文档主页](https://docs.opencv.org/5.x/index.html)
- [Tutorials 全集](https://docs.opencv.org/5.x/d9/df8/tutorial_root.html)
- [OpenCV 5 wiki](https://github.com/opencv/opencv/wiki/OpenCV-5)
- [4→5 迁移指南](https://github.com/opencv/opencv/wiki/Opencv4-to-5-Migration)
- [Release Notes](https://github.com/opencv/opencv/releases)
- [论坛 forum.opencv.org](https://forum.opencv.org/)
