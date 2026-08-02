---
layout: doc
outline: [2, 3]
---

# 参考：Workers 运行时、存储矩阵与计费速查

> 基于 Cloudflare Workers · 核于 2026-08

## 速查

- **Workers 定位**：基于 V8 isolates 的边缘 Serverless，330+ 城市就近执行，近乎无冷启动。
- **运行时**：V8 isolate（非容器），Web 标准 API（Fetch/Streams/Crypto），不是 Node，无 `fs`/原生模块。
- **冷启动**：~5ms（V8 code caching 缓存字节码），vs Lambda 容器 500ms-3s。
- **计费**：请求数 + **CPU 时间**（非墙钟）；I/O 等待不计费，适合等待密集型。
- **存储**：KV（最终一致键值）/ Durable Objects（强一致有状态）/ R2（对象存储零出口费）/ D1（边缘 SQLite）。
- **框架**：Hono（边缘事实标准，零依赖、TS 优先、跨运行时）。
- **工具**：Wrangler CLI（dev/deploy/tail）+ Miniflare 本地仿真。

## 一、Workers vs Lambda vs 容器

| 维度 | Cloudflare Workers | AWS Lambda | 容器（Fargate/自建） |
| --- | --- | --- | --- |
| 运行时 | V8 isolates | Firecracker 微 VM | 完整 Linux 容器 |
| 冷启动 | **~5ms** | 200ms-3s（SnapStart ~200ms） | 视实例，秒级 |
| 部署 | **330+ 城市边缘** | 单区域（多区域要手动复制） | 单区域 |
| 语言 | JS/TS（+WASM: Rust/Python） | Node/Python/Java/Go/.NET/Rust | 任意 |
| 原生模块 | ❌ | ✅（Linux 二进制） | ✅ |
| 计费 | 请求数 + **CPU 时间** | 请求数 + **执行时长** | 实例时长（常驻） |
| 请求时长上限 | 10ms-30s CPU | 15 分钟 | 无（常驻） |
| 适合 | 边缘鉴权/代理/低延迟 | 事件处理/BFF/重计算 | 长任务/有状态/重负载 |

## 二、存储四件套对比

| 存储 | 一致性 | 适合 | 局限 |
| --- | --- | --- | --- |
| **KV** | 最终一致（秒级同步） | 配置/缓存/特性开关（读多写少） | 单 key ~1 写/秒，不强一致 |
| **Durable Objects** | 强一致（单点） | 限流/WebSocket/协同/计数 | 单节点（远处 RTT 高） |
| **R2** | 强一致（写后可读） | 图片/视频/备份（零出口费） | 操作次数（Class A 写）计费 |
| **D1** | 读副本最终一致 / 写主强 | 中小型结构化数据（边缘 SQL） | 大规模写要换中心化 DB |
| **Queues** | 至少一次 | 削峰、异步任务 | 需配消费者 Worker |
| **Cache API** | 请求级 | 缓存响应（省 KV 读/出站流量） | 每节点独立，非全局 |

## 三、计费速查

| 资源 | 免费 | 付费（$5/月） | 超额 |
| --- | --- | --- | --- |
| 请求数 | 10 万/天 | 1000 万/月 | $0.30/百万 |
| CPU 时间 | 10ms/请求 | 30s/请求；1000 万 CPU-ms/月 | $0.02/百万 CPU-ms |
| KV 读 | 10 万/天 | 1000 万/月 | $0.50/百万 |
| KV 写 | 1000/天 | 100 万/月 | $5/百万 |
| KV 存储 | 1 GB | 1 GB | $0.50/GB-月 |
| R2 存储 | 10 GB | 10 GB | $0.015/GB-月 |
| R2 出口 | 零 | **零** | **零**（杀手锏） |
| D1 行读 | 500 万/天 | 250 亿/月 | $0.001/百万 |
| D1 存储 | 5 GB | 5 GB | $0.75/GB-月 |

## 四、运行时 API 速查

| Web 标准 API | 用途 |
| --- | --- |
| `fetch()` | 发 HTTP 请求（取代 Node `http`） |
| `Request` / `Response` | 请求/响应对象 |
| `Headers` / `URL` | 头/URL 解析 |
| `ReadableStream` / `WritableStream` | 流式数据 |
| `crypto.subtle` | 哈希/签名（取代 Node `crypto`） |
| `TextEncoder` / `TextDecoder` | 编码 |
| `atob` / `btoa` | Base64 |
| `caches.default` | Cache API（请求级缓存） |

| Cloudflare 扩展 | 用途 |
| --- | --- |
| `env.MY_KV` | KV Binding |
| `env.MY_DO.fetch()` | Durable Object 调用 |
| `env.MY_DB.prepare()` | D1 查询 |
| `ctx.waitUntil(p)` | 延迟到请求后执行（写日志） |
| `ctx.passThroughOnException()` | 异常时回退到源站 |

## 五、Hono 速查

```ts
import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.text("hi"));
app.post("/u", async (c) => {
  const body = await c.req.json();
  await c.env.MY_KV.put(body.id, JSON.stringify(body));
  return c.json({ ok: true });
});
app.get("/api/*", middlewareA, middlewareB); // 中间件链
export default app;
```

## 六、易错点清单

- **"Workers 就是 Node.js"**：错。Workers Runtime 是 Web 标准 API，**无 `fs`/`child_process`/原生模块**。依赖 sharp/bcrypt/canvas 的包跑不了，要迁 WASM 或换纯 JS 实现。
- **"边缘执行就一定快"**：错。Worker 在边缘快，但 `fetch(中心化 PG)` 的 RTT 抹平优势。数据库要就近（D1/KV/DO/Hyperdrive）。
- **"KV 是强一致"**：错。KV 是**最终一致**，全球同步需秒到几十秒。强一致场景（扣款/库存）用 Durable Objects 或 D1 主节点。
- **"计费按执行时长"**：错。按 **CPU 时间**，I/O 等待不计费。`await fetch` 等 800ms 不增加账单。
- **"全局变量能跨请求"**：错。isolate 处理完可能被回收，全局变量不持久化。状态用 KV/DO。
- **"CPU 密集任务也能跑"**：风险。免费版 10ms/请求上限；CPU-ms 是核心计量，重计算账单暴涨。迁 Lambda 或 Workers AI。
- **"KV 当数据库高频写"**：错。单 key ~1 写/秒。高频写换 DO/D1。
- **"Durable Objects 也能就近读"**：错。DO 单点（哈希到固定节点），远处访问有 RTT。它解决强一致，不解决就近读。

## 权威链接

- [Cloudflare Workers 官方文档](https://developers.cloudflare.com/workers/)
- [Hono 官方文档](https://hono.dev/)
- [Workers 运行时 API](https://developers.cloudflare.com/workers/runtime-apis/)
- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
- [Durable Objects 概述](https://developers.cloudflare.com/durable-objects/)
- 本站幻灯片：<a href="/SlideStack/cloudflare-workers-slide/" target="_blank">Cloudflare Workers</a>
