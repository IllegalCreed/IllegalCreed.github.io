---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 TensorFlow 2.21.0 官方文档（tf.function / tf.data / Keras / SavedModel / Serving / LiteRT 迁移指南）+ 2.16–2.21 Release Notes 编写

## 速查

- **图编译**：`@tf.function` 装饰器 = AutoGraph 捕获；`jit_compile=True` 叠加 XLA 融合
- **防 retracing**：`input_signature=[tf.TensorSpec(...)]` 固定输入签名
- **图内打印**：用 `tf.print`（`print` 只在 trace 时执行一次）
- **数据管线口诀**：`map → cache → shuffle → batch → prefetch`，并行化 `num_parallel_calls=tf.data.AUTOTUNE`
- **大文件**：`tf.data.TFRecordDataset` + `tf.io.parse_single_example`
- **自定义训练**：`tf.GradientTape()` 录前向 → `tape.gradient(loss, vars)` → `optimizer.apply_gradients(...)`
- **Functional API**：`keras.Model(inputs, outputs)`，支持多输入多输出与层复用
- **Callbacks**：`EarlyStopping` / `ModelCheckpoint` / `TensorBoard` / `ReduceLROnPlateau`
- **混合精度**：`keras.mixed_precision.set_global_policy("mixed_float16")`
- **单机多卡**：`with tf.distribute.MirroredStrategy().scope():` 内建模型与 compile
- **SavedModel**：`tf.saved_model.save(obj, dir, signatures=...)`；排查 `saved_model_cli show --dir DIR --all`
- **TF Serving**：官方 Docker 镜像 `tensorflow/serving`，REST `:8501` / gRPC `:8500`
- **TFLite**：`tf.lite.TFLiteConverter` + `optimizations=[DEFAULT]` + representative dataset；官方正迁移 **LiteRT**
- **TFJS**：`tensorflowjs_converter` 转 Web 格式；`@tensorflow/tfjs` 当前 4.22.0

## tf.function：图模式与 AutoGraph

TF2 默认 eager，`@tf.function` 把 Python 函数**编译成计算图**：AutoGraph 自动改写控制流（`if/for/while` → `tf.cond/tf.while_loop`），换来算子融合、跨图优化与可部署性。

```python
@tf.function
def train_step(x, y):
    with tf.GradientTape() as tape:
        logits = model(x, training=True)
        loss = loss_fn(y, logits)
    grads = tape.gradient(loss, model.trainable_variables)
    optimizer.apply_gradients(zip(grads, model.trainable_variables))
    return loss

# 叠加 XLA 编译（适合固定形状的密集计算）
@tf.function(jit_compile=True)
def fast_block(x):
    return tf.nn.relu(x @ w1 + b1)
```

**retracing 三条规则**：

1. **Tensor 参数按 shape+dtype 建签名**：新 shape 组合出现会重新 trace（产生新图），动态 shape 场景用 `tf.TensorSpec(None, ...)` 标 `None` 维
2. **Python 值参数（int/str/对象）变化必 retracing**：把这类参数做成 Tensor 或用 `functools.partial` 区分函数
3. **副作用只在 trace 时跑一次**：函数体里的 `print`、Python 列表追加、counter 自增只执行一次——图内调试用 `tf.print`

生产代码建议显式固定签名，杜绝意外 retracing：

```python
@tf.function(input_signature=[
    tf.TensorSpec([None, 784], tf.float32),     # batch 维 None = 任意大小
    tf.TensorSpec([None], tf.int32),
])
def train_step(x, y): ...
```

## tf.data：高性能输入管线

经典顺序口诀与并行化：

```python
ds = (
    tf.data.Dataset.from_tensor_slices((images, labels))
    .map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)  # ① 预处理并行化
    .cache()                                               # ② 缓存（在 map 后 = 存处理结果）
    .shuffle(10000)                                        # ③ 打乱
    .batch(64)                                             # ④ 组批
    .prefetch(tf.data.AUTOTUNE)                            # ⑤ 与训练重叠
)
```

- **`cache()` 位置决定缓存内容**：放 `map` 前缓存原始数据（每 epoch 重跑预处理）；放 `map` 后缓存处理结果（第二 epoch 起零预处理开销）——内存够就放后面
- **多文件读取用 `interleave`**：`Dataset.list_files(...).interleave(TFRecordDataset, num_parallel_calls=AUTOTUNE)` 并行拉取，比串行 `flat_map` 快得多
- **TFRecord 是大数据标准格式**：`tf.io.parse_single_example` 按 feature description 解析
- 2.20 新增 `tf.data.Options().autotune.min_parallelism`，加快输入管线冷启动
- 分布式训练用 `options.experimental_distribute.auto_shard_policy = DATA` 防多 worker 读重

## GradientTape：自定义训练循环

`model.fit` 覆盖不了的场景（GAN、多损失、梯度手术）用 GradientTape 手写循环：

```python
loss_fn = keras.losses.SparseCategoricalCrossentropy(from_logits=True)
optimizer = keras.optimizers.Adam(1e-3)
train_acc = keras.metrics.SparseCategoricalAccuracy()

@tf.function                                  # 自定义循环照样能图编译
def train_step(x, y):
    with tf.GradientTape() as tape:           # 上下文内所有可导运算被记录
        logits = model(x, training=True)      # 注意 training=True
        loss = loss_fn(y, logits)
    grads = tape.gradient(loss, model.trainable_variables)
    optimizer.apply_gradients(zip(grads, model.trainable_variables))
    train_acc.update_state(y, logits)
    return loss

for epoch in range(10):
    for x, y in train_ds:
        train_step(x, y)
    print(f"epoch {epoch}, acc={train_acc.result():.4f}")
    train_acc.reset_state()
```

