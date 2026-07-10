---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **ky 2.x**。本篇把「会发请求」用到「懂机制」：URL 前缀（`baseUrl` vs `prefix`）、重试机制全貌、hooks 五件套入门、实例 `create` / `extend`、请求取消。

## 速查

- **URL 基址**：`baseUrl` 按标准 `new URL()` 解析，前导 `/` 回到 origin 根；`prefix` 是字符串前缀，会剥掉 input 的前导 `/`。
- **迁移边界**：ky 2.x 已移除 `prefixUrl`；需要标准解析改用 `baseUrl`，需要旧式强制前缀语义改用 `prefix`。
- **默认重试**：`limit: 2`，只覆盖幂等方法与指定状态码；POST / PATCH 默认不重试。
- **退避节奏**：默认约 300ms、600ms、1200ms 递增；写请求若显式加入重试，业务必须提供幂等保障。
- **五类 hooks**：`init`、`beforeRequest`、`beforeRetry`、`beforeError`、`afterResponse` 均按数组顺序执行；只有 `init` 必须同步。
- **实例关系**：`create()` 从干净默认值创建实例；`extend()` 继承父实例并合并 headers、hooks、searchParams 与 context。
- **取消请求**：直接传 Web 标准 `AbortSignal`，无需库私有取消 API。

## 一、URL 前缀：baseUrl vs prefix

实际项目里很少裸写完整 URL，通常给一个基地址、各处只写相对路径。**ky 2.x 把旧 `prefixUrl` 拆成了两个语义更清晰的选项**：

| 选项 | 解析方式 | input 前导斜杠 `/` |
|---|---|---|
| `baseUrl` | 标准 URL 解析（等价 `new URL(input, baseUrl)`） | 表示「站点根」，**覆盖** base 的路径 |
| `prefix` | 纯字符串拼接（在 URL 解析之前） | 被**剥掉**，总是追加在 prefix 后 |

```ts
// baseUrl：遵循 Web 标准 URL 解析
await ky("users", { baseUrl: "https://x.com/api/" });
//=> https://x.com/api/users
await ky("/users", { baseUrl: "https://x.com/api/" });
//=> https://x.com/users   （前导 / 指向 origin 根，覆盖了 /api）

// prefix：纯拼接，剥掉前导 /
await ky("users", { prefix: "https://x.com/api/" });
//=> https://x.com/api/users
await ky("/users", { prefix: "https://x.com/api/" });
//=> https://x.com/api/users   （前导 / 被剥掉，仍接在 prefix 后）
```

::: tip 怎么选
**大多数情况用 `baseUrl`**——它符合 Web 标准、行为可预测。只有当你希望「origin-relative 的 `/users` 也被当成相对前缀拼接」时才用 `prefix`。设 `baseUrl` 含路径时建议带尾斜杠（`/api/` 而非 `/api`），让 `users`、`./users` 这类相对 input 更直觉地接在完整路径后。
:::

> ⚠️ **从 1.x 迁移**：1.x 的 `prefixUrl` 在 2.x 已不存在。最接近旧 `prefixUrl` 行为（忽略 input 前导斜杠）的是 `prefix`；想要标准解析则用 `baseUrl`。

## 二、重试机制全貌

ky 默认就会重试，但**不是任何失败都重试**。要同时满足「方法在白名单」「状态码在白名单」（或属网络错误）才触发。

```ts
await ky(url, {
  retry: {
    limit: 2, // 最多重试次数（默认 2）
    methods: ["get", "put", "head", "delete", "options", "trace"], // 默认幂等方法
    statusCodes: [408, 413, 429, 500, 502, 503, 504], // 默认可重试状态码
    backoffLimit: Infinity, // 退避延迟上限（默认 Infinity，可设如 3000 封顶）
  },
});
```

记住几条默认：

- **`limit` 默认 2**；`retry` 可直接传数字当 `limit`（`retry: 5`）。
- **`methods` 默认是六个幂等方法**——**POST / PATCH 默认不重试**（非幂等，重发可能重复创建/修改）。
- **`statusCodes` 默认 `[408, 413, 429, 500, 502, 503, 504]`**——普通 4xx（400/401/404 等）默认不重试。
- **延迟默认指数退避**：`0.3 * 2^(attemptCount-1) * 1000` 毫秒（约 300ms → 600ms → 1200ms…）。

> 想让 POST 也重试？显式把 `'post'` 加进 `methods`——但务必自己确认该接口幂等。

## 三、hooks 五件套

ky 通过 `hooks` 选项开放整条请求生命周期，每类是一个**函数数组、按序串行执行**：

| hook | 时机 | 典型用途 |
|---|---|---|
| `init` | 构造 request 前（**同步**） | 改 options：统一注入 `searchParams`、headers |
| `beforeRequest` | 请求发出前 | 改 `request.headers`（鉴权 token）；可返回 Response 短路（mock） |
| `beforeRetry` | 每次重试前 | 重试前刷新 token、改 URL；返回 `ky.stop` 静默停止 |
| `beforeError` | 抛错前 | 改写/替换错误（拼后端 message） |
| `afterResponse` | 拿到响应后 | 读/改响应；返回 `ky.retry()` 基于响应体强制重试 |

最常见的一例——统一注入鉴权头：

```ts
const api = ky.extend({
  hooks: {
    beforeRequest: [
      ({ request }) => {
        request.headers.set("Authorization", `Bearer ${getToken()}`);
      },
    ],
  },
});
```

> 除 `init` 是同步外，其余 hook **都可以是 async**，ky 会 `await` 它们——所以能在 hook 里做异步操作（刷新 token、读缓存）。更深的 hook 玩法见[进阶篇](./advanced)。

## 四、实例：create vs extend

把共享配置固化成「子客户端」，是组织 API 调用的常用手法。ky 给了两个工厂：

```ts
// create：全新实例，不继承调用者的任何默认
const api = ky.create({
  baseUrl: "https://api.example.com/",
  timeout: 8000,
  retry: 1,
});

// extend：继承父实例默认并深合并（hooks 追加、headers/searchParams/context 合并）
const authedApi = api.extend({
  hooks: {
    beforeRequest: [({ request }) => request.headers.set("Authorization", token)],
  },
});
```

核心区别就一句：**`create` 不继承父默认（从干净状态开），`extend` 继承父默认并深合并（在现有实例上叠一层）**。`extend` 返回新实例，**不会修改父实例**。

> 想移除继承来的某个 header，在 `extend` 的 `headers` 里把它的值设为 `undefined`；移除继承的某类 hook，把该类设为 `undefined`。

## 五、取消请求：AbortController

ky 不自创取消机制，直接复用 Web 标准：

```ts
const controller = new AbortController();

const promise = ky.get(url, { signal: controller.signal }).json();

// 需要时取消
controller.abort();
```

把 `controller.signal` 作为 `signal` 选项传入，调用 `controller.abort()` 即中止底层 fetch。与原生 fetch 完全一致（不像 axios 早期的 `CancelToken`）。

---

进入 [指南 · 进阶](./advanced)：hooks 实战（token 续期、mock）、`ky.retry()` 强制重试、`jitter` 抖动、`shouldRetry`、错误体系（HTTPError / NetworkError / TimeoutError）、TypeScript 泛型与 Standard Schema 校验。
