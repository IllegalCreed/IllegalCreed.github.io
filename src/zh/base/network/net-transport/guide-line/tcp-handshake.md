---
layout: doc
outline: [2, 3]
---

# TCP 三次握手与四次挥手

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **面向连接**：TCP 在传数据前必须先**建立连接**、传完再**释放连接**，靠握手/挥手在两端各自维护一份连接状态（序列号、窗口、缓冲区）。
- **三次握手**：`SYN`（seq=x）→ `SYN+ACK`（seq=y, ack=x+1）→ `ACK`（ack=y+1）。本质是**双向同步初始序列号（ISN）**并确认双方收发能力都正常。
- **为什么是三次而非两次**：两次握手无法让**服务端确认客户端的接收能力**，且会被**迟到的历史 SYN**骗出一条无人使用的连接——三次握手用客户端最后那个 ACK 堵死这两个漏洞。
- **四次挥手**：`FIN` → `ACK` → `FIN` → `ACK`。TCP 是**全双工**，两个方向各自独立关闭，所以中间的 ACK 与 FIN 通常**不能合并**，分四步走。
- **CLOSE_WAIT 是应用层信号**：收到对端 FIN 后进入 `CLOSE_WAIT`，要等**本端应用调用 `close()`** 才发出己方 FIN；大量 `CLOSE_WAIT` 堆积 = 应用没关连接的 Bug。
- **TIME_WAIT 等 2MSL**：**主动关闭方**最后进入 `TIME_WAIT`，等 **2 个 MSL（报文最大生存时间）**，确保最后的 ACK 送达、并让旧连接的残余报文在网络中消亡，避免污染同四元组的新连接。
- **关键状态**：`LISTEN`（服务端监听）/ `SYN_SENT`（客户端已发 SYN）/ `SYN_RCVD`（服务端已回 SYN+ACK）/ `ESTABLISHED`（连接已建立）/ `FIN_WAIT_1·2` / `CLOSE_WAIT` / `LAST_ACK` / `TIME_WAIT` / `CLOSED`。
- **半连接队列（SYN queue）**：服务端收到 SYN、回了 SYN+ACK 但还没收到第三次 ACK 的连接，暂存于此（half-open）。
- **SYN 洪水攻击**：攻击者用**伪造源 IP** 海量发 SYN 却从不回 ACK，塞满半连接队列耗尽资源，使正常客户端连不上——属于经典 DDoS。
- **SYN Cookie**：队列将满时服务端**不分配资源**，把连接信息编码进 SYN+ACK 的初始序列号里，待对端 ACK 带回再校验重建，从而抵御 SYN 洪水。
- **MSL 经验值**：RFC 9293 给的 MSL 默认约 **2 分钟**，故 `TIME_WAIT` 理论上约 4 分钟；Linux 实现常取更短（约 60s）。

## 一、为什么 TCP 要握手与挥手

TCP 是**面向连接（connection-oriented）**的可靠传输协议：在应用进程能互发数据之前，两端必须先通过握手**建立一条逻辑连接**、各自分配收发缓冲区与初始化序列号；通信结束后再通过挥手**有序释放**这些资源。这与[上一页 UDP](./udp-protocol) 的「无连接、发了就走」形成鲜明对比——UDP 没有握手，自然也没有连接状态可言。

::: info 连接 = 两端共同维护的一份状态
「建立连接」并非在网络中拉一根物理线，而是**双方各自在内核里记下一份连接控制块（TCB）**：对端地址、双向序列号、窗口、缓冲区等。握手就是协商同步这份状态，挥手则是双方都确认「可以丢弃它了」。
:::

TCP 用一组**标志位（flag）**驱动状态变迁，握手挥手里最关键的三个：

| 标志 | 含义 | 出现场景 |
| --- | --- | --- |
| `SYN` | Synchronize，请求同步序列号 | 建立连接（握手的前两步带它） |
| `ACK` | Acknowledgment，确认收到 | 几乎所有报文都带（除第一个 SYN） |
| `FIN` | Finish，本方向已无数据可发 | 释放连接（挥手时本端发出） |

## 二、三次握手（建立连接）

三次握手的目标只有一个：**让双方各自同步对方的初始序列号（ISN, Initial Sequence Number），并确认两个方向的收发通道都通畅**。

