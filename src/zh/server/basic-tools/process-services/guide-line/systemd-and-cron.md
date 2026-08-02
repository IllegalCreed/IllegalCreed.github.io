---
layout: doc
outline: [2, 3]
---

# systemd 与定时任务：systemctl / journalctl / crontab / timers

> 基于 systemd 服务管理与任务调度 · 核于 2026-08

## 速查

- **systemd**：现代 Linux 的初始化系统与服务管理器（PID 1），统一管理服务的启停、自启、依赖、日志。
- **`systemctl` 核心**：`start`/`stop`/`restart`/`reload`/`status`/`enable`/`disable`/`is-active`/`is-enabled`。
- **`enable` vs `start`**：`start` 现在**临时**启动；`enable` 设**开机自启**（持久）；`enable --now` 两个一起。
- **unit 文件**（`.service`）三段：`[Unit]`（描述/依赖）、`[Service]`（启动/重载/停止命令/类型）、`[Install]`（自启挂载点）。改完必须 `systemctl daemon-reload`。
- **`reload` vs `restart`**：reload 重载配置（不重启进程、无中断、需服务支持）；restart 是 stop + start（有短暂中断）。
- **`journalctl`**：`-u 服务`、`-f`（实时跟踪）、`--since today`、`-p err`、`-k`（内核）、`-b`（本次开机）。
- **cron**：`crontab -e`（编辑）/`-l`（列出）/`-r`（删除）。五段式 `分 时 日 月 周 命令`。
- **cron 示例**：`*/5 * * * *`（每5分钟）、`0 3 * * *`（每天3点）、`0 0 * * 0`（周日凌晨）、`0 9-17 * * 1-5`（工作日9-17点整点）。
- **systemd timers**（.timer）：比 cron 精细（到秒/毫秒）、有日志（记到 journal）、支持依赖与触发条件。需要日志/精确控制时优于 cron。

## 一、systemd：服务管理的核心

systemd 是现代 Linux（CentOS 7+/Ubuntu 16.04+/Debian 8+ 及几乎所有主流发行版）的**初始化系统与服务管理器**：

- **PID 1**：系统引导后第一个运行的用户空间进程，负责拉起所有其他服务。
- **并行启动**：按依赖关系（socket/dbus/路径激活）并行启动服务，比老的 SysVinit 串行启动快得多。
- **统一管理**：用 `systemctl` 管理所有 unit（服务 .service、套接字 .socket、定时器 .timer、挂载 .mount 等）。
- **日志收集**：journald 守护进程统一收集所有 unit 的日志（结构化，二进制存储），用 `journalctl` 查询。
- **争议**：systemd 庞大（被批「第二个内核」），违背 Unix「做一件事做好」哲学，部分老运维仍偏爱 SysVinit，但已成为事实标准。

## 二、systemctl：管理服务

**生命周期控制**：

```
systemctl start nginx           # 启动（现在）
systemctl stop nginx            # 停止
systemctl restart nginx         # 重启（stop + start，有短暂中断）
systemctl reload nginx          # 重载配置（不重启进程，无中断，需服务支持）
systemctl status nginx          # 查看状态（运行否、PID、最近几行日志）
```

**`reload` vs `restart` 的关键区别**：

- **`restart`**：完全 stop 再 start。进程重启，**已有连接会断开**（短暂中断）。适用于大改动或 reload 不生效时。
- **`reload`**：让进程**重新读取配置文件**，但进程不重启（不中断现有连接）。如 `nginx -s reload` 让 worker 平滑重新加载配置。**生产环境优先用 reload**（无停机），但需服务支持（nginx 支持，有些服务只有 restart）。

**开机自启**：

```
systemctl enable nginx          # 设开机自启（创建符号链接到启动目标）
systemctl disable nginx         # 取消开机自启（删符号链接）
systemctl enable --now nginx    # 设自启 + 现在启动（最常用）
systemctl is-enabled nginx      # 查是否设自启（输出 enabled/disabled/static）
systemctl is-active nginx       # 查是否运行（输出 active/inactive/failed）
```

**`enable` vs `start` 必须分清**：

- `start`：**现在**启动服务（临时，系统重启后不会自动起来）。
- `enable`：设**开机自启**（持久，告诉 systemd「下次开机时自动启动这个服务」），但**不会现在启动**。
- 要「现在运行 + 开机自启」：`systemctl enable --now nginx`（一次做两件事）。
- 新手常见错误：只 `enable` 没 `start`，结果服务没起来；或只 `start` 没 `enable`，重启后服务没了。

