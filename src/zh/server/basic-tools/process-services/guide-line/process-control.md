---
layout: doc
outline: [2, 3]
---

# 进程控制详解：ps / top / htop / kill / jobs

> 基于 Linux 进程管理 · 核于 2026-08

## 速查

- **`ps aux`**：BSD 风格快照，看全部进程（USER/PID/%CPU/%MEM/VSZ/RSS/TTY/STAT/START/COMMAND）。`ps -ef` 看 PPID 父子关系。
- **`top`**：动态实时监控（默认 3 秒刷新）。交互键：`P`（按 CPU 排）、`M`（按内存排）、`k`（杀进程）、`1`（每个 CPU 核心）、`q`（退出）。
- **`htop`**：top 增强版（彩色、鼠标、树形、横向滚动），排障首选。
- **进程状态**：`R`（运行/就绪）、`S`（可中断睡眠，常态）、`D`（不可中断睡眠，等 IO）、`Z`（僵尸）、`T`（停止）。
- **信号**：`SIGTERM`(15，优雅终止，**kill 默认**)、`SIGKILL`(9，强杀，**不可捕获**)、`SIGINT`(2，Ctrl-C)、`SIGSTOP`(19，暂停)、`SIGCONT`(18，继续)、`SIGHUP`(1，重载配置)。
- **`kill`**：`kill PID`（SIGTERM）、`kill -9 PID`（强杀）、`kill -HUP PID`（重载）、`kill -l`（列信号）。
- **`pkill`/`killall`**：按名字杀。`pkill -f "python app.py"`（按完整命令行匹配）、`killall nginx`（按进程名）。
- **前后台**：`cmd &`（后台跑）、`Ctrl-Z`（挂起到后台暂停）、`jobs`（列后台任务）、`bg %1`（1 号后台继续）、`fg %1`（拉前台）、`nohup cmd &`（脱离终端）。
- **僵尸进程**：子进程已死但父进程没回收（没 wait）。`kill -9` 对僵尸无效，要杀父进程或让父进程 wait。

## 一、ps：进程快照

`ps` 拍下当前时刻的进程快照，是定位「什么进程在跑」的第一步。

**两种主流风格**：

```
ps aux              # BSD 风格（无横杠）—— 最常用
# 输出：USER PID %CPU %MEM VSZ RSS TTY STAT START COMMAND

ps -ef              # System V 风格（有横杠）—— 看 PPID 父子关系
# 输出：UID PID PPID C STIME TTY TIME CMD

ps -e --forest      # 树形显示进程父子关系
```

**常用组合**：

```
ps aux | grep nginx              # 找 nginx 进程（grep 自己也会出现）
ps aux | grep [n]ginx            # 巧妙：正则中括号让 grep 不匹配自己
ps aux --sort=-%cpu | head -10   # 按 CPU 降序，看最耗 CPU 的 10 个
ps aux --sort=-%mem | head -10   # 按内存降序
ps -u alice                      # 看 alice 用户的进程
ps -p 1234 -o pid,ppid,stat,etime,cmd   # 看 PID 1234 详情（etime = 已运行时长）
```

**关键字段**：

- **PID**：进程号（杀进程用这个）。
- **PPID**：父进程 PID（用 `ps -ef` 看）。
- **%CPU / %MEM**：CPU 与内存占用百分比。
- **VSZ**：虚拟内存（KB），进程认为可用的总内存（含换出的、映射的）。
- **RSS**：常驻物理内存（KB），实际占用的物理内存（更实际）。
- **STAT**：进程状态（R/S/D/Z/T，可能带 `s` 会话首、`+` 前台、`<` 高优先级、`N` 低优先级）。
- **TTY**：终端（`?` 表示无终端，即守护进程）。

## 二、top 与 htop：实时监控

**`top`** 动态刷新（默认 3 秒），持续看进程资源占用：

```
$ top
top - 10:30:45 up 10 days,  2 users,  load average: 0.50, 0.35, 0.25
Tasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie
%Cpu(s):  5.0 us,  2.0 sy,  0.0 ni, 92.5 id,  0.5 wa,  0.0 hi,  0.0 si
MiB Mem :  16000 total,   8000 free,   5000 used,   3000 buff/cache
MiB Swap:   2048 total,   2000 free,     48 used

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1234 mysql     20   0 2000.0m 500.0m  20.0m S   5.0   3.1   10:30 mysqld
 5678 nginx     20   0  100.0m  20.0m  10.0m S   1.0   0.1    2:15 nginx
```

- **头部摘要**：load average（1/5/15 分钟负载，超过 CPU 核数说明过载）、Tasks（进程总数与各状态数）、%Cpu（us 用户态/sy 内核态/id 空闲/wa 等 IO）、Mem/Swap（内存与交换分区）。
- **交互键**：`P`（按 CPU 排序）、`M`（按内存排序）、`1`（展开看每个 CPU 核心）、`k`（输入 PID 杀进程）、`r`（重置优先级 renice）、`q`（退出）、`h`（帮助）。
- **load average**：3 个数分别是 1/5/15 分钟的平均负载（运行+等待的进程数）。8 核 CPU 的系统，load 持续 >8 说明过载。

**`htop`** 是 top 的增强版（通常需 `apt install htop`）：

- 彩色界面，每个 CPU 核心用柱状图显示占用。
- 鼠标可点击操作（选进程、杀进程）。
- 横向滚动看完整命令行。
- 树形视图（F5）显示进程父子关系。
- 比 top 直观得多，服务器排障首选。

## 三、kill：发送信号

`kill` 本质是「给进程发信号」，不只是「杀进程」：

