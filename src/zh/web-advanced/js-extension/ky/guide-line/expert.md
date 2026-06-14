---
layout: doc
outline: [2, 3]
---

# 指南 · 专家

> 版本基线 **ky 2.x**。深入 ky 的边界与机制：ESM-only 与 CommonJS 接入、`ky.stop` 的限制、`init` hook、`parseJson` 防原型污染、`context` 传上下文、`totalTimeout`/`retryOnTimeout`、上传/下载进度与 FormData、`Retry-After` 处理、与 axios/ofetch 的取舍。

## 一、ESM-only 与 CommonJS 接入

ky 是**纯 ESM 包**（`type: "module"`、`exports` 只暴露 ESM）。在 ESM 项目里直接 `import ky from 'ky'`。在 **CommonJS（`require`）项目**里：

```ts
// ❌ 不可行：会报 ERR_REQUIRE_ESM
// const ky = require('ky');

// ✅ 方案一：动态 import（CJS 里 import() 是允许的）
const { default: ky } = await import("ky");

// ✅ 方案二：把项目/该文件迁移到 ESM
// package.json 加 "type": "module"，或用 .mjs 扩展名
```

> 较新的 Node 已逐步放开「在 CJS 中 `require` ESM」，但稳妥写法仍是动态 `import()` 或整体迁 ESM。`@types/ky` 这类类型包**不能**让 `require` 生效——模块格式与类型声明是两回事。

浏览器里不打包直接用，走 ESM CDN：

```html
<script type="module">
  import ky from "https://esm.sh/ky";
  const data = await ky.get("https://api.example.com").json();
</script>
```

> ky **不提供 UMD/全局构建**，没有 `window.ky`；必须 `<script type="module">` + CDN 的 ESM URL（esm.sh / jsDelivr / unpkg）。

## 二、ky.stop：静默停止重试

`ky.stop` 是一个 Symbol，从 **`beforeRetry` hook 返回**，用来**停止重试且不抛错**：

```ts
import ky from "ky";

await ky(url, {
  hooks: {
    beforeRetry: [
      ({ retryCount }) => {
        if (someConditionMeansGiveUp) {
          return ky.stop; // 停止重试，Promise resolve 为 undefined
        }
      },
    ],
  },
});
```

::: warning ky.stop 的限制
返回 `ky.stop` 后，请求 Promise **resolve 为 `undefined`**（而非抛异常），剩余 `beforeRetry` hook 被跳过。代价是：**不能再链式 `.json()` 等 body 方法**（没有响应体可读）。要拿响应时别用 stop；它只适合「不想制造异常地放弃重试」。
:::

## 三、init hook：最早期改 options

`init` 是 2.x 新增、唯一**同步**的 hook，在「options 被用来构造 request 之前」运行，接收**可变的 options 对象**就地修改：

```ts
const api = ky.extend({
  hooks: {
    init: [
      (options) => {
        // 给每个请求统一注入查询参数
        options.searchParams = { ...options.searchParams, apiKey: getApiKey() };
      },
    ],
  },
});
```

为什么不用 `beforeRequest` 改 `searchParams`？因为 `beforeRequest` 拿到的是**已构造好的 `request`**，此时 `searchParams` 已固化进 URL，改 options 不再生效。**改 options 选 `init`，改 request 选 `beforeRequest`**。

> `init` 抛出的错误会**同步传播**，且**不会被 `beforeError` 捕获**——这点与其他 hook 不同。

## 四、parseJson：防原型污染 / 定制解析

`parseJson` 可替换默认的 `JSON.parse`，签名 `(text, { request, response }) => unknown`：

```ts
import ky from "ky";
import bourne from "@hapi/bourne";

// 用 bourne 安全解析，抵御 __proto__ 原型污染
const api = ky.extend({ parseJson: (text) => bourne(text) });
```

也可借 `JSON.parse` 的 reviver 做转换，或在此记录解析上下文日志。对应地，`stringifyJson` 可定制序列化（默认 `JSON.stringify`），如对特定字段做转换。

