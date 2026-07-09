---
layout: doc
---

# axios

::: tip 本篇范围
本篇聚焦 **axios —— 一个同时运行于浏览器与 Node.js 的、基于 Promise 的 HTTP 客户端**。它与 ky、ofetch（基于原生 fetch 的轻量封装）同属「HTTP 请求」选型方向，本篇在对比与定位时一笔带过另两者。版本基线 **axios 1.x**（v1 引入 `AxiosHeaders`、fetch 适配器、`signal` 取代 `CancelToken` 等）。
:::

axios 由 Matt Zabriskie 创建、现由社区团队维护，官方定位是「**Promise based HTTP client for the browser and node.js**」。它是**同构（isomorphic）**的：同一套 API 在浏览器底层用 `XMLHttpRequest`（v1 起也可切 fetch 适配器），在 Node.js 底层用 `http` 模块，对外都暴露统一的 Promise 接口。相比原生 `fetch`，它把开发中反复要写的「便利层」做成了开箱即用——**JSON 自动序列化/解析、内置 `timeout`、非 2xx 自动 reject、请求/响应拦截器、上传下载进度、XSRF 防护**——这些用 fetch 都得自己封装。

它最该被记牢的几条「现状」：**取消请求应使用 `AbortController` + `signal`**（v0.22.0 起支持），旧的 `CancelToken` 仍可用但**自 v0.22.0 起已被官方标注弃用**，新项目不应再用；**读写请求头推荐用 v1 的 `AxiosHeaders` 类**（`set/get/setContentType` 等，大小写不敏感），直接操作 headers 普通对象的旧写法也被标注弃用；**配置按「库默认 < 实例 defaults < 单次请求 config」三级合并**；**多个请求拦截器逆序（LIFO）执行、多个响应拦截器顺序（FIFO）执行**——这是 axios 最容易答错的细节。

## 评价

**优点**

- **同构、一套 API 跑两端**：浏览器（XHR）与 Node（http）统一接口；v1 起还有 fetch 适配器，可进 Service Worker / edge runtime
- **JSON 双向自动转换**：请求对象自动 `JSON.stringify` 并带 `application/json`，响应自动 `JSON.parse` 到 `response.data`，省去 fetch 的 `res.json()`
- **更符合直觉的错误模型**：非 2xx 默认 reject 进 catch（fetch 需手动判断 `res.ok`），`error.response` / `error.request` 三分支清晰
- **内置超时**：`timeout`（毫秒）开箱即用；fetch 要配合 `AbortController` + 定时器自己实现
- **拦截器**：请求/响应拦截器集中处理鉴权注入、全局错误、token 刷新、loading 状态
- **取消请求**：现代 `AbortController`（一个 signal 可取消多个请求），`axios.isCancel` 区分主动取消
- **实例隔离**：`axios.create()` 出的实例各有独立 `defaults` 与 `interceptors`，适合按服务/模块封装
- **数据格式全面**：自动序列化到 JSON / `multipart/form-data`（FormData）/ `application/x-www-form-urlencoded`，支持上传下载进度、Node 端带宽限速
- **TypeScript 友好**：自带类型声明，`axios.get<User>()` 泛型标注 `response.data`

**缺点**

- **有打包体积**：相比浏览器原生、零依赖的 `fetch`，引入 axios 有体积成本（极简场景未必划算）
- **核心不含重试/缓存**：自动重试要靠 `axios-retry`、响应缓存要靠 `axios-cache-interceptor` 等第三方插件
- **底层默认非 fetch**：浏览器默认走 XHR，某些只暴露 fetch 的极简运行时需显式切 fetch 适配器
- **拦截器顺序反直觉**：请求拦截器 LIFO、响应拦截器 FIFO，初学者常因此调错执行次序
- **历史包袱与迁移成本**：`CancelToken` → `AbortController`、直接操作 headers → `AxiosHeaders`、v1 起跨域 XSRF 需显式 `withXSRFToken` 等行为变化，老代码升级需留意
- **「全局默认」易踩坑**：在 `axios.defaults` 上设鉴权头会发给所有域名（含第三方），更推荐用实例默认隔离

## 文档地址

[axios Documentation](https://axios-http.com/docs/intro)

## GitHub 地址

[axios/axios](https://github.com/axios/axios)

## 幻灯片地址

<a href="/SlideStack/axios-slide/" target="_blank">axios</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=axios" target="_blank" rel="noopener noreferrer">axios 测试题</a>
