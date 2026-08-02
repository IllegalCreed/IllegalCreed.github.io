---
layout: doc
outline: [2, 3]
---

# 容器：namespace 与 cgroups

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **容器本质**：一个被 **namespace + cgroups** 包装的**普通 Linux 进程**。它不是轻量 VM——没有自己的内核，直接跑在宿主内核上。这就是秒级启动、MB 级开销的根因。
- **两条内核机制**：**namespace** 提供**视图隔离**（让进程看到独立的系统视图：自己的 PID 1、自己的网卡、自己的文件系统）；**cgroups** 提供**资源限制**（限制进程能用的 CPU/内存/IO 上限）。两者合起来 = 容器。
- **namespace 六种**：**PID**（进程号）、**网络 NET**（网卡/端口/路由表）、**挂载 MNT**（文件系统挂载点视图）、**UTS**（hostname/domainname）、**IPC**（消息队列/共享内存/信号量）、**用户 USER**（UID/GID 映射，容器内 root 映射到宿主非特权用户）。另有较新的 **Cgroup**、**Time** namespace。
- **PID namespace**：容器内第一个进程是 PID 1，看不到宿主其他进程——所以 `ps aux` 只列容器内的进程。PID 隔离是"进程视图"隔离的核心。
- **网络 namespace**：每个容器有独立的 `lo`、`eth0`（接到 veth pair）、独立 IP/端口空间——所以两个容器都能监听 80 端口互不冲突。
- **用户 namespace**：容器内 UID 0（root）映射到宿主 UID 65534（nobody）等——容器内是 root（能装软件），宿主上是普通用户（逃逸也无权）。
- **cgroups（Control Groups）**：按进程组限制/计量/隔离资源。子系统：**cpu**（CPU 时间片）/ **cpuset**（绑核）/ **cpuacct**（CPU 用量统计）/ **memory**（内存上限，超限 OOM）/ **blkio**（磁盘 IO 带宽/IOPS）/ **devices**（设备访问白名单）/ **pids**（进程数上限）。
- **为什么需要 cgroups**：没有它，一个容器（一个失控的进程）能吃光整机 CPU/内存，饿死其他容器——cgroups 是"资源配额"的执行者。
- **Docker 镜像（image）**：**分层只读**的文件系统快照。base 层（如 debian）+ 每条指令（装包/拷文件）生成一层，叠加成统一视图。分层让多个镜像共享公共层，省存储省传输。
- **Docker 容器（container）**：**镜像 + 一层可写层（container layer）+ 一个运行进程**。可写层用 OverlayFS/UnionFS 实现——改动写到顶层，底层镜像只读不变。容器删了，可写层消失（这就是"容器是临时的"）。
- **容器 vs VM 对比**：见下文大表。核心是**是否共享内核**——VM 各带内核（强隔离、GB 级、分钟启动）；容器共享内核（弱隔离、MB 级、秒启动）。
- **K8s 编排引入**：单机 Docker 不够，K8s 在集群上用 **Pod**（共网络/存储的 1+ 容器组）、**Service**（稳定虚拟 IP + DNS + 负载均衡）、**Deployment**（声明期望副本数，自动调谐）、**调度器**（按资源/亲和/污点把 Pod 分配到节点）实现大规模编排。
- **进阶**：本叶只讲容器原理；Dockerfile 与 K8s API 工程用法见专门章节。

## 一、容器是什么：共享内核的隔离进程

要理解容器，先破除一个误解：**容器不是轻量虚拟机**。虚拟机各自带内核，容器没有自己的内核——它是宿主内核上的**普通进程**，只是这个进程被"关"在了一个隔离的视图里，并被限制了资源。

```
  【容器架构】
  ┌──────┐ ┌──────┐ ┌──────┐
  │容器 A│ │容器 B│ │容器 C│   ← 每个 = 1 个被隔离的进程
  └──┬───┘ └──┬───┘ └──┬───┘
     │namespace + cgroups（包装）
  ┌──┴────────┴─────────┴──┐
  │      宿主内核 (共享)     │  ← 只有一个内核
  └────────────┬────────────┘
            物理硬件
```

容器 = **namespace（视图隔离）** + **cgroups（资源限制）** + **UnionFS（分层镜像）** + **一个进程**。前两者是 Linux 内核原生机制，Docker/容器运行时只是把它们组合起来用。

## 二、namespace：六种视图隔离

