---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 JAX 0.11.0 官方文档（Autodiff / Pytrees / Control flow / Pmap / Profiler）+ Flax NNX 文档 + Optax 文档编写

## 速查

- **任意阶导数**：`jax.grad` 嵌套即可；标量函数专用，向量输出用 `jax.jacfwd`/`jax.jacrev`
- **雅可比**：`jax.jacfwd`（前向模式，输出多时省）、`jax.jacrev`（反向模式，输入多时省）；二者组合得 Hessian
- **Hessian**：`jax.hessian(f)(x)` = `jax.jacfwd(jax.jacrev(f))(x)`
- **梯度检查点**：`jax.checkpoint`（旧名 `jax.remat`）用重算换显存，大模型训练必备
- **可微控制流**：`jax.lax.scan`（可微 for 累加）、`jax.lax.cond`（可微 if）、`jax.lax.while_loop`（不可微）、`jax.lax.switch`
- **Pytree**：嵌套 dict/list/tuple 的参数树；`jax.tree_util.tree_map(f, tree)` 递归映射叶子
- **Optax 链**：`optax.chain(optax.scale_by_adam(), optax.scale(-lr))`；`optax.adam`/`sgd`/`adamw` 是预设
- **学习率调度**：`optax.warmup_cosine_decay_schedule`、`optax.exponential_decay`
- **Flax NNX**：`nnx.Module` + `nnx.Optimizer(model, tx)` + `nnx.value_and_grad` 训练循环
- **数据并行**：`jax.pmap` + `jax.lax.pmean` 跨设备平均梯度
- **全局数组**：`jax.sharding.Mesh` + `PositionalSharding` + `jax.lax.pjit`/`jax.jit` 的 `in_sharding`
- **调试**：`jax.disable_jit()` 关编译看副作用；`jax.debug.print`（jit 内可打印）

## 自动微分深入

### 标量梯度与高阶导

```python
def loss(w):
    return jnp.sum((w - jnp.array([1.0, 2.0])) ** 2)

g = jax.grad(loss)(jnp.array([0.0, 0.0]))   # 一阶：2*(w - target)
h = jax.hessian(loss)(jnp.array([0.0, 0.0]))  # 二阶：2*I
```

### 雅可比：前向 vs 反向

| API | 模式 | 复杂度 | 适用 |
| --- | --- | --- | --- |
| `jax.jacfwd(f)` | 前向模式 | O(输入维) 次前向 | 输入维 < 输出维（如损失对单参数） |
| `jax.jacrev(f)` | 反向模式 | O(输出维) 次反向 | 输出维 < 输入维（神经网络常态） |
| `jax.hessian(f)` | jacfwd(jacrev) | — | 二阶导矩阵 |

```python
def f(x):           # 输入 n 维，输出 m 维
    return jnp.array([x[0]**2, x[0]*x[1], jnp.sin(x[1])])

J = jax.jacrev(f)(jnp.array([1.0, 2.0]))   # (3, 2) 雅可比
```

### stop_gradient 与 checkpoint

```python
# stop_gradient：截断梯度流（如强化学习的优势函数不回传到 value）
loss = main_loss + jax.lax.stop_gradient(aux_term)

# checkpoint（remat）：用重算换显存，大模型/深网络省显存
@jax.checkpoint
def residual_block(x, params):
    return x + block(x, params)
```

## Pytree：参数树的统一映射

JAX 把嵌套的 dict/list/tuple（甚至是自定义注册容器）视为「pytree」——叶子是数组、内部是结构。所有变换（grad、vmap、jit）都能透明穿透 pytree：

```python
import jax
import jax.numpy as jnp

params = {'w1': jnp.ones((3, 4)), 'b1': jnp.zeros(4), 'w2': jnp.ones((4, 2))}

# 对整棵树统一操作
scaled = jax.tree_util.tree_map(lambda x: x * 2, params)   # 所有叶子 ×2

# 树展平与还原（自定义优化器常用）
flat, treedef = jax.tree_util.tree_flatten(params)         # [w1, b1, w2]
restored = jax.tree_util.tree_unflatten(treedef, flat)     # 还原结构
```

- `jax.tree_util.tree_map(f, t1, t2)`：多棵同形树逐叶子运算（如两份参数相加）
- 自定义类注册 `jax.tree_util.register_pytree_node` 即可成为 pytree 节点
- Optax 的梯度变换、Flax 的参数管理都建立在 pytree 之上

## 可微控制流

被 `jit`/`grad` 包裹的函数里，普通 Python `for`/`if` 在追踪期会被静态展开（每次值变化都要重编译）。要值相关（动态）且可微的控制流，用 `jax.lax` 原语：

```python
# scan：可微循环（RNN、累加器），携带状态
def cumsum(xs):
    def body(carry, x):
        carry = carry + x
        return carry, carry
    final, ys = jax.lax.scan(body, 0.0, xs)
    return ys

# cond：可微 if（both 分支都求值后再选）
result = jax.lax.cond(x > 0, lambda: jnp.log(x), lambda: -1e6)

# while_loop：值相关循环，但不可微（无法对迭代次数求导）
n = jax.lax.while_loop(lambda i: i < 10, lambda i: i + 1, 0)
```

