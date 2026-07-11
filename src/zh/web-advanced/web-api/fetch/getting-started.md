---
layout: doc
outline: [2, 3]
---

# 入门：定位、心智模型与选型分工

> 基于 WHATWG Fetch 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **一句话定位**：`fetch(resource, options)` 是浏览器标准网络请求接口，返回 `Promise<Response>`；核心 API 自 2017-03 起 **Baseline Widely available**，Node 18+/Deno/Bun 同款。
- **头号规则**：`fetch()` **只在网络层失败时 reject（抛 `TypeError`）**；服务器返回 404/500 等 HTTP 错误码时照样 **fulfill**——必须自查 `response.ok`（status 200–299）或 `response.status`。
- **fulfill 时机**：收到**状态行 + 响应头**就 fulfill，此时 body 可能还在传输中——所以读 body 的 `json()`/`text()` 是又一个异步步骤。
- **两步走样板**：`const res = await fetch(url); if (!res.ok) throw new Error(res.status); const data = await res.json();`——ok 检查一步都不能省。
- **reject 的场景**：断网/DNS 失败、URL 非法、URL 带用户名密码、CORS 被拦、`integrity` 校验不过、`redirect: "error"` 遇重定向——统统 `TypeError`；被取消则是 `AbortError`/`TimeoutError`（DOMException）。
- **POST JSON 三件**：`method: "POST"` + `headers: { "Content-Type": "application/json" }` + `body: JSON.stringify(data)`——body 不会自动序列化，Content-Type 也不会自动设。
- **body 可用类型**：字符串、`ArrayBuffer`、TypedArray、`DataView`、`Blob`、`File`、`URLSearchParams`、`FormData`、`ReadableStream`；其他对象会被 `toString()` 成字符串。
- **GET/HEAD 无 body**：给 GET 请求塞 body 直接抛 `TypeError`；GET 传参用 `URLSearchParams` 拼查询串。
- **FormData 别手设 Content-Type**：浏览器会自动生成带 boundary 的 `multipart/form-data`，手写会缺 boundary 导致服务端解析失败。
- **默认值**：`method: "GET"`、`mode: "cors"`、`credentials: "same-origin"`、`cache: "default"`、`redirect: "follow"`、`priority: "auto"`。
- **取消与超时**：原生无 timeout 选项——`signal: AbortSignal.timeout(8000)` 一行补上（超时抛 `TimeoutError`），用户取消用 `AbortController`（抛 `AbortError`），详见[取消与超时页](./guide-line/abort-timeout)。
- **vs XHR**：fetch 赢在 Promise、流式 body、SW/Cache 集成、可组合取消；XHR 仅剩**上传进度事件**（`xhr.upload.onprogress`）一个不可替代点。
- **共同点勿误解**：XHR 的 `onerror` 同样只管网络错误，HTTP 4xx/5xx 在两边都算"成功拿到响应"——这不是 fetch 独有的怪癖，是 HTTP 客户端的通用语义。
- **与封装库分工**：拦截器/自动重试/统一超时治理 → [Axios](/zh/web-advanced/js-extension/axios/)（独立生态，兼容 XHR 时代 API）、[ky](/zh/web-advanced/js-extension/ky/)/[ofetch](/zh/web-advanced/js-extension/ofetch/)（fetch 薄封装）；它们的底座与错误语义仍是原生 fetch。
- **CSP 口径**：`fetch()` 受 CSP 的 `connect-src` 指令管控，而非所取资源类型对应的指令。
- **近年增量**：`Response.json()` 静态（2023-09 Baseline）、`AbortSignal.any()`（2024-03）、`priority`（2024-10 全绿）、`keepalive`（2024-11 Firefox 133 补齐）、`bytes()`（2025-01）；上传流 `duplex`（Chromium 105+）与 `fetchLater()`（Chrome 135+）仍非 Baseline。
- **进阶顺序**：本页 → [三对象](./guide-line/request-response) → [取消与超时](./guide-line/abort-timeout) → [请求模式三件套](./guide-line/cors-credentials-cache) → [流式与离页请求](./guide-line/streaming-keepalive) → [参考](./reference)。

## 一、定位：从 XHR 到 fetch

XMLHttpRequest 诞生于 2000 年前后的 IE，是"Ajax 时代"的功臣，但它的设计带着深刻的时代烙印：**事件驱动**（`onreadystatechange`/`onload`/`onerror` 回调面条）、配置靠**命令式方法调用**（`open()` → `setRequestHeader()` → `send()`）、请求与响应**不是一等对象**（无法传递、复制、缓存一个"请求"本身）。

Fetch API 是 WHATWG 对"网络请求"这件事的重新设计，三个层面的升级：

