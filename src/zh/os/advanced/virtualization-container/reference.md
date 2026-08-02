---
layout: doc
outline: [2, 3]
---

# 参考：虚拟化与容器 API、对比速查

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **虚拟化两条线**：VM（自带内核，Hypervisor 管控，强隔离）/ 容器（共享宿主内核，namespace+cgroups，轻量）。
- **Hypervisor 两类**：Type 1 裸机（ESXi/Hyper-V/KVM/Xen，跑在硬件上）/ Type 2 托管（VirtualBox/VMware Workstation，跑在宿主 OS 上）。
- **硬件辅助**：Intel VT-x / AMD-V，root/non-root 模式 + VMCS + VMLAUNCH/VMRESUME/VMEXIT；EPT/NPT 硬件二级页表加速内存虚拟化。
- **全虚拟化 vs 半虚拟化**：全（不改 Guest，靠 VT-x 或二进制翻译，兼容性好）/ 半（改 Guest 内核用 hypercall，性能好但需改源码，Xen PV）。
- **容器 = namespace + cgroups + UnionFS + 一个进程**，没有自己的内核。
- **namespace 六种**：PID / NET / MNT / UTS / IPC / USER（容器内 root → 宿主非特权）。
- **cgroups 子系统**：cpu / cpuset / cpuacct / memory / blkio / devices / pids。
- **Docker**：镜像（分层只读快照）+ 容器（镜像 + 可写层 + 进程）。
- **容器 vs VM 分水岭**：是否共享内核。VM 强隔离重，容器轻量弱隔离。

## 一、虚拟机 vs 容器：完整对比

| 维度 | 虚拟机（VM） | 容器（Container） |
| --- | --- | --- |
| **内核** | 各自带 Guest OS 内核 | 共享宿主内核 |
| **隔离机制** | Hypervisor + 硬件（VT-x） | namespace + cgroups |
| **隔离强度** | 硬件级强隔离 | 进程级软隔离 |
| **启动时间** | 分钟级（引导 Guest 内核） | 秒/毫秒级（起进程） |
| **资源开销** | GB 级（含完整 OS） | MB 级（只含应用） |
| **磁盘镜像** | 几 GB-几十 GB | 几十 MB-几百 MB |
| **密度** | 一台机器十几个 | 一台机器几百个 |
| **安全边界** | 内核漏洞不跨 VM | 内核漏洞可逃逸 |
| **跨内核版本** | 每 VM 可不同内核 | 必须等于宿主内核 |
| **跨架构** | 可模拟（x86 跑 ARM） | 只能同架构同内核 |
| **典型代表** | KVM、ESXi、Hyper-V | Docker、containerd、Podman |
| **编排** | OpenStack、vSphere | Kubernetes、Docker Swarm |

## 二、Hypervisor 分类对比

| | Type 1（裸机） | Type 2（托管） |
| --- | --- | --- |
| **位置** | 直接跑在硬件上 | 跑在宿主 OS 之上 |
| **是否有宿主 OS** | 无（Hypervisor 即最底层） | 有（宿主 OS 管硬件） |
| **代表** | VMware ESXi、Hyper-V、KVM、Xen | VirtualBox、VMware Workstation/Fusion、Parallels |
| **性能** | 高（少一层） | 较低（多一层） |
| **场景** | 数据中心、云、生产 | 桌面、开发测试、教学 |

- **KVM**：Linux 内核模块，加载后 Linux 内核本身成为 Type 1 Hypervisor，常配 QEMU 做设备模拟（QEMU/KVM）。
- **Hyper-V**：启用后 Windows 成为 root partition，底层是 Type 1 Hypervisor。

## 三、全虚拟化 vs 半虚拟化

| | 全虚拟化（Full） | 半虚拟化（Para） |
| --- | --- | --- |
| **Guest 是否改** | 不改 | 改 Guest 内核 |
| **敏感指令处理** | VT-x 陷出 / 二进制翻译 | 主动 hypercall |
| **性能** | VT-x 后近原生；翻译慢 | 更好（少陷出） |
| **兼容性** | 任意 OS 直接装 | 需改源码（仅开源 OS） |
| **设备** | 模拟真硬件（慢）/ Virtio | 专用驱动（Virtio） |
| **代表** | KVM、Hyper-V、VMware（VT-x） | Xen PV、Linux PV-on-HVM |

## 四、namespace 六种速查

| namespace | flag | 隔离对象 | 效果 |
| --- | --- | --- | --- |
| **PID** | `CLONE_NEWPID` | 进程号 | 容器内 PID 从 1 开始，看不到宿主进程 |
| **NET** | `CLONE_NEWNET` | 网络栈 | 独立网卡/IP/端口/路由/iptables |
| **MNT** | `CLONE_NEWNS` | 挂载点 | 独立文件系统挂载视图 |
| **UTS** | `CLONE_NEWUTS` | hostname/domain | 独立主机名 |
| **IPC** | `CLONE_NEWIPC` | System V/POSIX IPC | 独立消息队列/共享内存/信号量 |
| **USER** | `CLONE_NEWUSER` | UID/GID 映射 | 容器内 root → 宿主非特权 |

