---
layout: doc
outline: [2, 3]
---

# 参考：IPC 机制对比、代码模板与选型

> 基于通用操作系统概念 · 核于 2026-08

## 速查

- **IPC 七机制**：管道（pipe/FIFO）、消息队列、共享内存、信号量、信号（signal）、套接字（socket）、RPC。
- **最快**：共享内存（零拷贝）；**最通用/跨机**：套接字；**只通知**：信号。
- **共享内存**：映射同一物理页，无内核拷贝，**必须配信号量同步**。
- **管道**：半双工字节流，匿名（父子）/命名（任意进程），无边界。
- **消息队列**：内核结构化消息链表，**有边界**，可按类型筛取。
- **信号**：异步中断，SIGKILL/SIGSTOP 不可捕获，只传编号。
- **套接字**：本机（UNIX domain，比 TCP 快）/跨机（TCP/UDP），全双工，可非阻塞+多路复用。
- **RPC**：stub + 序列化 + 网络，让跨机调用像本地函数（gRPC/Dubbo）。
- **同步通信**：管道/消息队列/RPC 默认阻塞；**异步**：信号中断、非阻塞 socket + epoll。
- **跨机只有**：socket 与 RPC；其余仅本机。

## 一、IPC 机制对比大表

| 机制 | 速度 | 数据边界 | 方向 | 跨机 | 同步/阻塞 | 生命周期 | 典型场景 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **匿名管道 pipe** | 快 | 无（字节流） | 半双工 | ❌ | 默认阻塞 | 随进程消亡 | shell `\|`、父子通信 |
| **命名管道 FIFO** | 快 | 无（字节流） | 半双工 | ❌ | 默认阻塞 | 文件留存 | 无亲缘进程通信 |
| **消息队列** | 快 | ✅ 有边界 | 双向（收发分） | ❌ | 默认阻塞/可非阻塞 | 内核持有，需显式删 | 任务分发、结构化消息 |
| **共享内存** | **最快** | 无（字节） | 双向（同址） | ❌ | 无同步，需配信号量 | 内核持有，需显式删 | 大数据/视频帧/数据库 |
| **信号量** | 快 | —（不传数据） | — | ❌ | 阻塞（P 等待） | 内核持有，需显式删 | 保护临界区/共享内存 |
| **信号 signal** | 极快 | —（只传编号） | 单向 | 部分（同机） | 异步中断 | 瞬时 | 通知/控制（Ctrl+C/重载） |
| **套接字 socket** | 慢（协议栈） | TCP 无/UDP 有 | 全双工 | ✅ | 阻塞或非阻塞 | 连接生命周期 | 网络通信、本机跨进程 |
| **RPC** | 慢（序列化+网络） | ✅ 有边界 | 双向（请求/响应） | ✅ | 同步阻塞/异步 | 连接生命周期 | 微服务、分布式 |

## 二、代码模板速查

### 匿名管道（父子进程）

```c
int fds[2];
pipe(fds);                    // fds[0]=读, fds[1]=写
if (fork() == 0) {            // 子进程
    close(fds[1]);            // 子关写端
    read(fds[0], buf, n);     // 读
} else {                      // 父进程
    close(fds[0]);            // 父关读端
    write(fds[1], "hi", 2);   // 写
}
```

### 命名管道（任意进程）

```bash
mkfifo /tmp/fifo               # 建命名管道
# 进程 A: echo "data" > /tmp/fifo
# 进程 B: cat < /tmp/fifo
```

### System V 共享内存 + 信号量

```c
// 创建/获取共享内存
int shmid = shmget(0x1234, 4096, IPC_CREAT | 0666);
char *shm = shmat(shmid, NULL, 0);
// 创建/获取信号量（二值，初值 1）
int semid = semget(0x1234, 1, IPC_CREAT | 0666);
semctl(semid, 0, SETVAL, 1);
// P 操作（进入临界区）
struct sembuf p = {0, -1, 0}; semop(semid, &p, 1);
strcpy(shm, "data");          // 写共享内存
// V 操作（离开临界区）
struct sembuf v = {0, +1, 0}; semop(semid, &v, 1);
```

### 套接字（本机 UNIX domain）

```c
int s = socket(AF_UNIX, SOCK_STREAM, 0);
struct sockaddr_un addr;
addr.sun_family = AF_UNIX;
strcpy(addr.sun_path, "/tmp/sock");
bind(s, (struct sockaddr*)&addr, sizeof(addr));
listen(s, 5);
int c = accept(s, NULL, NULL);
read(c, buf, n);              // 双向 read/write
```

### 信号

