---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 PyTorch 2.13.0 stable API 文档（torch.distributed / DDP / FSDP2 / DTensor / TP / pipelining / elastic run）+ Release Notes（2.8–2.13）整理

## 速查

- **进程组**：`init_process_group(backend)` / `destroy_process_group()` / `new_group()` / `barrier()`
- **集合通信**：`broadcast/all_reduce/reduce/all_gather/reduce_scatter/all_to_all/send/recv`（`dist.` 直下）
- **后端**：`nccl`（GPU 首选）/ `gloo`（CPU、Windows 唯一）/ `mpi` / `xccl`（Intel XPU）
- **启动**：`torchrun --nnodes=N --nproc-per-node=G --rdzv-backend=c10d --rdzv-endpoint=host:29400`
- **DDP**：`DistributedDataParallel(model, device_ids=[local_rank])`
- **FSDP2**：`fully_shard(module, mesh=, reshard_after_forward=, mp_policy=, offload_policy=)`
- **网格**：`init_device_mesh(dev, shape, mesh_dim_names=...)`；切片 `mesh["name"]`
- **DTensor**：`distribute_tensor / from_local / full_tensor / to_local / redistribute`
- **placement**：`Shard(dim) / Replicate() / Partial(reduce_op)`
- **TP**：`parallelize_module(m, mesh1d, plan)` + `ColwiseParallel/RowwiseParallel/SequenceParallel` + `loss_parallel()`
- **PP**：`pipeline() / PipelineStage / build_stage` + `ScheduleGPipe/1F1B/Interleaved1F1B/LoopedBFS/InterleavedZeroBubble/ZBVZeroBubble/DualPipeV`
- **版本**：稳定版 **2.13.0**（torchcomms + FSDP2 通信重叠）；NCCL 源码构建要求 ≥ 2.23

## torch.distributed 基础 API

| API | 说明 |
| --- | --- |
| `init_process_group(backend, init_method=, rank=, world_size=, timeout=)` | 初始化默认进程组；torchrun 下只传 backend |
| `get_rank() / get_world_size()` | 组内编号 / 组大小 |
| `new_group(ranks, use_local_synchronization=)` | 创建子组（自定义并行拓扑用） |
| `barrier()` | 组内屏障（存档顺序保护常用） |
| `destroy_process_group()` | 退出前清理 |
| `get_default_backend_for_device(acc)` | 按加速器选默认后端（2.x 推荐写法） |

### 集合通信原语

```python
dist.broadcast(t, src=0)                 # src → 全组
dist.all_reduce(t, op=ReduceOp.SUM)      # 全组规约，人人得结果
dist.reduce(t, dst=0)                    # 规约到 dst
dist.all_gather([t1, t2], t)             # 人人收集全组分片
dist.reduce_scatter(out, [t1, t2])       # 规约 + 分片下发（FSDP 梯度）
dist.all_to_all([o1, o2], [i1, i2])      # 交换分片（MoE/序列并行）
dist.send(t, dst) / dist.recv(t, src)    # 点对点（PP 激活）
```

规则：所有 rank 必须以**相同顺序**发起**匹配**的集合调用；GPU 张量必须走 NCCL（Gloo 支持有限 CUDA 集合），dtype/shape 全组一致。

## torchrun 参数速查

| 参数 | 说明 |
| --- | --- |
| `--nproc-per-node=N` | 每节点进程数；支持 `gpu`/`cpu`/`auto` 自动值 |
| `--nnodes=N` 或 `--nnodes=MIN:MAX` | 节点数；区间形式即弹性模式 |
| `--standalone` | 单机便捷模式（自动 c10d rendezvous） |
| `--rdzv-id / --rdzv-backend / --rdzv-endpoint` | 多机 rendezvous：作业 ID / 后端（c10d 推荐）/ `host:29400` |
| `--max-restarts=3` | 工作组失败自动重启次数（容错） |
| `--numa-binding=node` | NUMA 亲和绑定提性能 |
| `--local-rank` | 传给脚本的本地 rank（2.0 起虚线形式） |

注入脚本的环境变量：`RANK` `LOCAL_RANK` `WORLD_SIZE` `LOCAL_WORLD_SIZE` `MASTER_ADDR` `MASTER_PORT` `GROUP_RANK` `TORCHELASTIC_RESTART_COUNT`。注意：`RANK` 跨重启**不稳定**，勿硬编码。

## DDP 参数速查

