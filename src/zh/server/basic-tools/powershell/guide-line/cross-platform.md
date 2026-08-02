---
layout: doc
outline: [2, 3]
---

# 跨平台场景：pwsh、Windows、WSL 与 Azure

> 基于 PowerShell 7 · 核于 2026-08

## 速查

- **PowerShell 7（pwsh）**：跨平台版本，基于 .NET 5+，MIT 开源。Linux/macOS/Windows 全平台同源——一份脚本到处跑（前提是不用平台专有模块）。
- **安装**：Windows 用 MSI/winget；macOS 用 `brew install --cask powershell`；Linux 用包管理器（apt/dnf/yum，需先加微软源）或一键脚本。
- **Windows 场景**：系统管理首选——注册表（`HKLM:\` 像盘符）、服务（`Get-Service`）、Win32 API、Active Directory（`Get-ADUser`）、Office 365、Exchange。**AD/O365/Exchange 模块仅 Windows 完整可用**。
- **WSL 场景**：Windows Subsystem for Linux 里可以装 pwsh——在 Linux 环境里调用 Windows API/注册表；或从 WSL 互操作调用 Windows 侧的 powershell.exe。
- **Azure 场景**：**Azure PowerShell**（`Az` 模块）是 Azure 的事实运维工具——`Connect-AzAccount` 登录、`Get-AzVM` 查 VM、`New-AzResourceGroup` 建资源组。跨平台，Linux/macOS 上也能管 Azure。
- **Linux 上的 PowerShell**：补充而非替代 Bash——服务器脚本生态绑定 Bash（CI/Docker/cron），PowerShell 用于：跨平台运维脚本、复用 Windows PowerShell 技能、Azure/GitHub API 自动化。
- **与 Bash 协作**：pwsh 可调 `bash -c 'cmd'`；bash 可调 `pwsh -Command '...'`。混合环境按各自强项分工。
- **何时该用 PowerShell 而非 Bash**：① Windows 系统管理（注册表/AD/WMI）；② Azure/M365 运维；③ 需要结构化数据处理（对象管道）；④ 团队已有 PowerShell 技能栈。**反之 Linux 服务器脚本仍用 Bash**。

## 一、pwsh 跨平台：一份脚本到处跑

PowerShell 7 的核心卖点是**跨平台**——同一份 `.ps1` 脚本在 Windows、Linux、macOS 上跑（前提：不用平台专有模块如 AD/Exchange）。

### 安装

```powershell
# Windows
winget install Microsoft.PowerShell           # 推荐
# 或下载 MSI：github.com/PowerShell/PowerShell/releases

# macOS
brew install --cask powershell

# Linux（Ubuntu，需先加微软源）
source /etc/os-release
wget -q https://packages.microsoft.com/config/ubuntu/$VERSION_ID/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update && sudo apt install -y powershell

# 一键脚本（任意 Linux）
curl -fsSL https://aka.ms/install-powershell.ps1 | sudo bash
```

### 启动与验证

```powershell
pwsh                          # 启动
$PSVersionTable               # 看版本（确认是 7.x）

# 退出
exit
```

### 跨平台注意点

- **路径分隔符**：PowerShell 同时支持 `\` 和 `/`——`Get-ChildItem C:/Users` 和 `Get-ChildItem C:\Users` 都行（内部规范化）。
- **平台专有模块**：`Get-Service`/`Get-EventLog`/AD/Exchange 在 Linux 上不可用或行为不同——脚本要跨平台需检测 `$IsWindows`/`$IsLinux`/`$IsMacOS`。
- **执行策略**：Windows 默认 `Restricted`（不能跑脚本），需 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`；Linux/macOS 无此限制。

```powershell
# 跨平台脚本框架
if ($IsWindows) {
    # Windows 专有逻辑
} elseif ($IsLinux) {
    # Linux 专有逻辑
} else {
    # macOS
}
```

## 二、Windows 场景：系统管理首选

Windows 是 PowerShell 的大本营——它深度集成 Windows 系统层，是 Windows 管理员无可替代的工具：

```powershell
# 注册表（HKLM:\ / HKCU:\ 像盘符）
Get-ChildItem HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall |
    ForEach-Object { Get-ItemProperty $_.PSPath } |
    Select-Object DisplayName, DisplayVersion |
    Where-Object DisplayName

# 服务
Get-Service | Where-Object Status -eq 'Running'
Start-Service -Name 'Spooler'
Stop-Service -Name 'wuauserv' -Force

# 进程
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Stop-Process -Name chrome -Force

# WMI / CIM（硬件信息）
Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, @{N='Size(GB)';E={$_.Size/1GB}}
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores

# 事件日志
Get-WinEvent -LogName Application -MaxEvents 20 |
    Where-Object LevelDisplayName -eq 'Error'

# 本地用户/组
Get-LocalUser
New-LocalUser -Name "deploy" -Description "Deploy Account"
```

### Active Directory / Office 365