```
kill 1234              # 默认发 SIGTERM(15)，请求优雅退出
kill -15 1234          # 显式发 SIGTERM（等同默认）
kill -9 1234           # 发 SIGKILL，强杀（不可捕获）
kill -HUP 1234         # 发 SIGHUP，常作「重载配置」
kill -STOP 1234        # 暂停进程（等同 kill -19）
kill -CONT 1234        # 恢复暂停的进程
kill -l                # 列出所有信号名与编号
```

**SIGTERM vs SIGKILL——何时用哪个**：

- **SIGTERM（kill 默认）**：请求进程自己优雅退出。进程可以捕获这个信号，做清理工作（flush 缓冲、关闭连接、保存状态、删除临时文件）后再退出。**首选**，给进程留体面退出的机会。
- **SIGKILL（kill -9）**：内核直接终结进程，进程**来不及做任何清理**。缓冲数据可能丢、临时文件可能残留、子进程变孤儿。**最后手段**——先 `kill`，等几秒若没退出再 `kill -9`。

**按名字杀**：

```
killall nginx                  # 杀所有名为 nginx 的进程（注意可能误杀同名）
pkill nginx                    # 同上，杀名为 nginx 的
pkill -f "python app.py"       # 按完整命令行匹配（-f 匹配整个命令）
pkill -u alice                 # 杀 alice 用户的所有进程
```

`pkill -f` 比 `killall` 更灵活（按完整命令行而非进程名匹配），但要注意 pattern 太宽会误杀。

## 四、前后台与作业控制

**后台运行**：命令后加 `&`，命令在后台跑，终端立即释放：

```
$ ./long_task.sh &
[1] 12345                  # [1] 是作业号，12345 是 PID
```

**Ctrl-Z 挂起**：正在前台跑的进程，按 Ctrl-Z 暂停它（发 SIGSTOP），它进入停止状态（T），终端释放：

```
$ ./long_task.sh           # 前台跑，终端被占用
^Z                         # 按 Ctrl-Z
[1]+  Stopped   ./long_task.sh
```

**`jobs`** 列出当前 shell 的后台/挂起任务：

```
$ jobs
[1]+  Stopped   ./long_task.sh
[2]-  Running   ./other_task.sh &
```

**`bg` / `fg`** 在前后台切换：

```
bg %1          # 让 1 号任务在后台继续运行（从 Stopped 变 Running）
fg %1          # 把 1 号任务拉回前台
%1             # 等同 fg %1
```

**`nohup`** 让进程脱离终端（关掉 SSH 会话也不死）：

```
nohup ./server.py &         # 后台跑，输出重定向到 nohup.out
nohup ./server.py > out.log 2>&1 &   # 输出定向到指定文件
```

- 默认情况下，关掉终端会发 SIGHUP 给该终端的所有子进程，导致它们退出。`nohup` 忽略 SIGHUP，所以关 SSH 也能继续跑。
- 配合 `&` 后台运行 + `> log 2>&1` 重定向输出，是「让程序在服务器上长期跑」的最简方式（更规范的是用 systemd 服务）。

## 五、僵尸进程与排查

**僵尸进程（Zombie）**：子进程已经 `exit()` 退出，但父进程没有调用 `wait()`/`waitpid()` 回收它的退出状态，导致进程描述符（PID、退出码）还占着——这就是僵尸。

- **危害**：僵尸进程不占内存/CPU（已经死了），但**占用 PID**。系统 PID 数有限（默认 32768），大量僵尸会耗尽 PID 导致无法启动新进程。
- **为什么 `kill -9` 杀不掉僵尸**：僵尸已经死了，再发任何信号都没用（没有进程接收）。`kill -9` 只对活进程有效。
- **解决方法**：
  1. 让父进程回收：给父进程发 SIGCHLD（`kill -CHLD 父PID`），提醒它回收子进程。
  2. 杀父进程：父进程死了，僵尸被 init/systemd（PID 1）收养，init 会自动 wait 回收。
  3. 修复父进程代码：让它正确处理子进程退出（注册 SIGCHLD 处理器或调 wait）。

```
$ ps aux | grep Z               # 找僵尸进程（STAT 列为 Z）
$ ps -o pid,ppid,stat,cmd -p [僵尸PID]   # 看僵尸的父进程
$ kill [父PID]                  # 杀父进程，僵尸被 init 收养回收
```

## 六、实际排障流程

**场景：服务器 CPU 100%**：

1. `top` 或 `htop`，按 `P`（CPU 排序），找到最耗 CPU 的进程 PID。
2. 看它的 COMMAND 是什么程序、USER 是谁跑的。
3. `ps -p PID -o pid,ppid,etime,cmd` 看详情（启动多久了、完整命令、父进程）。
4. 若是异常进程：`kill PID`（先 SIGTERM），不行再 `kill -9 PID`。
5. 若是正常服务但负载高：查它的日志（`journalctl -u 服务` 或 `/var/log/`），看是不是死循环或流量突增。

**场景：进程卡住不响应**：

1. `ps -p PID -o stat` 看状态：若是 `D`（不可中断睡眠），在等 IO，`kill -9` 也没用，只能等或重启。
2. 若是 `S`/`R` 但不响应，可能死锁：先 `kill PID`（SIGTERM），给 10 秒优雅退出。
3. 仍不退出，`kill -9 PID` 强杀（注意可能丢数据）。
4. 查日志定位卡住原因（`strace -p PID` 看它在等什么系统调用，进阶工具）。

## 下一步

进程控制熟练后，下一步学[systemd 与定时任务](./systemd-and-cron)——用 `systemctl` 管理服务、`journalctl` 查日志、`crontab` 配定时任务，让程序在后台持续运行。
