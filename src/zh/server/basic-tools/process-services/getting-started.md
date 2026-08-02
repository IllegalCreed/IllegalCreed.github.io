---
layout: doc
outline: [2, 3]
---

# 入门：进程、信号、systemd 与 cron

> 基于 Linux 进程管理与服务管理 · 核于 2026-08

## 速查

- **进程 vs 程序**：程序是磁盘上的**可执行文件**（静态）；进程是程序运行起来的**实例**（动态，有独立的 PID、地址空间、文件描述符）。一个程序可同时跑多个进程（开 3 个浏览器窗口 = 3 个进程）。
- **进程状态**：`R` 运行/就绪、`S` 可中断睡眠（等待事件，多数进程常态）、`D` 不可中断睡眠（等 IO，不能被信号唤醒）、`Z` 僵尸（已退出但父进程未回收）、`T` 停止（被信号暂停）。
- **查看进程**：`ps aux`（快照，看全部）、`ps -ef`（看父子关系）、`top`/`htop`（动态实时，按 CPU/内存排序）。每行一个进程，关键字段 PID（进程号）、PPID（父 PID）、%CPU、%MEM、STAT（状态）、COMMAND。
- **信号（signal）**：通知进程发生的异步事件。常用：`SIGTERM`(15，优雅终止，默认 kill)、`SIGKILL`(9，强杀，**不可被捕获/忽略**，最后手段)、`SIGINT`(2，Ctrl-C)、`SIGSTOP`(19，暂停，不可忽略)、`SIGCONT`(18，继续)、`SIGHUP`(1，挂起/重载配置)。
- **`kill`**：`kill PID`（默认发 SIGTERM）、`kill -9 PID`（强杀）、`kill -l`（列所有信号）。`killall name`/`pkill -f pattern`（按名字杀）。
- **前后台**：`cmd &`（后台运行）、`Ctrl-Z`（挂起到后台暂停）、`jobs`（列后台任务）、`bg %1`（让 1 号任务后台继续）、`fg %1`（拉回前台）。`nohup cmd &`（脱离终端，关 SSH 也活着）。
- **systemd**：现代 Linux 的**初始化系统与服务管理器**（PID 1），用 `systemctl` 管理服务（unit）。替代了老的 SysVinit（/etc/init.d/ 脚本）。
- **`systemctl` 核心**：`start`（启动）、`stop`（停止）、`restart`（重启）、`reload`（重载配置不重启）、`status`（状态）、`enable`（设开机自启）、`disable`（取消自启）、`list-units`（列出所有）。
- **`enable` vs `start`**：`start` 是**现在**启动（临时）；`enable` 是设**开机**自启（持久）。两个独立——要现在跑且开机自启，两个都要。
- **`journalctl`**：查 systemd 收集的日志。`journalctl -u nginx`（某服务）、`-f`（实时跟踪，类似 tail -f）、`--since today`、`-p err`（只看错误级）。
- **cron**：定时任务。`crontab -e`（编辑当前用户的定时任务），每行一个任务：`分 时 日 月 周 命令`（五段式）。如 `0 3 * * * backup.sh`（每天凌晨 3 点跑备份）。
- **systemd timers**：systemd 的定时单元（.timer），比 cron 更精细（可精确到秒、有日志、支持依赖），是 cron 的现代替代。
- **进阶顺序**：[进程控制详解](./guide-line/process-control) → [systemd 与定时任务](./guide-line/systemd-and-cron) → [参考](./reference)。

## 一、进程：程序运行的实例

**程序（program）**是磁盘上的可执行文件（如 `/usr/bin/nginx`），是静态的代码与数据。**进程（process）**是程序被加载到内存运行起来的实例——它是动态的，拥有独立的：

- **PID**（Process ID）：内核分配的唯一进程号，从 1 开始（PID 1 是 init/systemd）。
- **地址空间**：独立的虚拟内存（代码段/数据段/堆/栈），进程间互不可见。
- **文件描述符表**：打开的文件、套接字、管道。
- **权限**：继承自启动它的用户（以 root 跑的进程有 root 权限）。
- **PPID**（Parent PID）：父进程的 PID。每个进程由父进程创建（fork），孤儿进程会被 init/systemd 收养。

一个程序可同时运行多个进程（开 3 个终端窗口 = 3 个 bash 进程，PID 不同）。`fork()` 创建子进程（复制父进程），`exec()` 加载新程序替换当前进程映像——这是 Linux 创建进程的标准模式（fork + exec）。

## 二、进程状态机

进程在其生命周期中会在多个状态间切换：

