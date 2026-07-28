---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 Keras 3.15.0 官方文档（Getting started / Introduction to Keras for engineers / Functional API 指南）编写，对照当前稳定版行为

## 速查

- **安装**：`pip install --upgrade keras` + 一个后端（`jax` / `tensorflow` / `torch` 至少装一个）
- **选后端**：`export KERAS_BACKEND="jax"`（或 `torch` / `tensorflow`），**必须在 `import keras` 之前**，导入后不可切换
- **配置文件**：`~/.keras/keras.json` 里的 `"backend"` 字段，等价于环境变量
- **验证**：`keras.__version__` 看版本；`keras.backend.backend()` 看当前后端名
- **Python**：Keras 3.13 起要求 **≥ 3.11**
- **TF 关系**：TF 2.16+ 的 `tf.keras` 就是 Keras 3；TF 2.15 及更早附带 Keras 2
- **三种建模**：`keras.Sequential`（线性堆叠）/ Functional API（`keras.Model(inputs, outputs)`，任意拓扑）/ 子类化（继承 `Layer`/`Model`，写 `call`）
- **训练三行**：`model.compile(optimizer, loss, metrics)` → `model.fit(x, y, epochs, validation_split)` → `model.evaluate` / `model.predict`
- **数据源**：NumPy / Pandas / `tf.data.Dataset` / PyTorch `DataLoader` 都可以喂给 `fit`，与后端无关
- **保存**：`model.save("m.keras")`；加载 `keras.saving.load_model("m.keras")`；只存权重 `model.save_weights("w.weights.h5")`
- **预训练**：`pip install keras-hub`，`keras_hub.models.X.from_preset("...")`

## 安装与后端选择

Keras 3 本身不带计算引擎，**必须再装一个后端框架**（JAX、TensorFlow、PyTorch 三选一或多选）：

```bash
pip install --upgrade keras tensorflow   # 或换成 "jax[cuda12]" / torch
```

后端的选择发生在**导入之前**，三种配法等价：

```bash
# ① 环境变量（最常用）
export KERAS_BACKEND="jax"
```

```python
# ② 代码内设置（必须在 import keras 之前！）
import os
os.environ["KERAS_BACKEND"] = "jax"
import keras

# ③ 或写配置文件 ~/.keras/keras.json：{"backend": "jax", "floatx": "float32", ...}
```

> **铁律**：后端在首次 `import keras` 时锁定，之后无法切换；要换后端必须重启进程。安装后用 `keras.__version__` 看版本、`keras.backend.backend()` 看当前后端名。

### 与 TensorFlow 的版本纠缠

- **TF 2.16 起**：`pip install tensorflow` 自动装 Keras 3，`from tensorflow import keras`（`tf.keras`）就是 Keras 3
- **TF 2.15 及更早**：附带 Keras 2（`keras==2.15` 会覆盖你已装的 Keras 3——装完 TF 2.15 需要 `pip install --upgrade keras` 重装）
- **想留在 Keras 2**：`pip install tf_keras` + `export TF_USE_LEGACY_KERAS=1`，让 `tf.keras` 指回旧版
- 官方兼容起点：`tensorflow~=2.16.1` / `torch~=2.1.0` / `jax==0.4.20` 搭配 `keras~=3.0`

## 三种建模方式

### ① Sequential：线性堆叠

```python
model = keras.Sequential([
    layers.Input(shape=(28, 28)),
    layers.Flatten(),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.2),
    layers.Dense(10, activation="softmax"),
])
model.summary()   # 打印每层的形状与参数量
```

### ② Functional API：任意拓扑（推荐主力方式）

```python
inputs = keras.Input(shape=(28, 28))
x = layers.Flatten()(inputs)
x = layers.Dense(128, activation="relu")(x)
residual = x
x = layers.Dense(128, activation="relu")(x)
x = layers.Add()([x, residual])                      # 残差连接：Sequential 表达不了
outputs = layers.Dense(10, activation="softmax")(x)

model = keras.Model(inputs=inputs, outputs=outputs, name="mlp_resnet")
keras.utils.plot_model(model, "model.png", show_shapes=True)  # 可视化计算图
```

Functional API 把层当作「作用在张量上的函数」，天然支持多输入、多输出、共享层、非循环图，是实际项目的默认选择。

### ③ 子类化：完全自定义

