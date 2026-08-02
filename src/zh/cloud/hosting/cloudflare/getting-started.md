---
layout: doc
outline: [2, 3]
---

# 入门：Cloudflare 定位、全家桶与无限带宽免费层

> 基于 Cloudflare 官方文档（2025） · 核于 2026-08

## 速查

- **Cloudflare 是什么**：覆盖**网络、安全、计算、存储、数据库**的**边缘计算全家桶**，从 CDN/抗 DDoS 服务商（2009 创立）演进为全球最大的边缘云平台之一，核心差异化是**无限带宽免费层**。
- **全家桶六大组件**：**Pages**（静态托管）+ **Workers**（边缘计算）+ **R2**（零出口费对象存储）+ **D1**（边缘 SQLite 数据库）+ **KV**（全球键值存储）+ **Containers**（2025 容器化工作负载）。
- **无限带宽免费层（核心差异化）**：静态资源的**请求与带宽不计费**——高流量站点省巨额成本，是 Netlify/Vercel（按 GB 收带宽）做不到的杀手锏。
- **Pages**：静态站点托管 + Git 触发部署，对标 Netlify/Vercel，连仓库 + `git push` 自动构建 + 全球 CDN，零配置 HTTPS。
- **Workers**：边缘计算，基于 **V8 Isolates**（Chrome 的 JS 引擎隔离单元，**非容器**），全球 300+ 节点，**冷启动 0-5ms**，支持 JS/TS/Rust/C/C++/Python（via WASM）。
- **R2**：对象存储对标 AWS S3，但**出口流量零费用**（S3 出口费是云账单大头），存取大文件/媒体极省钱，可从 Workers 原生绑定访问。
- **D1**：边缘 **SQLite** 数据库，全球只读副本 + 主写入区域，2024 GA，适合读多写少的边缘查询。
- **KV**：全球分布式**键值存储**，最终一致，超低延迟读（边缘缓存），适合配置、会话、特征开关。
- **Containers（2025）**：让 Workers 能跑**任意语言的容器化工作负载**与长任务，弥补 V8 Isolates 不能跑重逻辑的限制。
- **免费层额度**：Workers 10 万请求/天、Pages 无限请求/带宽、R2 10GB 存储 + 零出口费、D1 5GB + 500 万读/天、KV 10 万读/天。
- **集成方式**：Workers 通过**绑定（bindings）**原生访问 R2/D1/KV/Queues，无需 API key/SDK，代码里直接 `env.MY_BUCKET.get()`。
- **进阶顺序**：[Workers 与边缘计算](./guide-line/workers-and-edge) → [R2 / D1 / KV 存储与数据库](./guide-line/storage-and-db) → [参考](./reference)。

## 一、Cloudflare：从 CDN 到边缘云全家桶

Cloudflare 2009 年以 CDN + 抗 DDoS 起家，逐步把能力延伸到计算、存储、数据库，形成"前端到后端"的全家桶：

```
                  Cloudflare 全家桶（边缘云）
  ┌───────────────────────────────────────────────────┐
  │  Pages     静态托管（Git → CDN）                   │
  │  Workers   边缘计算（V8 Isolates，全球 300+ 节点） │
  │  R2        对象存储（零出口费）                     │
  │  D1        边缘 SQLite 数据库                      │
  │  KV        全球键值存储                             │
  │  Containers 容器化工作负载（2025）                 │
  ├───────────────────────────────────────────────────┤
  │  底座：全球 Anycast 网络 + 300+ 边缘节点           │
  │       免费 SSL / 抗 DDoS / WAF / Bot 防护           │
  └───────────────────────────────────────────────────┘
```

- **核心叙事**：一个开发者用 Cloudflare 全家桶，从前端静态页（Pages）到边缘 API（Workers）到存储（R2）到数据库（D1/KV），**全部跑在全球边缘 + 全部享无限带宽免费层**——这是其他云（AWS/GCP/Azure）做不到的统一边缘体验。
- **底座优势**：所有上层组件都跑在 Cloudflare 自有的全球 Anycast 网络上，天然带免费 SSL、抗 DDoS、WAF——安全与性能一体化。

## 二、无限带宽免费层：核心差异化

这是 Cloudflare 最硬核的卖点，理解它就理解了 Cloudflare 的竞争壁垒：

| 平台 | 静态资源带宽计费 |
| --- | --- |
| **Cloudflare Pages** | **免费，无限带宽无限请求** |
| Netlify（2025 信用制） | 20 credits/GB，免费层约 50GB |
| Vercel | 免费层 100GB，超出 $40/100GB |
| AWS S3 + CloudFront | 按出口流量计费（约 $0.09/GB） |