```
客户端                                              服务端
 CLOSED                                             LISTEN   ← 服务端已 bind+listen，等待连接
   │ ───────  ① SYN, seq=x  ──────────────────────►  │
 SYN_SENT                                          SYN_RCVD  ← 服务端记下客户端 ISN=x
   │ ◄──────  ② SYN+ACK, seq=y, ack=x+1  ──────────  │
   │                                                  │
 ESTABLISHED                                          │      ← 客户端确认：双向通道都正常
   │ ───────  ③ ACK, ack=y+1  ─────────────────────►  │
   │                                              ESTABLISHED
   │ ════════  此后开始全双工传输应用数据  ═══════════  │
```

- **第一次（SYN）**：客户端选一个初始序列号 `x`，发出 `SYN`（seq=x），进入 `SYN_SENT`。此报文**不携带数据但消耗一个序列号**。
- **第二次（SYN+ACK）**：服务端收到后，一方面用 `ack=x+1` 确认收到了客户端的 SYN，另一方面发出自己的 `SYN`（seq=y）同步己方序列号，合并成一个 `SYN+ACK` 报文，进入 `SYN_RCVD`。
- **第三次（ACK）**：客户端回 `ack=y+1` 确认服务端的 SYN，自身进入 `ESTABLISHED`；服务端收到这个 ACK 后也进入 `ESTABLISHED`。至此双方都确认了对方的 ISN，连接建立。

> The three message mechanism is designed so that two computers that want to pass information back and forth to each other can negotiate the parameters of the connection before transmitting data.
> —— MDN, TCP handshake

::: tip 序列号细节属于下一页
这里只需理解握手在「同步初始序列号」——序列号如何用于**按序交付、去重、确认**等可靠传输机制，是 [TCP 可靠传输](./tcp-reliable) 的主题，本页不展开。
:::

### 为什么必须三次，两次不够？

这是面试高频题，核心有两点：

**① 两次握手无法让服务端确认「客户端的接收能力」。**
连接全双工，正常工作必须确认**两个方向都通**。第一、二次握手只证明了「客户端→服务端」方向通；唯有**第三次 ACK** 才能让服务端确认「服务端→客户端」方向也通（客户端确实收到了我的 SYN+ACK）。少了第三次，服务端在「对方能否收到我」上无凭无据。

**② 防止已失效的历史连接请求被误建立。**
若客户端的第一个 SYN 在网络里**长时间滞留**（没丢，只是绕了远路），客户端超时重发、正常完成并关闭了一次连接之后，那个**迟到的旧 SYN** 才到达服务端——只有两次握手时，服务端一回 SYN+ACK 就单方面认为连接已建立，傻等数据、白占资源。

::: warning 三次握手如何堵死「历史连接」
有了第三次握手，服务端发出 SYN+ACK 后必须**等客户端的 ACK 确认**才进入 `ESTABLISHED`。面对那个迟到旧 SYN，客户端早已不处于等待状态，**不会回 ACK**（甚至直接回 `RST` 拒绝），于是这条虚假连接根本建立不起来。RFC 9293 正是用「双方都需确认对方序列号」来保证这一点。
:::

## 三、四次挥手（释放连接）

数据传完，连接需要释放。因为 TCP 是**全双工**——两个方向是两条独立的数据流——所以**每个方向都要单独关闭**，于是有了四次挥手。

```
（设客户端主动关闭）
客户端                                              服务端
 ESTABLISHED                                       ESTABLISHED
   │ ───────  ① FIN, seq=u  ───────────────────────► │   客户端：我没数据要发了
 FIN_WAIT_1                                         CLOSE_WAIT  ← 服务端可能还有数据没发完
   │ ◄──────  ② ACK, ack=u+1  ────────────────────── │
 FIN_WAIT_2                                            │       ← 此时仍可接收服务端的数据
   │                                                  │
   │ ◄──────  ③ FIN, seq=w  ──────────────────────── │   服务端：我也发完了
   │                                                LAST_ACK
   │ ───────  ④ ACK, ack=w+1  ─────────────────────► │
 TIME_WAIT                                          CLOSED     ← 服务端收到 ACK，彻底关闭
   │  等待 2MSL                                       │
 CLOSED
```

