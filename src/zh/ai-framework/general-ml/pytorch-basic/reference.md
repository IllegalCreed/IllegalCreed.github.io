---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PyTorch 2.13.0 stable API 文档 + Release Notes（2.8–2.13）整理

## 速查

- **创建**：`rand/randn/zeros/ones/empty/full/arange/linspace/tensor/from_numpy`
- **形状**：`view/reshape/permute/transpose/squeeze/unsqueeze/flatten/cat/stack/split/chunk`
- **运算**：逐元素 `add/mul`、矩阵乘 `@`/`matmul`/`bmm`、规约 `sum/mean/max/argmax`、比较 `eq/topk/sort`
- **索引**：切片、`x[mask]` 布尔索引、`index_select`/`gather`/`scatter_`
- **nn**：`Linear/Conv2d/BatchNorm/LayerNorm/Dropout/ReLU/GELU/Embedding/MultiheadAttention/Sequential/ModuleList`
- **optim**：`SGD/Adam/AdamW/Adagrad(fused)` + `lr_scheduler.*`
- **data**：`Dataset/DataLoader/Subset/random_split/ConcatDataset`
- **dtype**：`float32`（默认）/ `float64` / `float16` / `bfloat16` / `int64(long)` / `int32` / `uint8` / `bool`
- **设备**：`cpu` / `cuda:N` / `mps` / `xpu:N`；统一入口 `torch.accelerator`
- **版本**：稳定版 **2.13.0**；Python 3.10–3.14；PyPI 默认 CUDA 13.0（回退 cu126 / cpu）

## 张量创建与属性

| API | 说明 |
| --- | --- |
| `torch.rand/randn(*shape)` | 均匀 [0,1) / 标准正态 |
| `torch.zeros/ones/empty(*shape)` | 全 0 / 全 1 / 未初始化 |
| `torch.full(shape, v)` | 填充值 v |
| `torch.arange(start, end, step)` | 等差序列 |
| `torch.linspace(start, end, steps)` | 等分数值 |
| `torch.tensor(data, dtype=, device=)` | 从 Python/NumPy 数据 |
| `torch.from_numpy(arr)` | 与 NumPy 共享内存 |
| `x.new_ones(n)` / `torch.zeros_like(x)` | 继承 dtype+device |

属性：`x.shape`(torch.Size) / `x.dtype` / `x.device` / `x.requires_grad` / `x.grad` / `x.grad_fn` / `x.ndim` / `x.numel()`。

## 形状与拼接

```python
x.view(4, -1)            # 共享内存重排（-1 自动推断），要求内存连续
x.reshape(4, -1)         # 不连续时自动拷贝，更稳
x.permute(0, 2, 3, 1)    # 维度换位（NCHW→NHWC 常用）
x.transpose(0, 1)        # 两维互换；x.T 是 2 维转置
x.unsqueeze(0)           # 加 batch 维；x.squeeze() 去长度 1 维
torch.cat([a, b], dim=0) # 拼接（维度数不变）
torch.stack([a, b])      # 堆叠（新增一维）
torch.chunk(x, 4, dim=1) # 等分；torch.split(x, [2, 3, 5], dim=1) 按份数
```

## 运算与索引

```python
a @ b                    # 矩阵乘（= a.matmul(b)）；批量用 torch.bmm
a * b                    # 逐元素乘（支持广播）
x.sum(dim=1, keepdim=True)
x.max(dim=1)             # 返回 (values, indices)；x.argmax(dim=1) 只要索引
x.topk(5, dim=1)         # Top-K 值与索引
x[x > 0]                 # 布尔掩码索引 → 1 维结果
torch.gather(x, 1, idx)  # 按索引取值（取预测概率常用）
y.scatter_(1, idx, v)    # 按索引写入（one-hot 常用）
x.clamp(min=0)           # 截断（ReLU 等价 x.relu()）
torch.where(cond, a, b)  # 三元选择
```

广播规则：从右往左对齐维度，**长度为 1 或缺失的维可广播**；`a + b` 中 `(3,1) + (1,4) → (3,4)`。

## torch.nn 常用层

