---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **axios 1.x**。深入内核与演进：v0.x→v1 关键变更、`AxiosHeaders` 规范化时机、适配器切换（含 fetch）、`transitional` 过渡开关、重试与缓存生态、安全护栏（XSRF / redact / maxDepth）。

## 速查

- **v1 迁移主线**：取消改用 `AbortController`，请求头改用 `AxiosHeaders`，跨域 XSRF 头由 `withXSRFToken` 显式控制。
- **拦截器头对象**：`config.headers` 已是 `AxiosHeaders`；优先调用 `.set()` / `.setContentType()`，直接属性访问仅作兼容。
- **适配器**：内置 `xhr`、`http`、`fetch`，可传名称数组选择首个受支持实现，也可提供返回 Axios 响应结构的自定义 adapter。
- **历史行为**：`transitional` 控制静默 JSON 解析、强制 JSON 解析和超时错误码兼容，升级时应显式测试而非长期依赖默认值。
- **重试与缓存**：axios 核心不自动重试或缓存；可用响应拦截器实现，或选择 `axios-retry`、`axios-cache-interceptor` 等社区方案。
- **XSRF**：同源默认读取 XSRF cookie；跨域发送头需要 `withXSRFToken: true`，是否携带 cookie 仍由 `withCredentials` 单独控制。
- **日志与载荷护栏**：`redact` 只影响 `AxiosError.toJSON()`；表单深度、响应大小和重定向凭据仍需按运行环境设置边界。
- **类型收窄**：用 `axios.isAxiosError()` / `isAxiosError()` 守卫未知错误，再读取 `code`、`response` 与泛型响应体。

## 一、v0.x → v1 关键变更（升级必读）

v1（2022 年发布）是 axios 的现代化里程碑，几条最影响代码的变更：

1. **`CancelToken` 弃用，改用 `AbortController`**：`signal` 配置取代 `cancelToken`（弃用自 v0.22.0，v1 延续）。
2. **`AxiosHeaders` 类**：统一头操作 API（`set/get/setContentType/setAuthorization`，大小写不敏感）；直接操作 headers 普通对象的旧写法被标注弃用。
3. **跨域 XSRF 行为变化**：v0.x 时 `withCredentials: true` 会**隐式**让跨域也发 XSRF 头；v1 起跨域发 XSRF 头需**显式** `withXSRFToken: true`。
4. **自动数据序列化增强**：按 `Content-Type` 自动序列化到 FormData / URLSearchParams（`postForm` / `getForm` / `putForm` 等快捷方法）。
5. **`transitional` 过渡开关**：把若干历史行为收敛为可配置项（见下文）。

## 二、AxiosHeaders 在拦截器中的使用

Axios 1.x 会在请求拦截器与转换器中初始化 `AxiosHeaders`，因此可直接调用大小写不敏感的方法：

```js
import axios from "axios";

api.interceptors.request.use((config) => {
  config.headers.setContentType("application/json");
  config.headers.setAuthorization("Bearer token");
  return config;
});
```

> `config.headers['Content-Type'] = '...'` 仍兼容，但官方已将直接属性访问标为弃用。若手头确实是外部 raw headers，可用 `axios.AxiosHeaders.from(raw)` 显式转换。

## 三、切换适配器（adapter）

v1 起底层实现可切，`adapter` 接受字符串或函数，也可传数组按优先级回退：

```js
import axios from "axios";

// 浏览器 XHR / Node http / 基于 fetch
axios.get("/x", { adapter: "fetch" });

// 数组：取第一个可用的（如优先 fetch，回退 xhr 再回退 http）
axios.get("/x", { adapter: ["fetch", "xhr", "http"] });

// 自定义适配器（mock、特殊传输…）
const mockAdapter = (config) =>
  Promise.resolve({ data: { ok: 1 }, status: 200, statusText: "OK", headers: {}, config });
axios.get("/x", { adapter: mockAdapter });
```

| 取值 | 底层 | 典型场景 |
|---|---|---|
| `'xhr'` | XMLHttpRequest | 浏览器（默认） |
| `'http'` | Node `http`/`https` | 服务端（默认） |
| `'fetch'` | 原生 fetch | Service Worker / Cloudflare Workers / Deno / edge |

