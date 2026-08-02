---
layout: doc
---

# UFW（主机防火墙）

**UFW**（Uncomplicated Firewall，简单防火墙）是 Ubuntu/Debian 系默认的**主机级防火墙前端**——它把令人头疼的 `iptables`/`nftables` 命令封装成直觉的 `ufw allow 22`、`ufw deny 3306` 语法，让普通运维也能在 5 分钟内配好一台服务器的防火墙。它的设计哲学是「**默认拒绝，按需放行**」：开 22（SSH）、80（HTTP）、443（HTTPS）这三条命脉，其他端口全关——把攻击面降到最小。一台公网服务器不配防火墙，等于把数据库（3306）、Redis（6379）这些内部服务裸奔在互联网上，分分钟被勒索/挖矿脚本扫到攻破。

UFW 的全部考点围绕**主机级网络访问控制**展开：①**默认策略**（`default deny incoming` + `default allow outgoing`——拒绝所有进来的、允许所有出去的）；②**规则管理**（`ufw allow/deny/delete` 按端口/服务/协议放行或拒绝）；③**状态查看**（`ufw status`/`verbose` 查看已生效规则）；④**与 iptables 的关系**（UFW 不是独立防火墙，它是 iptables/nftables 的配置前端，底层仍是 netfilter）。本叶讲的是「**操作系统主机级的网络端口访问控制**」——与安全章的「应用/Web 层攻击防护（XSS/SQL 注入/CSP）」是不同维度，本叶只管哪个端口能连、哪个不能连。

## 评价

**优点**

- **语法直觉**：`ufw allow 22` 一目了然，无需记忆 iptables 复杂的 `-A INPUT -p tcp --dport 22 -j ACCEPT` 语法
- **默认安全**：`default deny` 默认拒绝所有入站，强制显式放行，攻击面最小
- **降低门槛**：让非专业运维也能配好主机防火墙，避免 iptables 配错导致锁死或漏洞
- **与 iptables 兼容**：底层仍是 netfilter/iptables，规则可与手写 iptables 规则共存
- **IPv6 支持**：原生支持 IPv6 规则（`ufw allow 22` 自动同时配 IPv4/IPv6）

**缺点**

- **能力有限**：复杂规则（按源 IP 限速、连接跟踪、端口转发、应用层过滤）UFW 表达不了，仍需回到 iptables/nftables
- **仅主机级**：只管「端口开不开」，不管应用层攻击（SQL 注入/XSS），那需 Web 应用防火墙（WAF）
- **Ubuntu/Debian 为主**：RHEL/CentOS 系默认用 firewalld，UFW 不是标准配置
- **规则顺序**：UFW 的规则按 `after.rules`/`before.rules` 顺序匹配，复杂场景易出错

## 本叶地图

- [入门](./getting-started) —— UFW 定位、默认拒绝策略、`ufw allow/deny/status` 核心命令、22/80/443 常用规则
- [规则与策略](./guide-line/rules-and-policy) —— 默认策略、allow/deny/limit 规则、按端口/服务/协议/源 IP 配置、规则删除
- [iptables 关系与进阶](./guide-line/iptables-and-advanced) —— UFW 与 iptables/nftables/netfilter 的关系、复杂场景何时需绕过 UFW、端口转发与限流
- [参考](./reference) —— UFW 命令速查、常用端口规则、与 iptables 命令对照、易错点清单

## 幻灯片地址

<a href="/SlideStack/ufw-slide/" target="_blank">UFW（主机防火墙）</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ufw" target="_blank" rel="noopener noreferrer">UFW（主机防火墙）测试题</a>
