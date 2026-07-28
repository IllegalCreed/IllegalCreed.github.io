---
layout: doc
outline: [2, 3]
---

# 指南

> 基于 PyTorch 2.13.0 官方文档（DDP Notes / FSDP2 fully_shard / DTensor / Tensor Parallel / Pipelining / elastic run）+ 2.13.0 Release Notes 编写

## 速查

- **DDP 原理**：每参数 autograd hook + 梯度分桶 all-reduce，通信与反向计算重叠；`bucket_cap_mb` 调桶大小
- **DDP 同步点**：构造器、forward、backward 三处集合通信——各 rank 调用次数与顺序必须一致，否则 NCCL 超时
- **DDP 陷阱**：条件控制流导致部分参数无梯度需 `find_unused_parameters=True`（有性能代价，优先改代码）
- **梯度累积**：DDP 用 `with model.no_sync():` 跳过中间步同步；FSDP2 用 `set_requires_gradient_sync(False)`
- **FSDP2 分片**：per-parameter DTensor dim-0 分片；bottom-up 应用决定通信组边界（无 bucket_cap_mb）
- **FSDP2 重叠**：前向 all-gather 走独立 CUDA stream 预取；反向 all-gather 预取 + reduce-scatter 独立 stream，无需配置
- **FSDP2 混合精度**：`MixedPrecisionPolicy(param_dtype=bfloat16, reduce_dtype=float32)`——模块级 MP，非 autocast
- **FSDP2 卸载**：`CPUOffloadPolicy(pin_memory=True)` 参数/梯度/优化器状态 offload 到 CPU
- **HSDP**：2D mesh `init_device_mesh("cuda", (nodes, gpus), mesh_dim_names=("replicate","shard"))`，跨节点复制、节点内分片
- **DTensor 布局转换**：Shard→Replicate=all_gather；Partial→Replicate=all_reduce；Partial→Shard=reduce_scatter；Shard→Shard=all_to_all
- **TP 组合**：`ColwiseParallel()` 输出按最后一维切 + `RowwiseParallel()` 收尾 all-reduce；LayerNorm/RMSNorm/Dropout 用 `SequenceParallel()`
- **PP 调度**：`ScheduleGPipe`（填充-排空）/ `Schedule1F1B` / `ScheduleInterleaved1F1B` / `ScheduleInterleavedZeroBubble` / `ScheduleDualPipeV`；要求静态形状
- **2.13 新件**：torchcomms 后端（容错/可调试）；FSDP2 `set_separate_reduce_scatter_group()` 让 RS 与 AG 经独立进程组重叠（opt-in）

## DDP 深入：梯度桶化与同步点

DDP 的性能来自**通信与计算重叠**：反向传播按参数注册的逆序触发 hook，梯度凑满一桶（默认 `bucket_cap_mb=25MB`）就异步发起 all-reduce，反向结束时大部分梯度已同步完毕。

```python
model = DDP(
    model,
    device_ids=[local_rank],
    bucket_cap_mb=25,                 # 桶越大通信次数越少、重叠粒度越粗
    gradient_as_bucket_view=True,     # grad 直接视图到桶，省一次拷贝
    static_graph=False,               # 图固定时设 True 可再省开销
)
```

**三个同步点铁律**：DDP 构造器（广播初始参数）、forward、backward 都是集合通信点。所有 rank 必须以相同顺序、相同次数到达——所以：

- 各 rank 的 forward/backward 次数必须一致（梯度累积时每个 micro-batch 都要过 DDP）
- 分支控制流若按 rank 走不同路径且路径里含 DDP 前向，必然挂死
- 各 rank 负载不均时，快进程会在同步点空等直到 `timeout`（`init_process_group(timeout=timedelta(minutes=30))`）

**find_unused_parameters**：默认 DDP 假设所有参数每步都参与反向。条件控制流（如 MoE、多模态）导致部分参数无梯度时会报 `Expected to have finished reduction...`；传 `find_unused_parameters=True` 可解，但每步多一次遍历开销——优先考虑 `static_graph=True` 或重构代码让所有参数都过图。

### 梯度累积与 no_sync

```python
# DDP：中间 micro-batch 不通信，最后一步才 all-reduce
for i, (x, y) in enumerate(loader):
    with model.no_sync() if (i + 1) % accum != 0 else nullcontext():
        loss = model(x, y) / accum
        loss.backward()
    if (i + 1) % accum == 0:
        optimizer.step(); optimizer.zero_grad()

# FSDP2 等价物：set_requires_gradient_sync(False / True)
```

## FSDP2 深入：分片、重叠与通信组

### 分片模型与内存账

`fully_shard` 把每个参数在 dim-0 上 `torch.chunk` 成 `world_size` 份，参数/梯度/优化器状态各占 `1/N`：

