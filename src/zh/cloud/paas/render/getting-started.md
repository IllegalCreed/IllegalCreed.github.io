---
layout: doc
outline: [2, 3]
---

# 入门：Render 定位、分层定价与服务类型

> 基于 Render 官方文档 · 核于 2026-08

## 速查

- **定位**：Render 是**全托管云平台**，号称 **Heroku 的现代继承者**——git push 即部署、零 DevOps，补齐了 Heroku 缺的分层计费、Docker 原生、内置 Postgres、静态站、HIPAA 合规。
- **核心抽象是服务（Service）**：你声明"我要一个 Web Service / Background Worker / Postgres / 静态站"，Render 负责构建、部署、证书、扩缩、日志。开发者面对的是 `render.yaml` 与 GitHub 自动部署，不是虚拟机。
- **分层定价**：①**Free**（Web Service 512MB/0.1CPU、15 分钟休眠；Postgres 30 天删除；静态站完全免费）——探索用；②**Starter $7/mo**（长驻实例、不休眠）——生产入门；③**Pro/Scale/Enterprise**（高性能/合规）。
- **长驻 Web Service**：HTTP 服务（Web 应用/API），**持续运行**等请求，按**实例时长**计费。与 Serverless 的区别：不缩到零（除 Free 休眠），无冷启动延迟，适合长连接/WebSocket/常驻进程。
- **后台 Worker（Background Worker）**：**不接收 HTTP 请求**的常驻进程——跑队列消费者、定时任务、定时爬虫。计费结构同 Web Service，但不绑域名/不暴露端口。
- **内置 Postgres**：Free（30 天删）/Basic（$6/mo 起）/Pro（$55/mo 起）/Accelerated（带连接池加速）。**Free Postgres 不能用于生产**——30 天后数据自动清除。
- **静态站（Static Sites）**：纯前端（HTML/CSS/JS、JAMstack、VitePress/Docusaurus 构建产物），**完全免费**（$0/mo），自带全球 CDN。
- **Docker 优先**：有 Dockerfile 则用 Dockerfile 构建（完全自定义）；没有则自动检测运行时（Node/Python/Ruby/Go/Deno）并用 Buildpack 构建。
- **HIPAA 合规**：仅在 **Scale/Enterprise** 档支持，开启后计算费用 **+20%**——医疗健康类受监管应用的可选落地路径。
- **进阶顺序**：[服务与定价详解](./guide-line/services-and-pricing) → [部署、Docker 与静态站](./guide-line/deploy-and-docker) → [参考](./reference)。

## 一、Render 是什么：Heroku 的现代继承者

Render 的诞生背景是 **Heroku 的衰落**——Heroku 在 2022-2023 年先后关闭免费层、停止维护若干 buildpack，开发者急需一个"Heroku 体验、但更现代"的平台。Render 由 Anurag Goel（前 Stripe 工程师）于 2018 年创立，定位就是**继承 Heroku 的极简 DX**，同时补齐：

- **分层计费**：Heroku 免费层取消后，Render 保留 Free + 透明的 Starter/Pro/Scale 分层。
- **Docker 原生**：Heroku 长期依赖 Buildpack，Docker 支持迟缓；Render 把 Docker 作为一等公民——有 Dockerfile 就用它，构建结果完全可控。
- **内置 Postgres/Redis/静态站**：在一个平台内一站式拼齐后端常用组件，不必跨 Vercel + Supabase + Redis Labs 拼。
- **合规**：HIPAA 支持（Scale/Enterprise），让受监管的医疗/健康类应用能落地——这是 Heroku 免费档做不到的。

一句话：**Render = Heroku 的部署体验 + Docker 优先 + 分层计费 + 内置数据库 + 合规路径。**

## 二、分层定价：Free / Starter / Pro / Scale / Enterprise

Render 的计费逻辑是「**按服务实例长驻计费**」——每个 Web Service/Worker 占用一个持续运行的实例，按其规格与运行时长收费；数据库、静态站、磁盘单独计费。按**工作区（Workspace）**分档：

