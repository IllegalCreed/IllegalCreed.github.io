---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **ofetch 1.x**。深入内核与工程实践：createFetch 自定义底座、Node 代理 / dispatcher、timeout 与 abort 的重试边界、拦截器实现 401 刷新的死循环防护、同构 fetch 选择、依赖与解析机制。

## 速查

- **自定义底座**：`createFetch()` 可注入 fetch、Headers、AbortController 与 defaults；`ofetch.create()` 复用当前底座并合并默认选项。
- **Node 网络层**：Node 18+ 通过 undici `dispatcher` 配置代理或连接池；旧 polyfill 环境才使用 `agent`。
- **中止与重试**：纯手动 `signal.abort()` 视为用户取消并跳过重试；由 `timeout` 触发的中止仍可能进入 retry 流程。
- **401 刷新**：必须同时设置单次重试标记和共享刷新 Promise，分别阻止死循环与并发重复刷新。
- **请求前阻断**：`onRequest` 没有 `return false` 约定；要取消就抛错或触发 AbortSignal。
- **同构入口**：浏览器 / Worker 优先平台 fetch，Node 入口适配 undici 或 `node-fetch-native`。
- **解析内核**：默认使用 `destr`；HEAD 及 101 / 204 / 205 / 304 跳过 body 解析，错误提供 `status` / `statusCode` 双命名。
- **能力边界**：ofetch 提供解析、序列化、错误、retry、timeout、URL 与 hooks；运行时校验、进度、缓存和 token 刷新仍由应用负责。

## 一、createFetch：自定义底层 fetch / Headers

`ofetch` 是 `createFetch()` 用默认全局对象建出来的。需要注入自定义底座时直接用 `createFetch`：

```js
import { createFetch } from 'ofetch'

const myFetch = createFetch({
  fetch: customFetchImpl,           // 自定义 fetch（如测试 mock、特定 polyfill）
  Headers: CustomHeaders,
  AbortController: CustomAbortController,
  defaults: { baseURL: '/api', retry: 1 },
})
```

> `CreateFetchOptions` 含 `fetch` / `Headers` / `AbortController` / `defaults`。`ofetch.create(defaults)` 是它的便捷封装（沿用同一底座、只合并 defaults）。

## 二、Node 端代理 / 连接池：dispatcher 与 agent

```js
import { ProxyAgent } from 'undici'

// Node ≥ 18 走 undici：传 dispatcher
await ofetch('/api', {
  dispatcher: new ProxyAgent('http://127.0.0.1:7890'),
})

// 老 Node（node-fetch-native polyfill）：传 agent
await ofetch('/api', { agent: someHttpAgent })
```

> ofetch 没有 axios 式的 `proxy` 字符串选项。Node 端控制底层网络（代理、连接池、TLS）走 `dispatcher`（undici）或 `agent`（polyfill）。

## 三、timeout 与 abort 的重试边界（易错）

源码里判断是否「中止」的逻辑：`isAbort = error.name === 'AbortError' && !options.timeout`。结合重试流程：

| 场景 | 是否重试 |
|---|---|
| 手动 `signal.abort()`（**未**设 timeout） | **不重试**（isAbort 为真） |
| timeout 到点导致的中断（设了 timeout） | **会重试**（isAbort 为假，因 options.timeout 有值） |

```js
// 这个 timeout 中断，仍可能被 retry 再试
await ofetch('/slow', { timeout: 1000, retry: 2 })

// 这个手动 abort，不会被重试
const c = new AbortController()
setTimeout(() => c.abort(), 500)
await ofetch('/slow', { signal: c.signal, retry: 2 }) // abort 后直接抛出
```

> 直觉上「用户主动取消不该重试」——ofetch 正是这么设计的：纯手动 abort（无 timeout）被视为用户意图，跳过重试。

## 四、拦截器实现 401 刷新 token：防死循环

在 `onResponseError` 里刷新 token 并重发，是常见模式，但有两个必须处理的坑：

```js
let refreshing = null  // 并发去重

const api = ofetch.create({
  baseURL: '/api',
  async onResponseError({ request, response, options }) {
    // 坑 1：加重试标记，防止刷新后仍 401 → 无限循环
    if (response.status === 401 && !options._retried) {
      // 坑 2：并发请求同时 401，只刷新一次
      refreshing ??= refreshToken().finally(() => { refreshing = null })
      await refreshing
      // 重发本次请求（带标记，避免再次进入刷新）
      return api(request, { ...options, _retried: true })
    }
  },
})
```

::: warning 两个必处理点
1. **死循环**：刷新后若仍 401（refresh 也失效），不加标记会无限刷新→重发。
2. **并发去重**：多个请求同时 401，应只触发一次刷新，其余等同一个 Promise。
:::

## 五、在 onRequest 中止请求

ofetch 拦截器**没有** `return false` 取消的约定。要在发出前中止，**抛错**或 abort signal：

```js
const api = ofetch.create({
  onRequest({ options }) {
    if (!isOnline()) {
      throw new Error('离线，已拦截请求')  // 跳过实际 fetch，走错误流程
    }
  },
})
```

> 抛出的错误会被 `catch` 捕获，请求不会真正发出。`return false` / 删 `context.request` 都不是受支持的取消方式。

## 六、同构 fetch 的选择逻辑

ofetch 默认用 `globalThis.fetch`，但 `package.json` 的条件导出对不同环境给了不同入口：

| 环境（exports 条件） | 入口 | 底层 fetch |
|---|---|---|
| browser / worker / deno / edge-light / netlify… | `index.mjs` | 平台原生 fetch |
| node（import/require） | `node.mjs` / `node.cjs` | undici（Node≥18），缺则 node-fetch-native polyfill |

```text
现象：同一份业务代码在浏览器、Cloudflare Worker、Node 服务里都能跑
根因：ofetch 同构 —— 优先用平台原生 fetch，Node 端经 node.mjs 适配 undici，
      老 Node 缺 fetch 时由 node-fetch-native 兜底
要点：你几乎不用关心环境差异，这正是 ofetch「Works on node, browser and workers」的实现
```

## 七、解析与错误的内核细节

- **解析器**：默认 `destr`，比 `JSON.parse` 鲁棒——合法 JSON（含标量 `42`/`true`）解析为对应值，非法输入退回原始字符串，不抛错。
- **无体响应**：`HEAD` 方法及 `nullBodyResponses = [101, 204, 205, 304]` 跳过 body 解析。
- **FetchError 双命名**：`status`/`statusCode` 同值（皆 `response.status`）、`statusText`/`statusMessage` 同值，兼容 fetch 风格与 Node/h3 风格。
- **错误 message**：`createFetchError` 拼成 `[METHOD] "URL": status statusText`，并 `Error.captureStackTrace` 精简栈。

## 八、辨析：ofetch 做了什么 vs 没做什么

| ofetch 替你做了（相对 fetch） | ofetch **没**做（需自己） |
|---|---|
| 自动解析响应（destr） | 运行时类型校验（用 zod） |
| 自动序列化 JSON body | 上传/下载进度（用流自算） |
| 非 2xx 自动抛 FetchError | token 刷新逻辑（在拦截器写） |
| 内置 retry / timeout | 请求取消的高层封装（用 signal） |
| baseURL / query 拼接（ufo） | CORS / cookie 策略（由浏览器/服务端定） |
| 拦截器四钩子 | 缓存 / 去重（用 useFetch 或自建） |

---

回到 [入门](../getting-started) 复习主线，或查 [参考](../reference) 速览 API、选项与 FetchError 字段。
