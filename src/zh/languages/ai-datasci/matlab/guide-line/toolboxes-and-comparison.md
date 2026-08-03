---
layout: doc
outline: [2, 3]
---

# 工具箱、绘图与对比：MATLAB 的生态与定位

> 基于进阶语言 · 核于 2026-08

## 速查

- **工具箱（Toolbox）**：MATLAB 的领域专用扩展包，是商业护城河。核心有 Signal Processing（滤波/FFT）、Control System（控制设计）、Communications（调制/信道）、Image Processing（图像）、Optimization（优化）、Statistics and ML（统计）。
- **Simulink**：基于框图的图形化建模仿真工具（独立产品，与 MATLAB 配套）——拖拽模块连线建系统模型，用于控制/通信/信号/电力，能自动生成 C/HDL 代码部署硬件，**Python 无等价替代**。
- **绘图核心**：`plot`（2D 折线）、`scatter`（散点）、`surf`/`mesh`（3D 曲面）、`imagesc`（矩阵热图）、`histogram`（直方图）、`bar`（柱状）。绘图质量高，科研论文配图常用。
- **绘图风格**：`plot(x, y, 'r--o')`（红虚线圆点）；`xlabel`/`ylabel`/`title`/`legend` 标注；`figure`/`subplot` 多图。
- **与 Python/NumPy 对照**：`A*B`→`A@B`，`A.*B`→`A*B`，`A'`→`A.T`，`inv(A)`→`np.linalg.inv`，`eig(A)`→`np.linalg.eig`，`x=A\b`→`np.linalg.solve(A,b)`。
- **MATLAB 仍占优**：Simulink（无替代）、控制/通信工程工具箱深度、API 稳定性（几十年老脚本仍能跑）、工业部署成熟度。
- **Python 占优**：开源免费、AI/深度学习生态（PyTorch/TensorFlow）、通用编程（Web/自动化/系统）、社区规模、大数据处理。
- **迁移趋势**：科研/数据科学/AI 已大规模迁向 Python；控制/通信/信号/汽车电子等工程领域 MATLAB 仍是主流（Simulink 锁定）。

## 一、核心工具箱概览

MATLAB 的工具箱是按工程领域划分的扩展包，每个工具箱提供该领域的专用函数和算法：

```matlab
% Signal Processing Toolbox —— 信号处理
fs = 1000;                    % 采样率
t = 0:1/fs:1;                 % 时间向量
x = sin(2*pi*50*t) + 0.5*randn(size(t));   % 50Hz 信号 + 噪声
[b, a] = butter(6, 100/(fs/2));            % 6 阶 Butterworth 低通滤波器
y = filter(b, a, x);                       % 滤波
X = fft(x);                                % 快速傅里叶变换

% Control System Toolbox —— 控制系统
num = [1];                   % 传递函数分子
den = [1 2 1];               % 分母（s^2 + 2s + 1）
sys = tf(num, den);          % 建立传递函数
step(sys);                   % 阶跃响应图
bode(sys);                   % 伯德图（频率响应）

% Optimization Toolbox —— 优化
x0 = [0 0];                  % 初始值
[x_opt, fval] = fminunc(@(x) x(1)^2 + x(2)^2, x0);   % 无约束最小化
```

- **工具箱是付费的**：每个工具箱单独购买，基础 MATLAB 只含核心数值计算。一个工程师全套工具箱可能价值数万元。
- **工具箱深度**：Signal Toolbox 的滤波器设计、Control Toolbox 的根轨迹/伯德图/状态空间、Communications 的调制解调/信道编码——这些算法经过几十年工业验证，Python 的 SciPy 等开源库覆盖度不如。

## 二、Simulink：MATLAB 的杀手锏

Simulink 是基于**框图（block diagram）**的图形化建模仿真环境，与 MATLAB 配套使用：

```
[输入源] → [增益] → [传递函数] → [示波器]
              ↑
         [反馈环路]
```

- **用法**：在 Simulink 界面拖拽模块（如 Step 输入、Transfer Fcn、Sum、Scope），用线连接，设置参数，点 Run 仿真。
- **应用领域**：控制系统（PID/状态空间）、通信系统（调制/信道/接收）、信号处理（滤波器组）、电力电子（电机/变流器）、汽车（动力总成/ECU）、航空（飞控）。
- **代码生成**：Simulink Coder/HDL Coder 能把模型**自动生成 C 代码或 HDL**（Verilog/VHDL），直接部署到 ECU/FPGA/DSP——这是汽车电子、航空、工业控制用 Simulink 的核心理由（手动写代码验证太慢）。
- **无开源替代**：Python 没有等价的框图建模仿真工具（有 modelica 等但生态远不如）。这是 MATLAB/Simulink 至今不可替代的根本原因。

## 三、绘图：高质量科学可视化

MATLAB 的绘图函数成熟，科研论文配图常用：

