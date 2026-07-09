---
layout: doc
---

# ky

::: tip 本篇范围
本篇聚焦 **ky**——sindresorhus 出品、**基于 Fetch API 的轻量 HTTP 客户端**。重点在：相比原生 fetch 补齐的工程化能力（方法快捷方式、非 2xx 自动抛错、重试 retry、超时 timeout、hooks）、`prefix`/`baseUrl` 前缀、`.json()` 等响应快捷方法、错误体系（HTTPError / TimeoutError / NetworkError）、实例 `ky.create` / `ky.extend`、与 axios / 原生 fetch 的取舍，以及 **ESM-only** 这一关键约束。版本基线 **ky 2.x**（当前最新 **2.0.2**，`latest` 标签），其中 `prefixUrl → baseUrl/prefix` 是从 1.x 升级的主要破坏性变更。
:::

ky 是 **Sindre Sorhus** 开源的现代 HTTP 客户端，官方一句话定位是「**a tiny and elegant HTTP client based on the Fetch API**」。它**不是另起炉灶的网络栈**，而是对宿主环境原生 `fetch` 的一层极简封装——复用平台的 `Request`/`Response`/`AbortController` 等标准原语，只在其上补齐日常开发最需要的能力。官方强调它「just a tiny package with no dependencies」：**零运行时依赖、体积极小**。

相比裸 `fetch`，ky 开箱补齐了一批工程化默认：**方法快捷方式**（`ky.post()`）、**把非 2xx 状态码视为错误并自动抛 `HTTPError`**、**失败自动重试**（默认对幂等方法重试 2 次）、**超时**（默认每次尝试 10s）、**上传/下载进度**、**`prefix`/`baseUrl` 前缀**、**自定义实例**（`create`/`extend`）、**hooks** 生命周期钩子、以及 **Standard Schema 响应校验**。其中「非 2xx 自动抛错」和「自动重试」是与原生 fetch 最被反复强调的两点差异——fetch 对 404/500 仍 resolve、且从不重试。

**ESM-only 是使用 ky 前必须知道的硬约束**：ky 是**纯 ESM 包**（`package.json` 里 `type: "module"`、`exports` 只暴露 ESM 入口），必须 `import ky from 'ky'`，**不能 `require('ky')`**。CommonJS 项目里只能用动态 `import()`，或把项目迁移到 ESM。这是 sindresorhus 全家桶的一贯风格，也是最常见的踩坑点。2.x 还把运行时门槛提到 **Node.js 22+**（1.x 为 Node 18+），并要求现代浏览器/Bun/Deno。

## 评价

**优点**

- **基于 Web 标准 fetch**：复用 `Request`/`Response`/`AbortController`，贴近平台、心智负担低，未来随平台演进
- **零依赖、体积极小**：官方称 tiny package with no dependencies，对被下游依赖的库尤其能省 bundle、缩小供应链面
- **错误语义更直觉**：默认非 2xx 抛 `HTTPError`，无需每次手写 `if (!res.ok)`；网络失败/超时分别封装为 `NetworkError`/`TimeoutError`
- **内置重试**：默认对幂等方法重试 2 次，支持指数退避、`jitter` 抖动、`Retry-After` 尊重、`shouldRetry` 自定义、`ky.retry()` 强制重试
- **强大的 hooks**：`init`/`beforeRequest`/`beforeRetry`/`beforeError`/`afterResponse` 覆盖整条生命周期，鉴权续期、统一改请求/响应/错误都有处可落
- **优雅的实例体系**：`ky.create`（全新）与 `ky.extend`（继承深合并）让「API 客户端分层」自然成型
- **TS-first**：用 TypeScript 编写，`.json()` 默认返回 `unknown`（非 `any`）更安全，支持泛型与 Standard Schema 校验

**缺点**

- **ESM-only**：纯 ESM 包，CommonJS/`require` 项目接入有摩擦，需动态 `import()` 或迁 ESM；老构建链可能踩坑
- **不兼容老旧浏览器**：基于 fetch，IE 等无 fetch 环境无法直接用（这类场景 axios 的 XHR 实现更稳）
- **生态成熟度不及 axios**：拦截器约定、第三方适配、社区资料量上 axios 更厚
- **运行时门槛升高**：2.x 要求 Node 22+，旧环境需停留 1.x 或升级运行时
- **上传进度有环境限制**：`onUploadProgress` 依赖请求流支持，部分浏览器/环境会被静默忽略
- **错误体读取有陷阱**：2.x 为填 `error.data` 已消费 `error.response` 的 body，再 `error.response.json()` 会失败，需改读 `error.data`

## 文档地址

[ky README](https://github.com/sindresorhus/ky#readme)

## GitHub 地址

[sindresorhus/ky](https://github.com/sindresorhus/ky)

## 幻灯片地址

<a href="/SlideStack/ky-slide/" target="_blank">ky</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=ky" target="_blank" rel="noopener noreferrer">ky 测试题</a>
