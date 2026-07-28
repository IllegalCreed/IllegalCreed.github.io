---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MindSpore 2.9.0 stable API 文档 + mindspore.cn 版本动态整理

## 速查

- **Tensor**：`mindspore.Tensor(data, dtype=)`、`ops.ones/zeros/randn/rand/empty/full/arange/linspace`
- **dtype**：`float16/bfloat16/float32(默认)/float64/int8/int16/int32/int64/uint8/bool`
- **执行模式**：`set_context(mode=PYNATIVE_MODE|GRAPH_MODE, device_target="Ascend"|"GPU"|"CPU")`
- **JIT**：`@mindspore.jit(capture_mode=, jit_level=, fullgraph=, backend=)`；旧名 `@ms_function`
- **求导**：`ms.grad(fn, grad_position=, weights=, has_aux=)`、`ms.value_and_grad(fn, grad_position, weights)`
- **nn.Cell**：`construct()`、`set_train()`、`trainable_params()`、`get_parameters()`、`set_grad()`
- **层**：`nn.Dense/Conv2d/Conv2dTranspose/BatchNorm1d2d/LayerNorm/Dropout/Embedding/RNN/LSTM/MaxPool2d/AvgPool2d`
- **激活**：`nn.ReLU/GELU/SiLU/Sigmoid/Tanh/Softmax/LeakyReLU`
- **损失**：`nn.CrossEntropyLoss/MSELoss/BCEWithLogitsLoss/L1Loss/SmoothL1Loss/NLLLoss`
- **优化器**：`nn.Momentum/SGD/Adam/AdamW/AdamWeightDecay/Lamb/FTRL`
- **数据**：`ds.GeneratorDataset/MnistDataset/Cifar10Dataset/ImageFolderDataset`、`.map/.batch/.shuffle/.repeat`
- **并行**：`set_auto_parallel_context(parallel_mode=)`；`Cell.matmul.shard(strategy)`
- **导出**：`ms.export(net, *inputs, file_name, file_format="MINDIR"|"AIR"|"ONNX")`
- **版本**：稳定版 **2.9.0**；Python 3.9–3.11；硬件 Ascend 910/910B/310 + NVIDIA GPU + CPU

## 张量与运算 API

| API | 说明 |
| --- | --- |
| `mindspore.Tensor(data, dtype=)` | 从 Python/NumPy 创建 |
| `ops.ones/zeros/empty/full(shape, dtype)` | 全 1 / 全 0 / 未初始化 / 填充 |
| `ops.rand/randn(shape)` | 均匀 [0,1) / 标准正态 |
| `ops.arange(start, end, step)` | 等差序列 |
| `ops.linspace(start, end, num)` | 等分 |
| `Tensor.from_numpy(arr)` | NumPy → Tensor |
| `x.asnumpy()` | Tensor → NumPy |
| `ops.matmul(a, b)` | 矩阵乘 |
| `ops.add/mul/div/sub` | 逐元素四则 |
| `ops.concat/tensor_split/stack` | 拼接 / 切分 / 堆叠 |
| `ops.reshape/squeeze/unsqueeze/transpose` | 形状操作 |

属性：`x.shape`(Tuple) / `x.dtype` / `x.ndim` / `x.size` / `x.itemsize`。

## 执行模式 API

```python
import mindspore as ms

# 全局执行模式
ms.set_context(mode=ms.PYNATIVE_MODE, device_target="Ascend")   # 即时执行
ms.set_context(mode=ms.GRAPH_MODE, device_target="Ascend")      # 静态图

# 局部 JIT（动静统一推荐用法）
@ms.jit(capture_mode="ast", jit_level="O1")
def fn(x): ...
```

| 模式 | 触发 | 调试 | 性能 |
| --- | --- | --- | --- |
| PYNATIVE | 默认 | 好（可断点） | 中 |
| GRAPH（全局） | `set_context(mode=GRAPH_MODE)` | 弱 | 高 |
| `@jit` 局部 | 装饰器 | 中（其余 eager） | 高 |

## 自动微分 API

