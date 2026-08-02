---
layout: doc
outline: [2, 3]
---

# iptables 关系与进阶：UFW 底层原理与绕过场景

> 基于 UFW 0.36 · iptables 1.8 · 核于 2026-08

## 速查

- **UFW 与 iptables 关系**：UFW 不是独立防火墙，它是 **iptables（或 nftables）的配置前端**。`ufw allow` 等命令最终生成 iptables 规则，加载到内核的 **netfilter** 框架。
- **底层链路**：`ufw 命令` → 生成 `/etc/ufw/*.rules` → 调用 `iptables-restore` → 写入内核 netfilter 的规则链（INPUT/OUTPUT/FORWARD）。
- **netfilter 四表五链**：表（filter/nat/mangle/raw）× 链（INPUT/OUTPUT/FORWARD/PREROUTING/POSTROUTING）。UFW 主要操作 filter 表的 INPUT/OUTPUT 链。
- **UFW 的规则文件**：`/etc/ufw/before.rules`（UFW 用户规则前加载）、`/etc/ufw/user.rules`（用户用 ufw 命令加的规则）、`/etc/ufw/after.rules`（之后加载）。复杂需求可直接编辑这些文件。
- **何时需绕过 UFW 直接写 iptables**：①端口转发/DNAT（UFW 不直接支持）；②按包内容过滤（应用层）；③连接数限速（复杂限流）；④策略路由；⑤多 WAN/负载均衡。这些 UFW 表达不了，直接写 iptables/nftables。
- **iptables 基本语法**：`iptables -A 链 -匹配条件 -j 目标`，如 `iptables -A INPUT -p tcp --dport 22 -j ACCEPT`。
- **nftables**：iptables 的现代继任者（语法更统一、性能更好），Ubuntu 22+ 默认用 nftables 后端（iptables 命令通过兼容层翻译成 nft）。
- **持久化**：UFW 规则自动持久化（/etc/ufw/）；纯 iptables 规则需 `iptables-save > /etc/iptables/rules.v4` + 开机 `iptables-restore`。
- **firewalld**：RHEL/CentOS 系的对应物（类似 UFW 的角色，封装 nftables/iptables），语法与 UFW 不同。

## 一、UFW 与 iptables/netfilter 的关系

Linux 防火墙的完整链路：

```
用户命令          配置工具           内核框架
ufw allow 22  →  iptables/nftables  →  netfilter（内核网络栈钩子）
（前端简化）     （规则翻译）          （实际过滤，逐包检查）
```

- **netfilter**：Linux 内核的网络包过滤框架。它在内核网络栈的多个位置（钩子点）注册回调，对每个进出的网络包按规则链检查，决定接受（ACCEPT）、丢弃（DROP）等。这是真正的防火墙引擎，在内核态运行。
- **iptables / nftables**：用户态工具，用来配置 netfilter 的规则。iptables 是经典工具（按表/链组织规则），nftables 是现代继任者（语法统一、性能更好）。Ubuntu 22+ 默认 iptables 命令实际是 nftables 的兼容层。
- **UFW**：iptables/nftables 的更上层封装，把复杂语法简化成 `ufw allow 22`。UFW 生成的规则最终通过 `iptables-restore` 写入 netfilter。

所以「UFW 是防火墙」这种说法不严谨——**UFW 是配置工具，真正的防火墙是内核的 netfilter**。UFW 让你不用直接面对 iptables 的复杂语法。

## 二、netfilter 的表与链

netfilter 用「表（table）× 链（chain）」组织规则：

| 表 | 作用 | 主要链 |
| --- | --- | --- |
| **filter** | 过滤（放行/拒绝），防火墙核心 | INPUT（入站）、OUTPUT（出站）、FORWARD（转发） |
| **nat** | 网络地址转换（SNAT/DNAT/端口转发） | PREROUTING、POSTROUTING |
| **mangle** | 修改包头部（TTL/TOS/mark） | 所有链 |
| **raw** | 在连接跟踪前处理（ exemptions） | PREROUTING、OUTPUT |

- **UFW 主要操作 filter 表**：`ufw allow/deny` 生成 filter 表的 INPUT/OUTPUT 链规则。
- **nat 表 UFW 不直接管**：端口转发（DNAT）在 nat 表的 PREROUTING 链，UFW 没有直接语法，需手写 iptables 或编辑 before.rules。
- **链的匹配顺序**：包按链里规则的顺序从上往下匹配，第一个匹配的生效（ACCEPT/DROP 立即决定，不再查后续）。

## 三、iptables 基本语法（理解 UFW 在做什么）

```bash
# iptables 基本语法：iptables -A 链 -匹配条件 -j 目标
iptables -A INPUT -p tcp --dport 22 -j ACCEPT       # 放行入站 22 TCP
iptables -A INPUT -p tcp --dport 3306 -j DROP       # 丢弃入站 3306 TCP
iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT       # 放行来自 192.168.1.0/24 的所有流量
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT  # 放行已建立连接的回包

# 查看规则
iptables -L INPUT -n -v     # 查看 INPUT 链规则（数字地址、详细统计）
iptables -L --line-numbers  # 带编号（删除用）

# 删除
iptables -D INPUT 3         # 删除 INPUT 链第 3 条
```

