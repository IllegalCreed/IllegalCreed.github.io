---
layout: doc
outline: [2, 3]
---

# 与 Nginx 对比：Caddy vs Nginx vs Apache vs Traefik

> 基于 Caddy 2.8 · Nginx 1.26 · 核于 2026-08

## 速查

- **Caddy vs Nginx 核心差异**：Caddy 赢在零配置自动 HTTPS、Caddyfile 极简、现代默认（HTTP/3/TLS 1.3 默认开）；Nginx 赢在生态成熟（20+ 年）、性能极致（C + epoll 无 GC）、配置掌控力（逐指令微调）。
- **配置量对比**：同一个「HTTPS 反向代理」站点，Caddy 2 行，Nginx 约 25 行 + certbot + cron。Caddy 维护成本显著更低。
- **性能**：Nginx（C，事件驱动）在高并发极致场景仍领先；Caddy（Go，GC runtime）吞吐略低但差距在缩小，对中小项目无感。
- **自动 HTTPS**：Caddy 原生零配置；Nginx 需 certbot + cron + 手动 reload；Apache 同 Nginx（需额外工具）。
- **HTTP/3**：Caddy 默认开（QUIC over UDP）；Nginx 开源版需编译 QUIC 分支，门槛高。
- **Apache 定位**：老牌 Web 服务器，模块化生态丰富（.htaccess、mod_php），但事件模型（event MPM）不如 Nginx，现在多用于传统 LAMP 栈或需要 .htaccess 的共享主机。
- **Traefik 定位**：云原生反向代理，主打容器/K8s 动态发现（自动检测新容器并路由），配置用标签/CRD 而非文件。容器化微服务首选，传统静态站点不如 Caddy/Nginx。
- **迁移成本**：Nginx → Caddy 需重写配置（指令语义不同）；Caddy → Nginx 需补证书自动化（certbot + cron）。
- **选型一句话**：省心选 Caddy，掌控选 Nginx，容器动态选 Traefik，传统 LAMP 选 Apache。

## 一、四大 Web 服务器/反向代理对比

| 维度 | Caddy | Nginx | Apache | Traefik |
| --- | --- | --- | --- | --- |
| **语言** | Go | C | C | Go |
| **配置** | Caddyfile（极简） | nginx.conf（声明式 DSL） | httpd.conf + .htaccess | YAML/标签/CRD |
| **自动 HTTPS** | ✅ 原生零配置 | ❌ 需 certbot + cron | ❌ 需额外工具 | ✅ 原生（Let's Encrypt） |
| **HTTP/3** | ✅ 默认开 | ⚠️ 需编译 QUIC 分支 | ⚠️ 实验支持 | ✅ 支持 |
| **性能** | 高（Go GC） | 极致（C，无 GC） | 中（event MPM） | 高（Go GC） |
| **生态/案例** | 成长中 | 极丰富（20+ 年） | 丰富（老牌） | 云原生生态 |
| **容器/K8s 动态发现** | 一般 | 一般 | 弱 | ✅ 核心优势 |
| **单二进制部署** | ✅ | ❌ 需依赖 | ❌ | ✅ |
| **典型场景** | 中小项目/省心 HTTPS | 大站/企业/高并发 | 传统 LAMP/共享主机 | 容器化微服务 |

## 二、同一个站点的配置对比

需求：`example.com` 做 HTTPS 反向代理到 `localhost:3000`，开 HTTP/2。

**Caddy（2 行）**：

```caddyfile
example.com {
    reverse_proxy localhost:3000
}
```

**Nginx（约 25 行 + certbot + cron）**：

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;     # HTTP 跳 HTTPS
}

