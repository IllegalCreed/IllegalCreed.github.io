---
layout: doc
outline: [2, 3]
---

# 参考：三大 OS 横向对比与选型速查

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **三大 OS**：Linux（开源单体内核，发行版生态）、macOS（XNU 混合 = Mach+BSD+IOKit，Darwin 部分开源）、Windows（NT 混合，HAL+内核+执行体，闭源）。
- **血缘三分**：macOS = Unix 直系（BSD）、Linux = Unix 克隆（无 AT&T 代码）、Windows = 独立（VMS 演化）。
- **POSIX 兼容**：Linux/macOS 高度兼容；Windows 仅部分（靠 Cygwin/MSYS2/WSL）。
- **内核类型**：Linux 单体（高性能）、XNU 混合（Mach+BSD）、NT 混合（HAL/Executive/内核分层）。
- **文件系统**：EXT4/XFS/Btrfs（Linux）、APFS（macOS，CoW+快照）、NTFS/ReFS（Windows，MFT+日志）。
- **包管理**：apt/dnf/pacman（Linux，系统级）、Homebrew（macOS，用户态）、MSI/winget/Chocolatey（Windows）。
- **权限模型**：Unix rwx 三元组（owner/group/other）vs Windows ACL（任意访问控制列表，细粒度）。
- **可执行格式**：ELF（Linux）、Mach-O（macOS，支持 Universal Binary）、PE（Windows）。
- **路径分隔符**：`/`（Linux/macOS）vs `\`（Windows）。
- **行尾符**：LF（Linux/macOS）vs CRLF（Windows）。
- **大小写敏感**：EXT4 敏感；NTFS/APFS 默认不敏感（CI）。
- **跨平台利器**：WSL2（Windows 跑真 Linux 内核）、Docker（隔离环境）、Cygwin/MSYS2（Windows 上模拟 POSIX）。

## 一、三大 OS 横向对比大表

| 维度 | Linux | macOS | Windows |
| --- | --- | --- | --- |
| **内核** | 单体（LKM 模块化） | XNU 混合（Mach+BSD+IOKit） | NT 混合（HAL+内核+Executive） |
| **血缘** | Unix 克隆 | Unix 直系（BSD） | 独立（VMS） |
| **开源** | 完全开源（GPLv2） | Darwin 部分开源 | 闭源 |
| **发行版/版本** | 发行版林立 | 苹果单一发行 | 微软单一发行 |
| **文件系统** | EXT4/XFS/Btrfs | APFS | NTFS/ReFS（FAT32/exFAT 兼容） |
| **包管理** | apt/dnf/pacman/zypper | Homebrew | MSI/MSIX/winget/Chocolatey |
| **包格式** | `.deb`/`.rpm`/`.pkg.tar.zst` | `.dmg`/`.pkg`/brew formula | `.exe`/`.msi`/`.msix` |
| **权限模型** | rwx 三元组（owner/group/other） | rwx + ACL（NFSv4 ACL 扩展） | ACL（DACL/SACL） |
| **可执行格式** | ELF | Mach-O（含 Universal Binary） | PE（.exe/.dll/.sys） |
| **POSIX 兼容** | 高度 | 原生（认证） | 部分（需 WSL/Cygwin） |
| **默认 shell** | bash（各发行版不同） | zsh（Catalina 起） | PowerShell / cmd |
| **配置存储** | 文本文件（`/etc`、`~/.config`） | plist + 文件 | 注册表 + 文件 |
| **路径分隔符** | `/` | `/` | `\`（多数 API 也接受 `/`） |
| **根目录** | 单根 `/`（多盘挂载到目录） | 单根 `/`（盘在 `/Volumes`） | 多根 `C:\`、`D:\` |
| **行尾符** | LF（`\n`） | LF（`\n`） | CRLF（`\r\n`） |
| **大小写敏感** | 敏感 | 默认不敏感（CI） | 不敏感（保留大小写） |
| **设备文件** | `/dev/sda1` | `/dev/disk0` | `\\.\PhysicalDrive0` |
| **临时目录** | `/tmp`（`$TMPDIR`） | `/var/folders/...`（`$TMPDIR`） | `%TEMP%`（`C:\Users\x\AppData\Local\Temp`） |
| **用户目录** | `/home/user` | `/Users/user` | `C:\Users\user` |
| **适用场景** | 服务器/云/嵌入式/移动(Android) | 桌面/工作站/移动(iOS) | 桌面/办公/企业/游戏 |

## 二、内核类型速查

| 内核 | 类型 | 服务组织 | 代表 |
| --- | --- | --- | --- |
| **Linux** | 单体 | 全在内核态，函数调用，LKM 动态加载 | Ubuntu/CentOS/Android |
| **XNU** | 混合 | Mach 微内核 + BSD 层 + IOKit，同地址空间 | macOS/iOS/iPadOS |
| **NT** | 混合 | HAL + 内核 + Executive 分层 | Windows 10/11/Server |
| MINIX | 微内核 | 最小内核 + 用户态服务，IPC 通信 | 教学（Embedded in Intel ME） |
| QNX | 微内核 | 最小内核 + 用户态服务，硬实时 | 车机/工业/医疗 |

## 三、文件系统速查

| 文件系统 | OS | 特点 |
| --- | --- | --- |
| **EXT4** | Linux | inode + extents + 日志，成熟稳定，事实标准 |
| **XFS** | Linux | 大文件/高并发强（SGI 起源），RHEL 默认 |
| **Btrfs** | Linux | CoW、快照、子卷、压缩（Next Linux 趋势） |
| **APFS** | macOS | 写时复制、原生快照、SSD 优化、空间共享（2017 替代 HFS+） |
| **HFS+** | macOS | 旧版（2017 前），已淘汰 |
| **NTFS** | Windows | MFT（主文件表）+ 日志 + ACL，成熟稳定 |
| **ReFS** | Windows | Resilient FS，CoW、校验，用于 Storage Spaces（未普遍） |
| **FAT32/exFAT** | 跨平台 | U盘/SD 卡，老简单格式，无日志无权限 |

## 四、包管理速查

| OS | 包管理器 | 包格式 | 特点 |
| --- | --- | --- | --- |
| Linux（Debian 系） | `apt` | `.deb` | 系统级，root，依赖自动解析 |
| Linux（RedHat 系） | `dnf`（旧 yum） | `.rpm` | 系统级，企业 |
| Linux（Arch 系） | `pacman` | `.pkg.tar.zst` | 滚动，极客 |
| macOS | **Homebrew** | `.dmg`/`.pkg`/formula | 用户态 `/opt/homebrew`，社区 |
| Windows | winget/Chocolatey/MSI | `.exe`/`.msi`/`.msix` | 系统级 + 签名 |

## 五、权限模型速查

| 模型 | OS | 表示 | 特点 |
| --- | --- | --- | --- |
| **Unix rwx 三元组** | Linux/macOS | `rwxr-xr--`（9 位） | owner/group/other 各 3 位（读/写/执行），+ setuid/setgid/sticky，简单够用 |
| **POSIX ACL（扩展）** | Linux/macOS | `getfacl`/`setfacl` | 在 rwx 之上给特定用户/组额外授权 |
| **Windows ACL** | Windows | DACL/SACL | 任意访问控制列表，每文件可授权多个条目（用户/组 × 读/写/执行/删除/改权限），粒度细但复杂 |

```bash
# Unix 权限示例
chmod 755 file      # rwxr-xr-x
chmod u+s program   # setuid（执行时以 owner 身份）
# POSIX ACL
setfacl -m u:alice:rw file

