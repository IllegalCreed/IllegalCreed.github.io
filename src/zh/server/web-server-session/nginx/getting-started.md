---
layout: doc
outline: [2, 3]
---

# 入门：Nginx 定位、事件驱动与反向代理配置

> 基于 Nginx 1.26 · 核于 2026-08

## 速查

- **定位**：Nginx 是**开源 Web 服务器 + 反向代理 + 负载均衡器**——一台机器上同时干静态托管、HTTP 反向代理、TLS 终止、缓存压缩。本站实际运行在 Nginx 上。
- **事件驱动**：Nginx 用 **epoll/kqueue**（Linux/macOS）实现**单 worker 进程处理数万并发连接**——一个事件循环不断「等 IO 就绪 → 分发处理」，不阻塞、不 fork。对比 Apache prefork 的「每连接一个进程/线程」，内存占用低 5-10 倍，是高并发基石。
- **master-worker 架构**：`master` 进程管理（读配置、绑端口、fork worker）；`worker` 进程（通常 = CPU 核数）实际处理请求。master 挂了不影响 worker，worker 挂了 master 重启它。
- **三级配置嵌套**：`http {}`（全局 HTTP 设置）→ `server {}`（一个虚拟主机，绑 host/port）→ `location {}`（URL 路径匹配规则）。请求按 `host:port` 选 server，按 URL 路径选 location。
- **`location` 匹配优先级**：精确匹配 `=` > 前缀 `^~` > 正则 `~`/`~*`（按出现顺序，先匹配先用）> 最长前缀匹配。这是 Nginx 最易错的点。
- **反向代理**：`proxy_pass http://backend;` 把请求转发给后端服务器，后端响应再回给客户端。Nginx 是「中间人」——客户端只看到 Nginx，后端 IP 被隐藏。
- **负载均衡**：用 `upstream` 定义一组后端服务器，`proxy_pass http://后端组名` 即可分发。默认**轮询**（round-robin）；`weight=` 加权；`ip_hash` 会话粘性；`least_conn` 最少连接。
- **静态托管**：`root /var/www;` + `try_files $uri $uri/ =404;` 直接吐文件，无应用服务器参与，是最高吞吐的用法。
- **SSL 终止**：在 Nginx 配 `listen 443 ssl;` + 证书路径，HTTPS 在 Nginx 解密，后端走明文 HTTP——证书管理集中在入口，后端免 TLS 开销。
- **`nginx -s reload`**：重新读配置 + 优雅切换——旧 worker 处理完现有连接后退出，新 worker 用新配置接新连接，**零停机**改配置。
- **双日志**：`access.log`（每个请求一行，含 IP/状态码/耗时）+ `error.log`（Nginx 自身错误与告警）。运维诊断从这两份文件入手。

## 一、Nginx 是什么：不止是 Web 服务器

Nginx 最初（2002，Igor Sysoev）为解决 **C10K 问题**（一台机器同时处理一万个连接）而诞生，今天已成为 Web 流量入口的事实标准。它的能力远超「Web 服务器」一词：

1. **静态资源 Web 服务器**：直接吐 HTML/CSS/JS/图片文件（`root` 指令），吞吐量极高（单机数万 QPS），无需应用服务器。
2. **反向代理（Reverse Proxy）**：把客户端请求转发给后端应用服务器（Node.js/Java/Python），再把后端响应回传——客户端只看到 Nginx，后端 IP 被隐藏，安全且可水平扩展。
3. **负载均衡器（Load Balancer）**：`upstream` 定义一组后端，把流量分发到多台机器，提高吞吐与可用性（一台挂了流量自动转其他台）。
4. **SSL/TLS 终止点**：HTTPS 加解密在 Nginx 完成，后端走明文 HTTP——证书统一管理，后端免 TLS 握手开销。
5. **缓存与压缩**：可缓存后端响应（`proxy_cache`）、自动 gzip 压缩文本（`gzip on`）、限流（`limit_req`）。

一句话：**Nginx 是 Web 流量的「总入口」——所有进来的 HTTP/HTTPS 流量先到 Nginx，由它决定怎么分流、加密、缓存、转发。**

