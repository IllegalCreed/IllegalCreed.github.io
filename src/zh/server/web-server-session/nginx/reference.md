---
layout: doc
outline: [2, 3]
---

# 参考：Nginx 指令速查、location 优先级与易错点

> 基于 Nginx 1.26 · 核于 2026-08

## 速查

- **Nginx 定位**：开源 Web 服务器 + 反向代理 + 负载均衡器，事件驱动扛高并发，本站运行其上。
- **三级配置**：`http {}`（全局）→ `server {}`（虚拟主机，host:port）→ `location {}`（URL 路径）。
- **`location` 优先级**：精确 `=` > 前缀 `^~` > 正则 `~`/`~*`（按出现顺序）> 普通前缀（最长匹配）。
- **反向代理三件套**：`proxy_pass` + 透传 `Host`/`X-Real-IP`/`X-Forwarded-For`/`X-Forwarded-Proto` 头。
- **负载均衡四策略**：轮询（默认）、`weight`（加权）、`ip_hash`（会话粘性）、`least_conn`（最少连接）。
- **SSL 终止**：`listen 443 ssl` + 证书路径，后端走明文 HTTP；`http2 on` 开 HTTP/2。
- **运维三命令**：`nginx -t`（测配置）、`nginx -s reload`（平滑重载）、`kill -USR1`（重开日志）。
- **双日志**：`access.log`（请求级，含耗时）+ `error.log`（Nginx 自身错误，诊断 502/504）。

## 一、核心指令速查

| 指令 | 作用 | 常用值 |
| --- | --- | --- |
| `listen` | 监听端口 | `80`、`443 ssl` |
| `server_name` | 虚拟主机域名 | `example.com *.example.com` |
| `root` | 静态文件根目录 | `/var/www/html` |
| `index` | 默认首页 | `index.html index.htm` |
| `try_files` | 按顺序尝试文件 | `$uri $uri/ =404`（SPA 用 `/index.html`） |
| `proxy_pass` | 反向代理目标 | `http://backend`（upstream 名）或 `http://127.0.0.1:3000` |
| `proxy_set_header` | 透传请求头 | `Host $host`、`X-Real-IP $remote_addr` |
| `upstream` | 定义后端组 | `server ip:port weight=N` |
| `return` | 直接返回状态码 | `301 https://$host$request_uri`（跳 HTTPS） |
| `rewrite` | 重写 URL | `^/old/(.*)$ /new/$1 permanent` |
| `error_page` | 自定义错误页 | `404 /404.html`、`502 503 /maintenance.html` |

## 二、`location` 匹配优先级详解

| 修饰符 | 示例 | 含义 | 优先级 |
| --- | --- | --- | --- |
| `=` | `location = /favicon.ico` | 精确匹配，命中即停 | 1（最高） |
| `^~` | `location ^~ /static/` | 前缀匹配，命中后不查正则 | 2 |
| `~` | `location ~ \.php$` | 正则（区分大小写） | 3（按出现顺序） |
| `~*` | `location ~* \.(jpg\|png)$` | 正则（不区分大小写） | 3 |
| （无） | `location /api/` | 普通前缀（最长匹配优先） | 4（最低） |

**典型陷阱**：`location /static/`（无修饰符）与 `location ~* \.jpg$`（正则）同时存在，请求 `/static/a.jpg` 会被正则抢走（正则优先级高）。用 `location ^~ /static/` 保护静态目录。

## 三、负载均衡策略对比

| 策略 | 配置 | 流量分布 | 适用场景 |
| --- | --- | --- | --- |
| **轮询**（默认） | 无需声明 | 1:1:1 均匀 | 后端同质 |
| **加权轮询** | `weight=N` | 按 weight 比例 | 机器性能有差异 |
| **`ip_hash`** | `ip_hash;` | 同 IP 固定打同机器 | session 本地存储（粘性） |
| **`least_conn`** | `least_conn;` | 给当前连接最少的机器 | 请求耗时差异大 |

**健康检查**：`max_fails=3 fail_timeout=30s`（失败 3 次剔除 30s）；`backup`（备份机）；`down`（永久剔除）。

## 四、SSL/TLS 安全配置速查