```python
class MLPBlock(layers.Layer):
    def __init__(self, units):
        super().__init__()
        self.dense1 = layers.Dense(units)
        self.dense2 = layers.Dense(units)

    def call(self, inputs, training=None):           # training 区分训练/推理行为
        x = self.dense1(inputs)
        x = keras.activations.relu(x)
        return self.dense2(x)
```

子类化自由度最高（`call` 里可写任意 Python 控制流），但**计算图不隐式可序列化**——要保存完整模型需自己实现 `get_config()`。子类化 `keras.Model` 写法同理（继承后覆盖 `call`）。三种方式可混用：Functional 模型里能嵌子类化层，反之亦然。

## 第一个完整例子：MNIST 全流程

compile（配置学习过程）→ fit（训练）→ evaluate（评估）→ predict（推理），内置循环覆盖标准监督学习：

```python
import numpy as np
import keras
from keras import layers

# ① 数据（NumPy 即可，无需任何封装）
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
x_train = x_train.astype("float32") / 255.0
x_test = x_test.astype("float32") / 255.0

# ② 建模（Functional）
inputs = keras.Input(shape=(28, 28))
x = layers.Flatten()(inputs)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(10, activation="softmax")(x)
model = keras.Model(inputs, outputs)

# ③ compile：优化器 + 损失 + 指标（字符串别名或实例都行）
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss=keras.losses.SparseCategoricalCrossentropy(),   # 标签是整数 id 用 Sparse 版
    metrics=[keras.metrics.SparseCategoricalAccuracy(name="acc")],
)

# ④ fit：内置训练循环（自动 shuffle、进度条、验证集划分）
history = model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=5,
    validation_split=0.1,          # 从训练集尾部切 10% 做验证
)
print(history.history["val_acc"])  # 每轮的验证准确率

# ⑤ evaluate / predict
test_loss, test_acc = model.evaluate(x_test, y_test)
probs = model.predict(x_test[:8])          # 输出各类别概率
preds = np.argmax(probs, axis=-1)
```

三个注意点：

- **标签形式决定损失函数**：整数标签用 `SparseCategoricalCrossentropy`，one-hot 标签用 `CategoricalCrossentropy`；模型末层无 softmax（输出 logits）时传 `from_logits=True`，数值更稳
- `validation_split` 是「从训练数据尾部切」，时序数据请先自行 shuffle 或改用 `validation_data=(x_val, y_val)`
- `model(x)` 直接调用只做前向（且默认 `training=False`），训练请走 `fit`

## 数据管线：随便喂

`fit` / `evaluate` / `predict` 接受的数据源与后端解耦——Torch 后端也能吃 `tf.data.Dataset`：

```python
import tensorflow as tf   # 仅借 tf.data 做数据管线，后端可以是 torch

ds = tf.data.Dataset.from_tensor_slices((x_train, y_train))
ds = ds.shuffle(10000).batch(64).prefetch(tf.data.AUTOTUNE)

model.fit(ds, epochs=5)    # Dataset 已组批，无需再传 batch_size

# PyTorch DataLoader、Pandas DataFrame 同理，直接传
```

## 保存与加载

```python
# 完整模型（架构 + 权重 + compile 配置）：.keras 是 Keras 3 标准格式
model.save("mnist.keras")
model2 = keras.saving.load_model("mnist.keras")

# 只存权重（文件名必须以 .weights.h5 结尾）
model.save_weights("mnist.weights.h5")
model2 = keras.Model(...)          # 先重建同构模型
model2.load_weights("mnist.weights.h5")
```

- `.keras` 实际是一个 zip 包：`config.json`（架构）+ `model.weights.h5`（权重）+ `metadata.json`
- 旧 `.h5` 整模型格式已废弃，仅权重场景保留
- 3.12 起反序列化安全持续收紧：加载含 `Lambda` 层等不可信存档需显式 `keras.config.enable_unsafe_deserialization()`，生产环境请只用可信来源的 `.keras` 文件

## KerasHub：一行加载预训练模型

```python
# pip install --upgrade keras-hub
import keras_hub

# KerasNLP 已更名为 KerasHub；视觉模型也在同一命名空间
classifier = keras_hub.models.BertClassifier.from_preset(
    "bert_base_en_uncased", num_classes=2,
)
classifier.fit(imdb_train, validation_data=imdb_test)
clf = keras_hub.models.ImageClassifier.from_preset("resnet_50_imagenet")
```

预置 checkpoint 托管在 Kaggle Models，全部三后端可用。注意：安装 KerasHub 会顺带拉入 TensorFlow（预处理层复用 `tf.data`），但训练本身仍跑在你选的后端上。