```matlab
% 2D 折线图
x = 0:0.1:2*pi;
plot(x, sin(x), 'r-', x, cos(x), 'b--');   % 红实线 + 蓝虚线
xlabel('角度 (rad)'); ylabel('幅值');
title('正弦与余弦'); legend('sin', 'cos');
grid on;

% 3D 曲面
[X, Y] = meshgrid(-2:0.1:2, -2:0.1:2);
Z = X.^2 + Y.^2;
surf(X, Y, Z);              % 3D 曲面
colorbar;

% 矩阵热图（图像/矩阵可视化）
imagesc(magic(5));          % 把矩阵画成彩色方格
colorbar; colormap(jet);

% 子图（一张 figure 多个图）
subplot(2, 2, 1); plot(x, sin(x)); title('sin');
subplot(2, 2, 2); plot(x, cos(x)); title('cos');
subplot(2, 2, 3); plot(x, tan(x)); title('tan');
```

- **`plot` 风格字符串**：`'r--o'` = 红色虚线圆点标记。第 1 字符颜色（r/g/b/c/m/y/k/w）、第 2 字符线型（-/--/:/-.）、第 3 字符标记（o/x/s/d/^）。
- **`surf` vs `mesh`**：surf 画实心曲面（带颜色填充），mesh 画网格线（透明）。
- **`imagesc`**：把矩阵每个元素按值映射成颜色——画相关性矩阵、图像、热力图最方便。
- **导出**：`exportgraphics` 或 `saveas` 导出 PDF/PNG（论文用矢量 PDF）。

## 四、MATLAB 与 Python/NumPy 深度对照

NumPy 是 Python 的「MATLAB 替代」，两者理念和语法高度相似。对照表：

| 操作 | MATLAB | Python (NumPy) | 备注 |
| --- | --- | --- | --- |
| 注释 | `%` | `#` | |
| 矩阵乘法 | `A * B` | `A @ B` 或 `np.dot(A,B)` | **Python 默认 `*` 是逐元素** |
| 逐元素乘 | `A .* B` | `A * B` | **正好相反！** |
| 转置 | `A'` | `A.T` | MATLAB 复数共轭转置，Python 仅转置 |
| 求逆 | `inv(A)` | `np.linalg.inv(A)` | |
| 解 Ax=b | `A \ b` | `np.linalg.solve(A, b)` | 别用 inv |
| 特征值 | `eig(A)` | `np.linalg.eig(A)` | |
| SVD | `svd(A)` | `np.linalg.svd(A)` | |
| 索引 | **从 1** | **从 0** | 最大差异 |
| 切片 | `A(1:3, :)` | `A[0:3, :]` | MATLAB 含 3，Python 不含 |
| 全零 | `zeros(3,4)` | `np.zeros((3,4))` | Python 用元组传形状 |
| 序列 | `1:5` | `np.arange(1,6)` | Python 不含末尾 |
| 聚合 | `sum(A)` | `A.sum()` 或 `np.sum(A)` | |
| 数组尺寸 | `size(A)` | `A.shape` | |

- **最大心智迁移点**：①**逐元素运算符号相反**（MATLAB `.*` vs Python `*`）——MATLAB 用户转 Python 最常写成 `A*B` 以为逐元素，实际是矩阵乘法报错；②**索引从 1→0**——所有索引都要减一，切片的右边界从「含」变「不含」。

## 五、选型：何时用 MATLAB，何时用 Python

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 控制/通信/信号工程 | **MATLAB** | 工具箱深度、Simulink 建模、工业验证 |
| 汽车电子/航空（代码生成） | **MATLAB/Simulink** | 自动生成 C/HDL 部署硬件，无替代 |
| 大学工程教学 | **MATLAB** | 教材传统、工具箱齐全 |
| AI/深度学习 | **Python** | PyTorch/TensorFlow 生态碾压 |
| 数据科学/统计 | **Python/R** | Pandas/CRAN 生态 |
| 大数据处理 | **Python** | Spark/Dask，MATLAB 弱 |
| Web/自动化/通用 | **Python** | MATLAB 通用编程弱 |
| 预算有限（个人/创业） | **Python** | 开源免费 |

- **现实趋势**：科研、数据科学、AI 已大规模迁向 Python（免费 + 生态）；工程领域（控制/通信/汽车/航空）MATLAB 仍是主流（Simulink 锁定 + 工业稳定性）。许多团队「研究用 Python，工程落地用 MATLAB」。
- **混合使用**：MATLAB 能调用 Python（`py.module.func()`），Python 也能调 MATLAB（MATLAB Engine API）——两个生态不是非此即彼。

## 下一步

掌握工具箱与对比后，进入[参考](../reference)速查 MATLAB 矩阵运算、与 NumPy 的对照表和易错点清单，作为后续阅读/迁移的随时查阅手册。