**查看与排查**：

```
systemctl status nginx                # 状态 + 最近日志（最常用）
systemctl list-units --type=service   # 列所有已加载的服务
systemctl list-unit-files --type=service  # 列所有服务文件（含自启状态）
systemctl list-units --failed         # 列启动失败的服务（排查必用）
systemctl daemon-reload               # 改了 unit 文件后必须执行（重载配置）
```

## 三、unit 文件结构

服务 unit 文件（`.service`）的标准结构：

```ini
[Unit]
Description=My Web Application        # 人类可读的描述
Documentation=https://example.com/docs
After=network.target postgresql.service   # 在网络和数据库之后启动（依赖顺序）
Wants=postgresql.service              # 弱依赖（希望数据库在，但不在也不失败）
Requires=redis.service                # 强依赖（redis 必须在，否则本服务失败）

[Service]
Type=simple                           # 进程类型
User=appuser                          # 以哪个用户运行
WorkingDirectory=/opt/myapp           # 工作目录
Environment=NODE_ENV=production       # 环境变量
ExecStart=/usr/bin/node server.js     # 启动命令（必需）
ExecStartPre=/opt/myapp/migrate.sh    # 启动前执行的命令（如数据库迁移）
ExecReload=/bin/kill -HUP $MAINPID    # 重载命令
ExecStop=/bin/kill -TERM $MAINPID     # 停止命令
Restart=on-failure                    # 崩溃自动重启策略
RestartSec=5s                         # 重启间隔
TimeoutStopSec=30s                    # 停止超时（超时后 SIGKILL）

[Install]
WantedBy=multi-user.target            # enable 时挂到多用户启动目标（相当于运行级3）
```

**Type 类型**：

- **`simple`（默认）**：ExecStart 启动的进程就是主进程，systemd 认为它立即就绪。
- **`forking`**：进程会 fork 出守护进程（如 nginx/php-fpm），父进程退出，子进程持续运行。需配合 `PIDFile`。
- **`oneshot`**：执行一次就完成（如挂载、初始化脚本），不是常驻服务。
- **`notify`**：服务主动调 `sd_notify()` 通知 systemd 自己就绪（现代服务如 nginx 新版、dbus）。
- **`idle`**：等所有任务完成才启动（避免干扰控制台输出）。

**Restart 策略**：

- `no`（默认）：不自动重启。
- `on-failure`：非正常退出（崩溃、超时、被杀）时重启。
- `on-abnormal`：被信号杀或超时重启。
- `always`：无论怎么退出都重启（高可用服务用）。

**改 unit 文件的流程**：

1. 编辑 `/etc/systemd/system/myapp.service`（或 `systemctl edit myapp` 创建覆盖片段）。
2. `systemctl daemon-reload`——**必须执行**，让 systemd 重新读取配置文件。
3. `systemctl restart myapp`——用新配置重启服务。

## 四、journalctl：统一日志

systemd 的 journald 收集所有 unit 的日志（结构化、二进制存储，不再散落 /var/log/），用 `journalctl` 查询：

```
journalctl -u nginx                  # 看 nginx 服务日志
journalctl -u nginx -f               # 实时跟踪（类似 tail -f，排障必用）
journalctl -u nginx --since today    # 今天的
journalctl -u nginx --since "1 hour ago"   # 最近 1 小时
journalctl -u nginx --since "2026-08-01" --until "2026-08-02"
journalctl -p err                    # 全系统错误级日志（err/crit/alert/emerg）
journalctl -u nginx -p warning       # nginx 的警告及以上
journalctl -k                        # 内核日志（等同 dmesg）
journalctl -b                        # 本次开机以来的日志
journalctl -b -1                     # 上次开机的日志（排查崩溃重启）
journalctl --disk-usage              # 日志占多少磁盘
journalctl --vacuum-time=7d          # 删除 7 天前的日志（清理）
journalctl -f                        # 实时跟踪所有日志
```

**按优先级过滤 `-p`**（从低到高）：

- `debug(7)` 调试 / `info(6)` 信息 / `notice(5)` 通知 / `warning(4)` 警告
- `err(3)` 错误 / `crit(2)` 严重 / `alert(1)` 警报 / `emerg(0)` 紧急

