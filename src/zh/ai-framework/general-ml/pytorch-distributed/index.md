---
layout: doc
---

# PyTorch 分布式训练

PyTorch 分布式训练是围绕 `torch.distributed` 构建的官方多机多卡训练栈，核心由三层构成：**通信层**（进程组 ProcessGroup + 集合通信原语 all_reduce / all_gather / reduce_scatter / broadcast，GPU 走 NCCL、CPU 走 Gloo）、**数据并行层**（**DDP** 每卡一进程复制模型、反向时桶化梯度 all-reduce 并与反向计算重叠；**FSDP / FSDP2 `fully_shard`** 进一步把参数、梯度、优化器状态按 dim-0 分片，前向时 all-gather、反向时 reduce-scatter，用通信换显存）、**张量并行层**（**DeviceMesh** 用 N 维数组描述设备拓扑，**DTensor** 以 `Shard/Replicate/Partial` 三种 placement 描述分片布局并自动插入通信，向上支撑 **TP 张量并行**（`parallelize_module` + Colwise/Rowwise/SequenceParallel）与 **PP 流水并行**（`torch.distributed.pipelining`，GPipe/1F1B/Interleaved/ZeroBubble 调度））。启动侧统一用 **torchrun**（弹性启动器，注入 RANK/LOCAL_RANK/WORLD_SIZE 环境变量，支持故障重启与弹性伸缩）。它的生态位是「大模型训练的事实底座」——TorchTitan、Megatron-LM、DeepSpeed 均构建其上，FSDP2 + TP + PP 组合的 N 维并行是万卡集群的标准打法。截至 2026 年 7 月，PyTorch 稳定版为 **2.13.0**：新增 **torchcomms** 通信后端（容错、可扩展、可调试，目标大集群）、**FSDP2 通信重叠**（reduce-scatter 与 all-gather 经独立进程组重叠，opt-in）；2.12 起 torchrun 单机默认 OS 分配空闲端口；2.11 起 DeviceMesh 内置进程组注册表。信源 docs.pytorch.org 官方 distributed 文档 + GitHub Releases。

## 评价

**优点**

- **官方一体化全栈**：从 collectives、DDP、FSDP2 到 DeviceMesh/DTensor/TP/PP 全部官方维护，版本与核心框架同步发布，无第三方依赖漂移
- **DDP 极简高效**：包裹一层 `DistributedDataParallel(model)` 即可，梯度桶化 all-reduce 与反向计算自动重叠，一进程一卡线性扩展到单机
- **FSDP2 显存革命**：参数+梯度+优化器状态全分片，单卡可训远超显存的模型；基于 DTensor 的 per-parameter 分片比 FSDP1 扁平参数更易推理、冻参更自由
- **DeviceMesh/DTensor 统一抽象**：一套「网格 + placement」语言描述 DP/TP/PP/CP 任意组合，N 维并行不再需要手写通信
- **组合式并行**：TP（`parallelize_module` 声明式 plan）× FSDP2 × PP（声明式 split_spec + 调度器）可在同一模型上叠加，TorchTitan 已给出 3D 并行范本
- **弹性与容错**：torchrun 内建 rendezvous（c10d）、`--max-restarts` 故障重启、弹性 `--nnodes=min:max`；2.13 torchcomms 再补集群级容错与可观测性

**缺点**

- **概念阶梯陡**：进程组、网格、placement、分片语义层层叠加，DTensor/TP/PP 仍标 alpha/experimental，文档与 API 变动频繁
- **调试成本高**：挂死常表现为 NCCL 超时而非明确报错，需配合 `TORCH_NCCL_*` / `TORCH_LOGS` / `CommDebugMode` 等工具链排查
- **DDP 不省显存**：纯 DDP 每卡完整复制模型与优化器状态，大模型必须升级 FSDP2 或叠加 TP/PP
- **FSDP2 契约约束多**：必须 bottom-up 应用、优化器必须建在 DTensor 参数上、不能直接 `model.forward()`、full state_dict 需经 DTensor API 转换
- **形状/拓扑静态假设多**：PP 要求静态输入形状，TP 的 `parallelize_module` 只收 1D mesh，多维组合需手工切 mesh
- **Windows 支持残缺**：`torch.distributed` 在 Windows 仅支持 Gloo 后端，NCCL/高级并行特性 Linux 优先

## 文档地址

- [torch.distributed 官方文档](https://docs.pytorch.org/docs/2.13/distributed.html)
- [DDP 官方教程](https://docs.pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [torchrun（elastic agent）文档](https://docs.pytorch.org/docs/stable/elastic/run.html)
- [FSDP2（fully_shard）文档](https://docs.pytorch.org/docs/2.13/distributed.fsdp.fully_shard.html)
- [DTensor 文档](https://docs.pytorch.org/docs/2.13/distributed.tensor.html)
- [Tensor Parallel 文档](https://docs.pytorch.org/docs/2.13/distributed.tensor.parallel.html)
- [Pipeline Parallelism 文档](https://docs.pytorch.org/docs/2.13/distributed.pipelining.html)
- [PyTorch 2.13.0 Release Notes](https://github.com/pytorch/pytorch/releases)

## GitHub地址

[pytorch/pytorch](https://github.com/pytorch/pytorch) · [meta-pytorch/torchcomms](https://github.com/meta-pytorch/torchcomms)

## 幻灯片地址

<a href="/SlideStack/pytorch-distributed-slide/" target="_blank">PyTorch 分布式训练</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PENDING" target="_blank" rel="noopener noreferrer">PyTorch 分布式训练测试题</a>
