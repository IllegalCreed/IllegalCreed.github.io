---
layout: doc
outline: [2, 3]
---

# SSL 终止与日志：HTTPS 证书配置与 access/error 日志

> 基于 Nginx 1.26 · 核于 2026-08

## 速查

- **SSL 终止（TLS Termination）**：HTTPS 加解密在 Nginx 层完成，后端走明文 HTTP——证书统一在入口管理，后端免 TLS 握手开销。客户端只和 Nginx 做 TLS，Nginx 与后端在内网明文通信。
- **HTTPS 三件套**：`listen 443 ssl;` + `ssl_certificate`（证书，含公钥链）+ `ssl_certificate_key`（私钥）。再加 HTTP/2（`http2 on;`）多路复用提升性能。
- **HTTP 跳 HTTPS**：开一个 `listen 80` 的 server，`return 301 https://$host$request_uri;` 永久重定向——强制全站 HTTPS。
- **证书来源**：Let's Encrypt（免费，certbot 自动申请续期）、付费 CA（DigiCert 等）、云厂商免费证书（阿里云/腾讯云一年期）。90 天有效期的 Let's Encrypt 需配 cron 定时续期。
- **TLS 安全配置**：禁用老协议（`ssl_protocols TLSv1.2 TLSv1.3;`）、用强密码套件（`ssl_ciphers`）、启用 HSTS（`Strict-Transport-Security` 头）防降级攻击、OCSP Stapling 加速证书验证。
- **`access.log`**：每请求一行，默认 `combined` 格式（IP/时间/请求行/状态/大小/Referer/UA）。自定义 `log_format` 加 `$request_time`/`$upstream_response_time` 做性能分析。
- **`error.log`**：Nginx 自身错误（配置错、权限错、上游连不上）。诊断「502/504」第一步看 error.log。级别从 `debug`（最详）到 `crit`（最简），生产用 `warn`/`error`。
- **日志轮转**：用 `logrotate` 按天/大小切割压缩，避免单文件无限增长。Nginx 用 `kill -USR1` 信号让 master 重新打开日志文件（不丢连接）。
- **`$request_time` vs `$upstream_response_time`**：前者是 Nginx 处理请求的总耗时（含接收请求体），后者是后端处理耗时。两者差大说明 Nginx 层（网络/压缩）是瓶颈。
- **会话恢复**：`ssl_session_cache` 缓存 TLS 会话参数，`ssl_session_tickets` 用 ticket 让客户端重连时跳过完整握手——大幅降低 HTTPS 重连延迟。

## 一、SSL 终止架构：为什么在 Nginx 层卸载 HTTPS

TLS 加解密是 CPU 密集型操作（每次握手要非对称加密，每次传输要对称加密）。如果让每个后端应用服务器都处理 TLS，会带来三个问题：①证书要在每台机器部署，管理复杂；②后端 CPU 被加解密占用；③后端要监听 443，运维负担重。SSL 终止（TLS Termination）的解法：

```
客户端 ──HTTPS(TLS)──→ Nginx ──HTTP(明文)──→ 后端应用
        (加密)        (解密/加密)     (内网明文)
                     证书在这里
```

- **Nginx 是唯一的 TLS 端点**：证书、密钥、TLS 配置集中在 Nginx 一处管理，后端只需明文 HTTP。
- **后端专注业务**：Node.js/Java 不用处理 TLS，CPU 全用于业务逻辑。
- **前提是内网可信**：Nginx 到后端走内网（同 VPC/同机），明文可接受。若跨不可信网络需端到端加密（Nginx 到后端也 HTTPS）。
- **`X-Forwarded-Proto`**：Nginx 必须告诉后端「客户端是 https」，后端据此生成 https 链接、做安全跳转——否则后端以为是 http 导致 cookie 不生效、跳转死循环。

## 二、HTTPS 配置：从证书到 HTTP/2

一个生产级 HTTPS server 块：

```nginx
server {
    listen 443 ssl;
    http2 on;                                   # HTTP/2 多路复用，性能提升显著
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;   # 证书（含中间证书链）
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;     # 私钥

    ssl_protocols TLSv1.2 TLSv1.3;              # 禁用 TLSv1.0/1.1（已不安全）
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;  # 强密码套件
    ssl_prefer_server_ciphers off;              # 让客户端选（TLS 1.3 推荐）

    ssl_session_cache shared:SSL:10m;           # 会话缓存，重连省握手
    ssl_session_tickets on;                     # ticket 会话恢复
    ssl_session_timeout 1d;

    # OCSP Stapling：Nginx 主动查证书吊销状态发给客户端，省客户端查询往返
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 valid=300s;

    # HSTS：强制浏览器后续都用 HTTPS（防中间人降级）
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

# HTTP 跳 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;       # 永久重定向到 HTTPS
}
```