1. **异步模型**：返回 `Promise<Response>`，与 `async/await`、`Promise.all()` 并发组合无缝衔接；
2. **对象模型**：`Request`/`Response`/`Headers` 都是可构造、可克隆、可传递的标准对象——Service Worker 之所以能拦截请求、Cache API 之所以能存储响应，正是因为"请求/响应"终于成了实体；
3. **平台集成**：body 天生是 `ReadableStream`（流式处理）、取消统一走 `AbortSignal`（跨 API 通用的取消语义）、受 CSP `connect-src` 管控。

更重要的是它的**跨端地位**：Node 18 起内置（基于 undici）、Deno/Bun 原生、Cloudflare Workers 等边缘运行时以它为唯一网络接口——今天写 `fetch()` 的代码，是所有 JS 运行时的公约数。

## 二、一分钟上手

```js
/**
 * GET 请求拿 JSON —— 最常用的完整样板
 */
async function getUser(id) {
  const response = await fetch(`https://api.example.com/users/${id}`);

  // 关键：4xx/5xx 不会 reject，必须自查
  if (!response.ok) {
    throw new Error(`HTTP 错误：${response.status}`);
  }

  return response.json(); // 返回 Promise，解析 body 为 JSON
}
```

```js
/**
 * POST JSON —— 三件缺一不可：method、Content-Type、序列化的 body
 */
async function createUser(user) {
  const response = await fetch("https://api.example.com/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // 不会自动设
    body: JSON.stringify(user), // 不会自动序列化
  });

  if (!response.ok) {
    throw new Error(`HTTP 错误：${response.status}`);
  }

  return response.json();
}
```

两个高频变体：

```js
// GET 传参：用 URLSearchParams 拼查询串（GET 不能有 body）
const params = new URLSearchParams({ page: "1", size: "20" });
const res = await fetch(`https://api.example.com/list?${params}`);

