---
layout: doc
outline: [2, 3]
---

# 入门

> 本篇带你从安装到「请求 → 自动解析 → 传 body → 处理错误 → 加 query / baseURL」跑通 ofetch 的主线。版本基线 **ofetch 1.x**。对比对象：axios（XHR、体积大）、ky（同为 fetch 封装）、原生 fetch。

## 速查

- 安装：`npm install ofetch`
- 导入：`import { ofetch } from 'ofetch'`（具名导出；别名 `$fetch` 指向同一实例）
- 取数据：`const data = await ofetch('/api/user')` → **已解析的对象**，无需 `.json()`
- 传 body：`ofetch('/api', { method: 'POST', body: { name: 'foo' } })` → **自动 JSON 化**
- 加 query：`ofetch('/api/list', { query: { page: 2 } })`（底层 ufo，可与 URL 已有 query 合并）
- 完整响应：`ofetch.raw(url)` → 含 `status` / `headers`，数据在 `response._data`
- 错误：非 2xx **自动抛 FetchError**，错误体在 `error.data`，状态码在 `error.status`
- 实例：`const api = ofetch.create({ baseURL: '/api' })`
- ⚠️ 写方法（POST 等）默认 **retry=0**；GET/HEAD 默认 retry=1
- ⚠️ Nuxt 的 `$fetch` 就是 ofetch

## 一、ofetch 是什么

官方一句话定位：「**A better fetch API. Works on node, browser and workers.**」。三个关键点：

1. **同构**：Node / 浏览器 / Worker 一套代码，默认用 `globalThis.fetch`。
2. **更易用**：自动解析响应、自动序列化 body、非 2xx 抛错、内置重试与超时。
3. **fetch 底座**：它是封装而非重写，行为与 fetch API 对齐，CORS/cookie 等仍由底层 fetch 决定。

> 边界提醒：ofetch **不自带网络栈**，底层就是 fetch；它也**不做运行时类型校验**与**进度回调**，这些在[进阶](./guide-line/advanced)与[专家](./guide-line/expert)展开。

## 二、安装与第一行代码

```bash
npm install ofetch
```

```js
import { ofetch } from 'ofetch' // 具名导出
// const { ofetch } = require('ofetch') // CommonJS

const user = await ofetch('/api/user')   // 直接拿到解析后的对象
console.log(user.name)                   // 无需 await res.json()
```

> 对比原生 fetch：`await fetch(url).then(r => r.json())` 两步，ofetch 一步到位。要原始 `Response` 用 `ofetch.raw()`（见下文）。

## 三、自动解析响应

ofetch 默认按响应的 `content-type` **智能选择解析方式**：

```js
const json = await ofetch('/api/data')          // application/json → 对象
const html = await ofetch('/page.html')          // text/* → 字符串
const img  = await ofetch('/logo.png', { responseType: 'blob' }) // 强制 Blob
```

可选 `responseType`：`json`（默认）、`text`、`blob`、`arrayBuffer`、`stream`。

::: tip 解析很鲁棒
ofetch 默认解析器是 `destr`，比 `JSON.parse` 更稳：合法 JSON（含 `42`、`true` 这类标量）解析为对应值；**非法 JSON 不抛错，原样返回字符串**。
:::

## 四、发请求带 body（自动序列化）

```js
// POST 传普通对象 → 自动 JSON.stringify，并补 content-type / accept
await ofetch('/api/user', {
  method: 'POST',
  body: { name: 'foo', age: 18 },
})

// 其它方法同理
await ofetch('/api/user/1', { method: 'PATCH', body: { age: 19 } })
await ofetch('/api/user/1', { method: 'DELETE' })
```

::: warning 只有「可序列化对象」才自动 JSON 化
普通对象 / 数组会被自动 `JSON.stringify`。而 `FormData`、`URLSearchParams`、`Blob`、`ReadableStream` **不会**被 JSON 化，会原样发送（流 body 还会自动设 `duplex: 'half'`）。
:::

## 五、查询参数 query

```js
// 对象形式，底层用 ufo 拼接并编码
await ofetch('/api/list', { query: { page: 2, size: 10 } })
// → /api/list?page=2&size=10

// 与 URL 已有 query 合并（不是覆盖）
await ofetch('/api/list?b=2', { query: { a: 1 } })
// → /api/list?b=2&a=1
```

> `params` 是 `query` 的**已废弃别名**，仍可用但推荐 `query`。

## 六、错误处理：非 2xx 自动抛错

原生 fetch 只在网络层失败才 reject，4xx/5xx 仍 resolve。ofetch **修正**了这点——状态码非 2xx 时抛 `FetchError`：

```js
import { ofetch, FetchError } from 'ofetch'

try {
  await ofetch('/api/not-found')
} catch (err) {
  console.log(err.message)   // [GET] "/api/not-found": 404 Not Found
  console.log(err.data)      // 服务端返回的错误体（已解析）
  console.log(err.status)    // 404
  console.log(err.statusText)// "Not Found"
}

// 也可内联拿错误体
const body = await ofetch('/api/maybe-fail').catch(e => e.data)
```

::: warning 从 axios 迁来的头号坑
axios 错误体在 `error.response.data`，**ofetch 在 `error.data`**。别找错地方。
:::

## 七、复用配置：ofetch.create

给一组 API 统一加 baseURL、公共头、重试、拦截器，用 `ofetch.create`：

```js
const api = ofetch.create({
  baseURL: 'https://x.com/api',
  headers: { 'X-App': 'demo' },
  retry: 2,
  timeout: 10000,
})

await api('/users')        // 实际请求 https://x.com/api/users，自动套用所有默认值
await api('/users/1', { method: 'DELETE' })
```

> 类似 axios 的 `axios.create`。它返回的实例本身还能再 `.create()` 派生子实例（见[基础篇](./guide-line/base)）。

---

掌握主线后，进入 [指南 · 基础](./guide-line/base)：拦截器四钩子、retry/timeout 默认值、ofetch.raw 与 _data、与 axios/ky 的取舍。
