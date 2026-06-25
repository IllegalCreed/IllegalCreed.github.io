---
layout: doc
outline: [2, 3]
---

# 常见记录类型

> 基于 HTTP 现代标准 · 核于 2026-06

## 速查

- **DNS 记录（Resource Record，RR）= 一条存在权威服务器「区域文件（zone file）」里的指令**，告诉解析器某个域名对应什么（IP、别名、邮件服务器……）。每条记录都带 **TTL**（缓存时长，详见下一页）。
- 一条记录可抽象为五元组：**Name（名）/ TTL / Class（几乎恒为 `IN`）/ Type（类型）/ RDATA（数据值）**。
- **A**：域名 → **IPv4** 地址（`93.184.216.34`），最基础的记录。
- **AAAA**：域名 → **IPv6** 地址（`2606:2800:...`），「四个 A」对应 128 位地址。
- **CNAME**：**别名**，把一个域名指向**另一个域名**（绝不能指向 IP）；**两条铁律**——① 同名下不能再有任何其他记录 ② **根域（apex）不能用 CNAME**。
- **MX**：邮件交换，指定收信服务器并带**优先级**（数字越小越优先）；其值必须指向 A/AAAA，不能指向 CNAME。
- **TXT**：任意文本，现实中是 **SPF / DKIM / DMARC / 域名归属验证** 的载体。
- **NS**：声明该域的**权威域名服务器**，是「委派（delegation）」的实现方式；其值也必须指向 A/AAAA。
- **SOA**：区域的「起始授权」，存**主 NS、管理员邮箱、序列号、刷新/重试/过期/最小 TTL**，每个区域有且仅有一条。
- **PTR**：**反向解析**，IP → 域名，部署在 `in-addr.arpa`（v4）/ `ip6.arpa`（v6）反向区，邮件服务器用它做发信方校验。
- **CAA**：限定**哪些 CA 可为本域签发证书**，无 CAA = 任何 CA 都可签；规则**被子域继承**。
- **SRV**：服务定位，给出某服务的**主机 + 端口 + 优先级 + 权重**，名字形如 `_sip._tcp.example.com`。
- **ALIAS / ANAME**：厂商私有记录，用于在**根域**实现「类 CNAME」效果（CNAME flattening / CNAME 扁平化），绕开根域不能用 CNAME 的限制。

## 一条 DNS 记录到底是什么

上一页讲清了递归与迭代查询如何**找到**权威服务器；本页讲权威服务器手里**存的是什么**——也就是 DNS 记录。

DNS 记录（Resource Record，简称 RR），有时也叫**区域文件（zone file）**里的一行。它是一段以 DNS 语法书写的纯文本指令，住在该域名的**权威服务器**上，回答解析器的提问：「`example.com` 的 IP 是多少？」「它的邮件该投递到哪？」一个域名要能被正常访问，至少得有几条必备记录（A/AAAA + NS + SOA），其余按需添加。

任何一条记录都可拆成统一的五个字段：

| 字段 | 含义 | 说明 |
| --- | --- | --- |
| **Name** | 记录所属的名字 | 如 `www.example.com`；`@` 常表示根域本身 |
| **TTL** | 可被缓存的秒数 | 控制缓存新鲜度，**专门留到下一页讲** |
| **Class** | 协议类别 | 互联网恒为 `IN`，几乎不用关心 |
| **Type** | 记录类型 | A / AAAA / CNAME / MX… 决定了 RDATA 怎么解释 |
| **RDATA** | 记录数据值 | 真正的「答案」，如 IP、目标域名、文本串 |

::: tip 心智模型
把一个域名的所有记录想成「一家店的工商登记表」：A/AAAA 是门牌地址，MX 是收信窗口，NS 是「谁负责登记这家店」，TXT 是备注栏。解析器查询时，**带着想要的 Type 去问**，权威服务器只把对应类型的那几行返回。
:::

## 寻址类记录：A 与 AAAA

最常被查询的两类，作用都是「域名 → IP」，区别只在 IP 版本：

- **A 记录**：指向 **IPv4** 地址（32 位，点分十进制）。绝大多数网站访问的第一步就是拿到 A 记录。
- **AAAA 记录**：指向 **IPv6** 地址（128 位）。名字里「四个 A」正是为了对应「比 A 记录长四倍」的地址。