// 上传表单/文件：FormData 作 body，Content-Type 交给浏览器
const fd = new FormData();
fd.append("avatar", fileInput.files[0]);
await fetch("/upload", { method: "POST", body: fd });
// 注意：千万别手写 Content-Type: multipart/form-data——会丢 boundary
```

## 三、Promise 心智模型：什么时候 reject

fetch 最反直觉、也最重要的一条语义：**`fetch()` 返回的 Promise 与"业务成败"无关，只与"网络对话是否完成"有关**。服务器哪怕回了 500，"对话"也算完成——Promise 照样 fulfill。

把错误面分成三层看就清晰了：

| 层 | 表现 | 捕获方式 |
| --- | --- | --- |
| **网络层**（对话没建立/中断） | `fetch()` reject，抛 `TypeError`——断网、DNS 失败、URL 非法、URL 带 `user:pass@`、CORS 被拦、`integrity` 不匹配 | `try/catch` 或 `.catch()` |
| **取消层**（主动中止） | reject，抛 `AbortError`（用户取消）或 `TimeoutError`（`AbortSignal.timeout()` 超时），均为 `DOMException` | `catch` 中按 `err.name` 分流 |
| **HTTP 层**（服务器回了错误码） | **fulfill**，`response.ok === false`、`response.status` 为 404/500 等 | 手查 `response.ok` |

此外还有第四个容易忽略的时间差：**fetch 在收到状态行和响应头时就 fulfill**，body 可能还在网络上传输——所以 `response.json()` 这一步本身也可能失败（连接中途断掉、body 不是合法 JSON 抛 `SyntaxError` 类错误），完整的健壮处理长这样：

```js
async function fetchJSON(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    if (err.name === "AbortError") throw err; // 用户取消，向上传递
    if (err.name === "TimeoutError") throw new Error("请求超时");
    throw new Error(`网络错误：${err.message}`); // TypeError：断网/CORS/非法 URL
  }

  if (!response.ok) {
    // HTTP 层错误：按状态码做业务分流（401 跳登录、429 退避……）
    throw new Error(`HTTP ${response.status}：${response.statusText}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("响应体不是合法 JSON"); // body 解析层
  }
}
```

这套三层分流是后面[取消与超时页](./guide-line/abort-timeout)错误分类处理的基础版。

## 四、与 XHR 对比

| 维度 | XMLHttpRequest | fetch |
| --- | --- | --- |
| 异步模型 | 事件回调（`onload`/`onerror`） | `Promise<Response>`，async/await 原生 |
| 请求/响应实体 | 无（配置绑死在 xhr 实例上） | `Request`/`Response` 一等对象，可传递/克隆/缓存 |
| HTTP 错误码 | `onload` 正常触发，查 `xhr.status` | fulfill，查 `response.ok`——**两者语义一致** |
| 响应流式读取 | 无（`responseText` 全量） | `response.body` 是 `ReadableStream`，边到边处理 |
| 下载进度 | `onprogress` 事件原生 | 手动累计 `response.body` 字节（见[流式页](./guide-line/streaming-keepalive)） |
| **上传进度** | **`xhr.upload.onprogress` 原生支持** | **缺位**（上传流仅 Chromium 且限制多）——XHR 仅存的不可替代点 |
| 超时 | `xhr.timeout` 属性 | 无内建，`AbortSignal.timeout(ms)` 组合 |
| 取消 | `xhr.abort()` | `AbortController`/`AbortSignal`——可组合、可跨 API 复用 |
| Service Worker / Cache API | 不可用（SW 内无 XHR） | 一等公民 |
| 跨域/凭据/缓存策略 | 零散属性（`withCredentials`） | `mode`/`credentials`/`cache` 声明式选项 |
| 同步模式 | 有（已废弃，阻塞主线程） | 无（设计上杜绝） |
| 跨端可用性 | 仅浏览器 | 浏览器/Node 18+/Deno/Bun/边缘运行时 |

结论：**新代码没有理由再写 XHR**；存量场景里只有"上传大文件要显示精确进度条"这一条，XHR（或基于 XHR 的库）仍是务实选择。

## 五、与封装库的分工

原生 fetch 刻意保持低层，工程上常见的诉求它一概不管：

- **拦截器**（统一注入 token、统一错误上报）
- **自动重试**（网络抖动、429/503 退避重试）
- **超时/取消的统一治理**、**baseURL / 实例化配置**、**自动 JSON**（请求序列化 + 响应解析 + 非 2xx 自动抛错）

这些正是封装库的产品化空间，选型一笔账：

| 库 | 底座 | 一句话定位 |
| --- | --- | --- |
| [Axios](/zh/web-advanced/js-extension/axios/) | 历史上 XHR，现支持 fetch adapter | 生态最大、拦截器体系成熟，兼容老项目与上传进度需求 |
| [ky](/zh/web-advanced/js-extension/ky/) | fetch | 极薄封装：重试/超时/hooks/自动抛非 2xx，浏览器优先 |
| [ofetch](/zh/web-advanced/js-extension/ofetch/) | fetch | Nuxt 系通用封装：Node/浏览器同构、自动 JSON、baseURL |

分工心智：**简单场景（几个请求、无统一治理需求）裸写 fetch 即可**；接口多、需要统一治理时上库——但库的取消语义、错误分类、流式能力全部继承自 fetch，原生不清楚，库照样用不明白。本叶只讲原生标准，库的教学见各自独立叶。

## 六、浏览器支持与 Baseline 现状

| 能力 | 状态（核于 2026-07，据 MDN/BCD） |
| --- | --- |
| `fetch()` / `Request` / `Response` / `Headers` 核心 | **Baseline Widely available**（2017-03 起，全绿多年） |
| `AbortController` / `signal` 取消 | Widely available |
| `AbortSignal.timeout()` | **Widely available**（注意 Chrome 103–123 超时误抛 `AbortError`，124 起才正确抛 `TimeoutError`） |
| `AbortSignal.any()` | **Baseline Newly available 2024-03**（Chrome 116 / Firefox 124 / Safari 17.4） |
| `Response.json()` 静态 / `Headers.getSetCookie()` | 2023-09 补齐，**2026-03 起 Widely available** |
| `priority` 请求优先级 | **Baseline Newly available 2024-10**（Chrome 101 / Safari 17.2 / Firefox 132 补齐） |
| `keepalive` | **Baseline Newly available 2024-11**（Chrome 66 / Safari 13 早已支持，Firefox 133 补齐） |
| `bytes()` 读取方法 | **Baseline Newly available 2025-01**（Firefox 128 / Safari 18.0 / Chrome 132 补齐） |
| 上传流（`body: ReadableStream` + `duplex: "half"`） | **仅 Chromium 105+**（Firefox/Safari 未实现），非 Baseline |
| `fetchLater()` 延迟请求 | **仅 Chrome/Edge 135+**，非 Baseline（Firefox/Safari 标准立场积极但未实现） |

结论：**核心能力早已"闭着眼用"**；2023–2025 的增量（静态 json、组合信号、priority、keepalive、bytes）也都已进 Baseline，可按目标用户浏览器版本放心采用；真正要做兼容判断的只剩上传流与 `fetchLater()` 两个 Chromium 前沿。

下一页从对象模型地基讲起——Request/Response/Headers 三对象、body 单次消费与六种读取方法：[Request、Response 与 Headers](./guide-line/request-response)。
