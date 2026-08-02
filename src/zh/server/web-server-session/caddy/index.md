---
layout: doc
---

# Caddy

**Caddy** 是用 Go 编写的**现代 Web 服务器与反向代理**，以「**零配置自动 HTTPS**」闻名——只要在 Caddyfile 里写一个域名，Caddy 自动向 Let's Encrypt 申请证书、配置 HTTPS、到期前自动续期，全程无需 certbot、无需 cron、无需手动 reload。对比 Nginx 的「手写配置 + 手动证书」哲学，Caddy 的设计哲学是「**约定优于配置**」：用最少的字写出生产级服务，把 TLS 证书、HTTP→HTTPS 跳转、HTTP/2/3 这些「人人都该开但人人都会忘」的横切关注点变成默认行为。它是 Nginx 在中小项目里的强力替代——配置量减少 80%，但牺牲了 Nginx 那种逐指令精细控制的掌控力。

Caddy 的全部考点围绕**极简与自动化**展开：①**Caddyfile 语法**（一两行就能起一个 HTTPS 站点，`reverse_proxy`/`file_server` 等指令直觉化）；②**自动 HTTPS**（启动时自动申请 Let's Encrypt 证书、配 443、强制 HTTP→HTTPS 跳转、HTTP/2/3 默认开、到期前自动续期）；③**与 Nginx 的取舍**（Caddy 赢在零配置与自动 TLS，Nginx 赢在生态成熟、性能极致、配置掌控力）。本叶与 [Nginx](../nginx/) 叶互补——讲清「什么时候该选 Caddy、什么时候必须用 Nginx」。

## 评价

**优点**

- **零配置 HTTPS**：写个域名就自动申请证书、配 HTTPS、自动续期，告别 certbot + cron
- **配置极简**：Caddyfile 两三行替代 Nginx 二十行，可读性与维护性大幅提升
- **现代默认**：HTTP/2、HTTP/3（QUIC）、TLS 1.3、HTTP→HTTPS 跳转全部默认开启
- **单文件部署**：Go 编译成单个二进制，无依赖、跨平台，部署 = 拷一个文件
- **热重载**：改 Caddyfile 后 `caddy reload` 平滑生效，零停机

**缺点**

- **生态不如 Nginx**：社区案例、第三方模块、文档积累远少于 20+ 年的 Nginx
- **极致性能略逊**：高并发场景下 Nginx（C + epoll）仍有优势，Caddy（Go runtime）有 GC 开销
- **配置掌控力弱**：Caddyfile 隐藏了大量细节，想做 Nginx 那种逐指令微调较困难
- **企业环境接受度低**：大公司基础设施多以 Nginx 为标准，Caddy 破圈还需时间

## 本叶地图

- [入门](./getting-started) —— Caddy 定位、零配置 HTTPS 工作流、Caddyfile 极简语法、`reverse_proxy`/`file_server` 指令
- [Caddyfile 与自动 HTTPS](./guide-line/caddyfile-and-https) —— Caddyfile 完整语法、自动 HTTPS 的证书申请与续期机制、站点块与指令
- [与 Nginx 对比](./guide-line/comparison) —— Caddy vs Nginx vs Apache vs Traefik 的选型取舍，何时选哪个
- [参考](./reference) —— Caddyfile 指令速查、自动 HTTPS 行为清单、与 Nginx 指令对照、易错点

## 幻灯片地址

<a href="/SlideStack/caddy-slide/" target="_blank">Caddy</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=caddy" target="_blank" rel="noopener noreferrer">Caddy 测试题</a>
