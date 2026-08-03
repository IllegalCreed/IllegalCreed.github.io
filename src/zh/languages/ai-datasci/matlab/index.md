---
layout: doc
---

# MATLAB

**MATLAB**（Matrix Laboratory）是**以矩阵为基本数据单元**的高级数值计算语言与环境——它的核心思想是「**一切皆矩阵**」：标量是 1×1 矩阵，向量是 1×n 矩阵，图像是 m×n×3 矩阵。MATLAB 由 Cleve Moler 在 1970 年代末设计（1984 年由 MathWorks 公司商业化），最初是为让学生不必写 Fortran 就能用 LINPACK/EISPACK 矩阵库，如今已成为**工程计算、科学计算、信号处理、控制系统、通信、图像处理**领域的事实标准。它的最大优势是**「矩阵运算 + 向量化编程」原生内置**——写 `C = A * B` 直接是矩阵乘法（无需嵌套循环），配合丰富的**工具箱（Toolbox）**（信号/控制/通信/统计/优化等）和强大的绘图能力，让工程师「写少量代码完成复杂仿真」。MATLAB 是**商业闭源软件**（需付费许可证，价格昂贵），这与 Python/R 的开源免费形成鲜明对比，也是它近年流失市场的根源。

MATLAB 的全部考点围绕**「矩阵优先的编程范式」**展开：①**矩阵运算为核心**——加减乘除、转置、求逆、特征值、矩阵分解（LU/QR/SVD），所有运算天然作用于整个矩阵而非逐元素循环；②**向量化编程**——用矩阵/向量运算替代 for 循环（`C = A .* B` 逐元素乘、`sum(A)` 求和），代码简洁且快（底层调 LAPACK/BLAS，C/Fortran 级性能）；③**工具箱生态**——Signal/Control/Communications/Image/Statistics/Optimization 等领域专用工具箱是 MATLAB 的护城河；④**绘图**——`plot`/`surf`/`imagesc` 等高质量可视化，科研论文配图常用；⑤**与 Python/NumPy 对比**——NumPy 是 Python 的「MATLAB 替代」，语法和理念高度相似（NumPy 的 ndarray 对应 MATLAB 的矩阵），但 Python 开源免费且 AI 生态更强，MATLAB 在工具箱深度和工程稳定性上仍有优势。**适用场景**：信号处理、控制系统设计、通信仿真、机器人、汽车电子（Simulink 建模）、航空航天——这些工程领域 MATLAB/Simulink 仍是教学与工业首选。

## 评价

**优点**

- **矩阵优先，向量化天然**：`A*B` 直接是矩阵乘法，无需循环；向量化代码简洁且快（底层 LAPACK/BLAS）
- **工具箱生态深厚**：Signal/Control/Communications/Image/Optimization 等领域工具箱经过几十年打磨，覆盖工程计算全场景
- **Simulink 不可替代**：基于框图的系统建模与仿真（控制/通信/信号/电力），代码生成直接部署到硬件（dSPACE/PLC），汽车/航空工业标配
- **绘图质量高**：plot/surf/imagesc 等绘图函数成熟，科研论文配图方便
- **工程稳定性强**：商业软件有专业团队维护，API 稳定（几十年老脚本仍能跑），适合工业生产环境

**缺点**

- **商业闭源，价格昂贵**：需付费许可证（学校/企业版动辄数万），是开源 Python/R 的最大劣势
- **通用编程能力弱**：MATLAB 擅长数值计算，但字符串处理、文件 IO、Web、系统编程远不如 Python
- **生态封闭**：只能在 MATLAB 环境运行，部署需购买 MATLAB Runtime；开源社区和第三方库远少于 Python
- **性能瓶颈**：向量化运算快，但解释执行的循环慢（JIT 有改善但仍不如编译型语言）；大数据处理弱
- **AI/深度学习落后**：虽有 Deep Learning Toolbox，但远不如 Python 的 PyTorch/TensorFlow 生态

## 本叶地图

- [入门](./getting-started) —— MATLAB 定位、矩阵为核心的设计、向量化编程、工具箱、与 Python 对比
- [矩阵运算与向量化](./guide-line/matrix-and-vectorization) —— 矩阵加减乘除、逐元素运算（.）、矩阵分解、向量化替代循环
- [工具箱、绘图与对比](./guide-line/toolboxes-and-comparison) —— Signal/Control 工具箱、plot/surf 绘图、与 Python/NumPy 深度对比
- [参考](./reference) —— MATLAB 矩阵运算速查、与 NumPy 对照表、绘图函数清单、易错点

## 幻灯片地址

<a href="/SlideStack/matlab-slide/" target="_blank">MATLAB</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=MATLAB" target="_blank" rel="noopener noreferrer">MATLAB 测试题</a>