- **第一次（FIN）**：主动关闭方（这里是客户端）调用 `close()`，发出 `FIN`，表示「我这个方向没数据要发了」，进入 `FIN_WAIT_1`。
- **第二次（ACK）**：被动方回 `ACK` 确认，进入 `CLOSE_WAIT`。**此时连接进入「半关闭」状态**：客户端→服务端方向已关，但**服务端→客户端方向仍可继续发数据**，客户端也仍在接收。
- **第三次（FIN）**：等被动方把剩余数据发完、应用也调用 `close()`，它才发出自己的 `FIN`，进入 `LAST_ACK`。
- **第四次（ACK）**：主动方回 `ACK` 确认，进入 `TIME_WAIT`；被动方收到后立即 `CLOSED`。主动方再等 **2MSL** 后才 `CLOSED`。

### 为什么是四次，能不能合并成三次？

挥手比握手多一步，关键在 **第二、三次之间那段「半关闭」**：握手时服务端对 SYN 的确认（ACK）与自己的 SYN 可**合并**成一个 `SYN+ACK`，因为两件事此刻都能做；而挥手时被动方收到 FIN 后**通常还有数据没发完**，必须先立刻 ACK「我知道你要关了」，自己的 FIN 却得等数据发完、应用 `close()` 后才能发——两个动作**时机不同**、无法合并，于是 ACK 与 FIN 拆成第二、三两次。

::: info CLOSE_WAIT 堆积是一种典型 Bug 信号
`CLOSE_WAIT` 意味着「对端已经关了，但**本端应用还没调用 `close()`**」。如果服务器上出现**大量长期不消失的 `CLOSE_WAIT`**，几乎可以断定是应用代码**忘记关闭连接 / 连接泄漏**——内核已替你 ACK，但只有应用主动 `close()` 才能发出第三次 FIN 推进挥手。这是排查连接泄漏的重要线索。
:::

::: tip 若被动方确实无数据可发
当被动方收到 FIN 时恰好也没有数据要发了，部分实现会把第二次的 ACK 和第三次的 FIN **合并**成一个 `FIN+ACK`，挥手就「退化」成三次。所以「四次」是**逻辑上的最多步数**，不是物理上每次都恰好四个报文。
:::

## 四、TCP 状态机的关键状态

RFC 9293 定义了 11 个连接状态，下面是握手挥手途经的关键节点：

| 状态 | 所属阶段 | 含义 |
| --- | --- | --- |
| `LISTEN` | 建立 | 服务端已监听端口，等待 SYN |
| `SYN_SENT` | 建立 | 客户端已发出 SYN，等 SYN+ACK |
| `SYN_RCVD` | 建立 | 服务端已回 SYN+ACK，等第三次 ACK（半连接） |
| `ESTABLISHED` | 数据传输 | 连接已建立，可双向收发 |
| `FIN_WAIT_1` | 释放 | 主动方已发 FIN，等对方 ACK |
| `FIN_WAIT_2` | 释放 | 主动方的 FIN 已被确认，等对方的 FIN（半关闭） |
| `CLOSE_WAIT` | 释放 | 被动方已 ACK 对方 FIN，等本端应用 `close()` |
| `LAST_ACK` | 释放 | 被动方已发自己的 FIN，等最后一个 ACK |
| `TIME_WAIT` | 释放 | 主动方已发最后 ACK，等待 2MSL |
| `CLOSED` | — | 无连接状态（起点与终点） |

> When a connection is closed actively, it MUST linger in the TIME-WAIT state for a time 2×MSL (Maximum Segment Lifetime).
> —— RFC 9293

### TIME_WAIT 为什么要等 2MSL？

**MSL（Maximum Segment Lifetime）** 是一个 TCP 报文在网络中能存活的最长时间（RFC 9293 给的默认值约 2 分钟）。**主动关闭方**在发出最后那个 ACK 后进入 `TIME_WAIT` 并等待 **2MSL**，有两个不可省略的理由：

1. **确保最后的 ACK 能送达对端。** 若第四次 ACK 丢失，处于 `LAST_ACK` 的被动方会**超时重传 FIN**；主动方停留在 `TIME_WAIT` 才有机会收到这个重传 FIN 并**重发 ACK**。若主动方早早关闭，重传的 FIN 只会得到一个 `RST`，被动方无法正常关闭。一来一回最坏耗时正好约 2MSL（己方 ACK 一个 MSL + 对方 FIN 一个 MSL）。
2. **让本次连接的残余报文彻底消亡。** 等满 2MSL 保证旧连接迟到、绕路的包全部过期，**不会被误认成同一四元组（源IP+源端口+目的IP+目的端口）新连接的数据**而造成错乱。