# Windows ACL（icacls 命令）
icacls file /grant alice:(R,W)
```

## 六、开发者选型决策树

```
你的场景是什么？
│
├─ 后端服务 / 云 / 容器 / CI
│  └─ → Linux（Docker/K8s 生态、免费、稳定）
│
├─ 移动开发
│  ├─ iOS/iPadOS/watchOS → macOS（Xcode 必须 macOS）
│  └─ Android → 任意 OS（Android Studio 跨平台，内核是 Linux）
│
├─ 桌面办公 / 企业 / 游戏
│  └─ → Windows（生态、兼容、Office/游戏）
│
├─ 开发者工作站（通用）
│  ├─ 要 Unix 工具链 + 商业设计软件 → macOS
│  ├─ 要纯开源 + 深度定制 → Linux
│  └─ 要 Windows 专属工具 + Linux 环境 → Windows + WSL2
│
├─ 嵌入式 / 物联网
│  └─ → 嵌入式 Linux（资源够）或 FreeRTOS（资源紧）
│
└─ 车机 / 工业 / 安全关键
   └─ → QNX（微内核，硬实时）或 INTEGRITY
```

## 七、易错点清单

- **"macOS 是 Linux"**：错。macOS 是 Unix 直系（BSD），内核 XNU 与 Linux 无关；Linux 是 Unix 克隆。两者只是都兼容 POSIX。
- **"Linux 内核就是 Linux 发行版"**：错。内核是 [kernel.org](https://kernel.org/) 发布的那个；发行版 = 内核 + 用户态 + 包仓库 + 发行策略（Ubuntu/CentOS 是不同发行版）。
- **"POSIX 兼容就一定能跨 OS 移植"**：错。POSIX 只覆盖 C API 一部分，`fork`/信号语义、文件系统特性、第三方库依赖仍有差异；Windows 甚至不算 POSIX 兼容。
- **"Windows NT 是单体内核"**：错。NT 是混合内核（HAL + 内核 + Executive 分层），不是 Linux 式的扁平单体。
- **"macOS XNU 是纯微内核"**：错。XNU 是 Mach + BSD + IOKit 在同一地址空间的混合，常称"宏微内核"，并非纯微内核。
- **"WSL1 和 WSL2 一样"**：错。WSL1 是 syscall 翻译层（兼容差）；WSL2 是轻量虚拟机 + 真 Linux 内核（兼容好，当前默认）。
- **"CRLF 和 LF 无所谓"**：错。shell 脚本带 `\r` 会报 `command not found`，git diff 全文标红，签名校验失败。用 `.gitattributes` 统一。
- **"路径分隔符用 `/` 就跨平台了"**：不完全。多数 Windows API 接受 `/`，但有些（如 `cmd` 的某些命令）不认。最佳实践是用语言路径库，别硬编码。
- **"EXT4 和 NTFS 没区别"**：错。EXT4 用 inode + extents；NTFS 用 MFT（主文件表）。EXT4 大小写敏感，NTFS 默认不敏感——导致跨平台 `import` 路径 bug。
- **"macOS 自带 sed 和 Linux 一样"**：错。macOS 自带 BSD 版 `sed`/`grep`/`tar`，与 Linux GNU 版行为不同（如 `sed -i` 必须带后缀参数）。
- **"Homebrew 是 macOS 系统包管理器"**：错。Homebrew 是第三方社区工具，装在用户态 `/opt/homebrew`（Apple Silicon）或 `/usr/local`（Intel），不碰系统目录。
- **"Windows 注册表就是配置文件"**：错。注册表是层次型**二进制数据库**，不可 `grep`/`vim`，用 `regedit` 编辑；Unix 的文本配置文件可 `grep`/`diff`，哲学不同。
- **"Universal Binary 是跨 OS 的"**：错。Universal Binary 是 macOS 同一 OS 内**多 CPU 架构**（x86_64+arm64）合一，不是跨 OS（仍是 Mach-O，只在 macOS 跑）。

## 八、进阶方向（链接其他叶）

- [操作系统概述](../../overview/) —— OS 定义、四大功能、用户态/内核态
- [内核架构详解](../../overview/guide-line/kernel-architecture) —— 单体/微内核/混合的工程取舍
- [中断、异常与系统调用](../../overview/guide-line/interrupts-and-syscalls) —— syscall 与上下文切换代价
- [操作系统安全](../os-security/) —— 权限模型、访问控制、隔离保护

## 权威链接

- [Comparison of operating systems - Wikipedia](https://en.wikipedia.org/wiki/Comparison_of_operating_systems)
- [Usage share of operating systems - Wikipedia](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems)
- [XNU - Wikipedia](https://en.wikipedia.org/wiki/XNU)
- [Windows NT architecture - Wikipedia](https://en.wikipedia.org/wiki/Architecture_of_Windows_NT)
- [Windows Subsystem for Linux - Wikipedia](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux)
- [POSIX - Wikipedia](https://en.wikipedia.org/wiki/POSIX)
- [Homebrew Documentation](https://docs.brew.sh/)
- [WSL2 Linux kernel (GitHub)](https://github.com/microsoft/WSL2-Linux-kernel)
- [Darwin source (opensource.apple.com)](https://opensource.apple.com/)
- 本站幻灯片：<a href="/SlideStack/os-comparison-slide/" target="_blank">主流操作系统对比</a>
