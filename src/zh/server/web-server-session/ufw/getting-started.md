---
layout: doc
outline: [2, 3]
---

# 入门：UFW 定位、默认拒绝与核心命令

> 基于 UFW 0.36 · 核于 2026-08

## 速查

- **定位**：UFW（Uncomplicated Firewall）是 Ubuntu/Debian 系默认的**主机级防火墙前端**——把 iptables/nftables 的复杂语法封装成 `ufw allow 22` 直觉命令。
- **设计哲学**：「**默认拒绝，按需放行**」——`default deny incoming` 拒绝所有入站，只显式放行需要的端口（22/80/443），把攻击面降到最小。
- **核心命令**：`ufw enable`（启用）、`ufw disable`（禁用）、`ufw allow 端口`（放行）、`ufw deny 端口`（拒绝）、`ufw status`（查看规则）、`ufw delete`（删规则）。
- **必放三端口**：22（SSH，远程管理）、80（HTTP，Web 服务）、443（HTTPS，加密 Web 服务）。一台公网 Web 服务器至少开这三个。
- **默认策略**：`default deny incoming`（拒绝所有进来的）+ `default allow outgoing`（允许所有出去的）——服务器主动出的请求不限，进来的请求必须显式放行。
- **`ufw allow 22`**：放行 22 端口（默认同时 TCP+UDP，IPv4+IPv6）。
- **`ufw allow 80/tcp`**：只放行 80 端口的 TCP（HTTP 只用 TCP，UDP 无意义）。
- **`ufw allow 'Nginx Full'`**：用应用配置文件（`/etc/ufw/applications.d/`），一次放行 Nginx 的 80+443。
- **`ufw status verbose`**：查看详细状态（含默认策略、日志状态、所有规则带编号）。
- **`ufw reset`**：重置所有规则回到初始状态（慎用，会清空所有自定义规则）。
- **与 iptables 关系**：UFW 不是独立防火墙，它是 iptables/nftables 的配置前端，底层是 Linux 内核的 netfilter 框架。

## 一、UFW 是什么：把 iptables 变简单

Linux 防火墙的底层是内核的 **netfilter** 框架——它钩在内核网络栈上，对每个进出的包按规则链过滤。配置 netfilter 的传统工具是 **iptables**（或新一代 **nftables**）。但 iptables 的语法极其繁琐：

```bash
# 用 iptables 放行 22 端口 SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p udp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
# 还要分别配 IPv4（iptables）和 IPv6（ip6tables），保存规则，开机加载...
```

UFW 把这一切封装成一行：

```bash
ufw allow 22        # 自动配 IPv4+IPv6、TCP+UDP、相关连接跟踪
```

所以 UFW 的「Uncomplicated」（不复杂）正是卖点——让非专业运维也能在几分钟内配好一台服务器的防火墙，避免 iptables 配错（要么规则漏了留漏洞，要么规则错了把自己 SSH 锁死在外）。

## 二、默认拒绝策略：最小攻击面

UFW 的安全哲学是「**默认拒绝，按需放行**」：

```
默认策略：
  入站（incoming）：deny   ← 拒绝所有进来的连接
  出站（outgoing）：allow  ← 允许所有出去的连接

然后显式放行需要的端口：
  allow 22    ← SSH（远程管理）
  allow 80    ← HTTP（Web）
  allow 443   ← HTTPS（加密 Web）
```

- **为什么默认拒绝入站**：公网服务器上跑着很多内部服务（MySQL 3306、Redis 6379、Elasticsearch 9200），这些服务默认不做公网鉴权（Redis 甚至默认无密码），如果端口开着，分分钟被扫到攻破（勒索、挖矿、删库）。默认拒绝把这些端口都挡住，只放行确实需要公网访问的（SSH/Web）。
- **为什么默认允许出站**：服务器主动发起的请求（如调外部 API、apt update、git pull）通常是合法的，不限。如果服务器被攻破，攻击者反弹 shell 才需限制出站（更高级的防护）。
- **显式放行**：每开一个端口都要问「这个端口真的需要公网访问吗？」。数据库/缓存这类内部服务只在局域网或本机用，绝不开公网。

## 三、核心命令：enable / allow / deny / status

UFW 的日常操作就这几个命令：

```bash
# 启用 / 禁用 UFW（启用时会加载所有规则）
sudo ufw enable              # 启用防火墙（首次会警告可能断开 SSH）
sudo ufw disable             # 禁用防火墙（所有规则停止生效）

# 设置默认策略
sudo ufw default deny incoming     # 默认拒绝入站
sudo ufw default allow outgoing    # 默认允许出站

# 放行端口
sudo ufw allow 22            # 放行 22（TCP+UDP，IPv4+IPv6）
sudo ufw allow 80/tcp        # 只放行 80 的 TCP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw allow 'Nginx Full' # 按应用配置放行（80+443）

# 拒绝端口
sudo ufw deny 3306           # 明确拒绝 3306（MySQL）
sudo ufw deny 6379           # 明确拒绝 6379（Redis）

# 查看状态
sudo ufw status              # 简要状态（活跃规则列表）
sudo ufw status verbose      # 详细状态（含默认策略、日志、规则编号）
sudo ufw status numbered     # 带编号（删除时用编号）

# 删除规则
sudo ufw delete allow 80     # 按 allow 规则删除
sudo ufw delete 3            # 按编号删除（status numbered 看到的编号）

# 重置
sudo ufw reset               # 清空所有规则回到初始
```