**namespace** 让一个进程看到一个"独立的系统视图"——以为自己独占 PID 空间、网络栈、文件系统等。Linux 提供（截至较新内核）八种 namespace，容器常用前六种：

| namespace | 隔离对象 | 效果 |
| --- | --- | --- |
| **PID** | 进程号 | 容器内进程从 PID 1 开始，看不到宿主其他进程 |
| **NET** | 网络栈 | 独立的网卡、IP、端口、路由表、iptables |
| **MNT** | 挂载点 | 独立的文件系统挂载视图（看不到宿主 `/`） |
| **UTS** | hostname / domainname | 独立的主机名（容器内 `hostname` 与宿主不同） |
| **IPC** | System V IPC / POSIX 消息队列 | 独立的共享内存/信号量/消息队列 |
| **USER** | UID / GID 映射 | 容器内 root(0) 映射到宿主非特权用户 |
| Cgroup | cgroup 视图 | （较新）隔离 cgroup 层级视图 |
| Time | 系统时钟偏移 | （较新）隔离 monotonic/boot 时间偏移 |

- **PID namespace** 是"进程视图隔离"的核心：容器内第一个进程（如 `/bin/sh` 或你的应用）是 PID 1。它看不到宿主的 systemd、看不到其他容器的进程——`ps aux` 只列出自己。
- **NET namespace** 让"两个容器都监听 80 端口"成为可能：每个容器有独立的端口空间。容器间通信用 veth pair（虚拟网线）连接，或接到同一个 docker0 网桥。
- **USER namespace** 是安全关键：容器内是 root（能 `apt install`），但映射到宿主是普通用户——即使容器逃逸，攻击者在宿主上也没有 root 权限。
- **创建 namespace**：`unshare`/`clone` 系统调用带 `CLONE_NEWPID`/`CLONE_NEWNET` 等 flag。Docker/containerd 内部就是调这些 syscall 创建容器的 namespace。

## 三、cgroups：资源限制

namespace 只管"看到什么"，不管"能用多少"。一个容器（即一个进程）如果失控，没有 cgroups 的话能吃光整机 CPU/内存，拖垮其他容器。**cgroups（Control Groups）** 解决这个问题——按进程组限制/计量/隔离资源：

| 子系统 | 限制的资源 | 典型用法 |
| --- | --- | --- |
| **cpu** | CPU 时间片（份额/带宽） | `cpu.shares`/`cpu.cfs_quota_us` 限 CPU 比例 |
| **cpuset** | 绑定 CPU 核/内存节点 | 把容器钉在指定核上（实时/性能敏感） |
| **cpuacct** | CPU 用量统计 | 计费/监控 |
| **memory** | 内存/交换上限 | `memory.limit_in_bytes`，超限触发 OOM Kill |
| **blkio**（→ io） | 磁盘 IO 带宽/IOPS | 限读写速率，防一个容器刷爆磁盘 |
| **devices** | 设备访问白名单 | 禁止容器访问 `/dev/sda` 等宿主设备 |
| **pids** | 进程数上限 | 防 fork 炸弹（`pids.max`） |

- **memory cgroup 的 OOM**：容器内存超限，内核 OOM killer 会杀掉容器内最耗内存的进程（通常是 PID 1，即容器主进程）——这就是"容器被 OOM 杀掉"的机制。
- **cgroups v1 vs v2**：v1 每个子系统一棵树，结构复杂；v2（2016 起）统一层级，更简洁。现代 Docker/containerd/K8s 默认用 cgroups v2。
- **与 namespace 的分工**：namespace = 视图隔离（看什么），cgroups = 资源限制（用多少）。缺 namespace 不隔离（进程互相可见），缺 cgroups 不限资源（一个失控拖垮全员）。容器两者都要。

## 四、Docker：镜像与容器

Docker 把 namespace + cgroups + UnionFS 打包成易用的工具，核心是两个概念：

- **镜像（image）**：**分层只读**的文件系统快照。由一系列层（layer）叠加：
  ```
  ┌─────────────────────┐  ← 可写层（容器运行时生成，容器删了就没了）
  │  应用代码（COPY 进来）│  ← layer 3（只读）
  │  pip install 依赖    │  ← layer 2（只读）
  │  base: python:3.12   │  ← layer 1（只读，公共层）
  └─────────────────────┘
  ```
  分层的好处：多个镜像共享公共 base 层（省存储/传输）；改一层只重传那一层（CI/CD 快）。底层用 OverlayFS/AUFS 实现"叠加成统一目录视图"。
