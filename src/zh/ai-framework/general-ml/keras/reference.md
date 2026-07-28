---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 Keras 3.15.0 官方 API 文档 + GitHub Releases（3.12–3.15）+ keras.io 兼容矩阵整理

## 速查

- **建模**：`Sequential` / `Model(inputs, outputs)` / 子类化 `Layer`·`Model`（`build` + `call` + `get_config`）
- **训练**：`compile` → `fit` → `evaluate` / `predict`；自定义逻辑重写 `train_step`
- **层入口**：`keras.layers.*` 百余内置层；自定义算子走 `keras.ops.*`
- **损失/指标/优化器**：`keras.losses.*` / `keras.metrics.*` / `keras.optimizers.*`，字符串别名可直传 compile
- **回调**：`EarlyStopping` / `ModelCheckpoint` / `TensorBoard` / `ReduceLROnPlateau` / `BackupAndRestore`
- **保存**：`model.save("m.keras")` / `keras.saving.load_model` / `save_weights("w.weights.h5")`
- **导出**：`model.export(path, format="onnx"|"litert"|"torch")`，默认 SavedModel
- **后端**：`KERAS_BACKEND=jax|tensorflow|torch`（import 前设定）；`keras.backend.backend()` 查询
- **预训练**：`keras_hub.models.*.from_preset()`（KerasNLP 已更名 KerasHub）
- **版本**：稳定版 **3.15.0**（2026-06）；Python ≥ 3.11（3.13 起）

## 核心 API 速查表

### 模型与训练

| API | 说明 |
| --- | --- |
| `keras.Sequential([...])` | 线性堆叠容器 |
| `keras.Model(inputs, outputs)` | Functional 图模型 |
| `model.compile(optimizer, loss, metrics=, loss_weights=, jit_compile=)` | 配置学习过程 |
| `model.fit(x, y, batch_size=, epochs=, validation_split=, validation_data=, callbacks=, class_weight=, initial_epoch=)` | 内置训练循环 |
| `model.evaluate(x, y, batch_size=, return_dict=)` | 评估 |
| `model.predict(x, batch_size=)` | 推理（`model(x)` 是单步前向，predict 是批量循环） |
| `model.train_step(data)` / `test_step` / `predict_step` | 可重写的循环单元 |
| `model.summary()` / `keras.utils.plot_model(model, show_shapes=True)` | 结构与可视化 |

### 常用层（keras.layers）

| 类别 | 层 |
| --- | --- |
| 核心 | `Dense` `EinsumDense` `Embedding` `ReversibleEmbedding`（3.12）`Input` `Lambda` |
| 卷积 | `Conv1D/2D/3D` `Conv2DTranspose` `SeparableConv2D` `DepthwiseConv2D` |
| 池化 | `MaxPooling2D` `AveragePooling2D` `GlobalAveragePooling2D` `AdaptiveAveragePooling2D`（3.13） |
| 归一化 | `BatchNormalization` `LayerNormalization` `GroupNormalization` `BatchRenormalization`（3.14） |
| 正则 | `Dropout` `GaussianNoise` `SpatialDropout2D` |
| 循环 | `LSTM` `GRU` `Bidirectional` `SimpleRNN` |
| 注意力 | `MultiHeadAttention` `GroupedQueryAttention`（均支持 `sliding_window`，3.15）`Attention` |
| 预处理 | `Normalization` `Rescaling` `TextVectorization` `CategoryEncoding`（均支持 `adapt()`） |
| 互操作 | `TorchModuleWrapper` `JaxLayer` `FlaxLayer` `TFSMLayer` |

### 损失 / 指标 / 优化器

| 模块 | 常用项 |
| --- | --- |
| `keras.losses` | `CategoricalCrossentropy` `SparseCategoricalCrossentropy`（`from_logits=`）`BinaryCrossentropy` `MeanSquaredError` `Huber` `CTC` |
| `keras.metrics` | `Accuracy` `CategoricalAccuracy` `SparseCategoricalAccuracy` `AUC` `Precision` `Recall` `F1Score` |
| `keras.optimizers` | `SGD(momentum=)` `Adam` `AdamW` `Nadam` `Lion` `ScheduleFreeAdamW`（3.14）`MultiOptimizer`（3.15） |
| 学习率调度 | `keras.optimizers.schedules.ExponentialDecay` `CosineDecay` `CosineDecayRestarts` `PiecewiseConstantDecay` |

### keras.ops（跨后端算子）

```python
from keras import ops

ops.matmul(a, b)          # NumPy 全集：mean/sum/stack/concatenate/einsum/take...
ops.softmax(x, axis=-1)   # NN 专用：softmax/binary_crossentropy/conv/pool/moments
ops.unique(x)             # 3.15 新增；另有 pinv/matrix_rank/ssim/sobel_edges 等
ops.cast(x, "float16")    # dtype 转换
```

### 常用回调与工具

| API | 用途 |
| --- | --- |
| `keras.callbacks.EarlyStopping(monitor=, patience=, restore_best_weights=)` | 早停并回滚最优权重 |
| `keras.callbacks.ModelCheckpoint(path, save_best_only=)` | 按指标存最优模型 |
| `keras.callbacks.TensorBoard(log_dir=)` | 训练可视化 |
| `keras.callbacks.ReduceLROnPlateau(factor=, patience=)` | 指标平台期降学习率 |
| `keras.callbacks.LearningRateScheduler(fn)` | 自定义 lr 函数 |
| `keras.callbacks.BackupAndRestore(backup_dir=)` | 崩溃断点续训 |
| `keras.callbacks.CSVLogger(path)` | 指标落盘 |

