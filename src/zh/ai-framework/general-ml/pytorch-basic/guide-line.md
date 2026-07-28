---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 PyTorch 2.13.0 官方文档（autograd / torch.nn / torch.optim / Save & Load / AMP / torch.compile）+ 2.13.0 Release Notes 编写

## 速查

- **autograd**：`x.requires_grad_(True)` 开始追踪 → `loss.backward()` 求全部叶子梯度 → 梯度写入 `param.grad`
- **梯度默认累加**：每个 step 前必须 `optimizer.zero_grad()`（或 `set_to_none=True` 更省内存）
- **临时关图**：`with torch.no_grad():`（评估）；`torch.inference_mode()`（纯推理，更快更彻底）；`x.detach()`（截断梯度流）
- **自定义算子**：继承 `torch.autograd.Function`，实现 `forward(ctx, ...)` + `backward(ctx, grad_out)`
- **参数访问**：`model.parameters()`（迭代器）/ `model.named_parameters()` / `model.state_dict()`（有序字典）
- **常用层**：`nn.Linear` / `nn.Conv2d` / `nn.BatchNorm2d` / `nn.LayerNorm` / `nn.Dropout` / `nn.Embedding`
- **损失**：分类 `nn.CrossEntropyLoss`（吃 logits）；回归 `nn.MSELoss`；二分类 `nn.BCEWithLogitsLoss`
- **优化器**：`torch.optim.SGD`（+momentum）/ `Adam` / `AdamW`（权重衰减解耦，Transformer 标配）
- **学习率调度**：`lr_scheduler.StepLR` / `CosineAnnealingLR` / `OneCycleLR`，每个 epoch/step 后 `scheduler.step()`
- **混合精度**：`torch.autocast(device_type="cuda")` + `torch.cuda.amp.GradScaler()`
- **保存**：`torch.save(model.state_dict(), path)`；加载 `load_state_dict` + `weights_only=True`
- **torch.compile**：`model = torch.compile(model)` 一行提速；`mode="max-autotune"` 更激进
- **2.13 新件**：`nn.LinearCrossEntropyLoss`（大词表省峰值显存）、FlexAttention on MPS、FSDP2 通信重叠

## autograd：动态计算图与反向传播

PyTorch 的自动微分是**定义即运行（define-by-run）**：前向计算的同时在后台把运算记录成有向无环图（DAG），叶子是输入张量，根是输出（通常是 loss）。

```python
import torch

x = torch.ones(2, 2, requires_grad=True)   # 叶子张量：声明需要梯度
y = x + 2
z = y * y * 3
out = z.mean()

print(z.grad_fn)   # <MulBackward0>：非叶子张量记录生成它的算子
out.backward()     # 反向传播：d(out)/d(x) 写入 x.grad
print(x.grad)      # tensor([[4.5, 4.5], [4.5, 4.5]])
```

**三条铁律**：

1. **梯度是累加的**：`backward()` 把新梯度加进 `.grad` 而非覆盖——所以训练循环里必须 `optimizer.zero_grad()`；`optimizer.zero_grad(set_to_none=True)`（默认即为 True）直接置 None，比清零更省内存且避免意外复用。
2. **只有标量能直接 `backward()`**：非标量输出要传梯度权重张量 `out.backward(torch.ones_like(out))`（向量-Jacobian 积）。
3. **图只建一次**：`backward()` 默认释放图，二次反向需 `backward(retain_graph=True)`。

### 控制梯度流的三种方式

```python
# ① no_grad：评估/推理的标准写法，不建图、省显存
model.eval()
with torch.no_grad():
    pred = model(x)

# ② inference_mode：比 no_grad 更彻底（连版本计数都省），纯推理更快；
#    产出的张量此后不能再参与需要梯度的计算
with torch.inference_mode():
    pred = model(x)

# ③ detach：从图中截下一段（如 GAN 冻结判别器、特征提取不回传）
feat = backbone(x).detach()
```

### 自定义可微算子

需要库外操作又保可导时，继承 `torch.autograd.Function`：

```python
class MyCube(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x):
        ctx.save_for_backward(x)          # 留给 backward 用
        return x ** 3

    @staticmethod
    def backward(ctx, grad_out):
        (x,) = ctx.saved_tensors
        return grad_out * 3 * x ** 2       # d(x³)/dx = 3x²

out = MyCube.apply(torch.tensor(2.0, requires_grad=True))
out.backward()                             # grad = 12.0
```

> 2.13 注意：自定义算子**返回值不得与输入共享存储**（`torch.compile` 下会 UserWarning 并将在未来报错）——`return x.clone()` 而不是 `return x`。

## nn.Module 进阶

### 参数与缓冲区

```python
lin = nn.Linear(784, 256)
lin.weight.shape, lin.bias.shape      # (256, 784) (256,)

for name, p in model.named_parameters():
    print(name, p.shape)              # 遍历全部可学习参数

model.state_dict()                    # 有序字典：层名 → 张量（含 buffer）
```

- **Parameter**：`nn.Parameter`，自动出现在 `parameters()` 并随优化器更新
- **Buffer**：`self.register_buffer("mean", torch.zeros(1))`——跟随 `state_dict` 保存与设备迁移，但不求梯度（BatchNorm 的 running_mean 就是 buffer）
- **冻结部分网络**：`for p in model.backbone.parameters(): p.requires_grad = False`

