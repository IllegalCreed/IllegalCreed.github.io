---
layout: doc
outline: [2, 3]
---

# ICMP 与 ping/traceroute

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **ICMP（Internet Control Message Protocol，因特网控制报文协议）是网络层的「差错报告与控制协议」**，给 IP 当辅助——IP 只管尽力转发、不管成败，由 ICMP 把「投递失败」的坏消息回送给源端。
- **ICMP 不是传输层协议**：它不依赖 TCP/UDP，是**无连接**的——发报文前无需握手，也**无法指定端口**（没有端口概念）。
- **ICMP 报文封装在 IP 数据报里**：IP 首部之后跟 ICMP 首部 + 数据。差错类报文的数据区会**回带「出错的原始 IP 首部 + 前 8 字节」**，便于源端定位是哪条流出的问题。
- **四类高频报文**：回显请求/应答（Echo，type 8/0，ping 用）、目的不可达（Destination Unreachable，type 3）、超时（Time Exceeded，type 11，traceroute 用）、重定向（Redirect，type 5，提示更优网关）。
- **`ping` = 测连通性 + RTT**：连发 Echo Request、等 Echo Reply，报告**往返时延 RTT** 与**丢包率**，是判断「通不通、快不快、稳不稳」的第一把尺。
- **ping 统计三件套**：`packets transmitted/received` + `packet loss %` + `rtt min/avg/max/mdev`——平均看延迟、mdev 看抖动、丢包率看稳定性。
- **`traceroute`/`tracert` = 探路径**：从 **TTL=1 起逐跳递增**，每经一跳 TTL 减到 0 触发路由器回送 **Time Exceeded**，源端据此逐个「点名」沿途路由器。
- **探测协议有平台差异**：Linux `traceroute` **默认发 UDP**（目的端口 33434~33534，到终点收 Destination Unreachable 收尾）；Windows `tracert` **发 ICMP Echo Request**（到终点收 Echo Reply 收尾）。
- **ICMP 常被防火墙拦截**：很多服务器/云主机默认丢弃 ICMP，所以 **ping 不通 ≠ 主机宕机**，只能说明「ICMP 这条路不通」，需用真实业务端口（如 `telnet host 443`、`curl`）二次确认。
- **traceroute 出现 `*` 很常见**：某跳超时无应答（防火墙拦 / 限速 / 不回 ICMP），**不代表链路在此中断**，只要后续跳能继续显示就说明数据仍在前进。
- **ICMP 会被滥用**：Ping 洪水（海量 Echo Request 耗尽资源）、Smurf（伪造源 IP 的反射放大）、Ping of Death（超大畸形包）——后两者已基本是历史，仅威胁老旧设备。
- **本页只讲 ICMP 诊断**：路由表与转发决策见[路由原理与路由器/网关](./routing-router-gateway)，IP 首部 TTL 的基础含义见 [IP 协议与 IPv4 寻址](./ip-protocol-ipv4)。

## 一、ICMP 是什么：给 IP 兜底的「差错信使」

IP 协议奉行**尽力而为（best-effort）**：它只负责把数据报朝目的地转发，**不保证送达、不报告失败**。可一旦包被丢了——目标不可达、生存时间耗尽、路由器缓冲区满——源端总得知道，否则无从排错。这个「捎坏消息」的活儿，就交给了 **ICMP（Internet Control Message Protocol，因特网控制报文协议）**。

> The Internet Control Message Protocol (ICMP) is a network layer protocol used by network devices to diagnose network communication issues. ICMP is crucial for error reporting and testing.
> —— Cloudflare, What is ICMP?

它有两大用途：① **差错报告（主）**——当某段数据没能抵达目的地时，ICMP 生成错误报文回送给发送方（如包对某路由器过大、被丢弃并回送提示）；② **网络诊断（次）**——`ping` 与 `traceroute` 这两个最常用的终端工具，底层都靠 ICMP 工作。

### ICMP 不是传输层协议

