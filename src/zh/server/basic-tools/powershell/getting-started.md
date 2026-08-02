---
layout: doc
outline: [2, 3]
---

# 入门：PowerShell 定义、对象管道与 Cmdlet

> 基于 PowerShell 7 · 核于 2026-08

## 速查

- **PowerShell 是什么**：微软打造的**跨平台命令 shell + 脚本语言**。革命性在**对象管道**——管道里传的是**结构化 .NET 对象**（含属性方法），而非传统 shell 的文本流。
- **两个版本**：**Windows PowerShell 5.1**（Windows 内置，.NET Framework，仅 Windows，停止新特性，可执行 `powershell`）vs **PowerShell 7+**（跨平台 `pwsh`，.NET 5+，MIT 开源，持续更新，**推荐**）。
- **对象管道 vs 文本管道**：Bash/Zsh 管道传文本，下游要 `grep`/`sed`/`awk` 解析；PowerShell 传对象，下游直接 `.属性` 访问——`Get-Process | Where-Object CPU -gt 10 | Select-Object Name` 无需文本解析。
- **Cmdlet**：PowerShell 命令叫 **Cmdlet**（读 command-let），遵循 **Verb-Noun** 命名规范：`Get-Process`/`Stop-Service`/`New-Item`/`Set-Content`。动词来自受控词表（Get/Set/New/Remove/Start/Stop/Invoke...），名词描述对象。
- **Get-Help / Get-Command**：`Get-Help Get-Process -Examples` 看文档；`Get-Command *process*` 搜命令；`Get-Member` 看对象属性方法。
- **别名**：`ls`=`Get-ChildItem`、`cd`=`Set-Location`、`cp`=`Copy-Item`、`cat`=`Get-Content`——兼容 Bash 习惯，但脚本里**用全名**（别名不可移植且可能冲突）。
- **管道符 `|`**：与 Bash 同符号，但传对象。`Select-Object` 选属性、`Where-Object` 过滤、`ForEach-Object` 遍历、`Sort-Object` 排序。
- **变量 `$x`**：变量以 `$` 开头，无需声明（可选 `[int]$x=1` 强类型）。数组 `@(1,2,3)`、哈希 `@{k='v'}`。
- **跨平台**：`pwsh` 装在 Linux/macOS（brew/apt/wget），运维 Azure 资源、Windows 服务器、混合环境统一脚本。
- **.NET 集成**：直接调 .NET 类——`[Math]::Sqrt(2)`、`[System.IO.File]::ReadAllText('x.txt')`、`[DateTime]::Now`。
- **进阶顺序**：[Cmdlet 与管道](./guide-line/cmdlets-and-pipeline) → [跨平台场景](./guide-line/cross-platform) → [参考](./reference)。

## 一、PowerShell 是什么：对象管道的革命

传统 Unix shell（Bash/Zsh/Fish）的管道传**文本流**——一个命令的 stdout 是一串字符，下游命令要用 `grep`/`sed`/`awk`/`cut` 解析格式。这有个根本问题：**格式脆弱**——输出多一个空格、换个日期格式，下游解析就崩。

PowerShell 的革命：**管道里传的是 .NET 对象**。`Get-Process`（列进程）输出的不是文本表格，而是一个**进程对象数组**，每个对象有 `Name`/`Id`/`CPU`/`WS`（内存）等强类型属性。下游直接 `.属性` 访问，无需解析：

```powershell
# Bash 文本管道：要 awk 解析列、grep 过滤
ps aux | awk '$3 > 10 {print $1, $3}' | sort -k2 -rn

# PowerShell 对象管道：直接访问属性，类型安全
Get-Process | Where-Object CPU -gt 10 | Select-Object Name, CPU | Sort-Object CPU -Descending
```

对象管道的优势：

1. **类型安全**：`$_.CPU` 是 double，不能和字符串比——IDE/运行时能检查。
2. **属性稳定**：微软保证 `Get-Process` 输出的对象属性集稳定，不会因显示格式变动而崩脚本。
3. **嵌套原生**：对象可以有对象属性（如进程的 `.Modules` 是模块对象集合），无需解析嵌套结构。
4. **方法可调**：对象有方法——`(Get-Process explorer).Kill()` 直接杀进程。

## 二、两个版本：Windows PowerShell 5.1 vs PowerShell 7+

| 维度 | Windows PowerShell 5.1 | PowerShell 7+（pwsh） |
| --- | --- | --- |
| 可执行 | `powershell` | `pwsh` |
| 运行时 | .NET Framework 4.x | .NET 5+（Core 系） |
| 平台 | 仅 Windows | Windows/Linux/macOS |
| 许可 | 闭源（随 Windows） | **MIT 开源** |
| 版本演进 | 停止新特性（维护） | **持续更新**（年更） |
| 内置模块 | 全（含 Windows 专有） | 核心模块 + 按需装 |

