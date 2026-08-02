---
layout: doc
outline: [2, 3]
---

# 参考：PowerShell 速查、Cmdlet 清单、与 Bash 对照

> 基于 PowerShell 7 · 核于 2026-08

## 速查

- **PowerShell 定义**：跨平台 shell + 脚本语言，对象管道是核心。
- **两版本**：Windows PowerShell 5.1（`powershell`，仅 Win）vs PowerShell 7+（`pwsh`，跨平台，推荐）。
- **Cmdlet**：`Verb-Noun` 命名；动词受控（Get/Set/New/Remove/Start/Stop/Invoke/Test/...）。
- **对象管道**：`|` 传 .NET 对象；`$_` 当前对象；`.属性` 直接访问。
- **三大管道**：`Where-Object`（`?` 过滤）、`Select-Object`（`select` 选列）、`ForEach-Object`（`%` 遍历）。
- **探索**：`Get-Help`、`Get-Command`、`Get-Member`（看对象结构）。
- **跨平台**：`pwsh` 装 Linux/macOS；`$IsWindows`/`$IsLinux`/`$IsMacOS` 检测平台。

## 一、常用 Cmdlet 速查

### 文件与目录

| Cmdlet | 别名 | 作用 |
| --- | --- | --- |
| `Get-ChildItem` | `ls`/`dir`/`gci` | 列目录 |
| `Set-Location` | `cd`/`chdir`/`sl` | 切目录 |
| `Push-Location`/`Pop-Location` | `pushd`/`popd` | 目录栈 |
| `Copy-Item` | `cp`/`copy`/`ci` | 复制 |
| `Move-Item` | `mv`/`move`/`mi` | 移动 |
| `Remove-Item` | `rm`/`del`/`ri` | 删除 |
| `New-Item` | `ni` | 新建文件/目录（`-ItemType Directory`） |
| `Get-Content` | `cat`/`gc` | 读文件 |
| `Set-Content` | `sc` | 写文件（覆盖） |
| `Add-Content` | `ac` | 追加 |
| `Test-Path` | — | 测试路径存在 |
| `Resolve-Path` | `rvpa` | 解析相对路径 |

### 进程与服务

| Cmdlet | 作用 |
| --- | --- |
| `Get-Process` (`ps`/`gps`) | 列进程 |
| `Stop-Process` (`kill`/`spps`) | 杀进程 |
| `Start-Process` | 启动进程 |
| `Get-Service` (`gsv`) | 列服务 |
| `Start-Service`/`Stop-Service`/`Restart-Service` | 服务启停 |

### 管道操作

| Cmdlet | 别名 | 作用 |
| --- | --- | --- |
| `Where-Object` | `?`/`where` | 过滤 |
| `Select-Object` | `select` | 选列/取前 N/去重 |
| `ForEach-Object` | `%`/`foreach` | 遍历映射 |
| `Sort-Object` | `sort` | 排序 |
| `Group-Object` | `group` | 分组计数 |
| `Measure-Object` | `measure` | 统计（sum/avg/max） |
| `Compare-Object` | `compare`/`diff` | 比较两集合 |
| `Tee-Object` | `tee` | 分流（写文件+继续） |

### 输出与转换

| Cmdlet | 作用 |
| --- | --- |
| `Out-File` | 写文件 |
| `Out-Host` | 分页显示 |
| `Out-Null` | 丢弃 |
| `Out-GridView` | GUI 表格（Windows） |
| `Format-Table`/`Format-List`/`Format-Wide` | 格式化显示 |
| `ConvertTo-Json`/`ConvertFrom-Json` | JSON |
| `ConvertTo-Csv`/`ConvertFrom-Csv` | CSV |
| `ConvertTo-Html` | HTML |
| `Export-Csv`/`Import-Csv` | CSV 文件读写 |
| `Export-Clixml`/`Import-Clixml` | 对象序列化（PS 专有） |

### 网络

