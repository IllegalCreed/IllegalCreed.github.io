---
layout: doc
outline: [2, 3]
---

# TCP vs UDP 选型与队头阻塞

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **一句话选型**：要**可靠 + 有序**（不能丢、不能乱）选 **TCP**；要**低延迟**且能容忍少量丢包选 **UDP**。这是两者最本质的取舍。
- **TCP = 面向连接的可靠字节流**：三次握手建连、确认重传保不丢、序号保有序、内置流量控制与拥塞控制。代价是握手往返、首部大（20~60 字节）、丢包要等重传。
- **UDP = 无连接的裸数据报**：无握手、无确认、不保证送达 / 顺序 / 去重，只用校验和做完整性检查，首部仅 **8 字节**。代价全甩给应用层，但**快**。
- MDN 定性 UDP：「used together with IP for sending data when transmission speed and efficiency matter more than security and reliability」。
- **TCP 典型应用**：HTTP/1.1、HTTP/2、HTTPS、SSH、FTP、SMTP、数据库连接——凡是「数据必须完整正确」的场景。
- **UDP 典型应用**：DNS 查询、音视频实时流、在线游戏、VoIP、QUIC/HTTP3——凡是「迟到的数据不如丢掉」的场景。
- **TCP 队头阻塞（HOL Blocking）**：TCP 保证**严格有序交付**，一个报文段丢失会**阻塞它后面已到达的段**向应用层交付——这是「可靠有序」的固有代价。
- **HTTP/1.1 与 HTTP/2 都受 TCP 层 HOL 影响**：HTTP/2 多路复用消除了**应用层**队头阻塞（请求可并发交错），却把所有流塞进**一条 TCP**，问题下沉到**传输层**——一个包丢，全连接所有流齐卡。
- **HTTP/2 在高丢包下反而不如 HTTP/1.1**：HTTP/1.1 的 6 条并行 TCP 连接能分摊丢包，单连接的 HTTP/2 无处可逃。
- **TCP 层 HOL 正是 QUIC 的诞生动机**：QUIC 跑在 UDP 上、**为每个流独立做丢包检测与重传**，丢包只影响那一个流（详见[HTTP/3 与 QUIC](../../net-http-evolution/guide-line/http3-quic)）。
- **「TCP 更可靠 ≠ TCP 更好」**：可靠性不是免费的，它换来的延迟在弱网 / 实时场景里可能是致命的——选型看业务对「丢」与「等」的容忍度。

## 一、TCP vs UDP 全面对比

两者都建在 IP 之上、都靠端口区分应用进程（见[传输层与端口](./transport-ports-mux)），但设计哲学截然相反：**TCP 用复杂度换可靠，UDP 用不可靠换简单与速度**。

| 维度 | TCP | UDP |
| --- | --- | --- |
| 连接 | 面向连接，先三次握手建连 | 无连接，直接发包 |
| 可靠性 | 确认 + 重传，保证不丢 | 不保证送达（丢了就丢了） |
| 顺序 | 序号重排，保证有序交付 | 不保证顺序，先发未必先到 |
| 去重 | 自动去重 | 不去重，可能收到重复包 |
| 速度 / 延迟 | 较慢（握手 + 重传 + 拥塞退让） | 快、低延迟 |
| 首部开销 | 20~60 字节 | 固定 8 字节 |
| 流量控制 | 有（滑动窗口） | 无 |
| 拥塞控制 | 有（慢启动 / 拥塞避免，见[上一页](./flow-congestion-control)） | 无 |
| 传输单位 | 字节流（无消息边界） | 数据报（保留消息边界） |
| 广播 / 多播 | 不支持（点对点） | 支持 |
| 典型应用 | HTTP/1.1·2、HTTPS、SSH、FTP、SMTP | DNS、音视频流、游戏、VoIP、QUIC |

