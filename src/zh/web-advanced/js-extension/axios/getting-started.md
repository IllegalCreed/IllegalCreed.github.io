---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇讲 **axios 的核心用法**：安装、发请求、读响应、传参数与请求体、错误处理、超时。版本基线 **axios 1.x**。对比对象：原生 `fetch`、ky、ofetch。

## 速查

- 安装：`npm install axios`（或 `pnpm add` / `yarn add` / `bun add axios`）；自带类型，**无需** `@types/axios`
- 引入：`import axios from "axios"`（ESM）或 `const axios = require("axios")`（CJS）
- 发请求：`axios.get(url[, config])` / `axios.post(url[, data[, config]])` / 通用 `axios(config)`
- 读响应：响应在 `res.data`（已自动解析 JSON），还有 `res.status` / `res.headers` / `res.config`
- 查询串：用 `config.params`（对象）→ 自动序列化并编码到 URL
- 请求体：`post(url, data)` 第二参数即 body；DELETE 带 body 需放 `config.data`
- 超时：`{ timeout: 5000 }`（毫秒），**默认 0（不限时）**——生产务必显式设
- ⚠️ 非 2xx 默认 **reject 进 catch**（与 fetch 不同，fetch 只有网络错误才 reject）
- ⚠️ 取消请求用 **`AbortController` + `signal`**；旧 `CancelToken` 已弃用

## 一、axios 是什么

官方一句话定位：「**Promise based HTTP client for the browser and node.js**」。三个关键点：

1. **同构**：浏览器底层用 `XMLHttpRequest`、Node 底层用 `http`，对外是同一套 Promise API；v1 起还能切 fetch 适配器。
2. **便利层开箱即用**：JSON 自动序列化/解析、内置超时、拦截器、进度、XSRF——这些用原生 fetch 都要自己写。
3. **基于 Promise**：所有方法返回 Promise，可 `await` 也可 `.then().catch()`。

```js
import axios from "axios";

// 三种等价写法
axios.get("/users"); // 别名形式
axios({ method: "get", url: "/users" }); // 通用 config 形式
axios("/users"); // url + 可选 config 形式
```

> 边界提醒：axios 不是 fetch 的 polyfill，而是独立库；它也不是状态管理库，只负责发 HTTP 请求。

## 二、安装与第一个请求

```bash
npm install axios
```

```js
import axios from "axios";

// async/await：await 拿到「完整响应对象」，数据在 .data
const res = await axios.get("https://jsonplaceholder.typicode.com/todos/1");
console.log(res.data); // 已解析的 JSON 对象
console.log(res.status); // 200

// Promise 链式：等价写法
axios
  .get("/todos/1")
  .then((res) => console.log(res.data))
  .catch((err) => console.error(err));
```

::: warning 数据在 res.data，不是 res 本身
`await axios.get(...)` 得到的是 `AxiosResponse` 对象 `{ data, status, statusText, headers, config, request }`，**业务数据要从 `res.data` 取**。这与 fetch 不同——fetch 还要再 `await res.json()`。
:::

## 三、响应对象结构

```js
const response = await axios.get("/user/12345");
// response 的结构：
// {
//   data,        // 服务端返回的响应体（JSON 已自动解析）
//   status,      // HTTP 状态码，如 200
//   statusText,  // 状态文本，如 'OK'
//   headers,     // 响应头（头名小写；v1 为 AxiosHeaders，可 .get('Content-Type')）
//   config,      // 本次请求用的配置
//   request,     // 底层请求对象（浏览器 XHR / Node ClientRequest）
// }
```

> 读响应头别假设原始大小写：用小写键 `response.headers['content-type']`，或 AxiosHeaders 的 `.get('Content-Type')`（大小写不敏感）。

## 四、传查询参数：params

```js
// params 对象会被自动序列化并编码，拼到 URL 上
axios.get("/list", { params: { page: 2, size: 10, q: "hello world" } });
//=> GET /list?page=2&size=10&q=hello%20world
```

> 不要手动拼字符串（容易漏编码）。`params` 也可传 `URLSearchParams` 实例。数组等复杂结构的序列化方式可用 `paramsSerializer` 定制（见[进阶篇](./guide-line/advanced)）。

## 五、发请求体：POST / PUT / PATCH

```js
// post(url, data, config)：第二参数就是请求体
axios.post("/users", { name: "Tom", age: 18 });
//=> 自动 JSON.stringify + 带上 Content-Type: application/json

// PUT 更新
axios.put("/users/1", { name: "Jerry" });
```

::: warning DELETE 带请求体的写法
`axios.delete(url[, config])` 没有独立的 data 参数位。要带 body 必须放进 config：

```js
axios.delete("/items/1", { data: { reason: "expired" } });
```

把第二参数直接当 body（像 post 那样）是错的。
:::

## 六、错误处理：三分支

axios 默认把状态码**不在 2xx 范围**的响应当错误 reject（4xx、5xx 都进 catch）：

```js
try {
  await axios.get("/user/12345");
} catch (error) {
  if (error.response) {
    // 1) 服务器有响应，但状态码非 2xx
    console.log(error.response.status, error.response.data);
  } else if (error.request) {
    // 2) 请求已发出，但没收到响应（断网、超时等）
    console.log(error.request);
  } else {
    // 3) 在设置请求时就出错了
    console.log("Error", error.message);
  }
}
```

> 用 `axios.isAxiosError(error)` 做类型守卫（TypeScript 下会把 error 收窄为 `AxiosError`，可安全取 `error.code` / `error.response`）。常见 `error.code`：`ERR_BAD_REQUEST`（4xx）、`ERR_BAD_RESPONSE`（5xx）、`ERR_NETWORK`（网络/CORS）、`ECONNABORTED`（超时/中止）、`ERR_CANCELED`（被取消）。

## 七、超时

```js
// 单位毫秒；默认 0 表示不限时
const res = await axios.get("/slow", { timeout: 5000 });
```

> 超时默认抛 `error.code === 'ECONNABORTED'`。想在超时时拿到更明确的 `ETIMEDOUT`，设 `transitional: { clarifyTimeoutError: true }`。**生产环境强烈建议显式设置 timeout**，否则卡住的请求会一直挂着。

---

掌握核心用法后，进入 [指南 · 基础](./guide-line/base)：实例 `create`、默认配置与合并优先级、拦截器、`AxiosHeaders`。