很容易把 ICMP 误当成 TCP/UDP 的同类，但它**直接架在 IP 之上、属于网络层**，且有两个关键特性：① **无连接（connectionless）**——发报文前无需像 TCP 那样先握手，「发了就发了」；② **无端口概念**——它面向「主机/路由器」这一层，**无法定位到设备上的具体端口/进程**。

> Unlike the Internet Protocol (IP), ICMP is not associated with a transport layer protocol such as TCP or UDP. This makes ICMP a connectionless protocol... The ICMP protocol also does not allow for targeting a specific port on a device.
> —— Cloudflare, What is ICMP?

### 一个 ICMP 报文长什么样

ICMP 报文**封装在 IP 数据报内部**——IP 首部（协议号 = **1**）之后紧跟 ICMP 首部 + 数据区。首部最关键的两个字段是 **类型（Type）** 与 **代码（Code）**：类型定大类（如「目的不可达」），代码定细分原因（如网络/主机/端口不可达）。

```
[ IP 首部 (Protocol=1) ][ ICMP: Type | Code | Checksum | … | 数据 ]
                                                            └─ 差错报文的「数据」
       = 出错的原始 IP 首部 + 数据前 8 字节（让源端对号入座：是哪条流出的问题）
```

> When a router or server needs to send an error message, the ICMP packet body or data section always contains a copy of the IP header of the packet that caused the error.
> —— Cloudflare, What is ICMP?

> 抓包小技巧：IP 协议号 **1** = ICMP（对比 TCP=6、UDP=17），Wireshark 里按 `icmp` 过滤即可。

## 二、常见 ICMP 报文类型

ICMP 报文很多，但前端排障真正高频的就这几类。记住「类型号 + 触发场景」即可：

| 报文类型 | Type | 典型 Code | 触发场景 | 谁在用 |
| --- | --- | --- | --- |
| 回显应答 Echo Reply | 0 | 0 | 收到回显请求后的「我在」回应 | ping |
| 目的不可达 Destination Unreachable | 3 | 0 网络 / 1 主机 / 3 端口 | 包到不了目标网络、主机或端口 | traceroute 收尾 |
| 重定向 Redirect | 5 | 0~3 | 网关提示源端「有更优的下一跳」 | 路由优化 |
| 回显请求 Echo Request | 8 | 0 | 主动探测「你在不在」 | ping |
| 超时 Time Exceeded | 11 | 0 TTL 耗尽 / 1 分片重组超时 | 包的 TTL 在途中减到 0 被丢 | traceroute |

::: info 重定向（Redirect）为何今天少见
Redirect 用于网关告诉同网段主机「这个目的地，走另一个网关更近」。但出于安全考虑（可被用于流量劫持），现代主机多默认**忽略 ICMP 重定向**，路由调整改由动态路由协议在路由器之间完成——详见[路由原理与路由器/网关](./routing-router-gateway)。
:::

## 三、ping：测「通不通、快不快、稳不稳」

`ping` 是最朴素的连通性探针：向目标连发 **ICMP 回显请求（Echo Request，type 8）**，目标若可达且愿意回应，就返回 **回显应答（Echo Reply，type 0）**。源端据此算出**往返时延（RTT, Round-Trip Time）** 与**丢包率**。

> Ping operates by sending an ICMP echo request to the target host and waiting for an ICMP echo reply... it measures the round-trip time... reporting the minimum, maximum, the mean round-trip times, and standard deviation.
> —— Wikipedia, Ping (networking utility)

### 命令与输出

```bash
# Linux/macOS：-c 4 表示发 4 个包后停止
$ ping -c 4 example.com
PING example.com (93.184.216.34): 56 data bytes
64 bytes from 93.184.216.34: icmp_seq=0 ttl=56 time=11.6 ms   # ← 单次往返
64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=10.9 ms   # icmp_seq 递增 / ttl 剩余 / time 即 RTT
...
--- example.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss      # ← 丢包率
round-trip min/avg/max/stddev = 10.7/11.1/11.6/0.35 ms           # ← RTT 统计
```