server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 还需：certbot 申请证书 + cron 定时续期 + --deploy-hook reload
```

- **配置量**：Caddy 2 行 vs Nginx 25 行。Caddy 把 HTTPS 证书、跳转、HTTP/2、头透传全自动化。
- **维护量**：Nginx 还要管 certbot 续期脚本、cron 任务、证书过期告警；Caddy 全自动。
- **掌控力**：Nginx 的 25 行每一项都可微调（cipher、会话缓存、OCSP）；Caddy 隐藏了这些，想做深度定制需用 `tls` 指令覆盖默认。

## 三、为什么 Nginx 仍然主流：生态与性能

尽管 Caddy 在配置体验上碾压，Nginx 仍是 Web 服务器王者，原因：

1. **生态成熟**：20+ 年沉淀，文档/教程/StackOverflow 答案极多，遇到问题几乎都能搜到。Caddy 的社区案例还在积累。
2. **极致性能**：Nginx 用 C 写 + epoll，单 worker 处理数万连接，无 GC 暂停。Caddy 用 Go，有 GC 开销，超高并发（数万 QPS）时 Nginx 仍领先。
3. **企业基础设施**：大公司的监控、自动化、镜像、负载均衡器（如 AWS NLB 后接 Nginx）都以 Nginx 为标准。迁移到 Caddy 意味着重写运维工具链。
4. **第三方模块**：Nginx 有 lua-nginx（用 Lua 写动态逻辑）、各类安全/性能模块；Caddy 插件生态较小。
5. **配置掌控力**：Nginx 的逐指令控制（location 优先级、rewrite 规则、变量）对复杂路由场景更灵活。

## 四、Traefik 的差异化：容器动态发现

Traefik 与 Caddy/Nginx 的核心差异是「**动态配置**」：Traefik 自动检测容器/K8s 服务的启停，动态更新路由，无需 reload。Caddy/Nginx 改路由要 reload 或调 API（Caddy 有 admin API）。

```yaml
# docker-compose.yml 里用标签配置 Traefik 路由
services:
  api:
    image: my-api
    labels:
      - traefik.enable=true
      - traefik.http.routers.api.rule=Host(`api.example.com`)
      - traefik.http.services.api.loadbalancer.server.port=3000
```

- **适用场景**：容器化微服务，服务频繁启停（自动扩缩容、滚动更新），Traefik 自动跟上。
- **劣势**：传统静态站点、复杂 location 路由不如 Caddy/Nginx 直觉；YAML/标签配置对非容器场景不友好。

## 五、Apache 的现状：传统领域仍有市场

Apache（httpd）是最古老的 Web 服务器，现状：

- **`.htaccess`**：目录级配置，共享主机（一台机器多个用户）的刚需。Nginx/Caddy 无此特性（性能考虑，不在请求时读配置）。
- **mod_php**：PHP 直接嵌在 Apache 进程内，传统 LAMP 栈。现在多用 PHP-FPM + Nginx 替代。
- **事件模型**：Apache 的 event MPM 已接近 Nginx，但 prefork/worker MPM 仍落后。
- **何时还会用 Apache**：维护老 LAMP 项目、需要 .htaccess 的共享主机、特定 mod_xxx 模块依赖。新项目多选 Nginx 或 Caddy。

## 六、选型决策树

```
你的场景是什么？
├─ 个人博客/小项目，想省心 HTTPS → Caddy（零配置，2 行起服务）
├─ 快速原型/演示 → Caddy（Caddyfile 极简）
├─ 超高并发大站（数万 QPS）→ Nginx（C + epoll 性能极致）
├─ 企业既有 Nginx 基础设施 → Nginx（迁移成本高，团队熟悉）
├─ 容器化微服务/K8s → Traefik（动态发现）或 Caddy（单二进制易部署）
├─ 传统 LAMP/共享主机 → Apache（.htaccess、mod_php）
└─ 需要深度定制（Lua/复杂路由）→ Nginx（生态与掌控力）
```

## 下一步

对比讲完后，Caddy 的核心已覆盖。回到 [参考](../reference) 复习指令速查与易错点，或前往 [tmux（终端复用）](../../tmux/) 叶学习服务器终端会话管理。
