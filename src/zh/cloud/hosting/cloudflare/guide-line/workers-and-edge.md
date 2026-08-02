---
layout: doc
outline: [2, 3]
---

# Workers 与边缘计算：V8 Isolates、Pages Functions 与 Containers

> 基于 Cloudflare 官方文档（2025） · 核于 2026-08

## 速查

- **Workers**：Cloudflare 边缘计算核心，基于 **V8 Isolates**（Chrome JS 引擎的隔离执行单元，**非容器**），全球 300+ 节点，**冷启动 0-5ms**。
- **V8 Isolate vs Docker 容器**：Isolate 是进程内的轻量隔离（共享 runtime），启动几乎为零；容器是 OS 级隔离（独立文件系统/进程），启动数百毫秒到秒。Workers 选 Isolate 换来了极致冷启动，代价是不能跑任意语言/完整 Node 生态。
- **支持的语言**：原生 JS/TS，加 Rust/C/C++/Python（编译成 **WASM**）；**不支持完整 Node.js**（无 `fs`/原生 `.node` 模块），用 Web 标准 API + Cloudflare 扩展。
- **绑定（bindings）**：Workers 通过声明式绑定原生访问 R2/D1/KV/Queues/Durable Objects，无需 API key/SDK，代码里 `env.MY_BUCKET.get()` 直接用。
- **CPU 时间限制**：免费层 10ms CPU/请求，付费 30s+——Workers 设计目标是"海量短请求"，长任务交给 Containers。
- **Pages Functions**：Pages 内置的边缘函数能力，本质是 Workers 的 Pages 集成形态——在静态站项目里放 `/functions/` 目录，文件即路由，自动部署为 Workers。
- **Durable Objects**：Workers 的**有状态**扩展——单一全局唯一的对象实例（带存储），用于需要强一致协调的场景（在线协作、限流计数、WebSocket 后端）。
- **Containers（2025）**：让 Workers 编排**任意语言的 Docker 容器**，支持长任务、重计算、完整 OS——补齐 V8 Isolates 不能跑重逻辑的短板。
- **Workers + Containers 协同**：Workers 做轻量边缘入口（鉴权/路由/缓存），重逻辑下放 Containers，形成边缘混合架构。
- **Queues**：Workers 的消息队列服务，解耦生产者/消费者，用于异步任务、削峰填谷。

## 一、V8 Isolates：为什么 Workers 冷启动这么快

Workers 的性能秘密在 runtime 模型——它不用 Docker 容器，而用 V8 的 **Isolate**：

```
传统容器 Serverless（AWS Lambda）：
  请求 → 启动容器（拉镜像/起进程/初始化 runtime）→ 冷启动数百 ms 到秒
       → 执行代码 → （空闲后）销毁容器

Cloudflare Workers（V8 Isolates）：
  一个 Cloudflare 边缘进程常驻，内含成百上千个 V8 Isolate
  请求 → 复用已就绪的 Isolate 或即时创建（μs 级）→ 冷启动 0-5ms
       → 执行代码 → Isolate 可即时回收
```

- **Isolate 是什么**：V8 引擎（Chrome 的 JS 引擎）的隔离执行环境，同一进程内的不同 Isolate 共享 V8 runtime 但内存/堆隔离。启动一个 Isolate 是微秒级（vs 容器的进程级）。
- **代价**：Isolate 不是 OS 级隔离（没有独立文件系统/网络栈），所以**不能跑任意语言/完整 Node**——只能跑 V8 支持的 JS/TS/WASM。
- **收益**：极致冷启动 + 极高密度（单机成千上万 Isolate），让 Workers 能做到"每个请求都几乎零冷启动成本"。

## 二、Workers 的运行时与限制

理解 Workers 能跑什么、不能跑什么：

```ts
// 一个最简 Worker
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // 通过绑定直接访问 R2（无需 API key）
    const obj = await env.MY_BUCKET.get("file.txt");
    // 通过绑定访问 D1（无需连接字符串）
    const { results } = await env.DB.prepare("SELECT * FROM users").all();
    return new Response(`Hello!`);
  },
};
```