- **`ufw enable` 警告**：首次启用时会问「可能会断开 SSH 连接」——如果你没先 allow 22 就 enable，会把自己锁死在外面。所以流程是：先 `allow 22`，再 `enable`。
- **`allow 端口/tcp`**：HTTP/HTTPS 只用 TCP，加 `/tcp` 更精确（避免开无意义的 UDP）。
- **应用配置**：`ufw allow 'Nginx Full'` 用 `/etc/ufw/applications.d/` 里的预定义配置（Nginx Full = 80+443），比手写两条更清晰。

## 四、必放的三端口：22 / 80 / 443

一台公网 Web 服务器至少开这三个端口：

```bash
sudo ufw allow 22/tcp        # SSH：远程管理（必须！否则进不去服务器）
sudo ufw allow 80/tcp        # HTTP：Web 服务（80 端口，用于普通 HTTP 和 Let's Encrypt 验证）
sudo ufw allow 443/tcp       # HTTPS：加密 Web 服务（443 端口）
```

- **22（SSH）**：远程登录管理服务器。**第一个要开的端口**——不开就进不去。建议改成非默认端口（如 2222）减少暴力扫描，且配合密钥登录。
- **80（HTTP）**：Web 服务。即使全站 HTTPS，80 也常开（用于 HTTP→HTTPS 跳转、Let's Encrypt HTTP-01 验证）。
- **443（HTTPS）**：加密 Web 服务。生产 Web 服务必备。

**不该开的端口**：3306（MySQL）、6379（Redis）、27017（MongoDB）、9200（Elasticsearch）——这些是内部服务，只在局域网/本机用，绝不开公网。

## 五、典型配置流程：从零到安全

新装一台服务器的标准 UFW 配置流程：

```bash
# 1. 先放行 SSH（最重要，否则 enable 会锁死）
sudo ufw allow 22/tcp

# 2. 放行 Web 端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. 设置默认策略（拒绝入站，允许出站）
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 4. 启用 UFW
sudo ufw enable
# 提示 Command may disrupt existing ssh connections. Proceed? (y/n) 输入 y

# 5. 验证
sudo ufw status verbose
# 输出：
# Status: active
# Default: deny (incoming), allow (outgoing), disabled (routed)
# To                         Action      From
# 22/tcp                     ALLOW IN    Anywhere
# 80/tcp                     ALLOW IN    Anywhere
# 443/tcp                    ALLOW IN    Anywhere
# 22/tcp (v6)                ALLOW IN    Anywhere (v6)
# ...
```

- **顺序很重要**：先 allow 22，再 enable。如果先 enable 再 allow，万一默认策略是 deny 且没 allow 22，SSH 立刻断开。
- **验证**：`status verbose` 确认规则生效、默认策略正确。
- **测试 SSH**：配置完，**别关当前 SSH**，另开一个终端测试能否连上，确认没锁死再关原连接。

## 六、UFW 的边界：它管什么、不管什么

UFW 是**主机级网络端口防火墙**，明确的能力边界：

| 管什么 | 不管什么 |
| --- | --- |
| 哪个端口能从外部连（22 开、3306 关） | 应用层攻击（SQL 注入、XSS）—— 需 WAF |
| TCP/UDP 端口级别的放行/拒绝 | 用户认证/授权 —— 需应用代码 |
| 源 IP 限制（只允许某 IP 访问某端口） | 加密传输 —— 需 TLS/HTTPS |
| 简单的连接限流（防暴力破解） | DDoS 流量清洗 —— 需上游 CDN/云防火墙 |

- **应用层安全归安全章**：SQL 注入、XSS、CSRF 这些是应用层攻击，UFW 看不到（它只看 TCP/UDP 包头），防护靠应用代码 + WAF。
- **复杂网络逻辑绕过 UFW**：端口转发、按内容过滤、连接数限速等高级功能，UFW 表达不了，需直接写 iptables/nftables 规则（见 [iptables 关系与进阶](./guide-line/iptables-and-advanced)）。

## 下一步

入门讲完 UFW 的定位、默认拒绝、核心命令后，下一步深入两个专题——[规则与策略](./guide-line/rules-and-policy)（完整规则语法、按服务/IP/协议配置、limit 限流）与 [iptables 关系与进阶](./guide-line/iptables-and-advanced)（UFW 底层原理、何时需绕过 UFW 直接写 iptables）。