::: warning 高并发服务器的 TIME_WAIT 堆积
主动关闭方才会产生 `TIME_WAIT`。**短连接、高 QPS** 且由服务端主动关闭时，会瞬间积压海量 `TIME_WAIT`，**占满本地端口**导致无法建立新连接。常见缓解：开启 `SO_REUSEADDR`、Linux 的 `tcp_tw_reuse`（复用 TIME_WAIT 端口发起新连接），或改用**长连接 / 连接池**从根上减少连接创建。注意 `tcp_tw_recycle` 因 NAT 环境下的隐患**早已被移除**，不要再用。
:::

## 五、半连接队列与 SYN 洪水攻击

服务端处理握手时维护两个队列：**半连接队列（SYN queue）** 暂存收到 SYN、回了 SYN+ACK 但**还没收到第三次 ACK** 的连接（处于 `SYN_RCVD`，即 **half-open** 半打开状态）；**全连接队列（accept queue）** 则放三次握手已完成、等待应用 `accept()` 取走的连接。

**SYN 洪水（SYN Flood）** 正是攻击半连接队列的经典 DDoS 手法：

```
攻击者（伪造源 IP）                                  服务端
   │ ──── SYN（源IP=随机伪造）───────────────────────► │
   │ ──── SYN（源IP=随机伪造）───────────────────────► │   半连接队列被海量
   │ ──── SYN（源IP=随机伪造）───────────────────────► │   half-open 连接塞满
   │            （从不回第三次 ACK）                    │
   │ ◄─── SYN+ACK（发往伪造 IP，石沉大海）──────────── │   每条都占用资源、等待超时
```

攻击者用**伪造的源 IP** 海量发 SYN，却**从不回应 SYN+ACK**（第三次 ACK 永不到来）。这些连接卡在 `SYN_RCVD` 塞满半连接队列、耗尽内存与连接跟踪资源，**正常客户端的 SYN 因队列已满被丢弃**，服务于是「拒绝服务」。

> A SYN flood is a type of DoS attack which aims to make a server unavailable... By repeatedly sending initial connection request (SYN) packets, the attacker is able to overwhelm all available ports, leaving the target system with half-open connections.
> —— Cloudflare, SYN Flood DDoS Attack

::: tip SYN Cookie：不占资源也能握手
**SYN Cookie** 是经典防御：当半连接队列将满时，服务端**不再为收到的 SYN 分配队列项**，而是把连接关键信息（时间戳、MSS、四元组哈希等）**编码进 SYN+ACK 的初始序列号**里发出去，随即「忘掉」这条连接。只有当对端回来一个合法的第三次 ACK 时，服务端从其 `ack` 值里**解码并校验**出原始信息，再真正建立连接。

由于伪造源 IP 的攻击者收不到 SYN+ACK、也就回不出正确 ACK，**服务端在握手完成前不浪费任何资源**，SYN 洪水便失去了着力点。Cloudflare 等正是综合 SYN Cookie、连接跟踪与行为分析来过滤伪造源、放行真实客户端。
:::

## 小结

TCP **面向连接**，传数据前用**三次握手**建立连接、传完用**四次挥手**释放。三次握手 `SYN → SYN+ACK → ACK` 的本质是**双向同步初始序列号并确认两个方向都通**；之所以必须三次而非两次，是为了让服务端确认客户端的接收能力、并堵死「迟到的历史 SYN 凭空建连」的漏洞。四次挥手 `FIN → ACK → FIN → ACK` 的多出一步源于 TCP **全双工**——两个方向各自独立关闭，中间夹着「半关闭」，故 ACK 与 FIN 通常不能合并；`CLOSE_WAIT` 堆积往往是应用忘记 `close()` 的 Bug 信号。状态机里，主动关闭方的 `TIME_WAIT` 要等 **2MSL**，以确保末个 ACK 送达、并让旧报文消亡不污染新连接。最后，握手的**半连接队列**会被 **SYN 洪水**用伪造源 IP 灌满而成为 DDoS 靶点，**SYN Cookie** 通过「握手完成前不分配资源」来化解。序列号与确认重传的细节，请继续看下一页。

---

- 上一页：[UDP 协议与适用场景](./udp-protocol)
- 下一页：[TCP 可靠传输](./tcp-reliable)
