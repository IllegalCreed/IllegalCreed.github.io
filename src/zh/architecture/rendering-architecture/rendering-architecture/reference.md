---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 web.dev《Rendering on the Web》+ React/Next.js/Astro 官方文档编写，对照 React 19 / Next.js App Router / Astro 4+ 稳定版

## 速查

- **七模式速记**：CSR（浏览器）/ SSR（请求时全量 HTML）/ SSG（build 时静态）/ ISR（SSG + 周期/按需刷新）/ Streaming SSR（HTML 分块流式 + 选择性水合）/ Islands（默认零 JS，岛屿水合）/ RSC（Server Components 输出 Payload）
- **核心 API**：CSR `createRoot`、SSR `renderToPipeableStream`（Node）/ `renderToReadableStream`（Edge）、Hydration `hydrateRoot`、RSC 无显式指令（默认 Server Component）+ `'use client'` 边界
- **关键指令**：Astro `client:load/idle/visible/only/media`、Astro 4+ `server:defer`、Next.js `'use client'` / `'use server'` / `revalidate` / `revalidatePath` / `revalidateTag`
- **决策三轴**：数据新鲜度 × SEO 需求 × 服务器成本
- **静态优先**：web.dev 实测 SSG 三项核心指标全优，仅在「需要那一刻的数据」时才引入 SSR
- **React 18 SSR 三改进**：流式 HTML + 选择性水合 + 优先级水合
- **RSC 三区别 SSR**：输出 Payload（非 HTML）、不发到浏览器、不进 client bundle、不水合
- **混合渲染**：电商产品页 = 布局 SSG + 价格 ISR + 推荐 SSR + 加购 CSR
- 完整说明见 [入门](./getting-started.md) / [核心模式详解](./guide-line.md)

## 7 模式完整对比表

| 模式 | HTML 生成位置 | 生成时机 | SEO | TTFB | FCP | TBT | 数据新鲜度 | 服务器成本 | 典型框架 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **CSR** | 浏览器 | 运行时 | 差 | 极快 | 慢 | 高 | 实时 | 零 | CRA、Vue CLI |
| **SSR** | 服务端 | 每次请求 | 好 | 慢 | 快 | 中 | 实时 | 高 | Next.js Pages、Nuxt SSR |
| **SSG** | 构建机 | build 时 | 极好 | 极快 | 极快 | 极低 | build 时 | 零 | Astro、VitePress、Hexo |
| **ISR** | 构建 + 后台 | build + 周期/按需 | 极好 | 极快 | 极快 | 极低 | 秒级延迟 | 低 | Next.js 专属 |
| **Streaming SSR** | 服务端流式 | 每次请求分块 | 好 | 中 | 快 | 低 | 实时 | 高 | React 18 + Next.js |
| **Islands** | 构建机 + 浏览器 | build + 岛屿水合 | 极好 | 极快 | 极快 | 极低 | build 时 | 零 | Astro、Fresh |
| **RSC** | 服务端 | 请求时 | 好 | 中 | 快 | 低 | 实时 | 中 | React 19 + Next.js |

## 核心 API 速查

### CSR

```ts
import { createRoot } from "react-dom/client";
createRoot(document.getElementById("root")!).render(<App />);
```

### SSR（同步遗留，React 17-）

```ts
import { renderToString } from "react-dom/server";
const html = renderToString(<App />);
// 不支持 Suspense 流式，单线程阻塞
```

### SSR（流式，React 18+ 推荐）

```ts
// Node 环境
import { renderToPipeableStream } from "react-dom/server";
const stream = renderToPipeableStream(<App />, {
  onShellReady() { /* 外壳就绪，开始 pipe */ },
  onAllReady() { /* 所有 Suspense 完成 */ },
  onShellError(err) { /* 框架级错误 */ },
  bootstrapModules: ["/dist/client.js"],
  onError(err) { /* 边界内错误 */ },
});
stream.pipe(res);

// Web Streams / Edge 环境
import { renderToReadableStream } from "react-dom/server";
const stream = await renderToReadableStream(<App />, {
  bootstrapModules: ["/dist/client.js"],
});
return new Response(stream, { headers: { "Content-Type": "text/html" } });
```

### Hydration

```ts
import { hydrateRoot } from "react-dom/client";
hydrateRoot(document.getElementById("root")!, <App />);
// 注意：是 hydrateRoot 不是 createRoot（createRoot 是纯 CSR 入口）
```

