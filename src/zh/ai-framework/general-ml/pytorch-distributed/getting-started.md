---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 PyTorch 2.13.0 官方文档（DDP Tutorial / torchrun elastic agent / FSDP2 fully_shard / DTensor）编写，对照当前稳定版行为

## 速查

- **启动**：`torchrun --nproc-per-node=4 train.py`（单机 4 卡；2.12 起默认 OS 分配空闲端口，不再撞 29500）
- **初始化**：`dist.init_process_group("nccl")`——torchrun 已注入 `RANK/LOCAL_RANK/WORLD_SIZE/MASTER_ADDR/MASTER_PORT`
- **后端**：GPU 用 `nccl`、CPU 用 `gloo`；`dist.get_default_backend_for_device(acc)` 自动选
- **DDP 三件套**：`model.to(local_rank)` → `DistributedDataParallel(model, device_ids=[local_rank])` → 正常训练循环
- **DDP 数据**：`DistributedSampler(dataset, num_replicas=world, rank=rank, shuffle=True)`，每 epoch `sampler.set_epoch(epoch)`
- **FSDP2**：`from torch.distributed.fsdp import fully_shard`，对每层 bottom-up 应用后再应用根模块
- **DeviceMesh**：`init_device_mesh("cuda", (2, 4), mesh_dim_names=("dp", "tp"))`，`mesh["tp"]` 切 1D 子网格
- **DTensor**：`distribute_tensor(x, mesh, [Shard(0)])`；回收完整张量用 `dt.full_tensor()`
- **TP**：`parallelize_module(m, tp_mesh, {"w1": ColwiseParallel(), "w2": RowwiseParallel()})`
- **PP**：`pipeline(module, mb_args, split_spec=...)` → `build_stage` → `ScheduleGPipe(stage, n_microbatches).step(x)`
- **收尾**：`dist.destroy_process_group()`；多进程脚本只能经 torchrun/mp.spawn 启动，不能直接 `python train.py`
- **容错**：多机加 `--rdzv-id/--rdzv-backend=c10d/--rdzv-endpoint=$HOST:29400`，`--max-restarts=3` 自动重启

## 安装与前置

分布式能力随 `torch` 主包分发，无需额外安装；GPU 训练需要 NCCL（官方 wheel 已捆绑 ≥2.23 兼容版本）。验证：

```python
import torch
import torch.distributed as dist

torch.cuda.device_count()          # 本机 GPU 数，决定 --nproc-per-node
dist.is_available()                # True = 分布式编译可用
dist.is_nccl_available()           # True = NCCL 后端可用
```

> Windows 注意：`torch.distributed` 在 Windows 仅支持 Gloo 后端（FileStore/TcpStore），NCCL 与高级并行以 Linux 为准。

## 核心概念：进程组与 rank

PyTorch 分布式采用 **SPMD（单程序多数据）** 模型：同一份脚本在 N 个进程中各跑一份，靠三个编号区分身份：

| 概念 | 含义 | 获取方式 |
| --- | --- | --- |
| `RANK` | 全局进程号（0 ~ world_size-1） | `dist.get_rank()` |
| `LOCAL_RANK` | 节点内进程号（决定用哪块 GPU） | `os.environ["LOCAL_RANK"]` |
| `WORLD_SIZE` | 总进程数 | `dist.get_world_size()` |

进程间通过**进程组（ProcessGroup）**通信，初始化一次后所有集合通信（all_reduce/broadcast/...）都在组内进行：

```python
import os
import torch
import torch.distributed as dist

acc = torch.accelerator.current_accelerator()          # cuda/xpu/...
backend = dist.get_default_backend_for_device(acc)     # GPU→nccl，CPU→gloo
dist.init_process_group(backend)                       # 读 torchrun 注入的环境变量

local_rank = int(os.environ["LOCAL_RANK"])
torch.accelerator.set_device_index(local_rank)         # 一进程绑定一卡
```

## 第一个完整例子：DDP 单机多卡

官方推荐路径：**torchrun 启动 + DDP 包裹模型 + DistributedSampler 切数据**。这是最小可工作流（保存为 `train_ddp.py`）：

