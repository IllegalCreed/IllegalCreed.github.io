---
layout: doc
---

# Keras

Keras 是 François Chollet 2015 年创立、现由 Keras 团队（Google）维护的开源深度学习高级 API。Keras 3（2023 年 11 月发布的全面重写版）的核心设计是**一套 API、四个后端**：同一份模型代码无需修改即可运行在 **JAX、TensorFlow、PyTorch** 之上（另有 OpenVINO 推理专用后端），后端在 `import keras` 之前通过 `KERAS_BACKEND` 环境变量选定。其抽象体系围绕 **`keras.layers.Layer` / `keras.Model`**（Sequential、Functional、子类化三种建模方式）与**内置训练循环 `fit` / `evaluate` / `predict`** 展开——这三个内置循环还能直接消费任意来源的数据（NumPy、Pandas、`tf.data.Dataset`、PyTorch `DataLoader`），与后端无关；跨后端自定义组件则通过 **`keras.ops`**（完整 NumPy API + 神经网络算子）编写。与 TensorFlow 的关系已经演变：TF 2.0–2.15 时代 `pip install tensorflow` 附带的是 Keras 2（`tf.keras`）；**TF 2.16 起 `tf.keras` 即 Keras 3**，旧 Keras 2 以 `tf_keras` 包继续维护。预训练模型生态由 **KerasHub** 承载（KerasNLP 更名而来，并吸收视觉模型），数百个 checkpoint 可在任意后端加载。截至 2026 年 7 月，稳定版为 **3.15.0**（2026-06-24）：新增 `export_torch`（导出原生 PyTorch `nn.Module`）、`MultiOptimizer`、滑动窗口注意力与 causal 注意力自动 Flash SDPA；此前 3.12 引入蒸馏 API 与 GPTQ 量化、3.13 引入 LiteRT 导出（并要求 Python ≥ 3.11）、3.14 集成 Orbax checkpoint。信源 keras.io 官方文档 + GitHub keras-team/keras Releases。

## 评价

**优点**

- **API 设计以人为中心**：报错信息可读、默认值合理、文档质量高，公认是深度学习框架里上手曲线最平缓的
- **真·多后端**：同一份代码在 JAX/TF/PyTorch 间切换只需改环境变量，可按任务选性能最优后端，也可把 Keras 组件嵌进任意后端的原生工作流
- **内置训练循环生产级**：`fit` 自带进度条、指标聚合、验证、回调体系（EarlyStopping/ModelCheckpoint/TensorBoard），八成场景不用手写训练循环
- **数据来源自由**：`fit`/`evaluate`/`predict` 通吃 NumPy、Pandas、`tf.data.Dataset`、PyTorch `DataLoader`，不锁数据管线
- **部署出口多**：`model.export()` 一条 API 出 SavedModel / ONNX / LiteRT（3.13+）/ 原生 PyTorch Module（3.15+），跨框架交付成本低
- **KerasHub 预训练生态**：Gemma、BERT、ResNet、Stable Diffusion 等 `from_preset` 一行加载，且天然三后端可用

**缺点**

- **高级抽象藏细节**：`fit` 封装过深，非常规训练（GAN、多模型交替、复杂梯度操作）仍需退回 `train_step` 重写或后端原生循环
- **后端能力不齐**：新特性常 JAX 先行（如分布式 API），Torch/TF 后端偶有小行为差异与滞后 bug，「同码同果」以内置层为前提
- **自定义组件跨后端有纪律**：只有全程使用 `keras.ops` 才能保证跨后端等价，一旦调了 `tf.`/`torch.` 原生函数就锁死后端
- **反序列化安全收紧后迁移阵痛**：3.12–3.15 持续加固 HDF5/归档/Lambda 反序列化，旧存档与 `Lambda` 层加载在新版可能直接报错
- **版本矩阵要查表**：TF 2.15 会覆盖安装 Keras 2、3.13 起要求 Python ≥ 3.11、后端兼容版本有对应矩阵，环境搭配不看文档容易踩坑
- **超大模型训练生态偏弱**：万卡级并行、RLHF 等前沿训练栈仍以原生 JAX/PyTorch 为主，Keras 分布式 API 相对年轻

## 文档地址

- [Keras 官方文档（keras.io）](https://keras.io/)
- [Getting started（安装与后端配置）](https://keras.io/getting_started/)
- [Keras 3 发布公告](https://keras.io/keras_3/)
- [Keras API Reference](https://keras.io/api/)
- [Keras 3.15.0 Release Notes](https://github.com/keras-team/keras/releases)

## GitHub地址

[keras-team/keras](https://github.com/keras-team/keras)

## 幻灯片地址

<a href="/SlideStack/keras-slide/" target="_blank">Keras</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">Keras 测试题</a>
