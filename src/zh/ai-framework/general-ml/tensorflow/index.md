---
layout: doc
---

# TensorFlow

TensorFlow 是 Google Brain 团队 2015 年开源、至今由 Google 主导的深度学习平台，核心由四部分构成：**张量计算核心**（`tf.Tensor` + Eager Execution，TF2 起默认即时执行，与 PyTorch 风格对齐）、**`tf.function` 图编译机制**（AutoGraph 把 Python 函数转成静态计算图，可叠加 XLA 融合加速）、**内置 Keras 3 高级 API**（`tf.keras` 即主线建模入口，2.16 起 Keras 3 为默认实现，同一模型可切换 TF/JAX/PyTorch 三后端）与 **`tf.data` 输入管线**（声明式流式数据管道，AUTOTUNE 自动调并行度）。它最大的生态位差异是**生产部署矩阵**：SavedModel 作为统一模型交换格式，向下接 TF Serving（gRPC/REST 在线服务）、TFLite（移动端/嵌入式，2.20 起官方宣布迁移至 LiteRT）与 TensorFlow.js（浏览器/Node.js），覆盖「训练—服务—端侧—Web」全链路，这是它相对 PyTorch 最坚硬的护城河。截至 2026 年 7 月，稳定版为 **2.21.0**（2026-03 发布）：移除 Python 3.9 支持、TensorBoard 不再随包依赖、TFLite 扩展 int2/uint4 量化算子；Python 支持 3.10–3.13，捆绑 Keras ≥ 3.12。信源 tensorflow.org 官方安装文档 + GitHub Releases。

## 评价

**优点**

- **部署矩阵业界最全**：SavedModel 一份格式多端落地——TF Serving 在线服务（版本管理/金丝雀）、TFLite/LiteRT 走移动端嵌入式、TFJS 跑浏览器与 Node.js，训练到生产链路闭环
- **Keras 3 内置主线**：`tf.keras` 就是 Keras 3，API 久经打磨学习曲线平缓；同一 Keras 模型可切换 JAX/PyTorch 后端，不被单一框架锁死
- **eager 与图编译双修**：默认即时执行方便调试，`@tf.function` 一键捕获计算图，叠加 `jit_compile=True` 走 XLA 内核融合，开发体验与性能兼得
- **tf.data 输入管线成熟**：声明式 `map/batch/prefetch` 链式组合，`AUTOTUNE` 自动调并行度，TFRecord + `interleave` 支撑大规模训练吞吐
- **生产工具链沉淀深**：TensorBoard 可视化、TFX 端到端流水线、TF Profiler 性能分析、KerasTuner 调参，工程化组件齐全
- **Google 内部大规模验证**：搜索/广告/翻译等核心产品线长期使用，TPU 一等公民支持，稳定性有背书

**缺点**

- **API 历史包袱重**：1.x 静态图遗产（Session/placeholder）与 2.x eager 并存，老教程与 `tf.compat.v1` 代码混杂，新手极易踩进过时写法
- **研究生态被 PyTorch 反超**：顶会论文复现率、Hugging Face 一等公民地位均落后于 PyTorch，学术影响力持续收缩
- **版本迁移阵痛明显**：2.16 Keras 3 默认、2.20 宣布 tf.lite 弃用迁 LiteRT、2.21 移除 TensorBoard 依赖，跨版本升级必须细读 Breaking Changes
- **Windows/macOS 支持缩水**：2.11 起原生 Windows 不再支持 GPU（需 WSL2），macOS 无官方 GPU 支持，桌面体验 Linux 优先
- **TFLite 正处过渡期**：tf.lite 弃用公告已发、LiteRT 迁移进行中，文档与工具链存在分裂，选型需盯进度
- **wheel 体积大依赖重**：全功能包数百 MB；2.21 起 TensorBoard 还需单独 `pip install tensorboard`

## 文档地址

- [TensorFlow 官方 API 文档](https://www.tensorflow.org/api_docs)
- [TensorFlow 官方教程与指南](https://www.tensorflow.org/tutorials)
- [pip 安装向导（含 GPU 配置）](https://www.tensorflow.org/install/pip)
- [TensorFlow 2.21.0 Release Notes](https://github.com/tensorflow/tensorflow/releases)

## GitHub地址

[tensorflow/tensorflow](https://github.com/tensorflow/tensorflow)

## 幻灯片地址

<a href="/SlideStack/tensorflow-slide/" target="_blank">TensorFlow</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">TensorFlow 测试题</a>