| Cmdlet | 作用 |
| --- | --- |
| `Invoke-WebRequest` (`iwr`/`curl`/`wget`) | HTTP 请求 |
| `Invoke-RestMethod` (`irm`) | REST API（自动解析 JSON/XML） |
| `Test-Connection` (`ping`) | ping |
| `Test-NetConnection` | 网络诊断（含端口） |

### 信息与帮助

| Cmdlet | 作用 |
| --- | --- |
| `Get-Help` (`help`/`man`) | 文档（`-Examples`/`-Detailed`/`-Online`） |
| `Get-Command` (`gcm`) | 搜命令 |
| `Get-Member` (`gm`) | 看对象属性方法 |
| `Get-Alias` (`gal`) | 看别名 |
| `Get-Variable` | 列变量 |
| `Write-Host`/`Write-Output`/`Write-Error`/`Write-Warning` | 输出 |

## 二、运算符速查

```powershell
# 比较（不区分大小写；加 c 前缀区分大小写：-ceq -cne）
-eq / -ne          # 等于 / 不等于
-gt / -ge / -lt / -le   # 大于/大于等于/小于/小于等于
-like / -notlike   # 通配匹配（* ?）
-match / -notmatch # 正则匹配
-contains / -in    # 集合包含
-is / -isnot        # 类型判断

# 逻辑
-and / -or / -not / -xor
!                  # 非（简写）

# 算术
+ - * / %
++ --

# 位
-band -bor -bxor -bnot -shl -shr

# 重定向
>  >>              # stdout 到文件（覆盖/追加）
2> 2>>             # stderr
2>&1               # 合并
*>                 # 全部流
```

⚠️ PowerShell 比较用 `-eq`/`-gt`（不是 `==`/`>`）——这是与 C/JS/Python 的最大语法差异之一。

## 三、变量与数据结构

```powershell
$x = 42                         # 变量
[int]$count = 0                 # 强类型
[string]$name = "Alice"
[double]$pi = 3.14

# 数组
$arr = 1, 2, 3
$arr = @(1, 2, 3)
$arr[0]                         # 取元素
$arr.Count                      # 长度
$arr += 4                       # 追加

# 哈希表（有序字典用 [ordered]）
$hash = @{ Name="Alice"; Age=30 }
$hash = [ordered]@{ Name="Alice"; Age=30 }
$hash.Name                      # 取值
$hash["Age"]

# 范围
1..10                           # 1 到 10 的数组
$a..$b

# 特殊变量
$_      / $PSItem               # 管道当前对象
$args                           # 脚本参数
$PSBoundParameters              # 已绑定参数
$error                          # 错误数组
$?                              # 上一条成功与否（布尔）
$null                           # null
$true / $false                  # 布尔
$PSScriptRoot                   # 脚本所在目录
$profile                        # 配置文件路径
```

## 四、控制流

```powershell
# if / elseif / else
if ($x -gt 10) { ... }
elseif ($x -gt 5) { ... }
else { ... }

# switch（强大，支持通配/正则）
switch ($status) {
    "running"  { "运行中"; break }
    "stopped"  { "已停止"; break }
    default    { "未知" }
}

# for / while / do
for ($i=0; $i -lt 10; $i++) { ... }
while ($x -lt 100) { ... }
do { ... } while (...)
do { ... } until (...)

# foreach（遍历集合，非管道）
foreach ($item in $collection) { ... }

# try / catch / finally
try { Get-Content $path -ErrorAction Stop }
catch [System.IO.FileNotFoundException] { "文件不存在" }
catch { "其他错误：$_" }
finally { "清理" }

# 函数
function Greet {
    param([string]$Name = "World")
    "Hello, $Name"
    return 0       # 返回退出码（stdout 通过管道返回）
}
Greet -Name "Alice"
```

## 五、与 Bash 对照表

