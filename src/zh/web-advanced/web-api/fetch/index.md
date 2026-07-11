---
layout: doc
---

# Fetch API

Fetch API 是 **WHATWG Fetch 标准定义的浏览器网络请求接口**：以 `fetch()` 函数为入口，用 **Promise + Request/Response/Headers 对象模型**全面取代事件驱动的 XMLHttpRequest，并与 Service Worker（请求拦截）、Cache API（响应存储）、Streams API（流式读写）、AbortSignal（取消与超时）这些平台能力深度打通。核心 API 自 2017-03 起 **Baseline Widely available 多年全绿**，Node 18+/Deno/Bun 也内置同一套接口，使它成为跨端统一的网络层标准；近年增量持续补齐——`Response.json()` 静态方法与 `Headers.getSetCookie()`（2023-09 补齐，2026-03 转 Widely）、`AbortSignal.timeout()`（Widely available）、`AbortSignal.any()`（2024-03 Baseline）、`priority` 请求优先级（2024-10 全绿）、`keepalive` 离页存活（2024-11 Firefox 133 补齐后 Baseline）、`bytes()` 读取（2025-01 Baseline）；前沿面还有上传流（`duplex: "half"`，Chromium 105+）与离页可靠上报的 `fetchLater()`（Chrome 135+，非 Baseline）。

## 评价

**优点**

- **跨端统一的标准网络层**：浏览器主线程、Web Worker、Service Worker、Node 18+、Deno、Bun 同一套 API，一份请求代码多端复用，封装库（axios/ky/ofetch）如今也都以 fetch 为底座
- **Promise 原生集成 + 可组合对象模型**：`async/await` 直写；`Request`/`Response` 是一等对象，可构造、可传递、可克隆——Service Worker 拦截转发、请求模板复用这类场景是 XHR 完全给不了的
- **与平台能力深度打通**：SW `fetch` 事件拦截、Cache API 直接存取 Response、`response.body` 就是 `ReadableStream`（AI 流式输出、大文件分片的底层）、AbortSignal 统一取消语义、CSP `connect-src` 统一管控
- **声明式选项映射 HTTP 行为**：`mode`/`credentials`/`cache`/`redirect` 用一个枚举值声明跨域策略、凭据策略、缓存策略，语义清晰且浏览器强制执行
- **标准演进活跃**：取消/超时/组合信号、请求优先级、离页请求（keepalive → fetchLater）持续落地，长期投资安全

**局限**

- **HTTP 4xx/5xx 不 reject**：`fetch()` 只在网络层失败时 reject（TypeError），404/500 照样 fulfill——`response.ok` 必须手查，是新手第一大坑
- **原生无超时、无重试、无拦截器**：超时要 `AbortSignal.timeout()` 组合，重试/拦截器/统一错误治理全靠手写或上封装库
- **进度能力残缺**：下载进度要基于 `response.body` 手动累计字节（对照 Content-Length），上传进度原生缺位（上传流仅 Chromium，且限制多），XHR 的 `onprogress` 在这点上仍有不可替代性
- **"静默失败"面不小**：`no-cors` 的 opaque 响应 status 恒 0、读不到任何头和体，"能发出去但读不到"的陷阱常年坑人
- **底层 API 样板多**：JSON 要"检查 ok → await json()"两步走，错误分流（网络/超时/取消/HTTP/解析）全部手工

一句话选型：**浏览器里发请求的默认答案就是 fetch**（还留在 XHR 的理由只剩上传进度事件一条）；工程项目需要拦截器、自动重试、统一超时治理时，上 [Axios](/zh/web-advanced/js-extension/axios/)、[ky](/zh/web-advanced/js-extension/ky/)、[ofetch](/zh/web-advanced/js-extension/ofetch/) 这类封装——但它们的底层与心智模型仍是本叶的 fetch，原生语义不清楚，封装库的坑照样踩。

## 本叶地图

- [入门](./getting-started) —— 定位（为什么取代 XHR）、一分钟上手、Promise 心智模型（**不 reject HTTP 错误码**）、与 XHR 逐项对比、与封装库的分工边界、Baseline 现状
- [Request、Response 与 Headers](./guide-line/request-response) —— 三对象构造与属性、body 单次消费与 `clone()`、六种 body 读取方法（含 `bytes()`）、`Response.json()` 静态方法、Headers 遍历规则与不可变类别
- [取消与超时](./guide-line/abort-timeout) —— AbortController 基础、`AbortSignal.timeout()`/`AbortSignal.any()` 组合信号、AbortError/TimeoutError 分类处理、可取消 API 封装、重试模式与幂等考量
- [请求模式三件套](./guide-line/cors-credentials-cache) —— `mode` 与 opaque 响应陷阱、`credentials` 三档、`cache` 六档、`redirect`/`referrerPolicy`/`integrity`/`priority`
- [流式与离页请求](./guide-line/streaming-keepalive) —— `response.body` 流式读取与下载进度、文本解码、上传流 `duplex: "half"` 的 Chromium 现状、`keepalive` 与 64 KiB 配额、sendBeacon 对比、`fetchLater()` 前沿
- [参考](./reference) —— `fetch()` 选项全表 + 三对象 API 表 + 错误分类表 + 选型对比 + 易错点清单 + 权威链接

## 文档地址

[MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## GitHub 地址

[whatwg/fetch](https://github.com/whatwg/fetch)（Living Standard 规范仓库）

## 幻灯片地址

<a href="/SlideStack/fetch-slide/" target="_blank">Fetch API</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=fetch-api" target="_blank" rel="noopener noreferrer">Fetch API 测试题</a>
