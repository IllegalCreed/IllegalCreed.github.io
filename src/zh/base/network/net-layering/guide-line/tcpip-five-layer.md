---
layout: doc
outline: [2, 3]
---

# TCP/IP 四层与五层教学模型

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **TCP/IP 模型是互联网的事实标准**：你每天用的网络都跑在它上面。Cloudflare 直言「the modern Internet does not strictly follow the OSI Model (it more closely follows the simpler **Internet protocol suite**)」——OSI 是教学参考，TCP/IP 才是真正运行的那套。
- **TCP/IP 自底向上四层**：**网络接口层（链路层）→ 网际层 Internet（IP）→ 传输层（TCP/UDP）→ 应用层**。RFC 1122 是其权威定义。
- **网络接口层 / 链路层**：在**同一条本地链路**上、无需路由器介入地把数据发到相邻节点。协议：Ethernet、Wi-Fi、PPP、ARP、MAC。
- **网际层 Internet（IP）**：跨越不同网络做**逻辑寻址 + 路由 + 转发**，提供「尽力而为、不保证送达」的数据报投递。协议：IP（IPv4/IPv6）、ICMP、IGMP、IPsec。
- **传输层（TCP/UDP）**：建立**进程到进程**的端到端通道，靠端口区分应用。**TCP** 面向连接、可靠有序；**UDP** 无连接、轻量快。
- **应用层**：直接为用户应用提供数据交换，**一层吃下 OSI 的应用 + 表示 + 会话三层**。协议：HTTP/HTTPS、DNS、SMTP、SSH、FTP、DHCP。
- **与 OSI 的两处合并**：① TCP/IP **应用层 = OSI 第 5/6/7 层**（会话 + 表示 + 应用）；② TCP/IP **网络接口层 = OSI 第 1/2 层**（物理 + 数据链路）。中间的传输层、网际/网络层一一对应。
- **五层教学模型**：把 TCP/IP 的「网络接口层」**显式拆成物理层 + 数据链路层**，得到「物理 / 数据链路 / 网际 / 传输 / 应用」五层——教学上更清楚，工程上仍是 TCP/IP。
- **为什么是事实标准**：**先有实现、后有模型**（DARPA 1970s 边做边定，跑通了才写进 RFC），且**简洁实用**——只设必要的层、把可靠性和智能放在端侧（端到端原则）。
- **「严格分层只是近似」**：RFC 1122 明说「strict layering is an imperfect model」，允许为实现效率有策略地跨层——这点和 OSI 的理想化形成鲜明对比。
- **上一页**讲 OSI 七层逐层职责，**本页**讲真正运行的 TCP/IP，**下一页**讲数据在这些层间如何封装。

## 一、TCP/IP 模型：互联网真正运行的那套

[上一页](./osi-seven-layers) 讲的 OSI 七层是 ISO 制定的**理想参考模型**——结构完美，却几乎没有协议严格按它实现。真正驱动今天整个互联网的，是另一套更早诞生、更简洁的模型：**TCP/IP 模型**（又称 **Internet protocol suite**，互联网协议族）。

Cloudflare 在讲 OSI 时主动澄清了二者关系：

> Although the modern Internet does not strictly follow the OSI Model (it more closely follows the simpler **Internet protocol suite**), the OSI Model is still very useful for troubleshooting network problems.

一句话定位：**OSI 用来「教学与排障」，TCP/IP 用来「真正跑业务」**。学网络要懂 OSI 的分层思想，写代码、抓包、查故障面对的全是 TCP/IP。

::: info 命名来历
模型以两个核心协议命名——**TCP**（传输层）和 **IP**（网际层）。它们是整个协议族里最关键的两块，故以偏概全称作 “TCP/IP”，实际包含 HTTP、DNS、UDP、ICMP 等一大批协议。
:::

## 二、TCP/IP 四层逐层职责

RFC 1122（互联网主机通信要求的权威文档）把协议族划成**四层**，自底向上如下：

| 层（自底向上） | 核心职责 | 投递单位 | 典型协议 |
| --- | --- | --- | --- |
| **应用层** Application | 为用户应用提供数据交换；含用户协议与基础支撑协议 | 报文 Message | HTTP/HTTPS、DNS、SMTP、SSH、FTP、DHCP |
| **传输层** Transport | **进程到进程**端到端通信，靠端口区分应用，提供可靠或无连接服务 | 段 Segment / 数据报 Datagram | TCP、UDP（及 QUIC、SCTP） |
| **网际层** Internet | 跨网络的**逻辑寻址 + 路由 + 转发**，尽力而为投递数据报 | 包 Packet / 数据报 | IP（IPv4/IPv6）、ICMP、IGMP、IPsec |
| **网络接口层** Link | 在**同一条本地链路**上把数据发往相邻节点，无需路由器介入 | 帧 Frame | Ethernet、Wi-Fi、PPP、ARP、MAC |