## 五、context：向 hooks 传上下文

`context` 让你向所有 hook 传任意上下文数据，而**不污染 request**：

```ts
const api = ky.create({
  hooks: {
    beforeRequest: [
      ({ request, options }) => {
        const { token } = options.context; // 始终是对象，无需可选链
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
  },
});

await api.get(url, { context: { token: "secret123" } });
```

`context` **保证始终是对象**（永不 undefined）。适合传鉴权 token、请求元数据、serverless 环境绑定（如 Cloudflare Workers）。注意它是**浅合并**：顶层属性合并，嵌套对象会被整体替换。

## 六、totalTimeout 与 retryOnTimeout

2.x 区分两个超时维度：

```ts
await ky(url, {
  timeout: 5000, // 每次尝试 5s（默认 10000）
  totalTimeout: 30000, // 整个操作（含所有重试与延迟）必须在 30s 内完成（默认 false）
  retry: {
    limit: 3,
    retryOnTimeout: true, // 超时也重试（默认 false！）
  },
});
```

- **`timeout`**：每次尝试的超时；超过抛 `TimeoutError`。
- **`totalTimeout`**：整个操作（含重试）的总上限——解决「单次超时不大但重试累计拖很久」。默认 `false`（无总超时）。
- **`retryOnTimeout` 默认 false**：默认**不会**因超时而重试，需显式开启。

## 七、上传/下载进度与 FormData

```ts
// 下载进度
await ky.get(url, {
  onDownloadProgress: (progress, chunk) => {
    console.log(`${Math.round(progress.percent * 100)}% - ${progress.transferredBytes}/${progress.totalBytes}`);
  },
});

// 文件上传：用 body 传 FormData，不手动设 Content-Type
const form = new FormData();
form.append("file", file);
await ky.post(url, {
  body: form, // ← 用 body，不是 json
  onUploadProgress: (progress) => console.log(progress.percent),
});
```

要点：

- 上传 `FormData` 用 **`body`**（不是 `json`），且**不要手动设 `Content-Type`**——运行时会自动带上正确的 `multipart/form-data; boundary=...`，手动设反而丢 boundary。
- `progress` 含 `percent`（0~1）、`transferredBytes`、`totalBytes`（估算，无法确定时为 0）。
- **`onUploadProgress` 有环境限制**：依赖请求流支持（Chromium 系需 HTTP/2），不支持的环境会被**静默忽略**。

## 八、Retry-After：尊重服务端节奏

对 `afterStatusCodes`（默认 `[413, 429, 503]`）里的状态码，若响应带 `Retry-After` 头，ky 会**等待该头指定的时间**（日期或秒数）再重试，而非用默认指数退避。`Retry-After` 缺失时回退到非标准的 `RateLimit-Reset` 头。若 `Retry-After` 超过 `maxRetryAfter`（默认 Infinity），取 `maxRetryAfter`。这让 ky 能自动配合限流策略。

## 九、辨析：ky vs axios vs ofetch

| 维度 | ky | axios | ofetch |
|---|---|---|---|
| 底层 | fetch | XHR（浏览器） | fetch |
| 模块 | **ESM-only** | CJS + ESM | ESM（CJS 兼容好） |
| 体积 | 极小、零依赖 | 较大 | 小 |
| 老浏览器 | 不支持（无 fetch） | **支持（XHR）** | 不支持 |
| 非 2xx | **默认抛错** | 默认抛错 | 默认抛错 |
| 拦截器/hooks | hooks 五件套 | interceptors | hooks |

**何时选 ky**：追求轻量、零依赖、贴近 Web 标准、现代运行时。**何时改选 axios**：需兼容 IE 等老浏览器、或项目必须用 CommonJS、或重度依赖 axios 成熟生态。ofetch（UnJS 系）则在「Nuxt/服务端 + 既要 fetch 又要好的 CJS 兼容」时更顺手。

---

回到 [入门](../getting-started) 复习基本用法，或查 [参考](../reference) 速览选项、默认值与错误类型。
