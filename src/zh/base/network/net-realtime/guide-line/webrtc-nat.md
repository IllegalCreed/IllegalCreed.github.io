---
layout: doc
outline: [2, 3]
---

# WebRTC 与 NAT 穿透

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **WebRTC 是什么**：浏览器原生的**点对点（P2P）实时通信**框架，无需插件即可在两端之间直接传**音视频与任意数据**；媒体走 SRTP（加密 RTP），数据走 DataChannel（基于 SCTP/DTLS）。
- **难在哪**：两端通常都躲在 **NAT** 后、持有不可被外部直连的**私有 IP**（如 `192.168.x.x`），彼此看不见对方的真实地址——NAT 基础见 [网络层 · NAT 与 DHCP](../../net-ip-routing/guide-line/nat-dhcp)。
- **信令（Signaling）**：连接前必须先交换 **SDP**（会话描述：媒体类型、编解码、加密、候选地址）与 ICE 候选。WebRTC **刻意不规定**信令通道，由你自选——工程上最常用 [WebSocket](./websocket-protocol)。
- **SDP Offer/Answer**：发起方 `createOffer` 生成 Offer → 经信令发给对端 → 对端 `createAnswer` 回 Answer，双方各存一份本地/远端描述（RFC 8866）。
- **ICE（交互式连接建立）**：统筹「**收集候选 → 配对 → 连通性检查 → 择优**」的框架，靠 STUN/TURN 拿到可用地址，再挑出能通的一对。
- **候选类型**：`host`（本机私有地址）/ `srflx`（STUN 发现的公网映射，server reflexive）/ `prflx`（连通检查中发现的对端反射地址）/ `relay`（TURN 中继地址）。
- **STUN（NAT 会话穿越工具）**：让设备发现自己经 NAT 后的**公网映射地址**（`XOR-MAPPED-ADDRESS`），并据此尝试 **UDP 打洞（hole punching）**——轻量、不耗服务器带宽。
- **TURN（绕 NAT 的中继）**：打洞失败时启用的**中继服务器**，双方都把流量发给它再转发，**保证连通但耗带宽、增延迟**；是兜底而非首选。
- **NAT 类型决定成败**：全锥 / 受限锥 / 端口受限锥多能靠 STUN 打洞成功；**对称型（Symmetric）NAT 最难**，双方都是对称型时几乎必须 TURN。
- **Trickle ICE**：候选边收集边发送，不等全部收齐，**显著缩短建连时间**。
- **DataChannel**：在同一条 P2P 通道上传任意数据（文件、游戏状态、信令以外的消息），可配可靠/有序或不可靠/无序，适合低延迟场景。
- **优先级**：ICE 总是**优先直连**（host/srflx），实在不行才退到 relay；UDP 优先于 TCP。

## 一、WebRTC：浏览器原生的 P2P 实时通信

WebRTC（Web Real-Time Communication）是一组让浏览器与浏览器**直接互联**的标准 API 与协议。与前几页的 [SSE](./sse)、[WebSocket](./websocket-protocol) 不同——那些是**客户端 ↔ 服务器**的推送/双工通道，数据必经服务器中转；WebRTC 追求的是**两个对端之间的直连**，音视频与数据尽量不经过服务器，从而把延迟压到最低、把服务器带宽成本降到几乎为零。

它主要解决三件事：**实时音视频通话**（媒体经 SRTP 加密传输）、**任意数据的 P2P 传输**（DataChannel），以及为此服务的**连接建立**（本页主角）。

::: info 本页只讲网络原理，不讲 JS API
`RTCPeerConnection`、`getUserMedia`、`createDataChannel` 等浏览器接口的写法归 **「Web 进阶 · Web API」** 章，本页只在流程示意里点到方法名以串起脉络，不展开调用细节。
:::

## 二、为什么 P2P 这么难：NAT 挡在中间

家庭/办公网络里，设备拿到的几乎都是**私有 IP**，对外共享路由器的**一个公网 IP**——这正是 [NAT（网络地址转换）](../../net-ip-routing/guide-line/nat-dhcp) 在做的事。NAT 带来一个对 P2P 致命的副作用：**外部无法主动连入内网设备**。

```
       Peer A                                      Peer B
   192.168.1.5（私有）                          10.0.0.7（私有）
        │                                            │
   ┌────┴─────┐                                ┌─────┴────┐
   │  NAT A   │  公网 IP: 203.0.113.4          │  NAT B   │  公网 IP: 198.51.100.9
   └────┬─────┘                                └─────┬────┘
        │            ❌ 互相看不到对方真实地址        │
        └───────────────── 公网 Internet ────────────┘
```

A 只知道自己是 `192.168.1.5`，这个地址在公网毫无意义；B 同理。双方既不知道对方的公网映射地址，NAT 也默认拒绝**未经内部发起**的入站包。要建立直连，必须先解决两个问题：**① 各自发现自己的公网映射地址；② 在两个 NAT 上「凿」出一条双向都允许通过的路径**。这就是 STUN / TURN / ICE 登场的地方。