一个域名可以**同时**拥有 A 和 AAAA：支持 IPv6 的客户端优先走 AAAA，否则回落到 A。

```dns
; Name              TTL    Class  Type   RDATA
example.com.        3600   IN     A      93.184.216.34
example.com.        3600   IN     AAAA   2606:2800:220:1:248:1893:25c8:1946
```

## 别名记录：CNAME（重点与陷阱）

**CNAME（Canonical Name，规范名）** 把一个**别名域名**指向**另一个域名**，自身不含 IP。它扮演的是「线索」角色：查 `blog.example.com` 命中 CNAME 后，会**再触发一次对目标域名的查询**，最终由目标的 A/AAAA 给出 IP。常见用法是让 `blog.`、`shop.`、`www.` 等子域都 CNAME 到根域——这样主机 IP 变更时**只需改根域那一条 A 记录**，所有别名自动跟随。

```dns
; blog 是 example.com 的别名，最终解析到 example.com 的 A 记录
blog.example.com.   3600   IN     CNAME  example.com.
```

::: warning CNAME 的硬限制（必考）
1. **只能指向域名，绝不能指向 IP**——要绑 IP 请用 A/AAAA。
2. **同名下不得共存任何其他记录**：一个名字一旦有 CNAME，就不能再有 A、AAAA、MX、TXT、SOA…… 其余记录必须挂在它指向的「真名」上。打个比方：笔名「Mark」只是指向真名「Sam」，身份证、护照这些「正式文件」都得登记在 Sam 名下。
3. **根域（apex / `example.com` 本身）不能用 CNAME**：因为根域天然带着 SOA 和 NS 记录，而第 2 条规定 CNAME 不能与它们共存——所以根域只能用 A/AAAA（根域跨厂商指向的需求，见下文 ALIAS/ANAME）。
4. **MX、NS 不能指向 CNAME**：它们的值必须是带 A/AAAA 的主机名，不能是别名。
:::

由限制 2 还派生一个易错点：**对一个 CNAME 名字查询「其他类型」（如 TXT）时，权威服务器会返回那条 CNAME，而非你要的记录**，解析器需要再去 CNAME 指向的目标重新查询 TXT。

**CNAME 链**（CNAME → CNAME → … → A）在技术上允许，但每跳都多一次查询、拖慢首字节，应尽量**让所有别名直接指向最终的真名**而非另一个别名。

::: tip CNAME flattening（扁平化）
唯一的「同名共存」例外是**扁平化**：解析服务在响应时把 CNAME 当作 A/AAAA 直接返回最终 IP（Cloudflare 的代理 CNAME 即如此）。这也是各家在**根域**提供「类 CNAME」能力的底层原理——即下文的 ALIAS/ANAME。
:::

## 邮件与文本：MX 与 TXT

- **MX（Mail eXchange）**：指明该域的**收信服务器**，并带一个**优先级**数字——**数字越小优先级越高**，可配多条做主备/分流。其值必须是带 A/AAAA 的主机名，**不可指向 CNAME**。
- **TXT**：本是「给管理员写备注」的任意文本，现实中是邮件与域名安全的事实载体：**SPF**（声明允许的发信 IP）、**DKIM**（发信签名公钥）、**DMARC**（前两者的策略汇总），以及各类**域名归属验证**（放一段平台给的随机串证明你拥有该域）。

```dns
; 优先级 10 优先于 20
example.com.        3600   IN     MX     10 mail1.example.com.
example.com.        3600   IN     MX     20 mail2.example.com.
; SPF：只允许该网段代发本域邮件
example.com.        3600   IN     TXT    "v=spf1 ip4:203.0.113.0/24 -all"
```

## 委派与区域元信息：NS 与 SOA

这两类是「区域本身」的骨架记录：

- **NS（Name Server）**：声明**谁是本域的权威服务器**，是 DNS「逐级委派」的落地方式——父区域用 NS 把子域「指」给下一级服务器（上一页迭代查询正是顺着 NS 一路下探）。其值同样必须指向 A/AAAA，不能是 CNAME。
- **SOA（Start of Authority，起始授权）**：每个区域**有且仅有一条**，存放区域的元信息：主 NS、管理员邮箱，以及一组控制**从服务器同步**的计时器。

