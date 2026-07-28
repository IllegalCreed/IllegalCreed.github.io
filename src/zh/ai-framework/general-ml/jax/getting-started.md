---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 JAX 0.11.0 官方文档（Quickstart / JAX-101 / Installation / ndarray.at）编写，对照 docs.jax.dev 当前行为

## 速查

- **安装**：`pip install jax`（CPU）；GPU 用 `pip install -U "jax[cuda12]"`；TPU 走 `jax[tpu]`
- **Python**：要求 **≥ 3.12**（支持 3.12 / 3.13 / 3.14，含 free-threading 3 稳定版）
- **核心数组**：`jax.numpy as jnp`，API 几乎与 NumPy 一致（`jnp.zeros`、`jnp.arange`、`jnp.dot`）
- **不可变**：`x[0] = 1` 报错；用 `x = x.at[0].set(1)` 返回新数组
- **四大转换**：`jax.jit`（编译）、`jax.grad`（求导）、`jax.vmap`（批处理）、`jax.pmap`（多设备并行）
- **PRNG 显式**：`jax.random.key(0)` 生成 key；`jax.random.split(key)` 分裂；随机函数要传 key
- **纯函数**：被 jit/grad/vmap 包裹的函数不能有副作用（不能改全局、不能 print 依赖值）
- **设备**：`jnp.array(x).device()` 看所在设备；`jax.devices()` 列全部设备
- **Flax NNX**：`from flax import nnx`，`nnx.Module` 子类定义网络，`nnx.Optimizer` 管训练
- **Optax**：`optax.adam(1e-3)`、`optax.chain(optax.scale_by_adam(), optax.scale(-lr))`
- **版本**：稳定版 **0.11.0**（2026-07-16）

## 安装

```bash
# CPU
pip install jax

# NVIDIA GPU（CUDA 12，捆绑 wheel）
pip install -U "jax[cuda12]"

# Google TPU（TPU VM 环境）
pip install -U "jax[tpu]" -f https://storage.googleapis.com/jax-releases/libtpu_releases.html

# AMD GPU（Linux 实验性）/ Apple GPU（Mac 实验性）
pip install -U "jax[rocm]"     # AMD
```

> JAX 默认启用 **异步调度**（dispatch）：CPU 把计算派发到加速器后立即返回，结果在需要时才阻塞取回。所以计时要走 `x.block_until_ready()`，否则测的是 dispatch 时间而非真实计算时间。

平台矩阵（官方安装页）：Linux x86_64（CPU/GPU NVIDIA/TPU/GPU AMD/GPU Intel 实验）、Linux aarch64（CPU/GPU NVIDIA）、Mac aarch64（CPU/Apple GPU 实验）、Windows x86_64（**仅 CPU**，GPU 需 WSL2）。

## jax.numpy：不可变数组

`jax.numpy`（习惯别名 `jnp`）的 API 与 NumPy 高度同构，但数组**不可变**：

```python
import jax
import jax.numpy as jnp

x = jnp.arange(5.0)            # [0., 1., 2., 3., 4.]
print(x.dtype, x.shape)        # float32 (5,)

# NumPy 风格运算
y = jnp.dot(x, x)              # 标量
z = x + 1                      # 逐元素，返回新数组

# 不可变：以下会报错！
# x[0] = 10.0    # TypeError: JAX arrays are immutable

# 正确做法：用 .at[].set() 返回新数组
x = x.at[2].set(10.0)          # [0., 1., 10., 3., 4.]
x = x.at[1].add(5.0)           # [0., 6., 10., 3., 4.]  等价 x[1] += 5
```

`.at` 支持的更新操作：

| 方法 | 等价原地操作 |
| --- | --- |
| `.at[idx].set(y)` | `x[idx] = y` |
| `.at[idx].add(y)` | `x[idx] += y` |
| `.at[idx].multiply(y)` | `x[idx] *= y` |
| `.at[idx].min(y)` | `x[idx] = minimum(x[idx], y)` |
| `.at[idx].max(y)` | `x[idx] = maximum(x[idx], y)` |
| `.at[idx].get()` | `x = x[idx]` |
| `.at[idx].apply(ufunc)` | 在 idx 处应用 ufunc |

> 设计动机：不可变 + 纯函数让 JAX 能安全追踪计算、做 XLA 编译与自动微分；原地改会破坏「同一输入总产生同一输出」的保证。

## 四大转换

### jax.jit：XLA 编译

把函数编译成 XLA 内核，融合算子、消除 Python 调度开销：

```python
import jax

def selu(x, alpha=1.67, lam=1.05):
    return lam * jnp.where(x > 0, x, alpha * jnp.exp(x) - alpha)

selu_jit = jax.jit(selu)            # 作为高阶函数
# 或装饰器
@jax.jit
def selu_jit2(x):
    return selu(x)

x = jnp.arange(1_000_000.0)
selu_jit(x)                         # 首次调用编译（有预热开销），之后极快
```