## 三、信令：交换「怎么连」的信息

WebRTC 自己**不传递**建连所需的元信息——它把这一步称作**信令（signaling）**，并**刻意不规定**用什么通道。也就是说，「A 想找 B」这件事得靠你自己的服务器牵线：双方先各自连上同一个信令服务器，借它来回转发两类数据：

1. **SDP 会话描述**：用 [RFC 8866](https://datatracker.ietf.org/doc/html/rfc8866) 定义的纯文本格式，描述媒体类型、编解码器、加密参数、网络地址端口等——即「我能收发什么、用什么格式」。
2. **ICE 候选地址**：各端探测到的一个个可达地址（见下一节）。

::: tip 信令通道为何常用 WebSocket
信令要求**双向、低延迟、可即时推送**（对端的 Offer/候选随时可能到来），这正是 [WebSocket](./websocket-protocol) 的强项；用 HTTP 轮询也能做，但实时性差。注意：信令服务器只在**建连阶段**牵线，连上之后媒体/数据走 P2P 直连，**不再经过它**。
:::

SDP 的核心是 **Offer/Answer 协商**：

```
   发起方 A                信令服务器（如 WebSocket）              应答方 B
      │  createOffer()                                              │
      │  setLocalDescription(offer)                                 │
      │ ──── ① Offer (SDP) ─────────►  转发  ──────────────────────► │
      │                                          setRemoteDescription(offer)
      │                                          createAnswer()
      │                                          setLocalDescription(answer)
      │ ◄──────────────────── 转发  ◄──── ② Answer (SDP) ─────────── │
      │  setRemoteDescription(answer)                               │
      │                                                             │
      │ ══════ 此后双方边收集 ICE 候选边经信令交换（见第四节）══════════ │
```

每端维护**本地描述（local）**与**远端描述（remote）**两份 SDP；只有双方都拿到对方描述，才知道「该用什么编解码、往哪里发包」。

## 四、ICE：把能通的路径试出来

发现地址、配对、择优这一整套流程由 **ICE（Interactive Connectivity Establishment，交互式连接建立）** 统筹。它不是单一协议，而是一个**框架**，调度 STUN、TURN 协同工作，分四个阶段：

```
① 收集候选(Gathering)   ② 交换候选(经信令)   ③ 连通性检查(Checks)   ④ 择优(Nominate)
   host  / srflx / relay  ──►  对端 addIce...  ──►  STUN 探测每个候选对  ──►  选定一对(Selected Pair)
```

**① 收集候选地址（candidate）**——每端尽可能列出自己所有可达地址：

| 候选类型 | 来源 | 含义 |
| --- | --- | --- |
| `host` | 本机网卡 | 私有/本地 IP，同一局域网内可直连 |
| `srflx`（server reflexive） | **STUN** 服务器 | NAT 之外看到的**公网映射地址** |
| `prflx`（peer reflexive） | 连通检查中发现 | 对端经 NAT 反射出的地址，常见于 Trickle ICE |
| `relay` | **TURN** 服务器 | 中继地址，所有流量经 TURN 转发 |

**② 交换候选**：每收集到一个候选就经信令发给对端（即 **Trickle ICE**，边收边发、不必等齐，缩短建连时间）。

**③ 连通性检查**：双方把「本地候选 × 远端候选」两两配成**候选对（candidate pair）**，用带认证的 STUN 包逐对探测，看哪一对真能双向通。ICE 会选一端作**控制方（controlling agent）**负责拍板，另一端为**受控方（controlled agent）**。

**④ 择优**：从所有通过检查的候选对里选出最佳的一对**提名（nominate）**为 **Selected Pair**，媒体/数据自此走这条路；优先级总体是 **host > srflx > relay**、**UDP > TCP**——能直连绝不走中继。

> ICE allows peers to use intermediaries to exchange offers and answers even if the peers are separated by Network Address Translation (NAT).
> —— MDN, WebRTC connectivity

## 五、STUN：发现公网地址 + UDP 打洞

**STUN（Session Traversal Utilities for NAT，NAT 会话穿越工具）** 解决「我经过 NAT 后对外长什么样」。客户端向公网上的 STUN 服务器发一个 **Binding Request**，服务器原样回看到的源地址端口（放在 `XOR-MAPPED-ADDRESS` 属性里）——这就是该端的 **`srflx` 公网映射候选**。

```
   Peer A ──── Binding Request ───►  STUN 服务器
   (192.168.1.5)                         │
          ◄── Binding Response ──────────┘
              你的公网映射 = 203.0.113.4:51820  （srflx 候选）
```

拿到双方的公网映射后，ICE 便尝试 **UDP 打洞（hole punching）**：两端**几乎同时**向对方的公网映射地址发包。先发出的那个包会在**自己**的 NAT 上建立一条出站映射；当对端的包随后到达，恰好命中这条已存在的映射而被放行——一条双向通路就此「凿」通。STUN **轻量、不占服务器带宽**，是首选方案。

::: warning 打洞不是万能：对称型 NAT 会失败
打洞成立的前提是**「对同一个内部源，NAT 对外用的公网端口可预测/一致」**。**对称型（Symmetric）NAT** 偏偏对**不同目的地启用不同的公网端口映射**——A 问 STUN 时用的端口，和 A 真正发给 B 时用的端口**不一样**，于是 B 拿着「问 STUN 时的地址」根本打不进来。双方都是对称型 NAT 时，打洞基本必然失败，只能退而求其次走 TURN。NAT 类型详解见 [网络层 · NAT 与 DHCP](../../net-ip-routing/guide-line/nat-dhcp)。
:::

## 六、TURN：打洞失败时的中继兜底

**TURN（Traversal Using Relays around NAT，绕 NAT 的中继）** 是 STUN 打洞失败后的**兜底**：客户端在 TURN 服务器上申请一个**中继地址（Relayed Transport Address）**，之后双方都把流量发给 TURN，由它转发给对端。

```
   Peer A ───►  TURN 服务器（公网中继）  ◄─── Peer B
   (对称 NAT)        │   转发全部流量   │      (对称 NAT)
                     └── relay 候选 ───┘
   对端看到的源地址 = TURN 服务器，而非 A/B 真实地址
```

因为所有媒体/数据都过这台服务器，TURN **保证连通**，但代价明显：**额外延迟、占用服务器带宽与算力**（音视频流量可观，TURN 带宽成本是部署 WebRTC 的主要开销）。所以 ICE 把 `relay` 候选排在最后，只有 host/srflx 全都走不通时才落到它。

### STUN vs TURN 对比

| 维度 | STUN | TURN |
| --- | --- | --- |
| 角色 | 发现公网映射、辅助**打洞直连** | **中继转发**全部流量 |
| 数据是否经服务器 | 否（仅建连时问一下地址） | 是（媒体/数据全程经过） |
| 服务器带宽成本 | 极低 | **高**（与通话流量成正比） |
| 候选类型 | `srflx` | `relay` |
| 连通保证 | 视 NAT 类型，可能失败 | **几乎总能连通**（兜底） |
| 适用 NAT | 全锥 / 受限锥 / 端口受限锥 | **对称型**等打洞失败场景 |

::: tip 生产部署：STUN/TURN 都要配
实战中通常同时配置 STUN 与 TURN（TURN 服务器本身也兼具 STUN 能力），把它们一起塞进 ICE 服务器列表：ICE 会**优先用 STUN 直连，失败自动回落到 TURN**，从而兼顾「省带宽」与「保连通」。公网有免费 STUN，但 TURN 因耗带宽通常需自建或付费（如 coturn）。
:::

## 七、DataChannel：传音视频之外的任意数据

除了音视频，WebRTC 还提供 **DataChannel**，在同一条已建立的 P2P 通道上传输**任意数据**（文本、二进制、文件分片、游戏状态等）。它底层基于 **SCTP over DTLS**，因而：

- **加密**：复用 DTLS，传输默认加密；
- **可配传输语义**：既可像 TCP 那样**可靠 + 有序**，也可配成**不可靠 / 无序**（牺牲重传换更低延迟，适合实时游戏、状态同步）；
- **复用同一条 ICE 通路**：和媒体共用前面打通的连接，无需另开 NAT 穿透。

正因为是真正的 P2P，DataChannel 在**文件直传、低延迟多人游戏、协同白板**等场景里能绕开服务器中转，省成本又降延迟。

## 小结

WebRTC 让浏览器之间**直接 P2P 传输音视频与任意数据**，难点在于双方都躲在 [NAT](../../net-ip-routing/guide-line/nat-dhcp) 后、持私有 IP 而无法直连。建连分三层：**信令**负责经一条你自选的通道（常用 [WebSocket](./websocket-protocol)）交换 **SDP**（Offer/Answer，描述媒体能力）与 ICE 候选，WebRTC **本身不规定**这条通道；**ICE** 统筹「收集候选（host/srflx/relay）→ 经信令交换 → 连通性检查 → 择优提名」；其中 **STUN** 帮设备发现公网映射地址并尝试 **UDP 打洞**直连（轻量、省带宽），**TURN** 则在打洞失败（典型是双方均为**对称型 NAT**）时充当**中继**兜底（保连通但耗带宽）。ICE 始终**优先直连、UDP 优先**，relay 只作最后选项。连接建好后，**DataChannel** 还能在同一通道上传任意数据，可配可靠/不可靠语义。`RTCPeerConnection` 等浏览器 API 的具体写法见「Web 进阶 · Web API」章；下一页将横向对比所有实时方案并给出选型建议。

---

- 上一页：[WebSocket 心跳·重连·工程实践](./websocket-practice)
- 下一页：[实时方案对比与选型](./realtime-comparison)
- 延伸阅读：[网络层 · NAT 与 DHCP](../../net-ip-routing/guide-line/nat-dhcp)