```python
DistributedDataParallel(
    model,
    device_ids=[local_rank],   # 一进程一卡；多 GPU 模型并行时省略
    output_device=local_rank,
    bucket_cap_mb=25,          # 梯度桶大小
    find_unused_parameters=False,  # 条件控制流才开，有开销
    gradient_as_bucket_view=True,  # 省一次梯度拷贝
    static_graph=False,        # 图固定时 True 提速
)
model.no_sync()                # 梯度累积上下文：跳过同步
model.module                   # 取回原始模型（存档用）
```

## FSDP2 API 速查

```python
from torch.distributed.fsdp import (
    fully_shard, MixedPrecisionPolicy, OffloadPolicy, CPUOffloadPolicy,
    FSDPModule, register_fsdp_forward_method)

fully_shard(module, mesh=None, reshard_after_forward=None,
            mp_policy=MixedPrecisionPolicy(), offload_policy=OffloadPolicy(),
            ignored_params=None)
```

- `mesh`：1D = FSDP（`Shard(0)`）；2D = HSDP（`Replicate` + `Shard(0)`）
- `reshard_after_forward`：`True` 省显存 / `False` 省反向 all-gather（根推荐）/ `int` 重分片到小组
- `MixedPrecisionPolicy(param_dtype, reduce_dtype, output_dtype, cast_forward_inputs)`：模块级混合精度
- `CPUOffloadPolicy(pin_memory=True)`：参数/梯度/优化器状态卸载 CPU

**FSDPModule 方法**（`type(model)` 被原地并入 `FSDPModule`）：

| 方法 | 用途 |
| --- | --- |
| `reshard() / unshard(async_op=)` | 手动重分片 / all-gather 出全量参数 |
| `set_requires_gradient_sync(bool)` | 梯度累积免通信（FSDP1 `no_sync` 等价） |
| `set_reshard_after_forward(bool)` | 运行期改 reshard 策略（eval 可关） |
| `set_modules_to_forward_prefetch([m])` | 前向 all-gather 预取 |
| `set_modules_to_backward_prefetch([m])` | 反向 all-gather 预取 |
| `set_reduce_scatter_unused_params(bool)` | 条件未用参数（MoE/多模态） |
| `set_separate_reduce_scatter_group(bool)` | **2.13**：RS 独立进程组与 AG 重叠（opt-in） |
| `reset_iter_state()` | 异常中断后恢复（根模块上调用） |
| `set_all_reduce_hook / set_custom_all_gather / set_custom_reduce_scatter` | 高阶自定义通信 |

迁移提示：FSDP1（`FullyShardedDataParallel`）仍可用，官方建议迁移 FSDP2；差异要点——FSDP2 用 DTensor per-parameter dim-0 分片（非扁平参数）、无 `record_stream`、不直接支持 full state_dict（用 `DTensor.full_tensor()` 或 Distributed Checkpoint）。

## DeviceMesh / DTensor API 速查

```python
from torch.distributed.device_mesh import init_device_mesh
from torch.distributed.tensor import (
    distribute_tensor, distribute_module, DTensor, Shard, Replicate, Partial)

mesh = init_device_mesh("cuda", (2, 4), mesh_dim_names=("dp", "tp"))
sub = mesh["tp"]                          # 1D 子网格（TP 必须 1D）

dt = distribute_tensor(x, mesh, [Shard(0), Replicate()])   # 全局张量 → DTensor
lt = DTensor.from_local(local, mesh, [Replicate()])        # 本地分片 → DTensor
full = dt.full_tensor()                   # = redistribute 全 Replicate + to_local
dt2 = dt.redistribute(mesh, [Replicate(), Replicate()])    # 布局转换（自动通信）
local = dt.to_local()                     # 取本地分片（两者皆可微）
```

- 三种 placement：`Shard(dim)`（chunk 语义）、`Replicate()`、`Partial("sum"/"avg"/"min"/"max"/...)`
- 工厂函数：`torch.distributed.tensor.zeros/randn/empty/ones(..., device_mesh=, placements=)`
- 调试：`CommDebugMode`（统计集合通信）、`visualize_sharding(dt)`、`TORCH_LOGS=dtensor`
- 实验件：`context_parallel`（CP，prototype）、`local_map`、`register_sharding`（自定义算子分片策略）

## TP / PP API 速查