### 网络接口层（链路层）

负责**单跳、本地链路**内的传输。Wikipedia 定义其「defines the networking methods within the scope of the local network link on which hosts communicate without intervening routers」——即在**没有路由器介入**的一段链路上把帧送到相邻设备。它屏蔽了底层物理介质（网线、光纤、无线电波）的差异，向上层提供统一的「发一帧到隔壁」能力。**ARP**（把 IP 地址解析成 MAC 地址）也归在这一层。

### 网际层 Internet（IP）

整个模型的**腰部承重墙**。它用层级化的 IP 地址做**逻辑寻址**，并通过**路由**为数据报选择跨网络的转发路径，提供「unreliable datagram transmission facility between hosts」——**只管尽力送达，不保证不丢、不保证有序、不保证不重复**。可靠性被刻意上移到传输层，这正是 TCP/IP 「保持核心简单、把智能放在端侧」设计哲学的体现。**ICMP**（差错与诊断，`ping` 即用它）也在这一层。

### 传输层（TCP/UDP）

把「主机到主机」（网际层的能力）升级为**进程到进程**——靠 16 位**端口号**区分同一台主机上的不同应用。两大协议哲学相反：

- **TCP**：面向连接、确认重传保不丢、序号保有序、内置流量控制与拥塞控制——「数据必须完整正确」的场景（网页、邮件、SSH）。
- **UDP**：无连接、不保证送达 / 顺序、首部仅 8 字节——「迟到不如丢掉」的低延迟场景（DNS、实时音视频、QUIC）。

::: tip 端到端原则
RFC 1122 点明：「all state information required for end-to-end flow control and reliability is implemented in the hosts, in the **transport layer** or in application programs」。**网络只管转发，可靠性由两端的主机自己负责**——这就是著名的「端到端原则（end-to-end principle）」，也是互联网能做大、能演进的根本设计。
:::

### 应用层

直接服务于用户进程，**一层囊括了 OSI 的应用、表示、会话三层**的职责。RFC 1122 进一步把它分成「用户协议」（Telnet、FTP、SMTP，今天更多是 HTTP）和「支撑协议」（DNS、SNMP、DHCP）。TCP/IP **不单独设表示层和会话层**——数据格式、加密、会话管理等若有需要，由各应用协议自行处理（如 HTTPS 在应用层之下用 TLS 做加密、HTTP 自己管会话）。

## 三、TCP/IP 四层 与 OSI 七层的映射

两套模型在**中间两层一一对应**，差异集中在**顶部与底部各一处合并**：

| OSI 七层 | TCP/IP 四层 | 对应关系 |
| --- | --- | --- |
| 7 应用 / 6 表示 / 5 会话 | **应用层** | **三合一**：TCP/IP 应用层 = OSI 5+6+7 |
| 4 传输 | **传输层** | 一一对应 |
| 3 网络 | **网际层** | 一一对应 |
| 2 数据链路 / 1 物理 | **网络接口层** | **二合一**：TCP/IP 网络接口层 = OSI 1+2 |

::: warning 两处合并最容易记混
- **顶部三合一**：OSI 把「会话管理 / 数据表示 / 应用服务」拆成三层；TCP/IP 认为这些都该由应用自己看着办，**全塞进应用层**。
- **底部二合一**：OSI 把「比特物理传输」与「成帧 / 链路控制」分成物理层和数据链路层；TCP/IP 把它们打包成一个**网络接口层**，因为「具体怎么把比特怼上线路」属于实现细节，模型不必操心。

记忆口诀：**TCP/IP 头尾各砍一刀——头部三层并一层，尾部两层并一层，中间原样保留。**
:::

Wikipedia 也强调了关键区别：TCP/IP「does not consider the specifics of formatting and presenting data and does not define additional layers between the application and transport layers as in the OSI model」——它**刻意不去管数据表示，也不在应用层和传输层之间多设层次**，一切从简。

## 四、五层教学模型：把网络接口层拆开

四层模型工程上够用，但教学上有个不便：**网络接口层太「胖」**，把「物理比特传输」和「成帧 / 链路控制」混在一起，初学者不易区分。于是教科书（如 Tanenbaum、Kurose）普遍采用一个折中——**五层教学模型**：

