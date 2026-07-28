---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 PaddlePaddle 3.3 官方文档（动静统一 / Fleet API / 推理部署 / 国产硬件适配 / PaddleOCR & PaddleNLP）编写

## 速查

- **动静统一**：3.x 保证动态图与静态图二进制 API 输出一致，动态图开发、静态图部署无缝
- **自动并行**：3.2/3.3 引入，只需少量张量切分标注（sharding annotation）即可分布式训练
- **Fleet API**：`paddle.distributed.fleet`，数据并行（默认）/模型并行/混合并行的统一入口
- **初始化分布式**：`fleet.init(role)` → `strategy = DistributedStrategy()` → `optimizer = fleet.distributed_optimizer(optimizer)`
- **静态图**：`paddle.static.Program` + `Executor`，用于部署极致优化；动静产出一致后多数场景无需手写
- **Paddle Inference**：`paddle.inference` 模块，服务端 GPU/CPU 推理，集成 TensorRT/oneDNN
- **Paddle Lite**：移动端/边缘/IoT，独立包 `paddlelite`，支持 ARM/ARM GPU/NPU
- **Paddle Serving**：在线微服务，`paddle-serving-server`/`paddle-serving-client`，HTTP/RPC
- **Paddle2ONNX**：`paddle2onnx` 包，转 ONNX 交 ONNX Runtime/TensorRT
- **国产硬件**：paddle-npu（昇腾）、paddle-xpu（昆仑芯）、海光 DCU、寒武纪 MLU 适配
- **混合精度**：`paddle.amp.auto_cast` + `paddle.amp.GradScaler`（API 与 PyTorch 对齐）
- **动转静**：`paddle.jit.to_static`（基于源码转写，部署常用）

## 动静统一与自动并行

### 动静统一（3.x 核心特性）

3.x 确保**动态图与静态图二进制 API 输出一致**——动态图写代码、调试方便，静态图用于性能优化与部署，两者不再产生「训练动态图、部署静态图时行为漂移」的坑：

```python
import paddle

# 动态图开发（默认）
x = paddle.randn([4, 3])
y = paddle.nn.functional.relu(x)

# 同一份代码可转静态图部署（产出与动态图一致）
static_func = paddle.jit.to_static(dynamic_func)
```

- `paddle.jit.to_static`：基于源码转写，把动态图函数/层转为静态 Program，用于推理部署
- 动静一致消除了「训练用动态图、部署被迫重写静态图」的双重成本

### 自动并行（3.2/3.3）

传统分布式要手写 `paddle.distributed` 的通信原语；3.x 的**自动并行**让用户只需给关键张量加**切分标注**（sharding annotation），框架自动推导通信与切分：

```python
# 伪代码：标注某张量在第 0 维按设备切分
x = paddle.shard(x, dims=['mp'])     # 模型并行切分
# 其余通信框架自动插入
```

- 降低了模型并行/张量并行的工程门槛
- 适合大模型训练（千亿参数 ERNIE 等）

## Fleet API：分布式训练

`paddle.distributed.fleet` 是飞桨分布式训练的统一入口，覆盖从单机多卡到千卡集群：

```python
import paddle.distributed.fleet as fleet
from paddle.distributed.fleet import DistributedStrategy

# ① 初始化
fleet.init(is_collective=True)          # collective 模式（多机数据并行）

# ② 配置策略
strategy = DistributedStrategy()
strategy.amp = True                     # 自动混合精度
strategy.recompute = True               # 梯度检查点（省显存）

# ③ 包装优化器
optimizer = paddle.optimizer.Adam(learning_rate=1e-3, parameters=model.parameters())
optimizer = fleet.distributed_optimizer(optimizer, strategy)

# ④ 正常训练循环
for x, y in loader:
    loss = model(x)
    loss.backward()
    optimizer.step()
    optimizer.clear_grad()
```

| 并行策略 | 适用 | 配置 |
| --- | --- | --- |
| 数据并行 | 默认，每卡一份模型、切分数据 | collective 模式 |
| 模型并行 | 大模型单卡装不下 | sharding + 通信原语 |
| 混合并行 | 推荐系统 Embedding 巨大 | data + model 并行组合 |
| Pipeline 并行 | 层间切分到不同设备 | `strategy.pipeline` |

- 数据并行用 `paddle.distributed.init_parallel_env()` + `DataLoader`（自动切分）
- 推荐系统场景的参数服务器模式：`fleet.init(role=role, is_collective=False)`

## 混合精度训练（AMP）

飞桨 AMP API 与 PyTorch 高度对齐：

```python
scaler = paddle.amp.GradScaler()

for x, y in loader:
    with paddle.amp.auto_cast():                    # 自动选半精度算子
        logits = model(x)
        loss = loss_fn(logits, y)

    scaled = scaler.scale(loss)
    scaled.backward()
    scaler.step(optimizer)
    scaler.update()
    optimizer.clear_grad()
```

