---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 OpenCV 5.0.0 官方文档（imgproc / features / dnn / video / calib 模块）+ OpenCV 5 wiki + Tutorials 编写

## 速查

- **色彩空间**：`cv2.cvtColor(src, code)`，常用 `COLOR_BGR2GRAY` / `COLOR_BGR2RGB` / `COLOR_BGR2HSV` / `COLOR_BGR2LAB`
- **几何变换**：缩放 `cv2.resize`、旋转 `cv2.getRotationMatrix2D` + `cv2.warpAffine`、透视 `cv2.getPerspectiveTransform` + `cv2.warpPerspective`
- **线性滤波**：`cv2.GaussianBlur(img, (k,k), sigma)`（高斯）、`cv2.blur`（均值）、`cv2.boxFilter`
- **非线性滤波**：`cv2.medianBlur(img, k)`（中值，去椒盐）、`cv2.bilateralFilter`（双边，保边去噪）
- **形态学**：`cv2.erode/dilate/morphologyEx`，op=`MORPH_OPEN/CLOSE/GRADIENT/TOPHAT/BLACKHAT`
- **边缘检测**：`cv2.Canny(img, low, high)`（最常用）；Sobel/Laplacian 算梯度
- **阈值**：`cv2.threshold(gray, t, max, THRESH_BINARY)`；自适应 `cv2.adaptiveThreshold`
- **轮廓**：`cv2.findContours` → `cv2.drawContours`；属性 `cv2.contourArea/boundingRect/arcLength`
- **特征点**：SIFT `cv2.SIFT_create()` / ORB `cv2.ORB_create()`；匹配 `cv2.BFMatcher`/`FlannBasedMatcher`
- **DNN 推理**：`cv2.dnn.readNetFromONNX` → `blobFromImage` → `net.setInput` → `net.forward`
- **5.0 DNN 新引擎**：默认启用，ONNX 算子覆盖率 >80%；`ENGINE_AUTO` 智能选择

## 图像滤波

### 高斯模糊（线性、平滑）

```python
import cv2
blurred = cv2.GaussianBlur(img, (5, 5), sigmaX=0)   # 核大小必须是正奇数
```

用途：降噪预处理、下采样前抗混叠、传统 CV 流水线标准件。

### 中值滤波（非线性、去椒盐噪声）

```python
denoised = cv2.medianBlur(img, 5)   # k=3/5/7，对椒盐盐噪声效果碾压高斯
```

### 双边滤波（保边去噪）

```python
smooth = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)
# 在平滑的同时保留边缘，常用于美颜、卡通化
```

| 滤波 | 是否保边 | 速度 | 典型场景 |
| --- | --- | --- | --- |
| GaussianBlur | 否 | 最快 | 通用平滑、抗混叠 |
| medianBlur | 部分 | 快 | 椒盐噪声 |
| bilateralFilter | 是 | 最慢 | 美颜、保边降噪 |

## 形态学操作

形态学基于二值图（或灰度图）+ 结构元素，常用于去除噪点、连接断裂、提取边界：

```python
import cv2, numpy as np
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
kernel = np.ones((5, 5), np.uint8)

eroded  = cv2.erode(binary, kernel, iterations=1)        # 腐蚀：缩小白区
dilated = cv2.dilate(binary, kernel, iterations=1)       # 膨胀：扩大白区
opened  = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)   # 开运算 = 腐蚀+膨胀，去小白点
closed  = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)  # 闭运算 = 膨胀+腐蚀，填小黑洞
grad    = cv2.morphologyEx(binary, cv2.MORPH_GRADIENT, kernel)  # 梯度 = 膨胀-腐蚀，提取边缘
```

## 边缘检测：Canny

Canny 是最经典的「最佳边缘检测」算法，含高斯平滑 + Sobel 梯度 + 非极大抑制 + 双阈值滞后：

```python
edges = cv2.Canny(img, threshold1=100, threshold2=200)
# 建议先转灰度：edges = cv2.Canny(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 100, 200)
```

**双阈值含义**：梯度 > high 一定是边缘、< low 一定不是、介于两者之间则看是否与确定边缘连通。

## 几何变换

```python
import cv2

# 缩放
resized = cv2.resize(img, (640, 480))           # 指定目标尺寸
resized = cv2.resize(img, None, fx=0.5, fy=0.5) # 按比例
# 插值：默认 INTER_LINEAR；放大用 INTER_CUBIC/INTER_LINEAR；缩小用 INTER_AREA

# 旋转（绕中心、缩放=1）
h, w = img.shape[:2]
M = cv2.getRotationMatrix2D((w/2, h/2), angle=45, scale=1.0)
rotated = cv2.warpAffine(img, M, (w, h))

# 仿射（3 点对）
src = np.float32([[50,50],[200,50],[50,200]])
dst = np.float32([[10,100],[200,50],[100,250]])
M = cv2.getAffineTransform(src, dst)
warped = cv2.warpAffine(img, M, (w, h))

# 透视（4 点对）
M = cv2.getPerspectiveTransform(src4, dst4)
bird = cv2.warpPerspective(img, M, (w, h))      # 文档扫描、车牌校正常用
```

