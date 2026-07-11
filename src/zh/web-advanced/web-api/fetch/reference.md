---
layout: doc
outline: [2, 3]
---

# 参考：选项全表 / API 速查 / 易错点

> 基于 WHATWG Fetch 现行标准与各浏览器 Baseline 状态 · 核于 2026-07

## 速查

- **签名**：`fetch(resource, options)` 返回 `Promise<Response>`；`resource` 收 URL 字符串 / `URL` 对象 / `Request`；参数与 `Request()` 构造器**完全一致**，同名选项 `fetch()` 直传的优先。
- **头号语义**：**网络失败才 reject（`TypeError`）**，HTTP 4xx/5xx 照样 fulfill——`response.ok`（200–299）必查。
- **选项默认值**：`method: "GET"`、`mode: "cors"`、`credentials: "same-origin"`、`cache: "default"`、`redirect: "follow"`、`referrer: "about:client"`、`priority: "auto"`、`keepalive: false`。
- **body 类型**：string / `ArrayBuffer` / TypedArray / `DataView` / `Blob` / `File` / `URLSearchParams` / `FormData` / `ReadableStream`（后者必配 `duplex: "half"`，仅 Chromium）；GET/HEAD 带 body 抛 TypeError。
- **六读方法**：`json()` / `text()` / `blob()` / `arrayBuffer()` / `bytes()`（`Uint8Array`，2025-01 Baseline）/ `formData()`——全量、异步、单次消费；Request 与 Response 通用。
- **单次消费**：`bodyUsed` 置位后再读抛 TypeError；`clone()` 必须在**任何读取之前**（对 bodyUsed 对象克隆同样抛错）。
- **Response 静态三兄弟**：`Response.json(data, init)` / `Response.error()` / `Response.redirect(url, status)`——SW/mock/边缘函数刚需。
- **type 五值**：`basic`（同源）/ `cors`（跨域白名单头）/ `opaque`（no-cors：status 0 全读不到）/ `opaqueredirect`（redirect manual）/ `error`（`Response.error()`）。
- **取消体系**：`AbortController.abort()` → `AbortError`；`AbortSignal.timeout(ms)` → `TimeoutError`（Chrome 103–123 误抛 AbortError）；`AbortSignal.any([...])` 组合（2024-03 Baseline），reason 取首个触发源。
- **Headers 规则**：名字大小写不敏感、遍历时小写 + 字典序 + 同名合并；`getSetCookie()` 拿多条 Set-Cookie；fetch 响应头 **immutable**；禁设头静默忽略。
- **cache 六档**：`default` / `no-store`（不读不写）/ `reload`（不读但写）/ `no-cache`（必验证）/ `force-cache`（过期也用）/ `only-if-cached`（须配 same-origin，miss 即错）。
- **credentials include 三件套**：`Access-Control-Allow-Credentials: true` + ACAO 写具体源（禁 `*`）+ Cookie 自身 SameSite 放行——缺一不可。
- **integrity**：`sha256/384/512-Base64`，不匹配按网络错误 reject；**priority**：high/low/auto 调度提示（2024-10 Baseline）。
- **离页三件**：`keepalive: true`（64 KiB 在途共享配额，2024-11 Baseline）> `sendBeacon`（老式简配）> `fetchLater()`（Chrome 135+ 前沿：640 KiB 配额体系、响应不可读、必 catch `QuotaExceededError`）。
- **流式**：`response.body` 是 `ReadableStream`——`getReader()` 循环全绿；`for await` Safari 27 才支持；上传流四硬限（half 必填 / 非 303 重定向 reject / 必预检 / 仅 H2 H3）。
- **错误名速记**：`TypeError` 网络层 / `AbortError` 取消 / `TimeoutError` 超时 / `SyntaxError` JSON 解析 / `QuotaExceededError` fetchLater 配额 / `RangeError` activateAfter 负值或 bytes 超大。
- **跨端**：同一套 API 覆盖浏览器 / Web Worker / SW / Node 18+（undici）/ Deno / Bun / 边缘运行时。

## 一、fetch() 选项全表