- **对高流量站的意义**：一个日均 100GB 流量的视频/图片站，在 AWS 月带宽费约 $270，在 Netlify 会超免费层需付费，在 **Cloudflare 完全免费**。
- **背后的商业逻辑**：Cloudflare 是 Anycast 网络运营商，自有骨干网，带宽边际成本极低；而传统云按流量转售带宽，这是商业模式的结构性差异。
- **限制**：免费层针对**静态资源**（Pages 托管的 HTML/CSS/JS/图片/视频）；Workers 动态请求、R2 存储、D1/KV 操作有各自的免费额度上限。

## 三、Pages：静态托管

Cloudflare Pages 是静态站点托管服务，对标 Netlify/Vercel：

- **Git 集成**：连 GitHub/GitLab 仓库，`git push` 自动触发构建 + 部署，支持 Next.js/Vite/Hugo/Astro 等主流框架的自动识别。
- **全球 CDN**：构建产物分发到全球 300+ 边缘节点，无限请求无限带宽免费。
- **部署预览**：每个 PR 自动生成预览 URL，协作评审。
- **Pages Functions**：Pages 内置基于 Workers 的边缘函数能力，可在静态站里加边缘 API/动态逻辑——本质是 Workers 的 Pages 集成形态。

## 四、Workers：边缘计算

Workers 是 Cloudflare 的边缘计算核心，与其他 Serverless 的关键差异在 **runtime 模型**：

- **V8 Isolates（非容器）**：Workers 不用 Docker 容器，而是用 Chrome 的 V8 引擎的 **Isolate**（隔离的 JS 执行环境）。一个进程可跑成百上千个 Isolate，**启动几乎为零**（0-5ms），而 AWS Lambda 的容器冷启动常数百毫秒到秒。
- **支持的运行时**：原生 JS/TS，加上 Rust/C/C++/Python（编译成 WASM）。**不支持完整 Node.js**（不能用 `fs`、原生 `.node` 模块），用 Web 标准 API（`fetch`/`Request`/`Response`/`crypto.subtle`）+ Cloudflare 扩展。
- **全球执行**：代码部署一次，全球 300+ 节点同步；用户请求由最近的节点处理，延迟天然低。
- **CPU 时间限制**：免费层每请求 10ms CPU 时间，付费 30s+——Workers 设计目标是"海量短请求"，不是长任务（长任务交给 Containers）。

## 五、R2 / D1 / KV：存储与数据库三件套

| 服务 | 模型 | 一致性 | 典型用途 | 免费层 |
| --- | --- | --- | --- | --- |
| **R2** | 对象存储（类 S3） | 强一致 | 大文件、媒体、备份 | 10GB 存储 + **零出口费** |
| **D1** | 关系型（SQLite） | 强一致（主）+ 只读副本 | 边缘读多写少查询 | 5GB + 500 万读/天 |
| **KV** | 键值存储 | **最终一致** | 配置、会话、特征开关 | 10 万读/天 |

- **R2 零出口费**是最大卖点：存取数据只收存储费 + 操作费，**出口流量免费**——存视频/图片供前端访问，比 S3 省下巨额出口费。
- **D1** 是 SQLite 的边缘托管版：写入走主区域（强一致），全球边缘节点缓存只读副本（最终一致），适合读多写少。
- **KV** 是最终一致的全球键值存储，读延迟极低（边缘缓存），适合存配置、会话、特征开关等可容忍秒级一致的数据。
- **选型**：大文件/媒体 → R2；结构化查询/事务 → D1；简单键值/高频读 → KV。

## 六、Containers（2025）：补齐长任务短板

Workers 的 V8 Isolates 模型擅长海量短请求，但不擅长长任务、重计算、需要完整 OS/任意语言的场景。**2025 年 Cloudflare 推出 Containers**，让 Workers 能编排容器化工作负载：

- **能力**：在 Cloudflare 边缘跑 Docker 容器，支持任意语言（Java/Go/Python 完整运行时）、长任务、有状态服务。
- **与 Workers 协同**：Workers 做轻量边缘入口（鉴权/路由/缓存），重逻辑下放给 Containers——形成"Workers + Containers"的边缘混合架构。
- **定位**：补齐 V8 Isolates 的短板，让 Cloudflare 全家桶能承载更复杂的工作负载（机器学习推理、视频转码、长连接服务）。

## 下一步

理解了 Cloudflare 全家桶的概览后，下一步深入两大主题——[Workers 与边缘计算](./guide-line/workers-and-edge)（V8 Isolates 原理、Pages Functions、Containers）与[R2 / D1 / KV 存储与数据库](./guide-line/storage-and-db)（三大存储的选型与实践）。
