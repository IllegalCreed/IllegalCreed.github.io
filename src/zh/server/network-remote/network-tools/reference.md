---
layout: doc
outline: [2, 3]
---

# 参考：11 个网络工具速查与易错点

> 基于 iproute2 / curl / OpenSSH / rsync · 核于 2026-08

## 速查

- **诊断三件套**：`ping`（ICMP 链路）→ `dig`（DNS）→ `traceroute`（路由）→ `ss`（端口）→ `curl`（应用），自底向上分层排障。
- **数据传输四件套**：`curl`（调 API）、`wget`（批量下载）、`scp`（单次拷贝）、`rsync`（增量同步）。
- **现代 vs 老牌**：`ss`/`ip`（iproute2，现代）取代 `netstat`/`ifconfig`（net-tools，废弃）；`dig` 取代 `nslookup`。
- **绑定地址**：`127.0.0.1` 只本机，`0.0.0.0` 对外。「远程连不上」九成是绑在了回环。
- **rsync 尾斜杠**：`src/` 拷内容，`src` 拷目录本身；`--delete` 必先 `--dry-run`。

## 一、工具速查表

| 工具 | 层 | 用途 | 高频命令 |
| --- | --- | --- | --- |
| `ping` | 网络层（ICMP） | 连通性 + 延迟 | `ping -c 4 host` |
| `dig` | 应用层（DNS） | DNS 解析（首选） | `dig host`、`dig @8.8.8.8 host` |
| `nslookup` | 应用层（DNS） | DNS 解析（老牌） | `nslookup host` |
| `traceroute` | 网络层 | 路由路径 | `traceroute host` |
| `ss` | 传输层 | 连接/监听（现代） | `ss -tlnp` |
| `netstat` | 传输层 | 连接/监听（老牌） | `netstat -tlnp` |
| `ip` | 链路/网络层 | 地址/路由（现代） | `ip addr`、`ip route` |
| `ifconfig` | 链路/网络层 | 地址/网卡（老牌） | `ifconfig eth0` |
| `curl` | 应用层 | HTTP 调试 | `curl -I url`、`curl -X POST -d ...` |
| `wget` | 应用层 | 递归下载 | `wget -c url`、`wget -r url` |
| `scp` | SSH | 加密拷贝 | `scp file user@host:path` |
| `rsync` | SSH/rsync | 增量同步 | `rsync -avz src/ host:dst/` |

## 二、ss/netstat 对照

| 任务 | ss（现代） | netstat（老牌） |
| --- | --- | --- |
| TCP 监听端口 + 进程 | `ss -tlnp` | `netstat -tlnp` |
| 所有连接 | `ss -tunap` | `netstat -anp` |
| 路由表 | `ip route` | `netstat -rn` |
| 网卡流量 | `ip -s link` | `netstat -i` |

- **ss 快在哪**：直接读内核 netlink 接口，O(1)；netstat 遍历 `/proc/net/*`，连接多时慢几十倍。生产服务器首选 ss。

## 三、curl 常用选项速查

| 选项 | 作用 |
| --- | --- |
| `-I` | HEAD 只看响应头 |
| `-i` | 输出响应头 + Body |
| `-v` | verbose，显示完整请求/响应（含 TLS 握手） |
| `-s` | 静默（不显示进度条） |
| `-S` | 配合 `-s`，出错时仍显示错误 |
| `-o file` | 输出存到文件 |
| `-O` | 用 URL 中的文件名存 |
| `-L` | 跟随重定向 |
| `-X METHOD` | 指定 HTTP 方法 |
| `-d data` | 发 Body（POST） |
| `-H header` | 加请求头 |
| `-F field=@file` | multipart 上传文件 |
| `-b cookie` | 发 Cookie |
| `-k` | 忽略 TLS 证书错误（调试用） |
| `-w fmt` | 自定义输出格式（`%{http_code}`） |
| `--resolve` | 强制域名解析到指定 IP |
| `--connect-timeout` / `--max-time` | 连接超时 / 总超时 |

