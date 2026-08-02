---
layout: doc
outline: [2, 3]
---

# 诊断：连通性、DNS 与连接状态

> 基于 iproute2 / bind-utils 工具集 · 核于 2026-08

## 速查

- **诊断三件套**：`ping`（链路通断 + 延迟）→ `dig`（DNS 解析）→ `traceroute`（路由路径）——从底到顶逐层定位。
- **`ping` 陷阱**：ICMP 常被云安全组/防火墙禁掉，「ping 不通 ≠ 服务不通」，要配 `curl`/`nc` 在 TCP 层复核。
- **`dig` vs `nslookup`**：首选 `dig`（结构化输出、可指定 `@server`、`+trace` 追溯、`+short` 适合脚本）；`nslookup` 交互友好但信息少。
- **`ss -tlnp`**：现代运维第一命令——看 TCP 监听端口 + 进程，确认服务到底起没起、绑哪个地址。取代 `netstat`。
- **`netstat`**：老牌工具，已废弃但仍常见，`netstat -tlnp` ≈ `ss -tlnp`，但慢且读 `/proc`。
- **`traceroute`**：递增 TTL 探测每跳路由器，定位「卡在第几跳」。UDP 默认常被防火墙挡，用 `traceroute -T`（TCP）或 `mtr`（持续 traceroute + ping）更可靠。
- **`ip` vs `ifconfig`**：`ip`（iproute2）现代标准，`ifconfig`（net-tools）已废弃。`ip addr`/`ip route`/`ip link` 取代 `ifconfig`/`route`/`ifconfig up`。
- **绑定地址决定可达性**：服务监听 `127.0.0.1` 只本机可访问，监听 `0.0.0.0` 才对外。「本地能连、远程连不上」九成是绑在了回环地址。

## 一、ping：ICMP 连通性

`ping` 用 ICMP Echo 协议探测目标是否可达、测量往返延迟（RTT）和丢包率：

```bash
$ ping -c 4 example.com
PING example.com (93.184.216.34): 56 data bytes
64 bytes from 93.184.216.34: icmp_seq=0 ttl=56 time=12.3 ms
64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=11.8 ms
...
--- example.com ping statistics ---
4 packets transmitted, 4 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 11.8/12.1/12.5/0.3 ms
```

- **`icmp_seq`**：包序号，连续说明没乱序。
- **`ttl`**：剩余跳数，反映目标距离（每经过一个路由器减 1）。
- **`time`**：RTT 往返延迟，越小越好；波动大（stddev 高）说明网络抖动严重。
- **`packet loss`**：丢包率，非零说明链路有问题（拥塞/硬件故障/防火墙）。

**关键陷阱——ICMP 被禁**：AWS/阿里云/腾讯云等默认安全组不放行 ICMP，导致 `ping` 超时但 HTTP 服务正常。排障时遇到 ping 不通，**务必**用 `curl -I http://host` 或 `nc -zv host 80` 在 TCP 层复核，不要一看到 ping 不通就判断「服务器挂了」。

## 二、dig：DNS 解析

`dig` 是 DNS 排障的首选工具，输出结构化、信息完整：

```bash
$ dig example.com
;; QUESTION SECTION:
;example.com.            IN  A

;; ANSWER SECTION:
example.com.    86400  IN  A   93.184.216.34

;; Query time: 24 msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
```

- **ANSWER SECTION**：核心——解析到的记录（域名 + TTL + 类型 + 值）。
- **TTL**：缓存时间（秒），改了 DNS 记录后要等 TTL 过期全球才生效。排障时 TTL 异常高可能说明拿到的是旧缓存。
- **指定上游 DNS**：`dig @8.8.8.8 example.com`——绕过本地 DNS 缓存直接问 Google，能区分「本地 DNS 缓存脏了」还是「权威记录本身错了」。
- **`+trace`**：从根服务器（`.`）逐级追到权威服务器，看解析在哪一环出错，是深度排障利器。
- **`+short`**：只输出 IP，适合脚本 `dig +short example.com`。

`nslookup` 是老牌交互式工具，输出更人性化但信息不如 dig 完整，Windows 自带。两者能查同样的记录，**Linux/macOS 排障首选 dig**。

## 三、traceroute：路由路径

`traceroute` 利用 IP 包的 TTL 字段，每跳发一个 TTL 递增的包，路由器收到 TTL=1 的包会丢弃并回 ICMP Time Exceeded，借此逐跳探测路径：

```bash
$ traceroute example.com
 1  192.168.1.1 (网关)         1.2 ms
 2  10.0.0.1 (运营商入口)      8.5 ms
 3  *  *  *                    (这一跳禁 ICMP)
 ...
 9  93.184.216.34 (目标)       45.2 ms
```

- **`*`**：该跳没回包（禁 ICMP 或丢包），不代表不通，只是这一跳不配合。
- **延迟突变**：从某一跳开始延迟激增，说明瓶颈在那一段（如跨国际出口）。
- **协议选择**：默认用 UDP 高端口（常被防火墙挡），加 `-T`（TCP 80）、`-I`（ICMP）更易穿透。`mtr`（My Traceroute）结合 traceroute + 持续 ping，能看每跳的丢包率与延迟分布，比一次性 traceroute 更实用。