```powershell
# AD（需装 ActiveDirectory 模块，通常仅 Windows）
Import-Module ActiveDirectory
Get-ADUser -Filter * -Properties DisplayName, LastLogonDate |
    Select-Object DisplayName, LastLogonDate |
    Sort-Object LastLogonDate

# Office 365 / Microsoft Graph（跨平台，新方式）
Connect-MgGraph -Scopes "User.Read.All"
Get-MgUser -Top 10 | Select-Object DisplayName, Mail
```

## 三、WSL：Linux 与 Windows 的桥梁

**WSL**（Windows Subsystem for Linux）让你在 Windows 上跑 Linux 发行版（Ubuntu/Debian 等）。PowerShell 在 WSL 场景的角色：

```powershell
# 1. WSL 里装 pwsh：在 Linux 环境里调 Windows API
# （在 WSL bash 里）
sudo apt install powershell
pwsh
# 现在在 Linux 环境里用 PowerShell，但仍能访问 Windows 文件（/mnt/c/）

# 2. 从 WSL 调 Windows 侧的 powershell.exe
powershell.exe -Command "Get-Process | Select-Object -First 5"

# 3. 从 Windows PowerShell 调 WSL
wsl ls -la /home
wsl bash -c "apt list --installed"
```

WSL + PowerShell 的典型用法：在 Linux 开发环境里写脚本，同时需要操作 Windows 系统层（注册表、服务、AD）时切到 PowerShell。

## 四、Azure 场景：事实运维工具

**Azure PowerShell**（`Az` 模块）是 Azure 云资源管理的官方工具，跨平台——Linux/macOS/Windows 上都能用：

```powershell
# 安装 Az 模块
Install-Module -Name Az -Scope CurrentUser -Repository PSGallery -Force

# 登录
Connect-AzAccount                    # 弹浏览器登录
Connect-AzAccount -UseDeviceAuthentication   # 设备码（无浏览器场景）

# 查询资源
Get-AzVM | Select-Object Name, ResourceGroupName, Location
Get-AzResourceGroup | Where-Object Location -eq 'eastus'
Get-AzStorageAccount | Select-Object StorageAccountName, Location

# 创建资源
New-AzResourceGroup -Name "myapp-prod" -Location "eastus"
New-AzVM -ResourceGroupName "myapp-prod" -Name "vm01" -Image "UbuntuLTS"

# 操作资源
Start-AzVM -ResourceGroupName "myapp-prod" -Name "vm01"
Stop-AzVM -ResourceGroupName "myapp-prod" -Name "vm01" -Force

# 删除（小心！）
Remove-AzResourceGroup -Name "myapp-prod" -Force
```

- **CI/CD 集成**：GitHub Actions / Azure DevOps 用 `Azure/login` action + `azure/powershell` action 跑 PowerShell 脚本管 Azure——这是 IaC（基础设施即代码）的常见模式（与 Terraform 互补）。
- **对象管道优势**：Azure 资源是复杂对象，PowerShell 的对象管道让筛选/聚合无需 jq/awk——`Get-AzVM | Where-Object Location -eq 'eastus' | Measure-Object` 一行完成。

## 五、与 Bash 协作的边界

PowerShell 与 Bash **互补而非互斥**，按各自强项分工：

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| Linux 服务器脚本 / CI / cron | Bash | 生态绑定，POSIX 可移植 |
| Windows 系统管理 / AD / 注册表 | PowerShell | 深度集成，无可替代 |
| Azure / M365 运维 | PowerShell | 官方工具，对象管道适合复杂资源 |
| 跨平台运维脚本（Win+Linux） | PowerShell（pwsh） | 一份脚本到处跑 |
| 文本流处理（日志分析） | Bash | 管道+grep/sed/awk 经典高效 |
| 结构化数据处理（JSON/对象） | PowerShell | 对象管道，类型安全 |
| 启动速度敏感（高频子进程） | Bash | pwsh 冷启动慢 |

```bash
# Bash 调 PowerShell
pwsh -Command "Get-Process | Where-Object CPU -gt 10 | Select-Object Name"
result=$(pwsh -Command "...")   # 捕获输出

# PowerShell 调 Bash
bash -c "ls -la | grep '\.log$'"
$result = bash -c "df -h | awk 'NR>1 {print \$1, \$4}'"
```

**选型原则**：Linux 主战场用 Bash，Windows/Azure 主战场用 PowerShell，混合环境两者协作。

## 六、模块管理与 PSGallery

```powershell
# PowerShell 生态的「npm」是 PSGallery（powershellgallery.com）
Get-PSRepository                       # 看仓库
Set-PSRepository PSGallery -InstallationPolicy Trusted   # 信任

# 装模块（类似 pip install）
Install-Module Az -Scope CurrentUser
Install-Module Pester -Scope CurrentUser      # 测试框架

# 查/更新/删
Get-InstalledModule
Update-Module Az
Uninstall-Module Az

# 模块自动加载：用命令时若模块未导入，PowerShell 自动导入（已装的话）
Get-Process    # 自动加载 Microsoft.PowerShell.Management
```

## 下一步

理解了 pwsh 跨平台与各场景后，可进入 [参考](../reference) 速查常用 Cmdlet、与 Bash 对照表、易错点，或前往 [Bash](../../bash/)、[Zsh](../../zsh/) 对比其他 shell 范式。
