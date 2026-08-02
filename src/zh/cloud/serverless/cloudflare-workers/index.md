---
layout: doc
---

# Cloudflare Workers

**Cloudflare Workers** 是 Cloudflare 推出的**边缘 Serverless 计算平台**——开发者写一段 JS/TS（或 Rust/Python），部署后代码会自动分发到 Cloudflare 全球 **330+ 城市的边缘节点**，用户请求由**物理距离最近的节点**执行。它与传统 Serverless（如 Lambda）的根本差异在运行时：Workers **不用容器、不用虚拟机**，而是基于 **V8 isolates**（Chrome 浏览器同款的 JS 引擎隔离单元）——每个请求在一个轻量隔离里跑，**毫秒级启动、近乎无冷启动**。本叶是 Serverless 与边缘计算章的第一叶，只讲**计算平台本身**（Hono 框架、Workers AI 等周边归进阶叶/其他章）。

Workers 的全部考点围绕**"V8 isolates + 边缘 + 计费模型"**展开：①**运行时模型**——V8 isolates 取代容器，单进程内隔离多租户，启动约 5ms（vs 容器冷启动数百 ms～秒级），但也意味着**不能跑原生 Node 模块、不能长连接常驻**；②**边缘部署**——代码一次部署、330+ 城市就近执行，延迟低至用户所在城市；③**CPU-time 定价**——按**请求次数 + CPU 时间**计费（不是执行墙钟时长），CPU 密集任务要小心账单；④**Hono 框架**——专为边缘设计的超轻量 Web 框架（零依赖、TS 优先），是 Workers 的事实标准路由层；⑤**存储生态**——**KV**（最终一致的全局键值，读多写少）、**Durable Objects**（强一致、有状态、可做 WebSocket/限流/协同）、**R2**（S3 兼容对象存储，**零出口费**）、**D1**（边缘 SQLite）。后续两叶分别深入"V8 isolates 与冷启动/边缘"和"KV/Durable Objects 生态与定价"。

## 评价

**优点**

- **近乎零冷启动**：V8 isolate 启动约 5ms，Lambda 容器冷启动常数百 ms～秒级；对延迟敏感的边缘场景（鉴权、A/B、重写）体验碾压
- **全球边缘执行**：一次部署、330+ 城市就近响应，P50 延迟常在 50ms 内，无需自建 CDN/边缘节点
- **计费精细**：按请求数 + CPU 时间（非墙钟时长），I/O 等待不计费，适合等待密集型（代理、聚合）场景
- **生态完整**：KV/Durable Objects/R2/D1/Queues + Hono/Miniflare/Wrangler，从开发到存储一站式

**缺点**

- **运行时受限**：V8 isolates 不是 Node.js，**没有 fs/child_process/原生 .node 模块**，依赖原生模块的 npm 包（如 sharp、bcrypt、旧版数据库驱动）跑不了
- **CPU 时长硬上限**：免费版单请求 10ms CPU，付费 30s（可调），**CPU 密集任务**（图片处理、重计算）不适合，要做就得用 Workers AI 或拆给 Lambda/容器
- **学习曲线与心智**：边缘执行意味着**数据库要就近**（不能直连中心化 PG，否则 RTT 抹平优势）；KV 最终一致、DO 强一致的取舍要理解
- **厂商锁定**：深度依赖 Workers Runtime（Fetch API、Bindings 注入），迁出到 Lambda/Vercel 要改代码

## 本叶地图

- [入门](./getting-started) —— Workers 定位、V8 isolates、边缘部署、CPU-time 计费、Hono、核心术语
- [V8 isolates 与边缘](./guide-line/v8-isolates-and-edge) —— V8 isolate vs 容器、冷启动机制、边缘执行拓扑、运行时限制、与 Lambda 区别
- [KV 与生态](./guide-line/kv-and-ecosystem) —— KV/Durable Objects/R2/D1、Hono 框架、Bindings、Wrangler、定价陷阱
- [参考](./reference) —— 运行时对比、存储矩阵、计费表、易错点、权威链接

## 幻灯片地址

<a href="/SlideStack/cloudflare-workers-slide/" target="_blank">Cloudflare Workers</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=Cloudflare%20Workers" target="_blank" rel="noopener noreferrer">Cloudflare Workers 测试题</a>