```c
void handler(int sig) { /* 收到信号的处理 */ }
signal(SIGINT, handler);       // 注册 SIGINT 处理
// 另一进程: kill(pid, SIGINT);  // 发送信号
```

## 三、选型决策树

```
要交换数据吗？
├─ 否，只需通知/控制 ──────────────────────→ 信号（signal）
└─ 是
   ├─ 跨机（不同主机）吗？
   │  ├─ 是，要像函数调用 ─────────────────→ RPC（gRPC/Dubbo）
   │  └─ 是，要原始字节流/数据报 ─────────→ 套接字（TCP/UDP）
   └─ 否（同机）
      ├─ 数据量很大 + 要最快 ─────────────→ 共享内存 + 信号量
      ├─ 要消息边界/分类 ─────────────────→ 消息队列
      ├─ shell 串命令 / 父子通信 ────────→ 匿名管道（pipe）
      ├─ 无亲缘但同机 ───────────────────→ 命名管道（FIFO）或 UNIX socket
      └─ 大量连接需并发 ─────────────────→ 非阻塞 socket + epoll
```

## 四、易错点清单

- **"管道是全双工"**：错。pipe 是**半双工**，要双向得开两条。socket 才全双工。
- **"管道能跨机"**：错。pipe/FIFO/消息队列/共享内存**只本机**，只有 socket/RPC 能跨机。
- **"共享内存不需要同步"**：错。共享内存**无同步**，并发读写会竞态（torn read），**必须配信号量/锁**。
- **"共享内存最慢因为要同步"**：错。共享内存传输**最快**（零拷贝）；同步是额外成本，但整体仍比每次拷贝的消息队列快（尤其大数据）。
- **"信号量传递数据"**：错。信号量**不传数据**，只做同步计数。要传数据用共享内存/消息队列。
- **"信号和信号量是一回事"**：错。**信号（signal）**是异步中断通知（SIGINT）；**信号量（semaphore）**是同步计数器（P/V）。完全不同的东西。
- **"SIGKILL 可以被捕获"**：错。SIGKILL（9）/SIGSTOP（19）**不可捕获、不可忽略**，内核直接处理——这是保证能杀进程的最后手段。
- **"消息队列像管道一样无边界"**：错。消息队列**保留消息边界**，发三条收三条；管道是无边界字节流，会粘连。
- **"匿名管道任意进程都能用"**：错。匿名管道只能**父子/有亲缘**进程用（fork 继承 fd）；任意进程要用**命名管道 FIFO**。
- **"RPC 就是 socket"**：部分对。RPC 底层用 socket，但额外提供 **stub + 序列化**，让跨机调用像本地函数——是 socket 之上的应用层封装。
- **"UNIX domain socket 比 TCP 慢"**：错。本机通信 UNIX domain socket 比 TCP **快**（不走协议栈、不算校验和）。
- **"消息队列随进程退出自动消失"**：错。System V 消息队列/共享内存由**内核持有**，进程退出后仍在，需显式 `IPC_RMID` 删除，否则残留（`ipcs` 可查）。
- **"管道 write 写满会丢数据"**：错。写满（64KB）后 write **阻塞**等读端读走，不丢数据；除非设了 `O_NONBLOCK` 才返回 EAGAIN。

## 五、关键参数速查

| 参数 | 值 | 说明 |
| --- | --- | --- |
| Linux 管道容量 | 默认 64KB | `fcntl(F_SETPIPE_SZ)` 可改 |
| SIGKILL 编号 | 9 | 不可捕获 |
| SIGINT 编号 | 2 | Ctrl+C，可捕获 |
| 共享内存最大段 | `/proc/sys/kernel/shmmax` | 限制单段大小 |
| System V IPC 查看 | `ipcs` | 列出 msg/sem/shm |
| System V IPC 删除 | `ipcrm` | 删除残留 IPC 对象 |

## 权威链接

- [Inter-process communication - Wikipedia](https://en.wikipedia.org/wiki/Inter-process_communication)
- [Unix domain socket - Wikipedia](https://en.wikipedia.org/wiki/Unix_domain_socket)
- [Remote procedure call - Wikipedia](https://en.wikipedia.org/wiki/Remote_procedure_call)
- [Signal (IPC) - Wikipedia](https://en.wikipedia.org/wiki/Signal_(IPC))
- [IPC - GeeksforGeeks](https://www.geeksforgeeks.org/inter-process-communication-ipc/)
- [Shared Memory - Linux man page](https://man7.org/linux/man-pages/man7/shm_overview.7.html)
- 本站幻灯片：<a href="/SlideStack/ipc-slide/" target="_blank">进程间通信 IPC</a>
