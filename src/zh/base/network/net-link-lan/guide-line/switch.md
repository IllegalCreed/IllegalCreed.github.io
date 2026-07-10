---
layout: doc
outline: [2, 3]
---

# 交换机工作原理

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **交换机 = 二层设备**：工作在 OSI 数据链路层（layer 2），「按**目的 MAC 地址**转发数据」，本质是一个多端口网桥（multiport network bridge）。
- **交换机 vs 路由器**：交换机在**同一网络内**互联设备、按 MAC 转发；路由器在**不同网络之间**按 IP 转发——「a switch only sends data to the single device it is intended for, not to networks of multiple devices」。
- **MAC 地址表（CAM 表）**：内存里一张「MAC ↔ 端口」映射表，思科等也称 CAM（Content Addressable Memory）表；断电即丢、重启后重新学习。
- **自学习（learning）**：看**源 MAC** 学——记下「这个源 MAC 来自哪个入端口」，把映射写进表。
- **转发判断**：查**目的 MAC**——表里有且在**别的**端口 → **转发（forward）**；目的就在**入端口同侧** → **过滤（filter，丢弃不外发）**；表里**查不到** → **泛洪（flood）**。
- **泛洪两种**：未知单播（目的 MAC 不在表里）和**广播帧**（目的 `FF:FF:FF:FF:FF:FF`）都向除入端口外的所有端口转发。
- **冲突域**：交换机**每个端口是一个独立冲突域**——「there is a separate collision domain on each switch port」；全双工链路下冲突被彻底消除。
- **广播域**：交换机**默认整网是一个广播域**——广播帧仍被泛洪到所有端口（分割广播域要靠 VLAN，见下一页）。
- **交换机 vs 集线器（hub）**：hub 是物理层「傻」设备，电信号无脑复制到所有端口、共享带宽、半双工、整机一个冲突域；switch 是链路层「智能」设备，按 MAC 精确转发、端口独享带宽、全双工。
- **存储转发（store-and-forward）**：收完整帧 → 校验 FCS → 再转发，能丢错帧，延迟略高、最常见。
- **直通（cut-through）**：读完目的 MAC（前 6 字节）就开始转发，延迟极低，但会把错帧也透传出去。

把一栋楼里几十台电脑接到一起，靠的不是「谁喊话大家都听见」，而是一台会**认人发信**的设备——**交换机（switch）**。它工作在数据链路层（第二层），看的是**目的 MAC 地址**：通过一张**MAC 地址表**记住「哪个 MAC 挂在哪个端口」，于是来一帧就只往对应端口送，而不是逐个端口喊。本页讲清楚交换机如何**自学习**这张表、对一帧做**转发 / 过滤 / 泛洪**的判断逻辑，为什么它「每端口一个独立冲突域、整网默认一个广播域」，以及它与老式集线器（hub）、存储转发 vs 直通在原理上的根本差别。

## 一、交换机是什么：二层的「认人发信」设备

Cloudflare 的定义很直白：

> A network switch connects devices within a network (often a local area network, or LAN) and forwards data packets to and from those devices. Unlike a router, a switch only sends data to the single device it is intended for... not to networks of multiple devices.

拆成几个关键词：

- **连接同一网络内的设备**：交换机干的是「把一群本地设备接到一起」的活；跨网络转发是路由器的事（见[网络层与路由](../../net-ip-routing/getting-started)章节）。
- **只发给目标那一台**：这是它区别于集线器的灵魂——不广播给所有人，而是「精确投递」。
- **工作在第二层**：Wikipedia 称交换机「operate at the data link layer (layer 2)」，是「a multiport network bridge」（多端口网桥），「uses MAC addresses to forward data」。

::: tip 二层 vs 三层交换机
绝大多数交换机是**二层交换机**，按**目的 MAC** 转发。还有**三层交换机**能按**目的 IP** 转发（相当于把路由功能做进交换硬件），有的两者都能。本页只讲二层——这是「交换机工作原理」的核心。MAC 地址本身（永久烧录、网络内有效）见[数据链路层与 MAC 寻址](./datalink-mac)，帧里 MAC 字段的位置见[以太网帧结构](./ethernet-frame)。
:::

## 二、MAC 地址表与自学习：交换机如何「认人」

交换机凭什么知道「目的 MAC 挂在哪个端口」？靠一张**MAC 地址表**（思科等厂商称 **CAM 表**，Content Addressable Memory）。Cloudflare：

> Layer 2 network switches maintain a table in memory that matches MAC addresses to the switch's Ethernet ports. This table is called a Content Addressable Memory (CAM) table.

这张表不是预先配好的，而是交换机**边转发边自己学**出来的，规则就两句话：

- **看源 MAC 学**：每收到一帧，记下「**源 MAC** + **入端口**」写进表——这台设备既然从这个口发帧进来，那它必然挂在这个口。
- **查目的 MAC 转**：再用这帧的**目的 MAC** 去查表，决定从哪个口送出去（见下一节的转发/过滤/泛洪）。

### 自学习示意：从空表到学满