## 二、事件驱动：为什么 Nginx 能扛高并发

传统 Web 服务器（Apache prefork 模式）用「**每连接一个进程/线程**」模型：来一个连接 fork 一个 worker，连接关闭后回收。问题是每个进程占内存（几 MB），一万个连接就是几十 GB 内存，进程切换开销巨大——这就是 C10K 难的根源。

Nginx 改用「**事件驱动 + 非阻塞 IO**」：

```
传统 fork 模型（Apache prefork）           Nginx 事件驱动模型
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  连接1 → worker进程1（阻塞读）│         │  worker进程（1 个，事件循环） │
│  连接2 → worker进程2（阻塞读）│         │   ├─ epoll_wait 等待 IO 就绪 │
│  连接3 → worker进程3（阻塞读）│         │   ├─ 连接1 可读 → 处理       │
│  ...                          │         │   ├─ 连接2 可写 → 回写       │
│  连接10000 → 10000 个进程     │         │   └─ 连接3 就绪 → 处理       │
│  内存：10000 × 几MB = 爆炸    │         │  内存：几万连接共享一个进程  │
└─────────────────────────────┘         └─────────────────────────────┘
```

- **epoll（Linux）/ kqueue（macOS/BSD）**：内核提供的「IO 多路复用」机制——一个系统调用同时监控数万个 fd（文件描述符），哪个 fd 可读/可写了就通知用户态。
- **非阻塞 IO**：worker 调用 `read()` 不阻塞等待数据，而是立即返回（数据没来就稍后再试），事件循环继续处理其他连接。
- **worker 数 = CPU 核数**：通常 `worker_processes auto;`，每个 worker 独立跑事件循环，多核并行。
- **master-worker 架构**：`master` 进程负责管理（读配置、绑 80/443 端口、fork worker、监控重启）；`worker` 进程实际处理请求。master 挂了不影响已运行的 worker，worker 挂了 master 立即重启它——高可用。

## 三、三级配置：http → server → location

Nginx 的核心是**声明式配置文件**（`nginx.conf`），用三级嵌套组织规则：

```nginx
http {                                    # 全局 HTTP 设置
    # 压缩、日志格式、mime 类型等全局项

    server {                              # 一个虚拟主机（按 host:port 区分）
        listen 80;
        server_name example.com www.example.com;

        location / {                      # URL 路径匹配规则
            root /var/www/html;
            try_files $uri $uri/ =404;
        }

        location /api/ {
            proxy_pass http://127.0.0.1:3000;   # 反向代理到后端
        }
    }

    server {                              # 另一个虚拟主机
        listen 443 ssl;
        server_name api.example.com;
        ssl_certificate     /etc/ssl/api.crt;
        ssl_certificate_key /etc/ssl/api.key;
        location / {
            proxy_pass http://backend;
        }
    }
}
```

- **`http {}`**：HTTP 协议全局配置（gzip、日志、mime、超时），整个文件通常只有一个。
- **`server {}`**：一个虚拟主机。用 `listen`（端口）+ `server_name`（域名）区分。同一个 Nginx 可托管几十个不同域名的站点。
- **`location {}`**：URL 路径匹配规则。请求 `http://example.com/api/users` 进 `server_name example.com` 的 server，再按路径 `/api/` 匹配到对应 location。

请求路由流程：客户端请求 `https://api.example.com/api/users` → 按 `443` + `api.example.com` 选 server → 按 `/api/` 选 location → 执行 location 内的指令（代理/吐文件/重定向）。

## 四、`location` 匹配优先级：最易错的点

`location` 用不同的前缀符号表达匹配方式，**优先级不是书写顺序**而是规则：

| 修饰符 | 含义 | 优先级 |
| --- | --- | --- |
| `location = /exact { }` | **精确匹配**，URL 必须完全等于 `/exact` | 1（最高，命中即停） |
| `location ^~ /static/ { }` | **前缀匹配**，匹配后不再查正则 | 2 |
| `location ~ \.php$ { }` | **正则匹配**（区分大小写） | 3（按出现顺序，先命中先用） |
| `location ~* \.(jpg|png)$ { }` | **正则匹配**（不区分大小写） | 3 |
| `location /api/ { }` | **普通前缀匹配**（最长匹配优先） | 4（最低，正则都没命中才用） |

