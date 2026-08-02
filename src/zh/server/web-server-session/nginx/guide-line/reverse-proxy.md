---
layout: doc
outline: [2, 3]
---

# 反向代理与负载均衡：location 匹配与 upstream 策略

> 基于 Nginx 1.26 · 核于 2026-08

## 速查

- **`location` 匹配四类**：精确 `=`（最高，命中即停）、前缀 `^~`（次高，命中后不查正则）、正则 `~`/`~*`（按文件出现顺序，先命中先用）、普通前缀（最低，最长匹配优先）。理解优先级才能写出可预测的路由。
- **`proxy_pass` 转发**：把请求转发给后端，可填「IP:端口」「`upstream` 组名」「Unix socket」。带路径时（`proxy_pass http://bak/api;`）会**替换** location 匹配部分，易错。
- **头透传三件套**：`Host`（原始域名）、`X-Real-IP`/`X-Forwarded-For`（客户端真实 IP）、`X-Forwarded-Proto`（原始 http/https）。不透传则后端只看到 Nginx 的 IP，风控/日志/跳转全错。
- **`upstream` 负载均衡四策略**：轮询（默认，均匀）、`weight`（加权，性能差异）、`ip_hash`（会话粘性，同 IP 打同机器）、`least_conn`（最少连接，更智能）。选型看是否要粘性、机器是否同质。
- **健康检查**：被动健康检查（默认）——连接失败累计 `max_fails`（默认 1）次后，`fail_timeout`（默认 10s）内剔除该后端；主动健康检查需商业版 Plus 或 `nginx_upstream_check_module`。
- **`backup`/`down`**：`backup` 标记备份机（其他全挂才启用）；`down` 永久剔除（维护时用）。
- **超时控制**：`proxy_connect_timeout`（连后端）、`proxy_send_timeout`（发请求）、`proxy_read_timeout`（读响应）——避免慢后端拖垮整个网关。
- **WebSocket 代理**：需 `proxy_http_version 1.1` + 透传 `Upgrade`/`Connection` 头，否则 WS 握手被 HTTP/1.0 代理拦下失败。

## 一、`location` 匹配规则：优先级不是书写顺序

Nginx 收到请求后，用 URL 路径去匹配当前 server 块里的所有 location。匹配顺序**不是书写顺序**，而是按修饰符优先级：

```nginx
server {
    location = /favicon.ico { return 204; }        # ① 精确：只有完全等于才命中
    location ^~ /static/ { root /var/www; }         # ② 前缀：匹配后不再查正则
    location ~* \.(jpg|png|gif)$ {                  # ③ 正则（不区分大小写）
        root /var/www/images;
    }
    location ~ \.php$ {                             # ③ 正则（区分大小写）
        proxy_pass http://php-fpm;
    }
    location /api/ { proxy_pass http://backend; }   # ④ 普通前缀（最低优先级）
    location / {                                    # ④ 兜底
        proxy_pass http://frontend;
    }
}
```

匹配流程（对请求 `/static/logo.png`）：

1. 先查**精确 `=`**：`/static/logo.png` 不等于 `/favicon.ico`，跳过。
2. 再查**前缀 `^~`**：`/static/logo.png` 以 `/static/` 开头，命中 → **立即用这个，不再查正则**（这是 `^~` 的关键作用：保护某个前缀不被后面的正则抢走）。
3. 如果没 `^~` 命中，再查**正则 `~`/`~*`**：按配置文件里出现的**先后顺序**，第一个匹配的就用。
4. 正则全没命中，最后用**最长普通前缀匹配**：`/static/logo.png` 同时匹配 `/` 和 `/static/`（如果后者没 `^~`），用更长的 `/static/`。

- **精确 `=` 的妙用**：`location = /favicon.ico` 直接返回 204，跳过所有后续匹配——高频小请求用它省 CPU。
- **`^~` 防正则劫持**：静态资源目录加 `^~`，防止某个 `~ \.(.*)$` 正则意外把静态请求转给后端。
- **正则顺序敏感**：两个正则都能匹配时，写在前面的赢。所以把更具体的正则放前面。

## 二、`proxy_pass` 转发：路径替换的坑

`proxy_pass` 把请求转发给后端，但**带不带路径，行为大不同**：

```nginx
# 情况 A：proxy_pass 不带路径（只有 host:port）——完整 URL 原样转发
location /api/ {
    proxy_pass http://backend;            # 请求 /api/users → 后端收到 /api/users
}

# 情况 B：proxy_pass 带路径——location 匹配部分被替换
location /api/ {
    proxy_pass http://backend/v2/;        # 请求 /api/users → 后端收到 /v2/users
}

# 情况 C：带正则的 location，proxy_pass 不能带路径（会报错）
location ~ ^/api/(.*)$ {
    proxy_pass http://backend/$1;         # 必须用捕获变量重构路径
}
```

- **最常见的坑**：本想 `/api/` 代理到后端的 `/`，写成 `proxy_pass http://backend/;`（带斜杠），结果 `/api/users` 被替换成 `/users`——后端路由对不上。要么不带路径（情况 A，保留 `/api/`），要么明确知道在替换（情况 B）。
- **正则 location 强制用变量**：用 `~`/`~*` 时，`proxy_pass` 不能带字面路径，必须用 `$1`/`$2` 等捕获组重建 URL。