```python
import os
import torch
import torch.distributed as dist
from torch import nn
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, TensorDataset
from torch.utils.data.distributed import DistributedSampler

def main():
    # ① 初始化进程组并绑定本进程 GPU
    acc = torch.accelerator.current_accelerator()
    dist.init_process_group(dist.get_default_backend_for_device(acc))
    local_rank = int(os.environ["LOCAL_RANK"])
    torch.accelerator.set_device_index(local_rank)
    rank = dist.get_rank()

    # ② 模型上卡并包裹 DDP（构造时 rank 0 自动广播初始参数，各副本起点一致）
    model = nn.Sequential(nn.Linear(10, 64), nn.ReLU(), nn.Linear(64, 2)).to(local_rank)
    model = DDP(model, device_ids=[local_rank])

    # ③ 数据：DistributedSampler 保证各 rank 吃到不重叠的切片
    ds = TensorDataset(torch.randn(1024, 10), torch.randint(0, 2, (1024,)))
    sampler = DistributedSampler(ds, shuffle=True)
    loader = DataLoader(ds, batch_size=32, sampler=sampler)

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()

    # ④ 训练循环与单机版完全一致——梯度同步在 backward 内自动完成
    for epoch in range(3):
        sampler.set_epoch(epoch)                       # 每 epoch 重洗，否则各 rank 顺序不变
        for x, y in loader:
            x, y = x.to(local_rank), y.to(local_rank)
            optimizer.zero_grad()
            loss = loss_fn(model(x), y)
            loss.backward()                            # 内部触发梯度 all-reduce（桶化重叠）
            optimizer.step()
        if rank == 0:
            print(f"epoch {epoch} loss={loss.item():.4f}")
            torch.save(model.module.state_dict(), "ckpt.pth")  # 只在 rank 0 存档

    dist.destroy_process_group()

if __name__ == "__main__":
    main()
```

启动（不要直接 `python train_ddp.py`）：

```bash
# 单机 4 卡：2.12 起默认自动分配空闲端口
torchrun --nproc-per-node=4 train_ddp.py

# 等价显式写法（--standalone 单机模式）
torchrun --standalone --nproc-per-node=4 train_ddp.py

# 多机 2 节点 × 8 卡：所有节点执行同一命令，rdzv_endpoint 指向同一主机
torchrun --nnodes=2 --nproc-per-node=8 \
    --rdzv-id=100 --rdzv-backend=c10d --rdzv-endpoint=$MASTER_ADDR:29400 \
    train_ddp.py
```

三个关键事实：

- **一进程一卡**：`device_ids=[local_rank]`，GPU 不能跨 DDP 进程共享
- **梯度自动同步**：DDP 为每个参数注册 autograd hook，`backward()` 返回时 `param.grad` 已是全组均值；同步按桶（bucket）与反向计算重叠
- **存档只存一份**：所有 rank 参数一致，`rank == 0` 时 `torch.save(model.module.state_dict(), ...)` 即可；注意取 `.module` 去掉 DDP 壳

## 进阶一步：FSDP2 最小改造

模型大到单卡装不下时，把 DDP 换成 FSDP2 的 `fully_shard`——参数、梯度、优化器状态全部按 dim-0 分片：

```python
from torch.distributed.fsdp import fully_shard, MixedPrecisionPolicy

# bottom-up：先每层，再根模块；每次调用创建一个通信组
for layer in model.layers:
    fully_shard(layer)
fully_shard(model)

# 优化器必须建在分片后的（DTensor）参数上
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)

# 训练循环不变：前向自动 all-gather 参数，反向自动 reduce-scatter 梯度
loss = model(x)
loss.backward()
optimizer.step()
```

契约要点：bottom-up 应用（别只包根模块，否则一整次 all-gather 无重叠）；用 `model(x)` 而不是 `model.forward(x)`；`reshard_after_forward=True`（非根默认）用二次 all-gather 换峰值显存。

## 看一眼 DTensor 与 DeviceMesh

FSDP2/TP/PP 的底层语言是「网格 + placement」：

```python
from torch.distributed.device_mesh import init_device_mesh
from torch.distributed.tensor import distribute_tensor, Shard, Replicate

mesh = init_device_mesh("cuda", (4,), mesh_dim_names=("dp",))

x = torch.randn(8, 16)
dx = distribute_tensor(x, mesh, [Shard(0)])   # 全局 8 行切 4 份，每 rank 2 行
print(dx.to_local().shape)                    # torch.Size([2, 16])

full = dx.full_tensor()                       # all-gather 回完整张量（可微）
```

三种 placement：**`Shard(dim)`** 按维切分、**`Replicate()`** 全量复制、**`Partial()`** 待规约的中间态（梯度常见）。`redistribute` 在布局间转换并自动插入对应集合通信。

## 常见启动错误速诊

| 症状 | 原因与处置 |
| --- | --- |
| `Address already in use` | 旧版默认 29500 端口冲突；2.12+ 已自动分配，多实例显式换 `--rdzv-endpoint` 端口 |
| 直接 `python train.py` 报环境变量缺失 | 必须 `torchrun` 或 `mp.spawn` 启动 |
| NCCL timeout 挂死 | 各 rank 到达集合通信的顺序/次数不一致；检查控制流是否 rank 分支不一致、调大 `init_process_group(timeout=)` |
| 各 rank 数据重复 | 忘用 `DistributedSampler` 或忘 `set_epoch` |
| `device_ids` 报错 | 多 GPU 模型并行场景不要传 `device_ids`；常规一进程一卡必须传 |