```
        fork() 创建
            │
            ▼
   ┌─────────────────┐
   │   R 运行/就绪    │ ← 在 CPU 上跑，或等待 CPU
   │  (Running/Ready)│
   └────────┬────────┘
            │ 等 IO/睡眠   ┌─────────────────┐
            ├─────────────→│  S 可中断睡眠    │ ← 等事件（IO完成/信号）
            │              │ (Interruptible) │   多数进程常态
            │              └────────┬────────┘
            │                       │ 事件就绪
            │ ←─────────────────────┘
            │
            │ 等慢 IO       ┌─────────────────┐
            ├─────────────→│  D 不可中断睡眠   │ ← 等磁盘 IO，不能被信号唤醒
            │              │(Uninterruptible) │   强杀也杀不掉，只能等 IO 完成
            │              └─────────────────┘
            │
            │ Ctrl-Z/信号   ┌─────────────────┐
            ├─────────────→│   T 停止         │ ← 被暂停（SIGSTOP）
            │              │  (Stopped)       │   SIGCONT 恢复
            │              └─────────────────┘
            │
            │ exit() 退出，父进程未 wait
            ▼
   ┌─────────────────┐
   │   Z 僵尸        │ ← 已死但父进程没回收（没调 wait）
   │  (Zombie)       │   占用 PID 不释放，需父进程回收或杀父进程
   └─────────────────┘
```

- **R（Running/Runnable）**：正在 CPU 上跑，或在就绪队列等 CPU。
- **S（Sleep）**：可中断睡眠，等待某个事件（IO 完成、信号到达）——**这是大多数进程的常态**（如 nginx 等连接、bash 等输入）。
- **D（Disk wait）**：不可中断睡眠，等慢速 IO（磁盘/网络）。**不能被信号唤醒**（连 `kill -9` 都无效），只能等 IO 完成。大量 D 状态进程通常意味着磁盘故障或 IO 瓶颈。
- **Z（Zombie）**：僵尸进程。子进程已 `exit()` 但父进程没调 `wait()` 回收，进程描述符还占着 PID。解决：让父进程回收（发 SIGCHLD）或杀父进程（让 init 收养并回收）。
- **T（Stopped）**：被 `SIGSTOP` 或 Ctrl-Z 暂停，`SIGCONT` 恢复。

`ps`/`top` 的 STAT 列显示这些字母（可能带附加符号如 `Ss`、`R+`，`s` 表示会话首进程、`+` 表示前台进程组）。

## 三、查看进程：ps / top / htop

**`ps`**（process snapshot）拍快照，看某一时刻的进程：

```
ps aux            # BSD 风格，看全部进程（最常用）
ps -ef            # System V 风格，看父子关系（PPID）
ps aux | grep nginx   # 找特定进程
ps -u alice       # 看某用户的进程
ps -p 1234 -o pid,ppid,cmd   # 看 PID 1234 的详情
```

`ps aux` 输出列：`USER`（属主）、`PID`、`%CPU`、`%MEM`、`VSZ`（虚拟内存）、`RSS`（物理内存）、`STAT`（状态）、`START`（启动时间）、`COMMAND`（命令）。

**`top`**（动态实时）持续刷新（默认 3 秒），按 CPU/内存排序，交互键 `P`（按 CPU 排）、`M`（按内存排）、`k`（杀进程）、`q`（退出）、`1`（看每个 CPU 核心）。

**`htop`** 是 top 的增强版（需单独安装），彩色界面、可横向滚动、鼠标点击操作、树形查看进程父子关系，比 top 直观得多。服务器排障首选 htop。

## 四、信号：进程控制的通用语言

**信号（signal）**是 Linux 通知进程异步事件的机制。`kill` 命令本质是「给进程发信号」，不只是「杀进程」。常用信号：

| 信号 | 编号 | 含义 | 能否捕获 |
| --- | --- | --- | --- |
| `SIGTERM` | 15 | 请求**优雅终止**（默认 kill 发这个），进程可捕获做清理 | ✅ 可捕获/忽略 |
| `SIGKILL` | 9 | **强杀**，内核直接终结，进程来不及清理 | ❌ **不可捕获/忽略** |
| `SIGINT` | 2 | 中断（Ctrl-C 触发），类似优雅终止 | ✅ 可捕获 |
| `SIGSTOP` | 19 | **暂停**进程（不可恢复地停在那一帧） | ❌ 不可忽略 |
| `SIGCONT` | 18 | 恢复暂停的进程继续运行 | ✅ |
| `SIGHUP` | 1 | 挂起（终端关闭时发），常被服务用作**重载配置** | ✅ |
| `SIGUSR1/2` | 10/12 | 用户自定义信号（应用自己定义用途） | ✅ |

- **`kill PID`**（默认发 SIGTERM）：请求进程自己优雅退出（flush 缓冲、关连接、留清理）。**首选**。
- **`kill -9 PID`**（SIGKILL）：内核直接杀，进程来不及做任何事（缓冲数据可能丢、临时文件可能残留）。**最后手段**，先试 `kill`，几秒后没退出再 `kill -9`。
- **`kill -l`**：列出所有信号名与编号。
- **`killall nginx`**：按进程名杀所有匹配的（注意可能误杀同名进程）。
- **`pkill -f "python app.py"`**：按完整命令行匹配杀（-f 匹配整个命令）。

