---
layout: doc
outline: [2, 3]
---

# 参考

> ky **2.x** 常用方法、选项、默认值、hooks、错误类型与导出速查。版本基线 **ky 2.0.2**。⚠️ ky 是 ESM-only，全部用 `import`。

## 一、方法快捷方式

| 方法 | 说明 |
|---|---|
| `ky(input, options?)` | 主函数，`input` 接受 `string \| URL \| Request` |
| `ky.get(input, options?)` | GET |
| `ky.post(input, options?)` | POST |
| `ky.put(input, options?)` | PUT |
| `ky.patch(input, options?)` | PATCH |
| `ky.head(input, options?)` | HEAD |
| `ky.delete(input, options?)` | DELETE |
| `ky.create(defaults)` | 全新实例（**不继承**父默认） |
| `ky.extend(defaults\|fn)` | 继承父默认并深合并的新实例 |
| `ky.stop` | Symbol，从 `beforeRetry` 返回以静默停止重试 |
| `ky.retry(options?)` | 从 `afterResponse` 返回以强制重试 |

> `options` / `trace` 是合法 HTTP 方法（在重试默认 methods 内），但**没有同名快捷方法**，需用 `ky(url, { method: 'options' })`。

## 二、响应快捷方法

| 方法 | 返回 |
|---|---|
| `.json<T = unknown>(schema?)` | 解析 JSON（可传 Standard Schema 校验） |
| `.text()` | 文本 |
| `.blob()` | Blob |
| `.arrayBuffer()` | ArrayBuffer |
| `.formData()` | FormData |
| `.bytes()` | Uint8Array（运行时相关） |

> 没有 `.buffer()`。直接 `await ky.get(url)` 得到（增强过的）`Response`。

## 三、核心选项与默认值

| 选项 | 默认 | 说明 |
|---|---|---|
| `method` | `'get'` | HTTP 方法，标准方法自动大写 |
| `json` | — | 发送 JSON 的快捷方式（自动序列化 + 设 Content-Type） |
| `body` | — | 原生 fetch 语义（传 FormData/流等用它） |
| `searchParams` | `''` | 查询参数（对象/字符串/数组/URLSearchParams） |
| `baseUrl` | — | 按标准 URL 解析的基地址 |
| `prefix` | — | 纯字符串拼接的前缀（剥 input 前导 /） |
| `timeout` | `10000` | **每次尝试**超时（ms），`false` 关闭 |
| `totalTimeout` | `false` | **整个操作**（含重试）总超时（ms） |
| `retry` | `2`（即 limit） | 重试配置，详见下表 |
| `throwHttpErrors` | `true` | 非 2xx 抛 HTTPError；可传 `(status)=>boolean` |
| `hooks` | 各 `[]` | 生命周期钩子 |
| `parseJson` | `JSON.parse` | 自定义 JSON 解析 |
| `stringifyJson` | `JSON.stringify` | 自定义 JSON 序列化 |
| `fetch` | 原生 `fetch` | 自定义 fetch 实现 |
| `context` | `{}` | 传给 hooks 的上下文（始终是对象，浅合并） |
| `onDownloadProgress` | — | `(progress, chunk) => void` |
| `onUploadProgress` | — | `(progress, chunk) => void`（需请求流支持） |
| `signal` | — | `AbortSignal`，用于取消 |

> ⚠️ 1.x 的 `prefixUrl` 在 2.x 已移除，拆为 `baseUrl` + `prefix`。

## 四、retry 子选项

| 子选项 | 默认 | 说明 |
|---|---|---|
| `limit` | `2` | 最多重试次数 |
| `methods` | `['get','put','head','delete','options','trace']` | 可重试方法（**不含 POST/PATCH**） |
| `statusCodes` | `[408, 413, 429, 500, 502, 503, 504]` | 可重试状态码 |
| `afterStatusCodes` | `[413, 429, 503]` | 尊重 `Retry-After` 头的状态码 |
| `maxRetryAfter` | `Infinity` | `Retry-After` 的上限 |
| `backoffLimit` | `Infinity` | 退避延迟上限（ms） |
| `delay` | `n => 0.3 * 2**(n-1) * 1000` | 延迟函数（指数退避） |
| `jitter` | `undefined` | 抖动：`true` 或 `(delay)=>number` |
| `retryOnTimeout` | `false` | 超时是否重试 |
| `shouldRetry` | `undefined` | `({error, retryCount}) => boolean\|undefined` |

