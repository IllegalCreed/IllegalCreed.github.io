---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **ky 的上手**：安装、第一条请求、发 JSON、查询参数、错误处理、超时与重试的默认行为。版本基线 **ky 2.x**（当前 2.0.2）。对比对象：原生 `fetch`、axios。**前提认知**：ky 是 **ESM-only**，全程用 `import`。

## 速查

- 安装：`npm install ky`（或 `pnpm add ky` / `bun add ky`）
- 引入：`import ky from 'ky'`（**纯 ESM，不能 require**）
- GET + 解析 JSON：`const data = await ky.get(url).json()`
- 发 JSON：`ky.post(url, { json: { foo: true } })`（自动序列化 + 设 `Content-Type`）
- 查询参数：`ky.get(url, { searchParams: { page: 2 } })`
- 方法快捷：`ky.get / post / put / patch / head / delete`
- 默认行为：**非 2xx 抛 `HTTPError`**、**每次尝试超时 10s**、**幂等方法默认重试 2 次**
- ⚠️ 2.x 用 `baseUrl` / `prefix`（1.x 是 `prefixUrl`）
- ⚠️ 2.x 要求 **Node.js 22+**；浏览器需支持 fetch

## 一、ky 是什么

官方一句话定位：「**a tiny and elegant HTTP client based on the Fetch API**」。三个关键点：

1. **基于 fetch**：ky 复用宿主环境的原生 `fetch` 与 `Request`/`Response`/`AbortController`，不自带协议栈，所以体积极小、零依赖。
2. **极简封装**：在 fetch 之上补齐方法快捷方式、自动抛错、重试、超时、hooks 等日常刚需，让「发请求」回到一两行。
3. **浏览器优先**：主战场是现代浏览器，同时支持 Node.js 22+ / Bun / Deno 等内置 fetch 的运行时。

> 边界提醒：ky 是 **ESM-only** 包，必须 `import`。这点贯穿全篇，CommonJS 接入方式见[专家篇](./guide-line/expert)。

## 二、安装与第一条请求

```bash
npm install ky      # 或 pnpm add ky / bun add ky
```

```ts
import ky from "ky";

// GET 并把响应体按 JSON 解析——典型的 ky 一行式
const user = await ky.get("https://api.example.com/users/1").json();
console.log(user);
```

`ky.get(url)` 返回一个 **ResponsePromise**：既能直接 `await`（得到增强过的 `Response`），也能链式 `.json()` 一步拿到解析后的数据。对比原生 fetch 的两段式（`const res = await fetch(url); const data = await res.json();`），ky 把它压成一行。

## 三、发送 JSON：json 选项

```ts
// POST 一个 JSON 体
const created = await ky
  .post("https://api.example.com/users", {
    json: { name: "Ada", role: "admin" },
  })
  .json();
```

`json` 选项是发送 JSON 的快捷方式：ky 会用 `JSON.stringify()` 序列化对象，并**自动设置 `Content-Type: application/json`**。

> ⚠️ 要用 `json` 而不是 `body`。`body` 沿用原生 fetch 语义，传对象不会自动 JSON 化。`json` 才是 ky 的便利入口。

## 四、查询参数：searchParams

```ts
// 自动拼成 ?page=2&size=10
const list = await ky
  .get("https://api.example.com/users", {
    searchParams: { page: 2, size: 10 },
  })
  .json();
```

`searchParams` 接受 `URLSearchParams` 支持的各种形式：对象、字符串、二维数组、`URLSearchParams` 实例。它会与 URL 里已有的查询参数**合并**。对象里某键设为 `undefined` 会删除该参数。

> 对比 axios：axios 用 `params`，ky 用 `searchParams`（更贴近 Web 标准的命名）。

## 五、响应快捷方法

ky 在 ResponsePromise 上挂了与 Body 接口对应的快捷方法：

```ts
const json = await ky.get(url).json(); // 解析为对象/数组
const text = await ky.get(url).text(); // 文本
const blob = await ky.get(url).blob(); // Blob
const buf = await ky.get(url).arrayBuffer(); // ArrayBuffer
const form = await ky.get(url).formData(); // FormData
// 部分运行时还支持 .bytes() -> Uint8Array
```

> 没有 `.buffer()`——Node 的 `Buffer` 不是 Web 标准 Body 方法。要字节用 `.arrayBuffer()` / `.bytes()`。

## 六、默认的错误处理：非 2xx 自动抛错

这是 ky 与原生 fetch 最重要的差异：

```ts
import ky, { HTTPError } from "ky";

try {
  const data = await ky.get("https://api.example.com/missing").json();
} catch (error) {
  if (error instanceof HTTPError) {
    console.log("状态码：", error.response.status); // 如 404
    // 2.x：错误响应体在 error.data（不要再用 error.response.json()）
    console.log("错误体：", error.data);
  }
}
```

ky 默认 `throwHttpErrors: true`：**（跟随重定向后）响应状态码非 2xx 时抛 `HTTPError`**。而原生 fetch 对 404/500 仍 `resolve`（`res.ok` 为 false 但不抛）。`HTTPError` 暴露 `response` / `request` / `options` / `data`。

> 想关掉这个行为（如探测资源、本就预期错误响应）：设 `throwHttpErrors: false`，此时非 2xx 正常 resolve、需自查 `res.ok`，且**不会重试**。

## 七、超时与重试（默认行为）

```ts
// 显式覆盖默认
const data = await ky
  .get(url, {
    timeout: 5000, // 每次尝试超时 5s（默认 10000）
    retry: { limit: 3 }, // 最多重试 3 次（默认 2）
  })
  .json();
```

两个开箱默认值要记牢：

- **`timeout` 默认 10000ms**——是「每次尝试」的超时，超过抛 `TimeoutError`。设 `false` 关闭。
- **`retry.limit` 默认 2**——首次失败后最多再重试 2 次。`retry` 可直接传数字当 `limit`（`retry: 5`）。

但「重试」有前提：默认只对**幂等方法**（get/put/head/delete/options/trace，**不含 POST/PATCH**）、且只对一组**可重试状态码**（408/413/429/500/502/503/504）触发。细节见[指南 · 基础](./guide-line/base)。

---

掌握基本用法后，进入 [指南 · 基础](./guide-line/base)：前缀（baseUrl vs prefix）、重试机制全貌、hooks 入门、实例 create/extend。
