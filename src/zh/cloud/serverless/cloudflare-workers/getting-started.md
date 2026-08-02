---
layout: doc
outline: [2, 3]
---

# 入门：V8 isolates、边缘与 CPU-time 计费

> 基于 Cloudflare Workers · 核于 2026-08

## 速查

- **Workers 定位**：Cloudflare 的**边缘 Serverless 计算平台**，代码部署后自动分发到全球 **330+ 城市边缘节点**，用户请求由最近节点执行。
- **运行时 = V8 isolates**：不用容器、不用 VM，而是 Chrome 同款 V8 引擎的 **isolate**（隔离实例）。单进程内多租户隔离，**启动约 5ms**，近乎无冷启动。
- **为什么无冷启动**：容器/VM 冷启动要拉镜像、起进程、跑 init；V8 isolate 是**进程内创建的隔离**，创建成本接近"new 一个对象"，毫秒级。
- **CPU-time 计费**：按**请求数 + CPU 时间**计费（不是墙钟/执行时长）。I/O 等待（await fetch、await KV）**不计费**——适合等待密集型（代理、聚合、边缘鉴权）。
- **330+ 城市边缘**：一次部署，全球节点都有副本。用户在上海，请求由上海/香港节点处理；P50 延迟常 < 50ms。
- **不是 Node.js**：Workers Runtime 基于 **Web 标准**（Fetch API、Request/Response、Streams、Cache API），**没有 `fs`/`child_process`/原生 `.node` 模块**。依赖原生模块的 npm 包跑不了。
- **Hono 框架**：专为边缘设计的超轻量路由框架（零依赖、TS 优先、支持 Workers/Pages/Deno/Bun），是 Workers 的事实标准 Web 层。
- **存储四件套**：**KV**（最终一致全局键值，读多写少）、**Durable Objects**（强一致、有状态、WebSocket/限流）、**R2**（S3 兼容对象存储，**零出口费**）、**D1**（边缘 SQLite）。
- **Bindings 模型**：资源（KV/DO/R2/Secret）通过 **Bindings 注入**到 Worker（`env.MY_KV`），不用连字符串/密钥硬编码，安全且可换环境。
- **CPU 时长上限**：免费版单请求 10ms CPU；付费版默认 30s（可调）。**CPU 密集任务**（图片处理、重计算）不适合。
- **进阶顺序**：[V8 isolates 与边缘](./guide-line/v8-isolates-and-edge) → [KV 与生态](./guide-line/kv-and-ecosystem) → [参考](./reference)。

## 一、Workers 是什么：边缘的 V8

传统 Serverless（Lambda）把你的函数塞进一个**容器**，部署到少数几个**区域**（region，如 us-east-1）。请求到达时，如果容器没起，就**冷启动**（拉镜像、起进程、跑 init 代码）——首次请求常延迟数百毫秒甚至数秒。

Cloudflare Workers 走了完全不同的路：①不用容器，用 **V8 isolate**；②不部署到几个区域，部署到**全球 330+ 城市边缘节点**。

```
传统 Serverless（Lambda）            Cloudflare Workers
┌──────────────────────┐           ┌──────────────────────────┐
│  单区域（us-east-1）  │           │  330+ 城市边缘节点        │
│                      │           │  香港 上海 东京 法兰克福… │
│  ┌─容器─┐ 冷启动 1s   │           │  ┌─V8 isolate─┐ 启动 5ms │
│  │ Node │            │           │  │  Worker    │          │
│  └──────┘            │           │  └────────────┘          │
└──────────────────────┘           └──────────────────────────┘
   用户跨洲访问延迟高                  用户就近访问 P50 < 50ms
```

- **V8 isolate**：Chrome 浏览器的 JS 引擎（V8）提供的一种隔离单元。一个 V8 进程里可以跑成千上万个 isolate，彼此**内存隔离**（一个 isolate 崩了不影响其他），但**共享进程与编译缓存**——所以创建成本极低。
- **为什么快**：容器冷启动是"操作系统级别"的开销（进程、镜像、init）；isolate 创建是"语言运行时级别"的开销（接近 `new Object`），毫秒级。
- **代价**：isolate 不是完整 OS，**没有系统调用能力**（fs、子进程、原生模块），所有能力靠平台注入的 API（Fetch、Bindings）。

## 二、CPU-time 计费：按 CPU 不按墙钟

Workers 的计费模型与传统 Serverless 不同——按 **CPU 时间**，不是**执行时长**：

