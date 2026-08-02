---
layout: doc
outline: [2, 3]
---

# 参考：信号、systemctl、cron 速查

> 基于 Linux 进程管理与服务管理 · 核于 2026-08

## 速查

- **进程状态**：`R` 运行/就绪、`S` 可中断睡眠（常态）、`D` 不可中断睡眠（等IO）、`Z` 僵尸、`T` 停止。
- **查看进程**：`ps aux`（快照）、`top`/`htop`（实时）、`pgrep name`（按名查PID）。
- **信号**：`SIGTERM`(15，优雅终止，默认)、`SIGKILL`(9，强杀，不可捕获)、`SIGINT`(2，Ctrl-C)、`SIGSTOP`(19，暂停)、`SIGCONT`(18，继续)、`SIGHUP`(1，重载配置)。
- **`kill`**：`kill PID`（SIGTERM）、`kill -9 PID`（强杀）、`kill -l`（列信号）、`pkill -f pattern`（按命令行匹配杀）。
- **前后台**：`cmd &`（后台）、`Ctrl-Z`（挂起）、`jobs`（列任务）、`bg %N`（后台继续）、`fg %N`（拉前台）、`nohup cmd &`（脱离终端）。
- **systemctl**：`start`/`stop`/`restart`/`reload`/`status`/`enable`/`disable`/`is-active`/`is-enabled`。
- **enable vs start**：`start` 现在启动（临时）；`enable` 设开机自启（持久）；`enable --now` 两个一起。
- **journalctl**：`-u 服务`、`-f`（跟踪）、`--since`、`-p err`、`-k`（内核）。
- **cron 五段式**：`分 时 日 月 周 命令`；`*/5`（每5单位）、`0 3 * * *`（每天3点）、`0 0 * * 0`（周日凌晨）。
- **systemd timers**：比 cron 精细（到秒）、有日志、支持依赖，是 cron 的现代替代。

## 一、信号速查表

| 信号 | 编号 | 名称 | 含义 | 可捕获 |
| --- | --- | --- | --- | --- |
| `SIGHUP` | 1 | Hangup | 终端挂起；常作「重载配置」 | ✅ |
| `SIGINT` | 2 | Interrupt | 中断（Ctrl-C） | ✅ |
| `SIGQUIT` | 3 | Quit | 退出（Ctrl-\\，生成 core） | ✅ |
| `SIGKILL` | 9 | Kill | **强杀**，内核直接终结 | ❌ |
| `SIGSEGV` | 11 | Segfault | 段错误（非法内存访问） | ✅（默认终止） |
| `SIGTERM` | 15 | Terminate | 优雅终止（**kill 默认**） | ✅ |
| `SIGSTOP` | 19 | Stop | 暂停（不可恢复地停在当前） | ❌ |
| `SIGCONT` | 18 | Continue | 恢复暂停的进程 | ✅ |
| `SIGCHLD` | 17 | Child | 子进程状态变化通知父进程 | ✅ |
| `SIGUSR1` | 10 | User1 | 用户自定义 | ✅ |
| `SIGUSR2` | 12 | User2 | 用户自定义 | ✅ |

`kill -l` 列出全部信号。编号在不同架构可能略有差异（如 SIGKILL 在 x86 是 9）。

## 二、ps / top 命令速查

| 命令 | 作用 |
| --- | --- |
| `ps aux` | BSD 风格，看全部进程快照（最常用） |
| `ps -ef` | System V 风格，含 PPID（看父子关系） |
| `ps aux \| grep nginx` | 找 nginx 进程 |
| `ps -u alice` | 看 alice 用户的进程 |
| `ps -p 1234 -o pid,ppid,stat,cmd` | 看 PID 1234 详情 |
| `pgrep -f "python app"` | 按命令行匹配查 PID |
| `pstree -p` | 树形显示进程父子关系 |
| `top` | 动态实时监控（P 按 CPU、M 按内存、k 杀、q 退） |
| `htop` | top 增强版（彩色、鼠标、树形） |

**`ps aux` 列含义**：

