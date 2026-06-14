---
layout: doc
---

# ofetch

::: tip 本篇范围
本篇聚焦 **ofetch —— unjs 出品、基于原生 fetch 的同构 HTTP 封装**。它与 axios（XHR 时代的事实标准）、ky（同为 fetch 轻量封装）同属「请求库」选型方向，本篇在对比与定位时一笔带过另两者。版本基线 **ofetch 1.x**。
:::

ofetch 由 unjs 团队维护，官方定位是「**A better fetch API. Works on node, browser and workers.**」。它不是另起炉灶的网络栈，而是把原生 `fetch` 的人体工学短板补齐：**自动解析响应**（按 content-type 智能判断，JSON 直接给对象）、**自动序列化 body**（普通对象自动 `JSON.stringify` 并补 `content-type`/`accept`）、**非 2xx 自动抛 FetchError**（修正 fetch「404/500 也算成功」的反直觉）、**内置 retry / timeout**、**四个拦截器**（onRequest / onRequestError / onResponse / onResponseError），以及 **`create` / baseURL / query** 的实例化复用。

它最该被记牢的一条身份：**Nuxt 的全局 `$fetch` 就是 ofetch**——Nuxt 官方把 ofetch 自动导入为 `$fetch` 别名，`useFetch` 又在 `$fetch` 之上封装 SSR 安全获取。所以「学会 ofetch ≈ 学会 Nuxt 数据请求的底座」。**2026 年的现状**：ofetch 1.x 是 unjs 生态（Nuxt、Nitro、h3）的默认 HTTP 客户端；它运行时仅依赖三个小库——`destr`（安全解析）、`node-fetch-native`（同构兜底）、`ufo`（URL/query 处理），体积只有几 KB。

## 评价

**优点**

- **同构**：Node、浏览器、Worker、边缘运行时一套代码，默认用 `globalThis.fetch`，缺 fetch 的老 Node 由 node-fetch-native 兜底
- **自动解析 / 序列化**：`await ofetch(url)` 直接拿数据；POST 传对象自动 JSON 化，免去 `.json()` 与手动 `stringify`
- **错误更友好**：非 2xx 自动抛 `FetchError`，message 形如 `[GET] "/x": 404 Not Found`，结构化错误体在 `error.data`
- **内置重试 / 超时**：retry / retryDelay / retryStatusCodes / timeout 开箱即用，原生 fetch 这些都得自己搭
- **拦截器完整**：onRequest / onResponse / onRequestError / onResponseError，支持单个或数组，可做统一鉴权与错误处理
- **轻量**：仅依赖 destr / ufo / node-fetch-native，体积远小于 axios
- **Nuxt 底座**：`$fetch` 即 ofetch，与 unjs 生态无缝

**缺点**

- **无进度回调**：不提供 axios 式 `onUploadProgress` / `onDownloadProgress`，要进度得自己用流计算
- **不做运行时校验**：泛型 `ofetch<T>()` 只是编译期断言，不会校验响应真为 T（要校验需配 zod 等）
- **错误体藏在 error.data**：从 axios 迁来易忘——错误响应体不在 `error.response.data` 习惯位，而在 `error.data`
- **生态/插件不如 axios 庞大**：axios 历史更久，第三方适配器、拦截器生态更丰富
- **写方法默认不重试**：POST/PUT/PATCH/DELETE 默认 retry=0，不了解的人会以为「重试没生效」
- **headers 在拦截器里是 Headers 实例**：onRequest 里改头要用 `.set()`，直接赋属性无效，是常见坑

## 文档地址

[ofetch on GitHub](https://github.com/unjs/ofetch)

## GitHub 地址

[unjs/ofetch](https://github.com/unjs/ofetch)

## 幻灯片地址

<a href="/SlideStack/ofetch-slide/" target="_blank">ofetch</a>
