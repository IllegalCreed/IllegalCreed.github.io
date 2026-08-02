---
layout: doc
outline: [2, 3]
---

# Windows NT 与跨平台开发

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **Windows NT 血统**：与 Unix 无关，源自 DEC VMS（首席架构师 David Cutler 来自 DEC）。NT（New Technology）1993 年首发，靠**向后兼容 + 企业生态**统治桌面与办公。
- **NT 混合内核三层**：①**HAL（硬件抽象层）**——屏蔽不同主板/平台差异；②**内核（Kernel）**——调度、中断、同步原语、陷阱处理（最高特权级）；③**执行体（Executive）**——IO 管理器、对象管理器、进程/线程管理器、内存管理器、IPC、安全引用监视器（也在内核态，但比"内核"层高）。
- **窗口系统 win32k**：部分在用户态会话空间（Session Space），部分在内核态——所以 Windows 的图形驱动崩溃有时能恢复而非蓝屏。
- **注册表 vs 配置文件**：Unix 用**文本配置文件**（`/etc/`、`~/.config`，可 `grep`/`vim`）；Windows 用**注册表（Registry）**——一个**层次型二进制数据库**（HKLM/HKCU/HKCR 等根键），集中存系统/应用配置，用 `regedit` 编辑。
- **PE 可执行格式**：Windows 的 `.exe`/`.dll`/`.sys` 都是 **PE（Portable Executable）** 格式——与 Linux ELF、macOS Mach-O 互不兼容，跨平台二进制需针对平台编译。
- **WSL（Windows Subsystem for Linux）**：让 Windows 跑 Linux 程序的兼容层。**WSL1** 是内核翻译层（把 Linux syscall 翻译成 NT 调用，文件系统快但不全兼容）；**WSL2** 是**轻量虚拟机 + 真 Linux 内核**（微软维护的 [WSL2 Linux kernel](https://github.com/microsoft/WSL2-Linux-kernel)），兼容性好，是当前默认。
- **CRLF vs LF**：Windows 文本行尾是 **CRLF**（`\r\n`，源自打字机时代）；Linux/macOS 是 **LF**（`\n`）。混用导致 shell 脚本报 `bash: \r: command not found`、git diff 全文标红——靠 `.gitattributes`（`* text=auto`）统一。
- **路径分隔符**：Windows 用 **反斜杠 `\`**（`\` 在 C 字符串是转义符，要写 `C:\\Users\\foo` 或用 `/`，多数 API 也接受 `/`）；Linux/macOS 用 **正斜杠 `/`**。跨平台代码应优先用语言提供的路径库（如 Node `path.join`、Python `pathlib`）而非硬编码。
- **大小写敏感性**：Windows NTFS **大小写不敏感**（`Foo.txt` == `foo.txt`）但**保留大小写**；Linux EXT4 **大小写敏感**。导致 `import React` 在 Windows/macOS 能跑，部署到 Linux 找不到模块（实际文件名是 `react`）。
- **权限模型**：Unix rwx 三元组 vs Windows **ACL（任意访问控制列表）**——ACL 每文件可授权多个用户/组不同权限（读/写/执行/删除/改权限），粒度细，适合企业但复杂。
- **盘符 vs 单根**：Windows 多根（`C:\`、`D:\`，源自 DOS）；Linux/macOS 单根（`/`，所有盘挂载到目录树）。跨平台代码别硬编码盘符。
- **驱动字母与设备**：Windows `C:\` 是系统盘；Linux 设备在 `/dev/sda1`，挂载到 `/mnt`；macOS 在 `/dev/disk0`，挂载到 `/Volumes`。
- **开发者选型**：跨平台后端服务优先 Linux（云原生、容器、CI/CD）；企业桌面/办公/游戏选 Windows；开发者工作站若需 Windows 工具 + Linux 环境，开 WSL2 + Docker Desktop 是新主流。
- **进阶顺序**：本节 → [参考](../reference)（三 OS 横向对比大表 + 选型决策）。

## 一、Windows NT 架构：HAL + 内核 + 执行体

Windows NT 是混合内核，采用**严格分层**——这与 Linux"所有东西在同一地址空间"的扁平单体截然不同：

```
        用户态 (Ring 3)
  ┌───────────────────────────┐
  │  应用（.exe / .dll）        │
  │  子系统 DLL（kernel32/user32/gdi32）│  ← 给应用看的"Win32 API"
  │  环境子系统（csrss.exe，会话空间） │
  └─────────────┬─────────────┘
          syscall / 系统服务分发
  ══════════════╪═══════════════  用户/内核分界
        内核态 (Ring 0)
  ┌─────────────┴─────────────┐
  │ 执行体（Executive）          │
  │   进程/线程管理 · 内存管理    │
  │   IO 管理器 · 对象管理器      │
  │   安全引用监视器（SRM）· IPC │
  ├───────────────────────────┤
  │ 内核（Kernel）               │  ← 调度、中断、同步、陷阱
  ├───────────────────────────┤
  │ HAL（硬件抽象层）            │  ← 屏蔽主板/中断控制器差异
  ├───────────────────────────┤
  │ 设备驱动                    │
  └───────────────────────────┘
        硬件（CPU/内存/磁盘）
```

- **HAL（Hardware Abstraction Layer）**：让同一份 NT 内核能跑在不同平台（x86/ARM/早年 Alpha/MIPS）。HAL 屏蔽中断控制器、定时器、I/O 端口等硬件细节——这也是 Windows 能从 x86 平滑迁移到 ARM64（Windows on ARM）的基础。
- **内核（Kernel）**：最小核心，负责**线程调度、中断与异常分发、多处理器同步原语（自旋锁/IRQL）**。它不像 Linux 内核那样包含文件系统/网络——那些在 Executive 层。
- **执行体（Executive）**：内核之上的一层，提供**进程/线程管理器、内存管理器、IO 管理器、对象管理器、安全引用监视器（SRM）、缓存管理器、IPC（LPC/ALPC）**。应用调 Win32 API（如 `CreateFile`）经 kernel32.dll 翻译成 Executive 的系统服务。

## 二、注册表 vs 配置文件

这是 Unix 与 Windows 最直观的哲学差异：

| | Unix（Linux/macOS） | Windows |
| --- | --- | --- |
| **配置存储** | 文本配置文件 | 注册表（层次型数据库） |
| **位置** | `/etc/`（系统）、`~/.config`（用户） | `HKEY_LOCAL_MACHINE`（系统）、`HKEY_CURRENT_USER`（用户） |
| **编辑工具** | `vim`/`grep`/`sed` | `regedit`（注册表编辑器） |
| **格式** | 各种（ini/conf/yaml/toml） | 二进制/文本混合的注册表单元 |
| **程序化访问** | 读文件 | Win32 Registry API（`RegOpenKey`） |

- **注册表的优劣**：✅ 集中管理、程序化访问方便、支持事务（NT 6+）；❌ **二进制格式不可 `grep`/`diff`**、坏一个键可能拖垮系统、迁移配置要导出 `.reg` 文件、用户惧怕乱改 `regedit`。
- **趋势回归**：现代 Windows 应用（UWP/MSIX）越来越多用**清单文件 + 配置文件**（如 `AppxManifest.xml`），部分回归 Unix 式的声明式配置；而 macOS 也有 plist（XML/二进制属性列表）介于两者之间。

## 三、WSL：在 Windows 里跑 Linux

**WSL（Windows Subsystem for Linux）** 是微软 2016 年（Win10 周年版）推出的兼容层，让 Windows 跑 Linux 二进制（ELF），无需传统虚拟机的开销：

- **WSL1**：**翻译层**架构。Windows 内核里有个 **LXSS 子系统**，捕获 Linux ELF 程序的 syscall，翻译成对应的 NT 系统服务。优点：文件系统访问快（直接读 NTFS）、轻量；缺点：不兼容（很多 syscall 没翻译，如 `ptrace`、某些文件系统特性），Docker 跑不了。
- **WSL2**（2020，当前默认）：**轻量虚拟机 + 真 Linux 内核**。微软维护一个开源 [WSL2 Linux 内核](https://github.com/microsoft/WSL2-Linux-kernel)，跑在 Hyper-V 轻量虚拟机里。优点：**完整 Linux 兼容**（能跑 Docker、systemd、所有 syscall）；缺点：文件系统跨边界访问（Windows 访问 Linux 文件 `/mnt/c`）较慢。

WSL2 的意义：开发者终于能在**一台 Windows 机器**上同时拥有 Windows 桌面（Office/游戏/设计软件）与完整 Linux 环境（bash/docker/kubectl/Node/Python），无需双系统或重型虚拟机。配合 Docker Desktop（基于 WSL2 后端）和 VS Code Remote-WSL，跨平台开发体验大幅提升。

## 四、CRLF vs LF 与路径分隔符

跨平台开发的两大经典"地雷"：

### 1. 行尾符：CRLF（`\r\n`）vs LF（`\n`）

```
Windows 文本文件：     "line1\r\nline2\r\n"   ← CRLF，源自打字机回车+换行两步
Linux/macOS 文本文件：  "line1\nline2\n"       ← LF
```

**典型问题**：

- **shell 脚本**：在 Windows 编辑的 `.sh` 文件带 `\r`，传到 Linux 跑 `bash script.sh` 报 `bash: $'\r': command not found`——`\r` 被当成命令了。
- **git diff 全文标红**：Windows 上 git 默认 `core.autocrlf=true`，提交时 CRLF→LF，检出时 LF→CRLF，导致跨平台协作时行尾反复变化，每次 diff 全文标红。
- **加密签名失配**：CRLF/LF 差异让文件 hash 变化，导致签名校验失败。

**解法**：用 `.gitattributes` 在仓库内统一（推荐 `* text=auto eol=lf`，Windows 脚本单独 `*.bat text eol=crlf`），别依赖每个人的全局 git 配置。

### 2. 路径分隔符：`\` vs `/`

```python
# 错误（硬编码分隔符，Windows 上 \ 是转义符）
path = "C:\\Users\\foo\\bar"   # 要写双反斜杠
# 或
path = "C:/Users/foo/bar"      # 多数 API 也接受正斜杠

# 正确（用语言路径库，自动处理分隔符）
from pathlib import Path
path = Path("C:/Users") / "foo" / "bar"
```

**典型问题**：硬编码 `"/tmp/foo"` 在 Windows 不存在（Windows 无 `/tmp`）；硬编码 `"C:\..."` 在 Linux/macOS 不存在。**解法**：永远用语言的路径库（Node `path`、Python `pathlib`、Go `filepath`、Rust `std::path`），别硬编码分隔符与绝对路径，必要时从环境变量取（`os.tmpdir()`、`%TEMP%`/`$TMPDIR`）。

## 五、开发者痛点与选型

| 痛点 | 表现 | 解法 |
| --- | --- | --- |
| CRLF/LF | 脚本报 `\r` 错、git diff 标红 | `.gitattributes` 统一 |
| 路径分隔符 | 硬编码 `\`/`/` 跨平台失效 | 用路径库，别硬编码 |
| 大小写敏感 | `import React` 在 Windows 能跑，Linux 报错 | CI 用 Linux，规范化命名 |
| 编码 | Windows 默认 GBK，导致中文乱码 | 显式 UTF-8（文件头/编辑器配置） |
| shell 差异 | bash 脚本在 Windows 无（除非 WSL/Cygwin） | 用 Node/Python 跨平台脚本，或 WSL |
| 二进制 | ELF/Mach-O/PE 不兼容 | 跨平台用解释型语言或交叉编译 |

**选型建议**：

- **服务器/云/CI**：Linux（Docker/Kubernetes 生态、免费、稳定）。
- **桌面办公/企业/游戏**：Windows（生态、兼容、Office）。
- **开发者工作站**：macOS（Unix 工具链 + 商业设计软件齐全 + 硬件品质）或 Linux（深度定制、纯开源）；若需 Windows 专属工具，用 Windows + WSL2 + Docker Desktop。

## 下一步

理解了三大 OS 后，最后去 [参考](../reference) 看横向对比大表（内核/文件系统/包管理/权限/包格式/POSIX 一图速查）、开发者选型决策树、易错点清单与权威链接。