| 模型 | 计什么 | Workers | Lambda |
| --- | --- | --- | --- |
| **请求数** | 每次调用 | ✅ 计 | ✅ 计 |
| **CPU 时间** | 实际算的时间 | ✅ **计** | ❌（按执行时长） |
| **墙钟/执行时长** | 从开始到结束（含等待） | ❌ **不计** | ✅ 计 |

- **关键洞察**：你的 Worker `await fetch(后端)` 等了 800ms，这 800ms **不计 CPU 时间**（CPU 在等 I/O，没在算）。只有真正执行 JS 的几毫秒才计费。
- **适合场景**：**等待密集型**——代理/聚合多个 API、边缘鉴权、A/B 分流、请求改写。这类场景 CPU 用得少但耗时长，Workers 计费极便宜。
- **不适合场景**：**CPU 密集型**——图片缩放、视频转码、加密哈希暴力、复杂数据处理。CPU 时间会撑爆免费额度（10ms/请求），且账单暴涨。
- **CPU 上限**：免费版单请求 **10ms CPU**；付费版默认 **30s**（可调更高）。超了直接终止。

## 三、Hono：边缘的事实标准框架

**Hono**（日语"火焰"）是为边缘运行时（Workers/Pages/Deno/Bun）设计的超轻量 Web 框架：

```ts
import { Hono } from "hono";
const app = new Hono();

app.get("/api/:id", async (c) => {
  const id = c.req.param("id");
  const val = await c.env.MY_KV.get(id); // 通过 Binding 注入 KV
  return c.json({ id, val });
});

export default app; // Workers 入口
```

- **为什么用 Hono**：原生 Workers 只有一个 `fetch` handler，路由要手写 `if (url.pathname === ...)`。Hono 提供路由、中间件、类型安全的参数、JSON/HTML 响应，且**零依赖、启动无开销**（不像 Express 要装一堆中间件拖慢冷启动）。
- **TS 优先**：Hono 用泛型把请求参数、Bindings、上下文都做成了**类型推断**——`c.env.MY_KV` 有类型提示，比裸写 Worker 体验好得多。
- **跨运行时**：同一份 Hono 代码可在 Workers、Deno、Bun、Node 跑，降低锁定。

## 四、Bindings：资源注入而非连接字符串

Workers 访问 KV/D1/Secret 不用连接字符串或硬编码密钥，而是用 **Bindings**（在 `wrangler.toml` 里声明，平台注入到 `env`）：

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "MY_KV"
id = "abc123"

[[d1_databases]]
binding = "MY_DB"
database_name = "prod"
database_id = "xyz789"
```

```ts
export default {
  async fetch(req, env) {
    await env.MY_KV.put("k", "v");        // env.MY_KV 是注入的 KV
    const row = await env.MY_DB.prepare(   // env.MY_DB 是注入的 D1
      "SELECT * FROM users WHERE id=?"
    ).bind(1).first();
    return new Response("ok");
  },
};
```

- **安全**：密钥不进代码仓库，平台按环境（dev/preview/production）注入不同 Binding。
- **零配置连接**：不用配连接字符串、不用开 TLS、不用管连接池——平台内部直接调用。

## 五、Workers vs Lambda：一句话区分

| 维度 | Cloudflare Workers | AWS Lambda |
| --- | --- | --- |
| 运行时 | **V8 isolates**（无容器） | **容器/微 VM**（Firecracker） |
| 冷启动 | **~5ms**（近乎无） | 数百 ms～秒级（SnapStart 缓解） |
| 部署位置 | **330+ 城市边缘**（就近） | 单区域（少数区域） |
| 计费 | 请求数 + **CPU 时间** | 请求数 + **执行时长**（墙钟） |
| 语言 | JS/TS（Rust/Python via WASM） | Node/Python/Java/Go/.NET/Rust |
| 适合 | 边缘鉴权、代理、轻路由、低延迟 | 事件处理、BFF、重计算、长任务 |

一句话：**Workers 赢在边缘延迟与冷启动，Lambda 赢在语言广度与 AWS 生态深度**。

## 下一步

理解了 V8 isolates、边缘部署与计费模型后，下一步深入两个机制——[V8 isolates 与边缘](./guide-line/v8-isolates-and-edge)（isolate 如何取代容器、边缘执行拓扑、运行时限制）与[KV 与生态](./guide-line/kv-and-ecosystem)（KV/Durable Objects/R2/D1、Hono、定价陷阱）。