```
USER    PID   %CPU  %MEM  VSZ    RSS    TTY  STAT  START  COMMAND
root    1234  1.5   2.3   128444 32120  ?    Ss    10:00  /usr/sbin/nginx
┊       ┊     ┊     ┊     ┊      ┊      ┊    ┊     ┊      └─ 启动命令
┊       ┊     ┊     ┊     ┊      ┊      ┊    ┊     └─ 启动时间
┊       ┊     ┊     ┊     ┊      ┊      ┊    └─ 状态（R/S/D/Z/T + 附加）
┊       ┊     ┊     ┊     ┊      ┊      └─ 终端（? 表示无终端/守护进程）
┊       ┊     ┊     ┊     ┊      └─ 物理内存（KB）
┊       ┊     ┊     ┊     └─ 虚拟内存（KB）
┊       ┊     ┊     └─ 内存占用百分比
┊       ┊     └─ CPU 占用百分比
┊       └─ 进程号（PID）
└─ 属主用户
```

## 三、systemctl 命令速查

| 命令 | 作用 |
| --- | --- |
| `systemctl start nginx` | 启动服务（现在） |
| `systemctl stop nginx` | 停止服务 |
| `systemctl restart nginx` | 重启（stop + start，有短暂中断） |
| `systemctl reload nginx` | 重载配置（不中断，需服务支持） |
| `systemctl status nginx` | 查状态（运行/PID/最近日志） |
| `systemctl enable nginx` | 设开机自启 |
| `systemctl disable nginx` | 取消开机自启 |
| `systemctl enable --now nginx` | 设自启 + 现在启动 |
| `systemctl is-active nginx` | 查是否运行（输出 active/inactive） |
| `systemctl is-enabled nginx` | 查是否设自启（enabled/disabled） |
| `systemctl list-units` | 列已加载的 unit |
| `systemctl list-unit-files` | 列所有 unit 文件（含自启状态） |
| `systemctl list-units --failed` | 列启动失败的服务 |
| `systemctl daemon-reload` | unit 文件改动后重新加载配置 |

## 四、unit 文件结构

服务 unit 文件（`.service`）典型结构：

```ini
[Unit]
Description=Nginx Web Server          # 描述
After=network.target                  # 在网络服务之后启动（依赖顺序）

[Service]
Type=forking                          # 进程类型（simple/forking/oneshot/notify）
ExecStart=/usr/sbin/nginx             # 启动命令
ExecReload=/usr/sbin/nginx -s reload  # 重载命令
ExecStop=/usr/sbin/nginx -s stop      # 停止命令
Restart=on-failure                    # 崩溃自动重启策略
RestartSec=5s                         # 重启间隔

[Install]
WantedBy=multi-user.target            # enable 时挂到哪个启动目标
```

- **Type**：`simple`（默认，ExecStart 启动的进程就是主进程）、`forking`（会 fork 出守护进程，如 nginx/php-fpm）、`oneshot`（执行一次就完成，如挂载脚本）、`notify`（服务主动 sd_notify 通知就绪）。
- **改完 unit 文件必须 `systemctl daemon-reload`**，否则 systemd 用旧配置。
- **unit 文件位置**：`/etc/systemd/system/`（管理员，优先级高）/`/usr/lib/systemd/system/`（软件包自带）/`/run/systemd/system/`（运行时）。

## 五、journalctl 速查

| 命令 | 作用 |
| --- | --- |
| `journalctl -u nginx` | 看 nginx 服务日志 |
| `journalctl -u nginx -f` | 实时跟踪（类似 tail -f） |
| `journalctl --since today` | 今天的日志 |
| `journalctl --since "1 hour ago"` | 最近 1 小时 |
| `journalctl --since "09:00" --until "12:00"` | 指定时段 |
| `journalctl -p err` | 只看错误级（err/crit/alert/emerg） |
| `journalctl -p warning` | 警告及以上 |
| `journalctl -k` | 内核日志（等同 dmesg） |
| `journalctl -b` | 本次开机以来的日志 |
| `journalctl -b -1` | 上次开机的日志 |
| `journalctl --disk-usage` | 日志占磁盘大小 |
| `journalctl -f` | 实时跟踪所有日志 |

