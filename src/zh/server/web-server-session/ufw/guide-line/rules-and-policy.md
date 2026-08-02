---
layout: doc
outline: [2, 3]
---

# 规则与策略：默认策略、allow/deny/limit 完整语法

> 基于 UFW 0.36 · 核于 2026-08

## 速查

- **默认策略四方向**：`incoming`（入站）、`outgoing`（出站）、`routed`（转发，用于路由/NAT）、`forwarded`。常用 `default deny incoming` + `default allow outgoing`。
- **allow 语法**：`ufw allow 端口`、`ufw allow 端口/tcp|udp`、`ufw allow 服务名`（如 `ufw allow ssh`）、`ufw allow 'App Profile'`（如 `'Nginx Full'`）。
- **按源 IP 限制**：`ufw allow from 192.168.1.0/24 to any port 22`——只允许某网段访问 22 端口（如只让内网/办公网 SSH）。
- **deny 规则**：`ufw deny 端口` 明确拒绝。注意默认 deny incoming 时，未 allow 的端口本就被拒，deny 多用于「想显式声明某端口绝不可开」或覆盖 allow。
- **limit 限流**：`ufw limit 22`——对 22 端口做连接限速（30 秒内超过 6 次连接则拒绝），防 SSH 暴力破解。
- **规则编号**：`ufw status numbered` 显示带编号的规则，`ufw delete 编号` 按号删除（推荐，比按 allow 命令删更准）。
- **规则顺序**：UFW 按 `/etc/ufw/before.rules` → 用户规则 → `/etc/ufw/after.rules` 顺序匹配，先匹配到的生效。复杂场景需理解顺序。
- **应用配置文件**：`/etc/ufw/applications.d/` 存预定义应用（Nginx/Apache/OpenSSH），`ufw app list` 查看、`ufw allow '名'` 引用。
- **IPv6**：`/etc/default/ufw` 里 `IPV6=yes`，UFW 自动为每条规则同时配 IPv4 和 IPv6 版本。

## 一、默认策略详解

UFW 有四个方向的默认策略，用 `ufw default <策略> <方向>` 设置：

```bash
sudo ufw default deny incoming       # 入站：拒绝（最重要，最小攻击面）
sudo ufw default allow outgoing      # 出站：允许（服务器主动请求不限）
sudo ufw default deny forward        # 转发：拒绝（除非做路由/NAT）
```

| 方向 | 含义 | 推荐 |
| --- | --- | --- |
| `incoming` | 外部连进来的流量 | **deny**（默认拒绝，显式放行） |
| `outgoing` | 服务器主动发出去的流量 | **allow**（合法请求不限） |
| `routed`/`forward` | 经本机转发的流量（做路由器/NAT 时） | deny（除非需要转发） |

- **为什么 incoming 默认 deny**：公网服务器跑很多内部服务（数据库/缓存），这些不该被公网访问。默认拒绝 + 显式放行需要的端口，最小化攻击面。
- **为什么 outgoing 默认 allow**：服务器调外部 API、apt update、git pull 是合法的，限制出站会干扰正常业务。如担心被攻破后反弹 shell，可进一步限制出站（高级防护）。
- **改完需生效**：`ufw default` 改完，新策略对后续连接立即生效（无需 reload）。

## 二、allow 规则：端口、服务、协议、源 IP

`ufw allow` 有多种语法，按精度从粗到细：

```bash
# 1. 按端口号（同时 TCP+UDP，IPv4+IPv6）
sudo ufw allow 22                # 22 端口，TCP 和 UDP 都放行

# 2. 按端口 + 协议（更精确）
sudo ufw allow 80/tcp            # 只放行 80 的 TCP（HTTP 只用 TCP）
sudo ufw allow 53/udp            # 只放行 53 的 UDP（DNS 常用 UDP）

# 3. 按服务名（UFW 查 /etc/services 把名字翻译成端口）
sudo ufw allow ssh               # 等价 allow 22
sudo ufw allow http              # 等价 allow 80
sudo ufw allow https             # 等价 allow 443

# 4. 按应用配置（一次放行多个端口）
sudo ufw allow 'Nginx Full'      # 放行 80 + 443
sudo ufw allow 'OpenSSH'         # 放行 22

# 5. 按源 IP 限制（只允许特定来源访问）
sudo ufw allow from 192.168.1.0/24 to any port 22       # 只让内网网段 SSH
sudo ufw allow from 203.0.113.5 to any port 3306        # 只让某固定 IP 连 MySQL

# 6. 按源 IP + 协议
sudo ufw allow from 192.168.1.0/24 to any port 5432 proto tcp  # 内网 TCP 连 PostgreSQL
```

