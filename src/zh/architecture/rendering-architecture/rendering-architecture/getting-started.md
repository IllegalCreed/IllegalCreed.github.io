---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 web.dev《Rendering on the Web》+ React/Next.js/Astro 官方文档编写，对照 React 19 / Next.js App Router / Astro 4+ 稳定版

## 速查

- **核心问题**：HTML 在哪、何时生成？—— build 时（SSG）/ 请求时服务端（SSR）/ 浏览器（CSR）/ build + 周期刷新（ISR）/ 流式分块（Streaming SSR）/ 选择性水合（Islands）/ 服务端组件树（RSC）
- **七模式速记**：CSR（SPA）/ SSR（请求时全量 HTML）/ SSG（构建时静态）/ ISR（SSG + 周期/按需刷新）/ Streaming SSR（HTML 分块流式 + 选择性水合）/ Islands（默认零 JS，岛屿水合）/ RSC（Server Components 输出 Payload）
- **静态优先原则**：web.dev 实测 SSG 在 TTFB/FCP/TBT 三项全优且无需服务器计算，是默认最优；仅在「需要那一刻的数据」时才引入 SSR
- **ISR 三态**：首次请求返构建产物、缓存命中返 SSG 速度、失效后首次请求返 SSR 速度 + 同时后台重建
- **React 18 SSR 三改进**：`renderToPipeableStream`（流式 HTML）+ Suspense 边界选择性水合 + 用户点击触发 capture 阶段同步水合父级
- **RSC vs SSR 三根本区别**：组件代码是否发到浏览器、是否进 client bundle、输出形态（HTML 字符串 vs RSC Payload 二进制组件树）
- **'use client' 边界**：标记后其全部 imports 进 client bundle，必须下沉到最小交互组件而非根 Layout
- **Astro client:\* 指令**：`load`（立即）/ `idle`（空闲）/ `visible`（进视口，不视达不下载）/ `only`（仅客户端）/ `media`（媒体查询匹配）
- **混合渲染范式**：电商产品页 = 布局/描述 SSG + 价格库存 ISR + 推荐 SSR + 加购 CSR

## 渲染模式选型定位

「渲染模式选型」不是讨论「哪个框架更好」，而是讨论**对一个具体页面（甚至页面的一部分），HTML 应该在哪里、什么时候生成**。这是 Web 性能工程的最底层决策之一：

- **生成位置**：浏览器（client）/ 服务端（server）/ 构建机（build time）
- **生成时机**：build 时一次性 / 每次请求 / 每次请求但带缓存 / 完全在浏览器运行时
- **生成形态**：完整 HTML 字符串 / 流式 HTML chunk / RSC Payload（二进制组件树）/ 纯 JS 渲染 DOM

这个决策直接影响 TTFB（首字节时间）、FCP（首次内容绘制）、TBT（总阻塞时间，hydration 主因）、数据新鲜度、SEO 友好度、服务器成本、构建时间七维度。**没有一种模式在所有维度上全优**——这就是「选型」的本质。

> web.dev 的核心结论：SSR + Rehydration 在多数站点并非最佳选项，静态渲染（SSG）三项核心指标全优且无需服务器计算。**静态优先，按需引入 SSR**。

## 七种渲染模式速览

| 模式 | 全称 | HTML 在哪生成 | 何时生成 | 典型框架 |
| --- | --- | --- | --- | --- |
| **CSR** | Client-Side Rendering | 浏览器 | 运行时（JS 启动后） | 早期 SPA（Create React App、Vue CLI 默认） |
| **SSR** | Server-Side Rendering | 服务端 | 每次请求 | Next.js Pages Router `getServerSideProps`、Nuxt SSR |
| **SSG** | Static Site Generation | 构建机 | build 时 | Next.js `getStaticProps`、Astro 默认、VitePress |
| **ISR** | Incremental Static Regeneration | 构建机 + 服务端后台 | build + 周期/按需刷新 | Next.js 专属（`revalidate` / `revalidatePath`） |
| **Streaming SSR** | Streaming Server-Side Rendering | 服务端 | 每次请求，分块流式发送 | React 18 `renderToPipeableStream` / `renderToReadableStream` |
| **Islands** | Islands Architecture | 构建机（HTML）+ 浏览器（岛屿） | build + 岛屿按需水合 | Astro、Fresh（Preact） |
| **RSC** | React Server Components | 服务端（请求时或构建时） | 输出 RSC Payload | React 19 + Next.js App Router |

