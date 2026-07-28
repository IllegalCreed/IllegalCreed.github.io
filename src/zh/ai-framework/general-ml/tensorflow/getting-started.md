---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 TensorFlow 2.21.0 官方文档（install/pip + Keras Quickstart + tf.data 指南）编写，对照当前稳定版行为

## 速查

- **安装**：`pip install tensorflow`；Linux GPU 版 `pip install 'tensorflow[and-cuda]'`（驱动 ≥ 525.60.13）
- **Python**：支持 **3.10–3.13**（2.21 起移除 3.9）
- **版本确认**：`tf.__version__`；GPU 自检 `tf.config.list_physical_devices('GPU')`
- **建张量**：`tf.constant([1, 2, 3])` / `tf.zeros((2, 3))` / `tf.random.normal((2, 3))`；`.numpy()` 转 ndarray
- **可训练状态**：`tf.Variable(...)`（权重载体，随 GradientTape 求导）
- **模型三件套**：`compile(optimizer=, loss=, metrics=)` → `fit(...)` → `evaluate()` / `predict()`
- **Sequential 骨架**：`keras.Sequential([keras.Input(shape=...), layers.Dense(...)])`
- **数据管线**：`tf.data.Dataset.from_tensor_slices((x, y)).shuffle(n).batch(32).prefetch(AUTOTUNE)`
- **保存**：`model.save("model.keras")`；加载 `keras.models.load_model("model.keras")`
- **部署导出**：`model.export("saved/")`（Keras 3 导出 SavedModel，供 TF Serving/TFLite 用）
- **GPU 平台**：Linux 原生；Windows 需 WSL2（2.11 起原生无 GPU）；macOS 无官方 GPU 支持
- **eager 默认**：TF2 即时执行逐行可调试；要图性能再 `@tf.function`

## 安装与验证

普通 CPU 环境一行即可；Linux 上要 GPU 加速需带 `and-cuda` extra（自动拉 NVIDIA CUDA/cuDNN 的 pip 依赖）：

```bash
# 纯 CPU（各平台通用）
pip install tensorflow

# Linux + NVIDIA GPU：自动安装配套 CUDA 库（官方安装文档列出 CUDA 12.3 + cuDNN 8.9.7）
pip install 'tensorflow[and-cuda]'
```

安装后验证（官方样例）：

```python
import tensorflow as tf

print(tf.__version__)                                # 2.21.0
tf.config.list_physical_devices("GPU")               # 非空列表 = GPU 可用
print(tf.reduce_sum(tf.random.normal([1000, 1000]))) # 跑通张量计算
```

平台注意（官方安装文档原文要点）：

- **Windows**：2.10 是最后一个原生支持 GPU 的版本；2.11 起要么装 WSL2 跑 Linux 版，要么用社区 DirectML 插件
- **macOS**：官方无 GPU 支持（早年 Apple 的 tensorflow-metal 插件已长期不更新）
- **Windows CPU wheel**：2.10 起由 Intel 代为构建维护
- 2.21 起 **TensorBoard 不再随 tensorflow 自动安装**，需要时 `pip install tensorboard`

## Eager 张量初体验

TF2 默认**即时执行（Eager Execution）**：每行运算立即求值，与 NumPy 风格一致，不再有 1.x 的 Session。

```python
import tensorflow as tf

a = tf.constant([[1, 2], [3, 4]])        # 从 Python 数据建张量
b = tf.random.normal((2, 2))             # 标准正态
c = a @ b                                # 矩阵乘
d = a * 2                                # 逐元素乘（广播）

print(c.shape, c.dtype)                  # (2, 2) <dtype: 'float32'>
arr = c.numpy()                          # 转 NumPy（仅 eager 下可用）

w = tf.Variable(1.0)                     # 可训练变量：梯度求导的目标
w.assign_add(0.5)                        # 原地更新 → 1.5
```

