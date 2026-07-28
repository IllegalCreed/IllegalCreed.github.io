---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 Keras 3.15.0 官方文档（Developer guides: 自定义层 / train_step / 回调 / 分布式 / 量化与导出）+ 3.12–3.15 Release Notes 编写

## 速查

- **跨后端算子**：`from keras import ops`——完整 NumPy API + `ops.softmax`/`ops.conv` 等 NN 算子，自定义组件只用 ops 才能三后端通用
- **自定义层**：`__init__` 配置 → `build(input_shape)` 里 `self.add_weight(...)` 建权重 → `call(inputs, training=None)` 前向 → `get_config()` 序列化
- **训练/推理行为分叉**：`call` 里判 `training`（Dropout/BatchNorm）；批级 mask 用 `compute_mask` 或 `Masking` 层
- **内置循环进阶**：`fit(..., class_weight=, sample_weight=, callbacks=[...], initial_epoch=)`
- **多输出模型**：`compile(loss={"out1": ..., "out2": ...}, loss_weights=[0.7, 0.3])`
- **回调**：`EarlyStopping` / `ModelCheckpoint` / `TensorBoard` / `ReduceLROnPlateau` / `LearningRateScheduler` / `BackupAndRestore`
- **自定义训练**：重写 `Model.train_step(data)`（保留 compile/fit 便利）；或退回后端原生循环（optax / GradientTape / torch.optim）
- **混合精度**：`keras.mixed_precision.set_dtype_policy("mixed_float16")`，输出层保持 float32
- **量化**：`model.quantize("int8")`；GPTQ（3.12+）用 `keras.quantizers.GPTQConfig`
- **导出**：`model.export(path, format=...)`——SavedModel（默认）/ `"onnx"` / `"litert"`（3.13+）/ `"torch"`（3.15+）
- **分布式**：`keras.distribution.DataParallel()` / `ModelParallel`，JAX 后端功能最全
- **保存铁律**：整模型 `.keras`；纯权重必须 `.weights.h5` 结尾；不可信存档别开 unsafe deserialization

## 多后端机制：一套代码怎么跑三个框架

Keras 3 的多后端不是「转译」，而是**同一套 Python API 在导入时绑定到具体后端的张量实现**。`keras.ops` 下的每个函数（`ops.matmul`、`ops.mean`、`ops.conv`……）在 JAX 后端就调 `jax.numpy`，在 Torch 后端就调 `torch` 算子。由此得到两条纪律：

1. **自定义层/损失/指标只用 `keras.ops` 与内置层**，产物即跨后端等价（数值一致）；一旦混入 `tf.`/`torch.`/`jnp.` 原生调用，就锁死对应后端
2. **后端在 `import keras` 时锁定**，运行时不可切换；想对比后端性能，同一脚本换 `KERAS_BACKEND` 跑三遍即可

```python
from keras import ops

class MyMeanSquaredError(keras.losses.Loss):
    def call(self, y_true, y_pred):
        return ops.mean(ops.square(y_true - y_pred), axis=-1)   # 三后端通吃
```

互操作是双向的：Torch 后端下 **Keras 层本身就是 `torch.nn.Module`**（可直接进 PyTorch 原生模型）；反过来 `TorchModuleWrapper` 把任意 nn.Module 包成 Keras 层，`JaxLayer`/`FlaxLayer`（3.13 起也支持 TF 后端，经 jax2tf）嵌入 JAX 生态，`TFSMLayer` 加载 TF SavedModel 当层用。

## Layer 与 Model 进阶

### 生命周期：延迟建权重

Keras 层采用**延迟构建（lazy build）**：`__init__` 只存配置，第一次拿到真实输入形状时才建权重。自定义层显式写法：

```python
class Scale(layers.Layer):
    def __init__(self, init_value=1.0):
        super().__init__()
        self.init_value = init_value

    def build(self, input_shape):                 # 拿到形状才建权重
        self.w = self.add_weight(
            shape=(input_shape[-1],),
            initializer=keras.initializers.Constant(self.init_value),
            trainable=True,
        )
        super().build(input_shape)                # 标记 built=True

    def call(self, inputs, training=None):
        return inputs * self.w

    def get_config(self):                         # 序列化必备
        config = super().get_config()
        config.update({"init_value": self.init_value})
        return config
```

- **权重即状态**：`self.add_weight(trainable=True/False)`——False 时是 buffer（如 BatchNorm 的 moving mean），跟随保存但不进优化器
- **`training` 参数**：`Dropout`/`BatchNormalization` 依赖它区分行为；`fit` 自动传 True，`predict`/`evaluate` 自动传 False；手写 `model(x)` 默认 False，想走训练行为要 `model(x, training=True)`
- **`seed_generator`**：3.x 推荐 `keras.random.SeedGenerator` 管理随机性，保证跨后端可复现
- 手动触发构建：`model.build(input_shape)` 或先跑一次假数据，否则 `model.summary()`/`save_weights` 在子类模型上会报「未构建」

### Model = 可当层用的 Layer

`keras.Model` 继承自 `Layer`，所以**模型可以嵌套**：一个大模型里塞另一个完整模型当子模块，`fit` 照常端到端训练。Functional 模型还自带图结构内省（`model.nodes`、`keras.utils.plot_model`）。

## fit 进阶用法

### 回调（Callbacks）：训练过程的钩子系统

```python
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=5, restore_best_weights=True),
    keras.callbacks.ModelCheckpoint(
        "best.keras", monitor="val_acc", save_best_only=True),
    keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2, min_lr=1e-6),
    keras.callbacks.TensorBoard(log_dir="logs"),
    keras.callbacks.BackupAndRestore(backup_dir="ckpt"),   # 断点续训兜底
]
history = model.fit(x, y, epochs=100, validation_split=0.1, callbacks=callbacks)
```