- **`fullchain.pem` vs `cert.pem`**：必须用 fullchain（含中间证书），否则部分浏览器（Android/旧客户端）报「证书不可信」。Let's Encrypt 自动生成 fullchain。
- **私钥权限**：`chmod 600 privkey.pem`，只让 Nginx master（root）读。私钥泄露 = HTTPS 形同虚设。
- **`http2 on`**：HTTP/2 多路复用（一个 TCP 连接并发多个请求）、头部压缩（HPACK），显著提升页面加载。Nginx 1.25+ 用 `http2 on;`（旧版写在 listen 行 `listen 443 ssl http2;`）。
- **TLS 1.3**：1.2 RTT 握手、更强的前向安全。Nginx 1.13+ 支持，开启 `ssl_protocols TLSv1.3` 即用。

## 三、证书申请与续期：certbot 工作流

Let's Encrypt 提供免费 90 天证书，用 certbot 自动化申请与续期：

```bash
# 申请（webroot 方式，Nginx 不停机）
sudo certbot certonly --webroot -w /var/www/html -d example.com -d www.example.com

# 续期（dry-run 测试）
sudo certbot renew --dry-run

# 配 cron 定时续期（每天检查，到期前 30 天自动续）
echo "0 3 * * * certbot renew --quiet --deploy-hook 'nginx -s reload'" | sudo tee /etc/cron.d/certbot
```

- **`--deploy-hook`**：续期成功后执行的钩子，用来 reload Nginx 让新证书生效——不重启进程，零停机。
- **HTTP-01 验证**：certbot 在 `/.well-known/acme-challenge/` 放一个文件，Let's Encrypt 通过 HTTP 访问验证域名归属。所以 80 端口必须能访问这个路径。
- **通配符证书**：需 DNS-01 验证（用 `certbot certonly --manual --preferred-challenges dns`），适配方 `*.example.com`。

## 四、`access.log`：请求级可观测

每个 HTTP 请求在 access.log 留一行，是性能分析与排错的入口。默认 `combined` 格式：

```nginx
log_format combined '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';
access_log /var/log/nginx/access.log combined;
```

为做性能分析，自定义加耗时字段：

```nginx
log_format perf '$remote_addr [$time_local] "$request" '
                '$status $body_bytes_sent '
                'rt=$request_time urt=$upstream_response_time';   # 总耗时/后端耗时
access_log /var/log/nginx/access.log perf;
```

- **`$request_time`**：Nginx 从收到第一个字节到发完响应的总耗时（含读请求体、后端处理、发响应）。这是客户端感知的延迟。
- **`$upstream_response_time`**：后端处理耗时（从发请求到收完响应）。`request_time - upstream_response_time` 差值大说明 Nginx 层（接收上传/压缩/网络）是瓶颈。
- **日志分析工具**：`goaccess`（实时终端分析）、`awk`（快速统计状态码分布）、ELK/Loki（集中式日志平台）。
- **按状态码定位问题**：`awk '$9 ~ /^5/ {print}' access.log` 筛 5xx 错误；`awk '$9 == 499' ` 看 499（客户端主动断开）。

## 五、`error.log`：Nginx 自身的错误

error.log 记录 Nginx 进程与上游的问题，级别从详到简：

| 级别 | 用途 |
| --- | --- |
| `debug` | 极详，排错时临时开（生产别开，日志爆炸） |
| `info`/`notice` | 一般信息，启动/重载记录 |
| `warn` | 潜在问题（如配置项被忽略） |
| `error` | 错误（上游连不上、权限拒绝），**生产默认** |
| `crit` | 严重错误（如内存不足） |

```nginx
error_log /var/log/nginx/error.log warn;       # 生产用 warn 或 error
```

- **诊断 502 Bad Gateway**：error.log 通常显示「connect() failed (111: Connection refused) while connecting to upstream」——后端没起来或端口错。
- **诊断 504 Gateway Timeout**：error.log 显示「upstream timed out」——后端处理太慢，调大 `proxy_read_timeout` 或优化后端。
- **权限错误**：「Permission denied」通常是 Nginx 用户（`www-data`/`nginx`）没权限读静态文件或私钥。

## 六、日志轮转：别让单文件无限增长

access.log 高流量站点一天几个 GB，必须轮转切割。用 `logrotate`：

```
/var/log/nginx/*.log {
    daily              # 每天切
    rotate 30          # 保留 30 天
    compress           # gzip 压缩旧文件
    delaycompress      # 延迟一天压缩（避免 Nginx 还在写）
    missingok
    notifempty
    postrotate
        kill -USR1 $(cat /var/run/nginx.pid)   # USR1 让 master 重开日志文件
    endscript
}
```

- **`kill -USR1`**：Nginx master 收到 USR1 信号会重新打开日志文件（不是重启进程），旧 fd 关闭、新 fd 打开——配合 logrotate 改名，无缝切换不丢日志。
- **替代方案**：用 `syslog` 把日志直接发给集中式日志服务（ELK/Loki），本地不落地。

## 下一步

SSL 与日志讲完后，Nginx 的核心已覆盖。回到 [参考](../reference) 复习指令速查与易错点，或前往 [Caddy](../../caddy/) 叶对比自动 HTTPS 的极简替代方案。