- **`-A`（append）**：追加到链末尾。
- **`-p tcp --dport 22`**：协议 TCP、目标端口 22。
- **`-s`**：源 IP/网段。
- **`-j ACCEPT/DROP`**：跳转到目标（接受/丢弃）。
- **`-m conntrack`**：连接跟踪模块——放行已建立连接（ESTABLISHED）的后续包，否则服务器发出去的请求收不到响应。

UFW 的 `ufw allow 22` 实际生成多条 iptables 规则（含 conntrack、IPv6 等），所以你只需写一行。

## 四、何时需绕过 UFW 直接写 iptables

UFW 能力有限，以下场景需直接操作 iptables/nftables：

1. **端口转发（DNAT）**：把外网 8080 转到内网 80，或把 80 转到 Docker 容器。
   ```bash
   # iptables DNAT（UFW 不直接支持）
   iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 10.0.0.5:80
   iptables -A FORWARD -p tcp -d 10.0.0.5 --dport 80 -j ACCEPT
   ```
2. **MASQUERADE（SNAT）**：做 NAT 路由器，把内网包伪装成出口 IP。
3. **复杂限流**：按源 IP 限速（如每秒最多 10 个连接）、限带宽。
4. **按包内容过滤**：字符串匹配、应用层过滤（这类少用，应用层用 WAF）。
5. **策略路由 / 多 WAN**：按源地址选不同出口。

- **UFW 的 before.rules 出口**：这些高级需求可直接编辑 `/etc/ufw/before.rules`，写原始 iptables 语法，UFW 启动时会加载。比纯 iptables 更易持久化。
- **Docker 的 iptables**：Docker 自己管理 iptables（Docker 链），与 UFW 规则可能冲突——Docker 会绕过 UFW 直接在 DOCKER 链放行容器端口，这是常见坑。

## 五、UFW 规则文件结构

UFW 的规则分散在几个文件，理解结构才能定制：

```
/etc/ufw/
├── ufw.conf            # UFW 主配置（ENABLED=yes、IPV6=yes、LOGLEVEL）
├── default/            # 默认策略
│   └── ...             # set default 等写入
├── before.rules        # 用户规则之前加载（放基础规则，如 conntrack、loopback）
├── before6.rules       # IPv6 版
├── user.rules          # ufw allow/deny 命令生成的规则（用户规则主体）
├── user6.rules         # IPv6 版
├── after.rules         # 用户规则之后加载（兜底规则）
└── applications.d/     # 应用配置（nginx、openssh 等预定义）
```

- **`before.rules` 优先级最高**：在用户规则前加载。常放基础规则（如放行 loopback、放行已建立连接 conntrack）。
- **`user.rules` 是主体**：你用 `ufw allow` 加的规则都存这里。直接编辑它不如用 ufw 命令（命令会自动维护文件 + 重新加载）。
- **`after.rules` 兜底**：在用户规则后加载，常放日志、最终 DROP 兜底。
- **`applications.d/`**：`ufw app list` 看到的应用配置（如 nginx 定义了 80+443）。可自定义应用配置。

## 六、Docker 与 UFW 的经典冲突

Docker 会自己管理 iptables（DOCKER 链），发布端口（`docker run -p 8080:80`）时直接在 DOCKER 链放行，**绕过 UFW 的 INPUT 链**——导致你以为 UFW 挡住了 8080，实际外部能访问。这是经典坑：

- **现象**：`ufw deny 8080` 后，外部仍能访问 docker 发布的 8080。
- **原因**：Docker 在 DOCKER 链（nat 表 PREROUTING + filter 表 FORWARD）放行，绕过 UFW 的 INPUT 链。
- **解决方向**：①改 Docker 默认绑定 IP 为内网（`dockerd --ip=内网IP`）；②用 UFW-Docker 脚本管理 DOCKER 链；③在云防火墙层（安全组）限制，而非主机 UFW。详见 Docker 文档。

## 七、nftables 与 firewalld

- **nftables**：iptables 的现代继任者。语法更统一（一个 `nft` 命令配所有表/链）、性能更好（专用虚拟机）、支持集（set）高效匹配。Ubuntu 22+ / RHEL 8+ 默认用 nftables（iptables 命令通过兼容层翻译成 nft 规则）。UFW 在 nftables 后端上仍正常工作。
- **firewalld**：RHEL/CentOS/Fedora 系的对应物（类似 UFW 的角色，封装 nftables）。用 `firewall-cmd` 配置（zone + service 概念），与 UFW 语法不同。RHEL 系服务器见到的多是 firewalld 而非 UFW。

## 下一步

iptables 关系与进阶讲完后，UFW 的核心已覆盖。回到 [参考](../reference) 复习命令速查与易错点，或回到 [Web 服务器与会话](../) 章首页回顾四叶（Nginx/Caddy/tmux/UFW）。