| SOA 字段 | 作用 |
| --- | --- |
| **MNAME** | 该区域的主（primary）权威服务器 |
| **RNAME** | 管理员邮箱（`@` 写成 `.`） |
| **Serial** | 区域版本号，每次改记录须递增，从服务器据此判断是否需同步 |
| **Refresh / Retry / Expire** | 从服务器多久来同步、失败后多久重试、多久后判定数据过期 |
| **Minimum** | 否定应答（NXDOMAIN）的缓存时长 |

## 反向、安全与服务定位：PTR / CAA / SRV

- **PTR（Pointer）**：做**反向解析**，把 **IP → 域名**，与 A/AAAA 方向相反。它部署在专门的反向区域里（IPv4 用 `in-addr.arpa`，IPv6 用 `ip6.arpa`）。典型用途是**邮件服务器校验发信方**——收信方拿发信 IP 反查域名，验证是否与声称的一致，是反垃圾邮件的一环。
- **CAA（Certification Authority Authorization）**：声明**哪些 CA 被允许为本域签发 TLS 证书**。**若一条 CAA 都没有，则任何 CA 都可签发**；该记录会**被子域继承**。它把「谁能给我发证」从隐性约定变成 DNS 里可校验的显式白名单（与上一章证书体系呼应）。
- **SRV（Service）**：通用的**服务定位**记录，一次给出服务的**优先级、权重、端口、目标主机**。名字遵循 `_服务._协议.域名` 约定（如 `_sip._tcp.example.com`），被 SIP、XMPP、Minecraft、AD 等大量使用。

```dns
; PTR：1.2.0.192.in-addr.arpa 反查 192.0.2.1 -> example.com
1.2.0.192.in-addr.arpa.   3600  IN  PTR  example.com.
; CAA：仅允许 letsencrypt.org 为本域签发证书
example.com.              3600  IN  CAA  0 issue "letsencrypt.org"
; SRV：优先级 10 / 权重 60 / 端口 5060 / 主机 sipserver
_sip._tcp.example.com.    3600  IN  SRV  10 60 5060 sipserver.example.com.
```

## 根域的「类 CNAME」：ALIAS / ANAME

前面强调过**根域不能用 CNAME**，但实践中经常需要把根域 `example.com` 指向一个由第三方托管、只给域名不给固定 IP 的目标（如 CDN、PaaS）。各家 DNS 服务为此提供了**私有记录类型 ALIAS / ANAME**（命名因厂商而异）：对外表现为根域的 A/AAAA，由 DNS 服务在后台实时解析目标域名并把 IP「扁平化」返回——既满足了「根域只能有 A/AAAA」的规范，又获得了 CNAME 般的「跟随目标」便利。

::: tip 选型一句话
**子域跟随别的域名 → CNAME；根域要跟随别的域名 → ALIAS/ANAME（或带 CNAME flattening 的 DNS 服务）；直接绑固定 IP → A/AAAA。**
:::

## 小结

- DNS 记录是住在权威服务器区域文件里的指令，核心五元组为 **Name / TTL / Class / Type / RDATA**，按查询的 **Type** 各取所需。
- **寻址**靠 A（IPv4）/ AAAA（IPv6）；**别名**靠 CNAME，但务必记牢它的四条限制——不指 IP、同名独占、根域禁用、MX/NS 不可指它。
- **邮件**靠带优先级的 MX + 承载 SPF/DKIM/DMARC 的 TXT；**区域骨架**靠 NS（委派）与唯一的 SOA（元信息与同步计时）。
- **反向**靠 PTR，**证书白名单**靠可被子域继承的 CAA，**服务发现**靠 SRV；根域的跨厂商指向用 **ALIAS/ANAME** 补 CNAME 之缺。
- 上一页 [解析流程：递归与迭代查询](./dns-resolution) 解决「怎么找到这些记录」；这些记录都带 TTL，它如何影响缓存与生效速度，见下一页 [DNS 缓存与 TTL](./dns-cache-ttl)。
