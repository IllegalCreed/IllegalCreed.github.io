---
layout: doc
---

# JAX

JAX 是 Google 主导的 Python 数值计算与机器学习框架，定位为「面向加速器的数组计算与程序变换系统」。它的核心不是某一种算法，而是**一套可组合的函数变换（function transformations）**：`jax.jit`（XLA 编译加速）、`jax.grad`（任意阶自动微分）、`jax.vmap`（自动向量化批处理）、`jax.pmap`（多设备并行）。JAX 采用严格的**函数式编程模型**——数组不可变（无法 `x[0]=1` 原地改，要用 `x.at[0].set(1)` 返回新数组）、函数必须是纯函数（无副作用）、随机数显式传递 PRNG key（`jax.random.PRNGKey(0)`，状态不藏全局）。这一切设计的回报是：同一份 Python/NumPy 风格代码可在 CPU/GPU/TPU 上经 XLA 编译高性能执行，且变换可任意嵌套（`jit(vmap(grad(f)))` 一行即可得到「编译后的批处理梯度」）。围绕核心，生态提供 **Flax**（神经网络库，新版 NNX API 提供引用语义）、**Optax**（可组合的梯度变换/优化器库）等。JAX 与 PyTorch 的根本差异在于**函数式 vs 面向对象**：JAX 把状态（参数）作为显式参数传递，PyTorch 把状态藏在 `nn.Module` 实例里。截至 2026 年 7 月，JAX 稳定版为 **0.11.0**（2026-07-16 发布），文档已迁移至 docs.jax.dev。信源 docs.jax.dev + flax.readthedocs.io。

## 评价

**优点**

- **可组合变换**：`jit`/`grad`/`vmap`/`pmap` 可任意嵌套，`jit(vmap(grad(f)))` 一行表达复杂优化，PyTorch 无此级别的正交性
- **任意阶自动微分**：`jax.grad` 嵌套即可求二阶、三阶乃至任意阶导数，且原生支持 Python 控制流（循环/分支/闭包）可微
- **XLA 编译跨硬件**：同一份代码在 CPU/GPU/TPU 上编译执行，TPU 原生一等支持（PyTorch 的 TPU 支持远不如 JAX 原生）
- **函数式纯函数模型**：状态显式、无副作用，代码更易推理、可复现、易并行——调试与重构时心智负担低
- **生态高质量**：Flax（NNX）、Optax、Chex、Orbax 等库由 Google 维护，与 JAX 核心深度协同
- **数值与 NumPy 同构**：`jax.numpy` API 几乎与 NumPy 一致，迁移成本低

**缺点**

- **函数式学习曲线陡**：不可变数组、显式 PRNG、纯函数约束对习惯 PyTorch OOP 的开发者反直觉，初期踩坑多
- **不支持原地操作**：所有更新返回新数组，对算法实现有约束（如 in-place 累加要改写）；调试时也无法像 PyTorch 那样 `print` 中间张量看副作用
- **控制流受限**：`jit` 下不能随便用 Python `for/if`（需用 `lax.scan`/`lax.cond` 或 `jax.control_flow` 的可微等价物）
- **生态规模小于 PyTorch**：Hugging Face 等上游仍以 PyTorch 为一等公民，JAX 适配常滞后；预训练权重多为 PyTorch 格式
- **调试体验不如 eager**：`jit` 编译后报错栈深、定位难；shape 推理错误信息有时晦涩
- **Windows GPU 支持弱**：原生 Windows 仅 CPU，GPU 需走 WSL2（实验性），不如 PyTorch 的原生 Windows CUDA

## 文档地址

- [JAX 官方文档（docs.jax.dev）](https://docs.jax.dev/en/latest/)
- [JAX 101 教程（transformations 详解）](https://docs.jax.dev/en/latest/jax-101/index.html)
- [Installation Guide（CPU/GPU/TPU）](https://docs.jax.dev/en/latest/installation.html)
- [JAX PyPI（版本与平台支持）](https://pypi.org/project/jax/)

## GitHub地址

[jax-ml/jax](https://github.com/jax-ml/jax)

## 幻灯片地址

<a href="/SlideStack/jax-slide/" target="_blank">JAX</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=JAX" target="_blank" rel="noopener noreferrer">JAX 测试题</a>
