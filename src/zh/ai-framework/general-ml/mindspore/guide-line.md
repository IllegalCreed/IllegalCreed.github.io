---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 MindSpore 2.9.0 官方文档（autograd / nn / dataset / jit / 分布式 Parallel）+ mindspore.cn 设计白皮书编写

## 速查

- **求导**：`ms.grad(fn, grad_position)`（只取梯度）/ `ms.value_and_grad(fn, None, weights=)`（前向值 + 梯度）
- **停止梯度**：`ops.stop_gradient(x)`（截断梯度流，不阻断前向）
- **辅助输出**：`grad(fn, has_aux=True)`，函数多返回值里除主输出外不参与求导
- **二阶/高阶**：`ms.grad(ms.grad(fn))` 嵌套；前向模式用 `ops.jet`、`ops.derivative`
- **JIT**：`@ms.jit`（函数/Cell 编译为图）；`capture_mode="ast"|"bytecode"|"trace"`、`jit_level="O0"|"O1"`、`fullgraph`
- **Cell**：基类 `nn.Cell`，`__init__` 注册层、`construct()` 写前向；`net.set_train()` / `net.set_train(False)` 切训练/评估
- **参数**：`net.trainable_params()`（可训练）/ `net.get_parameters()`（全部）；`nn.Parameter` 注册可学习张量
- **层**：`nn.Dense` / `nn.Conv2d` / `nn.BatchNorm2d` / `nn.LayerNorm` / `nn.Dropout` / `nn.Embedding`
- **损失**：`nn.CrossEntropyLoss` / `nn.MSELoss` / `nn.BCEWithLogitsLoss`（吃 logits）
- **优化器**：`nn.Momentum` / `nn.Adam` / `nn.AdamWeightDecay`（Transformer 标配）
- **混合精度**：`ms.amp.auto_mixed_precision(net, amp_level="O2")` + `nn.DynamicLossScaleManager`
- **自动并行**：`set_auto_parallel_context(parallel_mode=SEMI_AUTO_PARALLEL, ...)`，框架自动切分
- **导出**：`ms.export(net, *inputs, file_name, file_format="MINDIR"|"AIR"|"ONNX")`

## 自动微分进阶

MindSpore 的函数式微分可以**像组合普通函数一样组合求导操作**，这是它优于「张量挂 `.grad`」面向对象风格的核心优势。

### grad_position 与 weights 的关系

```python
import mindspore as ms
from mindspore import ops, nn

net = nn.Dense(4, 2)
loss_fn = nn.MSELoss()

def forward_fn(x, y):
    return loss_fn(net(x), y)

# 方式一：按输入位置求导（对 x）
grad_x = ms.grad(forward_fn, grad_position=0)

# 方式二：按参数求导（对网络权重，训练用这种）
grad_w = ms.grad(forward_fn, None, weights=net.trainable_params())

# 方式三：前向值 + 梯度（训练循环最常用）
loss_grad = ms.value_and_grad(forward_fn, None, weights=net.trainable_params())
loss, grads = loss_grad(x, y)
```

- `grad_position` 指输入张量的下标（元组），`None` 表示不按位置求导
- `weights` 接 `Parameter` 列表，`net.trainable_params()` 返回所有 `requires_grad=True` 的参数
- 两者**可同时指定**：既对输入也对参数求导

### 多输出与 has_aux

```python
def fn_with_aux(x):
    loss = ops.sin(x).sum()
    aux = x * 100                              # 想拿到但不参与求导
    return loss, aux

grad_fn = ms.grad(fn_with_aux, has_aux=True)
grads, aux = grad_fn(x)                         # aux 直接返回，不影响 grads
```

不用 `has_aux` 时，多返回值会被当作「多个 loss 一起求导」。

### 高阶导数

```python
f = lambda x: ops.sin(x)

first = ms.grad(f)                              # 一阶：cos(x)
second = ms.grad(first)                         # 二阶：-sin(x)
third = ms.grad(second)                         # 三阶：-cos(x)
```

前向模式 Jacobian（适合输入维数远小于输出维数）用 `ops.jet`：

```python
from mindspore.ops import jet
# jet(fn, primals, series) 计算 fn 在 primals 处沿 series 方向的 Taylor 系数
```