- **能用**：Web 标准 API（`fetch`/`Request`/`Response`/`Headers`/`crypto.subtle`/`URL`）、Cloudflare 扩展（`HTMLRewriter`）、WASM 模块、绑定（R2/D1/KV/Queues/Durable Objects）。
- **不能用**：Node 内置模块（`fs`/`child_process`/`net`）、原生 `.node` 模块、依赖完整 Node API 的库（部分 npm 包不兼容）。
- **CPU 时间**：免费层每请求 **10ms CPU**（不是墙钟时间，是实际占用 CPU）；付费（Workers Paid $5/月）每请求最高 30s CPU——Workers 设计目标是海量短请求。
- **内存**：默认 128MB/请求。
- **兼容性策略**：用 `nodejs_compat` 标志可启用部分 Node API 兼容层，但不是完整 Node。

## 三、Pages Functions：静态站 + 边缘 API

Pages 不只是静态托管，还能加边缘动态逻辑：

- **目录约定**：在 Pages 项目根放 `/functions/` 目录，文件即路由。`/functions/api/hello.ts` 自动匹配 `/api/hello`，部署为 Workers。
- **本质**：Pages Functions 是 Workers 的 Pages 集成形态——共享 Workers runtime（V8 Isolates）、绑定、限制。
- **用途**：静态站 + 边缘 API（鉴权、表单处理、A/B 分流、动态数据拼装），无需单独维护 Workers 项目。
- **静态优先**：先匹配静态文件，再匹配 Functions 路由——静态资源走 CDN 极快路径，动态逻辑走 Workers。

## 四、Durable Objects：有状态的边缘协调

Workers 本身是无状态的（每次请求独立），但有些场景需要**全局唯一的有状态协调**——Durable Objects 补这个空缺：

- **模型**：一个 Durable Object 是全球唯一的对象实例（按 ID 路由），带持久存储，强一致。
- **用途**：在线协作（多人编辑同一文档）、限流计数（精确的全局计数器）、WebSocket 后端（长连接协调）、分布式锁。
- **与 KV 区别**：KV 是最终一致的无状态键值；Durable Objects 是强一致的有状态对象——选型看是否需要强一致协调。

## 五、Containers（2025）：补齐长任务短板

V8 Isolates 擅长海量短请求，但不擅长长任务、重计算、任意语言。2025 年 Containers 补齐这块：

- **能力**：在 Cloudflare 边缘跑 Docker 容器，支持**任意语言**（Java/Go/Python 完整运行时）、长任务、有状态服务、需要完整 OS 的负载。
- **触发方式**：Workers 通过 API 启动/管理容器，容器可常驻或按需启动。
- **典型场景**：机器学习推理（Python/PyTorch）、视频转码（FFmpeg）、长连接服务（WebSocket/SSE 后端）、需要 JVM 的传统 Java 应用。
- **Workers + Containers 协同**：Workers 做边缘入口（鉴权/路由/缓存/限流，毫秒响应），重逻辑下放 Containers（按需启动）——形成"轻边缘 + 重容器"的混合架构，兼顾低延迟与计算能力。

## 六、Queues：异步消息

Queues 是 Workers 的消息队列，解耦生产者/消费者：

- **模型**：生产者 Worker 把消息推入队列，消费者 Worker 异步拉取处理。
- **用途**：异步任务（发邮件/生成报表）、削峰填谷（突发流量先入队再慢慢处理）、解耦（订单服务与库存服务）。
- **与 Durable Objects 区别**：Queues 是无状态消息传递；Durable Objects 是有状态协调——选型看是"传消息"还是"共享状态"。

## 下一步

掌握 Workers 与边缘计算后，下一站进入[R2 / D1 / KV 存储与数据库](./storage-and-db)——三大存储服务的模型、一致性、选型与实践。
