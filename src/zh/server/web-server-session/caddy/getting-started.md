---
layout: doc
outline: [2, 3]
---

# 入门：Caddy 零配置 HTTPS 与 Caddyfile 极简语法

> 基于 Caddy 2.8 · 核于 2026-08

## 速查

- **定位**：Caddy 是用 Go 写的现代 Web 服务器 + 反向代理，以「**零配置自动 HTTPS**」闻名——写个域名就自动申请 Let's Encrypt 证书、配 HTTPS、到期前自动续期。
- **与 Nginx 的核心差异**：Nginx 是「手写配置 + 手动 certbot」，Caddy 是「约定优于配置 + 自动 TLS」。Caddyfile 两三行替代 Nginx 二十行。
- **Caddyfile 极简**：一个站点只需「域名 + 指令」。如 `example.com { reverse_proxy localhost:3000 }` 就是一个完整的反向代理 + HTTPS 站点。
- **自动 HTTPS 全流程**：启动时检测域名 → 自动向 Let's Encrypt 申请证书 → 配 443 端口 + 证书 → 强制 HTTP→HTTPS 跳转 → 默认开 HTTP/2/HTTP/3 → 到期前 1/3 有效期自动续期。全程无需 certbot、无需 cron、无需手动 reload。
- **`reverse_proxy`**：Caddy 的反向代理指令，等价 Nginx 的 `proxy_pass`。默认透传 Host 头与 X-Forwarded-* 头，无需手写三件套。
- **`file_server`**：静态托管指令，等价 Nginx 的 `root` + `try_files`。`file_server browse` 还能开目录浏览。
- **单文件二进制**：Go 编译成单个可执行文件，无运行时依赖，跨平台。部署 = 拷一个文件 + 一个 Caddyfile。
- **热重载**：`caddy reload`（或 `caddy adapt` + API 调用）平滑生效配置，零停机。Caddy 还提供 JSON API 运行时动态改配置（Nginx 原生不行）。
- **现代默认**：HTTP/2、HTTP/3（QUIC）、TLS 1.3、HTTP→HTTPS 跳转、合理的 TLS 密码套件——全部开箱即用，不需要像 Nginx 那样手写一堆 ssl_* 指令。
- **适用边界**：中小项目、个人站点、快速原型、想省心 HTTPS 的场景首选 Caddy；超高并发、深度定制、企业既有 Nginx 基础设施时仍选 Nginx。

## 一、Caddy 是什么：把 HTTPS 变成默认行为

Caddy（2015，Matt Holt 出品）的核心创新是把「HTTPS 配置」从一项繁琐的手工活变成默认行为。在 Nginx 世界里，开 HTTPS 需要：①手动用 certbot 申请证书；②写一堆 `ssl_certificate`/`ssl_protocols`/`ssl_ciphers`/HSTS 配置；③配 cron 定时续期；④手动 reload。每一步都可能忘、可能错。Caddy 的哲学是：**这些都是 2020 年代 Web 服务器的默认义务，不该让用户操心**。

```caddyfile
# Caddyfile —— 整个文件就这两行，一个生产级 HTTPS 反向代理站点
example.com {
    reverse_proxy localhost:3000
}
```

启动 `caddy run` 后，Caddy 自动：①向 Let's Encrypt 申请 `example.com` 的证书；②监听 443 配 HTTPS；③把 80 的 HTTP 请求 301 跳转到 HTTPS；④开 HTTP/2 与 HTTP/3；⑤证书到期前 30 天自动续期。用户什么都不用管。

对比等价的 Nginx 配置（约 25 行 + certbot + cron + 手动 reload），Caddyfile 的极简是颠覆性的。

## 二、Caddyfile 语法：站点块与指令

Caddyfile 用「**站点块**」组织配置，每个块对应一个站点（域名/IP/端口）：

```caddyfile
# 站点块：第一行是站点地址，花括号内是指令
example.com {
    # 静态托管（默认当前目录）
    file_server

    # 反向代理
    reverse_proxy /api/* localhost:3000

    # 自定义响应头
    header {
        Cache-Control "public, max-age=3600"
        X-Frame-Options "DENY"
    }

    # 日志
    log {
        output file /var/log/caddy/access.log
    }
}

# 多站点：再写一个块
api.example.com {
    reverse_proxy localhost:8080 {
        lb_policy round_robin        # 负载均衡策略
        health_uri /health           # 主动健康检查
        health_interval 30s
    }
}
```

- **站点地址**：第一行决定这个块管什么。`example.com`（域名）、`:8080`（端口）、`localhost`（本机）、`https://example.com`（强制 HTTPS）。
- **指令顺序**：Caddyfile 的指令有默认执行顺序（由 Caddy 内部决定），不像 Nginx 那样严格按书写顺序。复杂场景需理解「directive order」。
- **指令参数**：大部分指令一行就能写完（`reverse_proxy localhost:3000`），复杂配置用花括号块（负载均衡、健康检查）。
- **无分号号**：Caddyfile 不用分号结尾，用换行分隔指令——比 Nginx 的分号语法更轻。

