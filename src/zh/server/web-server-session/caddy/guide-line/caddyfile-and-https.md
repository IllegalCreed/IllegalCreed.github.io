---
layout: doc
outline: [2, 3]
---

# Caddyfile 与自动 HTTPS：语法详解与证书机制

> 基于 Caddy 2.8 · 核于 2026-08

## 速查

- **Caddyfile 结构**：全局选项块（可选，顶层）+ 多个站点块（每个块对应一个站点）。站点块第一行是地址，花括号内是指令。
- **站点地址形式**：域名（`example.com`，自动 HTTPS）、子域通配（`*.example.com`，需 DNS challenge）、端口（`:8080`，无 HTTPS）、带协议（`http://` 强制明文、`https://` 强制加密）、路径（`example.com/api/*`，路径级路由）。
- **自动 HTTPS 触发条件**：①地址是合法域名（非 IP/localhost）；②未显式指定 `http://`；③端口未排除 443。满足这三条 Caddy 就自动申请证书 + 配 HTTPS。
- **证书申请 challenge**：默认 HTTP-01（Let's Encrypt 访问 80 的 `.well-known/acme-challenge/`）；80 被占或防火墙限制时自动切 TLS-ALPN-01（用 443）；通配符域名（`*.x.com`）强制 DNS-01（需 DNS 提供商插件）。
- **证书存储**：`$CADDYPATH/certificates/`（默认 `~/.local/share/caddy/certificates/`），按 CA + 域名组织，自动管理。
- **续期时机**：每个证书到期前 1/3 有效期自动续（Let's Encrypt 90 天 → 到期前 30 天续）。续期后热重载，零停机。
- **OCSP Stapling**：Caddy 默认启用，主动查询证书吊销状态发给客户端，省客户端验证往返。
- **本地开发**：`localhost`/内网 IP 用 Caddy 自建 CA 签发自签证书，`caddy trust` 把 CA 安装到系统信任库。
- **`tls` 指令**：覆盖自动 HTTPS 行为——指定自定义证书（`tls cert.pem key.pem`）、禁用自动 HTTPS（`tls internal` 用内部 CA）、调整 cipher。
- **ON-Demand TLS**：运行时按需签发证书（首次请求某域名时才申请），适合多租户/泛域名场景，但需配 `ask` 端点防滥用。

## 一、Caddyfile 完整结构

Caddyfile 由「全局选项块」（可选）和「站点块」组成：

```caddyfile
{
    # 全局选项（可选，必须放文件最顶部）
    admin off                      # 关闭 admin API
    debug                          # 开 debug 日志
    default_sni example.com        # 默认 SNI
    auto_https off                 # 全局禁用自动 HTTPS（不推荐）
}

# 站点块 1：域名自动触发 HTTPS
example.com {
    root * /var/www/html
    file_server
    encode gzip zstd               # 压缩
    log {
        output file /var/log/caddy/access.log
        format json                # 结构化日志
    }
}

# 站点块 2：API 子域，反向代理
api.example.com {
    reverse_proxy localhost:8080 {
        lb_policy least_conn
        health_uri /healthz
    }
}

# 站点块 3：通配符，需 DNS challenge
*.apps.example.com {
    reverse_proxy localhost:9000
    tls {
        dns cloudflare {env.CF_API_TOKEN}   # DNS 插件
    }
}
```

- **全局选项块**：用 `{ }` 包裹，必须放文件最顶部（任何站点块之前）。配 admin API、debug、HTTP/3 开关等全局行为。
- **站点块地址**：第一行决定这个块管什么。地址里有没有协议、是不是域名、端口多少，决定是否触发自动 HTTPS。
- **指令**：站点块内每行一个指令（或花括号块）。指令有默认执行顺序，复杂场景查官方文档的 directive order。

## 二、自动 HTTPS 的触发与禁用

Caddy 不是所有站点都自动配 HTTPS，触发条件：

1. **地址是合法域名**：`example.com`、`api.example.com` 触发；`:8080`（端口）、`localhost`、内网 IP 不触发（用内部 CA）。
2. **未显式指定 `http://`**：`http://example.com` 强制明文，不申请证书。
3. **未禁用自动 HTTPS**：全局 `auto_https off` 或站点 `tls off` 会禁用。

满足条件时，Caddy 自动：申请证书 → 配 443 → 80 跳 443 → 开 HTTP/2/3。**禁用场景**：①内网服务不需要 TLS；②SSL 终止在上游负载均衡器（Caddy 在其后走明文）；③用自定义证书（自己买的 CA 证书）。

