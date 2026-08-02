---
layout: doc
outline: [2, 3]
---

# 入门：网络工具分层排障与数据传输

> 基于 iproute2 / curl / OpenSSH 工具集 · 核于 2026-08

## 速查

- **两大职责**：①**诊断**（ping/dig/nslookup/ss/netstat/traceroute/ip/ifconfig）——通不通、连到哪、卡在哪；②**数据传输**（curl/wget/scp/rsync）——取数据、搬文件、同步目录。
- **分层排障口诀**：`ping`（ICMP 链路）→ `dig/nslookup`（DNS 解析）→ `traceroute`（路由路径）→ `ss`（本机连接）→ `curl`（应用层）——从底到顶逐层确认，避免在错的层浪费时间。
- **`ping`**：发 ICMP Echo 探连通性 + 测延迟（RTT）+ 看丢包率。**注意**：很多云服务器/防火墙禁 ICMP，ping 不通 ≠ 服务不通，要用 `curl`/`nc` 在 TCP 层复核。
- **`dig` vs `nslookup`**：都查 DNS。`dig` 输出结构化（含 ANSWER SECTION/TTL/A 记录），适合脚本与排障；`nslookup` 交互式、输出更友好但信息少。**首选 dig**。
- **`ss`（socket statistics）**：`netstat` 的现代继任者（来自 iproute2），直接读内核 netlink，比 netstat 快得多。`ss -tlnp` 看监听端口是运维最高频命令。
- **`netstat`**：老牌工具，已被 `ss` 取代但仍常见。`netstat -tlnp` 与 `ss -tlnp` 等价，但慢且需读 `/proc`。
- **`traceroute`**：用递增 TTL 的包探测到目标经过的每一跳路由器，定位「卡在中间哪一跳」。Windows 用 `tracert`。
- **`curl`**：万能 HTTP/HTTPS/FTP 客户端，调试 API 的瑞士军刀。`-I` 看响应头、`-X` 指定方法、`-d` 发 Body、`-H` 加请求头、`-s` 静默、`-o` 存文件。
- **`wget`**：递归下载与脚本化抓取，`-r` 递归、`-c` 断点续传、`-O` 指定文件名。比 curl 更适合「整站镜像」与「无人值守下载」。
- **`scp`**：基于 SSH 的加密文件拷贝，语法 `scp src dst`（本地/远程用 `user@host:path`）。一次性小文件方便，大目录同步用 rsync。
- **`rsync`**：增量同步王者——只传差异块（滚动校验）、支持断点续传、`--delete` 保持镜像一致、`-z` 压缩传输。**尾斜杠陷阱**：`src/` 拷内容、`src` 拷目录本身。
- **`ip` vs `ifconfig`**：`ip`（iproute2）是现代标准，`ifconfig`（net-tools）已废弃但仍常见。`ip addr`/`ip route`/`ip link` 取代 `ifconfig`/`route`/`ifconfig up`。
- **进阶顺序**：[诊断工具详解](./guide-line/diagnostics) → [数据传输详解](./guide-line/data-transfer) → [参考](./reference)。

## 一、为什么需要这么多工具

网络故障的根因可能发生在任何一层：网线断了（物理层）、IP 冲突（网络层）、DNS 解析失败（应用层）、路由黑洞（网络层）、防火墙丢包（传输层）、HTTP 404（应用层）。**没有一个工具能定位所有层的故障**——所以需要一组分工明确的工具，按 OSI/TCP-IP 分层各管一段。

排障的核心思路是**自底向上逐层确认**：

```
ping 通吗？       ──否── 物理层/链路层/IP 层故障
  │是
DNS 解析对吗？    ──否── DNS 配置/缓存/权威服务器问题（dig）
  │是
路由通吗？        ──否── 中间某跳丢包/路由黑洞（traceroute）
  │是
端口监听吗？      ──否── 服务没起/绑错地址（ss -tlnp）
  │是
应用响应吗？      ──否── 应用 bug/权限/配置（curl）
```

这种分层思路能避免「在错的层 debug」——比如 DNS 没解析对却去查防火墙规则，浪费时间。

## 二、诊断类工具速览

