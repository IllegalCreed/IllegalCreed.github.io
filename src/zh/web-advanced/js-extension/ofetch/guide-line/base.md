---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **ofetch 1.x**。本篇把「会用」升级到「懂机制」：四个拦截器、retry / timeout 默认行为、ofetch.raw 与 _data、ignoreResponseError、与 axios/ky 的取舍。

## 一、四个拦截器：请求生命周期

ofetch 在请求生命周期上挂了四个钩子，都接收一个 `context` 对象：

```js
const api = ofetch.create({
  // 1. 请求发出前
  onRequest({ request, options }) {
    options.headers.set('Authorization', `Bearer ${getToken()}`)
  },
  // 2. 请求未拿到响应（网络层失败）
  onRequestError({ request, error }) {
    console.error('网络失败', error)
  },
  // 3. 收到响应并解析后
  onResponse({ request, response }) {
    console.log('状态', response.status, '数据', response._data)
  },
  // 4. 响应状态非 2xx
  onResponseError({ request, response }) {
    if (response.status === 401) redirectToLogin()
  },
})
```

| 钩子 | 触发条件 | 有 `response`？ |
|---|---|---|
| `onRequest` | 发出前 | 否 |
| `onRequestError` | 连响应都没拿到（断网/DNS/连接拒绝） | 否 |
| `onResponse` | 任意响应（含成功）回来并解析后 | 是 |
| `onResponseError` | 响应回来但状态非 2xx | 是 |

::: tip onRequestError vs onResponseError
一句话区分：**有没有响应**。`onRequestError` 是「连服务器都没连上」；`onResponseError` 是「连上了，但返回了 4xx/5xx」。
:::

## 二、拦截器里改请求头：headers 是 Headers 实例

进入 `onRequest` 时，ofetch 已把 `options.headers` 规整为 **`Headers` 实例**，必须用 Headers API 改：

```js
onRequest({ options }) {
  options.headers.set('Authorization', token)  // ✅ 正确
  // options.headers.Authorization = token      // ❌ 对 Headers 实例赋属性无效
}
```

::: warning 常见坑
直接 `options.headers.xxx = ...` 不会写入头部。新增/修改头一律 `.set()`，多值用 `.append()`。
:::

## 三、单个函数 or 数组：拦截器可以叠加

拦截器类型是 `MaybeArray<FetchHook>`，既能传一个函数，也能传数组：

```js
const api = ofetch.create({
  onRequest: [logHook, authHook],   // 依次执行
})

// 单次调用再加一个，不会覆盖实例级，而是合并
await api('/x', {
  onRequest({ options }) { options.headers.set('X-Trace', id) },
})
// 实际执行顺序：logHook → authHook → 本次的
```

> 这是 ofetch 对 hooks 的**特殊合并语义**：同名拦截器拼成数组依次跑，与普通选项「后者覆盖前者」不同。

## 四、retry：默认值与触发条件

```js
await ofetch('/api/data')                 // GET 默认重试 1 次
await ofetch('/api/create', { method: 'POST' }) // POST 默认 0 次

await ofetch('/api/flaky', {
  retry: 3,
  retryDelay: 500,                        // 每次重试间隔 500ms
  retryStatusCodes: [429, 503],           // 只对这些状态码重试
})

await ofetch('/api/x', { retry: false })  // 完全关闭重试
```

默认 `retryStatusCodes`：`[408, 409, 425, 429, 500, 502, 503, 504]`——超时、冲突、Too Early、限流、5xx 网关/服务端临时错误。`404`/`401`/`400` 这类**不在**默认列表。

::: warning 为什么 POST 默认不重试
POST/PUT/PATCH/DELETE 多为非幂等操作，自动重试可能重复下单/扣款。GET/HEAD 幂等，故默认重试 1 次。显式给 `retry: n` 后所有方法一视同仁——此时写方法重试需你自己保证幂等。
:::

## 五、timeout：内置超时

```js
try {
  await ofetch('/api/slow', { timeout: 5000 }) // 5 秒（毫秒！）后中断
} catch (err) {
  // 超时表现为 abort
}
```

`timeout` 单位是**毫秒**，ofetch 内部用一个 `AbortController` 到时 abort。原生 fetch 没有 timeout，得自己搭 controller + setTimeout，ofetch 封装好了。也可同时传自己的 `signal` 做手动中断。

## 六、ofetch.raw 与 _data：要完整响应

普通 `ofetch()` 只给数据；要 status / headers 用 `ofetch.raw`：

```js
const res = await ofetch.raw('/api/user')
res.status          // 200
res.headers.get('x-total-count')
res._data           // 解析后的数据（普通 ofetch 返回的就是它）
```

> `ofetch(url)` 本质等价于 `(await ofetch.raw(url))._data`。

## 七、ignoreResponseError：关闭自动抛错

某些接口在 4xx/5xx 时也返回有意义的体，你想自己判断而非被抛错打断：

```js
const res = await ofetch.raw('/api/maybe-fail', {
  ignoreResponseError: true,
})
if (res.status >= 400) handleError(res._data)
else use(res._data)
```

> `ignoreResponseError: true` 让非 2xx 也不抛错、照常返回，常配合 `ofetch.raw` 取 status 分流。

## 八、与 axios / ky 的取舍

| 维度 | ofetch | axios | ky |
|---|---|---|---|
| 底座 | 原生 fetch | XHR（浏览器） | 原生 fetch |
| 同构 | Node/浏览器/Worker | 主浏览器+Node | 多环境 |
| 体积 | 极小（destr/ufo/nfn） | 较大 | 小 |
| 自动解析 | ✅ | ✅（`.data`） | ✅ |
| 非 2xx 抛错 | ✅ | ✅ | ✅ |
| 重试 | 内置 | 需插件 | 内置 |
| 进度回调 | ❌ | ✅ | ❌ |
| 错误体位置 | `error.data` | `error.response.data` | `error.response`（需自取） |
| 生态归属 | unjs（Nuxt $fetch 底层） | 独立、生态庞大 | sindresorhus |

> 选 ofetch：吃 fetch 底座、同构、轻量、在 Nuxt/unjs 生态里；选 axios：要进度、要庞大生态/适配器、团队习惯 `.data`；选 ky：纯前端、喜欢其 API 风格。

---

进入 [指南 · 进阶](./guide-line/advanced)：create 分层与继承、responseType 与流式 / SSE、parseResponse 自定义解析、retryDelay 指数退避、从 axios 迁移实战。
