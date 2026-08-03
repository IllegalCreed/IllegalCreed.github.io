---
layout: doc
outline: [2, 3]
---

# 参考：MATLAB 速查、与 NumPy 对照、易错点

> 基于进阶语言 · 核于 2026-08

## 速查

- **定位**：以矩阵为基本数据单元的数值计算语言，工程/科学计算标准，商业闭源（MathWorks）。
- **核心范式**：一切皆矩阵，运算天然作用于整体（`A*B` 是矩阵乘法），向量化替代循环。
- **点号规则**：带 `.` 是逐元素（`.*` `./` `.^`），不带是矩阵运算（`*` `/` `^`）。
- **索引**：从 1 开始（非 0），`A(i,j)` 取元素，`A(:,k)` 取第 k 列，`A(k,:)` 取第 k 行。
- **解方程**：`x = A \ b`（左除，推荐，比 inv 稳定快）。
- **工具箱**：Signal/Control/Communications/Image/Optimization（付费）+ Simulink（框图建模，无开源替代）。
- **与 Python 最大迁移点**：①`A*B` 含义相反（MATLAB 矩阵乘 vs Python 逐元素乘）；②索引 1→0。

## 一、矩阵运算速查

| 操作 | MATLAB 写法 | 说明 |
| --- | --- | --- |
| 构造矩阵 | `[1 2; 3 4]` | 分号换行，空格/逗号分隔 |
| 全零/全一/单位 | `zeros(m,n)` / `ones(m,n)` / `eye(n)` | |
| 随机 | `rand(m,n)` | 均匀分布 [0,1) |
| 序列 | `1:5` / `0:0.1:1` | [1 2 3 4 5] / 步长 0.1 |
| 矩阵乘法 | `A * B` | 按数学规则 |
| 逐元素乘 | `A .* B` | 对应位置 |
| 转置 | `A'` | 复数共轭转置 |
| 矩阵幂 | `A ^ 2` | A*A |
| 逐元素幂 | `A .^ 2` | 每元素平方 |
| 求逆 | `inv(A)` | 尽量用 \ 替代 |
| 解 Ax=b | `A \ b` | 左除，推荐 |
| 行列式 | `det(A)` | |
| 迹 | `trace(A)` | 对角线之和 |
| 特征值 | `eig(A)` | `[V,D]=eig(A)` 返回向量+值 |
| LU 分解 | `[L,U,P]=lu(A)` | |
| QR 分解 | `[Q,R]=qr(A)` | |
| SVD | `[U,S,V]=svd(A)` | |
| 求和/均值 | `sum(A)` / `mean(A)` | 默认按列 |
| 最大/最小 | `max(A)` / `min(A)` | |
| 累加/差分 | `cumsum(A)` / `diff(A)` | |
| 矩阵尺寸 | `[m,n]=size(A)` | |
| 长度 | `length(A)` | 最大维长度 |

## 二、索引速查（从 1 开始）

| 操作 | 写法 | 说明 |
| --- | --- | --- |
| 第 i 行第 j 列 | `A(i, j)` | 从 1 开始 |
| 第 k 行 | `A(k, :)` | `:` 是全部列 |
| 第 k 列 | `A(:, k)` | `:` 是全部行 |
| 子矩阵 | `A(1:3, 2:4)` | 1-3 行、2-4 列 |
| 最后一行/列 | `A(end, :)` / `A(:, end)` | `end` 是末尾 |
| 反转 | `A(end:-1:1, :)` | 步长 -1 反转行 |
| 逻辑索引 | `A(A > 5)` | 筛选大于 5 的元素 |

## 三、绘图函数速查

| 函数 | 用途 | 示例 |
| --- | --- | --- |
| `plot` | 2D 折线 | `plot(x, y, 'r--o')` |
| `scatter` | 散点 | `scatter(x, y)` |
| `surf` | 3D 曲面 | `surf(X, Y, Z)` |
| `mesh` | 3D 网格 | `mesh(X, Y, Z)` |
| `imagesc` | 矩阵热图 | `imagesc(A); colorbar` |
| `histogram` | 直方图 | `histogram(data, 20)` |
| `bar` | 柱状图 | `bar([1 2 3])` |
| `subplot` | 子图 | `subplot(2,2,1); plot(...)` |
| `xlabel`/`ylabel`/`title` | 标注 | |
| `legend` | 图例 | `legend('sin','cos')` |
| `grid on` | 网格 | |
| `figure` | 新建图窗 | `figure(2)` |

## 四、与 Python/NumPy 对照表