读懂三行汇总：

- **`packets transmitted / received` + `packet loss`**：发了几个、回了几个、丢了百分之几——**丢包率是稳定性的核心指标**，>1% 就值得警觉。
- **`rtt min/avg/max`**：最快/平均/最慢往返时延，**平均值反映延迟水平**。
- **`stddev`（Linux 下叫 `mdev`）**：往返时延的标准差，**衡量抖动（jitter）**——值越大说明网络越不稳定，对实时音视频影响大。
- 每行里的 **`ttl=56`** 是回包到达时剩余的 TTL，可粗略反推中间经过了多少跳（不同系统初始 TTL 不同，常见 64/128/255）。

::: warning ping 不通 ≠ 对方宕机
出于抗攻击考虑，**大量服务器、云主机、CDN 节点默认丢弃 ICMP**，于是 `ping` 超时。这只能说明「ICMP 这条路被堵了」，**不能据此判定主机已死**。要确认服务存活，改测真实业务端口：`curl -I https://example.com`（HTTP/HTTPS）或 `nc -vz example.com 443`（探 TCP 端口）。
:::

Windows 命令为 `ping example.com`，默认发 4 个包，字段名略不同（`时间=` / `TTL=`），含义一致。

## 四、traceroute/tracert：用 TTL 把路径「一跳跳」逼出来

`ping` 只告诉你「端到端通不通」，看不见中间经过哪些路由器。`traceroute`（Windows 为 `tracert`）则能**逐跳还原数据包走过的路径**，其精妙之处全在**巧用 IP 首部的 TTL 字段**。

### 原理：TTL 从 1 递增，每跳「自爆」暴露身份

TTL（Time To Live）本是防环路的「步数上限」——**每经过一个路由器减 1，减到 0 就被丢弃**，并由该路由器回送 **ICMP 超时报文（Time Exceeded，type 11）**。traceroute 反过来利用了这一机制：

> Traceroute sends packets with TTL values that gradually increase from packet to packet, starting with TTL value of one. Routers decrement TTL values of packets by one when routing and discard packets whose TTL value has reached zero, returning the ICMP error message ICMP Time Exceeded.
> —— Wikipedia, Traceroute

```
源 ─TTL=1─► R1(减到0,丢弃) ─► 回 Time Exceeded   ← 第 1 跳现身：R1
源 ─TTL=2────────► R2(减到0,丢弃) ─► 回 Time Exceeded ← 第 2 跳：R2
源 ─TTL=3───────────────► 目标主机(到达) ─► 回 终点应答  ← 抵达，停止递增
```

每个 TTL 值默认发 **3 个探测包**，故每跳显示 3 个时延（毫秒）；**`*` 表示该次探测超时无应答**（常因路由器限速或防火墙不回 ICMP），并不代表链路在此断开。

```bash
$ traceroute example.com
traceroute to example.com (93.184.216.34), 30 hops max, 60 byte packets
 1  192.168.1.1   1.2 ms   1.1 ms   1.0 ms              # 家用网关，3 次探测时延
 2  100.64.0.1    8.5 ms   8.7 ms   8.6 ms              # 运营商接入
 3  * * *                                               # 此跳超时不回 ICMP（非中断）
 4  93.184.216.34  11.6 ms  11.2 ms  11.0 ms            # 抵达终点
```

### 平台差异：Linux 默认 UDP，Windows 用 ICMP

「TTL 递增」是共同骨架，但**首发探测包用什么协议**因平台而异，这直接决定了「到达终点时靠什么报文收尾」：

| 维度 | Linux `traceroute`（默认） | Windows `tracert` |
| --- | --- | --- |
| 探测包协议 | **UDP**，目的端口 33434~33534（刻意取无人监听的高端口） | **ICMP Echo Request**（type 8） |
| 途中每跳 | 收 ICMP Time Exceeded（type 11） | 收 ICMP Time Exceeded（type 11） |
| 到达终点 | 端口无人监听 → 收 **Destination Unreachable**（type 3 code 3，端口不可达） | 收 **Echo Reply**（type 0），与 ping 同 |