**推荐**：新项目用 **PowerShell 7+（pwsh）**——跨平台、开源、持续更新。Windows PowerShell 5.1 仅在用老旧 Windows 专有模块（如某些老 AzureRM、Office 365 模块）时才不得不选。

```powershell
# 查版本
$PSVersionTable.PSVersion

# Linux/macOS 装 pwsh
brew install --cask powershell       # macOS
sudo apt install powershell          # Ubuntu（需先加微软源）

# 启动
pwsh                                 # 跨平台版
powershell                           # Windows 内置版（仅 Windows）
```

## 三、Cmdlet 与 Verb-Noun 规范

PowerShell 命令叫 **Cmdlet**（command-let），全部遵循 **Verb-Noun**（动词-名词）命名：

- **动词**来自**受控词表**（approved verbs）：`Get`（查询）、`Set`（设置）、`New`（新建）、`Remove`（删除）、`Start`/`Stop`（启停）、`Invoke`（调用）、`Test`（测试）、`Select`/`Where`/`ForEach`（管道操作）、`ConvertTo`/`ConvertFrom`（转换）...
- **名词**描述操作对象：`Process`（进程）、`Service`（服务）、`Item`（文件/目录项）、`Content`（文件内容）、`ChildItem`（子项）...

常见 Cmdlet：

| Cmdlet | 作用 | Bash 对应 |
| --- | --- | --- |
| `Get-ChildItem` | 列目录 | `ls` |
| `Set-Location` | 切目录 | `cd` |
| `Copy-Item` | 复制 | `cp` |
| `Remove-Item` | 删除 | `rm` |
| `Get-Content` | 读文件 | `cat` |
| `Set-Content` | 写文件 | `echo >` |
| `Get-Process` | 列进程 | `ps` |
| `Stop-Process` | 杀进程 | `kill` |
| `Get-Service` | 列服务 | `systemctl status` |
| `Invoke-WebRequest` | HTTP 请求 | `curl` |

**别名兼容**：为照顾 Bash 用户，PowerShell 内置别名 `ls`/`cd`/`cp`/`cat`/`rm`/`mv`/`curl`——但**脚本里用全名**（别名参数行为可能差异，且不可移植到非默认环境）。

### Get-Help / Get-Command / Get-Member

```powershell
Get-Help Get-Process -Examples       # 看文档+示例
Get-Command *process*                # 搜含 process 的命令
Get-Command -Verb Get -Noun *Item*   # 按 Verb-Noun 搜
Get-Process | Get-Member             # 看进程对象的属性/方法（最常用！）
```

`Get-Member`（别名 `gm`）是 PowerShell 最有价值的探索命令——任何对象 pipe 给它，立刻看到属性、方法、类型，无需查文档。

## 四、变量、数组、哈希

```powershell
$x = 42                    # 变量（$ 前缀，无需声明）
[string]$name = "Alice"    # 强类型声明
$names = "Alice","Bob"     # 数组（逗号分隔）
$arr = @(1, 2, 3)          # 显式数组
$hash = @{                 # 哈希表
    Name  = "Alice"
    Age   = 30
    Roles = @("admin","user")
}
$hash.Name                 # 取值（点号）
$hash["Age"]               # 取值（索引）

# 字符串插值（双引号）
$greeting = "Hello, $name, age $($hash.Age)"   # $(...) 嵌套表达式
```

## 五、与 Bash 文本管道的根本差异

```bash
# Bash：列 CPU 占用 >10% 的进程
ps aux | awk 'NR>1 && $3>10 {print $1, $3"%"}' | sort -k2 -rn
```

```powershell
# PowerShell：同样的事
Get-Process | Where-Object CPU -gt 10 | Select-Object Name, @{N='CPU%';E={[math]::Round($_.CPU,1)}} | Sort-Object CPU -Descending
```

差异：

- **Bash**：每个命令输出文本，下游用 `awk`/`grep`/`sed` 解析——格式脆弱、易出错、跨平台差异（BSD vs GNU）。
- **PowerShell**：输出对象，下游 `.属性` 访问——类型安全、属性稳定、跨平台一致。

代价：PowerShell **冷启动慢**（.NET 运行时初始化几百毫秒），不适合像 Bash 那样每秒调几十次子进程。所以 **Linux 服务器脚本仍用 Bash，Windows/Azure 运维用 PowerShell**。

## 下一步

理解了对象管道与 Cmdlet 后，下一步深入[Cmdlet 与管道](./guide-line/cmdlets-and-pipeline)（Verb-Noun 详解、Where-Object/Select-Object/ForEach-Object、参数绑定机制）与[跨平台场景](./guide-line/cross-platform)（pwsh 在 Windows/WSL/Azure 的运维实践）。
