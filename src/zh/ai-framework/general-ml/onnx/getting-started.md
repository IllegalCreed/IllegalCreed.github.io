---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 ONNX 标准 1.22（IR 13 / opset 27）+ ONNX Runtime 1.28.0 官方文档（onnx.ai / onnxruntime.ai）编写

## 速查

- **是什么**：ONNX 是开放、跨框架的模型表示标准（算子标准 + protobuf 文件格式），不是训练框架
- **当前版本**：ONNX 标准 IR 13 / opset 27（随 ONNX 1.22）；ONNX Runtime 1.28.0（2026-07-25）
- **安装推理引擎**：`pip install onnxruntime`（CPU）/ `onnxruntime-gpu`（CUDA）
- **安装标准库**：`pip install onnx`（创建/校验/操作 ONNX 模型图）
- **导出**（PyTorch）：`torch.onnx.export(model, args, "m.onnx", dynamo=True)`（推荐 dynamo）/ 旧式 TorchScript 已不推荐
- **导出**（TF）：`python -m tf2onnx.convert --saved-model dir --output m.onnx`
- **校验**：`onnx.checker.check_model(model)` 检查模型是否符合标准
- **推理**（Python）：`import onnxruntime as ort; sess = ort.InferenceSession("m.onnx"); sess.run(None, {input: data})`
- **可视化**：上传 `.onnx` 到 [Netron](https://netron.app/) 或本地 `netron m.onnx`
- **量化**：`onnxruntime.quantization.quantize_dynamic`（动态，推荐 Transformer）/ `quantize_static`（静态，需校准数据，推荐 CNN）
- **EP**：InferenceSession 的 `providers=` 参数选后端，如 `["CUDAExecutionProvider","CPUExecutionProvider"]`
- **简化图**：`onnxsim` 第三方工具折叠常量、消除冗余节点，常用于导出后清理

## ONNX 模型长什么样

一个 ONNX 模型（`.onnx` 文件）本质是一段 protobuf 序列化的结构，顶层是 `ModelProto`，包含：

```
ModelProto
├── ir_version: 13               # IR 版本（当前 13）
├── opset_import: [opset 27]     # 依赖的算子集版本
└── graph: GraphProto            # 计算图
    ├── input: [TensorProto...]  # 输入张量（名称、形状、dtype）
    ├── output: [TensorProto...] # 输出张量
    ├── node: [NodeProto...]     # 算子节点序列（有序）
    │   ├── op_type: "Conv"      #   算子类型（来自 opset）
    │   ├── input: [...]         #   输入边名
    │   ├── output: [...]        #   输出边名
    │   └── attribute: {kernel_shape: [3,3], ...}  # 算子属性
    └── initializer: [TensorProto...]  # 初始权重（常量张量）
```

- **Node 不含数据，只声明算子与边的连接关系**（边是张量名）
- **Initializer 是嵌入模型的权重张量**（卷积核、BN 参数等）
- **opset_import 声明依赖的算子版本**——引擎据此判断能否加载

## 从 PyTorch 导出第一个模型

PyTorch 2.x 推荐用 dynamo 导出（基于 torch.export + TorchFX 捕获图），旧的 TorchScript 路径已不推荐：

```python
import torch
import torch.nn as nn

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(784, 10)
    def forward(self, x):
        return self.fc(x)

model = Net().eval()
dummy = torch.randn(1, 784)

# 推荐：dynamo 导出（基于 torch.export）
torch.onnx.export(
    model, (dummy,), "net.onnx",
    dynamo=True,                 # 使用 dynamo 导出器
    input_names=["input"],
    output_names=["logits"],
)
# 默认导出 opset 与 PyTorch 版本绑定，2.9 起默认 opset 20
```

- `dynamo=True` 用 TorchDynamo 捕获，**对动态控制流与 Python 语义覆盖更好**（推荐）
- 不传 `dynamo=True` 则走旧 TorchScript 路径（已 deprecated，新代码勿用）
- `dynamic_shapes`（替代旧 `dynamic_axes`）声明可变维度，让 batch/seq 可变

## 校验与检查

```python
import onnx

model = onnx.load("net.onnx")
onnx.checker.check_model(model)           # 不抛异常即合规

print(model.ir_version)                    # 13
print([opset.version for opset in model.opset_import])  # [27]
print([(n.op_type, n.input, n.output) for n in model.graph.node])
```

**opset 版本兼容**：目标推理引擎只支持到某 opset（如旧版 ORT 只到 21），新模型需降版本：

```python
from onnx import version_converter
model_old = version_converter.convert_version(model, 21)   # 降到 opset 21
```

## ONNX Runtime 推理

```python
import onnxruntime as ort
import numpy as np

# 选执行后端（EP）：providers 是优先级列表，找不到第一个就用下一个
sess = ort.InferenceSession(
    "net.onnx",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)

print([i.name for i in sess.get_inputs()])    # ['input']
print([o.name for o in sess.get_outputs()])   # ['logits']

# 推理：传 {输入名: numpy 数组}
x = np.random.randn(1, 784).astype(np.float32)
outputs = sess.run(None, {"input": x})         # None 表示取全部输出
logits = outputs[0]
pred = logits.argmax(axis=1)
```

要点：

- **输入必须是 NumPy 数组**（不是 torch.Tensor），dtype 与模型一致（多为 float32）
- **`providers` 是优先级列表**——首选 CUDA EP，不可用则回退 CPU EP
- **`sess.run(output_names, feed_dict)`** 第一个参数指定要哪些输出（None = 全部）
- 高吞吐场景用 `sess.run` 批量 + `ort.SessionOptions` 调线程数（`intra_op_num_threads`）

## 可视化：Netron

[Netron](https://netron.app/) 是查看 ONNX 图结构的标配工具：

- 在线上传 `.onnx` 文件，立即渲染节点拓扑
- 点击节点查看属性（kernel_shape、strides、权重 shape）
- 也可本地安装：`pip install netron && netron m.onnx`

## 执行后端（EP）速查

| Execution Provider | 厂商/平台 | 备注 |
| --- | --- | --- |
| `CPUExecutionProvider` | 通用 | 默认，MLAS 优化内核 |
| `CUDAExecutionProvider` | NVIDIA | cuDNN/cuFFT 可选运行时加载 |
| `TensorrtExecutionProvider` | NVIDIA | 高性能，需先装 TensorRT |
| `OpenVINOExecutionProvider` | Intel | CPU/iGPU/VPU |
| `CoreMLExecutionProvider` | Apple | macOS/iOS 神经网络后端 |
| `DmlExecutionProvider` | Windows | DirectML，游戏显卡友好 |
| `QnnExecutionProvider` | Qualcomm | 高通 HTP/NPU |
| `CANNExecutionProvider` | 华为 | 昇腾 NPU（preview，社区维护） |
| `RocmExecutionProvider` | AMD | ROCm |
| `WebGpuExecutionProvider` | Web | 浏览器 GPU（1.28 起独立插件 v0.1.0） |

## 下一步

- 量化与性能优化：见 [指南](./guide-line.md)
- 完整算子与 API 速查：见 [参考](./reference.md)
- 跨框架转换（TF/MindSpore/JAX → ONNX）：参考各框架的 export 文档