> 经验：能用 `jax.numpy` 的向量化运算就别用循环；必须循环优先 `lax.scan`。

## Optax：可组合优化器

Optax 把优化器拆成「梯度变换」的链，可自由组合：

```python
import optax

# 预设
optimizer = optax.adam(1e-3)           # = chain(scale_by_adam, scale(-lr))
optimizer = optax.sgd(1e-2, momentum=0.9)
optimizer = optax.adamw(1e-3, weight_decay=0.01)   # 解耦权重衰减

# 自定义链：Adam + 梯度裁剪 + 学习率调度
schedule = optax.warmup_cosine_decay_schedule(
    init_value=0.0, peak_value=1e-3,
    warmup_steps=1000, decay_steps=10000, end_value=1e-5)

optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),    # 梯度裁剪
    optax.scale_by_adam(),             # Adam 一阶/二阶矩
    optax.scale_by_schedule(schedule), # 学习率调度
    optax.scale(-1.0),                 # 梯度下降方向
)
```

使用三件套：`opt = optax.adam(...)` → `state = opt.init(params)` → 每步 `updates, state = opt.update(grads, state, params)` → `params = optax.apply_updates(params, updates)`。

## Flax NNX 训练循环

```python
from flax import nnx
import optax
import jax, jax.numpy as jnp

model = MLP(din=784, dout=10, rngs=nnx.Rngs(0))
optimizer = nnx.Optimizer(model, optax.adamw(1e-3, weight_decay=0.01))

def loss_fn(model, x, y):
    logits = model(x)
    return optax.softmax_cross_entropy_with_integer_labels(logits, y).mean()

grad_fn = nnx.value_and_grad(loss_fn)        # NNX 版 grad（穿透模型状态）

for batch in dataloader:
    loss, grads = grad_fn(model, batch['x'], batch['y'])
    optimizer.update(grads)                  # 原地更新（NNX 引用语义）
```

NNX 与旧 Linen 的区别：NNX 的 `model` 是可变对象（像 PyTorch），`optimizer.update(grads)` 直接改 model；旧 Linen 则要 `params, opt_state = apply_updates(params, updates)` 显式返回新状态。两种 API 都编译成同样的 XLA 代码。

## 数据并行：pmap + pmean

```python
n = jax.device_count()                          # 设备数（如 8 GPU）
sharded_x = x.reshape(n, batch_per_device, ...) # 第 0 维 = 设备数

@jax.pmap(axis_name='batch')
def train_step(sharded_x, sharded_y):
    def model_loss(x, y):
        return loss_fn(model, x, y)
    loss = model_loss(sharded_x, sharded_y)
    grads = jax.grad(model_loss)(sharded_x, sharded_y)
    # 跨设备平均梯度（数据并行关键）
    grads = jax.lax.pmean(grads, axis_name='batch')
    return loss

@jax.pmap(axis_name='batch')
def step(x, y):
    ...
    grads = jax.lax.pmean(grads, 'batch')
```

- `pmap` 自动把函数复制到每个设备，第 0 维切分
- `jax.lax.pmean(grads, axis_name)` 跨设备求平均（数据并行必须同步梯度）
- 进阶：全局数组用 `jax.sharding.Mesh` + `jax.lax.pjit`，可做模型并行 / 张量并行（SPMD）

## XLA 与编译模型

- JAX 把 Python 函数追踪成 **jaxpr**（中间表示），再由 XLA 编译为目标硬件内核
- `jax.make_jaxpr(f)(x)` 看追踪结果（调试形状/类型很有用）
- `jax.jit` 默认异步调度：CPU 立即返回，结果要 `.block_until_ready()` 才真正算完（计时务必阻塞）

```python
import time
x = jnp.ones((1000, 1000))
start = time.perf_counter()
y = jax.jit(lambda x: x @ x.T)(x)
y.block_until_ready()          # 关键：等编译+执行完成
print(time.perf_counter() - start)
```

## 调试技巧

- `jax.disable_jit()` 上下文：临时关编译，副作用与 Python 控制流按 eager 行为运行，便于断点
- `jax.debug.print("x={}", x)`：可在 jit 内打印（普通 `print` 在 jit 下只追踪期跑一次）
- `jax.make_jaxpr(f)(args)`：看追踪出的 jaxpr，定位形状推断错误
- 形状断言：`x = jnp.reshape(x, (-1, feat))` 用 -1 让 JAX 推断；形状不匹配时 jaxpr 会暴露

## 版本与平台

- **稳定版**：0.11.0（2026-07-16）；Python **≥ 3.12**（3.12/3.13/3.14，含 free-threading）
- **平台**：Linux x86_64 全栈（CPU/NVIDIA GPU/TPU/AMD GPU/Intel GPU 实验）；Mac aarch64（CPU + Apple GPU 实验）；Windows 仅 CPU（GPU 需 WSL2）
- **文档迁移**：jax.readthedocs.io 已 301 跳转到 **docs.jax.dev**
- **生态**：Flax（NNX/Linen）、Optax、Chex（断言/测试）、Orbax（检查点）、ml_collections（配置）