另有较新的 **Cgroup**（`CLONE_NEWCGROUP`，cgroup 视图）和 **Time** namespace。`unshare`/`clone` 带 flag 创建。

## 五、cgroups 子系统速查

| 子系统 | 限制资源 | 关键文件（v1 示例） | 超限行为 |
| --- | --- | --- | --- |
| **cpu** | CPU 时间份额/带宽 | `cpu.shares`/`cpu.cfs_quota_us` | 节流（throttle） |
| **cpuset** | 绑核/内存节点 | `cpuset.cpus`/`cpuset.mems` | — |
| **cpuacct** | CPU 用量统计 | `cpuacct.usage` | — |
| **memory** | 内存/交换上限 | `memory.limit_in_bytes` | OOM Kill |
| **blkio**（v2 → io） | 磁盘 IO 带宽/IOPS | `blkio.throttle.read_bps_device` | IO 节流 |
| **devices** | 设备访问白名单 | `devices.allow`/`devices.deny` | 拒绝访问 |
| **pids** | 进程数上限 | `pids.max` | fork 失败（EAGAIN） |

cgroups v2 统一层级，单一挂载点 `/sys/fs/cgroup/`；v1 每个子系统独立挂载。现代 Docker/K8s 默认 v2。

## 六、Docker 概念速查

| 概念 | 含义 |
| --- | --- |
| **镜像（image）** | 分层只读的文件系统快照（base + 每层改动），用 OverlayFS 叠加 |
| **容器（container）** | 镜像 + 可写层 + 运行进程，删除即丢可写层 |
| **层（layer）** | 镜像的一层，对应一条指令的改动，可被多镜像共享 |
| **volume** | 由 Docker 管理的持久卷，独立于容器生命周期 |
| **bind mount** | 把宿主目录直接挂进容器 |
| **registry** | 镜像仓库（Docker Hub / 私有 Harbor） |
| **Dockerfile** | 描述如何构建镜像的脚本（本叶不讲用法） |

## 七、易错点清单

- **"容器是轻量虚拟机"**：错。容器没有自己的内核，是宿主内核上的普通进程，靠 namespace+cgroups 隔离。VM 才是带内核的完整系统。
- **"VM 和容器都共享内核"**：错。VM 各自带 Guest 内核（强隔离）；容器共享宿主内核（轻量）。这是两者的核心分水岭。
- **"namespace 能限制资源"**：错。namespace 只管视图隔离（看到什么），限资源是 cgroups 的职责。容器两者都要。
- **"Type 2 Hypervisor 性能更好"**：错。Type 2 多一层宿主 OS，性能低于 Type 1。Type 2 的优势是易用（桌面/开发），不是性能。
- **"半虚拟化性能更差"**：错。恰恰相反，半虚拟化（改 Guest 用 hypercall）少陷出，性能优于全虚拟化（尤其二进制翻译时代）。代价是兼容性（要改 Guest 源码）。
- **"VT-x 是为了加速所有指令"**：错。VT-x 解决"敏感指令必须 trap"的问题（root/non-root 模式），普通指令 Guest 本来就能直接跑。它主要加速/规范化敏感指令的处理。
- **"容器内 root 就是宿主 root"**：错。USER namespace 把容器内 UID 0 映射到宿主非特权用户——容器内是 root，宿主上无特权。这正是容器安全的一环。
- **"容器比 VM 安全"**：错。容器共享内核，一个内核漏洞（Dirty COW/Dirty Pipe）可被容器逃逸利用。强隔离场景仍需 VM 或 Kata/gVisor。
- **"Docker 镜像每个容器复制一份"**：错。镜像分层只读共享，100 个容器用同一镜像，磁盘上镜像只存一份，每个容器只多一个薄可写层。
- **"K8s 的 Pod 就是容器"**：错。Pod 是一组共享网络/存储的容器（1 个或多个），是 K8s 最小调度单位，不是单个容器。

## 八、进阶方向（链接其他叶）

- [操作系统概述](../../overview/) —— OS 的资源管理与隔离基础
- [内核架构详解](../../overview/guide-line/kernel-architecture) —— 单体内核如何支撑容器（namespace/cgroups 是内核机制）
- [进程与线程基础](../../process-thread-basics/) —— 容器本质是进程，理解进程才能理解容器

## 权威链接

- [Hardware virtualization - Wikipedia](https://en.wikipedia.org/wiki/Hardware_virtualization)
- [Hypervisor - Wikipedia](https://en.wikipedia.org/wiki/Hypervisor)
- [OS-level virtualization - Wikipedia](https://en.wikipedia.org/wiki/OS-level_virtualization)
- [Linux namespaces - Wikipedia](https://en.wikipedia.org/wiki/Linux_namespaces)
- [Cgroups - Wikipedia](https://en.wikipedia.org/wiki/Cgroups)
- [Docker (software) - Wikipedia](https://en.wikipedia.org/wiki/Docker_(software))
- [Kubernetes - Wikipedia](https://en.wikipedia.org/wiki/Kubernetes)
- 本站幻灯片：<a href="/SlideStack/virtualization-container-slide/" target="_blank">虚拟化与容器基础</a>
