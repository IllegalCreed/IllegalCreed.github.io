---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 ONNX Runtime 1.28.0 官方文档（Quantization / Performance / EP）+ onnxruntime.ai 性能指南编写

## 速查

- **动态量化**：`quantize_dynamic`，推理时实时算激活 scale，推荐 Transformer/RNN，无需校准数据
- **静态量化**：`quantize_static`，先用校准数据集预算激活参数写入模型，推荐 CNN，性能更高
- **校准方法**（静态）：`MinMax` / `Entropy` / `Percentile`，影响精度与性能权衡
- **量化格式**：`QDQ`（QuantizeLinear/DequantizeLinear 节点，默认 S8S8）/ `QOperator`（QLinearConv 等专用算子）
- **优化级别**：`ort.SessionOptions.graph_optimization_level`，`ORT_ENABLE_ALL` 开全部图优化
- **线程**：`intra_op_num_threads`（算子内并行）/ `inter_op_num_threads`（算子间并行）
- **CUDA EP**：`providers=["CUDAExecutionProvider"]`，配 `device_id`、`arena_extend_strategy` 控显存
- **内存模式**：`enable_cpu_mem_arena=True`（默认，预分配池）/ `False`（省内存，多模型共存）
- **IO 绑定**：`ort.SessionOptions.add_free_dimension_override_by_denotation` 固定动态维度
- **CUDA Graph**：`OrtSessionOptionsAppendExecutionProvider_CUDA` 捕获图消除启动开销（1.28 GQA 支持）
- **性能分析**：`sess.enable_profiling()` 输出 Chrome trace，定位算子瓶颈

## 量化：动态 vs 静态

ONNX Runtime 的量化把 float32 权重与激活压缩成 int8（或 int4），模型体积降 4×+、推理延迟显著下降。两种路线：

### 动态量化（quantize_dynamic）

```python
from onnxruntime.quantization import quantize_dynamic, QuantType

quantize_dynamic(
    model_input="model.onnx",
    model_output="model_int8.onnx",
    weight_type=QuantType.QInt8,            # 权重 int8
    op_types_to_quantize=["MatMul", "Gemm", "Conv"],  # 只量化这些算子
)
```

- **激活的 scale 在推理时实时计算**——多了一点开销但精度更高
- **无需校准数据**，一行命令即可，适合快速验证
- **推荐 Transformer/RNN/LSTM**（激活分布随输入变化大，静态预算易失真）

### 静态量化（quantize_static）

```python
from onnxruntime.quantization import quantize_static, CalibrationDataReader, QuantFormat, QuantType

class MyCalibReader(CalibrationDataReader):
    def __init__(self):
        self.data = iter([np.random.randn(1, 784).astype(np.float32) for _ in range(100)])
    def get_next(self):
        try:
            return {"input": next(self.data)}
        except StopIteration:
            return None

quantize_static(
    model_input="model.onnx",
    model_output="model_int8_static.onnx",
    calibration_data_reader=MyCalibReader(),
    quant_format=QuantFormat.QDQ,           # QDQ（默认，推荐）/ QOperator
    activation_type=QuantType.QUInt8,        # 激活 uint8
    weight_type=QuantType.QInt8,             # 权重 int8
    calibrate_method="MinMax",               # MinMax / Entropy / Percentile
)
```

- **需提供校准数据集**（CalibrationDataReader），框架用代表性样本预算每层激活的 scale/zero_point
- **激活参数预先算好写入模型常量**，推理无额外开销，性能最高
- **推荐 CNN**（激活分布相对稳定，静态预算足够准）
- **校准方法**：`MinMax`（最快，对异常值敏感）、`Entropy`（KL 散度，更鲁棒）、`Percentile`（分位数，折中）

### QDQ vs QOperator

| 格式 | 表示 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **QDQ**（QuantFormat.QDQ，默认） | 插入 `QuantizeLinear` + `DequantizeLinear` 节点，原算子不变 | 跨 EP 兼容好，引擎可融合 QDQ 节点 | 节点数增加，图变大 |
| **QOperator** | 用专用量化算子（QLinearConv、MatMulInteger）替换原算子 | 节点更少，语义直接 | 跨 EP 兼容差，引擎需逐算子支持 |

默认 **S8S8 + QDQ**（权重与激活都 int8）平衡性能与精度，是 1.28 的推荐起点。

## 图优化

```python
import onnxruntime as ort

opts = ort.SessionOptions()
opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
opts.intra_op_num_threads = 8                # 算子内并行线程数
opts.inter_op_num_threads = 4                # 算子间并行线程数
opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL   # 顺序（默认）/ ORT_PARALLEL

sess = ort.InferenceSession("model.onnx", opts, providers=["CPUExecutionProvider"])
```

优化级别（`graph_optimization_level`）：

| 级别 | 内容 |
| --- | --- |
| `ORT_DISABLE_ALL` | 关闭优化 |
| `ORT_ENABLE_BASIC` | 基础优化（常量折叠、冗余消除） |
| `ORT_ENABLE_EXTENDED` | 扩展优化（内核融合） |
| `ORT_ENABLE_ALL` | 全部（含布局转换、低精度算子选择） |

