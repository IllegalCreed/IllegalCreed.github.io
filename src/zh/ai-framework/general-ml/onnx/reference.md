---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 ONNX 标准 1.22（IR 13 / opset 27）+ ONNX Runtime 1.28.0 API 文档整理

## 速查

- **标准库**：`pip install onnx`（创建/加载/校验/操作模型）
- **推理引擎**：`pip install onnxruntime`（CPU）/ `onnxruntime-gpu`（CUDA）
- **IR 版本**：当前 **13**（随 ONNX 1.22）
- **标准 opset**：当前 **27**（ai.onnx 域）
- **ORT 版本**：**1.28.0**（2026-07-25）
- **Python API**：`onnx.load/save/checker`、`onnxruntime.InferenceSession`
- **数据类型**：`TensorProto.FLOAT(1)` / `UINT8(2)` / `INT8(3)` / `INT64(7)` / `FLOAT16(10)` / `BFLOAT16(16)` / `STRING(8)`
- **量化类型**：`QuantType.QInt8/QUInt8/QInt4/QUInt4`
- **量化格式**：`QuantFormat.QDQ/QOperator`
- **优化级别**：`GraphOptimizationLevel.ORT_DISABLE_ALL/BASIC/EXTENDED/ALL`
- **EP 列表**：CPU/CUDA/TensorRT/TensorRT-RTX/CoreML/OpenVINO/oneDNN/DirectML/QNN/NNAPI/CANN/ROCm/MIGraphX/Vitis-AI/WebGPU/ACL/ArmNN/TVM/RKNPU/XNNPACK/Azure
- **模型格式**：`.onnx`（protobuf）；`.ort`（ORT 优化后的预编译格式）

## 模型结构（Protobuf）

```
ModelProto
├── ir_version
├── opset_import: [OperatorSetIdProto]    # {domain: "", version: 27}
├── producer_name / producer_version
├── graph: GraphProto
│   ├── name
│   ├── node: [NodeProto]
│   │   ├── name
│   │   ├── op_type                        # "Conv" / "MatMul" / ...
│   │   ├── domain                         # "" 表示标准域
│   │   ├── input: [str]                   # 边名
│   │   ├── output: [str]
│   │   └── attribute: [AttributeProto]    # 算子属性
│   ├── input: [ValueInfoProto]            # 含 shape 与 dtype
│   ├── output: [ValueInfoProto]
│   └── initializer: [TensorProto]         # 权重张量
```

- **ValueInfoProto**：描述张量的 name/shape/dtype，shape 中 `-1` 或 `dim_param` 表示动态
- **AttributeProto**：算子属性（int/float/string/tensor/列表），如 Conv 的 `kernel_shape`、`strides`、`pads`

## onnx Python API

```python
import onnx

# 加载与保存
model = onnx.load("model.onnx")
onnx.save(model, "out.onnx")

# 校验
onnx.checker.check_model(model)                    # 抛异常即不合规

# 查看结构
print(model.ir_version)                            # 13
print([(opset.domain, opset.version) for opset in model.opset_import])  # [("", 27)]
graph = model.graph
for node in graph.node:
    print(node.op_type, node.input, "->", node.output)

# 版本转换
from onnx import version_converter
model_old = version_converter.convert_version(model, 21)

# 形状推断
import onnx.shape_inference
model_inferred = onnx.shape_inference.infer_shapes(model)
```

## onnxruntime Python API

```python
import onnxruntime as ort
import numpy as np

# 创建会话
sess = ort.InferenceSession(
    "model.onnx",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)

# 元信息
inputs = sess.get_inputs()                         # [Input: name/shape/type]
outputs = sess.get_outputs()
print(inputs[0].name, inputs[0].shape, inputs[0].type)

# 推理
feed = {inputs[0].name: np.random.randn(*shape).astype(np.float32)}
result = sess.run(None, feed)                      # None=全部输出；或指定 [output_name]
result = sess.run(["logits"], feed)                # 只要 logits

# 多输出与绑定（避免重复拷贝）
binding = sess.io_binding()                        # 高性能 IO 绑定（CUDA 上零拷贝）

# 性能分析
sess.enable_profiling("trace.json")                # 输出 Chrome trace
```

### SessionOptions 完整参数

```python
opts = ort.SessionOptions()
opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
opts.intra_op_num_threads = 8
opts.inter_op_num_threads = 4
opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL  # 或 ORT_PARALLEL
opts.enable_cpu_mem_arena = True                    # 默认开（预分配池）
opts.enable_mem_pattern = True                      # 内存复用模式
opts.add_free_dimension_override_by_denotation("batch", 1)  # 固定动态维度
opts.log_severity_level = 3                         # 日志级别
```

## 量化 API