| 档位 | 定位 | 关键点 |
| --- | --- | --- |
| **Free** | 探索/Demo | Web Service 512MB/0.1CPU、**15 分钟无流量休眠**；Postgres **30 天删除**；静态站完全免费 |
| **Starter** | 生产入门 | **$7/mo** 起的长驻实例，**不休眠**；适合小型生产应用 |
| **Pro** | 中型生产 | $25/mo + 计算；更高规格实例、更多服务数 |
| **Scale** | 大规模/合规 | 支持 **HIPAA**（+20% 计算溢价）、私有网络、团队管理 |
| **Enterprise** | 企业 | SOC2、SLA、SSO、专属支持 |

- **Free 不适合生产**：Free Web Service 休眠后冷启动慢（几秒到十几秒）；Free Postgres **30 天后自动删除数据**——只能做 demo/学习。
- **Starter $7/mo 是生产入门线**：花 $7 买一个**不休眠**的长驻实例，是绝大多数小型应用的起点。
- **HIPAA 在 Scale/Enterprise**：合规只在高档支持，且开启后**计算费用 +20%**——这是合规的成本门槛。

## 三、服务类型：Web Service、Worker、Postgres、静态站

Render 把"要部署什么"抽象成几类服务，每类有独立的生命周期与计费方式：

| 服务类型 | 是什么 | 接收 HTTP？ | 计费 |
| --- | --- | --- | --- |
| **Web Service** | 长驻 HTTP 服务（Web 应用/API） | ✅ 绑域名、暴露端口 | 按实例时长（$7/mo 起） |
| **Background Worker** | 后台常驻进程（队列消费/定时任务） | ❌ 不绑域名、不暴露端口 | 按实例时长（$7/mo 起） |
| **Postgres** | 托管 PostgreSQL（自动备份/连接池） | 内部连接串 | Free/Basic/Pro/Accelerated 分层 |
| **Redis / Key-Value** | 托管缓存/键值存储 | 内部连接串 | 分层 |
| **Static Site** | 纯前端（构建产物） | ✅ 自带 CDN | **$0/mo（免费）** |
| **Cron Job** | 定时任务（到点跑一次） | ❌ | 按执行时长 |

- **Web Service vs Worker 的核心区别**：是否**接收外部 HTTP 请求**。Web Service 绑域名、对公网暴露、适合 Web 应用/API；Worker 不绑域名、不暴露端口、适合消费消息队列、跑后台批处理、定时爬取。
- **不要把定时任务塞进 Web Service**：Web Service 的 HTTP 请求有超时限制，长任务会被杀；定时/队列任务应该用 Worker 或 Cron Job。
- **Static Site 完全免费**：纯前端项目（VitePress 文档站、Vite 构建的 SPA、Docusaurus）放 Static Site，**零成本** + 全球 CDN。

## 四、Docker 优先与自动检测

Render 的构建策略分两种：

1. **有 Dockerfile**：直接用你的 Dockerfile 构建——构建步骤、基础镜像、启动命令完全由你掌控。这是**最可控**的方式，适合任何语言/任意自定义运行时。
2. **无 Dockerfile**：Render **自动检测**运行时（Node.js/Python/Ruby/Go/Deno/Rust 等），用内置 Buildpack 推断构建命令（如 Node 的 `npm install` + `npm run build`）与启动命令（`npm start`）。

- **Docker 优先**意味着 Render 不绑死任何语言——只要能容器化就能跑，这与 Heroku 长期依赖 Buildpack、对 Docker 支持迟缓形成对比。
- **生产建议**：用 `render.yaml`（基础设施即代码）声明服务，配合 Dockerfile，让部署**可重复、可版本化**。

## 五、内置 Postgres 与合规

- **内置 Postgres**：Render 提供托管 PostgreSQL，自动备份、连接池（PgBouncer）、按需扩容。分层从 Free（30 天删除）到 Accelerated（带连接池与加速硬件）。
- **Free Postgres 的坑**：30 天后**自动删除数据**——任何用于生产的数据库都必须至少 Basic（$6/mo）档。
- **HIPAA 合规**：在 Scale/Enterprise 档支持，开启后**计算费用 +20%**。这让 Render 能承接医疗健康类受监管应用——这是它相对 Heroku/普通 VPS 的差异化能力。

## 下一步

理解了 Render 的定位、分层定价与服务类型后，下一步深入两块——[服务与定价详解](./guide-line/services-and-pricing)（Web Service/Worker/Postgres 的计费细节与 HIPAA 路径）与[部署、Docker 与静态站](./guide-line/deploy-and-docker)（Git 自动部署、Docker 构建策略、静态站与 Preview Environments）。
