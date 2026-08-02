---
layout: doc
outline: [2, 3]
---

# 数据传输：curl、wget、scp 与 rsync

> 基于 curl / wget / OpenSSH / rsync · 核于 2026-08

## 速查

- **curl**：多协议（HTTP/HTTPS/FTP/...）客户端，调试 API 的瑞士军刀。`-I` 看头、`-X` 方法、`-d` Body、`-H` 头、`-L` 跟随重定向、`-v` 详细、`-s` 静默。
- **wget**：专一下载工具，`-r` 递归、`-c` 断点续传、`-O` 文件名、`--limit-rate` 限速。比 curl 更适合整站镜像与无人值守下载。
- **scp**：基于 SSH 的加密文件拷贝，`scp src dst`（远程用 `user@host:path`）。一次性小文件方便，大目录用 rsync。
- **rsync**：增量同步王者——只传差异块、`-a` 归档、`-z` 压缩、`-P` 进度+断点续传、`--delete` 镜像一致。**尾斜杠陷阱**：`src/` 拷内容、`src` 拷目录本身。
- **curl vs wget 选型**：调 API/发请求看响应 → curl；批量/递归下载文件 → wget。
- **scp vs rsync 选型**：单次小文件 → scp；同步大目录/频繁备份 → rsync（只传差异，省时省流量）。
- **传输加密**：scp/rsync 默认走 SSH（加密），curl 走 HTTPS（TLS 加密）。HTTP/FTP 明文传输，敏感数据禁用。

## 一、curl：HTTP 调试核心

`curl` 支持十几种协议（HTTP/HTTPS/FTP/SCP/SFTP...），是调试 Web 服务与 RESTful API 的核心工具。

### 1.1 基础请求与响应查看

```bash
curl https://example.com                       # GET，输出 Body
curl -I https://example.com                    # HEAD，只看响应头（快速看状态码/服务器）
curl -i https://example.com                    # 输出响应头 + Body
curl -v https://example.com                    # verbose，显示完整请求/响应（含 TLS 握手）
curl -s https://example.com                    # 静默（不显示进度条），适合脚本
curl -s -o /dev/null -w "%{http_code}\n" https://example.com   # 只取状态码
```

- **`-I`**：最高频排障选项，发 HEAD 只看头，确认状态码、`Server`、`Content-Type`，不下载 Body，秒回。
- **`-v`**：排查 HTTPS 问题的第一手段——能看到完整的 TLS 握手（证书链、协商的加密套件、ALPN）和请求/响应头。
- **`-w`**：自定义输出格式变量，`%{http_code}`（状态码）、`%{time_total}`（总耗时）、`%{size_download}`（下载字节），脚本化监控利器。

### 1.2 自定义请求（调 API）

```bash
# POST JSON
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"alice","age":30}'

# 带认证头
curl -H "Authorization: Bearer eyJhbG..." https://api.example.com/me

# 从文件读 Body
curl -X PUT https://api.example.com/upload -d @data.json

# 上传文件（multipart）
curl -F "file=@photo.jpg" https://api.example.com/upload

# 带 Cookie
curl -b "session=abc123" https://example.com/dashboard
```

- **`-d` 陷阱**：`-d` 默认 `Content-Type: application/x-www-form-urlencoded`，发 JSON **必须**手动加 `-H "Content-Type: application/json"`，否则后端按表单解析会失败。
- **`-X` 可省略**：有 `-d` 时 curl 自动用 POST，有 `-I` 时自动用 HEAD，但显式写 `-X POST` 更清晰，推荐保留。
- **`-F`**：multipart/form-data，上传文件用。`@文件名` 表示从文件读内容。

### 1.3 高级排障选项

```bash
curl -L https://example.com                    # 跟随 301/302 重定向
curl -k https://self-signed.example.com        # 忽略 TLS 证书错误（自签证书调试）
curl --resolve example.com:443:1.2.3.4 https://example.com  # 强制解析到指定 IP
curl --connect-timeout 5 --max-time 30 https://example.com  # 连接超时 5s，总超时 30s
curl -x http://proxy.example.com:8080 https://target.com    # 走代理
curl -A "Mozilla/5.0 ..." https://example.com  # 自定义 User-Agent（绕过 UA 检测）
```

- **`--resolve`**：绕过 DNS，强制把域名解析到指定 IP。CDN/灰度环境调试某台特定后端节点时极有用（不改 `/etc/hosts` 也能临时指定）。
- **`-k`**：跳过证书校验，只用于自签证书调试，**生产禁用**（会暴露于中间人攻击）。
- **`--connect-timeout` vs `--max-time`**：前者只管 TCP 连接建立阶段，后者管整个请求总时长。两者都设能避免卡死。

## 二、wget：递归与脚本化下载

`wget` 专攻「把文件下下来」，比 curl 更擅长批量、递归、断点续传：

```bash
wget https://example.com/file.zip              # 下载单个文件
wget -c https://example.com/big.iso            # 断点续传（中断后接着下）
wget -O custom.zip https://example.com/file.zip   # 指定保存文件名
wget -r -l 2 https://example.com/docs/         # 递归下载（深度 2），整站镜像
wget -m https://example.com/                   # mirror 模式（递归+时间戳+无限深度）
wget --limit-rate=200k https://example.com/big.iso  # 限速 200KB/s（不占满带宽）
wget -q https://example.com/file.zip           # 安静模式（不输出，适合 cron）
wget -b https://example.com/big.iso            # 后台下载（输出到 wget-log）
```