```python
# 一阶导数
grad_fn = ms.grad(fn, grad_position=(0,))           # 对输入位置 0 求导
grad_fn = ms.grad(fn, None, weights=params)         # 对参数求导
grad_fn = ms.grad(fn, (0,), weights=params)         # 同时对输入和参数

# 前向值 + 梯度
loss_grad = ms.value_and_grad(fn, grad_position=None, weights=params)

# 高阶导数
second_grad = ms.grad(ms.grad(fn))

# 前向模式 Jacobian
from mindspore.ops import jet, derivative

# 截断梯度
out = ops.stop_gradient(x)
```

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| `grad_position` | int / tuple / None | 输入位置；`None` 表示不按位置 |
| `weights` | Parameter 列表 | 对哪些参数求导 |
| `has_aux` | bool | 多返回值时辅助数据不参与求导 |

## nn.Cell 与网络 API

```python
class Net(nn.Cell):
    def __init__(self):
        super().__init__()
        self.fc = nn.Dense(784, 10)
        self.drop = nn.Dropout(keep_prob=0.5)

    def construct(self, x):
        return self.fc(self.drop(x))
```

| API | 说明 |
| --- | --- |
| `nn.Cell` | 网络基类 |
| `nn.Cell.construct(x)` | 前向方法（**不是 forward**） |
| `nn.SequentialCell([..])` | 顺序容器（对应 `nn.Sequential`） |
| `nn.CellList([...])` | 列表容器（对应 `nn.ModuleList`） |
| `net.set_train()` / `net.set_train(False)` | 训练 / 评估模式 |
| `net.trainable_params()` | 可训练参数列表 |
| `net.get_parameters()` | 全部参数 |
| `nn.Parameter(x)` | 注册可学习参数 |
| `net.update_parameters_name(prefix)` | 参数名加前缀（多分支训练） |

常用层对照：

| 用途 | MindSpore | PyTorch 对应 |
| --- | --- | --- |
| 全连接 | `nn.Dense(in, out)` | `nn.Linear` |
| 卷积 | `nn.Conv2d` | `nn.Conv2d` |
| 归一化 | `nn.BatchNorm2d` / `nn.LayerNorm` | 同名 |
| 丢弃 | `nn.Dropout(keep_prob=)` | `nn.Dropout(p=)`（语义相反） |
| 嵌入 | `nn.Embedding` | `nn.Embedding` |
| 激活 | `nn.ReLU` / `nn.GELU` | 同名 |

> **注意**：MindSpore `nn.Dropout` 用 `keep_prob`（保留概率），PyTorch 用 `p`（丢弃概率），迁移时极易写反。

## 损失与优化器 API

```python
# 损失
loss = nn.CrossEntropyLoss()              # 多分类，吃 logits
loss = nn.MSELoss()
loss = nn.BCEWithLogitsLoss()             # 二分类，数值更稳

# 优化器（注意：MindSpore 把学习率作为构造参数）
opt = nn.Momentum(net.trainable_params(), learning_rate=0.01, momentum=0.9, weight_decay=1e-4)
opt = nn.Adam(net.trainable_params(), learning_rate=3e-4)
opt = nn.AdamWeightDecay(net.trainable_params(), learning_rate=3e-4, weight_decay=0.01)

# 动态学习率
from mindspore.nn import CosineDecayLR, PolynomialDecayLR
lr = CosineDecayLR(min_lr=1e-5, max_lr=1e-3, total_steps=10000, decay_steps=10000)
opt = nn.Adam(net.trainable_params(), learning_rate=lr)
```

调用方式（函数式风格）：

```python
# 训练循环里
optimizer(grads)                              # 直接喂梯度，没有 .step()
```

注意 MindSpore 的 `optimizer(grads)` 是**函数式调用**，传入梯度即更新参数；与 PyTorch 的 `optimizer.step()`（无参）语义不同。

## 数据管线 API

```python
import mindspore.dataset as ds
import mindspore.dataset.vision as vision
import mindspore.dataset.transforms as transforms

# 自定义数据源（生成器或可迭代对象）
dataset = ds.GeneratorDataset(source, column_names=["data", "label"])

# 内置数据集
dataset = ds.MnistDataset("data", usage="train")
dataset = ds.ImageFolderDataset("data/imagenet/train", num_shards=8, shard_id=0)  # 分布式分片

# 链式变换
dataset = dataset.map(operations=[vision.Decode(), vision.Resize(256)], input_columns="image")
dataset = dataset.batch(64, drop_remainder=True)
dataset = dataset.shuffle(buffer_size=1000)
dataset = dataset.repeat(10)

# 迭代
for data in dataset.create_tuple_iterator():
    x, y = data
```