## 五、systemd：现代服务管家

**systemd** 是现代 Linux（CentOS 7+/Ubuntu 16.04+/Debian 8+）的**初始化系统与服务管理器**，作为 PID 1 运行，负责：

- **启动系统**：引导后第一个跑的用户空间进程（PID 1），按依赖顺序拉起所有服务。
- **管理服务**：用 `systemctl` 控制 unit（服务、套接字、定时器等）的启停、自启、状态。
- **收集日志**：journald 守护进程统一收集所有 unit 的日志，用 `journalctl` 查询。
- **管理登录/网络/设备**：logind/networkd/udevd 等组件。

**`systemctl` 核心命令**：

```
systemctl start nginx      # 启动服务（现在）
systemctl stop nginx       # 停止
systemctl restart nginx    # 重启（先 stop 再 start，有短暂中断）
systemctl reload nginx     # 重载配置（不重启，无中断，需服务支持）
systemctl status nginx     # 查看状态（运行否、PID、最近日志）
systemctl enable nginx     # 设开机自启（持久）
systemctl disable nginx    # 取消开机自启
systemctl is-enabled nginx # 查是否设了自启
systemctl is-active nginx  # 查是否正在运行
systemctl list-units       # 列出所有已加载的 unit
systemctl list-unit-files  # 列出所有 unit 文件（含自启状态）
```

**`enable` vs `start` 是关键区分**：
- `start` 是**现在**启动（临时，重启后没了）。
- `enable` 是设**开机自启**（持久，但不会现在启动）。
- 要「现在跑 + 开机自启」：`systemctl enable --now nginx`（enable + start 一起做）。

服务配置文件是 **unit 文件**（`.service`），通常在 `/etc/systemd/system/`（管理员自定义）或 `/usr/lib/systemd/system/`（软件包自带）。改完 unit 文件要 `systemctl daemon-reload` 让 systemd 重新加载配置。

## 六、journalctl：统一日志查询

systemd 的 journald 收集所有 unit 的日志（不再散落在 /var/log/ 各文件），用 `journalctl` 查询：

```
journalctl -u nginx              # 看 nginx 服务的日志
journalctl -u nginx -f           # 实时跟踪（类似 tail -f）
journalctl --since today         # 今天的日志
journalctl --since "1 hour ago"  # 最近 1 小时
journalctl -p err                # 只看错误及以上级别
journalctl -u nginx --since "2026-08-01" --until "2026-08-02"
journalctl -k                    # 看内核日志（dmesg）
journalctl --disk-usage          # 看日志占多少磁盘
```

`-p` 优先级从低到高：debug(7)/info(6)/notice(5)/warning(4)/err(3)/crit(2)/alert(1)/emerg(0)。`-p err` 表示 err 及以上（err/crit/alert/emerg）。

## 七、cron 与 systemd timers：定时任务

**cron** 是传统的定时任务服务（crond 守护进程）。每个用户用 `crontab` 管理自己的定时任务：

```
crontab -e      # 编辑当前用户的定时任务
crontab -l      # 列出当前用户的定时任务
crontab -r      # 删除所有定时任务（谨慎）
sudo crontab -e -u alice  # 以 root 编辑 alice 的
```

cron 表达式是**五段式**：`分 时 日 月 周 命令`

```
┌──── 分（0-59）
│ ┌── 时（0-23）
│ │ ┌── 日（1-31）
│ │ │ ┌── 月（1-12）
│ │ │ │ ┌── 周（0-6，0/7=周日）
│ │ │ │ │
* * * * * command
```

示例：

- `0 3 * * * backup.sh`：每天凌晨 3 点。
- `*/5 * * * * check.sh`：每 5 分钟（`*/5` 表示「每 5 个单位」）。
- `0 0 * * 0`：每周日凌晨（周字段 0 = 周日）。
- `30 8 1 * *`：每月 1 号早上 8:30。

**systemd timers**（.timer unit）是 systemd 的定时方案，比 cron 更强大：

- 精度更高（可精确到秒/毫秒，cron 只到分钟）。
- 有日志（每次触发记到 journal，cron 默认只邮件）。
- 支持依赖与触发条件（OnCalendar/OnBootSec/OnUnitActiveSec）。
- 与服务 unit 配套（.timer 触发同名 .service）。

简单任务用 cron 够了；需要日志、精确控制、与服务集成时用 systemd timers。

## 下一步

理解了进程、信号、systemd 与 cron 的全貌后，下一步深入两块——[进程控制详解](./guide-line/process-control)（`ps`/`top`/`kill`/前后台的高频用法）与[systemd 与定时任务](./guide-line/systemd-and-cron)（unit 文件结构、`journalctl`、`crontab` 实战）。