## 四、ss：现代连接与监听诊断

`ss`（socket statistics）来自 iproute2，直接读内核 netlink 接口，比 `netstat` 快几个数量级，是现代 Linux 的默认工具：

```bash
$ ss -tlnp
State   Recv-Q Send-Q Local Address:Port  Peer Address:Port  Process
LISTEN  0      128    0.0.0.0:22          0.0.0.0:*          users:(("sshd",pid=1234,fd=3))
LISTEN  0      128    127.0.0.1:8080      0.0.0.0:*          users:(("node",pid=5678,fd=18))
LISTEN  0      511    *:443               *:*                users:(("nginx",pid=9101,fd=6))
```

- **`-t` TCP / `-u` UDP / `-l` 监听 / `-a` 全部 / `-n` 数字（不解析） / `-p` 进程（需 root）**。
- **Local Address 解读（最关键）**：
  - `0.0.0.0:22` 或 `*:443`：监听**所有网卡**（IPv4 全地址），外部可访问。
  - `127.0.0.1:8080`：只监听**回环地址**，仅本机可访问——这是「服务起来了但远程连不上」的头号原因。要让外部访问，需把应用配置改成监听 `0.0.0.0`。
  - `[::]:80`：监听所有 IPv6 地址。
- **STATE 列**：`LISTEN`（监听）、`ESTAB`（已建立）、`TIME-WAIT`（主动关闭后等待 2MSL）、`CLOSE-WAIT`（对端已关闭，本地待处理）。大量 `TIME-WAIT` 是短连接风暴的信号，应考虑长连接或连接池。
- **过滤已建立连接**：`ss -tn state established '( dport = :443 or sport = :443 )'` 看 HTTPS 活跃连接。

## 五、netstat：老牌工具（了解即可）

`netstat` 来自 net-tools 套件（已停止维护），输出与 `ss` 类似但更慢：

```bash
netstat -tlnp        # ≈ ss -tlnp，看 TCP 监听 + 进程
netstat -rn          # 看路由表（≈ ip route）
netstat -i           # 看网卡流量统计
```

- **为什么被取代**：`netstat` 通过遍历 `/proc/net/*` 获取信息，连接数多时极慢；`ss` 走 netlink 内核接口，O(1) 速度。生产环境服务器几万连接时，`netstat` 可能卡几十秒，`ss` 秒回。
- **仍要会**：老服务器、老脚本、面试题里 `netstat` 仍常见，知道 `-tlnp` 与 `ss -tlnp` 等价即可。

## 六、ip 与 ifconfig：网卡与地址

`ip`（iproute2）是现代标准，`ifconfig`（net-tools）已废弃：

```bash
ip addr show              # 查看所有网卡与 IP（≈ ifconfig -a）
ip addr add 192.168.1.10/24 dev eth0   # 给网卡加 IP
ip link set eth0 up       # 启用网卡（≈ ifconfig eth0 up）
ip route show             # 查看路由表（≈ route -n 或 netstat -rn）
ip route add default via 192.168.1.1    # 加默认网关
ip -s link                # 看网卡流量/丢包统计
```

- **`ip addr`** 最常用——确认机器有哪些网卡、每个网卡的 IP、MAC 地址。
- **`ip route`** 看路由表，默认网关（`default via`）错了会导致「能 ping 通同网段、ping 不通外网」。
- **`ifconfig`** 仍存在于很多老教程，语法 `ifconfig eth0 192.168.1.10 netmask 255.255.255.0 up`，知道等价关系即可，新机器统一用 `ip`。

## 七、诊断实战：网页打不开怎么排查

一个完整的分层排障流程，假设用户反馈 `https://app.example.com` 打不开：

```
1. ping app.example.com
   → 通？继续；不通？可能 ICMP 被禁，跳到步骤 3 复核

2. dig app.example.com
   → 解析到的 IP 对吗？TTL 正常吗？
   → 错了？检查 DNS 配置/权威记录/本地缓存（dig @8.8.8.8 复核）

3. traceroute app.example.com
   → 卡在哪一跳？是否到目标网段就丢包？

4. ssh 到服务器，ss -tlnp | grep 443
   → Nginx/服务真的在监听 0.0.0.0:443 吗？
   → 绑在 127.0.0.1？这就是远程连不上的原因

5. curl -v https://app.example.com
   → 状态码？TLS 握手成功？应用返回正常？
   → 502/503？查后端服务；404？查路由配置
```

这种自底向上的流程能快速定位故障层，避免「在错的层 debug」浪费 hours。

## 下一步

诊断工具讲完后，下一个专题是[数据传输详解](./data-transfer)——curl 调试 HTTP API、wget 递归下载、scp 加密拷贝、rsync 增量同步的进阶语法与陷阱。