典型陷阱：同时有 `location /` 和 `location ~ \.php$`，请求 `/test.php` 会走正则那个（优先级高），而 `/index.html` 走 `/`。要保护 `/static/` 下不被正则规则覆盖，用 `^~`。精确匹配 `=` 常用于高频路径（如 `location = /favicon.ico`）直接返回，跳过后续匹配。

## 五、反向代理：`proxy_pass` 把请求转发给后端

反向代理是 Nginx 最常见的用途。客户端以为自己在和 Nginx 对话，Nginx 实际把请求转发给后端应用服务器：

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;     # 转发给本机 3000 端口的 Node.js
        proxy_set_header Host $host;          # 透传原始 Host 头
        proxy_set_header X-Real-IP $remote_addr;   # 透传客户端真实 IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # 透传原始协议 http/https
    }
}
```

- **为什么要透传头**：后端拿到的请求来源 IP 是 Nginx（`127.0.0.1`），不是真实客户端。通过 `X-Real-IP`/`X-Forwarded-For` 头把真实 IP 透传，后端日志/风控才能用。
- **`X-Forwarded-Proto`**：告诉后端「客户端用的是 https」，后端据此生成正确的 https 跳转链接，避免 http↔https 死循环。
- **代理 WebSocket**：需额外加 `proxy_http_version 1.1;` + `Upgrade`/`Connection` 头透传，否则 WS 握手失败。

## 六、负载均衡：`upstream` 把流量分发到多台后端

单台后端扛不住时，用 `upstream` 定义一组后端，Nginx 自动分发流量——这就是负载均衡：

```nginx
upstream backend {                   # 定义后端组
    server 192.168.1.10:3000;        # 默认轮询
    server 192.168.1.11:3000;
    server 192.168.1.12:3000 weight=3;   # 加权，这台拿 3 倍流量
}

server {
    location / {
        proxy_pass http://backend;   # 引用后端组名
    }
}
```

负载均衡策略（在 `upstream` 里指定）：

- **轮询（默认）**：请求 1→A、2→B、3→C、4→A...均匀。简单但不管机器性能差异。
- **`weight=N`**：加权轮询，性能强的机器给大权重，流量按比例分。
- **`ip_hash`**：同一客户端 IP 总是打到同一台后端——实现**会话粘性**（session sticky），避免 session 不同步问题。代价是 IP 变了就失效。
- **`least_conn`**：把请求发给当前连接数最少的后端——比轮询更智能（避免把请求堆给慢机器）。
- **健康检查**：Nginx 默认检测后端连接失败会临时剔除（`max_fails`/`fail_timeout`），恢复后自动加回；主动健康检查需商业版 NGINX Plus 或第三方模块。

## 七、运维：重载、日志与排错

- **`nginx -s reload`**：重新读配置 + 优雅切换。master 启动新 worker 用新配置，旧 worker 处理完现有连接后退出——**零停机改配置**，是日常运维最常用命令。
- **`nginx -t`**：测试配置语法是否正确（不真重载），改完配置先 `-t` 再 reload，避免语法错把 Nginx 搞挂。
- **`access.log`**：每个请求一行，默认格式含 IP、时间、请求行、状态码、响应大小、UA、耗时。自定义 `log_format` 可加 `$request_time`（总耗时）、`$upstream_response_time`（后端耗时）用于性能分析。
- **`error.log`**：Nginx 自身错误（配置错、权限错、上游连不上）。级别从低到高 `debug/info/notice/warn/error/crit`，生产用 `warn` 或 `error`。诊断「502 Bad Gateway」第一步看 error.log——通常是后端没起来或连不上。

## 下一步

入门讲完 Nginx 的定位、事件驱动、三级配置与反向代理基础后，下一步深入两个核心专题——[反向代理与负载均衡](./guide-line/reverse-proxy)（`location` 匹配细节、`upstream` 策略对比）与 [SSL 终止与日志](./guide-line/ssl-and-logging)（HTTPS 证书配置、access/error 日志分析）。
