---
layout: doc
outline: [2, 3]
---

# KV、Durable Objects 与生态：存储、Hono 与定价

> 基于 Cloudflare Workers · 核于 2026-08

## 速查

- **存储四件套**：①**KV**（最终一致全局键值，读多写少）；②**Durable Objects**（强一致、有状态、WebSocket/限流/协同）；③**R2**（S3 兼容对象存储，**零出口费**）；④**D1**（边缘 SQLite）。
- **KV**：最终一致的**全局键值存储**。写到任一节点，几秒到几十秒同步全球。读极快（边缘就近）、写有限（全球每 key 每秒 ~1 写）。**只适合读多写少**（配置、特性开关、缓存）。
- **Durable Objects（DO）**：**强一致 + 有状态**的计算单元。每个 DO 实例（按 ID）单点存在于**一个节点**，状态强一致、可存数据、可持有 WebSocket 连接——做限流、协同编辑、实时房间、队列。
- **R2**：S3 兼容的**对象存储**。杀手锏是**零出口费**（S3 出口费是 AWS 账单大头）——存图片/视频/备份，Workers `fetch` 直读，无出口成本。
- **D1**：边缘 **SQLite**。每个 Worker 就近读本地副本，强一致写（写走主节点）。适合中小型结构化数据。
- **Hono**：边缘事实标准框架。零依赖、TS 优先、路由 + 中间件 + 类型安全的 Bindings。
- **Bindings**：资源（KV/DO/R2/D1/Secret/Queue）通过 `env` 注入，不用连接字符串。在 `wrangler.toml` 声明。
- **Wrangler**：官方 CLI——`wrangler dev`（本地仿真 Miniflare）、`wrangler deploy`、`wrangler tail`（看日志）、`wrangler kv:key list`。
- **定价要点**：免费版 10 万请求/天 + 10ms CPU/请求；付费 $5/月起，包含 1000 万请求 + 1000 万 CPU-ms。**CPU-ms 是核心计量**（不是墙钟）。
- **定价陷阱**：①CPU 密集任务 CPU-ms 暴涨；②KV 读写按次计（高频读要用 Cache API 省钱）；③R2 存储便宜但**操作次数**（Class A 写）计费；④DO 按"请求数 + 时长"双计。

## 一、KV：最终一致的全局键值

KV 是 Workers 最常用的存储，设计目标是**读多写少 + 全球低延迟读**：

```ts
// 写
await env.MY_KV.put("user:1", JSON.stringify({ name: "Ada" }));
// 读（就近边缘节点，~几 ms）
const raw = await env.MY_KV.get("user:1");
// 带过期
await env.MY_KV.put("token", "abc", { expirationTtl: 3600 });
// 列 key
const keys = await env.MY_KV.list({ prefix: "user:" });
```

- **最终一致**：写到最近节点后立即返回，**全球同步需几秒到几十秒**。所以 KV **不适合**强一致场景（如扣款、库存）。
- **写限制**：单个 key 全球约 **1 写/秒**。高频写要换 DO 或 D1。
- **读极快**：边缘节点本地缓存，读延迟常 < 10ms。
- **典型用途**：配置、特性开关、用户档案（读多写少）、HTML/JSON 缓存、JWT 黑名单（带 TTL）。

## 二、Durable Objects：强一致 + 有状态

DO 解决 KV 做不到的**强一致 + 有状态**场景。每个 DO 实例（由唯一 ID 标识）在**单一节点**运行，状态强一致、可持久化、可持有连接：

```ts
export class Counter implements DurableObject {
  state: DurableObjectState;
  constructor(state) { this.state = state; }
  async fetch(req) {
    const n = (await this.state.storage.get("n")) ?? 0;
    const next = n + 1;                    // 强一致：单点，无竞态
    await this.state.storage.put("n", next);
    return new Response(`${next}`);
  }
}
```

- **单点 = 强一致**：同一 DO ID 的请求**总路由到同一个实例**（哈希到固定节点），所以读改写无并发问题——天然解决限流、计数、协同。
- **典型用途**：①**限流**（每用户一个 DO 计数）；②**WebSocket 房间**（连接挂在 DO 上，断线重连还能找回状态）；③**协同编辑**（CRDT/OT 服务端）；④**任务队列/Alarm**（DO 可定时触发自己）。
- **代价**：DO 不像 KV 全球就近读——它在**一个节点**，远处用户访问有 RTT。所以 DO 用于**需要强一致的状态**，不用于纯缓存。

