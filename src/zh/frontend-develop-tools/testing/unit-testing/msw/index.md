---
layout: doc
---

# MSW

Mock Service Worker —— API mocking 的工业标准。它在**网络层**拦截请求（浏览器用 Service Worker、Node.js 用对原生 `http`/`https` 的拦截器），不 patch `fetch` / `axios`、不侵入业务代码，因此 fetch、axios、ky、React Query、Apollo 等全部通吃。同一套 handlers 可跨测试（Vitest）、开发、Storybook、Playwright 复用。

## 评价

**优点**

- **不侵入代码**：业务照常发请求，MSW 在网络层拦截，无需依赖注入 mock 客户端
- **客户端无关**：不绑定任何 HTTP 库，fetch / axios / ky / got 通吃
- **一套 handlers 多处复用**：Vitest 测试、浏览器开发、Storybook、Playwright 共享
- **拥抱 Web 标准**：v2 完全基于 Fetch API 的 `Request` / `Response`
- **测试 / 开发双栖**：既能在单元 / 集成测试里拦截，也能在开发期 mock 尚未就绪的后端接口

**缺点**

- **概念门槛**：Service Worker 注册、`setupServer` vs `setupWorker`、生命周期三步，初次配置有学习成本
- **2.x 破坏性重构**：从 1.x（`rest` + `res(ctx.json())`）迁移到 2.x（`http` + `HttpResponse`）改动较大
- **不适合纯函数单测**：无网络调用的纯逻辑测试用 `vi.mock` 更轻；MSW 面向有 HTTP 调用的场景
- **浏览器需 Service Worker 文件**：要 `msw init public/` 生成 `mockServiceWorker.js` 并随项目维护

## 文档地址

[MSW](https://mswjs.io/)

## GitHub地址

[MSW](https://github.com/mswjs/msw)

## 幻灯片地址

<a href="/SlideStack/msw-slide/" target="_blank">MSW</a>