| 选项 | 取值（**默认**） | 说明 |
| --- | --- | --- |
| `method` | **`GET`** / POST / PUT / DELETE / PATCH / HEAD… | no-cors 模式下仅限 GET/HEAD/POST |
| `headers` | `Headers` / 字面量对象 / 二维数组 | 禁设头静默忽略；no-cors 只许 CORS-safelisted（含 Range 禁令） |
| `body` | string / `ArrayBuffer` / TypedArray / `DataView` / `Blob` / `File` / `URLSearchParams` / `FormData` / `ReadableStream` | GET/HEAD 不可带；其他对象被 `toString()`；FormData 自动生成 multipart 边界 |
| `mode` | **`cors`** / `same-origin` / `no-cors` / `navigate` | 跨域总开关；no-cors → opaque 响应 |
| `credentials` | `omit` / **`same-origin`** / `include` | 管 Cookie/TLS 证书/Authorization 的发与收 |
| `cache` | **`default`** / `no-store` / `reload` / `no-cache` / `force-cache` / `only-if-cached` | HTTP 缓存使用策略；only-if-cached 须 same-origin |
| `redirect` | **`follow`** / `error` / `manual` | manual → opaqueredirect（读不到 Location） |
| `referrer` | **`about:client`** / 同源 URL / `""` | 空串省略 Referer 头 |
| `referrerPolicy` | 同 `Referrer-Policy` 头九档 | 如 `no-referrer`、`strict-origin-when-cross-origin` |
| `integrity` | `sha256-…` / `sha384-…` / `sha512-…` | SRI 校验，失败按网络错误 reject |
| `keepalive` | `true` / **`false`** | 页面卸载不中断；64 KiB 在途共享配额 |
| `signal` | `AbortSignal` | 取消/超时接线；组合用 `AbortSignal.any()` |
| `priority` | `high` / `low` / **`auto`** | 同类请求间的调度提示（hint） |
| `duplex` | `"half"`（body 为流时**必填**） | 上传流开关，仅 Chromium 105+ |
| `targetAddressSpace` | `loopback` / `local` / `public` | Local Network Access：允许 HTTPS 页访问本地地址 |
| `attributionReporting` / `browsingTopics` / `privateToken` | 对象 / 布尔 / 对象 | Chromium 隐私沙盒系实验选项（归因上报/Topics/私态令牌），跨浏览器不可用 |

`fetchLater()` 额外多一个 `activateAfter`（毫秒）——最迟等待时长，与页面销毁先到者触发。

## 二、三对象 API 速查

### Request

| 成员 | 说明 |
| --- | --- |
| `new Request(input, options)` | 与 `fetch()` 同参；`new Request(oldReq, overrides)` 模板派生 |
| `method` / `url` / `headers` | 基本三件（url 为完整绝对地址） |
| `mode` / `credentials` / `cache` / `redirect` / `referrer` / `referrerPolicy` / `integrity` / `keepalive` / `signal` | 策略选项的只读反射 |
| `destination` | 请求目标类型（`"document"`/`"script"`/`"image"`…），SW 分流常用 |
| `body` / `bodyUsed` | 请求体流 / 是否已消费（**发送即消费**） |
| `clone()` | 克隆（须在读取/发送前）；六读方法同 Response |

### Response

| 成员 | 说明 |
| --- | --- |
| `new Response(body, { status, statusText, headers })` | 通用构造（SW 合成响应） |
| `Response.json(data, init)` | 静态：JSON 响应一步到位（自动 Content-Type）；2026-03 起 Widely |
| `Response.error()` | 静态：网络错误响应（type `error`、status 0） |
| `Response.redirect(url, status = 302)` | 静态：重定向响应 |
| `status` / `statusText` / `ok` | 状态码 / 消息 / **200–299 布尔** |
| `type` | `basic` / `cors` / `opaque` / `opaqueredirect` / `error` |
| `url` / `redirected` | 最终落点 / 是否经历跳转（防开放重定向双查） |
| `headers` | 不可变 `Headers`（改头需重建 Response） |
| `body` / `bodyUsed` / `clone()` | 流 / 消费标记 / 克隆（读前） |

### Headers

| 成员 | 说明 |
| --- | --- |
| `new Headers(init)` | 收字面量对象 / 二维数组 / 另一个 Headers |
| `get(name)` / `has(name)` | 大小写不敏感；同名多值逗号合并返回 |
| `set(name, v)` / `append(name, v)` / `delete(name)` | 覆盖 / 追加 / 删除——受 guard 限制 |
| `getSetCookie()` | 唯一能拿**多条** Set-Cookie 的方法（Node/边缘侧用） |
| `entries()` / `keys()` / `values()` / `forEach()` / `for...of` | 遍历：小写 + 字典序 + 合并 |

### body 读取方法（Request/Response 通用）

| 方法 | 解析为 | Baseline | 备注 |
| --- | --- | --- | --- |
| `text()` | `string` | 全绿多年 | UTF-8 |
| `json()` | 任意 JS 值 | 全绿多年 | 非法/空 body reject |
| `blob()` | `Blob` | 全绿多年 | 配 `URL.createObjectURL()` |
| `arrayBuffer()` | `ArrayBuffer` | 全绿多年 | 二进制底座 |
| `bytes()` | `Uint8Array` | **Newly 2025-01**（Firefox 128 / Safari 18 / Chrome 132） | 老环境等价：`new Uint8Array(await r.arrayBuffer())` |
| `formData()` | `FormData` | 全绿多年 | 主用于 SW 解析拦截的表单 |

