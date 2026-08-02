---
layout: doc
outline: [2, 3]
---

# 虚拟机与 Hypervisor

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **Hypervisor（虚拟机监控器，VMM）**：管理多个 VM 的软件层，负责把物理 CPU/内存/设备**虚拟化**后分配给各 VM，并隔离它们的执行——它是 VM 的"内核的内核"。
- **Type 1（裸机，Bare-Metal）**：Hypervisor **直接跑在硬件上**，没有宿主 OS。代表 **VMware ESXi**、**Microsoft Hyper-V**、**KVM**（Linux 把 KVM 做成内核模块，本质是 Type 1）、**Xen**。性能高，用于数据中心/云。
- **Type 2（托管，Hosted）**：Hypervisor 作为**普通应用**跑在宿主 OS 之上。代表 **VirtualBox**、**VMware Workstation/Fusion**、**Parallels**。易用性好，用于桌面/开发测试。
- **硬件辅助虚拟化**：Intel **VT-x**（2005）/ AMD **AMD-V** 引入 **root 与 non-root 两种 CPU 执行模式** + 新指令（VMLAUNCH/VMRESUME/VMEXIT/VMREAD/VMWRITE），让 Guest 在 non-root 直接跑大部分指令，遇到敏感指令自动 VMEXIT 陷入 root 模式由 Hypervisor 处理。
- **敏感指令问题**：x86 有些特权指令（如 POPF、CLI）在低特权级下"静默失败"而非 trap，使纯软件虚拟化困难——VT-x 用 root/non-root 模式从根本上解决。
- **全虚拟化（Full Virtualization）**：**不改 Guest OS**，Guest 以为自己跑在真机上。靠硬件辅助（VT-x）或二进制翻译（VMware 早期）处理敏感指令。兼容性好（任意 OS 直接装），但二进制翻译有性能损耗。
- **半虚拟化（Para-Virtualization）**：**修改 Guest 内核**，把敏感操作改成主动调用 **hypercall**（类似 syscall 但陷入 Hypervisor）。性能更好（无翻译/少陷出），但需改 Guest 源码（Xen/Linux 早期 PV 模式）。
- **CPU 虚拟化**：时间片分时复用（vCPU 在各 VM 间切换）+ VT-x root/non-root 模式 + 上下文切换（VMCS 保存/恢复寄存器状态）。
- **内存虚拟化**：三层页表 → **影子页表（Shadow Page Table）**（软件维护 Guest 虚→宿主物理映射）或 **EPT/NPT**（硬件二级页表，Guest 虚→Guest 物→宿主物理，硬件自动走）。
- **设备虚拟化**：完全模拟（QEMU 全设备，慢）/ 半虚拟化（**Virtio**，Guest 知道自己是虚拟机，用专用驱动高效通信）/ 直通（SR-IOV/PCIe passthrough，设备直接给 VM，性能近原生）。
- **VM 资源开销**：每个 VM 要装完整 Guest OS（内核 + init + 用户态），占用 GB 级磁盘 + 数百 MB-数 GB 内存，启动要引导内核（分钟级）——这是 VM 不如容器轻量的根因。
- **进阶**：本节只讲 VM 原理；下一节 [容器](../containers) 讲共享内核的轻量方案。

## 一、Hypervisor：VM 的管理者

**Hypervisor**（又称 Virtual Machine Monitor，VMM）是虚拟化的核心。它运行在最高特权级，负责：

1. **CPU 虚拟化**：把物理 CPU 切成多个**虚拟 CPU（vCPU）**，分时复用——每个 VM 以为自己独占 CPU。
2. **内存虚拟化**：给每个 VM 一段连续的"物理内存"假象（实为宿主内存的映射片段），且各 VM 内存互不可见。
3. **设备虚拟化**：给每个 VM 提供虚拟网卡/磁盘/显卡（模拟或半虚拟化），让 Guest OS 的驱动能工作。
4. **隔离与调度**：决定哪个 vCPU 何时运行、拦截 Guest 的敏感操作、处理中断投递。

Hypervisor 之于 VM，就像内核之于进程——它是 VM 的"资源管家"。

## 二、Type 1 vs Type 2：Hypervisor 在哪一层

按 Hypervisor 是否依赖宿主 OS，分两类：

```
  【Type 1 裸机】               【Type 2 托管】
  ┌────┐ ┌────┐                ┌────┐ ┌────┐
  │VM A│ │VM B│                │VM A│ │VM B│
  └─┬──┘ └─┬──┘                └─┬──┘ └─┬──┘
  ┌─┴──────┴─┐                ┌──┴──────┴──┐
  │ Hypervisor│  ← 直接在硬件  │ Hypervisor  │  ← 普通应用
  └────┬─────┘                └──────┬──────┘
       │                      ┌──────┴──────┐
   物理硬件                   │  宿主 OS     │
                             └──────┬──────┘
                                    │
                                物理硬件
```

| | Type 1（裸机） | Type 2（托管） |
| --- | --- | --- |
| **位置** | 直接在硬件上 | 跑在宿主 OS 之上 |
| **代表** | ESXi、Hyper-V、KVM、Xen | VirtualBox、VMware Workstation、Parallels |
| **性能** | 高（少一层） | 较低（多一层宿主 OS） |
| **场景** | 数据中心、云、生产 | 桌面、开发测试、教学 |

