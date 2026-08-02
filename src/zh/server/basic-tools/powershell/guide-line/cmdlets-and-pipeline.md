---
layout: doc
outline: [2, 3]
---

# Cmdlet 与对象管道：Verb-Noun 与参数绑定

> 基于 PowerShell 7 · 核于 2026-08

## 速查

- **Cmdlet 命名**：`Verb-Noun`——动词来自受控词表（Get/Set/New/Remove/Start/Stop/Invoke/Test/Convert/Select/Where/ForEach/Measure/Compare/Out/Write...），名词描述对象。**自描述、可预测**。
- **对象管道**：`|` 传 .NET 对象而非文本。下游 `$_`（管道当前对象）+ `.属性`/`.方法` 直接访问。
- **三大管道 Cmdlet**：`Where-Object`（过滤，`?` 别名）、`Select-Object`（选列/取前 N，`select`）、`ForEach-Object`（遍历映射，`%`）。
- **属性表达式**：`Select-Object @{N='名';E={表达式}}` 自定义输出列；`Sort-Object 属性 -Descending` 排序；`Group-Object 属性` 分组计数。
- **参数绑定**：PowerShell 自动把管道对象的属性按**参数名/类型**绑定到下游 Cmdlet 的参数（`-Name` 接受 ByPropertyName）。强类型，比 Bash 的位置传参安全。
- **`$_` 与 `$PSItem`**：管道当前对象的别名（等价）。`Where-Object {$_.CPU -gt 10}`。
- **简化语法**：`Where-Object CPU -gt 10`（无脚本块，属性名直接做参数）——v3+ 简化语法，可读性高。
- **`Get-Member`**：探索对象属性方法的最强工具——`Get-Process | Get-Member` 看进程对象结构。
- **输出格式化**：`Format-Table`/`Format-List`/`Format-Wide`（仅显示，破坏管道——格式化应是管道最后一环）。
- **`Out-*` Cmdlet**：`Out-File`（写文件）、`Out-Host`（显示）、`Out-GridView`（GUI 表格）、`Out-Null`（丢弃）。

## 一、Verb-Noun：自描述的命令命名