## 三、头透传：让后端知道真相

默认 `proxy_pass` 只透传部分头，后端拿到的请求来源是 Nginx（不是真实客户端），会导致风控、日志、跳转全错。生产配置必加「头透传三件套」：

```nginx
location / {
    proxy_pass http://backend;
    proxy_set_header Host              $host;                    # 原始域名（非 Nginx 的）
    proxy_set_header X-Real-IP         $remote_addr;             # 客户端真实 IP
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;  # 链路 IP 累加
    proxy_set_header X-Forwarded-Proto $scheme;                  # 原始协议 http/https
}
```

- **`Host`**：后端虚拟主机选择、URL 生成依赖它。不透传则后端看到 `127.0.0.1`，生成的链接全错。
- **`X-Forwarded-For`**：经过多级代理时累加 IP 链路（`客户端IP, 代理1IP, 代理2IP`），后端取第一个就是真实客户端。`$proxy_add_x_forwarded_for` 自动追加。
- **`X-Forwarded-Proto`**：告诉后端「客户端用的是 https」，后端据此生成 `https://` 链接与做 http→https 跳转决策。漏了这个会死循环。
- **框架侧**：Express 用 `app.set('trust proxy', 1)`、Koa 用 `app.proxy = true`、Django 配 `SECURE_PROXY_SSL_HEADER` 才会读这些头。

## 四、`upstream` 负载均衡：四策略对比

`upstream` 定义一组后端，`proxy_pass http://组名` 即可分发流量。策略选择决定流量分布：

```nginx
upstream backend {
    # 策略一：轮询（默认，均匀分发）
    # server 10.0.0.1:3000;
    # server 10.0.0.2:3000;

    # 策略二：加权轮询（性能强的机器给大权重）
    server 10.0.0.1:3000 weight=3;     # 拿 3/4 流量
    server 10.0.0.2:3000 weight=1;     # 拿 1/4 流量

    # 策略三：ip_hash（同 IP 粘到同机器，需注释掉 weight）
    # ip_hash;

    # 策略四：least_conn（最少连接优先）
    # least_conn;

    # 健康检查参数（被动）
    server 10.0.0.3:3000 max_fails=3 fail_timeout=30s;   # 失败 3 次后剔除 30s
    server 10.0.0.4:3000 backup;                          # 备份机，其他全挂才启用
    server 10.0.0.5:3000 down;                            # 永久剔除（维护时）
}
```

| 策略 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **轮询**（默认） | 后端机器同质（同配置同性能） | 简单、无需配置 | 不管连接数，慢机器会堆积 |
| **`weight`** | 机器性能有差异（8 核 vs 16 核） | 按性能分流量 | 静态权重，无法应对突发 |
| **`ip_hash`** | session 存在后端本地（不同步） | 会话粘性，避免 session 丢失 | IP 变（移动网络/CGNAT）就失效；可能不均 |
| **`least_conn`** | 请求耗时差异大（有的快有的慢） | 动态均衡，避免慢机器堆积 | 需维护连接计数，开销略大 |

- **session 粘性的替代方案**：用 Redis/数据库集中存 session（无状态化）比 `ip_hash` 更稳健——机器挂了 session 不丢。
- **健康检查局限**：开源版只有被动检查（请求失败才剔除），主动探测（周期性 health check）需 NGINX Plus 或 `nginx_upstream_check_module`。

## 五、超时与慢后端防护

慢后端会拖垮整个网关（worker 等一个后端响应时无法服务其他请求），必须配超时：

```nginx
location / {
    proxy_connect_timeout 5s;     # 连后端的最长时间（TCP 握手）
    proxy_send_timeout    60s;    # 把请求发给后端的最长时间（两次写之间）
    proxy_read_timeout    60s;    # 读后端响应的最长时间（两次读之间）
    proxy_next_upstream   error timeout http_502 http_503;  # 这些错误自动重试下一台
}
```

- **`proxy_connect_timeout`**：连不上立刻失败（后端宕机），设短（5s）快速故障转移。
- **`proxy_read_timeout`**：后端处理慢（如长查询），超过就放弃。设合理值（60s）避免无限等。
- **`proxy_next_upstream`**：某台后端返回 502/503/超时，自动把请求转给下一台——用户无感故障转移。

## 六、WebSocket 代理：需要 HTTP/1.1 与 Upgrade 头

WebSocket 是升级后的 HTTP 连接，代理时必须用 HTTP/1.1 并透传 Upgrade 头，否则握手失败：

```nginx
location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;                          # 默认 1.0，必须升 1.1
    proxy_set_header Upgrade    $http_upgrade;        # 透传 Upgrade: websocket
    proxy_set_header Connection "upgrade";            # 固定 upgrade，触发升级
    proxy_read_timeout 3600s;                         # WS 长连接，超时调大
}
```

漏了这三项，浏览器报「Error during WebSocket handshake: Unexpected response code: 400」。

## 下一步

反向代理与负载均衡讲完后，下一站是 [SSL 终止与日志](./ssl-and-logging)——在 Nginx 层卸载 HTTPS、证书配置、access/error 日志格式与性能分析。