## 三、错误分类表

| 错误 | 类型 | 触发场景 | 处置 |
| --- | --- | --- | --- |
| `TypeError` | 原生错误 | 断网/DNS 失败、URL 非法或带 `user:pass@`、CORS 被拦、integrity 不匹配、GET 带 body、选项值非法、keepalive 超 64 KiB、`redirect: "error"` 遇跳转 | 网络类可重试；配置类修代码 |
| `AbortError` | `DOMException` | `controller.abort()`（含 fulfill 后读 body 期间）；复用已中止 signal | **预期内流程**：静默收尾，勿上报勿重试 |
| `TimeoutError` | `DOMException` | `AbortSignal.timeout()` 到点（Chrome 103–123 误抛 AbortError） | 提示用户/退避重试 |
| HTTP 4xx | fulfill，`!ok` | 业务/权限/参数错误 | 按状态码分治；**不重试** |
| HTTP 5xx / 429 | fulfill，`!ok` | 服务端故障/限流 | 指数退避 + 抖动重试；尊重 `Retry-After` |
| `SyntaxError` | reject（读取期） | `json()` 遇非法 JSON（常见：把 404 错误页当 JSON 解析） | 先查 `ok` 与 Content-Type |
| `QuotaExceededError` | `DOMException` | `fetchLater()` 配额超限**或**被 Permissions Policy 限制 | 防御性 catch + keepalive 降级 |
| `RangeError` | 原生错误 | `fetchLater` 的 `activateAfter` 为负；`bytes()` 数据超出 ArrayBuffer 上限 | 修参数 |
| `NotAllowedError` | `DOMException` | `browsingTopics`/`privateToken` 被 Permissions Policy 禁止 | 隐私沙盒专属，常规业务不遇 |

## 四、Baseline 支持时间线

| 能力 | 关键版本 | Baseline 状态（核于 2026-07） |
| --- | --- | --- |
| fetch/Request/Response/Headers 核心 | Chrome 42 / Firefox 39 / Safari 10.1 | **Widely available**（2017-03 起） |
| `AbortController` 取消 | Chrome 66 / Firefox 57 / Safari 12.1 | Widely available |
| `AbortSignal.timeout()` | Chrome 103（124 修 TimeoutError）/ Firefox 100 / Safari 16 | **Widely available** |
| `Response.json()` 静态 | Chrome 105 / Firefox 115 / Safari 17 | Newly 2023-09 → **Widely 2026-03** |
| `Headers.getSetCookie()` | Chrome 113 / Firefox 112 / Safari 17 | Newly 2023-09 → **Widely 2026-03** |
| `AbortSignal.any()` | Chrome 116 / Firefox 124 / Safari 17.4 | **Newly available 2024-03** |
| `priority` 选项 | Chrome 101 / Safari 17.2 / **Firefox 132 补齐** | **Newly available 2024-10** |
| `keepalive` 选项 | Chrome 66 / Safari 13 / **Firefox 133 补齐** | **Newly available 2024-11** |
| `bytes()` | Firefox 128 / Safari 18.0 / **Chrome 132 补齐** | **Newly available 2025-01** |
| `for await` 遍历 ReadableStream | Chrome 124 / Firefox 110 / **Safari 27 未发布** | **非 Baseline**（getReader 循环替代） |
| 上传流（`duplex: "half"`） | Chromium 105 / Node 18.13 | **非 Baseline**（Firefox/Safari 未实现） |
| `fetchLater()` | Chrome/Edge 135（2025-04） | **非 Baseline**（仅 Chromium，experimental） |

## 五、选型对比：fetch vs XHR vs 封装库

| 维度 | 原生 fetch | XMLHttpRequest | [Axios](/zh/web-advanced/js-extension/axios/) | [ky](/zh/web-advanced/js-extension/ky/) / [ofetch](/zh/web-advanced/js-extension/ofetch/) |
| --- | --- | --- | --- | --- |
| 异步模型 | Promise | 事件回调 | Promise | Promise |
| 底座 | — | — | XHR（支持 fetch adapter） | fetch |
| HTTP 错误 | fulfill，自查 `ok` | `onload`，自查 `status` | **自动 reject 非 2xx** | 自动 reject 非 2xx |
| 拦截器/hooks | 无 | 无 | interceptors 体系 | hooks（ky）/ 拦截选项（ofetch） |
| 重试/超时 | 手写（AbortSignal） | timeout 属性 | 需插件/手配 | **内建 retry + timeout** |
| 自动 JSON | 手动两步 | 手动 | 自动 | 自动 |
| 上传进度 | 缺位（流式仅 Chromium） | **原生 onprogress** | 有（XHR adapter 下） | 无 |
| 响应流式 | **一等公民** | 无 | 受限 | 透传 fetch 能力 |
| SW/Cache/边缘运行时 | **一等公民** | 不可用 | 部分 | 可用 |
| 体积 | 0 | 0 | 较大 | 小 |
| 适用 | 简单场景/平台集成/流式 | 仅存量 + 上传进度 | 大型项目统一治理/老浏览器 | 现代项目的轻治理层 |