| 五层教学模型 | 由谁演变而来 |
| --- | --- |
| 5 应用层 Application | = TCP/IP 应用层 |
| 4 传输层 Transport | = TCP/IP 传输层 |
| 3 网际层 Internet | = TCP/IP 网际层 |
| 2 **数据链路层** Data Link | ← 网络接口层**拆出**：成帧、MAC 寻址、链路差错控制 |
| 1 **物理层** Physical | ← 网络接口层**拆出**：比特流、电气信号、传输介质 |

```
   OSI 七层          TCP/IP 四层        五层教学模型
  ┌─────────┐                          ┌─────────┐
  │ 7 应用   │                          │         │
  │ 6 表示   │  ───►   ┌─────────┐ ───► │  应用    │
  │ 5 会话   │         │  应用    │      │         │
  ├─────────┤         ├─────────┤      ├─────────┤
  │ 4 传输   │  ───►   │  传输    │ ───► │  传输    │
  ├─────────┤         ├─────────┤      ├─────────┤
  │ 3 网络   │  ───►   │  网际    │ ───► │  网际    │
  ├─────────┤         ├─────────┤      ├─────────┤
  │ 2 数据链路│  ───►   │ 网络接口 │ ───► │ 数据链路 │  ← 拆
  │ 1 物理   │         │ (链路)   │      │  物理    │  ← 开
  └─────────┘         └─────────┘      └─────────┘
```

::: tip 五层模型的定位：教学拐杖，不是新标准
五层模型**没有任何 RFC 定义它**，它本质上仍是 TCP/IP——只是借用 OSI 物理 / 数据链路的划分，把那个「胖」的网络接口层拆清楚，方便讲课。Wikipedia 称它「reconciles TCP/IP with OSI by explicitly separating physical transmission from data link operations」。**真实系统按四层实现，课堂上按五层讲解**，二者讲的是同一回事。
:::

## 五、为什么 TCP/IP 成了事实标准

OSI 由 ISO 倾力设计、结构更完整，为何反被「更糙」的 TCP/IP 全面取代？两个根本原因：

### 先有实现，后有模型

TCP/IP 不是先画图再写代码，而是 **DARPA 从 1960 年代末起边做边定**——协议在 ARPANET 上**真跑通了**，模型才被反过来总结进 RFC（如 1989 年的 RFC 1122）。等 OSI 标准在 1980 年代尘埃落定时，TCP/IP 早已随 ARPANET、Unix（BSD socket）和早期互联网铺遍全球，形成了无法撼动的**安装基数与生态惯性**。

### 简洁实用，只设必要的层

TCP/IP 信奉**最小够用**：只设必要的层，把可靠性、加密、会话等「智能」尽量放到端侧主机（端到端原则），保持网络核心简单。RFC 1122 甚至坦承「**strict layering is an imperfect model**」，允许为实现效率有策略地跨层——这种**务实**让它轻量、好实现、易扩展。反观 OSI，七层划分理想化、规范繁复、实现成本高，最终主要活在教科书里。

::: info 一句话总结成败
**TCP/IP 赢在「能用、好用、已经在用」**：跑通在先、简洁务实、生态既成。OSI 赢在「教得清」：分层严谨、概念清晰。所以今天的格局是——**用 OSI 的语言去理解，用 TCP/IP 的协议去运行。**
:::

## 小结

本页把视角从 OSI 的理想模型，切换到了**真正驱动互联网的 TCP/IP 模型**：

- **TCP/IP 四层**（网络接口 → 网际 → 传输 → 应用）由 RFC 1122 定义，是互联网的**事实标准**；OSI 更多用于教学与排障。
- **逐层职责**：网络接口层管本地单跳，网际层（IP）管跨网寻址路由，传输层（TCP/UDP）管进程到进程，应用层直接服务用户应用。
- **与 OSI 两处合并**：应用层 = OSI 5+6+7；网络接口层 = OSI 1+2；中间传输、网际/网络层一一对应。
- **五层教学模型**只是把网络接口层显式拆成物理层 + 数据链路层，方便讲课，本质仍是 TCP/IP。
- **它成为标准的原因**：先有实现后有模型（生态既成）+ 简洁实用（端到端原则、最小够用）。

理解了「真正运行的是哪四层、每层管什么、它和 OSI 怎么对应」，下一步就该看**数据是如何在这些层之间被层层包装、再层层拆开**的——这正是封装与解封装要讲的故事。

> 上一页：[OSI 七层逐层职责](./osi-seven-layers) ｜ 下一页：[数据封装与解封装](./encapsulation)