| 工具 | 层 | 核心用途 | 高频用法 |
| --- | --- | --- | --- |
| `ping` | 网络层（ICMP） | 连通性 + 延迟 + 丢包 | `ping -c 4 example.com` |
| `dig` | 应用层（DNS） | DNS 解析（A/AAAA/CNAME/MX） | `dig example.com`、`dig @8.8.8.8 example.com` |
| `nslookup` | 应用层（DNS） | DNS 解析（交互式） | `nslookup example.com` |
| `traceroute` | 网络层 | 路径探测（每跳路由器） | `traceroute example.com` |
| `ss` | 传输层 | 连接/监听端口（现代） | `ss -tlnp`（看监听） |
| `netstat` | 传输层 | 连接/监听端口（老牌） | `netstat -tlnp` |
| `ip` | 链路/网络层 | 地址/路由/网卡（现代） | `ip addr`、`ip route` |
| `ifconfig` | 链路/网络层 | 地址/网卡（老牌） | `ifconfig eth0` |

- **现代 vs 老牌**：`ss`/`ip` 属于 **iproute2** 套件（Linux 默认），`netstat`/`ifconfig` 属于 **net-tools**（已停止维护）。新机器首选 iproute2，但老脚本和资料里 net-tools 仍随处可见，两者都要会。
- **`ss -tlnp` 解读**：`t`=TCP、`l`=监听（listening）、`n`=不解析端口名（显示数字端口，快）、`p`=显示进程。这是确认「服务到底有没有起来、绑在哪个地址」的标准命令。

## 三、数据传输类工具速览

| 工具 | 协议 | 适用场景 | 核心特点 |
| --- | --- | --- | --- |
| `curl` | HTTP/HTTPS/FTP/... | 调试 API、单次请求 | 多协议、可控 header/方法/Body、 `-I` 看头 |
| `wget` | HTTP/HTTPS/FTP | 递归下载、脚本抓取 | `-r` 递归、`-c` 断点续传、无人值守 |
| `scp` | SSH（SFTP） | 一次性小文件加密拷贝 | 语法简单 `scp src dst` |
| `rsync` | rsync（可走 SSH） | 增量同步大目录 | 只传差异块、`--delete`、`-z` 压缩 |

- **curl vs wget**：`curl` 是「发请求看响应」的工具（适合调 API），`wget` 是「把东西下下来」的工具（适合批量/递归下载）。curl 更强大灵活，wget 更专一下载。
- **scp vs rsync**：`scp` 每次全量传输（简单但慢），`rsync` 只传差异（快且省流量）。同步大目录或频繁备份必用 rsync。注意 rsync 的**尾斜杠语义**（见下文）。

## 四、ping：连通性与延迟

`ping` 发送 ICMP Echo Request，目标回 ICMP Echo Reply，借此判断：

- **通不通**：有回包 = 链路可达。
- **延迟（RTT）**：往返时间，反映网络质量（min/avg/max）。
- **丢包率**：丢包比例，反映链路稳定性。

```bash
ping -c 4 example.com      # 发 4 个包后停（默认无限发）
ping -i 0.5 example.com    # 每 0.5 秒发一次（默认 1 秒）
ping -W 2 example.com      # 每个包等 2 秒超时
```

**重要陷阱**：很多云服务器（AWS/阿里云）和安全组默认**禁 ICMP**，导致 ping 不通但服务正常。遇到 ping 不通，要用 `curl http://host:port` 或 `nc -zv host port` 在 TCP 层复核——「ping 不通 ≠ 服务不通」。

## 五、dig：DNS 解析排障

`dig`（Domain Information Groper）查 DNS 记录，是排查「域名解析对不对」的首选：

```bash
dig example.com                # 查 A 记录（IPv4）
dig example.com AAAA           # 查 AAAA 记录（IPv6）
dig @8.8.8.8 example.com       # 指定用 Google DNS 查
dig example.com MX             # 查邮件交换记录
dig example.com CNAME          # 查别名记录
dig +short example.com         # 只输出 IP（适合脚本）
dig +trace example.com         # 从根服务器逐级追溯解析过程
```

- **ANSWER SECTION**：dig 输出的核心，列出解析到的记录、TTL、类型、值。
- **指定 DNS 服务器**（`@8.8.8.8`）能区分「本地 DNS 缓存/配置问题」还是「权威记录本身错了」——换一个公共 DNS 查，结果一致说明记录没问题，是本地 DNS 的锅。