## 轮廓检测

```python
import cv2
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# 5.x：cv2.findContours 仅返回 (contours, hierarchy)，不再返回 image
contours, hierarchy = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# 绘制
out = img.copy()
cv2.drawContours(out, contours, -1, (0, 255, 0), 2)

# 计算属性
for c in contours:
    area = cv2.contourArea(c)
    x, y, w, h = cv2.boundingRect(c)
    rect = cv2.minAreaRect(c)                          # 旋转外接矩形
    perimeter = cv2.arcLength(c, True)                 # 周长
    approx = cv2.approxPolyDP(c, 0.02 * perimeter, True)  # 多边形近似
    (x, y), radius = cv2.minEnclosingCircle(c)         # 最小外接圆
```

> **版本差异**：OpenCV 3.x 的 `findContours` 返回 3 个值 `(img, contours, hierarchy)`；4.x 与 5.x 都是 2 个 `(contours, hierarchy)`。

## 特征点检测与匹配

### SIFT（Scale-Invariant Feature Transform）

SIFT 专利 2020 年已过期，OpenCV 4.4+ 起回到主库 `cv2.SIFT_create()`：

```python
sift = cv2.SIFT_create()
kp, des = sift.detectAndCompute(gray, None)    # des: (N, 128) float32
out = cv2.drawKeypoints(img, kp, None)
```

特点：尺度/旋转/光照不变，特征描述子 128 维；速度慢于 ORB。

### ORB（Oriented FAST + Rotated BRIEF）

```python
orb = cv2.ORB_create(nfeatures=1000)
kp, des = orb.detectAndCompute(gray, None)     # des: (N, 32) uint8
```

特点：免费、快、二进制描述子；适合实时与移动端。

### 特征匹配

```python
bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)   # SIFT 用 L2；ORB 用 NORM_HAMMING
matches = bf.match(des1, des2)
matches = sorted(matches, key=lambda m: m.distance)[:30]
out = cv2.drawMatches(img1, kp1, img2, kp2, matches, None)
```

## DNN 模块（深度学习推理）

5.0 的新 DNN 引擎大幅扩展了 ONNX 算子覆盖（23% → 80%+），可直接跑 PyTorch/TF 导出的 ONNX：

```python
import cv2, numpy as np

# 1. 加载模型（5.0 新引擎默认启用）
net = cv2.dnn.readNetFromONNX("model.onnx")
# 也可 readNetFromTensorFlow / readNetFromTorch / readNetFromCaffe

# 2. 预处理：图片 → NCHW blob
blob = cv2.dnn.blobFromImage(
    img, scalefactor=1/255.0, size=(640, 640),
    mean=(0, 0, 0), swapRB=True, crop=False
)

# 3. 推理
net.setInput(blob)
output = net.forward()                       # 取首输出层
# output = net.forward(["output0", "output1"])  # 多输出层命名

# 4. 设备切换
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
# 可选 CUDA：DNN_BACKEND_CUDA + DNN_TARGET_CUDA
```

**blobFromImage 的含义**：把 HWC 的 ndarray 变成 NCHW 的 4 维 blob，同时完成 resize / 减均值 / 缩放 / 通道交换（BGR→RGB），是 DNN 预处理的标准一步。

**5.0 新引擎切换**：

```python
net = cv2.dnn.readNetFromONNX("m.onnx")
net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
# ENGINE_AUTO 让 OpenCV 自动选新引擎或经典引擎
```

## G-API（Graph API）

5.0 将 G-API 从主库迁到 `opencv_contrib`，它把多个传统算子组合成图、统一调度、零拷贝串联：

```cpp
// C++ 示例：一张图完成 均值模糊 + Canny
cv::GMat in;
cv::GMat blurred = cv::gapi::medianBlur(in, 3);
cv::GMat edges   = cv::gapi::Canny(blurred, 100, 200);
cv::GComputation pipeline(cv::GIn(in), cv::GOut(edges));
```

Python 端 G-API 支持有限，多数项目仍直接链式调用普通算子。

## 相机标定（指路）

calib3d 在 5.0 被拆分为 4 个模块：`calib`（标定核心）/ `stereo`（立体）/ `geometry`（几何）/ `ptcloud`（点云）。典型流程：`findChessboardCorners` → `cornerSubPix` → `calibrateCamera` → `undistort`。详见「参考 → calib 模块」与官方 tutorials。
