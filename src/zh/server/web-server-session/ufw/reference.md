---
layout: doc
outline: [2, 3]
---

# 参考：UFW 命令速查、端口规则与 iptables 对照

> 基于 UFW 0.36 · 核于 2026-08

## 速查

- **UFW 定位**：iptables/nftables 的配置前端，把复杂语法简化成 `ufw allow 22`，底层是内核 netfilter。
- **默认策略**：`default deny incoming`（拒绝入站）+ `default allow outgoing`（允许出站），最小攻击面。
- **核心命令**：`enable`/`disable`/`allow`/`deny`/`limit`/`status`/`delete`/`reset`。
- **必放三端口**：22（SSH）、80（HTTP）、443（HTTPS）。
- **数据库端口绝不开公网**：3306/5432/6379/27017/9200，只允许内网 IP。

## 一、UFW 命令速查

| 命令 | 作用 |
| --- | --- |
| `ufw enable` | 启用防火墙（加载所有规则） |
| `ufw disable` | 禁用防火墙 |
| `ufw status` | 查看规则列表 |
| `ufw status verbose` | 详细状态（含默认策略、日志） |
| `ufw status numbered` | 带编号的规则（删除用） |
| `ufw default deny incoming` | 设置默认拒绝入站 |
| `ufw default allow outgoing` | 设置默认允许出站 |
| `ufw allow 端口` | 放行端口 |
| `ufw allow 端口/tcp` | 放行指定协议 |
| `ufw allow 服务名` | 按服务名放行（ssh/http/https） |
| `ufw allow 'App Profile'` | 按应用配置放行（'Nginx Full'） |
| `ufw allow from IP to any port N` | 按源 IP 限制访问 |
| `ufw deny 端口` | 拒绝端口（DROP） |
| `ufw reject 端口` | 拒绝端口（回 RST） |
| `ufw limit 端口` | 限流防暴破（30s 超 6 次拒） |
| `ufw delete 编号` | 按编号删除规则 |
| `ufw delete allow 端口` | 按命令删除规则 |
| `ufw insert N 规则` | 插入规则到指定位置 |
| `ufw reset` | 清空所有规则 |
| `ufw app list` | 列出应用配置 |
| `ufw reload` | 重新加载规则 |

## 二、常用端口规则

| 服务 | 端口 | 推荐规则 |
| --- | --- | --- |
| **SSH** | 22 | `ufw limit 22/tcp`（限流防暴破） |
| **HTTP** | 80 | `ufw allow 80/tcp` |
| **HTTPS** | 443 | `ufw allow 443/tcp` |
| **MySQL** | 3306 | `ufw allow from 内网 to any port 3306`（绝不开公网） |
| **PostgreSQL** | 5432 | `ufw allow from 内网 to any port 5432` |
| **Redis** | 6379 | `ufw allow from 内网 to any port 6379` |
| **MongoDB** | 27017 | `ufw allow from 内网 to any port 27017` |
| **DNS** | 53 | `ufw allow 53/tcp` + `ufw allow 53/udp` |

## 三、典型配置流程

```bash
# 1. 先放行 SSH（最重要）
sudo ufw allow 22/tcp            # 或 sudo ufw limit 22/tcp

# 2. 放行 Web
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 3. 默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 4. 启用
sudo ufw enable

# 5. 验证
sudo ufw status verbose
```

## 四、UFW 与 iptables 命令对照

| 功能 | UFW | iptables |
| --- | --- | --- |
| 放行 22 | `ufw allow 22` | `iptables -A INPUT -p tcp --dport 22 -j ACCEPT` |
| 拒绝 3306 | `ufw deny 3306` | `iptables -A INPUT -p tcp --dport 3306 -j DROP` |
| 按源 IP | `ufw allow from 10.0.0.0/8 to any port 3306` | `iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 3306 -j ACCEPT` |
| 已建立连接 | （UFW 自动配） | `iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT` |
| 查看规则 | `ufw status` | `iptables -L INPUT -n -v` |

## 五、netfilter 表与链速查

| 表 | 作用 | 主要链 | UFW 是否管理 |
| --- | --- | --- | --- |
| **filter** | 过滤（防火墙核心） | INPUT/OUTPUT/FORWARD | 是（主要操作这个） |
| **nat** | 地址转换/端口转发 | PREROUTING/POSTROUTING | 否（需手写 iptables） |
| **mangle** | 修改包头 | 所有链 | 否 |
| **raw** | 连接跟踪前 | PREROUTING/OUTPUT | 否 |

## 六、易错点清单

- **「先 enable 再 allow SSH」**：危险。先 enable（默认 deny）会立刻断开 SSH。必须先 `allow 22` 再 `enable`。
- **「UFW 是独立的防火墙引擎」**：错。UFW 是 iptables/nftables 的配置前端，底层是内核 netfilter。
- **「`ufw deny 3306` 在默认 deny 时有意义」**：冗余。默认 deny incoming 已拒绝所有未 allow 的端口，单独 deny 3306 多余（除非要覆盖 allow）。
- **「数据库端口可以开公网」**：危险。3306/6379 等内部服务绝不开公网，默认无鉴权会被秒攻破，只允许内网 IP。
- **「deny 和 reject 一样」**：不同。deny（DROP）丢包无响应（更安全，不暴露端口存在）；reject 回拒绝包（暴露端口存在但不可连）。公网用 deny。
- **「UFW 能挡住所有攻击」**：错。UFW 只管端口级访问控制，挡不住应用层攻击（SQL 注入/XSS），那需 WAF + 应用代码。
- **「Docker 发布端口受 UFW 控制」**：错。Docker 自己管理 iptables（DOCKER 链），绕过 UFW 的 INPUT 链，导致 UFW 规则对容器端口无效（经典坑）。
- **「limit 能根治 SSH 暴力破解」**：不完全。limit 只减缓（30s 超 6 次拒），根治靠禁用密码登录 + SSH 密钥。
- **「改完 UFW 规则要重启」**：错。UFW 命令即时生效（写入内核 netfilter），无需重启或 reload（除非手编 before.rules 需 reload）。
- **「UFW 在所有 Linux 发行版都用」**：错。UFW 主要在 Ubuntu/Debian；RHEL/CentOS 系默认用 firewalld（语法不同）。

## 权威链接

- [UFW 官方文档（Ubuntu）](https://help.ubuntu.com/community/UFW)
- [UFW man page](https://manpages.ubuntu.com/manpages/jammy/en/man8/ufw.8.html)
- [iptables 官方文档](https://www.netfilter.org/documentation/)
- [nftables 官方 Wiki](https://wiki.nftables.org/)
- [firewalld 文档](https://firewalld.org/documentation/)
- [UFW Cookbook - Debian](https://wiki.debian.org/Uncomplicated%20Firewall%20(UFW))
- 本站幻灯片：<a href="/SlideStack/ufw-slide/" target="_blank">UFW（主机防火墙）</a>