| 操作 | API |
| --- | --- |
| 读图像 | `ds.ImageFolderDataset` / `vision.Decode` |
| 变换 | `dataset.map(operations, input_columns)` |
| 组批 | `dataset.batch(batch_size, drop_remainder)` |
| 打乱 | `dataset.shuffle(buffer_size)` |
| 重复 | `dataset.repeat(count)` |
| 分片 | `num_shards, shard_id`（分布式） |
| 并发 | `num_parallel_workers` / `ds.config.set_prefetch_size` |

## 并行训练 API

```python
from mindspore import ParallelMode, set_auto_parallel_context

set_auto_parallel_context(
    parallel_mode=ParallelMode.SEMI_AUTO_PARALLEL,
    gradients_mean=True,
    device_num=8,
    full_batch=False,
)

# 在 Cell 的算子上标切分策略
class Net(nn.Cell):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Dense(784, 512)
        self.fc1.matmul.shard(((1, 4), (4, 1)))   # 第 1 维按 4 卡切
```

| 并行模式 | 说明 |
| --- | --- |
| `DATA_PARALLEL` | 数据并行 |
| `HYBRID_PARALLEL` | 手动混合 |
| `SEMI_AUTO_PARALLEL` | 半自动（标 shard 自动切） |
| `AUTO_PARALLEL` | 全自动搜索 |

集合通信：依赖 **HCCL**（Huawei Collective Communication Library，昇腾）/ NCCL（GPU）。

## 导出与部署

```python
import mindspore as ms

# 训练侧 checkpoint
ms.save_checkpoint(net, "model.ckpt")

# 导出推理格式（端侧 / Ascend 推理引擎）
ms.export(net, Tensor(input_data), file_name="model", file_format="MINDIR")
# 也支持 AIR（昇腾） / ONNX（跨框架）

# 加载
param_dict = ms.load_checkpoint("model.ckpt")
ms.load_param_into_net(net, param_dict)
```

| 格式 | 用途 |
| --- | --- |
| `.ckpt` | checkpoint，含参数字典 |
| `.mindir` (MINDIR) | MindSpore IR，推理 + Lite 转换的标准输入 |
| `.air` | 昇腾 ATC 工具链输入 |
| `.onnx` | 跨框架互操作（喂给 ONNX Runtime） |

## 端侧：MindSpore Lite

- **运行时**：极简 C++ 内核，覆盖 Android/iOS/嵌入式，约数 MB
- **模型格式**：`.ms`（由 `converter_lite` 工具从 MINDIR/ONNX/TFLite/Caffe 转换而来）
- **后端**：CPU（含 ARM NEON 优化）/ GPU（OpenCL）/ 厂商 NPU（HiAI /高通 SNPE 等）
- **量化**：训练后量化（PTQ）支持 int8 / int4，模型体积与延迟显著下降
- **API**：C++ / Java / C，`Model::Build` → `Model::Predict`

## 版本与生态

| 版本 | 关键变化 |
| --- | --- |
| 2.4 | HAL 设备/流管理、Stream 流计算 |
| 2.7 | 主线特性增强（2.7.1/2.7.2 补丁） |
| 2.8 | **HyperParallel** 架构，为超节点而生，训推更灵活 |
| 2.9（当前稳定） | 独创**无图融合**（性能 +5~15%）、Triton 算子支持、CPU 绑核升级 |

生态：

- **大模型**：MindFormers（类 Hugging Face Transformers 的昇思版）、MindPet（提示工程）
- **科学计算**：MindSPONGE（分子动力学）、MindFlow（流体）、Mindelec（电磁）
- **端侧**：MindSpore Lite + converter + HiAI Foundation
- **硬件**：昇腾 Ascend 910（训练）/ 910B / 310（推理）+ CANN 商用套件

## 官方资源

- [MindSpore 中文文档](https://www.mindspore.cn/docs/zh-CN/r2.9.0/index.html)
- [教程中心](https://www.mindspore.cn/tutorials/zh-CN/r2.9.0/index.html)
- [版本动态](https://www.mindspore.cn/version-updates)
- [GitHub Releases](https://github.com/mindspore-ai/mindspore/releases)
- [Gitee 镜像](https://gitee.com/mindspore/mindspore)