- **常量折叠**：编译期算出常量子图，省运行时开销
- **内核融合**：Conv+Add+ReLU 融合成单算子，减少访存
- **布局转换**：CPU 上把 NCHW 转 NHWC 加速卷积（1.28 起 NHWC 卷积路径默认开启）

## Execution Provider 进阶

### CUDA EP

```python
providers = [
    ("CUDAExecutionProvider", {
        "device_id": 0,
        "arena_extend_strategy": "kSameAsRequested",   # 显存分配策略
        "gpu_mem_limit": 4 * 1024 * 1024 * 1024,       # 显存上限（字节）
        "cudnn_conv_algo_search": "EXHAUSTIVE",        # 卷积算法搜索
    }),
    "CPUExecutionProvider",
]
sess = ort.InferenceSession("model.onnx", providers=providers)
```

- `cudnn_conv_algo_search`：`DEFAULT`（快）/ `EXHAUSTIVE`（最慢但最优）/ `HEURISTIC`
- 1.28：cuDNN 与 cuFFT 可在运行时按需加载（不必编译期硬绑定）
- GroupQueryAttention（GQA）算子支持量化 KV 缓存，大模型推理省显存

### TensorRT EP

```python
providers = [
    ("TensorrtExecutionProvider", {
        "trt_max_workspace_size": 1 << 32,
        "trt_fp16_enable": True,                        # 启用 fp16
        "trt_int8_enable": False,
    }),
]
```

- TensorRT 会把子图编译成引擎，**首次推理慢（编译）后续快**
- 适合对延迟极致敏感的部署（如在线服务），不适合频繁换模型

### 华为 CANN EP（昇腾）

```python
providers = ["CANNExecutionProvider"]
sess = ort.InferenceSession("model.onnx", providers=providers)
```

- 让 ONNX Runtime 模型跑在华为 Ascend NPU 上
- **当前为 preview 状态、社区维护**——生产前需充分验证算子覆盖与精度

### CoreML EP（Apple）

```python
providers = ["CoreMLExecutionProvider"]
sess = ort.InferenceSession("model.onnx", providers=providers)
```

- macOS/iOS 上把计算下沉到 CoreML（ANE 神经网络引擎）
- 1.28：新增 FusedConv、Tile、Cast(bool) 等算子支持

## 性能调优清单

1. **选对 EP**：NVIDIA 用 CUDA/TensorRT、Intel 用 OpenVINO、Apple 用 CoreML、Windows 游戏卡用 DirectML
2. **优化级别拉满**：`ORT_ENABLE_ALL` 开全部图优化
3. **批量化推理**：单条延迟高时，攒 batch 一起跑，吞吐显著提升
4. **量化**：精度允许时上 int8，体积与延迟双降
5. **线程调优**：CPU 上 `intra_op_num_threads` 通常设为物理核数；多模型共存时降低避免争抢
6. **CUDA Graph 捕获**：固定输入 shape 的推理用 CUDA Graph 消除算子启动开销（1.28 起更多算子支持）
7. **内存模式**：单模型用默认 arena；多模型共存的边缘设备关 arena（`enable_cpu_mem_arena=False`）
8. **Profile 定位**：`sess.enable_profiling()` 输出 Chrome trace，用 `chrome://tracing` 打开找瓶颈算子

## 跨框架转换

| 框架 | 工具 | 命令 |
| --- | --- | --- |
| PyTorch | `torch.onnx.export(dynamo=True)` | `torch.onnx.export(model, args, "m.onnx", dynamo=True)` |
| TensorFlow | `tf2onnx` | `python -m tf2onnx.convert --saved-model dir --output m.onnx` |
| MindSpore | `ms.export` | `ms.export(net, *inputs, file_format="ONNX")` |
| scikit-learn | `skl2onnx` | `skl2onnx.convert_sklearn(model, initial_types)` |
| JAX/Flax | `jax2onnx` / 经 PyTorch 中转 | 社区项目，路径多样 |
| Keras | `tf2onnx`（Keras → SavedModel → ONNX） | 两步转换 |

转换后务必：
- `onnx.checker.check_model` 校验合规
- 用代表性输入比对转换前后的输出（数值差异应在 1e-3 量级）
- 必要时用 `onnxsim` 简化图（折叠常量、消除 identity 节点）

## 常见坑

- **opset 冲突**：目标引擎只支持低 opset，导出时降版本或升引擎
- **动态 shape 失败**：未声明 `dynamic_shapes` 导致 batch 固定，推理时报维度错误
- **自定义算子不跨引擎**：导出时用了训练框架专有算子，其他引擎无法加载——尽量用标准算子重写
- **dtype 不匹配**：模型是 float32 但传了 float64 NumPy，报输入类型错误
- **EP 顺序错**：providers 列表第一个不可用才回退，把想用的 EP 放最前
