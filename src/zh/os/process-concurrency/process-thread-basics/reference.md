---
layout: doc
outline: [2, 3]
---

# 参考：进程与线程 API、状态与对比速查

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **进程 = 资源单位**，**线程 = 调度单位**。程序是静态文件，进程是动态实例（程序 + PCB + 地址空间）。
- **PCB** 是进程存在的唯一标志，含：标识（PID/PPID）、现场（PC/SP/寄存器）、调度信息（状态/优先级）、控制信息（页表/文件表）、记账。
- **三态机**：就绪↔运行→阻塞→就绪。运行→就绪（抢占）、运行→阻塞（主动等）、阻塞→就绪（唤醒）。**无阻塞→运行、无就绪→阻塞**。
- **上下文切换**：保存现场→选下一进程→恢复现场→（进程切换）换页表 flush TLB。进程切换约数 μs，线程切换亚 μs（不换页表）。
- **fork** 复制进程（COW）、返回值父=子PID/子=0；**exec** 替换程序（PID 不变）；**wait** 回收子进程防僵尸。
- **僵尸**：子死父不收（有害，占 PID）；**孤儿**：父死子被 init 收养（无害）。
- **线程共享**地址空间/堆/文件表，**私有**栈/PC/寄存器/TLS。共享→通信方便但要同步。
- **用户级线程**（内核不可见，不能多核并行，一阻全阻）vs **内核级线程**（可并行，阻塞隔离，主流）。
- **多线程模型**：多对一（不能并行）、一对一（Linux/Windows/Java，主流）、多对多（Go goroutine GMP）。
- **进程 vs 线程四维**：资源（独立 vs 共享）、切换（贵 vs 便宜）、通信（IPC vs 共享内存）、崩溃（隔离 vs 同崩）。

## 一、进程状态转换速查

| 转换 | 触发 | 说明 |
| --- | --- | --- |
| 新建 → 就绪 | PCB/内存分配完成 | 进程初始化完毕，可被调度 |
| 就绪 → 运行 | 调度器选中（dispatch） | 获得 CPU 开始执行 |
| 运行 → 就绪 | 时间片用完 / 被高优先级抢占 | 让出 CPU，回就绪队列 |
| 运行 → 阻塞 | 主动等待（read/wait/申请锁） | 等待 IO/事件/资源 |
| 阻塞 → 就绪 | 等待的事件发生（IO 完成） | 被内核唤醒 |
| 运行 → 终止 | exit() 或异常退出 | 释放资源，PCB 待父进程 wait 回收 |

**不存在的转换**：阻塞 → 运行（必须先经就绪）、就绪 → 阻塞（就绪态没在跑，无从等待）。

## 二、PCB 与 TCB 内容对比

| 字段类别 | PCB（进程控制块） | TCB（线程控制块） |
| --- | --- | --- |
| 标识 | PID、PPID、UID、GID | 线程 ID、所属进程 PID |
| 现场 | PC、SP、PSW、通用寄存器 | PC、SP、寄存器、栈指针 |
| 调度 | 状态、优先级、时间片、等待事件 | 状态、优先级、所属进程指针 |
| 资源 | 页表基址（CR3）、打开文件表、信号掩码、内存指针 | 栈、TLS、信号掩码（共享进程其余资源） |
| 记账 | CPU 时间、内存占用、IO 统计 | 线程 CPU 时间 |

- **Linux 统一表示**：Linux 用 `task_struct` 同时表示进程与线程——线程就是"共享地址空间的 task_struct"。进程与线程在内核层面没有本质区别，差别只在是否共享资源。

## 三、进程 vs 线程核心对比大表

| 维度 | 进程 | 线程 |
| --- | --- | --- |
| **基本单位** | 资源分配与保护 | CPU 调度与执行 |
| **地址空间** | 独立（隔离） | 共享进程的地址空间 |
| **资源** | 独立文件表、独立堆 | 共享文件表、共享堆；独立栈 |
| **创建代价** | 高（复制地址空间，COW 也有开销） | 低（分配栈与 TCB） |
| **切换代价** | 高：换页表 + flush TLB，约**数 μs** | 低：不换页表，约**亚 μs** |
| **通信** | IPC（管道/消息队列/共享内存/socket） | 直接共享内存（需同步） |
| **崩溃影响** | 隔离，不影响其它进程 | 拖垮整个进程的所有线程 |
| **多核并行** | 可以，但开销大 | 可以（一对一模型），开销小 |
| **适用** | 强隔离（浏览器、服务隔离） | 高并发共享（Web 服务器） |
| **代表** | Chrome 标签页、Nginx worker | Java 线程池、数据库连接池 |

## 四、fork / exec / wait API 速查

| 调用 | 作用 | 关键细节 |
| --- | --- | --- |
| `fork()` | 创建子进程，复制父进程 | COW 复制页表；父返回子 PID（>0），子返回 0，失败 -1 |
| `exec*()` | 用新程序替换当前进程 | PID 不变；地址空间被覆盖；不返回（成功的话） |
| `wait()` | 阻塞等待任一子进程结束 | 回收子进程 PCB，防僵尸；返回子进程 PID |
| `waitpid(pid,...)` | 等待指定子进程 | 可阻塞或非阻塞（WNOHANG）；可回收僵尸 |
| `exit(status)` | 进程退出 | 释放资源，保留 PCB（含 status）等 wait 回收 |
| `getpid()` | 获取自身 PID | — |
| `getppid()` | 获取父进程 PID | 父进程死后，PPID 变为 1（init） |