| 状态 | DDP 每卡 | FSDP2 每卡 |
| --- | --- | --- |
| 参数 | 全量 | 1/N（前向时临时 all-gather 出全量） |
| 梯度 | 全量 | 1/N（reduce-scatter 后即分片） |
| 优化器状态 | 全量 | 1/N（建在 DTensor 参数上） |

AdamW 下模型占显存约为 DDP 的 `(4 + 12/N) / 16`（fp32 参数+梯度+两阶动量口径），N 越大越接近 4×参数量的通信下界。

### 通信组边界 = 模块边界

FSDP2 **没有 bucket_cap_mb**：每次 `fully_shard(module)` 调用创建一个通信组，组内参数一次 all-gather / reduce-scatter。这就是必须 **bottom-up** 应用的原因：

```python
for block in model.transformer_blocks:   # 每块一个组：重叠粒度
    fully_shard(block)
fully_shard(model)                        # 根组只收剩余参数（embedding/head）
```

- 只包根模块 = 全模型一个组：前向开头一次巨型 all-gather、反向结束一次巨型 reduce-scatter，**零重叠**，几乎永远是错法
- 组越细重叠越好，但集合通信次数变多——按「每层一个组」是甜点
- 前向：下一组 all-gather 在独立 stream 上与当前层计算重叠；CPU 跑不快时用 `set_modules_to_forward_prefetch([next_mod])` 提前发射
- 反向：自动预取下一组 all-gather，reduce-scatter 走独立 stream，零配置
- **2.13**：`set_separate_reduce_scatter_group(True)` 给 reduce-scatter 独立进程组，与 all-gather 在网线上真并发（此前同一 NCCL communicator 会串行化）；opt-in 实验特性

### 混合精度与卸载

```python
from torch.distributed.fsdp import fully_shard, MixedPrecisionPolicy, CPUOffloadPolicy

mp = MixedPrecisionPolicy(param_dtype=torch.bfloat16,   # 计算/all-gather 用 bf16
                          reduce_dtype=torch.float32)   # 梯度规约保 fp32 精度
fully_shard(layer, mp_policy=mp,
            offload_policy=CPUOffloadPolicy(pin_memory=True))  # 连 CPU 内存也省
```

模块级 MP 与 autocast 的区别：低精度激活会为反向保留，cast 只发生在模块边界；FSDP 本就保留高精度分片参数，优化器无需额外副本。

### FSDP2 契约与自救

- **优化器必须建在 `fully_shard` 之后的参数上**（此时已是 DTensor）
- 永远 `model(x)`；自定义前向方法用 `register_fsdp_forward_method(model, "generate")` 注册
- `reshard_after_forward`：非根默认 `True`（前向后释放、反向重新 all-gather），根默认 `False`（反向开始立即要用）；传 `int`（如节点内卡数）可用更小组重分片折中
- forward/backward 抛异常后内部状态未定义：捕获后对**根模块**调 `FSDPModule.reset_iter_state()` 再跑下一迭代（失败迭代的梯度全部作废）
- 冻参、条件未用参数：`set_reduce_scatter_unused_params(True)`（类似 DDP 的 find_unused）
- 状态字典：FSDP2 不直接给 full state_dict——`dtensor.full_tensor()` 自转换，或用 Distributed Checkpoint 的 distributed state_dict API（分片免通信）

## DeviceMesh 与 DTensor：N 维并行的语言

```python
from torch.distributed.device_mesh import init_device_mesh

# 2 节点 × 4 卡：(dp, tp) 二维网格；2.11 起需先 init_process_group 再建 mesh
mesh = init_device_mesh("cuda", (2, 4), mesh_dim_names=("dp", "tp"))
tp_mesh = mesh["tp"]        # 切 1D 子网格喂给 TP
dp_mesh = mesh["dp"]        # 喂给 FSDP2/DDP
```

DTensor 三种 placement 与 `redistribute` 触发的通信：

| 转换 | 集合通信 |
| --- | --- |
| `Shard(dim)` → `Replicate()` | all_gather |
| `Shard(a)` → `Shard(b)` | all_to_all |
| `Replicate()` → `Shard(dim)` | 本地 chunk（无通信） |
| `Partial()` → `Replicate()` | all_reduce |
| `Partial()` → `Shard(dim)` | reduce_scatter |

实战要点：

- 算子的所有张量参数必须都是 DTensor，混用普通 Tensor 直接报错；`from_local(t, mesh, [Replicate()])` 包装后参与
- `from_local` 反向的梯度布局映射：Shard→Shard、Replicate→Replicate、**Partial→Replicate**（2.11 起默认，避免歧义）
- `full_tensor()` 取完整张量可微；`to_local()` 取本地分片也可微
- 调试：`CommDebugMode` 上下文统计集合通信次数；`TORCH_LOGS=dtensor`；`visualize_sharding(dtensor)` 终端画分片
- 单机多进程模拟调试：`LocalTensor`（2.10 新增，单进程模拟多 rank，仅调试用）

