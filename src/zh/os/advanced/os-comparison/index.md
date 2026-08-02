---
layout: doc
---

# 主流操作系统对比

开发者日常面对三大主流操作系统——**Linux**、**macOS**、**Windows**——它们同为分时 OS，却走出了截然不同的内核与生态路线。Linux 是 Unix 的"克隆"单体内核，开源、发行版林立（Ubuntu/Debian/CentOS/Arch）；macOS 经 NeXTSTEP 继承自 BSD，内核 XNU 是 Mach 微内核 + BSD 层 + IOKit 的混合体；Windows NT 则自成一脉，混合内核 + HAL/Executive 分层 + 注册表。理解三者的内核血缘、文件系统（EXT4/APFS/NTFS）、权限模型（rwx/ACL）、包管理（apt/brew/MSI）差异，是开发者做技术选型、写跨平台代码、调试环境问题的基本功——为何同一个脚本在 macOS 跑通却在 Linux 报错（BSD 工具 vs GNU 工具），为何 Windows 上一堆 `CRLF` 问题，为何 POSIX 兼容却不能保证可移植。

三大 OS 对比的全部考点围绕**血缘与内核**展开：①**内核类型**——Linux 单体、XNU 混合（Mach+BSD）、Windows NT 混合（内核+Executive+HAL）；②**文件系统**——EXT4（inode+ extents）/ APFS（写时复制、快照）/ NTFS（MFT、日志）；③**权限模型**——Unix rwx 三元组（owner/group/other）vs Windows ACL（任意访问控制列表）；④**可执行格式与包**——ELF/mach-o/PE，deb/rpm/MSI/DMG；⑤**跨平台开发痛点**——CRLF vs LF、路径分隔符（`\` vs `/`）、大小写敏感性、POSIX 兼容度。本叶聚焦"三件套"的横向对比，是前面 [操作系统概述](../../overview/)、[内核架构详解](../../overview/guide-line/kernel-architecture) 的延伸与落地。

## 评价

**优点**

- **分工明确的生态**：Linux 统治服务器/云/嵌入式，Windows 统治桌面与企业办公，macOS 统治开发者工作站与创意设计——各自在自己擅长的领域打磨
- **POSIX 桥梁**：Linux/macOS（含 iOS/Android）均兼容 POSIX，开发者写一套 C/Shell 代码可在多个 OS 间移植
- **WSL 融合**：Windows 通过 WSL2 跑真 Linux 内核，开发者在一台机器上同时拥有 Windows 桌面与 Linux 工具链，缓解了"选哪边"的痛苦

**缺点**

- **碎片化代价**：同一概念三套名词（如权限 rwx vs ACL）、三套文件系统、三套包格式，跨平台开发要写大量 `#ifdef`/适配层
- **POSIX 不是万能**：Windows 仅部分 POSIX 兼容（旧版 SUA 已废弃），`fork`/信号/文件描述符语义在 Windows 上完全不同
- **配置地狱**：路径分隔符、行尾符（CRLF/LF）、大小写敏感性、字符编码、shell 语法（bash vs PowerShell）的细微差异，是 bug 与环境问题的重灾区

## 本叶地图

- [入门](./getting-started) —— 三大桌面 OS 概览、内核血缘（Unix→macOS/BSD、独立→Windows NT、克隆 Unix→Linux）、开发者接触场景
- [Linux 与 macOS：Unix 血脉](./guide-line/linux-macos) —— Linux 单体内核与发行版、macOS XNU（Mach+BSD+IOKit）、共同 POSIX 兼容与差异（包管理/文件系统/包格式）
- [Windows NT 与跨平台开发](./guide-line/windows) —— Windows NT 架构（HAL/Executive/内核）、注册表 vs 配置文件、PE 格式、WSL、CRLF/LF、路径分隔符
- [参考](./reference) —— 三 OS 横向对比大表（内核/文件系统/包管理/权限/包格式/POSIX）、开发者选型决策、易错点清单、权威链接

## 幻灯片地址

<a href="/SlideStack/os-comparison-slide/" target="_blank">主流操作系统对比</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=%E4%B8%BB%E6%B5%81%E6%93%8D%E4%BD%9C%E7%B3%BB%E7%BB%9F%E5%AF%B9%E6%AF%94" target="_blank" rel="noopener noreferrer">主流操作系统对比测试题</a>