| 配置项 | 推荐值 | 说明 |
| --- | --- | --- |
| `ssl_protocols` | `TLSv1.2 TLSv1.3` | 禁用 TLSv1.0/1.1（已不安全） |
| `ssl_ciphers` | ECDHE 系列 GCM 套件 | 强密码套件，禁用 RC4/3DES |
| `ssl_prefer_server_ciphers` | `off`（TLS 1.3） | 让客户端选 |
| `ssl_session_cache` | `shared:SSL:10m` | 会话缓存，重连省握手 |
| `ssl_session_tickets` | `on` | ticket 会话恢复 |
| `ssl_stapling` | `on` | OCSP Stapling，加速证书验证 |
| HSTS 头 | `max-age=31536000` | 强制浏览器用 HTTPS |

## 五、常用运维命令

| 命令 | 作用 |
| --- | --- |
| `nginx -t` | 测试配置语法（不真重载） |
| `nginx -s reload` | 平滑重载（旧 worker 处理完连接后退出） |
| `nginx -s stop` | 快速停止 |
| `nginx -s quit` | 优雅停止（处理完现有连接） |
| `nginx -T` | 打印完整配置（含 include 的文件） |
| `kill -USR1 $(cat nginx.pid)` | 重开日志文件（配合 logrotate） |
| `kill -HUP $(cat nginx.pid)` | 等同 reload |

## 六、常用日志变量

| 变量 | 含义 |
| --- | --- |
| `$remote_addr` | 客户端 IP（经代理后是上一跳） |
| `$http_x_forwarded_for` | XFF 头（真实客户端 IP 链路） |
| `$time_local` | 本地时间 |
| `$request` | 请求行（方法 URL 协议） |
| `$status` | 响应状态码 |
| `$body_bytes_sent` | 响应体大小（不含头） |
| `$request_time` | Nginx 处理总耗时 |
| `$upstream_response_time` | 后端处理耗时 |
| `$http_referer`/`$http_user_agent` | Referer/UA 头 |

## 七、易错点清单

- **「`location` 按书写顺序匹配」**：错。优先级是 精确 `=` > `^~` > 正则（顺序）> 普通前缀（最长）。普通前缀不按顺序，按长度。
- **「`proxy_pass http://bak/api;` 和不带路径一样」**：错。带路径会**替换** location 匹配部分（`/api/users` → `/api/users` 取决于 location 是 `= `还是前缀），易导致后端路由 404。要么不带路径，要么明确知道替换语义。
- **「后端能拿到客户端真实 IP」**：错。默认后端看到的是 Nginx 的 IP。必须透传 `X-Real-IP`/`X-Forwarded-For`，且后端配 `trust proxy` 才解析。
- **「reload 会断开现有连接」**：错。reload 是优雅切换——旧 worker 处理完现有连接后退出，新 worker 用新配置接新连接，零停机。
- **「私钥权限无所谓」**：错。私钥必须 `chmod 600`，只让 Nginx master 读。泄露 = HTTPS 形同虚设，可被中间人解密。
- **「`fullchain.pem` 和 `cert.pem` 等价」**：错。必须用 fullchain（含中间证书链），否则 Android/旧客户端报「证书不可信」。
- **「WebSocket 直接 `proxy_pass` 就行」**：错。必须加 `proxy_http_version 1.1` + 透传 `Upgrade`/`Connection` 头，否则握手失败报 400。
- **「access.log 和 error.log 记一样的」**：错。access.log 记每个请求（含成功），error.log 记 Nginx 自身错误（配置错、上游连不上）。诊断 502 看 error.log。
- **「`nginx -s reload` 前不用 `-t`」**：危险。配置语法错会让 reload 失败（旧配置继续跑，但新配置没生效），更糟的是某些语法错可能影响后续操作。永远先 `-t` 再 reload。
- **「TLSv1.0/1.1 还能用」**：错。已不安全（POODLE/BEAST 攻击），现代浏览器默认禁用，配置里必须 `ssl_protocols TLSv1.2 TLSv1.3`。

## 权威链接

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Nginx 官方 beginner's guide](https://nginx.org/en/docs/beginners_guide.html)
- [Nginx HTTP request processing](https://nginx.org/en/docs/http/request_processing.html)
- [Nginx core directives](https://nginx.org/en/docs/dirindex.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt - certbot 文档](https://certbot.eff.org/)
- [Nginx - Wikipedia](https://en.wikipedia.org/wiki/Nginx)
- 本站幻灯片：<a href="/SlideStack/nginx-slide/" target="_blank">Nginx</a>