`-p err` 表示 err 及以上（err/crit/alert/emerg）。

**排障组合**：服务启动失败时，`systemctl status nginx` 会显示最近几行日志；要更详细的用 `journalctl -u nginx -n 50`（最后 50 行）或 `journalctl -u nginx -f`（实时跟踪）。

## 五、cron：传统定时任务

**cron** 是 Linux 的传统定时任务服务（crond 守护进程），适合周期性执行任务（备份、清理、监控）。

**`crontab` 命令**：

```
crontab -e              # 编辑当前用户的定时任务（打开编辑器）
crontab -l              # 列出当前用户的定时任务
crabtab -r              # 删除所有定时任务（谨慎！无确认）
sudo crontab -e -u root # 编辑 root 用户的（系统级任务）
sudo crontab -l -u alice # 查看 alice 的
```

**cron 表达式五段式**：

```
分  时  日  月  周  命令
0   3   *   *   *   /opt/backup.sh          # 每天凌晨 3 点跑备份
*/5 *   *   *   *   /opt/check.sh           # 每 5 分钟跑检查
0   0   *   *   0   /opt/cleanup.sh         # 每周日凌晨清理
0   9-17 *   *   1-5 /opt/report.sh         # 工作日 9-17 点每小时整点
30  2   1   *   *   /opt/logrotate.sh       # 每月 1 号凌晨 2:30
```

**特殊符号**：

- `*` 表示「任意值」（在该字段每个单位都触发）。
- `*/N` 表示「每 N 个单位」（`*/5` 在分字段 = 每 5 分钟：0,5,10,15...）。
- `A-B` 表示范围（`9-17` 在时字段 = 9 点到 17 点）。
- `A,B,C` 表示列表（`1,15` 在日字段 = 1 号和 15 号）。

**易错点**：

- 周字段 0 和 7 都表示周日。
- 日和周是 **OR 关系**：`0 0 1 * 1`（每月 1 号**或**每周一），不是「1 号且周一」。
- cron 环境变量极少（PATH 可能不全），脚本里用**绝对路径**（`/usr/bin/python3` 而非 `python3`），或在 crontab 顶部设 `PATH=`。
- 输出默认会邮件给用户（需装 mailx），建议重定向：`... command > /dev/null 2>&1`（丢弃）或 `> /var/log/myjob.log 2>&1`（记日志）。
- `%` 在 cron 命令里是特殊字符（换行），要转义 `\%` 或用 `date +\%Y\%m\%d`。

## 六、systemd timers：cron 的现代替代

systemd timers（.timer unit）是 systemd 的定时方案，比 cron 更强大：

**优势**：

- **精度高**：可精确到秒甚至毫秒（cron 只到分钟）。
- **有日志**：每次触发都记录到 journal（成功/失败/输出），cron 默认只邮件。
- **支持依赖**：可在系统启动后、某服务就绪后、固定间隔触发（OnBootSec/OnUnitActiveSec/OnCalendar）。
- **与 .service 配套**：.timer 触发同名的 .service，逻辑分离（定时逻辑在 .timer，执行逻辑在 .service）。
- **不会错失**：`Persistent=true` 错过的任务（如关机期间）开机后补跑。

**示例 .timer**：

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=*-*-* 03:00:00          # 每天凌晨 3 点（比 cron 表达式更可读）
Persistent=true                    # 错过的任务开机后补跑
AccuracySec=1min                   # 触发精度（默认 1 分钟）

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/backup.service（配套的执行服务）
[Unit]
Description=Daily Backup

[Service]
Type=oneshot
ExecStart=/opt/backup.sh
```

启用：`systemctl enable --now backup.timer`（启用 timer，不是 service）。

查看所有 timer：`systemctl list-timers`（显示下次触发时间）。

**cron vs systemd timers 选型**：简单任务（一句话的备份/清理）用 cron 够了，更简单；需要日志、精确控制、与服务集成、错失补跑时用 systemd timers。

## 下一步

服务管理熟练后，你已经能让程序在服务器上稳定运行。下一步可以学[文本处理](../../text-processing/)——用 `grep`/`sed`/`awk`/`jq` 处理 `journalctl`/`ps`/日志文件的输出，从海量文本里提取信息。