```caddyfile
# 禁用自动 HTTPS：用 http:// 前缀
http://internal.local {
    reverse_proxy localhost:3000
}

# 用自定义证书
example.com {
    tls /path/to/cert.pem /path/to/key.pem
    reverse_proxy localhost:3000
}

# 用内部 CA（自签，适合内网/开发）
internal.example.com {
    tls internal
    reverse_proxy localhost:3000
}
```

## 三、证书申请的 challenge 方式

Let's Encrypt 通过 challenge 验证你对域名的控制权，Caddy 支持三种：

| challenge | 工作方式 | 适用 | Caddy 默认 |
| --- | --- | --- | --- |
| **HTTP-01** | Let's Encrypt 访问 `http://域名/.well-known/acme-challenge/随机串` | 80 端口可达 | 默认首选 |
| **TLS-ALPN-01** | 用 443 端口的 TLS ALPN 扩展验证 | 80 被占/防火墙 | 自动回退 |
| **DNS-01** | 在 DNS 加一条 TXT 记录验证 | 通配符域名（`*.x.com`） | 通配符强制用 |

```caddyfile
# 通配符域名，强制 DNS-01，需 DNS 插件
*.apps.example.com {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    reverse_proxy localhost:9000
}
```

- **DNS 插件**：Caddy 编译时需带上对应 DNS 提供商的插件（`caddy add-package github.com/caddy-dns/cloudflare`，或用官方的 `caddy` with plugins 镜像）。
- **为什么通配符必须 DNS-01**：HTTP-01/TLS-ALPN 只能验证具体域名，无法验证通配符。DNS-01 通过控制 DNS 即证明对整个 zone 的控制权。

## 四、ON-Demand TLS：按需签发

常规自动 HTTPS 是「启动时为 Caddyfile 里列出的域名申请」。ON-Demand TLS 是「运行时收到某个域名的首次请求时才申请」，适合：①多租户平台（用户自定义域名）；②泛域名但不想预申请；③域名动态变化。

```caddyfile
{
    on_demand_tls {
        ask http://localhost:9000/check-domain    # 询问后端该域名是否允许
    }
}

# 通配符 + 按需
https:// {
    tls {
        on_demand
    }
    reverse_proxy localhost:8080
}
```

- **`ask` 端点**：Caddy 收到未知域名请求时，先 HTTP 询问这个端点「该域名是否被授权」。端点返回 200 才申请证书，否则拒绝。**必须配 ask**，否则任何人都能让你的服务器为他申请证书（Let's Encrypt 限额会被刷爆）。

## 五、日志与可观测

Caddy 的日志比 Nginx 更现代，原生支持结构化（JSON）：

```caddyfile
example.com {
    log {
        output file /var/log/caddy/access.log {
            roll_size 100mb          # 单文件 100MB 切割
            roll_keep 10             # 保留 10 个
            roll_keep_for 720h       # 保留 30 天
        }
        format json                  # JSON 结构化（便于 ELK/Loki 解析）
        level INFO
    }
}
```

- **`format json`**：原生 JSON 格式，字段含时间、方法、路径、状态、耗时、UA、客户端 IP 等，省去 Nginx 那样手动定义 log_format。
- **自动轮转**：`roll_size`/`roll_keep` 内置日志轮转，无需 logrotate + USR1 信号这套外部工具。
- **`format console`**：开发时用人类可读格式，生产用 JSON。

## 六、API 与动态配置

Caddy 提供 JSON 配置 + admin API（默认 `localhost:2019`），支持运行时动态改配置，这是 Nginx 开源版做不到的：

```bash
# 查看当前配置
curl localhost:2019/config/

# 动态添加一个站点（无需 reload）
curl -X POST localhost:2019/config/apps/http/servers/srv0/routes \
  -H "Content-Type: application/json" \
  -d '{"match":[{"host":["new.example.com"]}],"handle":[{"handler":"reverse_proxy","upstreams":[{"dial":"localhost:4000"}]}]}'
```

- **Caddyfile vs JSON**：Caddyfile 是给人类的简化语法，Caddy 内部先把它编译成 JSON 配置再用。`caddy adapt` 可看编译结果。
- **admin API**：运行时动态增删路由、上游、证书，无需 reload。适合动态多租户、自动扩缩容场景。
- **关闭 admin**：`{ admin off }` 关闭 API（生产安全考虑），但失去动态能力，改配置需 reload。

## 下一步

Caddyfile 与自动 HTTPS 讲完后，下一站是 [与 Nginx 对比](./comparison)——Caddy vs Nginx vs Apache vs Traefik 的选型取舍与迁移要点。
