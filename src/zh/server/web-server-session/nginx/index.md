---
layout: doc
---

# Nginx

**Nginx**（读作「Engine-X」）是当前最广泛使用的**开源 Web 服务器与反向代理**——它同时是静态资源托管的高性能选手、应用服务器的反向代理网关、负载均衡器、SSL/TLS 终结点与 HTTP 缓存层。本站本身就运行在 Nginx 上。与 Node.js/Java 应用服务器（处理业务逻辑）不同，Nginx 的设计哲学是「**事件驱动 + 极简配置**」：单台机器上的一个 Nginx worker 进程用 epoll/kqueue 处理数万并发连接，吞吐量是传统 fork-per-connection 模型（Apache prefork）的 5-10 倍。理解 Nginx 不只是会用 `proxy_pass`——它是现代 Web 架构里「**把流量稳定地分发到后端、把 TLS/压缩/缓存这些横切关注点收敛到入口**」的事实标准。

Nginx 的全部考点围绕**配置驱动**展开：①**配置层级**（`http` → `server` → `location` 三级嵌套，决定请求如何被路由与处理）；②**反向代理与负载均衡**（`proxy_pass` + `upstream` 把请求分发到多个后端，轮询/权重/IP-hash/最少连接等策略）；③**静态托管**（`root`/`try_files` 直接吐文件，是最高吞吐的用法）；④**SSL/TLS 终止**（在 Nginx 层卸载 HTTPS，后端走明文 HTTP，证书与 OCSP 在此统一管理）；⑤**运维与可观测**（`nginx -s reload` 平滑重载不丢连接，`access.log`/`error.log` 双日志）。本叶是全章 Web 服务器序列的**锚点**——后续 Caddy 叶讲自动 HTTPS 的替代选型，本叶讲手写配置的极致掌控力。

## 评价

**优点**

- **高并发**：事件驱动（epoll/kqueue）单 worker 处理数万连接，内存占用远低于 fork 模型
- **多功能合一**：一个进程同时干静态托管、反向代理、负载均衡、SSL 终止、缓存、压缩
- **配置直观**：声明式 `nginx.conf` 三级嵌套（http/server/location），可读性强、可版本管理
- **平滑重载**：`nginx -s reload` 重载配置不丢现有连接，改配置零停机
- **生态成熟**：30+ 年沉淀，文档/插件/社区案例极多，遇到问题几乎都能搜到答案

**缺点**

- **配置语法非标准**：自创 DSL（非 YAML/TOML），花括号匹配有坑（`if` 是邪恶的），上手需适应
- **动态配置弱**：原版不支持运行时动态增删 upstream，需 reload 或借助第三方模块（如 lua-nginx）
- **默认无自动 HTTPS**：需手动用 certbot 申请证书 + 配置，不如 Caddy 零配置
- **原生不支持 HTTP/3**：需编译 QUIC 分支或用商业版 NGINX Plus，门槛高

## 本叶地图

- [入门](./getting-started) —— Nginx 定位、事件驱动模型、`http`/`server`/`location` 三级配置、反向代理与 `proxy_pass`、负载均衡 `upstream`
- [反向代理与负载均衡](./guide-line/reverse-proxy) —— `location` 匹配规则、`proxy_pass` 转发、`upstream` 负载均衡策略（轮询/权重/IP-hash/最少连接）
- [SSL 终止与日志](./guide-line/ssl-and-logging) —— HTTPS 证书配置、SSL/TLS 终止架构、`access.log`/`error.log` 日志格式与分析
- [参考](./reference) —— Nginx 指令速查、`location` 匹配优先级、负载均衡策略对比、易错点清单

## 幻灯片地址

<a href="/SlideStack/nginx-slide/" target="_blank">Nginx</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=nginx" target="_blank" rel="noopener noreferrer">Nginx 测试题</a>