- **容器（container）**：**镜像 + 一层可写层 + 一个运行进程**。`docker run` 做的事：基于镜像用 namespace/cgroups 创建隔离环境 → 启动进程（PID 1）→ 进程的所有文件改动写到可写层（底层镜像不变）。
  - 容器**不是**镜像的副本——它共享镜像的只读层，只多一个可写层。所以 100 个基于同一镜像的容器，磁盘上镜像只存一份。
  - 容器**是临时的**：`docker rm` 删掉容器，可写层消失，改动丢失。持久数据要用 **volume**（挂载到宿主目录）或 **bind mount**。

## 五、容器 vs 虚拟机：对比

容器与 VM 的所有差异，根源都在**是否共享内核**：

| 维度 | 虚拟机（VM） | 容器（Container） |
| --- | --- | --- |
| **内核** | 各自带 Guest 内核 | 共享宿主内核 |
| **隔离机制** | Hypervisor + 硬件（VT-x） | namespace + cgroups（内核机制） |
| **隔离强度** | 硬件级强隔离 | 进程级软隔离 |
| **启动时间** | 分钟级（引导 Guest 内核） | 秒/毫秒级（起一个进程） |
| **资源开销** | GB 级（含完整 OS） | MB 级（只含应用 + 依赖） |
| **密度** | 一台机器十几个 VM | 一台机器几百个容器 |
| **安全边界** | 内核漏洞不跨 VM | 内核漏洞可被容器逃逸利用 |
| **内核版本** | 每 VM 可不同内核 | 必须等于宿主内核 |
| **跨平台** | 可在 x86 上跑 ARM VM（模拟） | 只能跑与宿主同架构同内核 |
| **典型代表** | KVM、ESXi、Hyper-V | Docker、containerd、Podman |

- **容器逃逸（Container Escape）**：因为共享内核，一旦宿主内核有漏洞（如 Dirty COW、脏管道 Dirty Pipe），恶意容器可能利用漏洞突破 namespace 拿到宿主 root。高安全多租户场景用 **Kata Containers**（每容器一个轻量 VM）或 **gVisor**（用户态内核拦截 syscall）加固。
- **为什么容器轻量**：没有 Guest 内核、没有引导过程、镜像分层共享、进程直接跑在宿主内核——这是"秒级启动 + MB 级镜像"的全部原因。

## 六、K8s：从单机到集群编排

单机用 Docker 跑几个容器没问题，但生产环境是**几百台机器 × 几千个容器**——手动管理不可能。**Kubernetes（K8s）** 解决集群级容器编排问题（本叶只讲概念，API 用法见专门章节）：

- **Pod**：K8s 的最小调度单位，是**一组共享网络和存储的容器**（不是单个容器）。一个 Pod 内的容器共享一个网络 namespace（互相 localhost 通信）、共享挂载的 volume。通常一个 Pod = 一个应用实例。
- **Service**：Pod 的 IP 会随重建变化，Service 提供一个**稳定的虚拟 IP + DNS 名 + 负载均衡**，让调用方不用关心 Pod 变化。这是微服务发现的基础。
- **Deployment**：声明"我想要 3 个副本"，K8s 自动维持——Pod 挂了自动重启、扩容自动新建、滚动更新逐个替换。这是"声明式"运维的核心。
- **调度器（Scheduler）**：根据 Pod 申请的资源（CPU/内存）、节点剩余资源、亲和性/反亲和性、污点（taint）等，决定把 Pod 放到哪个节点。
- **控制平面（Control Plane）**：API Server（唯一入口）+ etcd（状态存储）+ Scheduler + Controller Manager +（可选）云控制器。工作节点上跑 kubelet（与 API Server 通信）+ kube-proxy（网络规则）+ 容器运行时（containerd）。

K8s 的本质是：把"单机 Docker"扩展到"集群"，把"手动 `docker run`"升级为"声明期望状态、系统自动调谐"。

## 下一步

掌握了 VM 与容器的原理后，下一步可以回到[参考](../reference)看完整的对比速查与易错点，或进入操作系统的其他资源管理章节——容器调度与 [CPU 调度](../../cpu-scheduling/)、容器内存与 [虚拟内存](../../virtual-memory/) 的原理相通。