- `static_argnums`/`static_argnames`：把非数组参数（如超参）当编译期常量
- **限制**：被 jit 的函数对 shape/dtype 敏感的 Python 控制流会被特化；动态 shape 控制流要用 `jax.lax.cond`/`jax.lax.scan`

### jax.grad：任意阶自动微分

对**标量输出**的函数求反模梯度；嵌套即可求高阶：

```python
def f(x):
    return jnp.sin(x)

df = jax.grad(f)                    # 一阶
d2f = jax.grad(jax.grad(f))         # 二阶
d3f = jax.grad(jax.grad(jax.grad(f)))   # 三阶

print(df(1.0), d2f(1.0), d3f(1.0))  # cos(1), -sin(1), -cos(1)
```

- 原生可微 Python 控制流（`for`/`if`/闭包）
- 向量输出要传 `jax.jacfwd`/`jax.jacrev`（雅可比）或 `jax.grad(lambda x: loss(x).sum())`
- `jax.value_and_grad(f)` 同时返回值与梯度

### jax.vmap：自动向量化批处理

把「处理单个样本」的函数自动批量化，避免手写 batch 维：

```python
def vec_dot(v, w):
    return jnp.vdot(v, w)           # 处理一对向量

batched_dot = jax.vmap(vec_dot, in_axes=(0, 0))   # 沿第 0 维批处理
A = jnp.ones((100, 3))
B = jnp.ones((100, 3))
batched_dot(A, B).shape             # (100,) —— 100 个内积结果
```

`in_axes` 指定每个输入沿哪个轴做批处理（`None` 表示广播不批处理）。

### jax.pmap：多设备并行

把函数复制到多个设备（GPU/TPU core）上 SPMD 并行：

```python
n_devices = jax.device_count()
x = jnp.arange(n_devices * 4).reshape(n_devices, 4)   # 每设备一片

@jax.pmap
def square(x):
    return x ** 2

square(x)        # 每个设备并行算自己的片，结果留在各设备上
```

- `pmap` 要求第 0 维恰好等于设备数
- 配合 `jax.lax.pmean`/`psum` 做跨设备规约（数据并行训练标准模式）

### 组合：jit(vmap(grad(f)))

四大变换可任意嵌套，这是 JAX 最具表达力的特性：

```python
# 编译后的、批处理的、可微的函数
f = jax.jit(jax.vmap(jax.grad(loss_fn)))
```

## PRNG：显式随机状态

JAX 强制把 PRNG 状态（key）作为显式参数传递，不在全局藏状态——这是可复现与可并行的关键：

```python
from jax import random

key = random.key(0)                         # 主 key
key, subkey1, subkey2 = random.split(key, 3)  # 分裂成 3 份

a = random.normal(subkey1, (3,))            # 必须传 key
b = random.uniform(subkey2, (3,), minval=0, maxval=1)
```

- 同一 key 永远产生同一序列（完全可复现）
- 并行时各线程/设备拿不同 subkey，互不干扰
- 老接口 `random.PRNGKey(0)` 仍可用，新代码推荐 `random.key(0)`

## Flax NNX：第一个神经网络

Flax 新版 **NNX API** 提供引用语义（比旧 Linen 的函数式更接近 PyTorch 体验，但底层仍是 JAX 纯函数）：

```python
from flax import nnx
import optax

class MLP(nnx.Module):
    def __init__(self, din, dout, rngs):
        self.fc1 = nnx.Linear(din, 64, rngs=rngs)
        self.fc2 = nnx.Linear(64, dout, rngs=rngs)

    def __call__(self, x):
        return self.fc2(nnx.relu(self.fc1(x)))

model = MLP(2, 3, rngs=nnx.Rngs(0))         # 直接得到可变 model 对象
optimizer = nnx.Optimizer(model, optax.adam(1e-3))

logits = model(jnp.ones((1, 2)))            # 像普通对象那样前向
```

> 旧版 **Linen API**（`flax.linen as nn`、`@nn.compact`、`model.init(rng, x)`/`model.apply(params, x)`）仍可用且不会被很快弃用，但官方新代码与文档主推 NNX。两种 API 可互转。

## 下一步

入门到此覆盖了 jnp 不可变数组、四大转换、PRNG、Flax NNX。下一步见「指南」：

- **自动微分深入**：`jax.jacfwd`/`jax.jacrev`（前向/反向模式雅可比）、`jax.hessian`、`jax.checkpoint`（梯度检查点省显存）
- **控制流原语**：`jax.lax.scan`（可微循环）、`jax.lax.cond`/`while_loop`/`switch`
- **Pytree**：嵌套 dict/list 的参数树用 `jax.tree_util` 统一映射
- **Optax 进阶**：`optax.chain` 组合梯度变换、学习率调度 `optax.schedules`
- **分布式**：`jax.pmap` 数据并行、`jax.sharding.Mesh` + `jax.lax.pjit`（全局数组 SPMD）
