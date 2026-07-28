---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 OpenCV 5.0.0 官方文档（docs.opencv.org/5.x：Introduction / Tutorials / modules）+ OpenCV 5 wiki + GitHub Releases 编写，对照当前稳定版行为

## 速查

- **安装（Python）**：`pip install opencv-python`（HEADLESS 服务器用 `opencv-python-headless`）；完整 contrib 用 `pip install opencv-contrib-python`
- **安装（C++）**：5.0 起**最低 C++17**；`cmake` + `make`/`ninja`，或 `vcpkg install opencv`/`conda install -c conda-forge opencv`
- **导入**：Python `import cv2`（注意是 `cv2` 不是 `cv`）；C++ `#include &lt;opencv2/opencv.hpp&gt;`
- **读图**：`cv2.imread("a.jpg")`（默认 BGR、uint8）；写入 `cv2.imwrite("out.png", img)`
- **显示**：`cv2.imshow("win", img)` + `cv2.waitKey(0)`；脚本里务必配 `cv2.destroyAllWindows()`
- **色彩空间**：默认 **BGR**（不是 RGB！）；转换 `cv2.cvtColor(img, cv2.COLOR_BGR2RGB)`
- **视频 IO**：`cv2.VideoCapture(0)`（摄像头）/ `cv2.VideoCapture("v.mp4")`（文件）；写视频 `cv2.VideoWriter`
- **核心数据结构**：Python 侧 `cv2.imread` 返回 **numpy.ndarray**（H×W×C，BGR，uint8）；C++ 侧 `cv::Mat`
- **5.0 模块**：core / imgproc / imgcodecs / videoio / highgui / dnn / features / calib / stereo / geometry / ptcloud / gapi（G-API 从主库迁到 contrib）
- **5.0 DNN**：`cv2.dnn.readNetFromONNX("m.onnx")`；新引擎默认启用，可通过 `ENGINE_AUTO` 切换

## 安装

OpenCV 官方提供多套 Python wheel（PyPI）：

```bash
# 标准版（含 GUI，桌面环境用）
pip install opencv-python

# 无 GUI 版（服务器/Docker 推荐，依赖更少）
pip install opencv-python-headless

# 含 contrib 额外模块（SIFT 专利过期已进主库；xfeatures2d 等仍在 contrib）
pip install opencv-contrib-python
```

C++ 端 5.0 的关键前置：**C++17 编译器**（GCC ≥ 9 / Clang ≥ 8 / MSVC 2019+）与 CMake ≥ 3.10。

```bash
git clone --branch 5.0.0 https://github.com/opencv/opencv.git
cd opencv && mkdir build && cd build
cmake -D CMAKE_BUILD_TYPE=Release -D OPENCV_GENERATE_PKGCONFIG=ON ..
make -j$(nproc) && sudo make install
```

> **5.0 注意**：legacy C API（`IplImage`/`cvLoadImage` 等）全部移除，C++ 代码必须改用 `cv::Mat` 与 `cv::imread`；Python 侧 `cv2.&lt;func&gt;()` 调用约定不变。

## 验证安装

```python
import cv2
print(cv2.__version__)      # 5.0.0
print(cv2.getBuildInformation())  # 查看 CUDA/OpenCL/编译选项
```

C++ 验证：

```cpp
#include <opencv2/opencv.hpp>
#include <iostream>

int main() {
    std::cout << "OpenCV version: " << CV_VERSION << std::endl;  // 5.0.0
    return 0;
}
```

## 读写与显示图像

最基础的「读图 → 处理 → 显示 → 保存」四件套：

```python
import cv2

img = cv2.imread("input.jpg")           # BGR、uint8、H×W×C；读不到返回 None
if img is None:
    raise FileNotFoundError("读图失败")

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)   # 转灰度
cv2.imwrite("gray.png", gray)                   # 保存

cv2.imshow("source", img)
cv2.imshow("gray", gray)
cv2.waitKey(0)                                  # 等任意键；0=无限等，>0=毫秒
cv2.destroyAllWindows()
```

**三个高频踩坑**：

1. **OpenCV 默认 BGR 而非 RGB**：与 PIL/Matplotlib/PyTorch 互通前必须 `cv2.cvtColor(img, cv2.COLOR_BGR2RGB)`，否则颜色全反
2. **`imread` 默认返回 3 通道 BGR**：即使原图是 PNG 透明背景，alpha 通道默认丢失；要保留需 `cv2.imread("a.png", cv2.IMREAD_UNCHANGED)`
3. **`imread` 第二个参数**：`IMREAD_GRAYSCALE`(0) / `IMREAD_COLOR`(1, 默认) / `IMREAD_UNCHANGED`(-1)

## 视频处理

`VideoCapture` 同时支持摄像头索引（整数）与视频文件/RTSP 流（字符串）：

```python
import cv2

cap = cv2.VideoCapture(0)                # 0 = 默认摄像头
# cap = cv2.VideoCapture("video.mp4")    # 文件
# cap = cv2.VideoCapture("rtsp://...")    # 流

while True:
    ret, frame = cap.read()              # ret=False 表示读完/读失败
    if not ret:
        break
    frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cv2.imshow("live", frame_gray)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()                            # 必须释放！
cv2.destroyAllWindows()
```

写视频用 `VideoWriter`，注意 fourcc 编码与 fps/size 必须匹配：

```python
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter("out.mp4", fourcc, 30.0, (1920, 1080))
out.write(frame)
out.release()
```

## cv::Mat 与 numpy.ndarray

Python 侧 OpenCV 用 **NumPy 数组** 作为图像容器，几乎所有算子都接受/返回 ndarray：

```python
import cv2, numpy as np

img = cv2.imread("a.jpg")        # ndarray, shape=(H, W, 3), dtype=uint8
print(img.shape, img.dtype)      # (1080, 1920, 3) uint8
print(img[0, 0])                 # [B, G, R] 第一像素

roi = img[100:300, 200:500]      # NumPy 切片 = ROI（共享内存）
img[:, :, 2] = 0                 # 把 R 通道清零（原地改）
```

C++ 侧用 `cv::Mat`，Python 与 C++ 之间通过 pybind11 零拷贝互转：

| 操作 | Python（numpy） | C++（cv::Mat） |
| --- | --- | --- |
| 形状 | `img.shape` → (H, W, C) | `img.rows/cols/channels()` |
| dtype | `img.dtype` → uint8 | `img.type()` → `CV_8UC3` |
| 像素 | `img[y, x]` | `img.at&lt;cv::Vec3b&gt;(y, x)` |
| ROI | `img[y0:y1, x0:x1]` | `img(cv::Rect(x0, y0, w, h))` |

## 下一步

- 进阶用法（滤波、形态学、边缘、轮廓、特征）见「指南」
- 完整 API 速查（imread 标志、cvtColor 码、DNN 函数）见「参考」
- 想跑深度学习推理：直接跳到「指南 → DNN 模块」一节