- **`-c`**：断点续传——下载中断后重新跑命令会从断点继续，而不是重头下。大文件下载必备。
- **`-r`**：递归——解析页面里的链接，把引用的资源也下下来。`-l N` 限制深度，`-m`（mirror）是 `-r -N -l inf` 的组合，用于整站镜像。
- **`--limit-rate`**：限速，避免下载占满生产带宽影响业务。
- **无人值守**：`wget -q -b` 后台安静下载，配合 cron 定时拉取，是脚本化数据采集的经典模式。

**curl vs wget 选型**：要「发请求看响应、调 API、控制 header」用 curl；要「批量下文件、整站镜像、脚本无人值守」用 wget。两者都做基础下载，但 curl 强在灵活，wget 强在下载专一。

## 三、scp：SSH 加密拷贝

`scp`（secure copy）基于 SSH 协议加密传输文件，语法 `scp 源 目标`，远程地址用 `user@host:path`：

```bash
# 本地 → 远程
scp local.txt user@server:/path/to/dest/

# 远程 → 本地
scp user@server:/var/log/app.log ./

# 远程 → 远程（通过本地中转）
scp user1@host1:/file user2@host2:/dest     # 默认经本地转发，加 -3 显式

# 拷贝整个目录
scp -r localdir/ user@server:/path/

# 指定 SSH 端口与私钥
scp -P 2222 -i ~/.ssh/id_ed25519 file user@server:/dest

# 压缩传输（慢网络/大文本有用）
scp -C big.txt user@server:/dest
```

- **`-P`（大写）**：SSH 端口（注意是 `-P` 不是 `-p`，`-p` 是保留时间戳，与 ssh 的 `-p` 相反，极易混淆）。
- **`-r`**：递归拷贝目录。
- **`-i`**：指定私钥文件（对应 `ssh -i`）。
- **局限**：scp 每次都**全量传输**，没有增量；不显示进度细节；无法断点续传。所以大目录同步或频繁备份用 rsync。

## 四、rsync：增量同步

`rsync` 用滚动校验（rolling checksum）算法找出文件的**差异部分**，只传差异块，是同步大目录、做备份的事实标准：

```bash
# 基础增量同步
rsync -avz src/ user@host:/path/dst/

# 保持镜像一致（删除目标端多余文件）
rsync -avz --delete src/ user@host:dst/

# 显示进度 + 断点续传
rsync -avzP src/ user@host:dst/

# 指定 SSH 端口
rsync -avz -e "ssh -p 2222" src/ host:dst/

# 排除某些文件
rsync -avz --exclude='*.log' --exclude='node_modules/' src/ host:dst/

# dry-run 预演（不真做，看会同步什么）
rsync -avzn src/ user@host:dst/
```

### 4.1 核心选项

| 选项 | 含义 |
| --- | --- |
| `-a` | archive 模式：递归 + 保留权限/属主/时间/软链接/设备文件（最常用） |
| `-v` | verbose，详细输出传输了哪些文件 |
| `-z` | compress，传输时压缩（适合文本，已压缩文件如 zip 没效果） |
| `-P` | `--partial --progress`：显示进度 + 支持断点续传（中断后接着传） |
| `--delete` | 删除目标端有但源端没有的文件（保持镜像） |
| `--exclude` | 排除匹配的模式（可多次） |
| `-n` | dry-run，只模拟不真传（危险操作前必用） |

### 4.2 尾斜杠陷阱（最常见错误）

`rsync` 对源路径尾斜杠极其敏感，一个斜杠之差结果完全不同：

```bash
rsync -avz src/ dst/      # 把 src/【里面的内容】同步到 dst/（dst 变成 src 的内容）
rsync -avz src dst/       # 把 src【目录本身】放到 dst/ 下（变成 dst/src/）
```

- **`src/`（带斜杠）**：传输 src 目录**里面的内容**，相当于「把 src 的内容倒进 dst」。
- **`src`（不带斜杠）**：传输 src **目录本身**，相当于「把 src 这个文件夹整个放进 dst」。
- **记忆法**：「带斜杠 = 内容流入；不带 = 目录搬走」。生产环境务必先 `--dry-run` 确认行为，再正式同步。

### 4.3 `--delete` 的危险

`--delete` 让目标端与源端完全一致——源端没有的文件，目标端会被删掉。这是做「镜像备份」的必要选项，但也是**最大的事故源**：

- 源端被误清空 → `--delete` 会把备份端也清空。
- 源路径写错（如写成空目录）→ 目标端被清空。
- **铁律**：用 `--delete` 前一定先 `rsync -avzn --delete src/ dst/` 预演，看清楚会删什么，再正式跑。

## 五、传输加密与安全

| 工具 | 加密 | 说明 |
| --- | --- | --- |
| `scp` / `rsync`（走 SSH） | SSH 加密 | 默认安全，无需额外配置 |
| `curl https://` | TLS | 加密 + 身份验证（证书） |
| `curl http://` | **明文** | 禁用于传密码/Token/敏感数据 |
| `wget http://` | **明文** | 同上 |
| `ftp` | **明文** | 连密码都明文，早已淘汰，用 SFTP/FTPS 替代 |

- **铁律**：传输任何敏感数据（密码、Token、用户信息），必须走 HTTPS（curl）或 SSH（scp/rsync）。HTTP/FTP 明文传输，中间人能直接看到全部内容。
- **rsync daemon 模式**：rsync 也可不走 SSH 而用自带 daemon（`rsync://`），但默认不加密，公网传输敏感数据要走 SSH 模式或配合 stunnel/VPN。

## 下一步

数据传输工具讲完后，可回到[参考](../reference)查看 11 个工具速查表与易错点清单，或进入下一叶[OpenSSH](../../openssh/)学习密钥管理与端口转发。
