---
layout: doc
outline: [2, 3]
---

# 参考

> axios **请求方法、配置项与默认值、响应结构、错误码、实例方法与静态 API** 速查。版本基线 axios 1.x。

## 速查

- **调用形式**：`axios(config)` / `axios(url, config)`，以及 `get`、`delete`、`post`、`put`、`patch` 和 `*Form` 方法别名。
- **关键默认值**：`method: 'get'`、`timeout: 0`、`withCredentials: false`、`responseType: 'json'`，默认仅 2xx 由 `validateStatus` 判定成功。
- **请求体位置**：`post/put/patch` 的第二参数是 data；`delete` 如需 body，写在 `config.data`。
- **响应结构**：`data`、`status`、`statusText`、`headers`、`config`、`request`；响应头可用属性或 `AxiosHeaders.get()` 读取。
- **错误识别**：先用 `isAxiosError`，再看 `code`、`response`、`request`；取消通常是 `ERR_CANCELED`，超时常见 `ECONNABORTED` / `ETIMEDOUT`。
- **实例能力**：`axios.create()` 创建隔离客户端，实例仍支持完整请求方法、`defaults`、`interceptors` 与 `getUri()`。
- **拦截器顺序**：请求 LIFO、响应 FIFO；`eject(id)` 移除，`clear()` 清空。
- **取消机制**：新代码使用 `AbortController.signal`；`CancelToken` 只保留历史兼容。

## 一、请求方法别名

| 方法 | 签名 | 说明 |
|---|---|---|
| `axios(config)` | `axios(config)` / `axios(url[, config])` | 通用形式 |
| `axios.get` | `get(url[, config])` | 查询 |
| `axios.delete` | `delete(url[, config])` | 删除（带 body 放 `config.data`） |
| `axios.head` | `head(url[, config])` | 仅取头 |
| `axios.options` | `options(url[, config])` | 预检/能力探测 |
| `axios.post` | `post(url[, data[, config]])` | 创建 |
| `axios.put` | `put(url[, data[, config]])` | 全量更新 |
| `axios.patch` | `patch(url[, data[, config]])` | 部分更新 |
| `axios.postForm` | `postForm(url, data[, config])` | 自动序列化为 FormData/urlencoded |
| `axios.getForm` / `putForm` / `patchForm` | 同上 | Form 版快捷方法 |

## 二、常用请求配置项与默认值

| 配置 | 默认值 | 说明 |
|---|---|---|
| `url` | — | 请求地址（相对则拼 baseURL） |
| `method` | `'get'` | HTTP 方法 |
| `baseURL` | — | 基地址 |
| `allowAbsoluteUrls` | `true` | 绝对 url 是否覆盖 baseURL |
| `params` | — | URL 查询参数（对象 / URLSearchParams） |
| `paramsSerializer` | — | 自定义查询串序列化（encode/serialize/indexes/maxDepth） |
| `data` | — | 请求体（POST/PUT/PATCH/DELETE） |
| `headers` | — | 请求头 |
| `timeout` | `0` | 超时毫秒；0 表示不限时 |
| `withCredentials` | `false` | 跨域是否带 cookie |
| `responseType` | `'json'` | 响应解析：`json`/`text`/`arraybuffer`/`blob`/`stream`/`document` |
| `responseEncoding` | `'utf8'` | Node 端响应编码 |
| `validateStatus` | `s => s>=200 && s<300` | 哪些状态码算成功 |
| `maxContentLength` | `-1` | 响应内容最大字节（Node，-1 不限） |
| `maxBodyLength` | `-1` | 请求体最大字节（Node，-1 不限） |
| `maxRedirects` | `5` | 最大重定向次数（Node，0 禁止） |
| `decompress` | `true` | Node 端自动解压（gzip/deflate/br） |
| `xsrfCookieName` | `'XSRF-TOKEN'` | XSRF 令牌 cookie 名 |
| `xsrfHeaderName` | `'X-XSRF-TOKEN'` | XSRF 令牌头名 |
| `withXSRFToken` | `undefined` | 是否发 XSRF 头（默认仅同源；true 含跨域） |
| `signal` | — | `AbortController` 的 signal（取消） |
| `cancelToken` | — | 旧取消方式（**已弃用**，改用 signal） |
| `adapter` | — | `'xhr'`/`'http'`/`'fetch'`/函数/数组 |
| `auth` | — | HTTP Basic：`{ username, password }` |
| `proxy` | — | Node 代理：`{ protocol, host, port, auth }`，false 忽略环境代理 |
| `httpAgent` / `httpsAgent` | — | Node 自定义 agent（keep-alive 等） |
| `onUploadProgress` / `onDownloadProgress` | — | 进度回调 |
| `transformRequest` / `transformResponse` | 内置 JSON | 请求/响应数据转换（函数数组） |
| `transitional` | 见专家篇 | 过渡开关（silentJSONParsing 等） |
| `redact` | — | `toJSON()` 时打码的 key 名数组 |

