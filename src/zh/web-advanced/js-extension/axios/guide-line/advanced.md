---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 版本基线 **axios 1.x**。把 axios 用进真实业务：取消请求、表单/文件上传、上传下载进度、查询串序列化、并发、自定义数据转换、与 fetch 的取舍。

## 速查

- **取消请求**：传入 `AbortController.signal`，调用 `abort()` 后以 `axios.isCancel(error)` 或 `ERR_CANCELED` 识别；旧 `CancelToken` 已弃用。
- **表单编码**：`URLSearchParams` 或 `postForm()` 发送 `application/x-www-form-urlencoded`；复杂嵌套规则用 `paramsSerializer` 或 `qs` 明确约定。
- **文件上传**：把 `FormData` 直接作为 data 发送，不手写 `multipart/form-data`，让运行时补齐 boundary。
- **进度反馈**：`onUploadProgress` / `onDownloadProgress` 提供 `loaded`、`total`、`progress`、`rate` 等字段；二进制下载同时设置正确的 `responseType`。
- **查询串**：`paramsSerializer.encode` 定制单值编码，`serialize` 完全接管序列化，`indexes` 控制数组下标形式。
- **并发**：新代码直接使用 `Promise.all`；共享一个 signal 可同时取消一组在途请求。
- **数据转换**：自定义 `transformRequest` / `transformResponse` 会接管默认转换，尤其要自行保留 JSON 解析行为。
- **选型**：简单且体积敏感的现代运行时优先原生 fetch；需要实例、拦截器、进度、适配器与成熟生态时 axios 更省工程成本。

## 一、取消请求：AbortController

v0.22.0 起，axios 用 fetch 风格的 `AbortController` 取消请求——把 `controller.signal` 传给 `config.signal`，调用 `abort()` 即取消：

```js
const controller = new AbortController();

axios
  .get("/foo/bar", { signal: controller.signal })
  .then((res) => console.log(res.data))
  .catch((err) => {
    if (axios.isCancel(err)) {
      // 主动取消：静默处理，别当真实错误弹提示
      console.log("已取消");
    } else {
      // 真实失败
    }
  });

// 取消（如组件卸载、用户切走）
controller.abort();
```

::: tip 一个 signal 可取消多个请求
把同一个 `controller.signal` 传给多个并发请求，调用一次 `controller.abort()` 会**同时取消全部**——这正是「离开页面时一次性取消该页所有在途请求」的常用模式。另外，若 signal 在请求开始前就已 aborted，请求会被立即取消、不会真正发出。
:::

被取消的请求会 reject 一个 `CanceledError`（`code` 为 `ERR_CANCELED`），用 `axios.isCancel(err)` 识别。

> 旧的 `CancelToken`（`CancelToken.source()` / executor）**自 v0.22.0 起已弃用**，新代码不要再用——它基于已被撤回的 TC39 cancellable promises 提案。

## 二、表单编码：x-www-form-urlencoded

默认 axios 发 JSON。要发表单编码，最简单的方式是用 `URLSearchParams`：

```js
const params = new URLSearchParams();
params.append("username", "tom");
params.append("password", "123");
axios.post("/login", params);
//=> Content-Type: application/x-www-form-urlencoded
```

> 也可用 `axios.postForm(url, obj)`，或把 `Content-Type` 设为 `application/x-www-form-urlencoded` 让 axios 自动把对象序列化成 urlencoded。需要兼容老式嵌套序列化时可接入 `qs` 库（配 `paramsSerializer` 或手动 `qs.stringify`）。

## 三、文件上传：multipart/form-data

把字段塞进 `FormData` 实例后直接 post，axios 会**自动**设置带 `boundary` 的 `Content-Type`：

```js
const fd = new FormData();
fd.append("file", fileInput.files[0]);
fd.append("desc", "头像");

axios.post("/upload", fd);
// 不要手动设 Content-Type！自动推断的才带正确 boundary
```

::: warning 别手动设 multipart 的 Content-Type
手动写 `'multipart/form-data'` 字符串（不含 boundary）会破坏多部分边界，导致服务端解析失败。交给 axios 自动处理即可。Node 端可用 `form-data` 库构造表单。
:::