| 组件 | API | 说明 |
| --- | --- | --- |
| TP 入口 | `parallelize_module(m, mesh1d, plan)` | plan 为 `{FQN: ParallelStyle}` |
| TP 风格 | `ColwiseParallel()` | 列切；输出默认最后一维分片 |
| TP 风格 | `RowwiseParallel()` | 行切；输入默认最后一维分片，输出复制 |
| TP 风格 | `SequenceParallel()` | LayerNorm/Dropout/RMSNorm 按序列维 |
| TP 布局 | `PrepareModuleInput/Output/InputOutput` | 只重排输入输出布局，不切权重 |
| TP 损失 | `loss_parallel()` | 类别维分片的 cross_entropy 并行计算 |
| PP 切分 | `pipeline(module, mb_args, split_spec=)` | 自动切分（torch.export 追踪） |
| PP 手动 | `PipelineStage(submodule, stage_index, num_stages, device)` | 手工提供分段模块 |
| PP 调度 | `ScheduleGPipe / Schedule1F1B` | 每 rank 单段 |
| PP 调度 | `ScheduleInterleaved1F1B / ScheduleLoopedBFS` | 每 rank 多段 |
| PP 调度 | `ScheduleInterleavedZeroBubble / ScheduleZBVZeroBubble / ScheduleDualPipeV` | 零气泡系 |
| PP 执行 | `schedule.step(x, target=, losses=)` | 整 batch 输入，自动切 micro-batch |

成熟度标记：TP **experimental**；pipelining 与 DTensor 属 **alpha**——升级跨版本先查 Release Notes。

## 版本与兼容（2.8 → 2.13 分布式要点）

| 版本 | 关键变化 |
| --- | --- |
| 2.8 | Distributed Checkpoint 支持 safetensors；Intel XCCL 后端 |
| 2.9 | 对称内存（symmetric memory）多 GPU 内核编程；aarch64 wheel |
| 2.10 | `LocalTensor` 单进程模拟多 rank 调试；DeviceMesh 扁平维切片告警 |
| 2.11 | 可微集合通信；DeviceMesh 内置进程组注册表（须先 init PG 再建 mesh）；DTensor `to_local` 反向 Partial→Replicate |
| 2.12 | **torchrun 单机默认 OS 空闲端口**；`torch.distributed.nn.functional` 在 compile 下报错（迁 `_functional_collectives`）；FSDP2 不再支持 hooks 无图断点全图编译 |
| 2.13 | **torchcomms** 新通信后端（容错/可扩展/可调试）；**FSDP2 RS/AG 独立进程组重叠**（opt-in）；源码构建 NCCL ≥ 2.23 |

升级注意：多机作业全集群必须同版本；NCCL 行为随 CUDA/wheel 变化；TP/PP/DTensor 标 alpha/experimental 的 API 跨版本可能改签名。

## torchcomms（2.13 新后端）

- 定位：PyTorch Distributed 的新一代通信层——高层 collectives API + 多个开箱后端，主打大集群**容错**（优雅超时、部分组恢复）、**可扩展性**、**可调试性**（结构化日志）
- 状态：experimental；仓库 [meta-pytorch/torchcomms](https://github.com/meta-pytorch/torchcomms)
- 试用（2.12 起）：`pip install torchcomms` + `TORCH_DISTRIBUTED_USE_TORCHCOMMS=1`
- 方向：ProcessGroup 趋向 eager 初始化，官方计划让 torchcomms 成为默认通信路径

## 生态版图

- **训练框架**：TorchTitan（官方 3D 并行参考实现）、PyTorch Lightning、Hugging Face Accelerate/Trainer（底层即 DDP/FSDP）
- **第三方大模型训练**：Megatron-LM、DeepSpeed、veRL（底层通信仍是 torch.distributed/NCCL）
- **检查点**：Distributed Checkpoint（DCP，分片 state_dict 免通信存取）、safetensors 支持
- **下游推理**：vLLM/SGLang 张量并行复用同款 collectives 与 DeviceMesh 概念

## 官方资源

- [torch.distributed 文档](https://docs.pytorch.org/docs/2.13/distributed.html)
- [Distributed 教程系列](https://docs.pytorch.org/tutorials/#distributed-training)
- [FSDP2 RFC 与迁移指南](https://docs.pytorch.org/docs/2.13/distributed.fsdp.fully_shard.html)
- [TorchTitan（3D 并行范本）](https://github.com/pytorch/torchtitan)
- [Release Notes 全集](https://github.com/pytorch/pytorch/releases)
