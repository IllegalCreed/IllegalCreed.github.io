---
layout: doc
---

# 渲染模式选型（CSR / SSR / SSG / ISR / Streaming / Islands / RSC）

「渲染模式选型」回答一个核心工程问题：**HTML 应该在哪里、在什么时候生成？**——是构建时一次性生成静态文件（SSG）、请求时由服务端拼装（SSR）、完全在浏览器里跑（CSR）、构建时生成并周期/按需刷新（ISR），还是在 React 18+ 上把 HTML 分块流式发送并按 Suspense 边界选择性水合（Streaming SSR + Selective Hydration）？这七种主流模式（CSR / SSR / SSG / ISR / Streaming SSR / Islands / RSC）覆盖了现代 Web 应用从静态内容站到实时交互应用的全谱系。web.dev《Rendering on the Web》（Jason Miller & Addy Osmani）给出权威图谱：以「渲染时机 × 数据新鲜度 × SEO 需求」三轴切分，静态渲染在 TTFB / FCP / TBT 三项全优且无需服务器计算，是 web.dev 实测下「多数站点并非 SSR+Rehydration 最佳」结论的依据。Astro 把默认零 JS + 选择性水合（Islands）推为内容站主流；React 18 起 `renderToPipeableStream` / `renderToReadableStream` + Suspense 让流式 SSR 与选择性水合成为生产标配；React 19 稳定化的 Server Components（RSC）进一步把组件代码本身从 client bundle 中剥离——服务端组件不发到浏览器、不进 client bundle、输出 RSC Payload 而非 HTML 字符串，是与 SSR 在「输出形态 / 是否水合 / 是否进 bundle」三个根本维度上都不同的新范式。

本章边界严格限定在「渲染模式选型与产物生成时机」：不深入 webpack/Vite/Rolldown 打包配置（属构建工具章）、不谈 Cache-Control/CDN/Service Worker 缓存策略（属网络优化章）、不覆盖 LCP/INP/CLS 指标的测量与调优（属性能优化章）、不展开 hydration mismatch 调试（hydration 专题）、也不深入 meta/sitemap/structured data（SEO 章）。混合渲染（同一页按部位切分模式，如电商产品页布局 SSG + 价格库存 ISR + 推荐 SSR + 加购 CSR）是本章的高阶综合应用。

## 评价

**优点**

- **决策维度清晰**：TTFB / FCP / TBT / 数据新鲜度 / SEO / 服务器成本 / 构建时间 七维一摆，trade-off 一目了然
- **静态优先的兜底**：web.dev 实测静态渲染（SSG）三项核心指标全优，是「不需要服务器计算」的最优默认，无需过度引入 SSR
- **流式 + 选择性水合**（React 18）：解决了传统 SSR 三大痛点——必须取完所有数据才能显示、必须加载完所有代码才能水合、必须水合完所有组件才能交互
- **Islands 选择性水合**：Astro 默认零 JS，按字节计 JS 是最慢的资产，只给真正交互的组件加水合（client:load/idle/visible/only/media），性能与 DX 两全
- **RSC 减少 client bundle**：Server Components 直接读 DB/文件系统、把重型库挡在 client bundle 之外，是 Next.js App Router 的默认范式
- **混合渲染落地可行**：现代框架（Next.js App Router / Nuxt routeRules / Astro Server Islands）都支持逐路由段、逐部位的混合模式

**缺点**

- **模式多到决策疲劳**：七种主流 + PPR/Qwik Resumability 等实验性范式，新人难以判断何时选哪个
- **概念易混**：SSR 与 RSC 是两个东西（输出 HTML 字符串 vs RSC Payload）、Prerendering 与 Static Rendering 是两个东西（前者仍需 JS 启动才能交互）、'use client' 与 'use server' 是两个东西（前者划定 client module graph 边界，后者标记 Server Functions）
- **框架绑定深**：ISR 仅 Next.js 有；RSC 必须 App Router；Server Islands 必须 Astro 4+；跨框架选型不可平移
- **混合模式调试复杂**：跨 Server/Client 边界 props 必须可序列化、React context 不支持 Server Components、server-only / client-only 边界越界构建期才报错
- **SSR 不是银弹**：web.dev 明确「SSR + Rehydration rarely the best option」——HTML + bundle 双传输是「一个应用两倍代价」，移动端可「页面看起来加载完实际几分钟不可用」

## 文档地址

- [web.dev：Rendering on the Web](https://web.dev/rendering-on-the-web/) — CSR/SSR/SSG/Hydration/Streaming/Progressive Hydration 的官方权威图谱
- [React 官方：Server Components](https://react.dev/reference/rsc/server-components) — RSC 定义、与 SSR 区别、能做/不能做
- [React 18 工作组：New Suspense SSR Architecture #37](https://github.com/reactwg/react-18/discussions/37) — renderToPipeableStream、Selective Hydration、hydrateRoot
- [Astro 官方：Islands Architecture](https://docs.astro.build/en/concepts/islands/) 及 [Server Islands](https://docs.astro.build/en/guides/server-islands/) — client:* 指令、partial hydration、server:defer
- [Next.js 官方：Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — App Router 默认 RSC、use client 边界、RSC Payload
- [Vercel 官方：How to Choose the Best Rendering Strategy](https://vercel.com/blog/how-to-choose-the-best-rendering-strategy-for-your-app) — 选型决策矩阵与混合渲染范式

## GitHub 地址

[facebook/react](https://github.com/facebook/react) · [withastro/astro](https://github.com/withastro/astro) · [vercel/next.js](https://github.com/vercel/next.js)

## 幻灯片地址

<a href="/SlideStack/rendering-architecture-slide/" target="_blank">渲染模式选型</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=706" target="_blank" rel="noopener noreferrer">渲染模式选型 测试题</a>