从 v0.27.0 起，若 `Content-Type` 为 `multipart/form-data` 且 data 是普通对象，axios 也会自动把对象序列化成 FormData。

## 四、上传 / 下载进度

```js
axios.post("/upload", fd, {
  onUploadProgress: (e) => {
    if (e.total) {
      const percent = Math.round((e.loaded / e.total) * 100);
      console.log(`上传 ${percent}%`);
    }
  },
});

axios.get("/big-file", {
  responseType: "blob",
  onDownloadProgress: (e) => {
    console.log("已下载字节：", e.loaded);
  },
});
```

> 进度事件含 `loaded` / `total` / `progress` / `rate`（速度）/ `estimated`（预计剩余）等字段。下载二进制记得设 `responseType: 'blob'`（浏览器）或 `'arraybuffer'` / `'stream'`（Node）。

## 五、自定义查询串序列化：paramsSerializer

数组等复杂结构的默认序列化未必符合后端口味，可用 `paramsSerializer` 定制：

```js
// 例：用严格 RFC 3986 编码
axios.get("/list", {
  params: { tags: ["a", "b"] },
  paramsSerializer: {
    encode: encodeURIComponent, // 自定义单个键值编码
    indexes: false, // 数组：a[]=1&a[]=2（null 无括号、true 带下标）
  },
});

// 例：完全接管（接入 qs，模拟 1.x 之前行为）
import qs from "qs";
axios.get("/list", {
  params: { filter: { status: "active" } },
  paramsSerializer: { serialize: (p) => qs.stringify(p, { arrayFormat: "brackets" }) },
});
```

## 六、并发请求

axios 早期的 `axios.all` / `axios.spread` 只是对 `Promise.all` 的薄封装，如今**推荐直接用原生 `Promise.all`**：

```js
const [users, posts] = await Promise.all([axios.get("/users"), axios.get("/posts")]);
console.log(users.data, posts.data);
```

> `axios.all` / `axios.spread` 仍可用但属旧式 API，不推荐用于新代码。并发中需要「任一失败即取消其余」时，用共享的 `AbortController`。

## 七、自定义数据转换：transformRequest / transformResponse

在 axios 默认 JSON 处理之外，可插入自定义转换：

```js
axios.post("/data", payload, {
  // 发送前改写请求体（函数数组，最后一个须返回可发送类型）
  transformRequest: [
    (data, headers) => {
      // 自定义序列化…
      return JSON.stringify(data);
    },
  ],
  // 进入 then 前改写响应体
  transformResponse: [
    (data) => {
      // 注意：提供自定义会「替换」默认（含 JSON.parse）的转换，需自己 parse
      return typeof data === "string" ? JSON.parse(data) : data;
    },
  ],
});
```

::: warning 自定义 transformResponse 会替换默认
默认 `transformResponse` 会做 JSON.parse；一旦你提供了自定义函数（而非追加进数组），默认行为会被覆盖，需要自己处理解析。多数业务用响应拦截器加工数据更直观。
:::

## 八、什么时候该选 fetch 而不是 axios

| 场景 | 更合适 |
|---|---|
| 极度在意打包体积、只发简单请求 | **fetch**（原生零体积） |
| 只暴露 fetch 的运行时（Workers / edge / Deno） | **fetch** 或 axios 的 fetch 适配器 |
| 需要拦截器集中注入 token / 全局错误 | **axios** |
| 需要内置超时、自动 JSON、非 2xx 自动 reject | **axios** |
| 需要上传/下载进度、带宽限速 | **axios** |
| 团队已有大量 axios 封装与约定 | **axios** |

> 与 ky / ofetch 的差异：后两者构建在原生 fetch 之上，体积更小、更贴近 Web 标准，也有自己的 hooks；axios 胜在功能全、同构、生态插件丰富。按体积敏感度、运行环境与所需便利层权衡。

---

进入 [指南 · 专家](./expert)：v1 破坏性变更、`AxiosHeaders` 规范化时机、适配器切换、`transitional` 开关、重试与安全护栏。