::: tip 抓住三个关键差异
**连接、可靠、有序**——这三点 TCP 全要、UDP 全不要。其余差异（速度、首部、流控拥控）都是这三点的连带结果：要可靠有序就得建连、确认、排序、退让，于是慢、首部大；不要这些就能极简、极快。
:::

## 二、选型决策：可靠优先还是延迟优先

选型不是「谁更先进」，而是问业务：**数据能不能丢？迟到的数据还有没有价值？**

```
            ┌─────────────────────────────┐
            │  数据必须完整、正确、不能丢？  │
            └──────────────┬──────────────┘
                  是 │            │ 否（可容忍少量丢包）
                     ▼            ▼
              ┌───────────┐  ┌─────────────────────────┐
              │  选 TCP   │  │ 对延迟 / 实时性极敏感？    │
              │ 文件/网页/ │  └────────┬───────┬────────┘
              │ 邮件/数据库│      是 │           │ 否
              └───────────┘         ▼           ▼
                              ┌──────────┐ ┌──────────────┐
                              │  选 UDP  │ │ 通常仍选 TCP  │
                              │ 直播/游戏/│ │（省心，可靠性 │
                              │ VoIP/DNS │ │  由内核兜底）  │
                              └──────────┘ └──────────────┘
```

::: info 为什么实时场景偏爱 UDP
MDN 点破：「Time-sensitive applications often use UDP because **dropping packets is preferable to waiting for packets delayed due to retransmission**」。直播里丢一帧画面，观众顶多察觉一瞬卡顿；可若为这一帧停下来等 TCP 重传，后面所有画面都被拖住，体验更糟。**「丢」比「等」代价小**，正是实时业务选 UDP 的核心逻辑。
:::

::: warning UDP 不等于「不可靠到不能用」
UDP 只是把可靠性**交给应用层自己实现**（MDN：「error checking and correction are either not necessary or are performed in the application」）。QUIC 就是最佳例证——它在 UDP 上**重新造了一套**比 TCP 更聪明的可靠传输。选 UDP 不是放弃可靠，而是「要不要、要哪种可靠」由你说了算。
:::

## 三、TCP 队头阻塞：可靠有序的代价

TCP 向上层承诺**按发送顺序、无缺漏**地交付字节流。这份承诺的副作用，就是**队头阻塞（Head-of-Line Blocking, HOL Blocking）**。

http3-explained 用一个绝妙的比喻：TCP 像两台机器之间一条**想象的链条**——

> TCP is a protocol for reliable transfers and you can basically think of it as an imaginary chain between two machines. ……if one link is suddenly missing, everything that would come after the lost link needs to wait.

某个 TCP 报文段一旦丢失，**它后面那些已经躺在接收端内核缓冲区里的段，也必须停下来等它重传补齐**，才能继续向上交付。因为 TCP 只认字节序号，它无法「跳过缺口先交付后面的」。

```
应用层期望:   段1  段2  段3  段4  段5
                          ↓ 段3 在网络中丢失
接收端到达:   [段1][段2][ ✗ ][段4][段5]   ← 4、5 已到，却被卡住
                          ↓
向应用交付:   段1  段2  ……（阻塞，等段3重传）…… 然后 3 4 5 一起放行
```

段 4、5 明明已经收到，却因为段 3 没补齐而**无法交付**——这就是 TCP 队头阻塞。

## 四、HTTP/1.1 与 HTTP/2 为何都困于 TCP 层 HOL

很多人以为 HTTP/2 的多路复用「解决了队头阻塞」，这话**只对了一半**：

- **HTTP/1.1 的应用层 HOL**：一条连接上请求**串行**排队，前一个响应没回来，后面请求只能干等（详见 HTTP 演进叶）。
- **HTTP/2 的多路复用**：把请求拆成帧、在一条 TCP 上**并发交错**传输，**消除了应用层 HOL**——请求之间不再相互排队。

但 HTTP/2 把所有流塞进了**同一条 TCP 连接**，于是阻塞从应用层**下沉到了传输层**：

