---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **axios 1.x**。把「会发请求」升级到「会封装」：实例 `create`、默认配置与三级合并、请求/响应拦截器、`AxiosHeaders`、配置项全景。

## 一、用 axios.create 封装实例

真实项目几乎不会裸用全局 `axios`，而是按服务/模块建实例，集中默认配置：

```js
import axios from "axios";

const api = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: { "X-Client": "web" },
});

// 之后所有请求复用这些默认
api.get("/users"); // → GET https://api.example.com/users
```

::: tip 为什么优先用实例而非全局默认
在全局 `axios.defaults.headers.common['Authorization']` 上设鉴权头，会发给**所有域名**的请求（可能把 token 泄漏给第三方接口）。用实例默认能把鉴权限定在该服务内。每个实例还有**独立的** `interceptors` 与 `defaults`，互不影响。
:::

## 二、配置合并的优先级

axios 把配置按优先级**从低到高**三级合并，后者覆盖前者：

```text
① 库内置默认 (lib/defaults)
        ↓ 被覆盖
② 实例的 defaults 属性
        ↓ 被覆盖
③ 单次请求传入的 config
```

```js
const instance = axios.create(); // timeout 此时是库默认 0
instance.defaults.timeout = 2500; // 实例默认：该实例所有请求 2.5s
instance.get("/longRequest", { timeout: 5000 }); // 单次覆盖：这一次 5s
```

> 记忆口诀：**越靠近「这一次请求」的配置，优先级越高**。`headers` 的合并更细致——会按 `common` / 具体方法 / 单次分层合并。

## 三、请求拦截器：统一注入

请求拦截器在请求真正发出**前**执行，是注入鉴权头、统一加时间戳、开 loading 的标准位置：

```js
api.interceptors.request.use(
  (config) => {
    // 注入 token（config.headers 通常已是 AxiosHeaders）
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config; // 必须返回 config
  },
  (error) => Promise.reject(error)
);
```

## 四、响应拦截器：统一收口

响应拦截器在 `then/catch` **前**执行，第一个回调处理成功、第二个处理失败：

```js
api.interceptors.response.use(
  (response) => {
    // 可在此精简数据，例如只回传 data
    return response.data;
  },
  (error) => {
    // 全局错误处理：401 跳登录、统一弹提示
    if (error.response?.status === 401) {
      // redirectToLogin();
    }
    return Promise.reject(error); // 把错误继续抛给业务
  }
);
```

::: warning 拦截器的执行顺序（高频考点）
- **多个请求拦截器**：逆序执行（LIFO，后注册的先跑）；
- **多个响应拦截器**：顺序执行（FIFO，先注册的先跑）。

直观理解：请求拦截器像「入栈」，越晚加的越贴近发请求那一刻、越先执行；响应回来后像「出队」，按注册顺序逐个加工。
:::

## 五、移除拦截器

```js
// use() 返回一个数字 id
const id = api.interceptors.request.use((config) => config);
api.interceptors.request.eject(id); // 按 id 移除

// 清空某一类全部拦截器
api.interceptors.request.clear();
api.interceptors.response.clear();
```

## 六、AxiosHeaders：v1 推荐的头操作方式

v1 引入 `AxiosHeaders` 类，提供大小写不敏感的方法，**取代**「直接对 headers 普通对象赋值」的旧写法（旧写法已被官方标注弃用）：

```js
import axios from "axios";

const headers = new axios.AxiosHeaders();
headers.set("Content-Type", "application/json");
headers.setAuthorization("Bearer xxx");
headers.get("content-type"); // 大小写不敏感
headers.has("Authorization"); // true
headers.delete("X-Temp");
```

> 在请求拦截器里，`config.headers` 多数情况已是 AxiosHeaders，可直接用其方法；但要注意「规范化时机」——见[专家篇](./expert)的细节。

## 七、常用配置项全景

```js
axios.get("/data", {
  baseURL: "https://api.example.com", // 基地址（相对 url 会拼在其后）
  params: { page: 1 }, // 查询串
  headers: { "X-Foo": "bar" }, // 请求头
  timeout: 8000, // 超时（毫秒）
  responseType: "json", // 响应解析：json(默认)/text/blob/arraybuffer/stream
  withCredentials: false, // 跨域是否带 cookie（默认 false）
  validateStatus: (s) => s >= 200 && s < 300, // 哪些状态码算成功
  signal: new AbortController().signal, // 取消用的 signal
});
```

> 完整字段与默认值见 [参考](../reference)。

---

进入 [指南 · 进阶](./advanced)：取消请求、表单与文件上传、进度、查询串序列化、并发与全局错误处理实战。