### 常用层速查

| 层 | 用途 | 关键参数 |
| --- | --- | --- |
| `nn.Linear(in, out)` | 全连接 | 自动含 weight+bias |
| `nn.Conv2d(in, out, k)` | 二维卷积 | `stride` `padding` `groups`（深度可分离） |
| `nn.BatchNorm2d` | 批归一化 | train/eval 行为不同，必须用对 `model.train()/eval()` |
| `nn.LayerNorm` | 层归一化 | Transformer 标配，与 batch 大小无关 |
| `nn.Dropout(p)` | 随机丢弃 | 只在 train 模式生效 |
| `nn.Embedding(num, dim)` | 词嵌入 | 输入是 long 型 id |
| `nn.MultiheadAttention` | 多头注意力 | `embed_dim` `num_heads` |

### 权重初始化

默认初始化通常可用，自定义用 `torch.nn.init`：

```python
from torch import nn
nn.init.kaiming_uniform_(lin.weight, nonlinearity="relu")   # ReLU 系标配 He 初始化
nn.init.xavier_uniform_(lin.weight)                          # tanh/sigmoid 系 Xavier
nn.init.zeros_(lin.bias)
```

## 损失函数与优化器

```python
# 损失：按任务选
criterion_cls = nn.CrossEntropyLoss()        # 多分类：输入 logits + long 标签
criterion_reg = nn.MSELoss()                 # 回归
criterion_bin = nn.BCEWithLogitsLoss()       # 二分类：数值更稳（别先 sigmoid）

# 优化器
opt_sgd = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9, weight_decay=1e-4)
opt_adamw = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.01)

# 学习率调度（2.13：Adagrad 也支持 fused=True，与 Adam/AdamW/SGD 看齐）
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt_adamw, T_max=100)

for epoch in range(100):
    train_one_epoch()
    sched.step()                              # 每个 epoch 末调
```

**Adam vs AdamW**：AdamW 把权重衰减从梯度里解耦（L2 ≠ 权重衰减），是 Transformer 训练的事实标准；SGD+momentum 在 CNN 上常更稳。

## 混合精度训练（AMP）

大模型/大 batch 必备：大部分算子跑 float16/bfloat16，关键部分保留 float32，提速又省显存。

```python
scaler = torch.cuda.amp.GradScaler()

for X, y in train_loader:
    X, y = X.cuda(), y.cuda()
    optimizer.zero_grad()
    with torch.autocast(device_type="cuda"):          # 自动选择半精度算子
        loss = criterion(model(X), y)
    scaler.scale(loss).backward()                     # 缩放损失防梯度下溢
    scaler.step(optimizer)
    scaler.update()                                   # 动态调整缩放因子
```

CPU/新版写法：`with torch.autocast(device_type="cpu", dtype=torch.bfloat16):`。

## torch.compile：eager 之上的免费加速

PyTorch 2.x 的性能主线：`torch.compile` 用 Dynamo 捕获 Python 字节码成图，Inductor 生成融合内核，**不改模型代码即可获得 1.3–2× 典型加速**。

```python
model = NeuralNetwork().to(device)
model = torch.compile(model)                    # 首次调用时编译（有预热开销）

# 更激进的调优（编译更久，运行更快）
model = torch.compile(model, mode="max-autotune")
```

- 与 eager 完全互操作：编译失败的部分自动回退 eager（graph break），不报错
- 2.12 起 `fullgraph=True` 若整段无图可编会告警（2.13 升级报错）；`torch.export` 则用于部署侧的整图导出
- 2.13 亮点：**FlexAttention 登陆 Apple Silicon**（稀疏模式较 SDPA 最高 ~12×），Inductor 新增 CuTeDSL 实验后端
- 大词表 LLM 训练可用 2.13 新增的 **`nn.LinearCrossEntropyLoss`**：投影与损失融合计算，峰值显存最多省 4×

## 多卡与分布式（指路）

本叶只列入口，详见「PyTorch 分布式训练」叶：

- **单机多卡**：`nn.DataParallel`（简单但低效，官方不再推荐）→ 用 **DDP**（`torchrun --nproc-per-node=N`，2.12 起默认 OS 分配空闲端口）
- **大模型分片**：**FSDP / FSDP2**（参数、梯度、优化器状态全分片；2.13 FSDP2 支持通信重叠）
- **集群通信**：2.13 新后端 **torchcomms**（容错、可扩展、可调试）

## 保存、加载与部署格式

```python
# 训练侧标准：state_dict
torch.save(model.state_dict(), "weights.pth")
model.load_state_dict(torch.load("weights.pth", map_location="cpu", weights_only=True))

# 含优化器状态的断点续训
torch.save({
    "epoch": epoch,
    "model": model.state_dict(),
    "optimizer": optimizer.state_dict(),
    "scheduler": scheduler.state_dict(),
}, "checkpoint.pth")
```

部署链路（2.x 现状）：`torch.jit`（TorchScript）持续退役 → 新代码用 **`torch.export`** 生成整图，或 `torch.onnx.export`（**2.9 起默认 dynamo 导出**、默认 opset 20、`dynamic_axes` 已废弃改 `dynamic_shapes`）交 ONNX Runtime/TensorRT；端侧走 ExecuTorch。社区大模型权重首选 safetensors。