| 概念 | MATLAB | Python (NumPy) |
| --- | --- | --- |
| 注释 | `%` | `#` |
| 矩阵乘 | `A * B` | `A @ B` |
| 逐元素乘 | `A .* B` | `A * B` |
| 索引起点 | 1 | 0 |
| 切片右界 | 包含 | 不包含 |
| 转置 | `A'` | `A.T` |
| 求逆 | `inv(A)` | `np.linalg.inv(A)` |
| 解方程 | `A \ b` | `np.linalg.solve(A, b)` |
| 全零 | `zeros(3,4)` | `np.zeros((3,4))` |
| 序列 | `1:5` | `np.arange(1,6)` |
| 求和 | `sum(A)` | `np.sum(A)` 或 `A.sum()` |
| 形状 | `size(A)` | `A.shape` |
| 价格 | 商业付费 | 开源免费 |

## 五、易错点清单

- **「`A * B` 是逐元素乘」**：错！MATLAB 中 `A * B` 是**矩阵乘法**，逐元素乘要写 `A .* B`（带点）。这是 MATLAB 与 Python（`A*B` 默认逐元素）最大的差异。
- **「索引从 0 开始」**：错。MATLAB 索引**从 1 开始**（继承自 Fortran）。`A(1)` 是第一个元素，`A(0)` 会报错。Python/JS 才从 0 开始。
- **「`A^2` 和 `A.^2` 一样」**：错。`A^2` 是矩阵幂（A*A），`A.^2` 是逐元素平方。对非方阵 `A^2` 报错，`A.^2` 合法。
- **「求逆 `inv(A)*b` 是解方程的最佳方式」**：错。应优先用 `A \ b`（左除），它内部选最优分解，更快更稳定。求逆会放大舍入误差。
- **「循环不用预分配也行」**：大错。未预分配（`x=[]` 然后 `x(i)=...`）每次循环都扩容+拷贝，O(n²) 复杂度慢几个数量级。必须 `x=zeros(n,1)` 预分配。
- **「`sum(A)` 是全部元素之和」**：不一定。对矩阵，`sum(A)` 默认是**每列求和**（返回行向量）。全部求和要 `sum(A,'all')` 或 `sum(sum(A))`。
- **「转置用 `.'` 和 `'` 一样」**：实数矩阵一样，但**复数矩阵** `'` 是共轭转置（虚部变号），`.'` 才是纯转置（不变号）。信号处理常踩这个坑。
- **「MATLAB 是免费/开源的」**：错。MATLAB 是**商业闭源**软件，需付费许可证（且每个工具箱单独付费）。Python/R 才开源免费。
- **「向量化只是为了代码简洁」**：不只是。向量化**性能远超循环**——底层调 LAPACK/BLAS（C/Fortran 编译），而循环是解释执行（即使有 JIT 仍慢）。
- **「`length(A)` 返回矩阵的总元素数」**：错。`length(A)` 返回**最大维度的长度**（max(size(A))）。总元素数是 `numel(A)`。
- **「MATLAB 适合做 AI/深度学习」**：相对弱。虽有 Deep Learning Toolbox，但远不如 Python 的 PyTorch/TensorFlow 生态丰富和主流。AI 选 Python。

## 六、MATLAB 在工程领域的定位

| 领域 | MATLAB/Simulink 角色 | 替代可能 |
| --- | --- | --- |
| 控制系统 | 主流（PID/状态空间设计） | Python（control 库）较新 |
| 通信系统 | 主流（调制/信道仿真） | 较难替代 |
| 信号处理 | 主流（滤波/FFT/小波） | Python（SciPy）可替代 |
| 汽车电子 | Simulink 代码生成，**锁定** | 几乎无替代 |
| 航空航天 | Simulink 飞控建模 | 几乎无替代 |
| 图像处理 | Image Toolbox 成熟 | Python（OpenCV/scikit-image）已超越 |
| AI/深度学习 | 弱 | Python 碾压 |
| 数据科学 | 弱 | Python/R 主流 |

## 权威链接

- [MATLAB 官方文档](https://www.mathworks.com/help/matlab/)
- [MathWorks 官网](https://www.mathworks.com/)
- [NumPy for MATLAB users — 官方对照表](https://numpy.org/doc/stable/user/numpy-for-matlab-users.html)
- [MATLAB OnRamp（免费入门课程）](https://matlabacademy.mathworks.com/)
- [Simulink 官方文档](https://www.mathworks.com/help/simulink/)
- 本站幻灯片：<a href="/SlideStack/matlab-slide/" target="_blank">MATLAB</a>
