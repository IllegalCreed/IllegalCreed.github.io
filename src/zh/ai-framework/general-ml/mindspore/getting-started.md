---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MindSpore 2.9.0 官方文档（Quick Start / Tensor / Dataset / autograd / Cell）+ mindspore.cn 安装向导编写，对照昇腾 Ascend 与 GPU/CPU 当前行为

## 速查

- **安装**：昇腾选 `mindspore-ascend`，通用 x86/NVIDIA 选 `mindspore`（pip 包名按硬件后缀区分）
- **Python**：2.9 支持 **Python 3.9–3.11**（昇腾与 GPU wheel 覆盖范围一致；master 逐步加入 3.12）
- **验证安装**：`import mindspore; mindspore.run_check()` 输出 `The installation of MindSpore is passed`
- **建张量**：`mindspore.Tensor([1,2,3])` / `ops.ones((2,3))` / `ops.randn((2,3))`，指定 `dtype=`
- **设备搬运**：`x.asnumpy()`（转 NumPy）/ `mindspore.Tensor.from_numpy(arr)`；上下文 `ms.context.set_context(device_target="Ascend"/"GPU"/"CPU")`
- **执行模式**：默认 `PYNATIVE_MODE`（即时执行，可调试）；`set_context(mode=GRAPH_MODE)` 或 `@mindspore.jit` 切静态图
- **函数式求导**：`grad_fn = mindspore.grad(fn, grad_position)`；要前向值用 `mindspore.value_and_grad(fn, None, weights=params)`
- **网络骨架**：继承 `nn.Cell`，`__init__` 定义层，`construct(self, x)` 写前向（注意是 `construct` 不是 `forward`）
- **数据管线**：`ds.GeneratorDataset(source, ["data","label"])` 或 `ds.MnistDataset(...)` → `.batch(64).shuffle(1000)`
- **训练循环**：`grad_fn = value_and_grad(forward_fn, None, weights)` → 拿到 `loss, grads` → `optimizer(grads)` 更新（函数式风格）
- **高级封装**：`model = Model(net, loss_fn, optimizer, metrics)` + `model.train(epoch, dataset)`，类 Keras 的简写

## 安装与验证

MindSpore 的 pip 包按目标硬件分后缀，**昇腾 Ascend 用 `mindspore-ascend`，通用 GPU/CPU 用 `mindspore`**：

```bash
# 昇腾 Ascend（NPU）—— MindSpore 最优路径
pip install mindspore-ascend

# NVIDIA GPU / 通用 x86
pip install mindspore

# 纯 CPU
pip install mindspore
```

> **注意**：昇腾路径依赖 CANN 商用套件（与驱动/固件版本严格对应），安装前需先按 CANN 文档配好 `/usr/local/Ascend` 环境；GPU/CPU 路径只需 CUDA 与 Python。

安装后验证（官方样例）：

```python
import mindspore

mindspore.run_check()
# 输出：MindSpore version: 2.9.0
#       The installation of MindSpore is passed.
```

## Tensor：与 NumPy 同构的张量

`mindspore.Tensor` 是统一数据容器，API 与 NumPy/PyTorch 高度同构，但**默认 dtype 是 float32，且创建函数多在 `mindspore.ops` 命名空间**。

```python
import mindspore
from mindspore import ops, Tensor

a = Tensor([[1, 2], [3, 4]])           # 从 Python 数据
b = ops.ones((2, 3), mindspore.float32)
c = ops.randn((2, 3))                   # 标准正态

print(a.shape, a.dtype, a.ndim)         # (2, 2) Float32 2
```

常用运算：

```python
x, y = ops.ones((3, 4)), ops.randn((3, 4))

z = x + y                       # 逐元素加（广播）
z = ops.matmul(x, y.T)          # 矩阵乘
z = x * y                       # 逐元素乘
s = x.sum()                     # 规约
v = x.asnumpy()                 # 转 NumPy（会拷贝）
t = Tensor.from_numpy(v)        # NumPy → Tensor
```