- **KVM 的特殊性**：KVM 是 Linux 内核的一个**模块**（`/dev/kvm`），加载后 Linux 内核**本身**就变成 Type 1 Hypervisor（内核即 Hypervisor），常配 QEMU 做设备模拟（QEMU/KVM 组合）。所以"Linux 是否 Type 1"——是的，加载 KVM 后是。
- **Hyper-V 的特殊性**：Windows 启用 Hyper-V 后，原本的 Windows 实际上变成了"root partition"，真正的 Hypervisor 在更底层——所以本质是 Type 1。

## 三、硬件辅助虚拟化：VT-x 与 AMD-V

早期的纯软件虚拟化（二进制翻译）很慢，且 x86 有些**敏感指令**在低特权级会"静默失败"而非触发异常，使得"陷阱再模拟"的虚拟化方法失效（Popek-Goldberg 虚拟化要求：敏感指令必须 trap）。Intel/AMD 的解法是引入新的 CPU 模式：

- **两种模式**：**root 模式**（Hypervisor 运行，全权限）与 **non-root 模式**（Guest 运行，受限）。两者都有 Ring 0-3。
- **关键指令**：`VMLAUNCH`/`VMRESUME` 让 Guest 进入 non-root 执行；`VMEXIT` 让 Guest 因敏感事件（执行敏感指令、中断、异常、IO）自动切回 root 模式，控制权交 Hypervisor。
- **VMCS（Virtual Machine Control Structure）**：每个 vCPU 一个 VMCS，保存 root/non-root 切换时的寄存器状态与控制字段——类似进程的 TSS，但专为虚拟化设计。

```
  Hypervisor (root 模式)
      │  VMLAUNCH / VMRESUME
      ▼
  Guest (non-root 模式) 直接跑大部分指令
      │  遇到敏感指令/中断/IO
      ▼  VMEXIT（自动陷回 root）
  Hypervisor 处理（模拟设备、切换、投递中断）
      │  处理完
      └──→ VMRESUME 回到 Guest
```

- **启用**：BIOS 里要开 VT-x/AMD-V（默认常开）。不开则 KVM/Hyper-V 无法用，VirtualBox 退化为慢的软件模拟。
- **EPT/NPT（扩展页表）**：硬件辅助的内存虚拟化二级页表，Guest 虚→Guest 物理→宿主物理由硬件 MMU 自动走，比软件影子页表快得多——是现代 VM 性能可用的关键。

## 四、全虚拟化 vs 半虚拟化

按是否需要修改 Guest 内核，分两类：

| | 全虚拟化（Full） | 半虚拟化（Para） |
| --- | --- | --- |
| **Guest 是否改** | 不改，Guest 以为在真机 | 改 Guest 内核 |
| **敏感操作处理** | VT-x 陷出 / 二进制翻译 | 主动 **hypercall** |
| **性能** | VT-x 后接近原生；二进制翻译慢 | 更好（少陷出） |
| **兼容性** | 任意 OS 直接装 | 需改源码或专门内核 |
| **代表** | VMware（VT-x）、KVM、Hyper-V | Xen PV、早期 Linux PV-on-HVM |

- **全虚拟化**：Guest OS 完全不知道自己被虚拟化，正常发特权指令 → 被 VT-x 截获（VMEXIT）→ Hypervisor 模拟。好处是任意 OS（Windows/Linux/BSD）都能直接装；坏处是早期靠二进制翻译（VMware）慢。VT-x 普及后全虚拟化性能已足够好，半虚拟化在 CPU 层面优势减小。
- **半虚拟化**：Guest 内核被改写，知道自己在虚拟机里，遇到要做的特权操作时主动发 `hypercall`（类似 syscall，但陷入 Hypervisor）。少了"执行→陷出→模拟"的往返，性能更好。代价是必须改 Guest 内核——只有开源 OS（Linux/BSD）能改，Windows 不能 PV。代表是 Xen 的 PV 模式。
- **设备层面的半虚拟化**：即使 CPU 用全虚拟化（VT-x），设备常用半虚拟化驱动（**Virtio**）——Guest 知道网卡/磁盘是虚拟的，用专用高效驱动而非模拟真硬件，性能比 QEMU 全模拟好数倍。

## 五、VM 的资源开销：为什么重

每个 VM 是一个**完整的系统**：

```
  VM 内部
  ┌─────────────────────┐
  │ 应用 + 依赖库        │  ← 你真正想跑的
  │ 系统库 (glibc/...)   │
  │ 系统服务 (systemd)   │
  │ Guest 内核           │  ← 这一层占大量资源
  │ init 进程、shell     │
  └─────────────────────┘
```

- **磁盘**：一个 VM 镜像通常几 GB 到几十 GB（含完整 Guest OS）。
- **内存**：每个 VM 即使空闲也要预留数百 MB-数 GB（Guest 内核 + 用户态常驻）。
- **启动**：要引导 Guest 内核（POST → bootloader → 内核 → init → 应用），分钟级。
- **CPU**：每个 VM 至少 1 个 vCPU，Hypervisor 在 vCPU 间调度有上下文切换（VMCS 保存/恢复）开销。

这就是 VM 不如容器轻量的根因——它多带了一整套操作系统。容器的解法是：**砍掉 Guest 内核，所有容器共享宿主内核**。详见下一节。

## 下一步

讲完 VM 的 Hypervisor 与硬件虚拟化后，下一步进入[容器：namespace 与 cgroups](../containers)——看 Linux 如何用内核原生机制做出"没有内核的轻量隔离"，以及 Docker 与 K8s 在其上的构建。