## 六、ss：连接与监听端口

`ss` 是运维最高频的诊断命令，确认服务是否起来、绑在哪个地址、有哪些活跃连接：

```bash
ss -tlnp           # TCP 监听端口 + 进程（最常用）
ss -tunap          # 所有 TCP/UDP 连接 + 进程
ss -tln            # 只看监听，不解析进程（不需 root）
ss -tn state established 'dport = :443'   # 看连到 443 端口的已建立连接
```

- **`-t` TCP**、`-u` UDP**、`-l` listening（监听）**、`-a` all（含已建立）**、`-n` numeric（不解析端口名/主机名，快）**、`-p` process（显示占用进程，需 root）。
- **STATE 列**：`LISTEN`（监听中）、`ESTAB`（已建立连接）、`TIME-WAIT`（关闭中等待）、`CLOSE-WAIT`（对端关闭待本地处理）。大量 `TIME-WAIT` 可能是短连接风暴。
- **地址绑定**：`127.0.0.1:8080` 表示只监听本地回环（外部访问不了）；`0.0.0.0:8080` 或 `*:8080` 表示监听所有网卡（外部可访问）。服务「本地能连、远程连不上」多半是绑在了 `127.0.0.1`。

## 七、curl：HTTP 调试瑞士军刀

`curl` 是调试 HTTP API 与 Web 服务的核心工具：

```bash
curl -I https://example.com             # 只看响应头（HEAD 请求）
curl -s -o /dev/null -w "%{http_code}" https://example.com   # 只取状态码
curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d '{"name":"alice"}'
curl -H "Authorization: Bearer token123" https://api.example.com/me
curl -L https://example.com             # 跟随重定向
curl -v https://example.com             # 显示完整请求/响应（含 TLS 握手）
curl -k https://self-signed.example.com # 忽略证书错误
curl --resolve example.com:443:1.2.3.4 https://example.com  # 强制解析到指定 IP
```

- **`-I`**：发 HEAD 请求只看头，快速确认状态码与服务器版本，不下载 Body。
- **`-X`/`-d`/`-H`**：自定义方法/Body/请求头，是调 RESTful API 的标准三件套。`-d` 会自动加 `Content-Type: application/x-www-form-urlencoded`，发 JSON 要手动 `-H "Content-Type: application/json"`。
- **`-v`**：verbose，显示完整请求和响应（含 TLS 握手过程），是排查 HTTPS 问题的第一手段。
- **`--resolve`**：绕过 DNS，强制把域名解析到指定 IP——在 CDN/灰度环境调试某台特定后端时极有用。

## 八、rsync：增量同步

`rsync` 用滚动校验算法只传文件的**差异块**，是同步大目录、做备份的事实标准：

```bash
rsync -avz src/ user@host:/path/dst/      # 本地→远程，归档+详细+压缩
rsync -avz --delete src/ user@host:dst/   # 删除目标端多余的文件（保持镜像）
rsync -avz -e "ssh -p 2222" src/ host:dst/  # 指定 SSH 端口
rsync -avzn src/ dst/                     # dry-run，只看会做什么不真做（安全预演）
```

- **核心选项**：`-a`（archive，递归+保留权限/时间/软链等）、`-v`（verbose）、`-z`（compress，传输时压缩）、`-P`（显示进度+断点续传）。
- **`--delete`**：让目标端与源端完全一致（删除目标端有但源端没有的文件）。**危险**：源端写错或为空会清空目标，务必先 `--dry-run` 预演。
- **尾斜杠陷阱（最常见错误）**：
  - `rsync src/ dst/` —— 把 `src/` **里面的内容**同步到 `dst/`（dst 变成 src 的内容）
  - `rsync src dst/` —— 把 `src` **目录本身**放到 `dst/` 下（变成 `dst/src/`）
  - 一个斜杠之差，结果完全不同，初学者十有八九踩过。

## 下一步

掌握了 11 个工具的定位与核心用法后，下一步深入两个专题——[诊断工具详解](./guide-line/diagnostics)（ping/dig/ss/traceroute 的输出解读与排障实战）与[数据传输详解](./guide-line/data-transfer)（curl/wget/scp/rsync 的进阶语法与陷阱）。