### RSC（Next.js App Router）

```tsx
// app/page.tsx —— 默认就是 Server Component
export default async function Page() {
  const data = await db.query(); // 直接读 DB
  return <div>{data.name}</div>;
}

// 需要 Client Component 时加 'use client'
"use client";
import { useState } from "react";
export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}

// Server Functions（注意：不是 RSC 标记）
"use server";
export async function action(formData: FormData) { /* ... */ }
```

### ISR（Next.js）

```ts
// 1. 时间触发（Pages Router）
export async function getStaticProps() {
  return { props: { data }, revalidate: 60 }; // 60 秒
}

// 2. 时间触发（App Router）
export const revalidate = 60;
// 或在 fetch 上
await fetch(url, { next: { revalidate: 60 } });

// 3. 按需（on-demand，App Router）
import { revalidatePath, revalidateTag } from "next/cache";
revalidatePath("/products/123");   // 路径级失效
revalidateTag("products");           // tag 级失效（标记在 fetch 上）
```

### Astro Islands

```astro
<Button client:load>立即水合</Button>
<Comments client:idle />
<Carousel client:visible />
<ClientOnly client:only>仅客户端渲染</ClientOnly>
<MobileMenu client:media="(max-width: 768px)" />

<!-- Server Islands（Astro 4+）-->
<Avatar server:defer />
```

## 选型决策矩阵（场景 → 模式）

| 场景 | 数据变更 | SEO | 推荐 | 框架示例 |
| --- | --- | --- | --- | --- |
| 博客 / 文档 | 永不变 | 强 | **SSG** | VitePress / Astro / Hexo |
| 营销页 / 官网首页 | 几乎不变 | 强 | **SSG** | Astro / Next.js SSG |
| 内容站 + 偶尔更新 | 周更 | 强 | **ISR** on-demand | Next.js |
| 电商商品详情 | 分钟级 | 强 | **ISR** on-demand | Next.js |
| 新闻 / 资讯 | 小时级 | 强 | **ISR** | Next.js |
| 个性化仪表盘 | 实时 | 弱 | **SSR** / Streaming | Next.js / Nuxt |
| 股票 / 实时图表 | 秒级 | 弱 | **SSR + WebSocket** | 自定义 |
| 后台管理系统 | 实时 | 无 | **CSR** | CRA / Vite SPA |
| 文档 + 交互 demo | 几乎不变 | 强 | **Islands** | Astro |
| React 内容站 | 实时 | 强 | **RSC** | Next.js App Router |
| Vue/Svelte 内容站 | 几乎不变 | 强 | **SSG** | Nuxt / SvelteKit |
| 百万级 URL 商品库 | 分钟级 | 强 | **ISR** | Next.js |

## 核心概念辨析

### Static Rendering vs Prerendering

| 维度 | Static Rendering | Prerendering |
| --- | --- | --- |
| 输出 | 完整可用 HTML | 客户端应用 HTML 快照 |
| 禁用 JS 测试 | 大部分仍可用 | 基本惰性 |
| 典型 | Astro / VitePress | `react-snapshot`、`prerender-spa-plugin` |

### SSR vs RSC

| 维度 | SSR | RSC |
| --- | --- | --- |
| 输出 | HTML 字符串 | RSC Payload（二进制组件树） |
| 组件代码发到浏览器 | 是 | 否 |
| 进 client bundle | 是 | 否 |
| 是否水合 | 是 | 否 |
| async 组件 | 不支持 | 支持 |

### 'use client' vs 'use server'

| 指令 | 标记对象 | 作用 |
| --- | --- | --- |
| `'use client'` | Client Component 模块边界 | 标记后该文件及所有 imports 进 client bundle |
| `'use server'` | Server Functions | 标记的函数发 RPC 引用，**不是 RSC 标记** |

### renderToPipeableStream vs renderToString

| 能力 | renderToString | renderToPipeableStream |
| --- | --- | --- |
| Suspense 流式 | 不支持 | 支持 |
| 流式 HTML chunk | 不支持 | 支持 |
| 选择性水合 | 不支持 | 支持 |
| 背压处理 | 无 | 有 |

## 版本状态