> 注意：**七种模式不互斥**。Next.js App Router 默认 RSC + Streaming SSR + 路由段 ISR/SSG 混用；Astro 可同时用 SSG + Server Islands + Client Islands；同一页不同部位可走不同模式（混合渲染）。

## 选型决策树

按以下顺序回答，可定位到推荐模式：

**1. 这页内容多久变一次？**

- 永不变 / 一年更几次 → **SSG**（构建一次，CDN 边缘缓存）
- 几分钟到几天变一次 → **ISR**（按需 `revalidatePath` 或定时 `revalidate: N`）
- 每次请求都不同（如个性化推荐、购物车） → 继续问 2

**2. 这页内容需要「那一刻的数据」吗？**

- 不需要、可接受秒级陈旧 → **ISR** 或 **SSG**
- 需要、可接受 TTFB 多 100-300ms → **SSR**（或 Streaming SSR）
- 实时（股票、聊天、协作） → **SSR + WebSocket / SSE**（HTML 走 SSR，更新走推送）

**3. 是否有强 SEO 需求（内容站、电商详情页、博客）？**

- 是 → 不能纯 CSR，必须 SSR / SSG / ISR / RSC 之一（让爬虫拿到完整 HTML）
- 否（后台管理、内部工具） → **CSR** 足够，省服务器成本

**4. 这页是内容主导（少量交互）还是交互主导？**

- 内容主导（博客、文档、营销页） → **Islands**（默认零 JS，仅交互组件水合）
- 交互主导（仪表盘、编辑器） → **CSR**（初始加载后所有交互本地化）

**5. 用的是 React 18+ + Next.js App Router 吗？**

- 是 → 默认 **RSC + Streaming SSR**，按路由段配置 SSG/ISR/SSR；'use client' 边界下沉
- 否（Vue/Svelte/Solid） → 选对应框架的 SSR/SSG/ISR（Nuxt routeRules / SvelteKit prerender）

> 决策树只是入门捷径。复杂站点（电商、社交、内容平台）几乎所有页都需要**混合渲染**——见 [核心模式详解](./guide-line.md) 的「混合渲染」一节。

## 关键概念辨析

**SSR ≠ RSC**

| 维度 | SSR | RSC |
| --- | --- | --- |
| 输出形态 | HTML 字符串 | RSC Payload（二进制组件树） |
| 浏览器是否拿到组件代码 | 是（hydration 需要） | 否（Server Component 不发到浏览器） |
| 是否进 client bundle | 是 | 否（重型库可挡在 client bundle 之外） |
| 是否水合 | 是（hydrateRoot） | 否（已经是服务端结果，无需重跑） |

**Static Rendering ≠ Prerendering**

| 维度 | Static Rendering | Prerendering |
| --- | --- | --- |
| 输出 | 完整可用 HTML | 客户端应用的初始 HTML 快照 |
| 禁用 JS 测试 | 大部分功能仍可用 | 基本惰性（需 JS 启动才能交互） |
| 典型 | Astro / VitePress / Hexo | `react-snapshot`、`prerender-spa-plugin` |

**'use client' ≠ 'use server'**

| 指令 | 标记的是 | 作用 |
| --- | --- | --- |
| `'use client'` | Client Component 模块边界 | 标记后该文件及所有 imports 进 client bundle |
| `'use server'` | Server Functions（可被客户端调用的服务端函数） | 标记的函数发 RPC 引用而非源码，**不是 RSC 标记** |

> RSC 本身无需任何指令——App Router 中所有 `.js(x)` / `.ts(x)` 文件默认就是 Server Component，只有需要客户端能力（useState/useEffect/onClick）时才加 `'use client'`。

## 下一步

- [核心模式详解](./guide-line.md)：七种模式逐个深入（原理 / trade-off / 适用场景）+ 选型决策矩阵 + 混合渲染 + 反模式
- [参考](./reference.md)：完整 7 模式对比表、选型矩阵、版本状态、官方资源