要点：`tape` 默认只记录一次（取两次梯度需 `tf.GradientTape(persistent=True)`）；监视 `tf.Variable` 自动、监视普通张量要 `tape.watch(x)`；`training=True/False` 控制 Dropout/BatchNorm 行为。

## Keras 进阶

### Functional API 与子类化

```python
# Functional：张量连线，支持多输入/多输出/共享层
inputs = keras.Input(shape=(784,))
x = layers.Dense(128, activation="relu")(inputs)
x = layers.Dense(64, activation="relu")(x)
outputs = layers.Dense(10)(x)
model = keras.Model(inputs=inputs, outputs=outputs)

# 子类化：最大自由度（forward 里可写任意 Python 逻辑）
class MyModel(keras.Model):
    def call(self, x, training=False):
        return self.head(self.body(x), training=training)
```

### Callbacks 与混合精度

```python
model.fit(train_ds, epochs=50, validation_data=val_ds, callbacks=[
    keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    keras.callbacks.ModelCheckpoint("best.keras", save_best_only=True),
    keras.callbacks.TensorBoard(log_dir="logs"),   # 2.21 起先 pip install tensorboard
    keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2),
])

# 混合精度：大部分算子 float16，输出保持 float32（GPU 上提速+省显存）
keras.mixed_precision.set_global_policy("mixed_float16")
```

## tf.distribute 概览

- **`MirroredStrategy`**：单机多卡同步训练，梯度 all-reduce，最常用
- **`MultiWorkerMirroredStrategy`**：多机多卡，`TF_CONFIG` 环境变量组网
- **`TPUStrategy`**：Cloud TPU / Colab TPU
- **`ParameterServerStrategy`**：大规模异步参数服务器训练

入口模式统一：strategy scope 内建模型与 compile，其余代码不变；`fit` 自动分片数据。

```python
strategy = tf.distribute.MirroredStrategy()
with strategy.scope():
    model = build_model()
    model.compile(optimizer="adam", loss=...)
```

## SavedModel 与 TF Serving

SavedModel 是 TF 全链路的**部署交换格式**（含计算图 + 权重 + 签名定义，语言无关）。Keras 3 用 `model.export(dir)` 生成；底层控制用 `tf.saved_model.save`：

```python
@tf.function(input_signature=[tf.TensorSpec([None, 784], tf.float32)])
def serve_fn(x):
    return {"probabilities": tf.nn.softmax(model(x))}

tf.saved_model.save(model, "saved/1/", signatures={"serving_default": serve_fn})
```

```bash
# 本地排查签名与输入输出
saved_model_cli show --dir saved/1/ --all

# TF Serving（官方 Docker；模型目录按版本号子目录组织）
docker run -p 8501:8501 -v $(pwd)/saved:/models/mnist -e MODEL_NAME=mnist \
    tensorflow/serving

# REST 调用（8501；gRPC 在 8500）
curl -X POST http://localhost:8501/v1/models/mnist:predict \
    -H 'Content-Type: application/json' \
    -d '{"instances": [[0.1, 0.2, ...]]}'
```

Serving 自动识别版本号子目录并默认服务最新版，配合 `--model_config_file` 可做版本灰度；`tensorflow-serving-api` 当前稳定版 2.20.0。

## TFLite（→ LiteRT）与 TensorFlow.js

**TFLite** 面向移动/嵌入式。注意版本事实：2.19 起 `tf.lite.Interpreter` 发弃用警告指向 `ai_edge_litert`，2.20 官方宣布 **tf.lite 将被 LiteRT 取代**（新仓库 google-ai-edge/LiteRT）——新端侧项目直接评估 LiteRT，存量 TF 内转换器仍可用：

```python
converter = tf.lite.TFLiteConverter.from_saved_model("saved/1/")
converter.optimizations = [tf.lite.Optimize.DEFAULT]   # 动态范围量化

def representative_dataset():                          # int8 全整数量化必需
    for x in calib_images:
        yield [x.astype("float32")[None]]

converter.representative_dataset = representative_dataset
tflite_model = converter.convert()
```

量化三档：**动态范围量化**（权重 int8，体积 1/4，CPU 提速）、**float16**（GPU 友好）、**int8 全整数**（需要代表性数据集校准，MCU/NPU 必备）。

**TensorFlow.js** 把模型带进浏览器/Node.js（当前 4.22.0）：

```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=keras fashion.keras web_model/
```

```python
# 浏览器侧：tf.loadLayersModel(Keras 格式) 或 tf.loadGraphModel(SavedModel 转图模型)
# 后端可选 webgl / webgpu / wasm / cpu，setBackend 切换
```

选型速记：**服务端高并发 → TF Serving；Android/iOS/嵌入式 → LiteRT（原 TFLite）；浏览器/Node → TFJS**；三者共享 SavedModel/Keras 模型作为转换源。

## 常见坑清单

- **`from_logits` 与 softmax 重复**：损失设 `from_logits=True` 又在末层加 softmax，数值不稳还学不动——二选一
- **retracing 爆炸**：`@tf.function` 参数传 Python int 循环递增，每值一张图，越跑越慢——改传 Tensor
- **shuffle buffer 太小**：`shuffle(100)` 对百万级数据约等于没打乱
- **`tf.Variable` 在 `@tf.function` 里反复创建**：第二次调用即报错——变量在函数外或 `__init__` 建好
- **BatchNorm/Dropout 的 `training` 参数**：自定义循环忘传 `training=True`，正则层全程按推理行为跑
- **Serving 目录不带版本号**：`models/mnist/1/` 才对，`models/mnist/` 直接放文件不识别
