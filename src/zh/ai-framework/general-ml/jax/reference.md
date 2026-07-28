---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 JAX 0.11.0 stable API（docs.jax.dev）+ Flax NNX + Optax 整理

## 速查

- **导入**：`import jax`、`import jax.numpy as jnp`、`from jax import random, lax, tree_util`
- **数组创建**：`jnp.zeros/ones/empty/full/arange/linspace/eye/zeros_like/array`
- **运算**：与 NumPy 同构：`+ - * / @`、`jnp.dot/matmul/sum/mean/max/argmax/exp/log/sin`
- **不可变更新**：`x.at[idx].set/add/multiply/min/max/get/apply(y)`
- **四大转换**：`jax.jit`、`jax.grad`、`jax.vmap`、`jax.pmap`
- **微分扩展**：`jax.jacfwd`、`jax.jacrev`、`jax.hessian`、`jax.value_and_grad`、`jax.checkpoint`(remat)、`jax.lax.stop_gradient`
- **控制流**：`jax.lax.scan/cond/while_loop/switch/fori_loop`
- **Pytree**：`jax.tree_util.tree_map/tree_flatten/tree_unflatten/tree_leaves`
- **PRNG**：`jax.random.key/split/normal/uniform/permutation/choice`
- **设备**：`jax.devices()`、`jax.device_count()`、`jnp.array(x).device()`、`x.block_until_ready()`
- **XLA**：`jax.make_jaxpr(f)(*args)`、`jax.disable_jit()`、`jax.debug.print`
- **Sharding**：`jax.sharding.Mesh`、`jax.lax.pjit`、`NamedSharding`/`PositionalSharding`
- **版本**：稳定版 **0.11.0**；Python ≥ 3.12

## 四大转换签名

```python
jax.jit(fun, *, static_argnames=None, device=None, donate_argnums=())         # 编译
jax.grad(fun, argnums=0, has_aux=False, holomorphic=False)                    # 标量梯度
jax.vmap(fun, in_axes=0, out_axes=0, axis_name=None)                          # 批处理
jax.pmap(fun, axis_name=None, in_axes=0, out_axes=0, devices=None)            # 多设备并行
```

| 变换 | 语义 | 关键参数 |
| --- | --- | --- |
| `jit` | XLA 编译，融合算子 | `static_argnames`（编译期常量）、`device`、`donate_argnums`（捐赠缓冲区） |
| `grad` | 反向模式自动微分（标量输出） | `argnums`（对哪个参数求导）、`has_aux`（返回辅助值） |
| `vmap` | 自动批处理（沿轴映射） | `in_axes`/`out_axes`（批处理轴，None=广播）、`axis_name` |
| `pmap` | 多设备 SPMD 并行 | `axis_name`（配合 `lax.pmean`）、`devices` |

组合示例：`jax.jit(jax.vmap(jax.grad(loss)))`。

## 微分 API 速查

| API | 输出 | 用途 |
| --- | --- | --- |
| `jax.grad(f)(x)` | 与 x 同形 | 标量函数对 x 的梯度 |
| `jax.value_and_grad(f)(x)` | (value, grad) | 同时取值与梯度 |
| `jax.jacfwd(f)(x)` | 雅可比矩阵 | 前向模式（输出维 > 输入维 时高效） |
| `jax.jacrev(f)(x)` | 雅可比矩阵 | 反向模式（输入维 > 输出维 时高效） |
| `jax.hessian(f)(x)` | Hessian 方阵 | `jacfwd(jacrev(f))` |
| `jax.jvp(f, (x,), (v,))` | (value, jvp) | 雅可比-向量积（前向） |
| `jax.vjp(f, (x,))[0:2]` | (value, vjp_fn) | 向量-雅可比积（反向） |
| `jax.checkpoint(f)` | 重算版 f | 省显存（旧名 `remat`） |
| `jax.lax.stop_gradient(x)` | 同 x | 截断梯度流 |

## jax.numpy 常用

```python
jnp.zeros(shape, dtype)        jnp.ones(shape)          jnp.full(shape, val)
jnp.arange(start, stop, step)  jnp.linspace(s, e, n)    jnp.eye(n)
jnp.array(pylist, dtype)       jnp.asarray(x)           jnp.zeros_like(x)

x.reshape(-1, feat)            x.transpose(0, 2, 1)     x[:, None]
jnp.concatenate([a, b], axis)  jnp.stack([a, b])        jnp.split(x, n)
jnp.where(cond, a, b)          jnp.argmax(x, axis)      jnp.sum(x, axis, keepdims)
jnp.broadcast_to(x, shape)     jnp.expand_dims(x, axis)
```

dtype 默认 **float32**（与 NumPy 的 float64 不同！）。要 float64 需 `jax.config.update("jax_enable_x64", True)`。

## 控制流原语