### 与 PyTorch autograd 对照

| 维度 | PyTorch | MindSpore |
| --- | --- | --- |
| 范式 | 面向对象（张量挂 `.grad`） | 函数式（`grad(fn)` 高阶函数） |
| 触发 | `loss.backward()` 副作用 | `grad_fn(x)` 返回值 |
| 默认累加 | 梯度累加，需 `zero_grad()` | 不累加（每次返回新梯度） |
| 高阶 | 需 `create_graph=True` | 直接 `grad(grad(fn))` |
| 副产物 | `x.grad` 持久 | 无副作用，纯函数 |

## nn.Cell 进阶

### construct 而非 forward

MindSpore 网络基类 `nn.Cell` 的前向方法叫 **`construct`**，这是从 PyTorch 迁移时最容易遗漏的改名点：

```python
class MyNet(nn.Cell):
    def __init__(self):
        super().__init__()
        self.body = nn.SequentialCell(
            nn.Dense(784, 256),
            nn.ReLU(),
            nn.Dense(256, 10),
        )

    def construct(self, x):                      # 不是 forward！
        return self.body(x)
```

容器对应关系：`nn.Sequential` → `nn.SequentialCell`；`nn.ModuleList` → `nn.CellList`。

### 参数与冻结

```python
class Net(nn.Cell):
    def __init__(self):
        super().__init__()
        self.backbone = ResNet()
        self.head = nn.Dense(2048, 10)

    def construct(self, x):
        return self.head(self.backbone(x))

net = Net()
# 冻结骨干网络（不参与训练）
for p in net.backbone.get_parameters():
    p.requires_grad = False

# 只把可训练参数喂给优化器
optimizer = nn.Adam(net.trainable_params(), learning_rate=1e-3)
```

### set_train 与评估模式

```python
net.set_train()                                  # 训练模式（等价 model.train()）
net.set_train(False)                             # 评估模式（等价 model.eval()）
```

`nn.Dropout` / `nn.BatchNorm*` 在两种模式下行为不同，**评估时务必 `set_train(False)`**。

## 数据管线与性能

`mindspore.dataset` 是 C++ 实现的高性能管线，瓶颈场景下吞吐远超纯 Python `DataLoader`：

```python
import mindspore.dataset as ds
import mindspore.dataset.vision as vision

# 图像分类典型管线
dataset = ds.ImageFolderDataset("data/imagenet/train", shuffle=True)
dataset = dataset.map(vision.Decode(), "image")
dataset = dataset.map([vision.Resize(256), vision.CenterCrop(224),
                       vision.ToTensor(), vision.Normalize(...)], "image")
dataset = dataset.batch(256, drop_remainder=True)
dataset = dataset.shuffle(1000)
```

性能技巧：

- **`batch(drop_remainder=True)`**：训练时丢掉不满 batch 的尾巴，对 `BatchNorm` 与静态 shape 友好
- **`num_parallel_workers`**：`dataset.map(..., num_parallel_workers=8)` 提升预处理并发
- **`prefetch_size`**：`ds.config.set_prefetch_size(16)` 预取，掩盖计算-IO 重叠
- **`create_tuple_iterator()`**：迭代产出 `(data, label)` 元组，比 `dict` 路径更快

## jit 与静态图优化

### 三种 capture_mode

```python
@ms.jit(capture_mode="ast")              # 默认：解析 AST，不执行代码，覆盖最广
def f(x): ...

@ms.jit(capture_mode="trace")            # 执行追踪：先跑一遍记录算子，支持动态 Python
def g(x): ...

@ms.jit(capture_mode="bytecode")         # 实验性：运行时解析字节码
def h(x): ...
```

- **ast**：静态分析强、覆盖广，但对部分动态 Python 语法（如运行时 `getattr`）支持有限
- **trace**：像 PyTorch 的 FX 追踪，能捕获到运行时才知道的结构
- **bytecode**：2.x 实验，目标是兼顾覆盖与精度

### jit_level 与 fullgraph

```python
@ms.jit(jit_level="O1", fullgraph=True)   # 开启融合 + 强制整图
def f(x): ...
```