- **服务名 vs 端口号**：`ufw allow ssh` 和 `ufw allow 22` 等价（查 /etc/services）。用服务名可读性好，用端口号更明确。
- **应用配置**：`/etc/ufw/applications.d/` 里 nginx 等。`ufw app list` 看有哪些、`ufw app info 'Nginx Full'` 看具体放行哪些端口。
- **按源 IP 限制最有价值**：数据库（3306/5432/27017）只该让应用服务器/内网访问，绝不开公网。`allow from 内网IP to any port 3306` 是经典配置。

## 三、deny 与 reject 的区别

```bash
sudo ufw deny 3306               # 拒绝 3306（丢弃包，无响应）
sudo ufw reject 3306             # 拒绝 3306（回 RST/ICMP，告诉对方端口关闭）
```

- **deny（DROP）**：直接丢包，不回应。攻击者扫端口会看到「超时/无响应」，更安全（不暴露端口存在）。
- **reject（REJECT）**：回一个拒绝包（TCP RST 或 ICMP port unreachable）。攻击者扫到「端口关闭」，更快但暴露了端口存在（虽然不可连）。
- **何时用 deny vs reject**：默认策略是 deny（DROP，更安全）。reject 多用于内网调试（快速反馈端口关闭，而非等超时）。生产环境公网用 deny。

注意：如果默认策略已是 `deny incoming`，未 allow 的端口本就被 DROP，单独 `ufw deny 3306` 是冗余的。显式 deny 多用于「覆盖 allow 规则」或「明确声明」。

## 四、limit 限流：防暴力破解

`ufw limit` 对端口做连接限速，防暴力扫描/破解：

```bash
sudo ufw limit 22/tcp            # SSH 限流：30 秒内超过 6 次连接则拒绝
```

- **限流规则**：最近 30 秒内，某 IP 对该端口超过 6 次连接尝试，则丢弃后续连接。防 SSH 暴力破解字典攻击。
- **底层**：用 iptables 的 `recent` 模块实现（记录每个源 IP 的最近连接时间）。
- **配合密钥登录**：limit 只减缓暴力破解，根治靠禁用密码登录、用 SSH 密钥。
- **限流只针对新连接**：已建立的连接（ESTABLISHED）不受影响，正常使用不会误伤。

## 五、规则管理：查看、删除、插入

```bash
# 查看带编号的规则（删除用）
sudo ufw status numbered
# 输出：
# Status: active
#      To                         Action      From
# [ 1] 22/tcp                     ALLOW IN    Anywhere
# [ 2] 80/tcp                     ALLOW IN    Anywhere
# [ 3] 443/tcp                    ALLOW IN    Anywhere

# 按编号删除（推荐）
sudo ufw delete 2                # 删除第 2 条（80/tcp），会确认

# 按 allow 命令删除（删除匹配的规则）
sudo ufw delete allow 80/tcp

# 插入规则到指定位置（控制顺序）
sudo ufw insert 1 allow from 192.168.1.0/24 to any port 22  # 插到第 1 位（最先生效）

# 重置所有规则
sudo ufw reset                   # 清空所有自定义规则，回到初始
```

- **删除时编号会变**：删一条后，后面的规则编号前移。删多条时从大编号往小编号删，避免编号错乱。
- **insert 控制顺序**：规则按顺序匹配，先匹配的生效。如「允许内网 SSH」要在「拒绝所有 SSH」之前，用 insert 1 插到最前。
- **reset 慎用**：清空所有规则，包括默认策略。reset 后需重新 enable。

## 六、常见服务配置示例

```bash
# Web 服务器
sudo ufw allow 80/tcp            # HTTP
sudo ufw allow 443/tcp           # HTTPS

# SSH（推荐 limit 防暴破）
sudo ufw limit 22/tcp

# 数据库（只允许内网/应用服务器，绝不开公网）
sudo ufw allow from 10.0.0.0/8 to any port 3306      # 内网连 MySQL
sudo ufw allow from 10.0.0.0/8 to any port 5432      # 内网连 PostgreSQL
sudo ufw allow from 10.0.0.0/8 to any port 6379      # 内网连 Redis

# DNS 服务器（如自建）
sudo ufw allow 53/tcp            # DNS over TCP（大响应/区域传输）
sudo ufw allow 53/udp            # DNS over UDP（常规查询）

# 监控/CI（按需）
sudo ufw allow from 10.0.0.5 to any port 9090        # 只让监控机连 Prometheus
```

- **数据库的黄金法则**：只在局域网/内网开放，公网绝不开。`allow from 内网网段` 是标准做法。
- **监控端口限制源 IP**：Prometheus/Grafana 这类管理端口，只让运维网段访问。

## 下一步

规则与策略讲完后，下一站是 [iptables 关系与进阶](./iptables-and-advanced)——UFW 底层如何用 iptables/nftables 实现、何时需绕过 UFW 直接写 iptables 规则、端口转发与限流进阶。