| 层 | 签名要点 | 备注 |
| --- | --- | --- |
| `nn.Linear(in_features, out_features)` | `bias=True` | 全连接 |
| `nn.Conv2d(in_ch, out_ch, kernel_size)` | `stride=1, padding=0, groups=1` | `padding="same"` 保尺寸 |
| `nn.MaxPool2d / AvgPool2d(k)` | `stride` | 下采样 |
| `nn.BatchNorm1d/2d` | `num_features` | train/eval 行为不同 |
| `nn.LayerNorm(normalized_shape)` | `elementwise_affine=True` | Transformer 标配 |
| `nn.Dropout(p=0.5)` | `inplace` | 仅 train 生效 |
| `nn.ReLU/GELU/SiLU` | `inplace` | GELU 是 Transformer 主流 |
| `nn.Embedding(num_embeddings, embedding_dim)` | `padding_idx` | long 索引输入 |
| `nn.MultiheadAttention(embed_dim, num_heads)` | `batch_first=True` | 自/交叉注意力 |
| `nn.Sequential(...)` | 有序容器 | 简单前馈堆叠 |
| `nn.ModuleList / ModuleDict` | 注册子模块 | 普通 list 不注册参数！ |
| `nn.LinearCrossEntropyLoss` | 2.13 新增 | 大词表投影+损失融合，省峰值显存 |

> **坑**：子模块放在普通 Python `list` 里**不会注册参数**（优化器看不到）——必须用 `nn.ModuleList`。

## torch.optim 与调度器

```python
# 参数分组：不同层不同 lr / weight_decay
optimizer = torch.optim.AdamW([
    {"params": model.backbone.parameters(), "lr": 1e-5},
    {"params": model.head.parameters(), "lr": 1e-3, "weight_decay": 0.0},
], lr=3e-4, weight_decay=0.01)

# 常用调度器
torch.optim.lr_scheduler.StepLR(opt, step_size=30, gamma=0.1)
torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=1e-3, total_steps=total)
torch.optim.lr_scheduler.ReduceLROnPlateau(opt, mode="min", patience=3)  # 按指标触发
```

## 数据管线

```python
from torch.utils.data import Dataset, DataLoader, random_split, Subset

train_ds, val_ds = random_split(dataset, [0.9, 0.1],
    generator=torch.Generator().manual_seed(42))     # 可复现划分

DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,          # 仅训练
    num_workers=4,         # 多进程预取（Linux）
    pin_memory=True,       # 锁页内存，加速 CPU→GPU 拷贝
    drop_last=True,        # 丢掉不满 batch 的尾巴（BatchNorm 场景）
    collate_fn=my_collate, # 自定义组批（变长序列 padding）
)
```

## 设备与加速器

```python
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
x = x.to(device, non_blocking=True)          # 配 pin_memory 异步拷贝

torch.accelerator.current_accelerator()      # 2.x 统一加速器抽象
torch.backends.cudnn.benchmark = True        # 固定输入尺寸时加速卷积
torch.manual_seed(42)                        # 复现（GPU 另需 cuda.manual_seed_all）
```

## 版本与兼容（2.8 → 2.13 要点）

| 版本 | 关键变化 |
| --- | --- |
| 2.8 | Maxwell/Pascal 从 cu128/cu129 wheel 移除；libtorch 稳定 ABI（Unstable） |
| 2.9 | Python 最低 3.10；**ONNX 默认 dynamo 导出**、默认 opset 20；PyPI 预告 CUDA 13 |
| 2.10 | `torch.compile` 支持 Python 3.14；`torch.onnx.export` 的 `dynamic_axes` 废弃（用 `dynamic_shapes`）；torch.jit 开始警告 |
| 2.11 | **PyPI 默认 CUDA 13.0**（SM 7.5+）；`torch.hub.load` 默认 `trust_repo="check"` |
| 2.12 | `torchrun` 单机默认 OS 空闲端口；MPS 统一内存；`nn.LinearCrossEntropyLoss` 前奏 |
| 2.13 | FlexAttention on MPS（~12×）；**`nn.LinearCrossEntropyLoss`**；FSDP2 通信重叠；torchcomms；移除 named tensor 与 Bazel 构建 |

升级注意：CUDA 与 wheel 强绑定，换大版本先看 Release Notes 的 Backwards Incompatible 一节；生产环境锁定 `torch==x.y.z`。

## 生态版图

- **领域库**：torchvision（图像/视频）、torchaudio（音频）、torchtext（文本）、torchrec（推荐）、torchdata（数据管线）
- **训练框架**：PyTorch Lightning / Lightning Fabric（工程化封装）、Hugging Face Trainer / Accelerate
- **分布式**：torch.distributed（DDP/FSDP/FSDP2/DeviceMesh/DTensor）、torchcomms（2.13）
- **部署**：torch.export → AOTI / ExecuTorch（端侧）；ONNX（opset 20+）→ ONNX Runtime / TensorRT
- **调试性能**：torch.profiler、`torch.cuda.memory_snapshot()`（2.10 起替代 export_memory_timeline）

## 官方资源

- [Stable API 文档](https://docs.pytorch.org/en/stable/)
- [Tutorials](https://docs.pytorch.org/tutorials/)
- [Release Notes 全集](https://github.com/pytorch/pytorch/releases)
- [论坛 Dev Discuss](https://dev-discuss.pytorch.org/)