## 三、自动 HTTPS：从申请到续期的全自动

Caddy 的自动 HTTPS 是其杀手锏，完整流程：

```
启动 caddy run
  → 扫描 Caddyfile 里的所有域名
  → 对每个域名：
      → 验证域名是否指向本机（DNS A 记录）
      → 向 Let's Encrypt 申请证书（用 HTTP-01 或 TLS-ALPN challenge）
      → 拿到证书 → 监听 443，配 HTTPS
      → 监听 80，把 HTTP 请求 301 跳转到 HTTPS
      → 开 HTTP/2（默认）+ HTTP/3 over QUIC（默认）
  → 运行中：
      → 每个证书到期前 1/3 有效期（Let's Encrypt 90 天 = 到期前 30 天）自动续期
      → 续期成功后热重载，零停机
```

- **前提条件**：①域名 DNS A 记录指向运行 Caddy 的服务器公网 IP；②Caddy 能监听 80 和 443（需 root 或 CAP_NET_BIND_SERVICE）；③域名未被墙（Let's Encrypt 验证服务器要能访问）。
- **本地开发**：用 `localhost` 或内网 IP 时，Caddy 用自签证书（自建 CA），浏览器需信任。或用 `caddy trust` 安装本地 CA。
- **challenge 方式**：默认 HTTP-01（Let's Encrypt 访问 `http://域名/.well-known/acme-challenge/`）；80 被占时自动切 TLS-ALPN（用 443）。通配符证书需 DNS-01（配 DNS 插件）。
- **证书管理**：Caddy 把证书存在 `$CADDYPATH`（默认 `~/.local/share/caddy/`），自动管理，无需手动备份。

## 四、反向代理：`reverse_proxy` 默认透传头

Caddy 的 `reverse_proxy` 等价 Nginx 的 `proxy_pass`，但默认行为更友好——自动透传 `Host`、`X-Forwarded-For`、`X-Forwarded-Proto` 头，无需手写三件套：

```caddyfile
example.com {
    reverse_proxy localhost:3000 {
        # 负载均衡多后端
        to localhost:3000 localhost:3001 localhost:3002

        # 策略：random / round_robin / least_conn / ip_hash
        lb_policy round_robin

        # 主动健康检查（开源版就支持，对比 Nginx 需商业版）
        health_uri /healthz
        health_interval 30s
        health_timeout 5s

        # 自定义透传头（默认已透传，可追加）
        header_up X-Real-IP {remote_host}
    }
}
```

- **负载均衡**：`to` 列多个后端，`lb_policy` 选策略（`round_robin`/`random`/`least_conn`/`ip_hash`）。
- **主动健康检查**：Caddy 开源版就内置主动探测（`health_uri`），对比 Nginx 开源版只有被动检查、主动检查需商业版 Plus。
- **WebSocket**：Caddy 自动处理 WebSocket 升级，无需像 Nginx 那样手动配 `Upgrade`/`Connection` 头。
- **`header_up`/`header_down`**：发请求/收响应时改头，等价 Nginx 的 `proxy_set_header`/`proxy_hide_header`。

## 五、静态托管与file_server

`file_server` 指令做静态托管，等价 Nginx 的 `root` + `try_files`：

```caddyfile
example.com {
    root * /var/www/html        # 静态文件根目录
    file_server                 # 启用静态托管
    # file_server browse        # 开目录浏览（无 index 时列目录）
    try_files {path} /index.html   # SPA 回退到 index.html
}
```

- **`root *`**：`*` 表示匹配所有路径（Caddyfile 的路径匹配器），后面 `file_server` 用这个根。
- **`try_files`**：与 Nginx 同名指令语义一致，按顺序尝试文件，用于 SPA 路由回退。
- **`browse`**：开目录浏览，适合内部文件服务器。

## 六、何时选 Caddy、何时选 Nginx

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 个人博客/小项目，想省心 HTTPS | Caddy | 零配置自动 TLS，省去 certbot + cron |
| 快速原型/演示 | Caddy | 两行配置起服务，Caddyfile 极简 |
| 超高并发（数万 QPS）大站 | Nginx | C + epoll 性能极致，Go runtime 有 GC 开销 |
| 企业既有 Nginx 基础设施 | Nginx | 团队熟悉、运维工具链成熟，迁移成本高 |
| 需要深度定制（Lua/第三方模块） | Nginx | 生态丰富，Caddy 插件生态较小 |
| 容器化微服务 API 网关 | 两者皆可 | Caddy 单二进制易部署，Nginx 配置掌控力强 |

一句话：**省心选 Caddy，掌控选 Nginx**。

## 下一步

入门讲完 Caddy 的定位、自动 HTTPS、Caddyfile 基础后，下一步深入两个专题——[Caddyfile 与自动 HTTPS](./guide-line/caddyfile-and-https)（完整语法、证书机制细节）与 [与 Nginx 对比](./guide-line/comparison)（选型取舍与迁移要点）。