## 六、易错点清单

- **不查 `response.ok` 直接 `json()`**：404 错误页进 JSON 解析器，收获 `SyntaxError`——头号易错点，两步走不能省。
- **在 catch 里等 HTTP 错误**：4xx/5xx 根本不进 catch——错误分流三层走（网络/取消/HTTP）。
- **body 读两次**：`bodyUsed` 后抛 TypeError——先 `clone()`，且克隆必须发生在读取前。
- **带 body 的 Request 发两次**：发送即消费——同样先 clone。
- **204/空响应调 `json()`**：解析必炸——先看 status/Content-Length。
- **FormData 手设 Content-Type**：丢 boundary——交给浏览器。
- **GET 塞 body**：TypeError——查询串用 `URLSearchParams`。
- **`no-cors` 当 CORS 偏方**：opaque 响应 status 0 全读不到，成败都无从判断——服务端配头才是正解。
- **`credentials: "include"` 服务端只配 ACAO `*`**：凭据模式禁通配——具体源 + `Access-Control-Allow-Credentials: true`。
- **include 了 Cookie 还是不发**：`SameSite=Lax/Strict` 另一道闸——两套都要过。
- **`headers` 里写 Cookie/Origin/Referer**：禁设头静默忽略——凭据走 credentials，Referer 走 `referrer` 选项。
- **跨域读自定义响应头读不到**：CORS 响应头白名单——服务端 `Access-Control-Expose-Headers`。
- **改 fetch 响应的 headers**：immutable 抛 TypeError——`new Response(old.body, {...})` 重建。
- **复用已 abort 的 signal / timeout 信号放重试循环外**：新请求秒 reject——每轮新建。
- **把 `AbortError` 灌进错误监控**：取消是预期流程——按 `err.name` 过滤。
- **只认 `TimeoutError` 忘了 Chrome 103–123**：老版超时抛 AbortError——双兜底。
- **4xx 重试 / POST 无幂等键重试**：业务错重试无意义；超时 ≠ 未送达，重复下单事故——只重试网络类与 5xx/429，POST 配 `Idempotency-Key`。
- **`for await` 遍历 body 不检测**：Safari 27 前不支持——`getReader()` 循环。
- **流式解码不带 `stream: true`**：多字节字符跨块乱码——`decode(value, { stream: true })` + 结尾冲刷。
- **进度条超 100%**：Content-Length（压缩后）对 `read()` 字节（解压后）——统一口径或降级不确定态。
- **keepalive 报文超 64 KiB**：立即 TypeError 且配额在途共享——压缩/采样/拆分。
- **fetchLater 裸调不 catch**：`QuotaExceededError` 随时可能（第三方共享配额）——防御性捕获 + keepalive 降级。
- **`only-if-cached` 不配 `same-origin`**：TypeError——绑定出现。
- **以为 `redirect: "manual"` 能拿 Location**：opaqueredirect 全滤——用 `redirected`/`url` 事后校验。

## 七、权威链接

- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) —— 总览与接口索引
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) —— 官方使用指南（请求/响应/流式/克隆）
- [MDN: RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit) —— 选项全参考（本页选项表的一手来源）
- [MDN: Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) ｜ [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) ｜ [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) —— 三对象接口页
- [MDN: AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) —— timeout()/any()/throwIfAborted 与错误区分示例
- [MDN: Using Deferred Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Deferred_Fetch) ｜ [Window.fetchLater()](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetchLater) —— fetchLater 与配额体系
- [Chrome Docs: Streaming requests with the fetch API](https://developer.chrome.com/docs/capabilities/web-apis/fetch-streaming-requests) —— 上传流四硬限与特性检测的官方出处
- [WHATWG Fetch Living Standard](https://fetch.spec.whatwg.org/) —— 规范原文（keepalive 配额、CORS 协议细节）
- [whatwg/fetch](https://github.com/whatwg/fetch) —— 规范仓库与提案讨论
- 本站关联：[跨域机制](/zh/base/network/net-cors/) ｜ [HTTP 缓存首部](/zh/base/network/net-http-basics/guide-line/connection-range-caching) ｜ [SSE](/zh/web-advanced/web-api/sse/) ｜ [Axios](/zh/web-advanced/js-extension/axios/) / [ky](/zh/web-advanced/js-extension/ky/) / [ofetch](/zh/web-advanced/js-extension/ofetch/)