## 四、rsync 核心选项与陷阱

| 选项 | 作用 |
| --- | --- |
| `-a` | archive（递归 + 保留权限/时间/软链） |
| `-v` | verbose |
| `-z` | 传输压缩 |
| `-P` | 进度 + 断点续传 |
| `--delete` | 删除目标端多余文件（镜像一致） |
| `--exclude=PATTERN` | 排除匹配模式 |
| `-n` | dry-run 预演 |
| `-e "ssh -p 2222"` | 指定 SSH 选项 |

**尾斜杠陷阱**：

```
rsync src/ dst/   → 把 src/ 内容同步进 dst/（dst 变成 src 的内容）
rsync src dst/    → 把 src 目录本身放进 dst/（变成 dst/src/）
```

**`--delete` 铁律**：源路径务必确认非空，使用前必 `-n` 预演。

## 五、scp vs rsync 选型

| 维度 | scp | rsync |
| --- | --- | --- |
| 传输方式 | 全量 | 增量（只传差异块） |
| 断点续传 | 不支持 | 支持（`-P`/`--partial`） |
| 进度显示 | 基础 | 详细（速率/百分比） |
| 适合场景 | 单次小文件 | 大目录同步/频繁备份 |
| 端口选项 | `-P`（大写） | `-e "ssh -p N"` |
| 删除同步 | 不支持 | `--delete` |

- **经验**：小于 10MB 的一次性拷贝用 scp（简单），目录同步或大于 10MB 用 rsync（增量省时省流量）。

## 六、易错点清单

- **「ping 不通就是服务挂了」**：错。云服务器/防火墙常禁 ICMP，要用 `curl`/`nc -zv` 在 TCP 层复核。
- **「dig 和 nslookup 完全一样」**：dig 输出更结构化（TTL/记录类型/ANSWER SECTION），可指定 `@server` 与 `+trace`，排障首选 dig。
- **「netstat 和 ss 一样快」**：错。netstat 遍历 `/proc` 慢，ss 走 netlink 快几十倍，生产首选 ss。
- **「ifconfig 是现代工具」**：错。ifconfig 属 net-tools 已废弃，现代用 `ip`（iproute2）。
- **「服务监听 0.0.0.0 和 127.0.0.1 一样」**：错。`127.0.0.1` 只本机访问，`0.0.0.0` 才对外。远程连不上的头号原因。
- **「curl -d 自动发 JSON」**：错。`-d` 默认 `application/x-www-form-urlencoded`，发 JSON 要手动加 `-H "Content-Type: application/json"`。
- **「scp -p 是端口」**：错。scp 端口是 `-P`（大写），`-p` 是保留时间戳（与 ssh 的 `-p` 相反，易混）。
- **「rsync src/ 和 src 一样」**：错。尾斜杠决定拷内容还是拷目录本身，差一个字符结果完全不同。
- **「rsync --delete 很安全」**：错。源端空或写错会清空目标，必先 `--dry-run` 预演。
- **「HTTP 传密码也没事」**：错。HTTP 明文，中间人可看全部内容，敏感数据必须 HTTPS 或 SSH。

## 七、进阶方向（链接其他叶）

- [OpenSSH](../openssh/) —— scp/rsync 走的 SSH 协议，密钥管理与端口转发的底层
- [OpenSSL](../openssl/) —— curl HTTPS 依赖的 TLS 证书生成与管理
- [Nginx](../../web-server-session/nginx/) —— `ss -tlnp` 看到的 Web 服务监听端口的实际应用

## 权威链接

- [iproute2 - Wikipedia](https://en.wikipedia.org/wiki/Iproute2)
- [curl man page](https://curl.se/docs/manpage.html)
- [rsync man page](https://linux.die.net/man/1/rsync)
- [ss vs netstat](https://man7.org/linux/man-pages/man8/ss.8.html)
- 本站幻灯片：<a href="/SlideStack/network-tools-slide/" target="_blank">网络工具</a>