设 A 接端口 1、B 接端口 2、C 接端口 3。交换机刚开机，表是空的：

```text
【初始】MAC 地址表为空
  MAC 地址        端口
  ?              ?

① A → B 发一帧（源 A，目的 B）
   · 看源 MAC：记下「A 在端口 1」      → 写表
   · 查目的 MAC B：表里没有 B          → 泛洪到端口 2、3（除入端口 1 外全发）
  MAC 地址        端口
  A 的 MAC        1        ← 刚学到

② B 回 A 一帧（源 B，目的 A）
   · 看源 MAC：记下「B 在端口 2」      → 写表
   · 查目的 MAC A：表里有 A 在端口 1   → 只从端口 1 转发（不再泛洪）
  MAC 地址        端口
  A 的 MAC        1
  B 的 MAC        2        ← 又学到

③ 此后 A↔B 通信精确投递，C(端口3) 完全收不到——这就是交换机的价值
```

Cloudflare 把这套「记源、泛洪、记回复」的过程概括为：收到 A 发往 B 的帧时，交换机「records Computer A's MAC address and the port its message came in on」→「forwards Computer A's message to all other computers... this is known as flooding」→「When Computer B replies, it records Computer B's MAC address and port as well」。

::: warning 表项会老化，断电会清空
CAM 表存在内存里，「If the switch is turned off, the table will disappear and the switch has to relearn the table when it is rebooted」。此外每个表项都有**老化时间（aging time，典型 300 秒）**：一段时间没再见到某 MAC 当源地址，就删除该项——这样设备换了端口、下线后，旧映射不会一直占着位置。
:::

## 三、转发 / 过滤 / 泛洪：对一帧的三种处置

交换机收到一帧，用**目的 MAC** 查表后，只有三种结局：

| 情形（查目的 MAC） | 动作 | 说明 |
| --- | --- | --- |
| 表里**有**，且在**别的**端口 | **转发（forward）** | 精确投递，只从目标端口送出 |
| 表里**有**，但就在**入端口同侧** | **过滤（filter）** | 收发同口，说明在同一段已直达，**丢弃不外发** |
| 表里**查不到**（未知单播） | **泛洪（flood）** | 向**除入端口外的所有端口**转发，赌目标在某个口 |
| 目的是**广播 / 组播** | **泛洪** | 广播帧 `FF:FF:FF:FF:FF:FF` 天然要送达全网段 |

要点拆解：

- **未知单播泛洪**：目的 MAC 不在表里时，交换机不知道往哪送，只能向所有其它端口泛洪——「赌」目标挂在其中某个口。等目标回帧，源 MAC 就被学进表，下次便能精确转发，不再泛洪。
- **广播帧必泛洪**：目的地址是全 1（`FF:FF:FF:FF:FF:FF`）的广播帧，本就是「发给本网段所有人」，交换机一律泛洪到所有端口。**这正是「交换机不分割广播域」的根源**——广播能传遍整个交换网络。
- **过滤是「不发」**：如果目的设备和源在同一端口背后（比如该口下还挂了 hub），交换机判断「无需我转发它们也能互通」，于是丢弃该帧，避免无谓占用其它端口带宽。

::: tip 泛洪 ≠ 集线器广播
两者都「往多个口发」，但本质不同：集线器是**物理层无条件**把电信号复制到所有口（它根本不懂 MAC）；交换机泛洪是**二层有条件**的兜底——仅在「目的 MAC 未知」或「广播/组播」时才发，且学到后立即转为精确投递。一个是永远傻广播，一个是临时兜底。
:::

## 四、冲突域 vs 广播域：交换机的两条边界

这是理解交换机最关键、也最容易混淆的一对概念。

**冲突域（collision domain）**——Wikipedia 定义：

> A collision domain is a network segment (connected by a shared medium or through repeaters) where simultaneous data transmissions collide with one another.

即「同一时刻只能有一个设备发数据，否则信号相撞」的范围。在共享介质（如 hub）时代，靠 **CSMA/CD**（载波侦听多路访问/冲突检测）解决冲突——「competing packets are discarded and re-sent one at a time」（冲突的帧被丢弃、错峰重发）。

**交换机每个端口是一个独立冲突域**——Wikipedia 说得很清楚：「By connecting each device directly to a port on the switch, either each port on a switch becomes its own collision domain (in the case of half-duplex links), or the possibility of collisions is eliminated in the case of full-duplex links.」在现代**全双工**链路下，收发各走一对线，**冲突被彻底消除**，CSMA/CD 形同虚设。

**广播域（broadcast domain）**——广播帧能到达的范围。交换机**默认不分割广播域**：前面说过，广播帧会被泛洪到所有端口，所以**整个交换网络默认是一个广播域**。Wikipedia 也确认「broadcasts are still being forwarded to all connected devices by the switch」。