> fetch 适配器的价值在「环境兼容」——在只暴露 fetch、没有 XHR 的运行时里沿用 axios 的拦截器/配置/错误模型；它不保证比 XHR 更快。

## 四、transitional 过渡开关

`transitional` 把若干历史行为收敛成可配置项：

```js
axios.get("/x", {
  transitional: {
    silentJSONParsing: true, // 默认 true：JSON 解析失败不抛错，data 回退为原始内容
    forcedJSONParsing: true, // 即使 responseType 非 json 也尝试按 JSON 解析
    clarifyTimeoutError: false, // 设 true：超时报 ETIMEDOUT 而非默认 ECONNABORTED
  },
});
```

| 选项 | 默认 | 含义 |
|---|---|---|
| `silentJSONParsing` | `true` | JSON 解析失败时**不抛错**，回退原始内容；设 false 则失败抛错 |
| `forcedJSONParsing` | `true` | 强制把响应按 JSON 解析（无视 responseType） |
| `clarifyTimeoutError` | `false` | 超时区分出 `ETIMEDOUT`（默认统一为 `ECONNABORTED`） |

## 五、重试与缓存：核心不内置，靠生态

axios **核心不含**自动重试与响应缓存，两条主流补法：

```js
// 1) 重试：axios-retry 插件（指数退避、自定义 retryCondition）
import axios from "axios";
import axiosRetry from "axios-retry";

const api = axios.create();
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) => axiosRetry.isNetworkOrIdempotentRequestError(err),
});

// 2) 自实现：在响应拦截器 onRejected 里判断可重试错误后用相同 config 重发（带次数上限/退避）
```

> 响应缓存可用 `axios-cache-interceptor`。这些都是社区插件，不在 axios 本体内。

## 六、安全护栏

### 1) XSRF（CSRF）防护

axios 浏览器端内置：默认读 `XSRF-TOKEN`（`xsrfCookieName`）cookie，写到 `X-XSRF-TOKEN`（`xsrfHeaderName`）请求头。是否发送由 `withXSRFToken` 控制：

```js
// 跨域要发 XSRF 头：v1 需同时显式开启 withXSRFToken
axios.get("/u", { withCredentials: true, withXSRFToken: true });
```

- `withXSRFToken: undefined`（默认）→ 仅同源请求发送；
- `true` → 包括跨域也发送；`false` → 永不发送。

### 2) 日志脱敏：redact

避免把 `Authorization` 等密钥在 `error.toJSON()` 里明文打印：

```js
axios
  .get("/u", {
    headers: { Authorization: "Bearer secret" },
    redact: ["authorization"], // 大小写不敏感、任意深度匹配
  })
  .catch((err) => {
    err.toJSON().config.headers.Authorization; //=> '[REDACTED ****]'
  });
```

### 3) 防爆栈：formSerializer.maxDepth

把对象序列化成 FormData 时限制最大嵌套深度（默认 `100`），超限抛 `AxiosError`（code `ERR_FORM_DATA_DEPTH_EXCEEDED`），防止深层嵌套 payload 触发递归**爆栈 / DoS**：

```js
axios.postForm("/api", deepData, { formSerializer: { maxDepth: 200 } }); // 确需更深时调大
```

## 七、TypeScript 实战

```ts
import axios, { AxiosError, AxiosResponse, isAxiosError } from "axios";

interface User {
  id: number;
  name: string;
}

// 泛型标注的是 response.data 的类型
const res: AxiosResponse<User> = await axios.get<User>("/user/1");
res.data.name; // 类型为 string

try {
  await axios.get<User>("/user/1");
} catch (e) {
  if (isAxiosError(e)) {
    // e 被收窄为 AxiosError，可安全取 code/response
    console.log(e.code, e.response?.status);
  }
}
```

> 用 `axios.isAxiosError` / 具名 `isAxiosError` 做类型守卫，比 `instanceof` 在多实例/打包场景更可靠。

---

回到 [入门](../getting-started) 复习用法，或查 [参考](../reference) 速览配置项、错误码与实例方法。