| 框架 / 库 | 当前稳定版 | 关键变化 |
| --- | --- | --- |
| **React 18**（2022.03 GA） | 18.x | 引入 Streaming SSR（`renderToPipeableStream`）、Selective Hydration、Suspense for Data Fetching；Server Components 概念 |
| **React 19**（2024 GA） | 19.x | 稳定化 Server Components、Server Actions（`'use server'`）、`use()` API、`'use client'` 边界语义；当前生产推荐 |
| **Next.js** | App Router 主线 | Pages Router 的 `getStaticProps`/`getServerSideProps` 逐步让位于 App Router（默认 RSC + 流式）；ISR 在 App Router 通过 `fetch` 的 `next.revalidate` 或路由段 `revalidate` 配置；PPR（Partial Prerendering）实验特性 |
| **Astro** | 4.x+ | Islands 是稳定核心范式（v1 起）；Server Islands（`server:defer`）Astro 4+ 引入并稳定；client:* 指令全集稳定 |
| **Nuxt 3** | routeRules 配置 | 提供 SSR/SSG/ISR/hybrid 渲染模式 |
| **SvelteKit** | 当前 | prerender/ssr 动态配置 |
| **Qwik Resumability** | 并列范式 | 服务端执行状态可被客户端「恢复」而非「重新执行」，彻底避免水合开销；与七模式并列的另一种思路 |

> 实验性：Next.js PPR（Partial Prerendering，预渲染静态 + Suspense 边界流式动态）需 `experimental.ppr`，截至 2026-07 仍实验中。

## 跨边界约束

### 跨 Server/Client 边界 props 必须可序列化

```ts
// ❌ 反模式
<Chart renderTooltip={(item) => <div />} />

// ✅ 正确
<Chart tooltipKey="name" />
```

### React Context 不支持 Server Components

```tsx
// ❌ 在 Server Component 里 useContext：报错
// ✅ Context 必须包在 Client Component 里
"use client";
import { createContext, useContext } from "react";
const Ctx = createContext(null);
// 通过 children 传 Server Component（不进 client module graph）
export function Provider({ children }) {
  return <Ctx.Provider value={null}>{children}</Ctx.Provider>;
}
```

### server-only / client-only 防越界

```ts
// 含 API key 的服务端代码
import "server-only"; // 误导入 Client Component 时构建期报错

// 浏览器专属工具
import "client-only"; // 误导入 Server Component 时报错
```

## 反模式清单

- 全量 Rehydration（web.dev 明确「rarely the best option」）
- React 18+ 仍用 `renderToString` 做生产 SSR
- `'use client'` 放根 Layout / 顶层组件
- 在 Server Component 里写 `useState` / `useEffect` / `onClick` / `window`
- 纯 SPA 做 SEO 关键站点
- SSG 用于百万级 URL 或不可预测 URL
- 把 ISR 当 SSR 用于高频实时数据
- 在 Astro 给所有组件都加 `client:load`
- 混淆 Prerendering 与 Static Rendering
- 跨 Server/Client 边界传非可序列化值
- 在 Server Component 中误用 `'use server'` 当作 RSC 标记
- ISR `revalidate: N` 用于「内容只在业务事件触发时才变」的场景（应改用 on-demand）

## 官方资源

- web.dev《Rendering on the Web》：[https://web.dev/rendering-on-the-web/](https://web.dev/rendering-on-the-web/)
- React《Server Components》：[https://react.dev/reference/rsc/server-components](https://react.dev/reference/rsc/server-components)
- React 18《New Suspense SSR Architecture》#37：[https://github.com/reactwg/react-18/discussions/37](https://github.com/reactwg/react-18/discussions/37)
- Astro《Islands Architecture》：[https://docs.astro.build/en/concepts/islands/](https://docs.astro.build/en/concepts/islands/)
- Astro《Server Islands》：[https://docs.astro.build/en/guides/server-islands/](https://docs.astro.build/en/guides/server-islands/)
- Next.js《Server and Client Components》：[https://nextjs.org/docs/app/getting-started/server-and-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Vercel《How to Choose the Best Rendering Strategy》：[https://vercel.com/blog/how-to-choose-the-best-rendering-strategy-for-your-app](https://vercel.com/blog/how-to-choose-the-best-rendering-strategy-for-your-app)
- React GitHub：[https://github.com/facebook/react](https://github.com/facebook/react)
- Astro GitHub：[https://github.com/withastro/astro](https://github.com/withastro/astro)
- Next.js GitHub：[https://github.com/vercel/next.js](https://github.com/vercel/next.js)