- `jit_level="O1"`：开启算子融合（Conv+BN+ReLU、MatMul+Add 等），典型加速 1.5–3×
- `fullgraph=True`：禁止部分回退，整段必须能编译成图；调试期用 `False` 兼容性最好
- 2.9 新增「**无图融合**」技术（graph-free fusion）：即使在 PYNATIVE 下也能做局部算子融合，性能提升 5%~15%

## 自动并行：大模型训练利器

MindSpore 的 **Parallel** 是区别于 PyTorch DDP/FSDP 的标志性能力：你声明「我要数据并行/模型并行/流水线并行」，框架**自动搜索切分策略**：

```python
from mindspore import ParallelMode, set_auto_parallel_context

set_auto_parallel_context(
    parallel_mode=ParallelMode.SEMI_AUTO_PARALLEL,   # 半自动：标注 shard 后自动切
    gradients_mean=True,                              # 数据并行：梯度求均值
    device_num=8,
)

# 在层上标注切分策略：第 0 维按卡切 weight
net.fc1.matmul.shard(((1, 8), (8, 1)))               # 列并行权重
```

四种并行模式：

| 模式 | 含义 | 适用 |
| --- | --- | --- |
| `DATA_PARALLEL` | 数据并行（每张卡完整模型） | 中小模型 |
| `SEMI_AUTO_PARALLEL` | 半自动（标 shard 后自动） | 大模型 |
| `AUTO_PARALLEL` | 全自动搜索策略 | 复杂拓扑 |
| `HYBRID_PARALLEL` | 手动全控制 | 极致调优 |

2.8 起 HyperParallel 架构进一步优化超节点（多die 多卡）的通信，降低大模型训练成本。

## 混合精度训练

```python
import mindspore as ms

# 自动把网络中的算子转 fp16
net = ms.amp.auto_mixed_precision(net, amp_level="O2")   # O0/O1/O2/O3 渐进

# 动态 loss scale 防止 fp16 梯度下溢
scale_manager = nn.DynamicLossScaleManager(init_loss_scale=2**16, scale_factor=2, scale_window=2000)

optimizer = nn.Adam(net.trainable_params(), learning_rate=1e-3)
```

- `amp_level="O2"`：几乎全 fp16（保留 BatchNorm 等），最常用
- 配合 `DynamicLossScaleManager` 应对 fp16 梯度下溢（梯度溢出时自动缩小 scale）

## 昇腾 NPU 适配要点

MindSpore 在 Ascend 上的性能红利来自三层优化：

1. **算子级**：针对达芬奇架构的 Cube/Vector 单元手写高性能算子（如 FlashAttention、融合 MatMul）
2. **图级**：MS IR 上的整图融合、内存复用、通信重叠（Pipeline Parallel 通信隐藏）
3. **全栈**：与 CANN 软件栈、HCCL 集合通信库深度协同

```python
import mindspore as ms

ms.set_context(device_target="Ascend")            # 切到 NPU
ms.set_context(device_id=0)                        # 选择第 0 张卡
# 推理：可开启图内存复用
ms.set_context(enable_task_sink=True)              # 任务下沉到 AI Core
```

> 同一份代码切到 `device_target="GPU"` 也可跑，但昇腾上的最优算子/图优化红利不会全部兑现。

## 端侧推理：MindSpore Lite

```bash
# 模型转换（converter 工具，把 MindIR/ONNX/TFLite/Caffe 转成 .ms）
./converter_lite --fmk=MINDIR --modelFile=model.mindir --outputFile=model.ms
```

Lite SDK 提供 C++/Java API，覆盖 Android/iOS/嵌入式（LiteOS）：

```cpp
// C++ 推理示例
auto model = mindspore::Model();
auto build_ret = model.Build("model.ms", mindspore::kMindIR, context);
auto inputs = model.GetInputs();
std::vector<mindspore::MSTensor> outputs;
model.Predict(inputs, &outputs);
```

特点：

- **超轻量**：核心运行时数 MB，适配手机/IoT 资源约束
- **异构调度**：CPU / GPU / NPU（手机厂商 NPU）自动选优
- **量化**：训练后量化（PTQ）把 fp32 压成 int8/int4，模型体积降 4×+
