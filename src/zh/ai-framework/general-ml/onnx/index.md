---
layout: doc
---

# ONNX

ONNX（Open Neural Network Exchange，开放神经网络交换）是一种**开放、跨框架的模型表示标准**，由 Microsoft 与 Facebook（现 Meta）于 2017 年联合发起，现由 Linux 基金会托管。它的核心使命是打破训练框架与推理引擎之间的「锁定」：定义一套**与具体框架无关的算子标准（opset）**和**统一的模型文件格式（基于 protobuf）**，让开发者可以在 PyTorch、TensorFlow、MindSpore、JAX 等任一框架训练模型，导出成 `.onnx` 后，再交给任一推理引擎（ONNX Runtime、TensorRT、OpenVINO、CoreML、TVM 等）加载执行。一个 ONNX 模型由三部分构成：**算子图（Graph）**（节点 Node 序列 + 边的张量流）、**标准算子集（opset）**（如 Conv、MatMul、Softmax 等跨框架共识算子，按版本号演进）与**初始权重（Initializer）**。配套的 **ONNX Runtime** 是微软开源的高性能推理引擎，通过 **Execution Provider（EP）** 机制适配 CPU、CUDA、TensorRT、CoreML、DirectML、OpenVINO、Qualcomm QNN、华为 CANN（昇腾）等十余种硬件后端，并内置动态/静态量化、内核融合等优化。截至 2026 年 7 月，**ONNX 标准最新 IR 版本 13、opset 27**（随 ONNX 1.22 发布）；**ONNX Runtime 最新稳定版 1.28.0**（2026-07-25 发布），新增 WebGPU EP 正式版、CUDA EP GroupQueryAttention 量化 KV 缓存等特性。信源 onnx.ai + onnxruntime.ai + GitHub Releases。

## 评价

**优点**

- **真正的跨框架互操作**：PyTorch/TF/MindSpore/JAX 训练 → ONNX → 任意引擎推理，避免被单一框架/硬件锁定，是「训练-推理解耦」的事实标准
- **算子标准成熟稳定**：opset 按版本演进（最新 27），算子语义有规范文档与一致性测试（ONNX Model Zoo 验证），跨实现行为可预期
- **ONNX Runtime 性能强劲**：内核融合 + 多 EP 后端，CPU 推理常用 MLAS、GPU 用 CUDA/TensorRT，单机推理延迟与吞吐在多数场景优于原生框架 eager
- **硬件覆盖极广**：通过 EP 机制覆盖 NVIDIA/Intel/AMD/Apple/Qualcomm/华为/瑞芯微等几乎所有主流芯片，一份模型多端部署
- **量化开箱即用**：内置动态/静态量化（PTQ），QDQ 格式默认 S8S8 平衡性能与精度，CNN 与 Transformer 都有成熟方案
- **生态与工具链完整**：ONNX Model Zoo 提供预训练模型、`onnx` Python 库可校验/简化图、Netron 可可视化，上下游工具丰富

**缺点**

- **算子覆盖仍有缝隙**：新算子（如最新注意力变体、自定义算子）常常滞后于训练框架，需等 opset 升级或用自定义算子（失去跨引擎可移植性）
- **动态控制流支持弱**：onnx 标准对 If/Loop/Scan 等动态结构支持有限，依赖数据形状的复杂控制流导出常失败或性能差
- **版本碎片化**：opset 7 到 27 跨度大，老引擎只支持低 opset，新模型常需降版本（`onnxsim`/`opset 冲突`），调试体验割裂
- **训练支持边缘化**：ONNX 虽有训练标准但生态远不及推理，绝大多数场景仍只做推理导出，训练侧仍依赖原生框架
- **导出与原始模型行为偶有偏差**：torch.onnx dynamo 与 TorchScript 两条导出路径行为不完全一致，数值/控制流差异需人工校验
- **调试与可解释性弱**：ONNX 图是 protobuf 序列化的算子序列，定位「为何结果不对」远比在 PyTorch 里断点难

## 文档地址

- [ONNX 官方文档（标准）](https://onnx.ai/)
- [ONNX 算子标准（Operators）](https://onnx.ai/onnx/operators/)
- [ONNX 版本与 IR 演进](https://github.com/onnx/onnx/blob/main/docs/Versioning.md)
- [ONNX Runtime 官方文档](https://onnxruntime.ai/docs/)

## GitHub地址

- [onnx/onnx](https://github.com/onnx/onnx)（标准与算子定义）
- [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)（推理引擎）

## 幻灯片地址

<a href="/SlideStack/onnx-slide/" target="_blank">ONNX</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ONNX" target="_blank" rel="noopener noreferrer">ONNX 测试题</a>