| keras.utils | 用途 |
| --- | --- |
| `set_random_seed(42)` | 统一随机种子（跨后端可复现） |
| `plot_model(model, show_shapes=True)` | 计算图可视化 |
| `to_categorical(y, num_classes)` | 整数标签转 one-hot |
| `get_file(fname, origin=url)` | 下载并缓存数据文件 |
| `image_dataset_from_directory(dir)` / `text_dataset_from_directory` | 目录直读数据集（3.12 起支持 `format="grain"`） |
| `PyDataset` | 自定义多进程安全数据源基类 |

### 配置与环境变量

| 配置项 | 说明 |
| --- | --- |
| `KERAS_BACKEND` | `jax` / `tensorflow` / `torch`（import 前设定，锁定后不可改） |
| `~/.keras/keras.json` | 持久化 `backend` / `floatx` / `epsilon` |
| `TF_USE_LEGACY_KERAS=1` | 让 TF 2.16+ 的 `tf.keras` 指回 `tf_keras`（Keras 2） |
| `keras.config.enable_unsafe_deserialization()` | 放开 Lambda 等可执行层反序列化（不可信文件勿开） |
| `keras.mixed_precision.set_dtype_policy("mixed_float16")` | 全局混合精度 |

## 保存与导出格式对照

| 需求 | API | 格式 |
| --- | --- | --- |
| 整模型续训/迁移 | `model.save("m.keras")` | `.keras` zip（config.json + model.weights.h5 + metadata） |
| 仅权重 | `model.save_weights("w.weights.h5")` | HDF5（**必须 `.weights.h5` 结尾**） |
| 仅权重（分片） | `save_weights(..., max_shard_size=)` | 分片 HDF5 |
| TF 生态部署 | `model.export("dir/")` | SavedModel |
| 跨框架推理 | `model.export("m.onnx", format="onnx")` | ONNX（`opset_version=` 可调） |
| 端侧 | `model.export("m.tflite", format="litert")` | LiteRT/TFLite（3.13+，需装 TF） |
| 交 PyTorch 生态 | `model.export("m.pt", format="torch")` | 原生 `nn.Module`（3.15+） |

反序列化安全：`keras.saving.load_model` 默认 safe_mode；`Lambda` 等可执行层 fail-closed（3.12–3.15 持续加固），不可信文件不要 `keras.config.enable_unsafe_deserialization()`。

## 版本与兼容

### Keras ↔ 后端兼容矩阵（官方起点）

| 组合 | 版本 |
| --- | --- |
| Keras 3 + TensorFlow | `tensorflow~=2.16.1` & `keras~=3.0` |
| Keras 3 + PyTorch | `torch~=2.1.0` & `keras~=3.0` |
| Keras 3 + JAX | `jax==0.4.20` & `keras~=3.0` |
| Keras 2（旧） | `tensorflow~=2.13/2.14/2.15` & `keras~=2.x` |

### 近期版本要点

| 版本 | 关键变化 |
| --- | --- |
| 3.0（2023-11） | 全面重写；多后端（JAX/TF/Torch，OpenVINO 仅推理）；`keras.ops`；distribution API |
| 3.12 | 蒸馏 API（`Distiller`）；GPTQ 量化；Grain 数据集支持；安全加固开始收紧 |
| 3.13 | **Python ≥ 3.11**；LiteRT 导出；`QuantizationConfig`；Adaptive 池化层 |
| 3.14 | Orbax checkpoint 集成；AWQ / INT4 子通道量化；`ScheduleFreeAdamW`；Gated Attention |
| 3.15 | `export_torch`（→ 原生 nn.Module）；`MultiOptimizer`；`sliding_window` 注意力；causal 自动 Flash SDPA；Ops 扩列 |

迁移提示：TF 2.16+ 的 `tf.keras` 即 Keras 3；旧代码留在 Keras 2 用 `pip install tf_keras` + `TF_USE_LEGACY_KERAS=1`。纯内置层的旧 `tf.keras` 模型多数可直接跑在 Keras 3 上。

## 生态版图

- **KerasHub**（原 KerasNLP，2024 更名）：预训练模型库（Gemma/BERT/Whisper/ResNet/Stable Diffusion），checkpoint 托管 Kaggle Models，三后端可用；`keras-cv` 包仍独立维护视觉层与增广
- **TF 部署链**：SavedModel → TF-Serving / TF.js；LiteRT → 移动端/嵌入式
- **JAX 生态**：optax / Flax（`FlaxLayer`）/ TPU 分布式（`keras.distribution` + Orbax）
- **PyTorch 生态**：Keras 层即 `nn.Module`；`export_torch` 反向交付
- **上游框架**：HF Transformers 的 TF 侧大量模型基于 Keras 实现

## 官方资源

- [Keras 官方文档与指南](https://keras.io/)
- [API Reference](https://keras.io/api/)
- [Keras 3 发布公告](https://keras.io/keras_3/)
- [KerasHub 文档](https://keras.io/keras_hub/)
- [GitHub Releases（版本事实）](https://github.com/keras-team/keras/releases)
- [代码示例库（150+ notebooks）](https://keras.io/examples/)
