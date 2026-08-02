---
layout: doc
outline: [2, 3]
---

# 参考：Render 服务速查、定价矩阵与易错点

> 基于 Render 官方文档 · 核于 2026-08

## 速查

- **定位**：Heroku 的现代继承者——git push 即部署、Docker 优先、内置 Postgres、分层计费、HIPAA 合规。
- **服务类型**：Web Service（HTTP 长驻）、Background Worker（无 HTTP 常驻）、Postgres、Redis/Key-Value、Static Site（免费）、Cron Job。
- **计费**：Web Service/Worker 按**长驻实例 × 时长**计费（Starter $7/mo 起）；Static Site $0；Postgres Free→Basic/Pro/Accelerated 分层。
- **Free 的坑**：Web Service 15 分钟休眠（冷启动慢）；Postgres **30 天删除数据**——都不能用于生产。
- **Starter $7/mo**：生产入门线，不休眠。
- **HIPAA**：仅 Scale/Enterprise，开启后计算 +20%。
- **部署**：连 GitHub/GitLab → push 即部署；Dockerfile 优先，否则自动检测运行时。
- **render.yaml**：基础设施即代码，声明服务与环境变量。

## 一、服务类型速查

| 服务类型 | 接收 HTTP？ | 持续运行？ | 计费 | 典型用途 |
| --- | --- | --- | --- | --- |
| **Web Service** | ✅ 绑域名 | ✅ 长驻（Free 休眠） | 实例×时长（$7/mo 起） | Web 应用、API、SSR |
| **Background Worker** | ❌ | ✅ 长驻 | 实例×时长（$7/mo 起） | 队列消费、后台批处理 |
| **Cron Job** | ❌ | ❌ 到点跑一次 | 按执行时长 | 定时任务 |
| **Postgres** | 内部连接串 | ✅ | 分层（Free→Accelerated） | 关系型数据库 |
| **Redis / Key-Value** | 内部连接串 | ✅ | 分层 | 缓存、会话 |
| **Static Site** | ✅ CDN | N/A（CDN 分发） | **$0（免费）** | 文档站、SPA、营销页 |
| **Private Service（pserv）** | ❌ 仅内网 | ✅ | 实例×时长 | 内部 RPC、不暴露公网 |

## 二、定价矩阵（要点）

| 资源 | Free | Starter | Pro+ | Scale/Enterprise |
| --- | --- | --- | --- | --- |
| **Web Service** | 512MB/0.1CPU，15 分钟休眠 | $7/mo，不休眠 | 更高规格 | 团队/合规 |
| **Background Worker** | — | $7/mo 起 | 更高规格 | 团队/合规 |
| **Static Site** | $0（含 CDN） | $0 | $0 | $0 |
| **Postgres** | $0（30 天删除） | Basic $6/mo 起 | Pro $55/mo 起 | 合规 + 备份 |
| **HIPAA** | ❌ | ❌ | ❌ | ✅（+20% 计算） |

- **生产最小配置**：1 × Starter Web Service（$7）+ 1 × Basic Postgres（$6）≈ **$13/mo**。
- **免费组合**：Static Site（$0）+ 客户端调第三方 BaaS（Supabase/Firebase）= 零后端成本 JAMstack。

## 三、Web Service vs Worker vs Cron Job

| 维度 | Web Service | Worker | Cron Job |
| --- | --- | --- | --- |
| 接收 HTTP | ✅ | ❌ | ❌ |
| 绑域名 | ✅ | ❌ | ❌ |
| 运行方式 | 长驻等请求 | 长驻循环 | 定时触发一次 |
| 超时限制 | HTTP 请求有超时 | 无 HTTP 超时 | 单次执行有超时 |
| 适合 | Web 应用/API | 队列消费/后台批 | 定时报表/清理 |

- **判断口诀**：要被外部 HTTP 调？→ Web Service；常驻跑后台循环？→ Worker；到点跑一次就退？→ Cron Job。

## 四、Heroku 迁移对照

| 概念 | Heroku | Render |
| --- | --- | --- |
| Web 应用 | Dyno（Web） | Web Service |
| 后台进程 | Dyno（Worker） | Background Worker |
| 数据库 | Heroku Postgres | Postgres（Basic/Pro） |
| 配置 | app.json | `render.yaml`（Blueprint） |
| 构建包 | Buildpack | Buildpack（无 Dockerfile）/ Dockerfile（优先） |
| 域名 | xxx.herokuapp.com | xxx.onrender.com |
| 合规 | 有限 | HIPAA（Scale/Enterprise） |

- **迁移要点**：Procfile 的 `web`/`worker` 分别对应 Render 的 Web Service/Worker；环境变量在 Render 用 Secret 重建；数据库用 `pg_dump`/`pg_restore` 迁移。

## 五、易错点清单

- **"Free Postgres 能用于生产"**：错。Free Postgres **30 天后自动删除数据**，生产必须 Basic（$6/mo）起。
- **"Free Web Service 适合生产"**：错。Free 15 分钟无流量休眠，冷启动延迟几秒到十几秒，体验差。生产用 Starter $7/mo（不休眠）。
- **"Worker 也绑域名"**：错。Background Worker **不绑域名、不暴露端口**，纯粹后台常驻进程。
- **"Render 是 Serverless，按请求计费"**：错。Render 的 Web Service/Worker 是**长驻实例**，按实例时长计费（与 Lambda 按请求相反）。
- **"Static Site 要付费"**：错。Static Site **完全免费**（$0/mo，含 CDN）。
- **"HIPAA 在所有档支持"**：错。HIPAA 仅 **Scale/Enterprise** 档，且开启后计算 **+20%**。Free/Starter/Pro 不能放受监管数据。
- **"定时任务放 Web Service 里跑"**：错。HTTP 请求有超时，长任务会被杀——用 Worker（常驻循环）或 Cron Job（定时一次）。
- **"render.yaml 只是文档"**：错。`render.yaml` 是**可执行的基础设施即代码**，`render blueprint apply` 能重建整个环境。
- **"环境变量明文写就行"**：错。敏感配置（API Key/数据库密码）必须用 **Secret** 类型（加密存储、日志脱敏）。
- **"容器端口随便写"**：错。容器应监听 Render 注入的 `PORT` 环境变量，不要硬编码端口，否则流量转发不到。

## 六、进阶方向

- [Railway](../../railway/) —— 同为 Heroku 继承者，对比用量计费与 infra-as-code 的差异
- [Vercel](../../static-hosting/vercel/) —— 前端优先的静态托管与 Serverless，与 Render 静态站对照
- [Supabase](../../baas/supabase/) —— BaaS 路线，与 Render 内置 Postgres 互补
- [Docker](../../../../../engineering/container/docker/) —— 容器基础，Render Dockerfile 构建的底层

## 权威链接

- [Render 官方文档](https://render.com/docs)
- [Render 定价](https://render.com/pricing)
- [render.yaml 参考](https://render.com/docs/blueprint-spec)
- [Render vs Heroku 迁移指南](https://render.com/docs/migrate-from-heroku)
- 本站幻灯片：<a href="/SlideStack/render-slide/" target="_blank">Render</a>
