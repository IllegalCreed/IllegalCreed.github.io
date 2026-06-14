---
layout: doc
outline: [2, 3]
---

# 参考

> ofetch 常用 API、选项、拦截器与 FetchError 字段速查。版本基线 **ofetch 1.x**。

## 一、导入

| 写法 | 说明 |
|---|---|
| `import { ofetch } from 'ofetch'` | 增强实例（具名导出） |
| `import { $fetch } from 'ofetch'` | 同一实例的别名 |
| `import { FetchError } from 'ofetch'` | 错误类（可用于 `instanceof`） |
| `import { createFetch } from 'ofetch'` | 工厂函数，自定义底层 fetch/Headers |
| `import { fetch } from 'ofetch'` | 原生 fetch 的 polyfill（**非**增强版） |
| `import { ofetch } from 'ofetch/node'` | Node 专用子入口（undici 适配） |

## 二、调用方式

| API | 返回 | 说明 |
|---|---|---|
| `ofetch(url, opts?)` | `Promise<data>` | 自动解析后的数据 |
| `ofetch.raw(url, opts?)` | `Promise<FetchResponse>` | 完整响应，数据在 `_data` |
| `ofetch.native(...)` | `Promise<Response>` | 底层原生 fetch，无任何增强 |
| `ofetch.create(defaults, global?)` | `$Fetch` | 带默认值的新实例 |

## 三、常用选项（FetchOptions）

| 选项 | 类型 | 说明 |
|---|---|---|
| `method` | string | HTTP 方法 |
| `body` | object / string / FormData / Stream… | 可序列化对象自动 JSON 化 |
| `query` | `Record<string, any>` | 查询参数（ufo 拼接、合并） |
| `params` | `Record<string, any>` | `query` 的**已废弃别名** |
| `headers` | HeadersInit | 请求头 |
| `baseURL` | string | 基础 URL（ufo 拼接） |
| `responseType` | `json`\|`text`\|`blob`\|`arrayBuffer`\|`stream` | 解析方式，默认按 content-type |
| `parseResponse` | `(text) => any` | 自定义解析函数（替换 destr） |
| `ignoreResponseError` | boolean | 非 2xx 也不抛错 |
| `timeout` | number | 超时（毫秒），内部用 AbortController |
| `retry` | `number \| false` | 重试次数；默认 GET=1，写方法=0 |
| `retryDelay` | `number \| (ctx) => number` | 重试间隔（毫秒），可指数退避 |
| `retryStatusCodes` | `number[]` | 触发重试的状态码 |
| `signal` | AbortSignal | 手动中断 |
| `dispatcher` | undici.Dispatcher | Node≥18 走 undici 时（代理/连接池） |
| `agent` | unknown | 老 Node（node-fetch-native）代理 |
| `duplex` | `'half'` | 流式 body，通常自动设置 |

## 四、retry 默认值

| 项 | 默认 |
|---|---|
| `retry`（GET/HEAD 等读方法） | `1` |
| `retry`（POST/PUT/PATCH/DELETE） | `0`（防重复提交） |
| `retryStatusCodes` | `[408, 409, 425, 429, 500, 502, 503, 504]` |
| `retryDelay` | `0` |

> 显式给 `retry: n` 后，**所有方法**都按 n 次（不再区分读写）。

## 五、拦截器（FetchHooks）

| 钩子 | 触发时机 | context 关键字段 |
|---|---|---|
| `onRequest` | 请求发出前 | `request`, `options` |
| `onRequestError` | 请求未拿到响应（网络层失败） | `request`, `options`, `error` |
| `onResponse` | 收到响应并解析后 | `request`, `response`, `options` |
| `onResponseError` | 响应状态非 2xx | `request`, `response`, `options` |

- 每个钩子都支持**单个函数或函数数组**（`MaybeArray`）。
- `create` 默认拦截器与单次调用拦截器会**合并为数组依次执行**（非覆盖）。
- 在 `onRequest` 里 `options.headers` 已是 **Headers 实例**，改头用 `.set()`。
- 解析后的数据在 `context.response._data`。

## 六、FetchError 字段

| 字段 | 含义 |
|---|---|
| `message` | 形如 `[GET] "/x": 404 Not Found` |
| `data` | 解析后的错误响应体 |
| `status` / `statusCode` | 状态码（同值，兼容双命名） |
| `statusText` / `statusMessage` | 状态文本（同值） |
| `response` | 原始 `FetchResponse`（数据在 `_data`） |
| `request` | 请求 URL/Request |
| `options` | 本次请求选项 |
| `cause` | 底层原始错误 |

## 七、responseType ⇄ 返回类型

| responseType | TS 返回类型 | 用途 |
|---|---|---|
| `json`（默认） | 泛型 `T` | JSON 数据 |
| `text` | `string` | 纯文本 |
| `blob` | `Blob` | 二进制下载 |
| `arrayBuffer` | `ArrayBuffer` | 二进制缓冲 |
| `stream` | `ReadableStream` | 流式（含 SSE `text/event-stream`） |

## 八、content-type 自动识别（detectResponseType）

| 响应 content-type | 识别为 |
|---|---|
| `application/...json` | `json` |
| `text/event-stream` | `stream` |
| `text/*`、`image/svg`、`application/xml`/`xhtml`/`html` | `text` |
| 其它 | `blob` |

## 九、运行时依赖

| 依赖 | 作用 |
|---|---|
| `destr` | 安全 JSON 解析（失败不抛错） |
| `node-fetch-native` | 同构 fetch / 老 Node polyfill |
| `ufo` | URL 工具（`withBase` 拼 baseURL、`withQuery` 合并 query） |

---

API 查完，进 [指南 · 基础](./guide-line/base) 理解拦截器与重试机制，或 [指南 · 进阶](./guide-line/advanced) 看 create 分层、流式、自定义解析与迁移实战。