- 多数算子跑 float16/bfloat16，敏感部分保留 float32
- `GradScaler` 动态调整损失缩放防梯度下溢
- 与 Fleet 策略 `strategy.amp = True` 等价（声明式配置）

## 部署工具链

飞桨提供从训练到部署的完整工具链，覆盖服务端、端侧、在线服务：

| 工具 | 模块/包 | 场景 | 特点 |
| --- | --- | --- | --- |
| **Paddle Inference** | `paddle.inference` | 服务端 GPU/CPU | 集成 TensorRT（NVIDIA）、oneDNN（CPU）；推理引擎 |
| **Paddle Lite** | `paddlelite`（独立包） | 移动端/边缘/IoT | ARM、ARM GPU、NPU；轻量 |
| **Paddle Serving** | `paddle-serving-server/client` | 在线微服务 | HTTP/RPC、模型版本管理、A/B |
| **Paddle2ONNX** | `paddle2onnx` | 跨框架转换 | 转 ONNX 交 ONNX Runtime/TensorRT |
| **FastDeploy** | `fastdeploy` | 一体化部署 | 整合上述，封装易用 API |

### Paddle Inference 示例

```python
import paddle.inference as paddle_infer

# 1. 配置（启用 GPU + TensorRT）
config = paddle_infer.Config('model.pdmodel', 'model.pdparams')
config.enable_use_gpu(1000, 0)            # 1000 MB 显存，GPU 0
config.enable_tensorrt_engine(
    workspace_size=1 << 30,
    max_batch_size=32,
    min_subgraph_size=3,
    precision_mode=paddle_infer.PrecisionType.Float32)

# 2. 创建预测器
predictor = paddle_infer.create_predictor(config)

# 3. 填输入、运行
input_names = predictor.get_input_names()
input_handle = predictor.get_input_handle(input_names[0])
input_handle.copy_from_cpu(input_data)
predictor.run()
output_handle = predictor.get_output_handle(predictor.get_output_names()[0])
output_data = output_handle.copy_to_cpu()
```

### 模型导出（动态图 → 推理模型）

```python
# 训练好的动态图 Layer 导出为推理用的静态图模型
model = MLP(784, 10)
model.eval()
paddle.jit.save(model, 'model', input_spec=[paddle.static.InputSpec(shape=[-1, 784], dtype='float32')])
# 产出 model.pdmodel + model.pdparams
```

## 国产化硬件适配

飞桨的差异化优势之一是国产芯片的一等支持，信创场景刚需：

| 硬件 | 适配包/方式 | 说明 |
| --- | --- | --- |
| **昆仑芯 XPU**（百度自研） | `paddle-xpu` / 内置 | 百度自研芯片，原生一等支持 |
| **华为昇腾 NPU** | `paddle-npu`（基于 CANN） | 通过 CANN 软件栈接入 |
| **海光 DCU** | 海光专用 wheel | 兼容 HIP/ROCm 路线 |
| **寒武纪 MLU** | 寒武纪适配 | NeuWare 软件栈 |

```python
# 切换到昇腾 NPU（需安装 paddle-npu）
paddle.set_device('npu')

# 切换到昆仑芯 XPU
paddle.set_device('xpu')
```

- 多数情况下 `paddle.set_device('npu'/'xpu')` 即可，上层 API 不变
- 国产硬件的分布式推理也走 Paddle Inference 的对应后端

## 产业模型库全景

| 套件 | GitHub star | 主要内容 |
| --- | --- | --- |
| **PaddleOCR** | 86k+ | PP-OCR 系列、表格识别、版面分析、文档解析、100+ 语言 |
| **PaddleNLP** | — | ERNIE 大模型家族、ERNIEKit 工业套件、与 HF 接口对齐 |
| **PaddleDetection** | — | PP-YOLOE 目标检测、实例分割、跟踪 |
| **PaddleSeg** | — | 图像分割（语义/实例/全景） |
| **PaddleClas** | — | 图像分类、特征提取、ReID |
| **PaddleSpeech** | — | 语音识别、合成、声纹 |
| **ERNIE** | 7.7k | ERNIE 4.5 系列 LLM、ERNIEKit |
| **PaddleFormers** | 13k | 预训练模型库（兼容 HF 风格） |
| **FastDeploy** | 3.7k | 一体化部署工具 |

这些套件「开箱即用」是企业选飞桨的首要理由——训练好的产业模型 + 部署工具链直接落地。

## 版本与生态

- **框架版本**：3.3（2026，PyPI `paddlepaddle`）；3.0 引入动静统一、3.1 加 safetensors/offloader、3.2 加自动并行
- **Python**：支持 3.8/3.9/3.10/3.11/3.12（以官方 wheel 索引为准）
- **动静统一**是 3.0 的里程碑，3.x 系列在此基础上持续打磨
- **生态**：PaddleX（低代码全流程平台）、VisualDL（可视化）、PARL（强化学习）、PaddleHelix（生物计算）