要点：`tf.Tensor` 不可变（每次运算产新张量），`tf.Variable` 可变、是模型权重的载体；GPU 可用时运算自动落在 GPU，无需手动 `.to(device)`。

## 第一个模型：FashionMNIST 分类

官方 quickstart 的完整流程——数据、建模、编译、训练、评估，共 20 余行：

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

# 1. 加载内置数据集（28×28 灰度图，10 类）
(x_train, y_train), (x_test, y_test) = keras.datasets.fashion_mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0   # 归一化到 [0,1]

# 2. Sequential 建模：层按顺序堆叠
model = keras.Sequential([
    keras.Input(shape=(28, 28)),                     # 显式声明输入形状
    layers.Flatten(),                                # 28×28 → 784
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.2),
    layers.Dense(10),                                # 输出 logits（不加 softmax）
])

# 3. 编译：指定优化器 / 损失 / 指标
model.compile(
    optimizer="adam",
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=[keras.metrics.SparseCategoricalAccuracy()],
)

# 4. 训练 + 评估
model.fit(x_train, y_train, epochs=5, validation_split=0.1)
model.evaluate(x_test, y_test, verbose=0)
```

三个高频知识点：

- **输出是 logits**：最后一层不加激活，`from_logits=True` 让损失函数内部做 softmax（数值更稳）；要概率再 `tf.nn.softmax(logits)`
- **整数标签用 Sparse 损失**：标签是 `0–9` 整数配 `SparseCategoricalCrossentropy`；one-hot 标签才用 `CategoricalCrossentropy`
- **`fit` 一把梭**：自动完成 batch 切分、前向、反向、参数更新；`validation_split` 从训练集尾部切验证集

## 用 tf.data 喂数据

`model.fit` 直接吃 NumPy 很方便，但大数据/复杂预处理要用 **`tf.data.Dataset`**——声明式输入管线：

```python
train_ds = (
    tf.data.Dataset.from_tensor_slices((x_train, y_train))
    .shuffle(60000)                                   # 打乱（buffer 给足）
    .batch(32)                                        # 组批
    .prefetch(tf.data.AUTOTUNE)                       # 训练与数据准备重叠
)

model.fit(train_ds, epochs=5)                         # Dataset 直接喂给 fit
```

- **链式变换**：每个方法返回新 Dataset，顺序即执行顺序
- **`shuffle(buffer_size)`**：从缓冲区随机抽，buffer 越大越接近全局打乱（经验：≥ 样本数或上万）
- **`prefetch(AUTOTUNE)`**：几乎永远该放在最后，让 CPU 备数据时 GPU 不空转
- 变长/自定义数据源用 `from_generator`；海量文件用 `tf.data.TFRecordDataset`（见指南页）

## 保存与导出

```python
# ① 训练侧标准：Keras 3 原生 .keras 格式（架构 + 权重 + 编译配置一个文件）
model.save("fashion.keras")
new_model = keras.models.load_model("fashion.keras")
new_model.evaluate(x_test, y_test, verbose=0)

# ② 部署侧：导出 SavedModel 目录（不含训练状态，供 Serving/TFLite/TFJS 消费）
model.export("saved_model/1/")                        # Keras 3 的 export，目录按版本号组织
```

- **`.keras` 是 Keras 3 推荐格式**（zip 内含 config.json + weights）；旧 `.h5` 仅 legacy 兼容
- **`.keras` 存的是「训练模型」，`export` 产的是「推理工件」**：后者剥离优化器状态，只留前向签名
- 非 Keras 场景用 `tf.saved_model.save(obj, dir)` / `tf.saved_model.load(dir)`（见指南页）

## 下一步

到这里已能跑通「数据 → 训练 → 评估 → 保存」闭环。进阶看本叶「指南」：`tf.function` 图编译、`tf.data` 性能调优、GradientTape 自定义训练循环、TF Serving/TFLite/TFJS 部署矩阵；API 清单与版本兼容看「参考」。
