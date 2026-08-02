---
layout: doc
outline: [2, 3]
---

# 参考：Caddyfile 指令速查、自动 HTTPS 行为与 Nginx 对照

> 基于 Caddy 2.8 · 核于 2026-08

## 速查

- **Caddy 定位**：Go 写的现代 Web 服务器 + 反向代理，零配置自动 HTTPS 是核心卖点。
- **Caddyfile 结构**：全局选项块（可选）+ 站点块（地址 + 花括号内指令）。
- **自动 HTTPS**：合法域名即自动申请 Let's Encrypt 证书 + 配 443 + 80 跳 443 + HTTP/2/3 + 到期前自动续期。
- **核心指令**：`reverse_proxy`（代理）、`file_server`（静态托管）、`encode`（压缩）、`tls`（证书）、`log`（日志）、`header`（响应头）、`try_files`（SPA 回退）。
- **与 Nginx 对照**：`reverse_proxy` ≈ `proxy_pass`、`file_server` ≈ `root`+`try_files`、Caddy 自动透传头（Nginx 需手写三件套）。
- **选型**：省心选 Caddy，掌控选 Nginx，容器动态选 Traefik，传统 LAMP 选 Apache。

## 一、Caddyfile 指令速查

| 指令 | 作用 | 示例 |
| --- | --- | --- |
| `reverse_proxy` | 反向代理 | `reverse_proxy localhost:3000` |
| `file_server` | 静态托管 | `file_server` / `file_server browse` |
| `root` | 静态根目录 | `root * /var/www` |
| `encode` | 响应压缩 | `encode gzip zstd` |
| `tls` | 证书配置 | `tls cert.pem key.pem` / `tls internal` |
| `log` | 访问日志 | `log { output file /var/log/caddy.log }` |
| `header` | 响应头 | `header Cache-Control max-age=3600` |
| `try_files` | 文件回退 | `try_files {path} /index.html` |
| `redir` | 重定向 | `redir https://{host}{uri} permanent` |
| `respond` | 直接响应 | `respond "ok" 200` |
| `rewrite` | URL 重写 | `rewrite * /api{path}` |
| `lb_policy` | 负载均衡策略 | `lb_policy round_robin` |

## 二、自动 HTTPS 行为清单

| 场景 | Caddy 行为 |
| --- | --- |
| 合法域名（`example.com`） | 自动申请 Let's Encrypt 证书 + 配 HTTPS |
| `http://` 前缀 | 强制明文，不申请证书 |
| `localhost` / 内网 IP | 用自签证书（内部 CA），`caddy trust` 信任 |
| 通配符（`*.x.com`） | 强制 DNS-01 challenge，需 DNS 插件 |
| `tls off` / `auto_https off` | 禁用自动 HTTPS |
| `tls cert.pem key.pem` | 用自定义证书，跳过自动申请 |
| 证书到期前 1/3 有效期 | 自动续期 + 热重载 |

## 三、Caddy 与 Nginx 指令对照

| 功能 | Caddy | Nginx |
| --- | --- | --- |
| 反向代理 | `reverse_proxy localhost:3000` | `proxy_pass http://localhost:3000;` |
| 透传头 | 自动透传 | 手写 `proxy_set_header` 三件套 |
| 静态托管 | `file_server` | `root` + `try_files` |
| HTTPS 证书 | 自动 | 手动 certbot + `ssl_certificate` |
| HTTP/2/3 | 默认开 | `http2 on`（HTTP/3 需编译） |
| 负载均衡 | `lb_policy round_robin` | `upstream` + 策略 |
| 健康检查（主动） | 开源版内置 `health_uri` | 需商业版 Plus |
| WebSocket | 自动处理 | 需配 Upgrade/Connection 头 |
| 日志格式 | 原生 JSON | 自定义 log_format |
| 日志轮转 | 内置 roll_size | 外部 logrotate + USR1 |
| 动态配置 | admin API（运行时改） | 需 reload 或第三方模块 |

## 四、站点地址形式与含义

| 地址形式 | 含义 | 是否自动 HTTPS |
| --- | --- | --- |
| `example.com` | 域名 | ✅ 自动 |
| `*.example.com` | 通配符域名 | ✅（需 DNS-01） |
| `:8080` | 仅端口 | ❌ |
| `localhost` | 本机 | 用内部 CA |
| `http://example.com` | 强制 HTTP | ❌（明文） |
| `https://example.com` | 强制 HTTPS | ✅ |

## 五、常用全局选项

| 选项 | 作用 |
| --- | --- |
| `admin off` | 关闭 admin API（生产安全） |
| `debug` | 开 debug 日志 |
| `auto_https off` | 全局禁用自动 HTTPS |
| `default_sni example.com` | 默认 SNI（无 SNI 时用） |
| `servers :443 { protocols h1 h2 h3 }` | 指定协议（HTTP/1/2/3） |

## 六、易错点清单

- **「Caddy 完全替代 Nginx」**：不完全。超高并发、企业既有 Nginx 工具链、深度定制场景，Nginx 仍更优。Caddy 强在省心与自动化。
- **「自动 HTTPS 不需要域名」**：错。自动 HTTPS 需合法域名（DNS 指向本机）。localhost/内网 IP 用内部 CA 自签。
- **「Caddyfile 指令按书写顺序执行」**：不完全对。Caddy 指令有默认执行顺序（由 directive order 决定），复杂场景需查文档。
- **「通配符域名也用 HTTP-01」**：错。通配符（`*.x.com`）强制 DNS-01 challenge，需 DNS 提供商插件。
- **「ON-Demand TLS 不用配 ask」**：危险。不配 `ask` 端点，任何人都能让你的服务器为他申请证书，Let's Encrypt 限额会被刷爆。
- **「`reverse_proxy` 需手写头透传」**：错。Caddy 默认透传 Host/X-Forwarded-For/X-Forwarded-Proto，不像 Nginx 需手写三件套。
- **「Caddy 性能与 Nginx 相同」**：不完全对。Caddy 用 Go 有 GC 开销，超高并发时 Nginx（C + epoll 无 GC）仍领先；中小项目无感。
- **「改 Caddyfile 必须重启」**：错。`caddy reload` 平滑重载，零停机；甚至可通过 admin API 运行时动态改配置。
- **「Caddy 不支持 WebSocket」**：错。Caddy 自动处理 WebSocket 升级，无需像 Nginx 那样手动配 Upgrade/Connection 头。
- **「本地开发也要手动申请证书」**：错。localhost 用内部 CA 自签，`caddy trust` 信任后浏览器无警告。

## 权威链接

- [Caddy 官方文档](https://caddyserver.com/docs/)
- [Caddyfile 教程](https://caddyserver.com/docs/caddyfile-tutorial)
- [Caddy 自动 HTTPS 文档](https://caddyserver.com/docs/automatic-https)
- [Caddy 指令参考](https://caddyserver.com/docs/caddyfile/directives)
- [Caddy vs Nginx - 官方对比](https://caddyserver.com/docs/nginx-to-caddyfile)
- [Caddy GitHub](https://github.com/caddyserver/caddy)
- 本站幻灯片：<a href="/SlideStack/caddy-slide/" target="_blank">Caddy</a>
