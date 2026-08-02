---
layout: doc
outline: [2, 3]
---

# 服务与定价详解：Web Service、Worker、Postgres 与 HIPAA

> 基于 Render 官方文档 · 核于 2026-08

## 速查

- **计费核心：按长驻实例计费**。每个 Web Service / Worker 占一个持续运行的实例，按「实例规格 × 运行时长」收费——与 Serverless「按请求计费」不同，Render 服务是**常驻**的。
- **Web Service**：长驻 HTTP 服务，绑域名、暴露端口、适合 Web 应用与 API。Free（512MB/0.1CPU，15 分钟休眠）→ Starter $7/mo（不休眠）→ Pro → 更高规格。
- **Background Worker**：**不接收 HTTP** 的常驻进程——队列消费者、定时爬虫、后台批处理。计费结构同 Web Service，但不绑域名、不暴露端口。
- **Web Service vs Worker**：是否接收外部 HTTP 请求是唯一分界。定时任务塞 Web Service 会被请求超时杀掉，必须用 Worker/Cron Job。
- **Postgres 分层**：Free（**30 天后删除**）→ Basic $6/mo 起（生产入门）→ Pro $55/mo 起 → Accelerated（带连接池与加速硬件）。
- **Starter $7/mo = 生产入门线**：买一个**不休眠**的长驻实例。Free 的 15 分钟休眠会让冷启动延迟几秒到十几秒，不适合生产。
- **Free Postgres 绝不能用于生产**：30 天后数据**自动清除**，只能做 demo/学习。
- **HIPAA**：仅 Scale/Enterprise 档支持，开启后**计算费用 +20%**。医疗健康类受监管应用的可落地路径。
- **Static Site 免费**：纯前端（构建产物）$0/mo + 全球 CDN——文档站/营销页/SPA 的最佳归宿。

## 一、计费模型：长驻实例 vs 按请求

理解 Render 计费的第一步是区分两种模型：

| 模型 | 谁用 | 计费单位 | 特点 |
| --- | --- | --- | --- |
| **长驻实例（Render）** | Web Service / Worker | 实例规格 × 运行时长（按月） | 持续运行、无冷启动（除 Free 休眠）、适合稳定流量 |
| **按请求（Serverless）** | AWS Lambda / CF Workers | 调用次数 × 执行时长 | 流量低时便宜、可缩到零、有冷启动 |

- Render 的 Web Service/Worker 是**长驻**的——即使没流量也在跑、也在计费。这与"按需启动"的 Serverless 相反。
- **适用场景**：稳定/中高流量、长连接（WebSocket）、常驻进程（队列消费）选 Render 长驻实例；突发/极低流量/事件驱动选 Serverless。
- **成本曲线**：长驻实例是**水平线**（每月固定），Serverless 是**随用量上升的曲线**——流量大到某点后，长驻反而更便宜。

## 二、Web Service：长驻 HTTP 服务

Web Service 是 Render 最核心的服务类型——一个持续运行、对外暴露 HTTP 的服务：

```
用户浏览器 / API 客户端
        │ HTTPS
        ▼
  Render 负载均衡（自动 HTTPS 证书）
        │
        ▼
  Web Service 实例（你的应用容器）
   - 绑定域名（xxx.onrender.com 或自定义域名）
   - 监听端口（PORT 环境变量）
   - 持续运行，等请求
        │
        ▼
  Postgres / Redis（Render 内置，内网连接）
```

- **Free（探索用）**：512MB RAM / 0.1 CPU，**15 分钟无流量自动休眠**，下次请求触发冷启动（几秒~十几秒）。只适合 demo。
- **Starter $7/mo（生产入门）**：长驻、**不休眠**、无冷启动延迟——小型生产应用的起点。
- **Pro 及以上**：更高规格（更多 RAM/CPU）、更多并发能力，按需扩容。
- **绑域名 + 自动 HTTPS**：Render 自动签发并续期 Let's Encrypt 证书，无需手动配。
- **自动扩缩（可选）**：Pro 档可按指标（CPU/内存/请求数）自动扩缩实例数。

## 三、Background Worker：不接 HTTP 的常驻进程

Worker 与 Web Service 的**唯一区别**是是否接收外部 HTTP 请求：

- **Web Service**：绑域名、暴露端口、接收公网 HTTP——适合 Web 应用/API。
- **Background Worker**：**不绑域名、不暴露端口**——纯粹的后台常驻进程。

典型 Worker 用途：

- **队列消费者**：从 Redis/SQS/RabbitMQ 取任务执行（发邮件、转码、生成报表）。
- **定时爬虫/数据同步**：常驻循环，定时拉取外部数据。
- **后台批处理**：跑长耗时任务，避免阻塞 Web 请求。

- **计费同 Web Service**：按实例规格 × 运行时长，Starter $7/mo 起。
- **不要用 Web Service 跑长任务**：HTTP 请求有超时（通常 30s~几分钟），超时会被 Render 网关杀掉——长任务必须卸载到 Worker。
- **Cron Job vs Worker**：纯定时（到点跑一次就退出）用 Cron Job（按执行时长计费）；需要常驻循环消费用 Worker。

## 四、Postgres 分层与 Free 的坑

Render 内置托管 PostgreSQL，自动备份、连接池（PgBouncer）、按需扩容：

| 档位 | 价格 | 用途 |
| --- | --- | --- |
| **Free** | $0 | **30 天后自动删除数据**，仅 demo/学习 |
| **Basic** | $6/mo 起（256MB）~ $75/mo（4GB） | 生产入门 |
| **Pro** | $55/mo（4GB）~ $6200/mo（512GB） | 中大型生产 |
| **Accelerated** | $160/mo 起 | 带连接池与加速硬件，高并发 |

- **Free Postgres 的致命坑**：**30 天后数据自动清除**。任何承载真实业务数据的库都必须至少 Basic（$6/mo）。
- **连接池（PgBouncer）**：高并发下用连接池复用数据库连接，避免连接数打满。Accelerated 档内置，Pro 档可配。
- **自动备份**：付费档支持每日备份与时间点恢复（PITR），Free 不保证。

## 五、HIPAA 合规路径

对医疗健康类受监管应用（处理 PHI 受保护健康信息），Render 提供 HIPAA 落地路径：

- **仅 Scale/Enterprise 档支持**：Free/Starter/Pro **不支持** HIPAA——受监管数据不能放这些档。
- **成本：计算费用 +20%**：开启 HIPAA 后，该工作区所有计算费用上浮 20%——这是合规的溢价。
- **需签 BAA**：与企业版签业务伙伴协议（Business Associate Agreement），满足 HIPAA 法务要求。
- **意义**：这让 Render 能承接 Heroku 免费档/VPS 无法承接的医疗类应用——是 Render 相对通用 PaaS 的差异化能力之一。

## 六、选型决策

| 场景 | 推荐 | 原因 |
| --- | --- | --- |
| 个人 demo / 学习 | Free Web Service + Free Postgres | 零成本，注意 30 天数据删除 |
| 小型生产应用 | Starter $7/mo + Basic Postgres $6/mo | 不休眠、数据持久，月费可控 |
| 队列消费 / 后台任务 | Background Worker $7/mo | 不绑端口，常驻消费 |
| 纯前端（文档/营销页） | Static Site（免费） | $0 + CDN |
| 医疗健康合规应用 | Scale/Enterprise + HIPAA（+20%） | 满足 HIPAA，可处理 PHI |

## 下一步

服务与定价讲完后，下一步看[部署、Docker 与静态站](./deploy-and-docker)——Git 自动部署流程、Docker 构建策略、静态站与 Preview Environments 的实战。