> By default, traceroute sends a sequence of UDP packets, with destination port numbers ranging from 33434 to 33534... tracert sends ICMP Echo Request packets, rather than the UDP packets traceroute sends by default.
> —— Wikipedia, Traceroute

::: tip Linux 也能切到 ICMP 模式
Linux `traceroute -I example.com` 即用 ICMP Echo（行为接近 Windows）；`traceroute -T -p 443 example.com` 则改用 **TCP SYN** 探测——当中间防火墙放行 443/TCP 却拦 UDP/ICMP 时，TCP 模式往往能穿透并测出真实路径。
:::

::: warning 防火墙会让 traceroute「失真」
> If a network has a firewall and operates both Windows and Unix-like systems, more than one protocol must be enabled inbound through the firewall for traceroute to work and receive replies.
> —— Wikipedia, Traceroute

实践含义：连续几跳显示 `*` 或某些路由器「隐身」是常态；不同探测协议（UDP/ICMP/TCP）测出的路径可能不同；**traceroute 的结果是「能看见的路径」，未必是包走的全部真实路径**。排障时要结合多种探测手段交叉判断。
:::

## 五、ICMP 的滥用：从诊断工具到攻击载荷

ICMP 「无需握手、人人响应」的便利，反过来也成了 DDoS（分布式拒绝服务）的温床。了解几类经典攻击，有助于理解「为什么运维要默认限制 ICMP」：

- **Ping 洪水 / ICMP 洪水（Ping flood）**：攻击者用海量 ICMP 回显请求淹没目标，目标被迫**逐个处理并回应**，计算资源被耗尽，正常用户无法获得服务——最直接的 ICMP 滥用。
- **Smurf 攻击（Smurf attack）**：攻击者发送**伪造源 IP**（伪装成受害者）的 ICMP 包到广播地址，网络中大量设备的应答全部涌向受害者——属于**反射放大**型攻击。
- **死亡之 Ping（Ping of Death）**：发送**超过最大允许尺寸的畸形 ping 包**，目标在重组分片时发生缓冲区溢出而崩溃。

> A ping flood or ICMP flood is when the attacker attempts to overwhelm a targeted device with ICMP echo-request packets... In a Smurf attack, the attacker sends an ICMP packet with a spoofed source IP address.
> —— Cloudflare, What is ICMP?

::: info 后两者多已是「历史课」
**Ping of Death 与 Smurf 如今基本只对老旧设备有效**（现代系统修了分片重组漏洞、路由器默认不转发定向广播），但 **Ping 洪水及更广义的网络层 DDoS 依旧现实存在**——这正是众多主机**默认丢弃或限速 ICMP** 的根本原因，也回过头解释了「ping 不通 ≠ 宕机」。
:::

## 小结

- **ICMP 是网络层的差错报告与控制协议**，给「尽力而为」的 IP 兜底；它无连接、无端口，报文封装在 IP 内，差错报文会回带原始 IP 首部供源端对号入座。
- **四类高频报文**记牢类型号：Echo（8/0）、Destination Unreachable（3）、Time Exceeded（11）、Redirect（5）。
- **`ping`** 靠 Echo 请求/应答测连通性，读懂 **丢包率 + RTT(min/avg/max) + 抖动(mdev)** 三项汇总；**ping 不通不等于主机宕机**，需用真实端口复测。
- **`traceroute`** 巧用 **TTL 从 1 递增 + 每跳 Time Exceeded** 逐跳还原路径；**Linux 默认 UDP、Windows 用 ICMP**，防火墙拦截会让结果出现 `*` 与失真。它**易被滥用**（Ping 洪水 / Smurf / 死亡之 Ping），这正是运维默认限制 ICMP 的根源。

上一页：[路由原理与路由器/网关](./routing-router-gateway) ｜ 下一页：[NAT 与 DHCP](./nat-dhcp)