- `EarlyStopping.restore_best_weights=True`：停训后回滚到最优权重，常用但常被忘
- 自定义回调继承 `keras.callbacks.Callback`，钩子：`on_epoch_end`、`on_batch_begin`、`on_train_end` 等
- `BackupAndRestore` 只在各后端均可用的场景有效，配合 `initial_epoch` 可手动续训

### 加权与多输出

```python
# 类别不均衡
model.fit(x, y, class_weight={0: 1.0, 1: 5.0}, epochs=10)

# 多输出模型：损失 dict + 权重
model.compile(
    optimizer="adam",
    loss={"score": "mse", "cls": "categorical_crossentropy"},
    loss_weights={"score": 0.3, "cls": 0.7},
    metrics={"cls": ["accuracy"]},
)
model.fit(x, {"score": y_score, "cls": y_cls}, epochs=10)
```

## 自定义训练：两个层级

### 层级一：重写 train_step（保留 compile/fit 生态）

GAN、对比学习等「每步逻辑特殊但仍想要进度条/回调/指标聚合」的场景：

```python
class GAN(keras.Model):
    def train_step(self, data):
        real = data
        # 自定义梯度逻辑：用后端无关的方式拿梯度
        with tf.GradientTape() as tape:   # TF 后端写法示意；跨后端见下
            loss = self.compute_loss(x=real, y=real, y_pred=self(real, training=True))
        grads = tape.gradient(loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        for m in self.metrics:
            m.update_state(real, self(real))
        return {m.name: m.result() for m in self.metrics}
```

注意：`tf.GradientTape` 只在 TF 后端有效。**跨后端的自定义 train_step 应使用 Keras 3 的后端无关梯度 API 模式**（按当前后端分发），或者接受单后端限制。3.15 起多优化器场景可直接用内置的 **`MultiOptimizer`**（不同子网络挂不同优化器），不必手写 train_step。

### 层级二：后端原生训练循环（完全控制）

Keras 模型可直接进任意后端的原生循环，变量、损失、指标全部暴露：

- **JAX**：`model.stateless_call` + `jax.grad` + `optax` 优化器，`jax.jit`/`jax.pmap` 加速
- **TensorFlow**：`tf.GradientTape` + `tf.distribute`
- **PyTorch**：模型即 `nn.Module`，`torch.optim` + DDP 包装即可

这是 Keras 3 的设计承诺：**组件离开 `fit` 依然是一等公民**。

## 混合精度与量化

```python
# 混合精度：一行全局策略（计算 float16、变量 float32）
keras.mixed_precision.set_dtype_policy("mixed_float16")
# 输出层建议显式 float32，保数值稳定
outputs = layers.Dense(10, activation="softmax", dtype="float32")(x)

# 训练后量化（3.12+）：int8 / int4 / GPTQ
model.quantize("int8")

from keras.quantizers import GPTQConfig
config = GPTQConfig(dataset=calib_ds, weight_bits=4, group_size=128)
model.quantize("gptq", config=config)
```

3.13 起 `QuantizationConfig` 支持按层定制量化器，`Model.quantize` 的 `filters` 参数可用正则选层。

## 导出与部署

`model.export(path, format=...)` 统一出口（与 `fit` 所用后端解耦）：

| format | 产物 | 引入版本 | 说明 |
| --- | --- | --- | --- |
| （默认） | TF SavedModel | 3.0 | 接 TF-Serving / TF.js |
| `"onnx"` | ONNX 图 | 3.x | 接 ONNX Runtime / TensorRT |
| `"litert"` | LiteRT（原 TFLite） | 3.13 | 端侧推理；需安装 TF |
| `"torch"` | 原生 `nn.Module` | 3.15 | 交 PyTorch 生态继续训练/部署 |

> 注意区分：`model.save()` 存的是**可续训的 Keras 模型**；`model.export()` 出的是**推理/交付格式**。

## 分布式：keras.distribution

3.0 引入的分布 API 把「模型定义 / 训练逻辑 / 分片配置」解耦，**JAX 后端功能最全**（ModelParallel 在 3.15 持续增强）：

```python
from keras import distribution

# 数据并行（最简单，等价于 DDP 语义）
dp = distribution.DataParallel(devices=devices)

# 模型并行：DeviceMesh + LayoutMap 按层指定分片
mesh = distribution.DeviceMesh(shape=(2, 4), axis_names=("data", "model"))
```

TPU 大规模训练选 JAX 后端 + distribution 是当前官方主推路线。

## 陷阱与最佳实践清单

- **后端不可运行时切换**：`import keras` 后改 `KERAS_BACKEND` 无效且不会报错提示，重启进程才行
- **TF 2.15 覆盖安装**：`pip install tensorflow==2.15` 会装上 `keras==2.15` 覆盖你的 Keras 3——事后重装 Keras 3
- **自定义层忘记 `get_config`**：`model.save()` 时在反序列化环节报错，养成写完层就补 `get_config` 的习惯
- **子类模型没 build 就 summary/save**：先 `model.build(input_shape)` 或跑一批假数据
- **`model(x)` 默认 `training=False`**：调试训练行为时 Dropout/BN 不生效的诡异现象多源于此
- **加载不可信 `.keras`/`.h5`**：3.12–3.15 的连环安全补丁（HDF5 外链、tar 穿越、shape bomb、Lambda 反序列化 fail-closed）说明攻击面真实存在——生产环境只加载可信来源，必要时 `safe_mode` 保持默认
- **`save_weights` 文件名**：必须 `*.weights.h5` 结尾，否则直接报错
- **KerasHub 会拉 TensorFlow**：仅因预处理复用 `tf.data`，训练仍在所选后端，不要误判为后端被劫持