```text
            ┌─────────── 交换机（switch）───────────┐
            │  端口1     端口2     端口3     端口4   │
            │   │         │         │         │      │
            │  PC-A      PC-B      PC-C      PC-D    │
            └───┼─────────┼─────────┼─────────┼──────┘
   冲突域：   ［独立］   ［独立］   ［独立］   ［独立］   ← 每端口各一个，互不干扰
   广播域：   ←─────────── 一个（整台交换机）───────────→  ← 广播帧泛洪到全部端口
```

::: warning 划重点：N 端口交换机 = N 个冲突域 + 1 个广播域
- **冲突域**：交换机靠「每端口独立 + 全双工」把冲突域切到最小（每口一个），这是它相比 hub 性能暴涨的根本原因。
- **广播域**：交换机**管不了**广播域——要把一个交换网络切成多个广播域、隔离广播风暴，得用 **VLAN**。这正是[下一页 VLAN 与局域网隔离](./vlan)要解决的问题，本页不展开。
:::

## 五、交换机 vs 集线器（hub）：智能转发 vs 傻广播

集线器（hub）是交换机的「前辈」，二者放在一起对比，最能看出交换机「智能」在哪：

| 维度 | 集线器 hub | 交换机 switch |
| --- | --- | --- |
| OSI 层次 | **物理层**（layer 1） | **数据链路层**（layer 2） |
| 是否看 MAC | 不看，根本不懂帧 | 看目的 MAC，维护 MAC 地址表 |
| 转发方式 | 电信号**无脑复制到所有端口** | 按 MAC **精确转发**，仅未知/广播才泛洪 |
| 带宽 | 所有端口**共享**总带宽 | 每端口**独享**带宽 |
| 双工 | **半双工**（同一时刻只能收或发） | **全双工**（同时收发） |
| 冲突域 | **整机一个**（所有端口同属一个冲突域） | **每端口一个**（全双工下无冲突） |
| 广播域 | 一个 | 一个（默认） |
| 现状 | 已基本淘汰 | 现代局域网的标准设备 |

一句话：**hub 把一帧吼给所有人、大家抢一条共享带宽、还得防冲突；switch 只把帧递给该收的那一台、各走各的独享带宽、收发互不打架。** 这就是为什么 hub 退场、switch 成了今天有线局域网的事实标准。

## 六、存储转发 vs 直通：何时开始转发

交换机收到一帧后，「**从什么时刻开始往外转发**」有两种策略：

- **存储转发（store-and-forward）**：**收完整帧**后，先校验帧尾的 **FCS**（帧校验序列）确认没出错，再决定转发。优点是**能丢弃错帧/残帧**，不把坏数据扩散出去；代价是延迟随帧长增加（整帧收完才动）。这是**最常见**的方式。
- **直通（cut-through）**：Wikipedia 描述为「high-performance switches can begin forwarding the frame to the destination whilst still receiving the frame payload from the sender」——只要读到**目的 MAC**（帧的前 6 字节）就立刻开始转发，**边收边转**。优点是**延迟极低**（与帧长无关）；缺点是来不及校验 FCS，**会把错帧也透传**出去。

| 维度 | 存储转发 store-and-forward | 直通 cut-through |
| --- | --- | --- |
| 何时转发 | 收完整帧、校验 FCS 后 | 读到目的 MAC（前 6 字节）即转 |
| 错帧处理 | 丢弃，不扩散 | 透传，错帧也发出去 |
| 延迟 | 较高，随帧长增加 | 极低，与帧长无关 |
| 适用 | 通用，绝大多数场景 | 超低延迟场景（如金融、高频交易） |

::: tip 还有个折中：无碎片转发
有些交换机采用 **fragment-free（无碎片直通）**：先收前 64 字节再转发。因为以太网冲突几乎都发生在前 64 字节内，收满这段就能滤掉绝大多数因冲突产生的碎片帧，是「直通的低延迟」与「存储转发的可靠」之间的折中。了解即可，不必深究。
:::

## 小结

- **交换机是二层设备**，按**目的 MAC** 在同一网络内精确转发，本质是多端口网桥；跨网络转发是路由器（按 IP）的职责。
- **MAC 地址表（CAM 表）靠自学习建立**：**看源 MAC 学**（记「源 MAC + 入端口」）、**查目的 MAC 转**；表存内存、断电清空、表项会老化。
- 对一帧的处置只有三种：目的已知在别口→**转发**、目的在入端口同侧→**过滤**、目的未知或广播/组播→**泛洪**。
- **冲突域**：交换机**每端口一个独立冲突域**，全双工下冲突被彻底消除——这是它远胜 hub 的性能根源；**广播域**：默认**整网一个**，广播帧泛洪全网，分割广播域要靠 VLAN。
- **交换机 vs 集线器**：hub 物理层、傻广播、共享带宽、半双工、整机一个冲突域；switch 链路层、智能转发、独享带宽、全双工、每口一个冲突域。
- **存储转发**收完整帧校验后再转（能丢错帧、延迟略高、最常见）；**直通**读完目的 MAC 即转（延迟极低、会透传错帧）。

上一页：[以太网帧结构](./ethernet-frame) ｜ 下一页：[VLAN 与局域网隔离](./vlan)
