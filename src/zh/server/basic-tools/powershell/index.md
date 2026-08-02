---
layout: doc
---

# PowerShell

**PowerShell** 是微软打造的**跨平台命令 shell 与脚本语言**——它的革命性在于**对象管道**：与传统 Unix shell（Bash/Zsh）传递**文本流**不同，PowerShell 在管道里传递的是**结构化的 .NET 对象**（含属性与方法），让命令组合不再需要 `grep`/`sed`/`awk` 解析文本。2016 年微软发布 **PowerShell Core 6**（基于 .NET Core，跨平台、MIT 开源），彻底告别 Windows 专属——如今 `pwsh` 可在 Linux、macOS、Windows 上运行，是云原生时代（特别是 **Azure** 运维）的利器。注意区分两个名字：**Windows PowerShell 5.1**（Windows 内置，基于 .NET Framework，仅 Windows，停止新特性）vs **PowerShell 7+**（即跨平台 `pwsh`，基于 .NET 5+，持续更新，推荐）。

PowerShell 的全部考点围绕**四大特性**展开：①**对象管道**——`Get-Process` 输出的不是文本而是进程对象数组，可直接 `.Where{$_.CPU -gt 10}` 过滤、`.Name` 取属性，无需 `ps aux | awk`；②**Cmdlet 体系**——命令遵循 **Verb-Noun** 命名规范（`Get-Process`/`Stop-Service`/`New-Item`），动词来自受控词表（Get/Set/New/Remove/Stop/Start...），名词描述操作对象，自带文档 `Get-Help`；③**跨平台**——`pwsh` 装在 Linux/macOS 后，运维 Azure 资源、管理 Windows 服务器脚本、在 WSL 里调用 Windows API 都统一用 PowerShell；④**与 .NET 深度集成**——可直接调 .NET 类库（`[Math]::Sqrt(2)`、`[System.IO.File]::ReadAllText()`），访问 Win32 API、注册表、WMI/CIM、Active Directory 等 Windows 系统层。本叶讲透 PowerShell 的 Cmdlet/对象管道范式与跨平台场景，并厘清它与 Bash 文本管道的根本差异。

## 评价

**优点**

- **对象管道**：传递结构化对象而非文本，告别 `grep`/`sed`/`awk` 文本解析地狱——属性直接访问、类型安全、嵌套对象原生支持
- **Verb-Noun 一致性**：所有 Cmdlet 遵循动词-名词规范，命令名自描述、可预测、`Get-Command`/`Get-Help` 体系完善
- **.NET 全栈能力**：直接调 .NET 类库、Win32 API、注册表、AD、Azure——Windows 系统管理无出其右
- **跨平台**：pwsh 7+ 装在 Linux/macOS，Azure 运维、混合环境脚本统一

**缺点**

- **学习曲线陡**：对象管道思维与 Bash 文本管道完全不同，动词-名词命令冗长（`Get-ChildItem` 比 `ls` 长得多）
- **启动慢**：pwsh 冷启动几百毫秒（.NET 运行时初始化），不适合像 Bash 那样高频子进程调用
- **Linux 生态不如 Bash**：服务器脚本生态绑定 Bash（CI/Docker/cron），Linux 上 PowerShell 是补充而非替代
- **兼容性碎片**：Windows PowerShell 5.1 与 PowerShell 7 有差异，部分模块仅 5.1 可用（如某些老 Azure 模块）

## 本叶地图

- [入门](./getting-started) —— PowerShell 是什么、对象管道 vs 文本管道、Cmdlet Verb-Noun、pwsh 与 5.1 区别
- [Cmdlet 与管道](./guide-line/cmdlets-and-pipeline) —— Verb-Noun 规范、对象管道、Where-Object/Select-Object/ForEach-Object、参数绑定
- [跨平台场景](./guide-line/cross-platform) —— pwsh 安装、Windows/WSL/Azure 运维、与 Bash 协作
- [参考](./reference) —— PowerShell 速查、常用 Cmdlet、与 Bash 对照表、易错点

## 幻灯片地址

<a href="/SlideStack/powershell-slide/" target="_blank">PowerShell</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=PowerShell" target="_blank" rel="noopener noreferrer">PowerShell 测试题</a>