::: danger HTTP/2 的隐痛：TCP 层队头阻塞
HTTP/2 在一条 TCP 上跑流 A、B、C。**只要属于流 A 的一个 TCP 包丢了**，按 http3-explained 的说法：「the entire TCP connection is brought to a halt while the lost packet is re-transmitted」——**B、C 的数据明明已到达，却被 TCP 一起卡住**，因为 TCP 根本不知道「流」的存在。

更扎心的是，这让 HTTP/2 在弱网下**有时反不如 HTTP/1.1**：

> At 2% packet loss …… HTTP/1 users are usually better off — because they typically have up to six TCP connections to distribute lost packets over.

HTTP/1.1 的 6 条并行 TCP 把丢包分摊到 6 条链路，一条卡了还有五条；HTTP/2 全压在一条上，无处可逃。
:::

根因很清楚：**只要传输层还是 TCP，应用层再怎么优化都绕不开 TCP 的有序交付约束。** 要根治，必须换掉传输层、让它「认识流」。

## 五、QUIC 如何用 UDP 绕开（引子）

既然 TCP 改不动（实现在操作系统内核、被全球中间设备硬编码），那就**另起炉灶**——这正是 **QUIC** 诞生的直接动机。

QUIC 构建在 **UDP** 之上，自己在用户态实现了连接、可靠传输、丢包重传、拥塞控制与流量控制。关键差异在于 **QUIC 让每个流相互独立**：

> When setting up two different streams over this connection, they are treated independently so that if any link goes missing for one of the streams, only that stream …… has to pause and wait.

**一个流丢包，只阻塞那一个流，其余流照常交付**——TCP 层队头阻塞被彻底消灭。这就是为什么 HTTP/3（HTTP over QUIC）在弱网下表现远胜 HTTP/2。

::: tip 记住这条因果链
**TCP 有序交付 → TCP 层队头阻塞 → HTTP/2 多路复用仍受困 → 催生 QUIC（UDP + 独立流）→ HTTP/3。** 「TCP 层 HOL 是 QUIC 的诞生动机」是贯穿现代 Web 传输演进的一条主线。
:::

QUIC / HTTP3 的完整机制（0-RTT、连接迁移、QPACK 等）不在本叶展开，详见 [HTTP/3 与 QUIC](../../net-http-evolution/guide-line/http3-quic)。

## 小结

本叶从端口与复用分用讲起，依次拆解了 UDP 的极简、TCP 的握手与可靠传输、流量控制与拥塞控制，最终收口于**选型与队头阻塞**这两个工程决策点：

- **选型本质是取舍**：TCP 用握手 / 确认 / 排序 / 退让换来「可靠 + 有序」；UDP 砍掉这一切换来「快」。决策只问业务——**数据能不能丢、迟到的数据还值不值钱**。
- **可靠不是免费的**：TCP 的「严格有序交付」必然带来**队头阻塞**——前面的段丢了，后面已到达的段也得等。这是可靠有序的固有代价，而非实现缺陷。
- **HTTP/2 没能根治 HOL**：它消除了应用层队头阻塞，却把问题留在 TCP 层；弱网高丢包下甚至不如多连接的 HTTP/1.1。
- **QUIC 给出终局答案**：用 UDP 重建传输层、让每个流独立处理丢包，从根上绕开 TCP 层 HOL——这正是它的诞生动机，也把传输层故事接到了 HTTP/3。

理解了「为什么 TCP 可靠却会卡、为什么要把传输层搬到 UDP 上重写」，你就握住了从 TCP/UDP 到 QUIC/HTTP3 这条演进主线的钥匙。

> 上一页：[流量控制与拥塞控制](./flow-congestion-control) ｜ 本叶速查与参考：[参考](../reference) ｜ 延伸：[HTTP/3 与 QUIC](../../net-http-evolution/guide-line/http3-quic)
