---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **ofetch 1.x**。把 ofetch 用进真实项目：create 分层与继承、responseType 与流式 / SSE、parseResponse 自定义解析、retryDelay 指数退避、TypeScript 类型、从 axios 迁移。

## 一、create 分层：基础实例派生专用实例

`create` 返回的实例本身也带 `.create()`，可以做「基础实例 → 派生子实例」：

```js
// 基础实例：公共 baseURL + 鉴权 + 错误处理
const api = ofetch.create({
  baseURL: '/api',
  onRequest({ options }) { options.headers.set('Authorization', token()) },
  onResponseError({ response }) { if (response.status === 401) logout() },
})

// 派生：继承上面全部，再叠加专用头
const adminApi = api.create({
  headers: { 'X-Admin': '1' },
})

await adminApi('/admin/stats') // 同时带 baseURL、鉴权、错误处理、X-Admin
```

> 合并规则：同名**普通选项**子覆盖父；**拦截器**则合并为数组依次执行（父的先跑）。所以子实例不会丢掉父的拦截器。

## 二、responseType 与流式 / SSE

不指定时按 content-type 智能判断；要强制某种解析，用 `responseType`：

```js
const blob = await ofetch('/file.pdf', { responseType: 'blob' })
const buf  = await ofetch('/file.bin', { responseType: 'arrayBuffer' })
const txt  = await ofetch('/raw.txt',  { responseType: 'text' })

// SSE：text/event-stream 默认就被识别为 stream
const stream = await ofetch('/sse', { responseType: 'stream' })
const reader = stream.getReader()
// 逐块读取 reader.read() ...
```

| content-type | 默认识别 |
|---|---|
| `application/...json` | `json` |
| `text/event-stream` | `stream`（SSE） |
| `text/*` 等 | `text` |
| 其它 | `blob` |

## 三、parseResponse：自定义解析

要替换默认的 `destr`（比如严格 `JSON.parse`、复活 Date、接 superjson）：

```js
// 用 reviver 把 ISO 字符串复活成 Date
await ofetch('/api/event', {
  parseResponse: (txt) =>
    JSON.parse(txt, (k, v) =>
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v
    ),
})
```

> `parseResponse` 接收的是 **responseText 字符串**（不是 Response），返回值成为最终 data。它与 `responseType` 不同：一个是自定义函数，一个是从内置类型里选一种。

## 四、retryDelay 指数退避

`retryDelay` 除了固定数字，还能给函数实现退避：

```js
await ofetch('/api/rate-limited', {
  retry: 5,
  retryDelay: (context) => {
    // 1s, 2s, 4s, 8s, 16s
    const attempt = 5 - (context.options.retry || 0)
    return Math.pow(2, attempt) * 1000
  },
})
```

函数签名是 `(context: FetchContext) => number`，返回**本次重试前等待的毫秒数**。context 里有 `options`（含剩余 retry）、`response`、`error`，可据此动态决定延迟。

::: tip 重试会重走拦截器
ofetch 的重试是「retry 减 1 后完整重走一遍请求流程」，所以**每次重试都会重新触发 onRequest/onResponse 等拦截器**。拦截器里的副作用（打日志、注入时间戳 token）要考虑这种重复执行。
:::

## 五、TypeScript：泛型与返回类型

```ts
interface User { id: number; name: string }

// json 模式：泛型 T 即返回 data 类型
const user = await ofetch<User>('/api/user')   // user: User

// responseType 与返回类型联动，无需手动断言
const blob = await ofetch('/file', { responseType: 'blob' })       // Blob
const text = await ofetch('/raw',  { responseType: 'text' })       // string
const buf  = await ofetch('/bin',  { responseType: 'arrayBuffer' })// ArrayBuffer
```

::: warning 泛型只是编译期断言
`ofetch<User>()` **不会在运行时校验**响应真为 User。要运行时校验，自己用 zod：

```ts
import { z } from 'zod'
const UserSchema = z.object({ id: z.number(), name: z.string() })
const user = UserSchema.parse(await ofetch('/api/user'))
```
:::

## 六、body 序列化的几种情况

```js
// 1. 普通对象 → JSON.stringify + content-type: application/json
ofetch('/x', { method: 'POST', body: { a: 1 } })

// 2. 显式 urlencoded → 用 URLSearchParams 序列化成 a=1&b=2
ofetch('/x', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: { a: 1, b: 2 },
})

// 3. FormData → 原样发送（运行时设 multipart 边界）
const fd = new FormData(); fd.append('file', blob)
ofetch('/upload', { method: 'POST', body: fd })

// 4. 流 → 原样发送，自动设 duplex: 'half'
ofetch('/upload', { method: 'POST', body: readableStream })
```

## 七、从 axios 迁移

| axios | ofetch |
|---|---|
| `axios.get(url)` | `ofetch(url)` |
| `res.data` | 返回值就是 data（少一层） |
| `axios.create({ baseURL })` | `ofetch.create({ baseURL })` |
| `params: {...}` | `query: {...}` |
| 拦截器 `interceptors.request.use` | `onRequest` |
| 拦截器 `interceptors.response.use` | `onResponse` / `onResponseError` |
| `error.response.data` | `error.data` |
| `error.response.status` | `error.status` |
| `onUploadProgress` | ❌（需自行用流计算） |

::: warning 迁移三大心智差异
1. **少一层 .data**：`ofetch(url)` 直接是数据，不是 `{ data }`。
2. **错误体在 error.data**，不是 `error.response.data`。
3. **写方法默认不重试**（retry=0），需要重试要显式设并保证幂等。
:::

---

进入 [指南 · 专家](./guide-line/expert)：createFetch 自定义底座、Node 代理 / dispatcher、timeout 与 abort 的重试边界、拦截器实现 401 刷新的死循环防护、SSR/Worker 同构细节。