**与 PyTorch 的关键差异**：MindSpore 的张量在静态图（GRAPH_MODE）下不可变（函数式语义，每次运算返回新张量），原地操作 `*_` 风格较少；PyNative 模式下行为更接近 PyTorch。

## 执行模式：PyNative 与 Graph

MindSpore 有两种执行模式，**这是它与 PyTorch 最大的心智差异之一**：

| 模式 | 行为 | 适用 | 切换方式 |
| --- | --- | --- | --- |
| **PYNATIVE_MODE**（默认） | 即时执行，逐行解释，可 print/pdb 调试 | 开发、调试、动态结构 | `set_context(mode=PYNATIVE_MODE)` |
| **GRAPH_MODE** | 把函数/Cell 编译成 MS IR 静态图，整图优化 | 训练加速、部署 | `set_context(mode=GRAPH_MODE)` 或 `@mindspore.jit` |

```python
import mindspore as ms

ms.set_context(mode=ms.GRAPH_MODE, device_target="Ascend")

# 或者：不改全局，只对单个函数加速（动静统一写法）
@ms.jit                                 # 等价 ms_function，2.x 推荐用 @jit
def add(x, y):
    return x + y
```

**`@mindspore.jit` 是 2.x 的核心**：它把一个普通 Python 函数或 `nn.Cell` 编译成静态图，且与全局 PYNATIVE 模式共存——你可以在 eager 调试环境里临时给热点函数加 `@jit` 获得加速，这是「动静统一」的精髓。

`@mindspore.jit` 关键参数：

- `capture_mode="ast"`（默认，解析 AST）/ `"bytecode"`（实验性运行时解析）/ `"trace"`（执行追踪）
- `jit_level="O0"`（关闭非必要优化）/ `"O1"`（开启算子融合等常见优化）
- `fullgraph=False`（默认，不支持的语法自动回退）/ `True`（强制整图，失败即报错）

## 函数式自动微分：grad 与 value_and_grad

MindSpore 的自动微分是**函数式范式**：把求导本身当作一个高阶函数 `grad(fn) → grad_fn`，调用 `grad_fn(x)` 得到 `fn` 在 `x` 处的梯度。这与 PyTorch 的「张量挂 `.grad`、调 `.backward()`」面向对象风格截然不同。

```python
import mindspore
from mindspore import ops

# 定义一个可微函数
def function(x, y, w, b):
    z = ops.matmul(x, w) + b
    loss = ops.binary_cross_entropy_with_logits(z, y, ops.ones_like(z), ops.ones_like(z))
    return loss

# grad：对第 2、3 个参数（w、b）求导
grad_fn = mindspore.grad(function, grad_position=(2, 3))
grads = grad_fn(x, y, w, b)             # 返回 (grad_w, grad_b)
```

**`value_and_grad`：一次拿到前向值与梯度**（训练循环最常用）：

```python
def forward_fn(x, y):
    z = model(x)
    loss = loss_fn(z, y)
    return loss

grad_fn = mindspore.value_and_grad(forward_fn, None, weights=model.trainable_params())
loss, grads = grad_fn(x, y)             # 同时返回 loss 和对参数的梯度
```

要点：

- `grad_position` 指定对哪些**位置**的输入求导（元组下标）
- `weights=` 指定对哪些**参数对象**求导（与位置二选一，训练用 `weights=model.trainable_params()`）
- `has_aux=True` 允许函数返回辅助数据而不影响梯度计算
- 高阶导：`grad(grad(fn))` 嵌套即可；`ops.jet` 提供前向模式 Jacobian

## Dataset：声明式数据管线

MindSpore 的 `dataset` 模块是**声明式 + 高性能 Eager 预取**：你用链式 API 描述「读什么、怎么处理、怎么组批」，框架内部用 C++ 多线程执行，吞吐显著高于纯 Python 迭代器。