## 三、响应对象（AxiosResponse）

```js
{
  data,        // 已解析的响应体
  status,      // HTTP 状态码（200…）
  statusText,  // 状态文本（'OK'…）
  headers,     // 响应头（小写键；v1 为 AxiosHeaders）
  config,      // 本次请求配置
  request,     // 底层请求对象（XHR / ClientRequest）
}
```

> 读响应头：`res.headers['content-type']` 或 `res.headers.get('Content-Type')`（大小写不敏感）。

## 四、错误对象（AxiosError）与错误码

```js
{
  message,    // 错误摘要
  name,       // 'AxiosError'
  code,       // 错误码（见下表）
  config,     // 请求配置
  request,    // 请求对象（请求已发但无响应时）
  response,   // 响应对象（服务器有响应、非 2xx 时）
  status,     // 状态码（有响应时）
  toJSON(),   // 转可序列化对象（配合 redact 脱敏）
}
```

| `error.code` | 含义 |
|---|---|
| `ERR_BAD_REQUEST` | 4xx 响应 |
| `ERR_BAD_RESPONSE` | 5xx 响应 |
| `ERR_NETWORK` | 网络 / CORS 错误 |
| `ECONNABORTED` | 超时或浏览器中止（默认超时码） |
| `ETIMEDOUT` | 超时（需 `transitional.clarifyTimeoutError: true`） |
| `ERR_CANCELED` | 请求被取消（CanceledError） |
| `ERR_FR_TOO_MANY_REDIRECTS` | 重定向超限 |
| `ERR_FORM_DATA_DEPTH_EXCEEDED` | FormData 序列化嵌套超 `maxDepth` |

## 五、实例与静态 API

| API | 作用 |
|---|---|
| `axios.create([config])` | 创建带默认配置的独立实例 |
| `instance.defaults` | 读/写实例默认配置 |
| `instance.interceptors.request` | 请求拦截器管理器（use/eject/clear） |
| `instance.interceptors.response` | 响应拦截器管理器（use/eject/clear） |
| `instance.getUri([config])` | 计算并返回完整 URL（不发请求） |
| `axios.isAxiosError(e)` | 类型守卫：是否为 AxiosError |
| `axios.isCancel(e)` | 是否为取消导致的错误 |
| `axios.AxiosHeaders` | 头操作类（set/get/setContentType…） |
| `axios.AxiosError` / `axios.CanceledError` | 错误类 |
| `axios.all(iterable)` / `axios.spread(cb)` | 并发（**旧式**，推荐 `Promise.all`） |
| `axios.toFormData` / `axios.formToJSON` | FormData 与对象互转辅助 |

## 六、拦截器执行顺序（高频考点）

| 拦截器 | 顺序 | 记忆 |
|---|---|---|
| 请求拦截器 | **逆序 LIFO**（后注册先执行） | 像入栈，越晚加越先跑 |
| 响应拦截器 | **顺序 FIFO**（先注册先执行） | 像出队，按注册次序加工 |

```js
// 请求拦截器选项（仅请求拦截器支持）
api.interceptors.request.use(fn, errFn, {
  synchronous: true, // 同步执行，减少异步包装延迟
  runWhen: (config) => config.method === "get", // 返回 false 则跳过该拦截器
});
```

## 七、取消请求（AbortController）

```js
const controller = new AbortController();
axios.get("/x", { signal: controller.signal }).catch((e) => {
  if (axios.isCancel(e)) {
    /* 主动取消 */
  }
});
controller.abort(); // 一个 controller 可取消多个共享 signal 的请求
```

> 旧 `CancelToken` 已弃用（v0.22.0 起），仅作历史兼容，新代码用 `AbortController`。

---

命令查完，进 [指南 · 基础](./guide-line/base) 理解封装，或看 [指南 · 进阶](./guide-line/advanced) / [指南 · 专家](./guide-line/expert) 看实战与内核。
