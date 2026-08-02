---
layout: doc
outline: [2, 3]
---

# 参考：Railway 服务速查、用量矩阵与对比

> 基于 Railway 官方文档 · 核于 2026-08

## 速查

- **定位**：用量计费的全托管 PaaS，Heroku 继承者——按秒用量计费 + infra-as-code + 极致 DX。
- **计费**：按秒用量（CPU/内存/磁盘/流量），Hobby $5/mo 含 $5 额度；Free Trial $5 额度 + 30 天。
- **核心能力**：infra-as-code（railway.toml/json）、Nixpacks 零配置构建、模板市场、内置 Postgres/Redis、CLI/可视化控制台。
- **数据库**：Postgres、Redis、MySQL、MongoDB 经模板一键部署，连接串自动注入。
- **用量 vs 长驻**：低流量选 Railway（省钱），稳定高流量选 Render 长驻（交叉点后更便宜）。
- **DX**：连 GitHub → push 即部署；服务拓扑图控制台；实时日志；CLI 完整覆盖。

## 一、服务类型速查

| 服务类型 | 是什么 | 计费 | 典型用途 |
| --- | --- | --- | --- |
| **应用服务** | Web 应用/API（长驻或按需） | CPU/内存按秒用量 | Web 应用、API、SSR |
| **数据库** | Postgres/Redis/MySQL/MongoDB | CPU/内存/磁盘按秒用量 | 数据存储、缓存 |
| **Cron/定时** | 定时触发任务 | 按执行时长 | 定时报表、清理 |
| **Volume（磁盘）** | 持久化卷 | GB·秒 | 文件持久化 |
| **Object Storage** | S3 兼容对象存储 | $0.015/GB·月 | 大文件、媒体 |

## 二、用量计费矩阵（参考单价）

| 资源 | 单价（约） | Hobby $5 额度可跑（估） |
| --- | --- | --- |
| **CPU** | $0.00000772 / vCPU·秒 | 0.5 vCPU 持续 ≈ $10/mo（超额） |
| **内存** | $0.00000386 / GB·秒 | 512MB 持续 ≈ $5/mo（贴近额度） |
| **磁盘** | $0.00000006 / GB·秒 | 5GB 持续 ≈ $0.8/mo |
| **出站流量** | $0.05 / GB | 100GB ≈ $5（贴满额度） |
| **对象存储** | $0.015 / GB·月 | 1TB ≈ $15/mo |

- **临界点**：Hobby $5 额度大致覆盖「小型低流量 Web 服务 + 小 Postgres」的开发期消耗。
- **超额**：超出 $5 额度后按量续费，无硬上限（除非设预算告警）。

## 三、Railway vs Render 全面对比

| 维度 | Railway | Render |
| --- | --- | --- |
| **计费模型** | 按秒用量（CPU/内存/磁盘/流量） | 按长驻实例月费（$7/mo 起） |
| **低流量成本** | 极低（用量计费，近乎白嫖） | 固定 $7/mo |
| **稳定高流量** | 可能更贵（曲线上升） | 更划算（水平线） |
| **构建器** | Nixpacks（自研零配置）/ Dockerfile | Buildpack / Dockerfile（优先） |
| **infra-as-code** | railway.toml/json | render.yaml |
| **数据库** | Postgres/Redis/MySQL/MongoDB（模板） | Postgres/Redis（内置分层） |
| **模板市场** | ✅ 一键整套服务栈 | ❌ 无（手动配） |
| **HIPAA 合规** | ❌（无明确支持） | ✅ Scale/Enterprise（+20%） |
| **免费静态站** | ❌（无独立免费静态站） | ✅ Static Site $0 |
| **DX** | 服务拓扑图 + CLI + 实时日志 | 简洁控制台 + Preview Environments |

- **一句话区分**：**Railway = 用量计费 + 模板 + DX；Render = 长驻实例 + 合规 + 免费静态站。**
- **选型口诀**：低流量/爱模板/要省钱 → Railway；要合规/要免费静态站/稳定高负载 → Render。

## 四、易错点清单

- **"Railway 完全免费"**：错。Free Trial 是 $5 额度 + 30 天试用，Hobby 是 $5/mo——生产长期跑要付费。
- **"用量计费一定比长驻便宜"**：错。低流量省钱，稳定高流量可能超过 Render 的 $7/mo，需看实际消耗。
- **"Hobby $5 额度能跑任何生产应用"**：错。中高流量应用会超额，超出按量续费，需监控。
- **"Railway 支持 HIPAA"**：错。Railway 无明确 HIPAA 支持，受监管的医疗数据应选 Render Scale/Enterprise。
- **"railway.toml 只是文档"**：错。它是可执行的基础设施即代码，`railway up` 即重建环境。
- **"数据库连接串要手动抄"**：错。Railway 自动把 `DATABASE_URL`/`REDIS_URL` 注入引用的服务。
- **"Nixpacks 不支持 Dockerfile"**：错。有 Dockerfile 时优先用 Dockerfile，Nixpacks 只在无 Dockerfile 时自动检测。
- **"出站流量免费"**：错。出站流量 $0.05/GB，大流量是大头，需用 CDN/对象存储优化。
- **"模板只能起单个服务"**：错。模板可一键拉起整套服务栈（前端 + 后端 + 数据库）。
- **"Free Trial 的数据库永久免费"**：错。Free Trial 30 天到期或额度耗尽即停，生产数据库要 Hobby 起步。

## 五、进阶方向

- [Render](../../render/) —— 同为 Heroku 继承者，对比长驻实例计费与 HIPAA 合规
- [Vercel](../../static-hosting/vercel/) —— 前端优先的静态托管与 Serverless
- [Supabase](../../baas/supabase/) —— BaaS 路线，与 Railway 内置 Postgres 互补
- [基础设施即代码（IaC）](../../../../../engineering/iac/) —— Terraform/Pulumi 等通用 IaC，与 railway.toml 对照

## 权威链接

- [Railway 官方文档](https://docs.railway.com/)
- [Railway 定价](https://railway.com/pricing)
- [Railway 模板市场](https://railway.com/deploy/category/storage)
- [Nixpacks 文档](https://nixpacks.com/)
- 本站幻灯片：<a href="/SlideStack/railway-slide/" target="_blank">Railway</a>
