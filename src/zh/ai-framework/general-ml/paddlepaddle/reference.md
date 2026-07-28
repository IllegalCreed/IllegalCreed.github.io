---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PaddlePaddle 3.3 stable API（paddlepaddle.org.cn）+ PaddleOCR/PaddleNLP + 部署工具链整理

## 速查

- **核心**：`paddle.to_tensor` / `paddle.randn/ones/zeros` / `paddle.nn.Layer` / `paddle.optimizer.*`
- **张量属性**：`x.shape` / `x.dtype` / `x.place` / `x.stop_gradient` / `x.grad`
- **运算**：逐元素 `+ - * /`、矩阵乘 `@`/`paddle.matmul`、规约 `sum/mean/max/argmax`
- **层**：`nn.Linear/Conv2d/BatchNorm2d/LayerNorm/Dropout/Embedding/Sequential/LayerList`
- **激活**：`paddle.relu/gelu/sigmoid/softmax/tanh`
- **损失**：分类 `nn.CrossEntropyLoss`；回归 `nn.MSELoss`；二分类 `nn.BCEWithLogitsLoss`
- **优化器**：`paddle.optimizer.SGD/Adam/AdamW/Momentum`，`parameters=`、`learning_rate=`
- **清梯度**：`optimizer.clear_grad()`（注意命名，不是 zero_grad）
- **设备**：`paddle.set_device('cpu'/'gpu'/'npu'/'xpu')` / `x.cuda()` / `x.cpu()`
- **AMP**：`paddle.amp.auto_cast` + `paddle.amp.GradScaler`
- **动静转换**：`paddle.jit.to_static` / `paddle.jit.save` / `paddle.jit.load`
- **分布式**：`paddle.distributed.fleet` / `paddle.distributed.init_parallel_env`
- **推理**：`paddle.inference.Config/Predictor` / `paddlelite` / `paddle-serving-*` / `paddle2onnx`
- **版本**：框架 **3.3**；Python 3.8–3.12

## paddle.nn 层速查

| 层 | 签名要点 | 对应 PyTorch |
| --- | --- | --- |
| `nn.Linear(in, out)` | `weight_attr=None, bias_attr=None` | `nn.Linear` |
| `nn.Conv2d(in, out, k)` | `stride, padding, dilation, groups` | `nn.Conv2d` |
| `nn.BatchNorm2d(num)` | `momentum=0.9, epsilon=1e-5` | `nn.BatchNorm2d` |
| `nn.LayerNorm(shape)` | `epsilon=1e-5, weight/bias_attr` | `nn.LayerNorm` |
| `nn.Dropout(p)` | `dropout` 别名 | `nn.Dropout` |
| `nn.Embedding(num, dim)` | `sparse=False, padding_idx` | `nn.Embedding` |
| `nn.Sequential(*layers)` | 有序容器 | `nn.Sequential` |
| `nn.LayerList([layers])` | 注册子层（普通 list 不注册！） | `nn.ModuleList` |

> **坑**：子层放在普通 Python `list` 里**不会注册参数**——必须用 `nn.LayerList`（对应 PyTorch 的 ModuleList）。

## 优化器与调度器

```python
paddle.optimizer.SGD(parameters=model.parameters(), learning_rate=0.01)
paddle.optimizer.Adam(parameters=..., learning_rate=1e-3)
paddle.optimizer.AdamW(parameters=..., learning_rate=3e-4, weight_decay=0.01)
paddle.optimizer.Momentum(parameters=..., learning_rate=0.01, momentum=0.9)

# 调度器（作为 learning_rate 传入）
scheduler = paddle.optimizer.lr.CosineAnnealingDecay(learning_rate=1e-3, T_max=100)
optimizer = paddle.optimizer.Adam(learning_rate=scheduler, parameters=model.parameters())
# 每个 epoch/step 后 scheduler.step()
```

| 调度器 | 对应 |
| --- | --- |
| `paddle.optimizer.lr.StepDecay` | PyTorch `StepLR` |
| `CosineAnnealingDecay` | `CosineAnnealingLR` |
| `LinearWarmup` | warmup |
| `OneCycleLR` | `OneCycleLR` |
| `ReduceOnPlateau` | `ReduceLROnPlateau` |

## 设备与精度

```python
paddle.set_device('gpu')            # 默认 GPU（cuda:0）
paddle.set_device('gpu:2')          # 指定卡
paddle.set_device('cpu')
paddle.set_device('npu')            # 昇腾（需 paddle-npu）
paddle.set_device('xpu')            # 昆仑芯

paddle.is_compiled_with_cuda()      # 是否编译了 CUDA
x = x.cuda(); x = x.cpu()
x = paddle.to_tensor(data, dtype='float16')   # 半精度
```

## 训练循环骨架

```python
model = MLP(...).cuda() if paddle.is_compiled_with_cuda() else MLP(...)
loss_fn = nn.CrossEntropyLoss()
optimizer = paddle.optimizer.AdamW(parameters=model.parameters(),
                                   learning_rate=3e-4, weight_decay=0.01)

model.train()
for epoch in range(epochs):
    for x, y in loader:
        x, y = x.cuda() if paddle.is_compiled_with_cuda() else x, y
        with paddle.amp.auto_cast():
            logits = model(x)
            loss = loss_fn(logits, y)
        loss.backward()
        optimizer.step()
        optimizer.clear_grad()      # 关键：飞桨用 clear_grad
    scheduler.step()

model.eval()
with paddle.no_grad():
    pred = model(x).argmax(axis=1)
```