> `retry` 直接传数字时被当作 `limit`，其余保持默认（`retry: 5` ≡ `retry: { limit: 5 }`）。

## 五、hooks 速查

| hook | 签名（state） | 返回 | 同步? |
|---|---|---|---|
| `init` | `(options)` | void（就地改 options） | **是** |
| `beforeRequest` | `({request, options, retryCount})` | `Request`（替换）/ `Response`（短路）/ void | 否 |
| `beforeRetry` | `({request, options, error, retryCount})` | `Request` / `Response` / `ky.stop` / void | 否 |
| `beforeError` | `({request, options, error, retryCount})` | **`Error`（必返回）** | 否 |
| `afterResponse` | `({request, options, response, retryCount})` | `Response`（覆盖）/ `ky.retry()` / void | 否 |

> `beforeRequest` 里 `retryCount` 恒为 0；`beforeRetry` 里 `retryCount >= 1`。每类 hook 是数组、按序串行执行。

## 六、错误类型

| 类 | 何时抛 | 关键属性 | 类型守卫 |
|---|---|---|---|
| `HTTPError` | 收到非 2xx 响应 | `response` / `request` / `options` / `data` | `isHTTPError` |
| `NetworkError` | 网络层失败（无响应） | `request` / `cause` | `isNetworkError` |
| `TimeoutError` | 超时 | `request` | `isTimeoutError` |
| `ForceRetryError` | `ky.retry()` 超出 limit | — | `isForceRetryError` |
| `KyError` | 上述错误的基类 | — | `isKyError` |
| `SchemaValidationError` | `.json(schema)` 校验失败 | `issues` | —（不属 KyError） |

> ⚠️ 2.x 读 `HTTPError` 的错误体用 **`error.data`**（已预解析），不要再 `error.response.json()`（body 已被消费）。

## 七、命名导出

```ts
import ky, {
  // 错误类
  HTTPError, TimeoutError, NetworkError, KyError, ForceRetryError, SchemaValidationError,
  // 类型守卫
  isHTTPError, isTimeoutError, isNetworkError, isKyError, isForceRetryError,
  // 工具
  replaceOption,
} from "ky";

// 类型（TS）
import type { Options, NormalizedOptions, Hooks, RetryOptions, KyInstance } from "ky";
```

## 八、运行环境

| 项 | ky 2.x | ky 1.x |
|---|---|---|
| 模块格式 | ESM-only | ESM-only |
| Node.js | **≥ 22** | ≥ 18 |
| 浏览器 | 现代浏览器（需 fetch） | 现代浏览器 |
| 其他运行时 | Bun / Deno | Bun / Deno |
| 依赖 | 零依赖 | 零依赖 |

## 九、1.x → 2.x 迁移要点

| 变更 | 1.x | 2.x |
|---|---|---|
| URL 前缀 | `prefixUrl` | 拆为 `baseUrl`（标准解析）+ `prefix`（纯拼接） |
| Node 门槛 | 18+ | **22+** |
| `init` hook | 无 | 新增（同步改 options） |
| `totalTimeout` | 无 | 新增（操作总超时） |
| `NetworkError` + 类型守卫 | 无 | 新增（`isHTTPError` 等） |
| 错误体读取 | `error.response.json()` | 改读 `error.data`（response body 已被消费） |

---

命令与选项查完，回 [指南 · 基础](./guide-line/base) 理解机制，或 [指南 · 专家](./guide-line/expert) 看 ESM 接入、init hook、Retry-After 等深水区。