## 张量并行（TP）：声明式 plan

`parallelize_module` 按模块 FQN 应用 `ParallelStyle`，把权重转成 DTensor 并重写前向：

```python
from torch.distributed.tensor.parallel import (
    parallelize_module, ColwiseParallel, RowwiseParallel, SequenceParallel)

parallelize_module(model, tp_mesh, {          # tp_mesh 必须是 1D（mesh["tp"]）
    "attention.wq": ColwiseParallel(),         # 输出按最后一维切
    "attention.wk": ColwiseParallel(),
    "attention.wv": ColwiseParallel(),
    "attention.wo": RowwiseParallel(),         # 输入按最后一维切，输出复制（内部 all-reduce）
    "mlp.w1": ColwiseParallel(),
    "mlp.w2": RowwiseParallel(),
    "norm": SequenceParallel(),                # LayerNorm/RMSNorm/Dropout 按序列维切
})

# 大词表交叉熵并行计算（logits 按类别维切分时）
from torch.distributed.tensor.parallel import loss_parallel
with loss_parallel():
    loss = F.cross_entropy(sharded_logits, target)
    loss.backward()                            # backward 也要在上下文内
```

- Colwise + Rowwise 成对出现是 Transformer MLP/Attention 的标准配方：中间激活保持分片，只在 Rowwise 出口一次 all-reduce
- `SequenceParallel` 假设 LayerNorm 类权重为 1 初始化；自定义初始化需广播保证副本一致
- API 仍标 **experimental**，跨版本升级先看 Release Notes

## 流水并行（PP）：切模型 + 选调度

`torch.distributed.pipelining`（**alpha**）= 切分前端 + 分布式运行时：

```python
from torch.distributed.pipelining import pipeline, SplitPoint, ScheduleGPipe

pipe = pipeline(module=model, mb_args=(x,),               # mb_args 是 micro-batch 形状样例
                split_spec={"layers.7": SplitPoint.BEGINNING})  # 在第 8 层前下刀

stage_mod = pipe.get_stage_module(stage_idx)              # 本 rank 的分段子模块
stage = pipe.build_stage(stage_idx, device, group)        # 建通信缓冲与 send/recv

schedule = ScheduleGPipe(stage, n_microbatches=8)
if rank == 0:
    schedule.step(x)          # 首段喂整个 batch，自动切 micro-batch
else:
    out = schedule.step()     # 其余段收上游激活
```

调度选型：**GPipe**（填充-排空，气泡大、实现最简）→ **1F1B**（稳态一进一出，激活显存大降）→ **Interleaved1F1B / LoopedBFS**（每 rank 多段，气泡更小的代价是更多通信）→ **InterleavedZeroBubble / ZBV / DualPipeV**（用权重反向填泡，逼近零气泡）。硬约束：形状必须静态（运行期形状变化抛 `PipeliningShapeError`）；与 FSDP2 组合时每段作为独立 FSDP 根并用 `share_comm_ctx` 共享 stream。

## 组合策略与选型建议

| 场景 | 推荐组合 |
| --- | --- |
| 模型装得下单卡，纯提速 | DDP（单机）/ FSDP2 `reshard_after_forward=False`（多机更省通信） |
| 模型装不下单卡 | FSDP2（bottom-up 每层）+ 激活检查点 |
| 超大稠密 LLM | TP（节点内 8 卡，吃 NVLink）× FSDP2（跨节点）= 2D；HSDP 变体跨节点复制 |
| 跨节点带宽受限 | 加 PP 第三维（流水段跨慢链路），参考 TorchTitan 3D 并行 |
| 长序列 | 叠 CP：`torch.distributed.tensor.experimental.context_parallel`（prototype） |

通用最佳实践：节点内放通信最密的维度（TP），跨节点放 DP/PP；网格命名维度显式化（`mesh_dim_names`）；所有 rank 先 `init_process_group` 再建 mesh；上线前用 `CommDebugMode` 核对通信次数符合预期。

## 排障工具箱

```bash
TORCH_NCCL_ASYNC_ERROR_HANDLING=1   # NCCL 错误异步上报（默认开）
TORCH_NCCL_TRACE_BUFFER_SIZE=1000   # 记录最近集合通信用于 flight recorder
TORCH_LOGS=dtensor,pp               # DTensor/流水并行日志
TORCH_DISTRIBUTED_DEBUG=DETAIL      # DDP 同步不匹配时给出具体参数名
```

- 挂死第一嫌疑：各 rank 集合通信序列不一致（分支/累积步数不同）；第二嫌疑：节点间网络（先跑 `nccl-tests` 验证）
- `torchrun --max-restarts=3` 只负责重启进程组，**状态恢复靠你自己定期 checkpoint**；`RANK` 重启后不稳定，禁止硬编码 rank 假设
