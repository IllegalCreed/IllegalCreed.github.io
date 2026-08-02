---
layout: doc
outline: [2, 3]
---

# Linux 与 macOS：Unix 血脉

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **同源 Unix**：Linux（克隆）与 macOS（直系 BSD）都兼容 POSIX，命令行工具链、文件系统层级（`/`、`/usr`、`/etc`）、shell（bash/zsh）高度相似——但内核实现与生态完全不同。
- **Linux 内核**：**单体内核**（所有服务在内核态，函数调用通信）、**开源 GPLv2**、**LKM 模块化**——驱动可动态加载但仍在内核态，所以驱动 bug → kernel panic。
- **macOS XNU**：**混合内核** = **Mach 微内核**（调度/IPC/虚拟内存/陷阱处理）+ **BSD 层**（POSIX 系统调用/网络/文件系统/VFS）+ **IOKit**（受限 C++ 驱动框架），同地址空间运行，算"宏微内核"。
- **Darwin 开源**：macOS 底层 Darwin（含 XNU 内核 + 部分用户态）开源在 [opensource.apple.com](https://opensource.apple.com/)，iOS/iPadOS/watchOS/tvOS 同用 Darwin——苹果全家桶共享内核。
- **Linux 发行版**：内核统一（kernel.org），差异在**用户态 + 包管理**。四大谱系：Debian（apt/deb，Ubuntu/Debian）、RedHat（dnf/rpm，RHEL/CentOS/Fedora）、Arch（pacman，Arch/Manjaro，滚动）、SUSE（zypper/rpm）。
- **macOS 无发行版**：苹果单一发行，年度大版本（如 Sequoia/Sonoma），用户态闭源（GUI 框架 Cocoa 等），但底层 Darwin 开源——所以没有"Ubuntu for macOS"的说法。
- **包管理差异**：Linux 用**系统级包管理器**（apt/dnf/pacman，root 装，深度集成）；macOS 用 **Homebrew**（用户态，第三方社区，不碰系统目录）——这是 macOS"不开源但可定制"的关键。
- **文件系统差异**：Linux **EXT4**（inode + extents + 日志，成熟稳定）/ XFS（大文件强）/ Btrfs（CoW、快照）；macOS **APFS**（2017 替代 HFS+，**写时复制、原生快照、SSD 优化、空间共享**）。
- **大小写敏感性**：Linux 文件系统默认**大小写敏感**（`Foo.txt` ≠ `foo.txt`）；macOS APFS 默认**大小写不敏感但保留**（Case-Insensitive，`Foo.txt` == `foo.txt`）——这是 macOS→Linux 部署 `import` 路径 bug 的常见来源。
- **包格式**：Linux `.deb`/`.rpm`（含依赖元数据，包管理器自动解析）；macOS `.dmg`（磁盘镜像分发）+ `.pkg`（安装器）/ `brew` formula（脚本）——没有统一的依赖管理标准。
- **可执行格式**：Linux **ELF**；macOS **Mach-O**（支持 **Universal Binary**，单文件含多架构 x86_64+arm64，苹果 Silicon 过渡期靠它）。
- **工具链差异（坑点）**：macOS 自带 **BSD 版** `sed`/`grep`/`awk`/`tar`（行为与 Linux 的 **GNU 版**不同，如 `sed -i` 需带后缀参数）——是 macOS→Linux 部署脚本 bug 的头号来源。
- **共同点**：POSIX API（`fork`/`exec`/信号/管道/`unistd.h`）、bash/zsh、`/` 根目录、SSH、Git、大部分开源工具链（GCC/Clang/Make/CMake）。
- **进阶顺序**：本节 → [Windows NT 与跨平台开发](./windows) → [参考](../reference)。

## 一、Linux：单体内核与发行版生态

Linux 是 Linus Torvalds 1991 年发布的 Unix 克隆。它的两大特征决定了整个生态：

### 1. 单体内核 + 模块化

Linux 是**单体内核**——调度、内存、VFS、文件系统、网络协议栈、设备驱动全部编译进内核镜像，运行在内核态，服务间**直接函数调用**（无 IPC 开销，性能高）。但 Linux 通过**可加载内核模块（LKM）**实现弹性：驱动不必编译进内核，可运行时 `insmod`/`rmmod` 动态加载——加载后仍在内核态运行，所以驱动 bug 仍能崩内核（kernel panic）。

```bash
lsmod              # 查看已加载模块
insmod mydriver.ko # 加载模块
rmmod mydriver     # 卸载模块
modprobe nf_conntrack  # 自动处理依赖加载
```

### 2. 发行版：同一内核，不同用户态

Linux 的"内核"只是 [kernel.org](https://kernel.org/) 发布的那个压缩包。各**发行版（distribution, distro）**做的事是：选内核版本 + 配用户态（glibc/musl、shell、init 系统）+ 做包仓库 + 定发行策略。四大谱系：

| 谱系 | 代表 | 包管理 | 包格式 | 发行策略 | 定位 |
| --- | --- | --- | --- | --- | --- |
| **Debian** | Ubuntu、Debian | `apt` | `.deb` | 半年/两年 LTS | 桌面/通用，新手友好 |
| **RedHat** | RHEL、CentOS、Fedora | `dnf`（旧 yum） | `.rpm` | Fedora 半年，RHEL 长支持 | 企业服务器 |
| **Arch** | Arch、Manjaro | `pacman` | pkg.tar.zst | 滚动更新 | 极客/定制 |
| **SUSE** | openSUSE、SLES | `zypper` | `.rpm` | Tumbleweed 滚动 / Leap 稳定 | 欧洲企业 |

- **包管理器的作用**：不止装软件，还**自动解析依赖**（装 nginx 自动带 libc/openssl）、**签名校验**、**统一升级**（`apt upgrade` 升级全系统所有包）——这是 Linux 比 Windows/macOS 早 20 年实现"应用商店"理念的基础。
- **包格式之争**：`.deb` 与 `.rpm` 是两大阵营，互不兼容。近年 Flatpak/Snap/AppImage 试图做跨发行版打包（含依赖运行时），减少"在 Ubuntu 打包，到 CentOS 跑不起来"的碎片化。

## 二、macOS：XNU 混合内核与 Darwin

macOS 的内核叫 **XNU**（X is Not Unix，命名讽刺），它是三个部分的混合：

```
        用户态 (Ring 3)
  ┌───────────────────────────┐
  │  应用程序 + Cocoa/Cocoa Touch │
  │  libSystem（C 运行时 + BSD 包装）
  └─────────────┬─────────────┘
          syscall / mach trap
  ══════════════╪═══════════════  用户/内核分界
        内核态 (Ring 0)
  ┌─────────────┴─────────────┐
  │  BSD 层（POSIX 系统调用、VFS、网络、信号）│ ← 给应用看的"Unix 接口"
  │  Mach 微内核（调度、IPC、虚拟内存、陷阱）│ ← 真正的内核核心
  │  IOKit（C++ 驱动框架）                    │
  └───────────────────────────┘
```

- **Mach 层**：源自卡内基梅隆大学 Mach 微内核研究项目，负责**进程/线程调度、IPC（消息端口）、虚拟内存、陷阱处理**——它把"任务（task）"和"线程（thread）"分离，每个 Mach 线程有独立的调度优先级。
- **BSD 层**：在 Mach 之上提供**POSIX 兼容层**——把 Mach 的 task 映射成 BSD 的"进程"，提供 `fork`/`exec`/信号/文件描述符/`socket` 等 Unix 接口。应用调 `fork()` 实际经 BSD 层翻译成 Mach 操作。
- **IOKit**：用**受限 C++ 子集**（无异常/RTTI/多重继承）写的驱动框架，运行在内核态——比 Linux C 驱动更面向对象，但仍是内核态代码，bug 也会 panic。

**Darwin 开源**：苹果把 macOS/iOS 的底层（XNU 内核 + 部分用户态，如 launchd）作为 **Darwin** 开源（[opensource.apple.com](https://opensource.apple.com/)），但 GUI 框架（Cocoa/Aqua）、应用（Finder/Safari）闭源。所以你可以看到内核源码，却无法自己拼出一个能跑的 macOS——苹果靠签名与硬件绑定锁定生态。

## 三、共同点：POSIX 与 Unix 工具链

Linux 和 macOS 都兼容 POSIX，这是开发者能在两者间平滑切换的基础：

- **POSIX API**：`fork`/`exec`/`wait`/`exit`（进程）、`open`/`read`/`write`/`close`（文件）、`signal`/`kill`（信号）、`pipe`/`socket`（IPC）、`pthread`（线程）——同样的 C 代码能在两边编译运行。
- **Shell**：bash（Linux 默认，新版 macOS 已换 zsh）、zsh、fish。脚本语法大体兼容（POSIX sh 子集），但 bash 4+ 特性（如 `mapfile`）macOS 自带 bash 3.0 没有（需 brew install bash）。
- **目录层级**：`/`（根）、`/usr`、`/etc`（配置）、`/var`（可变数据）、`/tmp`、`/home`（Linux 用户）vs `/Users`（macOS 用户）、`/dev`（设备文件）。
- **工具链**：GCC/Clang、Make/CMake、Git、SSH、Vim/Emacs、Docker（macOS 靠虚拟机跑 Linux 容器）。

## 四、差异：包管理、文件系统与工具链

虽然有共同血统，但 Linux 和 macOS 在工程实践上有大量差异，是 bug 的温床：

| 维度 | Linux | macOS |
| --- | --- | --- |
| **包管理** | apt/dnf/pacman（系统级，root） | Homebrew（用户态 `/opt/homebrew`） |
| **文件系统** | EXT4/XFS/Btrfs | APFS（CoW、快照） |
| **大小写敏感** | 默认敏感 | 默认不敏感（CI） |
| **可执行格式** | ELF | Mach-O（Universal Binary） |
| **`sed -i`** | `sed -i 's/a/b/'` 可省后缀 | `sed -i '' 's/a/b/'`（BSD 版需后缀） |
| **`grep -P`** | 支持（PCRE） | 不支持（BSD grep，需 `ggrep`） |
| **`tar`** | GNU tar（支持 `.zst`） | BSD tar（部分选项不同） |
| **默认 shell** | bash（Ubuntu）/  varies | zsh（Catalina 起） |

### 经典坑：BSD 工具 vs GNU 工具

macOS 自带的命令行工具是 **BSD 版**（继承自 FreeBSD），而 Linux 是 **GNU 版**——同名命令行为有细微差异：

```bash
# macOS 上跑这行会报错（BSD sed 的 -i 必须带后缀参数）
sed -i 's/foo/bar/' file.txt
# macOS 正确写法：
sed -i '' 's/foo/bar/' file.txt

# 跨平台兼容写法（先备份再处理）
sed -i.bak 's/foo/bar/' file.txt && rm file.txt.bak
```

这也是为什么 CI/CD 脚本常写 `#!/usr/bin/env bash` 并避免依赖 GNU 专属特性，或在 macOS 上 `brew install coreutils gnu-sed grep` 装一套 GNU 工具前缀 `g`（`gsed`/`ggrep`）。

## 下一步

理解了 Unix 阵营后，下一节转向独立血统——[Windows NT 与跨平台开发](./windows)，看 NT 架构如何与 Unix 分道扬镳，以及 WSL、CRLF、路径分隔符等跨平台开发的核心痛点。