优先级 `-p`（从低到高）：`debug(7)`/`info(6)`/`notice(5)`/`warning(4)`/`err(3)`/`crit(2)`/`alert(1)`/`emerg(0)`。`-p err` 含 err 及以上。

## 六、cron 表达式速查

五段式：`分 时 日 月 周 命令`

```
分（0-59）  时（0-23）  日（1-31）  月（1-12）  周（0-6，0或7=周日）
```

| 表达式 | 含义 |
| --- | --- |
| `* * * * *` | 每分钟 |
| `0 * * * *` | 每小时整点 |
| `0 3 * * *` | 每天凌晨 3 点 |
| `0 0 * * *` | 每天午夜 |
| `*/15 * * * *` | 每 15 分钟 |
| `*/5 * * * *` | 每 5 分钟 |
| `0 9-17 * * 1-5` | 工作日 9-17 点整点（每小时） |
| `0 0 * * 0` | 每周日凌晨 |
| `0 0 1 * *` | 每月 1 号午夜 |
| `30 2 * * 6` | 每周六凌晨 2:30 |

- `*/N` 表示「每 N 个单位」（在分字段 `*/5` = 每 5 分钟）。
- `A-B` 表示范围（`9-17` = 9 到 17）。
- `A,B,C` 表示列表（`1,15` = 1 号和 15 号）。
- 周字段 0 和 7 都表示周日。

## 七、易错点清单

- **「`kill` 就是杀进程」**：片面。`kill PID` 默认发 SIGTERM（请求优雅退出），进程可捕获做清理；只有 `kill -9` 才是强杀。`kill` 本质是「发信号」，`kill -l` 能列所有信号。
- **「`kill -9` 想用就用」**：危险。SIGKILL 不可捕获，进程来不及清理（缓冲数据丢、临时文件残留、子进程变孤儿）。应先试 `kill`（SIGTERM），几秒后没退出再 `kill -9`。
- **「`enable` 就是启动」**：错。`enable` 只设**开机自启**（持久），不启动当前会话；`start` 才是现在启动。要两个都做用 `enable --now`。
- **「僵尸进程能用 kill -9 杀掉」**：错。僵尸进程已经死了（只是父进程没回收），`kill -9` 对它无效。要杀父进程或让父进程 wait 回收。
- **「D 状态进程 kill -9 能杀」**：错。D（不可中断睡眠）在等 IO，连 SIGKILL 都无效，只能等 IO 完成或重启系统。大量 D 进程通常是磁盘故障。
- **「cron 的 `*/5` 是第 5 分钟跑」**：错。`*/5` 是「每 5 分钟」（0,5,10,15...），不是「只在第 5 分钟」。要只在第 5 分钟写 `5 * * * *`。
- **「改完 unit 文件直接 restart 就行」**：错。改了 unit 文件必须先 `systemctl daemon-reload`（让 systemd 重新加载配置），再 restart，否则用旧配置。
- **「reload 和 restart 一样」**：不同。restart 是 stop + start（有短暂中断，连接断开）；reload 是重载配置（不重启进程，无中断），但需服务支持（nginx 支持，有些不支持只能 restart）。

## 八、进阶方向（链接其他叶）

- [文件系统与基础命令](../filesystem-commands/) —— `find`/`chmod` 管理进程相关文件
- [文本处理](../text-processing/) —— `grep`/`awk` 处理 `ps`/`journalctl` 输出
- [tmux](../../)（如有）—— 终端复用，进程在会话里持续

## 权威链接

- [systemd - Official Documentation](https://systemd.io/)
- [systemctl(1) man page](https://man7.org/linux/man-pages/man1/systemctl.1.html)
- [journalctl(1) man page](https://man7.org/linux/man-pages/man1/journalctl.1.html)
- [signal(7) man page](https://man7.org/linux/man-pages/man7/signal.7.html)
- [cron - Wikipedia](https://en.wikipedia.org/wiki/Cron)
- 本站幻灯片：<a href="/SlideStack/process-services-slide/" target="_blank">进程管理与服务（systemd）</a>