| 原语 | 等价 Python | 可微 |
| --- | --- | --- |
| `jax.lax.scan(f, init, xs)` | `for x in xs: init = f(init, x)` | 是（RNN/累加标准） |
| `jax.lax.cond(pred, t_fun, f_fun)` | `t_fun() if pred else f_fun()` | 是 |
| `jax.lax.switch(idx, [funs], operand)` | 多分支 switch | 是 |
| `jax.lax.while_loop(cond, body, init)` | `while cond(x): x = body(x)` | 否 |
| `jax.lax.fori_loop(lo, hi, body, init)` | `for i in range(lo,hi): init = body(i, init)` | 视 body |

## Pytree API

```python
jax.tree_util.tree_map(f, tree, *rest)              # 逐叶子映射
jax.tree_util.tree_flatten(tree)                    # -> (leaves, treedef)
jax.tree_util.tree_unflatten(treedef, leaves)       # 还原
jax.tree_util.tree_leaves(tree)                     # 只要叶子
jax.tree_util.tree_structure(tree)                  # 只要 treedef
jax.tree_util.register_pytree_node(cls, flatten, unflatten)  # 自定义节点
```

简写别名：`jax.tree_util.tree_map` 也可用 `jax.tree.map`（较新版本）。

## PRNG API

```python
jax.random.key(seed)                       # 新建 key（推荐）
jax.random.PRNGKey(seed)                   # 旧接口，等价
jax.random.split(key, num=2)               # 分裂
jax.random.fold_in(key, data)              # 派生（确定性）
jax.random.normal(key, shape)              # 标准正态
jax.random.uniform(key, shape, minval, maxval)
jax.random.permutation(key, x)
jax.random.choice(key, a, shape)
jax.random.categorical(key, logits, axis)
```

铁律：每次用完 key 必须 split 出新 key，原 key 不重复用。

## 设备与 Sharding

```python
jax.devices()                              # 全部设备列表
jax.device_count()                         # 设备数
jax.local_devices()                        # 本进程可见设备
x = jnp.ones((4, 4))
x.device()                                 # 所在设备
x.block_until_ready()                      # 阻塞取回（计时用）

# 单设备搬运
x = jax.device_put(x, jax.devices()[0])

# 多设备 Sharding（全局数组）
from jax.sharding import Mesh, PartitionSpec as P, NamedSharding
mesh = Mesh(jax.devices(), axis_names=('x',))
sharding = NamedSharding(mesh, P('x', None))    # 第 0 维按 'x' 轴切
x = jax.device_put(big_array, sharding)
```

## Optax 速查

```python
optax.adam(lr)                       optax.adamw(lr, weight_decay)
optax.sgd(lr, momentum=)             optax.rmsprop(lr)
optax.clip_by_global_norm(max)       optax.clip(max_delta)
optax.scale_by_adam()                optax.scale(lr)
optax.chain(*transforms)             # 组合
optax.apply_updates(params, updates)

# 调度
optax.warmup_cosine_decay_schedule(init_value, peak_value, warmup_steps, decay_steps, end_value)
optax.exponential_decay(init_value, transition_steps, decay_rate)
optax.constant_schedule(value)
```

## Flax NNX 速查

```python
from flax import nnx

nnx.Linear(din, dout, rngs=rngs)            # 全连接
nnx.Conv(features, kernel_size, rngs=rngs)  # 卷积
nnx.BatchNorm(features, rngs=rngs)          # 批归一
nnx.LayerNorm()                              # 层归一
nnx.Dropout(rate, rngs=rngs)
nnx.relu / nnx.gelu / nnx.softmax
nnx.Optimizer(model, tx)                    # 训练状态容器
nnx.value_and_grad(loss_fn)                 # NNX 版 grad
nnx.vmap(f)                                  # NNX 版 vmap
model = MLP(..., rngs=nnx.Rngs(seed))
nnx.split(model)                            # -> (states, graphdef) 用于序列化
```

## 版本与生态

- **稳定版**：0.11.0（2026-07-16）；Python ≥ 3.12（3.12/3.13/3.14，free-threading 3）
- **核心库**：jax（CPU）、jaxlib（C++ 后端）、jax[cuda12]（NVIDIA）、jax[tpu]、jax[rocm]
- **生态库**：Flax（NNX 神经网络）、Optax（优化器）、Chex（测试/断言）、Orbax（检查点/导出）、ml_collections（配置）、einops（重排）
- **文档地址**：docs.jax.dev（旧 jax.readthedocs.io 已 301 跳转）
- **GitHub**：jax-ml/jax（曾用名 google/jax）

## 官方资源

- [JAX 文档主页](https://docs.jax.dev/en/latest/)
- [JAX 101 教程](https://docs.jax.dev/en/latest/jax-101/index.html)
- [Installation Guide](https://docs.jax.dev/en/latest/installation.html)
- [Autodiff Cookbook](https://docs.jax.dev/en/latest/notebooks/autodiff_cookbook.html)
- [Pytrees 教程](https://docs.jax.dev/en/latest/jax-101/05.1-pytrees.html)
- [Flax NNX 文档](https://flax.readthedocs.io/en/latest/)
- [Optax 文档](https://optax.readthedocs.io/en/latest/)
- [JAX PyPI](https://pypi.org/project/jax/)