```c
// 经典 fork + exec + wait 模式
pid_t pid = fork();
if (pid == 0) {                    // 子进程
    execve("/bin/ls", argv, envp); // 加载 ls，PID 不变
    perror("exec"); exit(1);       // exec 失败才到这里
}
int status;
waitpid(pid, &status, 0);          // 父进程回收子进程
```

## 五、僵尸进程 vs 孤儿进程

| | 僵尸进程（Zombie） | 孤儿进程（Orphan） |
| --- | --- | --- |
| **成因** | 子进程已 exit，父进程未 wait 回收 PCB | 父进程先于子进程退出 |
| **状态** | Z（终止但 PCB 残留） | 仍运行，被 init 收养 |
| **危害** | 占 PID，过多耗尽 PID 表（有害） | init 兜底回收（无害） |
| **解决** | 父进程及时 wait；或 kill 父进程让 init 收养 | 无需处理，init 自动回收 |

## 六、用户级 vs 内核级线程与多线程模型

| 模型 | 用户线程:内核线程 | 多核并行 | 阻塞隔离 | 切换代价 | 代表 |
| --- | --- | --- | --- | --- | --- |
| 多对一 | N:1 | ❌ | ❌ 一阻全阻 | 极快（用户态） | 早期 Solaris |
| 一对一 | 1:1 | ✅ | ✅ | 较大（陷内核） | Linux pthread、Windows、Java |
| 多对多 | M:N | ✅ | ✅ | 灵活 | Go goroutine（GMP） |

## 七、各语言/运行时线程模型

| 语言/运行时 | 线程模型 | 说明 |
| --- | --- | --- |
| **C/C++（pthread）** | 一对一（内核级） | Linux/Windows 原生线程 |
| **Java** | 一对一（内核级） | 现代 JVM 1:1 映射 OS 线程；虚拟线程（JDK21+）是 M:N |
| **Go** | 多对多（goroutine + GMP） | 成千上万 goroutine 跑在 N 个 OS 线程上 |
| **Python** | 一对一（GIL 限制并行） | CPython 有 GIL，多线程无法真并行 CPU 密集任务 |
| **Rust** | 一对一（std::thread） | 也可用 async（M:N，tokio） |
| **Erlang** | 多对多（轻量进程） | 极多轻量进程，BEAM 调度 |

## 八、易错点清单

- **"程序和进程是一回事"**：错。程序是静态磁盘文件，进程是动态运行实例（有 PCB/地址空间/生命周期）。一个程序可对应多个进程。
- **"进程切换和线程切换代价一样"**：错。进程切换要换页表 flush TLB（数 μs），线程切换不换页表（亚 μs），线程便宜得多。
- **"阻塞的进程可以直接变运行"**：错。阻塞只能先回到就绪，由调度器再选为运行。不存在阻塞→运行。
- **"就绪态的进程会变成阻塞"**：错。就绪态没在执行，无从发起等待。只有运行态才能主动请求阻塞。
- **"fork 后父子进程 PID 相同"**：错。子进程有独立 PID，fork 通过返回值区分父子（父得子 PID，子得 0）。
- **"exec 会创建新进程"**：错。exec 替换当前进程的程序，PID 不变，不创建新进程。
- **"孤儿进程是有害的"**：错。孤儿被 init 收养，无害。僵尸进程（子死父不收）才有害。
- **"线程有独立的地址空间"**：错。同进程的线程共享地址空间，只有栈是私有的。
- **"用户级线程能利用多核并行"**：错。用户级线程对内核不可见，内核只给进程一个核，无法多核并行。需内核级线程或多对多模型。
- **"多对一线程模型下，一个线程阻塞不影响其它"**：错。多对一一个线程阻塞会阻塞整个进程的所有用户线程。
- **"一对一模型线程数无上限"**：错。内核线程有资源开销（栈/task_struct），受内存与 ulimit 限制，通常几千到几万。
- **"线程切换不需要保存寄存器"**：错。线程切换同样要保存/恢复 PC、SP、通用寄存器现场（在 TCB 里），只是不换页表。

## 九、权威链接

- [Process (computing) - Wikipedia](https://en.wikipedia.org/wiki/Process_(computing))
- [Thread (computing) - Wikipedia](https://en.wikipedia.org/wiki/Thread_(computing))
- [Context switch - Wikipedia](https://en.wikipedia.org/wiki/Context_switch)
- [Fork–exec - Wikipedia](https://en.wikipedia.org/wiki/Fork%E2%80%93exec)
- [Zombie process - Wikipedia](https://en.wikipedia.org/wiki/Zombie_process)
- [Operating Systems: Processes - GeeksforGeeks](https://www.geeksforgeeks.org/process-states-in-operating-system/)
- [Threads - GeeksforGeeks](https://www.geeksforgeeks.org/threads-in-operating-system/)
- 本站幻灯片：<a href="/SlideStack/process-thread-basics-slide/" target="_blank">进程与线程基础</a>
