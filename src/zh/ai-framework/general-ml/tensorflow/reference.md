---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 TensorFlow 2.21.0 stable API 文档 + Release Notes（2.16–2.21）+ tensorflow.org 安装文档整理

## 速查

- **核心**：`tf.constant` / `tf.Variable` / `tf.reshape` / `tf.matmul` / `tf.reduce_sum` / `tf.concat` / `tf.stack`
- **layers**：`Dense` / `Conv2D` / `MaxPooling2D` / `BatchNormalization` / `LayerNormalization` / `Dropout` / `Embedding` / `LSTM` / `GRU` / `MultiHeadAttention`
- **losses**：`SparseCategoricalCrossentropy(from_logits=)` / `CategoricalCrossentropy` / `BinaryCrossentropy` / `MeanSquaredError` / `Huber`
- **optimizers**：`SGD` / `Adam` / `AdamW` / `RMSprop` + `schedules.ExponentialDecay` / `CosineDecay`
- **metrics**：`Accuracy` / `SparseCategoricalAccuracy` / `Precision` / `Recall` / `AUC` / `F1Score`
- **callbacks**：`EarlyStopping` / `ModelCheckpoint` / `TensorBoard` / `ReduceLROnPlateau` / `CSVLogger`
- **data**：`from_tensor_slices` / `from_generator` / `TFRecordDataset` / `list_files` + `map` / `batch` / `shuffle` / `prefetch` / `cache` / `interleave`
- **function**：`@tf.function` / `input_signature` / `jit_compile` / `get_concrete_function`
- **savedmodel**：`tf.saved_model.save/load`；`saved_model_cli show --dir DIR --all`
- **serving**：`tensorflow/serving` Docker，REST `:8501` / gRPC `:8500`；`tensorflow-serving-api` 2.20.0
- **tflite**：`TFLiteConverter` + `Optimize.DEFAULT` + representative dataset；迁移中 → LiteRT（`ai-edge-litert`）
- **tfjs**：`tensorflowjs_converter`；`@tensorflow/tfjs` 4.22.0，后端 webgl/webgpu/wasm/cpu
- **版本**：稳定版 **2.21.0**；Python **3.10–3.13**；Keras ≥ 3.12；TensorBoard 分离安装

## tf.keras.layers 速查

| 层 | 用途 | 关键点 |
| --- | --- | --- |
| `keras.Input(shape=)` | 声明输入 | Functional/Sequential 首层 |
| `layers.Dense(units, activation=)` | 全连接 | 末层分类不加激活（输出 logits） |
| `layers.Conv2D(filters, kernel_size)` | 二维卷积 | `padding="same"` 保尺寸 |
| `layers.MaxPooling2D / GlobalAveragePooling2D` | 池化 | GAP 常用于分类头前 |
| `layers.BatchNormalization` | 批归一化 | 受 `training` 参数控制 |
| `layers.LayerNormalization` | 层归一化 | Transformer 标配 |
| `layers.Dropout(rate)` | 随机丢弃 | 仅训练生效 |
| `layers.Embedding(input_dim, output_dim)` | 词嵌入 | 输入整数 id |
| `layers.LSTM / GRU(units)` | 循环层 | `return_sequences` 控制输出 |
| `layers.MultiHeadAttention` | 注意力 | `num_heads` + `key_dim` |
| `layers.Rescaling(1./255)` | 归一化层 | 预处理写进模型，随 SavedModel 走 |

> **实践**：图像归一化、文本向量化（`TextVectorization`）尽量做成层放进模型，部署时免对齐预处理。

## compile / fit / callbacks 参数

```python
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),   # 或 "adam" 字符串
    loss=keras.losses.SparseCategoricalCrossentropy(from_logits=True),
    metrics=[keras.metrics.SparseCategoricalAccuracy()],
)

model.fit(
    train_ds,
    epochs=10,
    validation_data=val_ds,      # 或 validation_split=0.1（NumPy 输入时）
    callbacks=[...],
    class_weight={0: 1.0, 1: 3.0},   # 类别不均衡加权
)
```

学习率调度（作为 optimizer 的 lr 传入，非 callback）：

```python
lr = keras.optimizers.schedules.CosineDecay(1e-3, decay_steps=10000)
opt = keras.optimizers.Adam(learning_rate=lr)
```

## tf.data API 速查