```python
from onnxruntime.quantization import (
    quantize_dynamic, quantize_static,
    QuantType, QuantFormat, CalibrationDataReader,
    CalibrationMethod,
)

# 动态量化
quantize_dynamic(
    model_input="model.onnx",
    model_output="model_dyn.onnx",
    weight_type=QuantType.QInt8,                    # QInt8 / QUInt8 / QInt4 / QUInt4
    op_types_to_quantize=["MatMul", "Gemm", "Conv", "LSTM"],
    per_channel=True,                               # 按通道量化（精度更高）
)

# 静态量化（需校准数据）
quantize_static(
    model_input="model.onnx",
    model_output="model_static.onnx",
    calibration_data_reader=reader,
    quant_format=QuantFormat.QDQ,                   # QDQ（默认）/ QOperator
    activation_type=QuantType.QUInt8,
    weight_type=QuantType.QInt8,
    calibrate_method=CalibrationMethod.MinMax,      # MinMax / Entropy / Percentile
    per_channel=True,
    reduce_range=False,                             # True 用 7-bit 调试精度问题
)
```

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `weight_type` | QInt8/QUInt8/QInt4/QUInt4 | 权重量化类型 |
| `activation_type` | QUInt8/QInt8 | 激活量化类型（仅静态） |
| `quant_format` | QDQ/QOperator | 量化表示格式 |
| `calibrate_method` | MinMax/Entropy/Percentile | 校准算法（仅静态） |
| `per_channel` | bool | 按通道（每输出通道独立 scale） vs 按张量 |
| `op_types_to_quantize` | list | 只量化指定算子类型 |

## Execution Provider 列表

| EP（providers 字符串） | 厂商 | 平台 | 状态 |
| --- | --- | --- | --- |
| `CPUExecutionProvider` | 通用 | 全平台 | stable，默认 |
| `CUDAExecutionProvider` | NVIDIA | CUDA GPU | stable |
| `TensorrtExecutionProvider` | NVIDIA | TensorRT | stable |
| `TensorRTRTXExecutionProvider` | NVIDIA | RTX 显卡 | 1.x 新增 |
| `OpenVINOExecutionProvider` | Intel | CPU/iGPU/VPU | stable |
| `CoreMLExecutionProvider` | Apple | macOS/iOS | stable |
| `DmlExecutionProvider` | Microsoft | Windows DirectML | stable |
| `QnnExecutionProvider` | Qualcomm | HTP/NPU | stable |
| `AiExecutionProvider` / `NnapiExecutionProvider` | Android | NNAPI | stable |
| `CANNExecutionProvider` | 华为 | 昇腾 NPU | preview，社区维护 |
| `RocmExecutionProvider` | AMD | ROCm | stable |
| `MIGraphXExecutionProvider` | AMD | MIGraphX | stable |
| `VitisAIExecutionProvider` | AMD | Vitis AI | stable |
| `WebGpuExecutionProvider` | W3C | 浏览器 GPU | 1.28 起独立插件 |
| `AclExecutionProvider` | Arm | Arm Compute Library | stable |
| `ArmNNExecutionProvider` | Arm | Arm NN | 1.25 起移除 |
| `TvmExecutionProvider` | Apache | TVM | stable |
| `RknpuExecutionProvider` | 瑞芯微 | RKNPU | stable |
| `XnnpackExecutionProvider` | Google | XNNPACK | stable |
| `AzureExecutionProvider` | Microsoft | Azure 云 | stable |

## opset 版本演进

| ONNX 版本 | IR 版本 | 标准 opset | 关键新增 |
| --- | --- | --- | --- |
| 1.13 | 9 | 19 | LayerNormalization、DynamicQuantizeLinear 改进 |
| 1.14 | 9 | 19 | （同上版本族） |
| 1.15 | 9 | 20 | GridSample、BitwiseShift 等 |
| 1.16 | 9 | 21 | AffineGrid、DeformConv 等 |
| 1.17 | 9 | 22 |bicubic resize 等 |
| 1.18 | 9 | 23 | Macro 扩展、更多量化算子 |
| 1.19–1.21 | 9–10 | 24–26 | IR 10 引入更多类型 |
| **1.22** | **13** | **27** | bfloat16 完善、新注意力算子 |

> 升级 opset 可用新算子，但目标引擎需支持对应版本——ONNX Runtime 1.28 支持 opset 27 全集。

## IR 版本与 Python onnx 兼容

| IR 版本 | onnx 库版本 | 关键变化 |
| --- | --- | --- |
| 7 | 1.6–1.8 | 早期稳定版 |
| 8 | 1.9–1.12 | 引入更多类型 |
| 9 | 1.13–1.21 | opset 19–26 主流期 |
| **13** | **1.22+** | 当前，支持最新算子与类型 |

## 模型格式与工具

- **`.onnx`**：标准 protobuf 格式，跨引擎通用
- **`.ort`**：ONNX Runtime 预编译格式（`prepacked`），启动更快但锁定引擎版本
- **`.pb`**：并非 ONNX 格式（是 TF 的 protobuf），勿混淆
- **ONNX Model Zoo**：[github.com/onnx/models](https://github.com/onnx/models) 官方预训练模型仓库
- **Netron**：[netron.app](https://netron.app/) 在线可视化工具
- **onnxsim**：`pip install onnxsim && onnxsim model.onnx model_sim.onnx` 图简化
- **onnxoptimizer**：图优化（常量折叠、融合），部分功能已并入 ORT

## 官方资源

- [ONNX 标准](https://onnx.ai/)
- [ONNX 算子参考](https://onnx.ai/onnx/operators/)
- [ONNX Runtime 文档](https://onnxruntime.ai/docs/)
- [ONNX Runtime Tutorials](https://onnxruntime.ai/docs/tutorials/)
- [ONNX Model Zoo](https://github.com/onnx/models)
- [onnx/onnx Releases](https://github.com/onnx/onnx/releases)
- [microsoft/onnxruntime Releases](https://github.com/microsoft/onnxruntime/releases)