## 三、R2 与 D1：对象存储与边缘 SQL

| | **R2** | **D1** |
| --- | --- | --- |
| 模型 | 对象存储（S3 兼容） | 关系型（SQLite） |
| 一致性 | 强一致（写后立即可读） | 读副本最终一致 / 写主节点强一致 |
| 杀手锏 | **零出口费** | 边缘就近读，零 DB 运维 |
| 适合 | 图片/视频/备份/日志 | 中小型应用结构化数据 |
| 访问 | S3 API / Workers Binding | Workers Binding / REST |

- **R2 零出口费**：S3 的最大隐性成本是**出口流量费**（每 GB ~$0.09）。R2 出口**免费**——存海量图片/视频，Workers `fetch` 直读，账单只有存储 + 写操作。
- **D1 = SQLite on edge**：每个节点有读副本（就近读），写走主节点（强一致）。适合读多写少的中小应用；超大规模写要换 Neon/PlanetScale。

## 四、Hono：边缘的事实标准

Hono 是 Workers 上**事实标准**的 Web 框架，原因有三：

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono<{ Bindings: Env }>(); // 泛型注入 Bindings 类型

app.use("*", logger());
app.use("/api/*", cors());

app.get("/api/:id", async (c) => {
  const id = c.req.param("id");                 // 类型安全的参数
  const v = await c.env.MY_KV.get(id);          // 类型安全的 Binding
  if (!v) return c.json({ err: "not found" }, 404);
  return c.json({ id, v });
});

export default app;
```

1. **零依赖 + 启动无开销**：Hono 路由匹配用树结构，启动不解析中间件链——对"冷启动敏感"的 isolate 友好。
2. **TS 优先 + Bindings 类型**：用泛型把 `wrangler.toml` 里的 Bindings 类型化，`c.env.MY_KV` 有补全。
3. **跨运行时**：同一份代码可在 Workers、Deno、Bun、Node 跑——降低锁定。

## 五、Wrangler 与工作流

Wrangler 是官方 CLI，开发闭环：

```bash
npx wrangler init my-app   # 脚手架（含 TS/Hono/配置）
npx wrangler dev           # 本地仿真（Miniflare，跑真 V8 isolate）
npx wrangler deploy        # 部署到全球 330+ 节点
npx wrangler tail          # 实时日志
npx wrangler kv:key list --binding=MY_KV   # 查 KV
```

- **Miniflare**：本地跑 worker 的仿真器，模拟 KV/DO/D1/R2，离线开发。`wrangler dev` 底层就是它。
- **环境（env）**：dev / preview / production 各有独立 Bindings 与 KV/D1 实例，密钥隔离。

## 六、定价模型与陷阱

| 项 | 免费 | 付费（$5/月 Workers Paid） |
| --- | --- | --- |
| 请求数 | 10 万/天 | 1000 万/月（超出 $0.30/百万） |
| CPU 时间 | 10ms/请求 | 30s/请求；1000 万 CPU-ms/月（超出 $0.02/百万 CPU-ms） |
| KV 读 | 10 万/天 | 1000 万/月（超出 $0.50/百万） |
| KV 写 | 1000/天 | 100 万/月（超出 $5/百万） |

**陷阱清单**：

- **CPU 密集任务账单暴涨**：CPU-ms 是核心计量。一个 Worker 每请求 100ms CPU，100 万请求 = 1 亿 CPU-ms，超出免费 10 倍——重计算必须迁出。
- **高频 KV 读**：KV 按读次数计费。热点 key 高频读要用 **Cache API**（请求级缓存，不计 KV 读）或 `cacheTtl` 省钱。
- **KV 写限制**：单 key ~1 写/秒。误当通用数据库用会撞限。
- **DO 双计**：DO 既计请求数又计"时长"（按 5 万亿次/月起算的 duration）——大量小 DO 实例要算清。
- **墙钟不算钱但 CPU 算**：`await fetch` 等 800ms 不计费（CPU 没动），这是 Workers 对代理/聚合场景友好的根源——别误以为"执行久就贵"。

## 下一步

存储、Hono、定价讲完后，回到[参考](../reference)查阅运行时对比、存储矩阵、计费表与易错点清单。
