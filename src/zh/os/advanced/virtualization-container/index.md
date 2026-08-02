---
layout: doc
---

# 虚拟化与容器基础

虚拟化与容器化是现代云计算与云原生应用的两大基石。**虚拟机（VM）** 通过 Hypervisor 在一台物理机上运行多个**各自带内核**的完整系统，实现硬件级隔离；**容器** 则借助 Linux 内核的 **namespace**（视图隔离）与 **cgroups**（资源限制），在同一**宿主内核**上跑出多个相互隔离的用户态进程，做到"秒级启动、兆字节开销"。两者不是替代关系而是互补——容器跑在 VM 里（VM 提供强隔离边界，容器提供高密度部署）是云厂商的标配组合（AWS ECS/Fargate、GCP GKE Autopilot 都这么干）。

虚拟化与容器的全部考点围绕**两条技术线**展开：①**虚拟机线**——Hypervisor（VMM）的角色、Type 1（裸机，ESXi/Hyper-V）vs Type 2（托管，VirtualBox/VMware Workstation）、硬件辅助虚拟化（Intel VT-x / AMD-V 的 root/non-root 模式）、全虚拟化 vs 半虚拟化（Para-Virtualization，改 Guest 内核主动 hypercall）；②**容器线**——容器本质是"共享宿主内核的隔离进程"、namespace 六种（PID/网络/挂载/UTS/IPC/用户）、cgroups 子系统（CPU/内存/IO）、Docker 的镜像（分层只读）与容器（运行实例）模型、容器 vs VM 对比（是否共享内核是分水岭）、K8s 编排引入（Pod/Service/调度）。本叶只讲**原理与机制**，Dockerfile 与 K8s API 的工程用法见专门章节。

## 评价

**优点**

- **资源利用率高**：一台物理机切分成多个 VM 或上百个容器，CPU/内存利用率从 10-20% 提升到 60-80%，是云计算的成本基础
- **隔离与安全**：VM 提供硬件级强隔离（独立内核），容器提供进程级软隔离（namespace）——故障与攻击被限制在单租户内
- **容器极致轻量**：共享内核 + 分层镜像，秒级启动、MB 级开销，一台机器跑几百个容器是常态，是微服务与 Serverless 的载体
- **环境一致性**：镜像把"代码 + 依赖 + 配置"打包，消除"在我机器上能跑"的部署难题，是 CI/CD 的关键拼图
- **弹性与编排**：K8s 等编排系统基于容器实现自动扩缩容、滚动更新、自愈，支撑大规模生产系统

**缺点**

- **性能开销**：VM 有 Hypervisor 陷出入开销；容器虽共享内核但仍多一层 namespace/cgroups 查找，且 IO/网络（叠加在 veth/iptables 上）有损耗
- **安全边界**：容器共享内核，一个内核漏洞（如 Dirty COW）可被容器逃逸（container escape），多租户高安全场景仍需 VM 或 Kata/gVisor 加固
- **隔离不彻底**：容器共享内核版本，宿主内核升级影响所有容器；某些资源（如内核模块、部分 sysctl）无法 namespace 化
- **复杂度陡增**：镜像分层、网络 overlay、存储卷、K8s 的 Pod/Service/Ingress 概念叠在一起，学习与运维成本高

## 本叶地图

- [入门](./getting-started) —— 虚拟化动机、虚拟机 vs 容器核心差异（是否各自带内核）、两类虚拟化（全/半）速览
- [虚拟机与 Hypervisor](./guide-line/virtual-machines) —— Hypervisor 角色、Type 1/Type 2、VT-x/AMD-V 硬件辅助、全虚拟化 vs 半虚拟化、VM 资源开销
- [容器：namespace 与 cgroups](./guide-line/containers) —— 容器本质、namespace 六种、cgroups 资源限制、Docker 镜像与容器、容器 vs VM 对比、K8s 编排引入
- [参考](./reference) —— VM vs 容器大表、namespace 六种表、cgroups 子系统、Docker 概念、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/virtualization-container-slide/" target="_blank">虚拟化与容器基础</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E8%99%9A%E6%8B%9F%E5%8C%96%E4%B8%8E%E5%AE%B9%E5%99%A8%E5%9F%BA%E7%A1%80" target="_blank" rel="noopener noreferrer">虚拟化与容器基础测试题</a>
