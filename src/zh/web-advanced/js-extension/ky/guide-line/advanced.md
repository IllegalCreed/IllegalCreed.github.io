---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **ky 2.x**。把 ky 用进真实项目：hooks 实战（token 续期 / mock）、`ky.retry()` 强制重试、`jitter` 抖动与 `shouldRetry`、错误体系、TypeScript 泛型与 Standard Schema 校验、自定义 fetch。

## 一、hooks 实战：401 自动续期

最经典的鉴权场景——首次拿到 401 时刷新 token 并重试一次：

```ts
const api = ky.create({
  baseUrl: "https://api.example.com/",
  hooks: {
    afterResponse: [
      async ({ request, response, retryCount }) => {
        // 只在「首次」401 续期，用 retryCount 防无限循环
        if (response.status === 401 && retryCount === 0) {
          const { token } = await ky.post("https://api.example.com/auth/refresh").json();
          const headers = new Headers(request.headers);
          headers.set("Authorization", `Bearer ${token}`);
          // 用带新 token 的请求强制重试
          return ky.retry({
            request: new Request(request, { headers }),
            code: "TOKEN_REFRESHED",
          });
        }
      },
    ],
  },
});
```

要点：**基于响应状态码做续期，放在 `afterResponse` 最自然**（此时已拿到 401 响应）；用 `retryCount === 0` 避免反复刷新。

## 二、beforeRequest 短路：mock / 读缓存

`beforeRequest` 返回值有特殊语义：

- 返回一个 **`Request`** → **替换**即将发出的请求（后续 beforeRequest 仍基于新 request 运行）。
- 返回一个 **`Response`** → **完全跳过 HTTP 请求**（用于 mock、命中内部缓存等；剩余 beforeRequest 被跳过）。

```ts
const api = ky.extend({
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const cached = cache.get(request.url);
        if (cached) {
          // 直接返回 Response，跳过真实网络请求
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    ],
  },
});
```

> 注意：`beforeRequest` 抛出的错误被视为**致命**，不会触发 ky 的重试逻辑。

## 三、ky.retry()：基于响应内容强制重试

有时状态码是 200，但响应体里藏着业务错误码（如限流），也需要重试。`afterResponse` 里返回 `ky.retry(options)` 即可：

```ts
const api = ky.extend({
  hooks: {
    afterResponse: [
      async ({ response }) => {
        if (response.status === 200) {
          const data = await response.json();
          if (data.error?.code === "RATE_LIMIT") {
            return ky.retry({
              delay: data.error.retryAfter * 1000, // 自定义延迟（绕过 jitter/backoffLimit）
              code: "RATE_LIMIT",
            });
          }
        }
      },
    ],
  },
});
```

`ky.retry()` 可带 `delay`（自定义延迟）、`code`（机器可读标识，出现在 `beforeRetry` 的 `ForceRetryError` 里）、`cause`（保留错误链）、`request`（用自定义请求重试，如切备用端点）。它**遵守 `retry.limit`**、跳过 `shouldRetry` 检查。

## 四、jitter 抖动与 shouldRetry

**`jitter`** 对抗「惊群效应」（大量客户端同时重试压垮服务器）：

```ts
await ky(url, {
  retry: {
    limit: 5,
    jitter: true, // full jitter：把延迟随机化到 0~计算值之间
    // 或自定义：jitter: (delay) => delay * (0.8 + Math.random() * 0.4)
  },
});
```

> 服务端给了 `Retry-After` 时**不施加 jitter**——尊重服务端的明确节奏。

**`shouldRetry`** 完全接管「是否重试」的判断（优先于默认状态码/超时检查）：

```ts
import ky, { HTTPError } from "ky";

await ky(url, {
  retry: {
    limit: 3,
    shouldRetry: ({ error, retryCount }) => {
      if (error instanceof HTTPError) {
        const status = error.response.status;
        if (status === 429 && retryCount <= 2) return true; // 限流前两次重试
        if (status >= 400 && status < 500) return false; // 其余 4xx 不重试
      }
      return undefined; // 回退默认逻辑
    },
  },
});
```

> `shouldRetry`（决定**是否**重试）与 `beforeRetry` hook（**确定重试后**改请求）分工不同，别混用。

## 五、错误体系：三种错误分清楚

ky 2.x 把失败分成不同类型，应分别处理：

| 错误 | 何时抛 | 关键属性 |
|---|---|---|
| `HTTPError` | 收到了非 2xx 响应 | `response` / `request` / `options` / `data` |
| `NetworkError` | 网络层失败（DNS/连接拒绝/离线，没收到响应） | `request` / `cause`，**无 response** |
| `TimeoutError` | 超时 | `request` |

```ts
import ky, { isHTTPError, isNetworkError, isTimeoutError } from "ky";

try {
  await ky.get(url).json();
} catch (error) {
  if (isHTTPError(error)) {
    console.log("HTTP 错误", error.response.status, error.data);
  } else if (isNetworkError(error)) {
    console.log("网络错误", error.cause);
  } else if (isTimeoutError(error)) {
    console.log("超时");
  }
}
```

> **优先用类型守卫 `isHTTPError()` 等，而非 `instanceof`**——跨打包/多实例场景下守卫更稳健，且能正确收窄 TS 类型。

::: warning 2.x 读错误体的陷阱
2.x 会在抛错前把响应体预解析进 `error.data`（JSON 类型自动解析），**为此已经消费了 `error.response` 的 body**。所以**不要再调 `error.response.json()`**（会失败），直接读 `error.data`。填充受 `timeout` 与 **10 MiB** 体积上限约束。
:::

## 六、TypeScript：泛型与 Standard Schema 校验

`.json()` 默认返回 **`unknown`**（刻意不用 `any`，更安全）。给类型有两种等价写法：

```ts
interface User { id: number; name: string }

const u1 = await ky.get<User>("/users/1").json(); // 方法级
const u2 = await ky.get("/users/1").json<User>(); // 调用级
```

更进一步，2.x 的 `.json(schema?)` 支持传入 **Standard Schema**（Zod / Valibot / ArkType 等）做**运行时校验 + 类型推断**：

```ts
import { z } from "zod";

const User = z.object({ id: z.number(), name: z.string() });

// 校验通过返回带类型的数据；失败抛 SchemaValidationError（带 issues）
const user = await ky.get("/users/1").json(User);
```

> `SchemaValidationError` 不属于 `KyError` 体系——它代表「用户 schema 拒绝」，而非 ky 生命周期失败。

## 七、自定义 fetch

`fetch` 选项可替换底层实现（默认宿主原生 fetch），用于 SSR 框架的 fetch、全局埋点等：

```ts
const api = ky.create({
  fetch: async (input, init) => {
    const start = performance.now();
    const response = await fetch(input, init);
    console.log(`${response.status} (${Math.round(performance.now() - start)}ms)`);
    return response;
  },
});
```

> 对比 axios 的 `adapter`：ky 用 `fetch` 选项，且要求传入的实现兼容 Fetch API 标准。

---

进入 [指南 · 专家](./expert)：ESM-only 与 CommonJS 接入、`ky.stop` 的限制、`init` hook 深用、`parseJson` 防原型污染、`context` 传上下文、`totalTimeout` 与 `retryOnTimeout`、上传/下载进度与 FormData。