```python
import mindspore.dataset as ds

# 自定义数据源：实现 __getitem__ 与 __len__ 的可迭代对象
def gen():
    for i in range(1000):
        yield (np.random.rand(3, 32, 32).astype(np.float32), np.int32(i % 10))

dataset = ds.GeneratorDataset(gen, ["data", "label"], shuffle=True)
dataset = dataset.batch(64).repeat(10)

# 内置数据集（MnistDataset / Cifar10Dataset / ImageFolderDataset）
mnist = ds.MnistDataset("data/train", shuffle=True).batch(32)
```

常用变换在 `mindspore.dataset.vision`（图像）与 `mindspore.dataset.transforms`（通用）：

```python
from mindspore.dataset import vision

transforms = [
    vision.Decode(),                       # 解码图像
    vision.Resize(256),
    vision.CenterCrop(224),
    vision.ToTensor(),
    vision.Normalize(mean=[0.485], std=[0.229]),
]
dataset = dataset.map(operations=transforms, input_columns="image")
```

## 第一个网络：nn.Cell

所有神经网络都继承 `nn.Cell`，**`construct` 方法对应 PyTorch 的 `forward`**（这是高频踩坑点，名字不一样）：

```python
import mindspore.nn as nn

class Net(nn.Cell):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()
        self.fc1 = nn.Dense(28 * 28, 512)     # nn.Dense 对应 nn.Linear
        self.relu = nn.ReLU()
        self.fc2 = nn.Dense(512, 10)

    def construct(self, x):                     # 注意是 construct，不是 forward
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        return self.fc2(x)

net = Net()
logits = net(Tensor(np.random.rand(64, 1, 28, 28).astype(np.float32)))
pred = logits.argmax(axis=1)
```

命名映射速查：

| PyTorch | MindSpore | 说明 |
| --- | --- | --- |
| `nn.Module` | `nn.Cell` | 网络基类 |
| `forward()` | `construct()` | 前向方法名 |
| `nn.Linear` | `nn.Dense` | 全连接层 |
| `model.parameters()` | `net.trainable_params()` | 可训练参数 |
| `model(x)` | `net(x)` | 直接调用 |
| `loss.backward()` | `value_and_grad(fn)` | 函数式求导 |

## 训练循环：函数式骨架

```python
import mindspore as ms

loss_fn = nn.CrossEntropyLoss()
optimizer = nn.Momentum(net.trainable_params(), learning_rate=1e-2, momentum=0.9)

def forward_fn(data, label):
    logits = net(data)
    loss = loss_fn(logits, label)
    return loss, logits

grad_fn = ms.value_and_grad(forward_fn, None, weights=net.trainable_params())

def train_step(data, label):
    (loss, _), grads = grad_fn(data, label)
    optimizer(grads)                           # 函数式：optimizer(梯度) 直接更新
    return loss

net.set_train()                                # 训练模式（BatchNorm/Dropout 生效）
for epoch in range(10):
    for data, label in dataset.create_tuple_iterator():
        loss = train_step(data, label)
```

**或用高层封装 `Model`**（类 Keras 风格，少写循环）：

```python
from mindspore.train import Model, LossMonitor

model = Model(net, loss_fn, optimizer, metrics={"acc": nn.Accuracy()})
model.train(10, dataset, callbacks=[LossMonitor()])
```

## 保存与加载

```python
from mindspore import save_checkpoint, load_checkpoint, load_param_into_net

# 保存
save_checkpoint(net, "model.ckpt")

# 加载
param_dict = load_checkpoint("model.ckpt")
load_param_into_net(net, param_dict)        # 把权重灌入网络
```

- MindSpore 用 `.ckpt` 格式（二进制参数字典），不依赖类定义路径
- 推理部署侧通常再转成 **MindIR**（`export(net, *inputs, file_name="model", file_format="MINDIR")`）供端侧 Lite 或 Ascend 推理引擎加载

## 下一步

- 进阶 API 与 `nn.Cell` / `ops` 详解：见 [指南](./guide-line.md)
- 完整 API 速查表与版本演进：见 [参考](./reference.md)
- 大模型分布式训练（Parallel / 自动并行 / 流水线并行）：详见对应专题叶
- 端侧部署：见 MindSpore Lite 文档（converter 工具 + Lite SDK）