## Fleet API 速查

```python
import paddle.distributed.fleet as fleet
from paddle.distributed.fleet import DistributedStrategy

fleet.init(is_collective=True)               # collective 数据并行
strategy = DistributedStrategy()
strategy.amp = True                          # 自动混合精度
strategy.recompute = True                    # 梯度检查点
strategy.recompute_configs = {'checkpoints': [...]}
optimizer = fleet.distributed_optimizer(optimizer, strategy)

# 参数服务器模式（推荐系统）
fleet.init(role=role, is_collective=False)
```

| 配置项 | 作用 |
| --- | --- |
| `strategy.amp` | 自动混合精度 |
| `strategy.recompute` | 梯度检查点省显存 |
| `strategy.pipeline` | 流水线并行 |
| `strategy.localsgd` | local SGD |
| `strategy.dgc` | 梯度压缩（省通信） |

## 部署工具链速查

### Paddle Inference（`paddle.inference`）

```python
config = paddle.inference.Config('model.pdmodel', 'model.pdparams')
config.enable_use_gpu(memory_pool_init_size_mb=1000, device_id=0)
config.enable_tensorrt_engine(workspace_size=1<<30, max_batch_size=32,
                              min_subgraph_size=3, precision_mode=Float32)
config.enable_memory_optim()
config.switch_use_feed_fetch_ops(True)
predictor = paddle.infer.create_predictor(config)
```

### 模型导出（动→静）

```python
paddle.jit.save(model, 'model',
                input_spec=[paddle.static.InputSpec([-1, 3, 224, 224], 'float32')])
# 产出 model.pdmodel + model.pdparams
```

### Paddle Lite（端侧）

```bash
# 转换模型
opt --model_dir=./model --model_file=model.pdmodel --param_file=model.pdparams \
    --optimize_out_type=naive_buffer --optimize_out=model_lite --valid_targets=arm
```

### Paddle Serving / Paddle2ONNX

```bash
# Serving：服务端 + 客户端
pip install paddle-serving-server paddle-serving-client
# ONNX 转换
python -m paddle2onnx --model_dir model --model_filename model.pdmodel \
       --params_filename model.pdparams --save_file model.onnx --opset_version 14
```

## 国产硬件支持矩阵

| 硬件 | 接入 | set_device | 说明 |
| --- | --- | --- | --- |
| 昆仑芯 XPU | `paddle-xpu` / 内置 | `'xpu'` | 百度自研，原生一等 |
| 华为昇腾 NPU | `paddle-npu`（CANN） | `'npu'` | 通过 CANN 软件栈 |
| 海光 DCU | 海光专用 wheel | `'gpu'`(HIP) | 兼容 ROCm/HIP |
| 寒武纪 MLU | NeuWare 适配 | 厂商接口 | 寒武纪软件栈 |
| NVIDIA GPU | 内置 | `'gpu'` | CUDA |
| Intel CPU/GPU | 内置 / oneAPI | `'cpu'`/`'gpu'` | oneDNN |

## 产业套件速查

| 套件 | import | 用途 |
| --- | --- | --- |
| PaddleOCR | `from paddleocr import PaddleOCR` | OCR、表格、版面、文档解析 |
| PaddleNLP | `from paddlenlp.transformers import *` | ERNIE、与 HF 接口对齐 |
| PaddleDetection | `from ppdet ...` | 检测、分割、跟踪 |
| PaddleSeg | `from paddleseg ...` | 图像分割 |
| FastDeploy | `import fastdeploy as fd` | 一体化部署 |

## 版本演进

| 版本 | 关键变化 |
| --- | --- |
| 2.x | 静态图优先，动态图逐步完善（historical 包袱） |
| 3.0 | **动静统一**（动态/静态产出一致）里程碑 |
| 3.1 | safetensors 支持、offloader 提升计算效率 |
| 3.2 | **自动并行**（少量张量切分标注即可分布式） |
| 3.3 | 持续打磨，PyPI 当前发布版（2026） |

## 官方资源

- [飞桨官网文档](https://www.paddlepaddle.org.cn/)
- [Paddle 3.x 开发文档](https://www.paddlepaddle.org.cn/documentation/docs/zh/develop/)
- [PaddleOCR GitHub](https://github.com/PaddlePaddle/PaddleOCR)
- [PaddleNLP GitHub](https://github.com/PaddlePaddle/PaddleNLP)
- [Paddle Inference 文档](https://www.paddlepaddle.org.cn/documentation/docs/zh/guides/infer/infer/inference.html)
- [Paddle Lite 文档](https://www.paddlepaddle.org.cn/lite/)
- [Paddle Serving 文档](https://github.com/PaddlePaddle/Serving)
- [Paddle GitHub](https://github.com/PaddlePaddle/Paddle)