| 任务 | Bash | PowerShell |
| --- | --- | --- |
| 列目录 | `ls -la` | `Get-ChildItem` / `ls` |
| 切目录 | `cd /tmp` | `Set-Location /tmp` / `cd` |
| 复制 | `cp a b` | `Copy-Item a b` / `cp` |
| 删除 | `rm -rf x` | `Remove-Item -Recurse -Force x` |
| 读文件 | `cat f` | `Get-Content f` / `cat` |
| 写文件 | `echo x > f` | `Set-Content f "x"` |
| 追加 | `echo x >> f` | `Add-Content f "x"` |
| 进程 | `ps aux` | `Get-Process` |
| 杀进程 | `kill 1234` | `Stop-Process -Id 1234` |
| 服务 | `systemctl status nginx` | `Get-Service nginx` |
| HTTP | `curl http://x` | `Invoke-WebRequest http://x` |
| JSON | `jq '.field'` | `ConvertFrom-Json \| Select field` |
| 管道过滤 | `\| grep pat` | `\| Where-Object Name -like '*pat*'` |
| 排序 | `\| sort -k2` | `\| Sort-Object 属性` |
| 取前 N | `\| head -n 5` | `\| Select-Object -First 5` |
| 比较 | `==` `>` `<` | `-eq` `-gt` `-lt` |
| 逻辑 | `&&` `\|\|` | `-and` `-or` |
| 变量 | `$x` | `$x` |
| 命令替换 | `$(cmd)` | `$(cmd)` 或 `cmd`（直接管道） |

## 六、易错点清单

- **比较用 `-eq`/`-gt` 而非 `==`/`>`**：`if ($x > 5)` 会把 `>` 当重定向符。用 `-gt`。
- **`-Filter` 参数语法**：`Get-ChildItem -Filter *.txt`（用通配）vs `-Include *.txt`（需 `-Recurse` 或路径带通配）——两者行为不同，常见坑。
- **格式化破坏管道**：`Format-Table` 输出格式化对象，下游拿不到属性。格式化应是最后一环。
- **别名不可移植**：`ls` 在 PowerShell 是 `Get-ChildItem`（行为与 Bash 的 `ls` 不同），脚本里用全名。
- **执行策略**：Windows 默认 `Restricted` 不能跑脚本，需 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`。Linux/macOS 无此限制。
- **`Write-Host` vs `Write-Output`**：前者写控制台（不进管道），后者进管道。脚本里要管道用 `Write-Output` 或直接输出表达式。
- **`return` 返回值**：PowerShell 函数所有未捕获的输出都进管道（不只 `return`）。`return $x` 等价输出 `$x` 后退出。
- **大小写**：比较默认不区分大小写（`-eq`），区分用 `-ceq`。这点与多数语言相反。
- **`$_` 与脚本块**：`ForEach-Object { ... }` 里 `$_` 是当前项；`foreach ($x in $col)` 用自定义变量 `$x`。
- **5.1 vs 7 差异**：5.1 无 `pwsh`、无 `ConvertFrom-Json -AsHashtable`、某些模块（老 AzureRM）仅 5.1。新项目用 7。
- **路径带空格**：PowerShell 对空格路径更宽容（引号即可），但仍建议加引号：`Get-Content "my file.txt"`。
- **`Invoke-WebRequest` 与 `curl.exe`**：别名 `curl` 指向 `Invoke-WebRequest`（参数不同）；要用真 curl 写 `curl.exe`。

## 七、进阶方向（链接其他叶）

- [Bash](../bash/) —— 服务器默认 shell、文本管道、POSIX 脚本
- [Zsh](../zsh/) —— 交互日常驱动、macOS 默认、补全系统
- [文件系统与基础命令](../) —— `ls`/`cd`/`cp`/`find` 等通用命令
- [进程管理与服务（systemd）](../) —— Linux 服务管理（与 PowerShell 的 Get-Service 对照）

## 权威链接

- [PowerShell 官方文档 - Microsoft Learn](https://learn.microsoft.com/powershell/)
- [PowerShell GitHub](https://github.com/PowerShell/PowerShell)
- [PowerShell - Wikipedia](https://en.wikipedia.org/wiki/PowerShell)
- [PowerShell Gallery（模块仓库）](https://www.powershellgallery.com/)
- [Azure PowerShell 文档](https://learn.microsoft.com/powershell/azure/)
- 本站幻灯片：<a href="/SlideStack/powershell-slide/" target="_blank">PowerShell</a>
