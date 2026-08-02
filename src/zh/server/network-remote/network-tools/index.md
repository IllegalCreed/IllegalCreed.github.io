---
layout: doc
---

# 网络工具

Linux 服务器运维与排障，几乎都化为一行命令：`ping` 探通断、`curl` 试接口、`dig` 查 DNS、`ss` 看连接、`traceroute` 找跳点、`rsync` 同步数据。这些**网络工具**是开发与运维的「五官」——没有它们，线上故障只能靠猜。本叶把日常高频的 11 个工具按职责归为两类：**诊断类**（ping/dig/nslookup/ss/netstat/traceroute/ip/ifconfig）回答「网络通不通、连到哪、卡在哪」；**数据传输类**（curl/wget/scp/rsync）回答「数据怎么取、怎么搬、怎么同步」。

工具选择遵循「最小够用」原则：诊断连通性先 `ping`（ICMP），再 `dig/nslookup`（DNS），再 `traceroute`（路径），最后 `curl`（应用层）——分层排障从底到顶逐层确认。数据传输选型看场景：`curl` 适合调试 HTTP API（多协议、可控 header/方法/Body），`wget` 适合递归下载与脚本化抓取，`scp` 适合一次性小文件加密传输，`rsync` 适合增量同步大目录（只传差异块、支持断点续传）。本叶是「网络与远程」子组的**工具基础**——后续 OpenSSH 叶讲 `ssh-keygen`/端口转发，OpenSSL 叶讲证书生成，都建立在这些工具的日常熟练之上。

## 评价

**优点**

- **分层排障清晰**：ping（链路）→ dig（DNS）→ traceroute（路由）→ curl（应用），逐层定位故障点
- **一站式覆盖**：11 个工具覆盖连通性、DNS、路由、连接状态、文件传输、增量同步全链路
- **无 GUI 依赖**：纯命令行，SSH 进服务器即可用，适合无图形界面的远程与容器环境
- **可脚本化**：`curl -s` 配合 jq、`rsync --dry-run` 配合 cron，轻松嵌入自动化流水线

**缺点**

- **新旧并存**：`netstat`/`ifconfig` 已被 `ss`/`ip` 取代（iproute2），但老资料与肌肉记忆仍广泛使用，容易混淆
- **输出因发行版而异**：`ss`/`ip` 在不同 Linux 版本选项与列含义略有差异，跨机器排障要注意
- **ICMP 受限**：`ping` 走 ICMP，常被防火墙/云安全组屏蔽，「ping 不通」不代表「服务不通」，需用 `curl`/`nc` 在 TCP 层复核
- **学习曲线**：`curl` 有 200+ 选项、`rsync` 语法晦涩（尾斜杠语义、`--delete` 危险），需刻意练习

## 本叶地图

- [入门](./getting-started) —— 11 个工具定位、分层排障思路、curl/wget/scp/rsync 速查、ping/dig/ss 核心用法
- [诊断：连通性、DNS 与连接状态](./guide-line/diagnostics) —— ping/dig/nslookup/ss/netstat/traceroute/ip/ifconfig 的输出解读与排障实战
- [数据传输：curl、wget、scp 与 rsync](./guide-line/data-transfer) —— curl 调试 HTTP API、wget 递归下载、scp 加密拷贝、rsync 增量同步的语法与陷阱
- [参考](./reference) —— 11 个工具速查表、ss/netstat 对照、rsync 尾斜杠陷阱、易错点清单

## 幻灯片地址

<a href="/SlideStack/network-tools-slide/" target="_blank">网络工具</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=网络工具" target="_blank" rel="noopener noreferrer">网络工具测试题</a>