PowerShell 强制 Cmdlet 遵循 `Verb-Noun` 规范，动词来自 [approved verbs](https://learn.microsoft.com/powershell/scripting/developer/cmdlet/approved-verbs) 受控词表。这让命令**自描述、可预测**——你看到 `Get-` 就知道是查询、`Set-` 是修改、`New-` 是新建、`Remove-` 是删除、`Stop-` 是停止。

```powershell
# 动词分组（按语义）
# Get（查询）   Get-Process Get-Service Get-ChildItem Get-Content
# Set（设置）   Set-Location Set-Content Set-Variable
# New（新建）   New-Item New-Object New-LocalUser
# Remove（删除）Remove-Item Remove-Variable
# Start/Stop    Start-Service Stop-Process Start-Job
# Invoke（调用）Invoke-WebRequest Invoke-Command Invoke-Expression
# Test（测试）   Test-Path Test-Connection Test-NetConnection
# Convert       ConvertTo-Json ConvertFrom-Csv ConvertTo-Html
# Select/Where/ForEach  管道操作
# Measure       Measure-Object（求和/平均/计数）
# Out/Write     Out-File Write-Host Write-Output
```

```powershell
# 按动词搜
Get-Command -Verb Get -Noun *Item*
# 按名词搜
Get-Command -Noun Service
# 模糊搜
Get-Command *process*
```

⚠️ 微软在加载模块时会**警告非规范动词**（如自定义 `List-` 而非 `Get-`）——这是规范化的强制力。

## 二、对象管道：核心范式

```powershell
# 例：找出 CPU 占用 >10% 的进程，按 CPU 降序，取前 5
Get-Process |
    Where-Object CPU -gt 10 |           # 过滤
    Sort-Object CPU -Descending |        # 排序
    Select-Object Name, Id, CPU -First 5 # 选列+取前5
```

每一步传的都是**对象**，下游直接访问属性——无需解析文本。

### `$_` / `$PSItem`：管道当前对象

```powershell
# 完整脚本块语法
Get-Process | Where-Object { $_.CPU -gt 10 -and $_.Name -like 'chrome*' }

# 简化语法（v3+，无需 $_ 和 {}）
Get-Process | Where-Object CPU -gt 10
Get-Service | Where-Object Status -eq 'Running'
```

- **`$_`** 是管道当前对象的别名，等价 `$PSItem`。
- **简化语法**只支持单一比较（`属性 运算符 值`），复杂条件（`-and`/`-or`）用脚本块。

### 三大管道 Cmdlet

| Cmdlet | 别名 | 作用 | 例子 |
| --- | --- | --- | --- |
| `Where-Object` | `?` | 过滤 | `? {$_.CPU -gt 10}` |
| `Select-Object` | `select` | 选列/取前 N/去重 | `select Name, CPU -First 5` |
| `ForEach-Object` | `%` | 遍历映射 | `% { $_.Name.ToUpper() }` |
| `Sort-Object` | `sort` | 排序 | `sort CPU -Descending` |
| `Group-Object` | `group` | 分组计数 | `group Status` |
| `Measure-Object` | `measure` | 统计（和/均/最大） | `measure CPU -Sum` |
| `Compare-Object` | `compare` | 比较两集合 | `compare $a $b` |

### 自定义属性（计算属性）

```powershell
# 输出中加一列计算值
Get-Process |
    Select-Object Name,
        @{N='CPU%';E={[math]::Round($_.CPU, 2)}},
        @{N='Mem(MB)';E={[math]::Round($_.WS/1MB, 1)}}

# N=Name（列名）E=Expression（计算表达式）
```

## 三、参数绑定：管道对象如何传给下游

PowerShell 的参数绑定是它相对 Bash 的重大优势——**按参数名/类型自动匹配**，而非 Bash 的位置传参：

```powershell
# Stop-Service 的 -Name 参数接受 ByPropertyName 绑定
# 即：上游对象的 Name 属性会自动绑到 -Name
Get-Service | Where-Object Status -eq 'Running' | Stop-Service -WhatIf
# 这里 Get-Service 输出的对象有 Name 属性，自动绑到 Stop-Service -Name
```

绑定有两种方式：

1. **ByValue**：整个对象按类型绑定（如 `Get-Process` 输出 Process 对象，`Stop-Process` 接受 Process 对象）。
2. **ByPropertyName**：对象的某属性名匹配参数名（如 Name 属性 → `-Name` 参数）。

查看绑定方式：`Get-Help Stop-Process -Parameter Name`（看 `Accept pipeline input?` 字段）。

对比 Bash：Bash 管道是纯 stdin 文本，下游命令要自己 `$1`/`$2` 解析——无类型安全、位置依赖、易错。

## 四、Get-Member：探索对象

`Get-Member`（别名 `gm`）是 PowerShell 最有价值的探索工具——任何对象 pipe 给它，立刻看到属性、方法、类型：

```powershell
PS> Get-Process | Select-Object -First 1 | Get-Member

   TypeName: System.Diagnostics.Process

Name        MemberType     Definition
----        ----------     ----------
Handles     AliasProperty  Handles = Handlecount
Name        AliasProperty  Name = ProcessName
...
Kill        Method         void Kill()
Start       Method         void Start()
WaitForExit Method         bool WaitForExit(int milliseconds)
CPU         Property       float CPU {get;}
Id          Property       int Id {get;}
WS          Property       long WS {get;set;}        # WorkingSet 内存
```

看到 `CPU` 是 float、`Id` 是 int、有 `Kill()` 方法——直接知道能用什么，无需查文档。

## 五、输出格式化（小心破坏管道）

```powershell
# 格式化（仅用于显示）
Get-Process | Format-Table Name, CPU -AutoSize
Get-Process | Format-List Name, CPU, Id
Get-Process | Format-Wide Name -Column 4

# 输出到...
... | Out-File procs.txt       # 写文件
... | Out-Host                 # 分页显示
... | Out-GridView             # GUI 表格（Windows）
... | Out-Null                 # 丢弃（只取副作用）

# 转换格式
Get-Process | Select-Object Name, CPU | ConvertTo-Json
Get-Process | Select-Object Name, CPU | ConvertTo-Csv
Get-Process | Select-Object Name, CPU | ConvertTo-Html | Out-File procs.html
```

⚠️ **格式化破坏管道**：`Format-Table`/`Format-List` 输出的是格式化对象（`Format.PSObject`），不再是原始对象——下游管道拿不到属性。所以**格式化应是管道最后一环**（或紧接 `Out-File`）。

## 六、错误处理与脚本

```powershell
# try/catch（PowerShell 的 try-finally）
try {
    Get-Content $path -ErrorAction Stop | ...
} catch {
    Write-Error "读取失败：$_"
    exit 1
} finally {
    # 清理
}

# ErrorAction 控制错误行为
Get-ChildItem -ErrorAction SilentlyContinue   # 静默忽略错误
Get-ChildItem -ErrorAction Stop               # 错误即抛异常（配合 try/catch）
# 默认 Continue：显示错误但继续
```

```powershell
# 脚本：first.ps1
param(
    [string]$Path = ".",
    [int]$Top = 10
)
# $PSBoundParameters 看传入参数
# 严格模式
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
```

## 下一步

掌握了 Cmdlet 与对象管道后，下一步进入[跨平台场景](./cross-platform)——pwsh 在 Windows/Linux/WSL/Azure 的安装与运维实践、与 Bash 协作的边界。