| API | 说明 |
| --- | --- |
| `Dataset.from_tensor_slices((x, y))` | 内存数据建集 |
| `Dataset.from_generator(gen, output_signature=)` | 自定义生成器 |
| `Dataset.list_files(pattern)` | 文件列表 → 配 `interleave` |
| `tf.data.TFRecordDataset(files)` | 读 TFRecord（大训练集标准格式） |
| `ds.map(fn, num_parallel_calls=AUTOTUNE)` | 逐样本变换，并行化 |
| `ds.batch(64, drop_remainder=True)` | 组批；分布式常丢尾批保 shape |
| `ds.shuffle(buffer_size, seed=)` | 缓冲打乱，只给训练集 |
| `ds.cache()` | 缓存（位置决定缓存内容） |
| `ds.prefetch(AUTOTUNE)` | 与训练重叠，几乎必备 |
| `ds.interleave(...)` | 多文件并行交错读取 |
| `ds.repeat(n)` | 重复 epoch（注意与 fit 的 epochs 别重复计） |

## 部署矩阵速查

| 目标 | 工具 | 入口命令 |
| --- | --- | --- |
| 保存（训练侧） | Keras | `model.save("m.keras")` / `load_model` |
| 导出（部署侧） | Keras 3 | `model.export("saved/1/")` |
| 底层导出 | tf.saved_model | `tf.saved_model.save(obj, dir, signatures=)` |
| 在线服务 | TF Serving | `docker run -p 8501:8501 -v .../saved:/models/NAME -e MODEL_NAME=NAME tensorflow/serving` |
| 移动/嵌入式 | TFLite → LiteRT | `tf.lite.TFLiteConverter.from_saved_model(dir)`；新装 `ai-edge-litert` |
| 浏览器/Node | TFJS | `tensorflowjs_converter --input_format=keras m.keras web/` |

TF Serving 目录约定：`/models/<名字>/<版本号>/`（版本号为整数子目录，默认服务最大版本）；REST 端点 `/v1/models/<名字>:predict`。

## 版本与兼容（2.16 → 2.21 要点）

| 版本 | 关键变化 |
| --- | --- |
| 2.16（2024-03） | **Keras 3 成为默认 Keras**；`tf.estimator` 移除；Windows wheel 改用 Clang 构建 |
| 2.17（2024-07） | 移除 Maxwell（CC 5.x）GPU 支持；新增 CC 8.9（L4/L40） |
| 2.18（2024-10） | 默认以 **NumPy 2.0** 编译支持；Hermetic CUDA（构建可复现） |
| 2.19（2025-03） | `tf.lite.Interpreter` 弃用警告 → `ai_edge_litert.interpreter`；停发 libtensorflow 独立包 |
| 2.20（2025-08） | **官方宣布 tf.lite 弃用、迁 LiteRT**；`tensorflow-io-gcs-filesystem` 变可选（`pip install "tensorflow[gcs-filesystem]"`）；`tf.data` 增 `autotune.min_parallelism` |
| 2.21（2026-03） | 移除 Python 3.9；**TensorBoard 依赖移除**（需单独安装）；TFLite 增 int2/uint4 量化算子；`tf.image` 支持 JPEG XL 解码 |

升级注意：跨版本必看 Release Notes 的 Breaking Changes；生产锁定 `tensorflow==2.21.0`；Keras 3 独立发版（`pip install -U keras`），与 TF 版本解耦但需 ≥ TF 要求的下限。

## 生态版图

- **高层 API**：Keras 3（多后端）；KerasTuner（超参搜索）；keras-hub（预训练模型，原 KerasCV/KerasNLP 合并）
- **领域库**：TF Probability（概率建模）、TF Text（文本）、TF Recommenders（推荐）、TF Agents（强化学习）、TF Hub（模型仓库）
- **生产**：TF Serving（在线推理）、TFX（端到端 ML 流水线）、TF Data Validation / TF Transform / TF Model Analysis
- **端与 Web**：LiteRT（原 TFLite，Android/iOS/MCU）、Coral（Edge TPU）、TensorFlow.js（浏览器/Node）
- **编译**：XLA（`jit_compile=True`）；StableHLO 中间表示
- **已谢幕**：`tf.estimator`（2.16 移除）、TensorFlow Addons（2024 停更，最终 0.23.x 支持到 TF 2.15）

## 官方资源

- [TensorFlow API 文档（stable）](https://www.tensorflow.org/api_docs/python/tf)
- [Tutorials 官方教程](https://www.tensorflow.org/tutorials)
- [Guide 官方指南](https://www.tensorflow.org/guide)
- [Keras 官方站](https://keras.io/)
- [LiteRT 迁移指南](https://ai.google.dev/edge/litert/migration)
- [Release Notes 全集](https://github.com/tensorflow/tensorflow/releases)
