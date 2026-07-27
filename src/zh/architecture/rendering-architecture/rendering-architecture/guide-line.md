---
layout: doc
outline: [2, 3]
---

# 核心模式详解

> 基于 web.dev《Rendering on the Web》+ React/Next.js/Astro 官方文档编写，对照 React 19 / Next.js App Router / Astro 4+ 稳定版

## 速查

- **CSR**：浏览器内 JS 渲染 DOM，`ReactDOM.createRoot`；TBT 易恶化、SEO 差、服务器零成本，适合后台/工具类应用
- **SSR**：每次请求服务端生成完整 HTML，`renderToString`（遗留）/ `renderToPipeableStream`（流式）；SEO 好、首屏快，但服务器有成本
- **SSG**：构建时生成静态 HTML，CDN 边缘缓存；TTFB/FCP/TBT 三项全优，web.dev 实测「多数站点最优默认」
- **ISR**：Next.js 专属，SSG + 周期/按需刷新；`revalidate: N`（定时）/ `revalidatePath` / `revalidateTag`（按需）；stale-while-revalidate 语义
- **Streaming SSR**：React 18+ `renderToPipeableStream` + `<Suspense>` 边界流式发送 HTML chunk；`onShellReady` / `onAllReady` 控制时机
- **Selective Hydration**：多 Suspense 边界并行水合；用户点击在 capture 阶段同步水合父级边界（优先级水合）
- **Islands**：Astro 默认零 JS；`client:load/idle/visible/only/media` 选择性水合；岛屿隔离运行
- **Server Islands**：Astro 4+ `server:defer` 把昂贵服务端代码移出主渲染流，占位先显示再异步替换
- **RSC**：React 19 Server Components 在服务端提前渲染，输出 RSC Payload；async 组件支持、直接读 DB/文件系统
- **'use client' 边界**：标记后其全部 imports 进 client bundle，必须下沉到最小交互组件
- **混合渲染**：电商产品页 = 布局/描述 SSG + 价格库存 ISR + 推荐 SSR + 加购 CSR
- **反模式**：全量 Rehydration、React 18 仍用 `renderToString`、'use client' 放根 Layout、纯 SPA 做 SEO 站、SSG 用于百万级 URL、ISR 当 SSR 用实时数据

## CSR（Client-Side Rendering，客户端渲染）

### 原理

浏览器先下载一个**几乎空的 HTML**（通常只有一个 `<div id="root"></div>` 和 `<script src="bundle.js"></script>`），然后浏览器解析执行 `bundle.js`，由 JS 在运行时**用 DOM API 创建/更新元素**完成渲染。React 入口是 `createRoot` from `react-dom/client`：

```ts
import { createRoot } from "react-dom/client";
import App from "./App";

// 客户端入口：在 #root 上挂载整个 React 树
createRoot(document.getElementById("root")!).render(<App />);
```

### Trade-off

**优点**

- **服务器零计算成本**：HTML 是静态空壳，CDN 直接分发，无 SSR/SSG 构建负担
- **页面切换流畅**：首次加载后所有路由切换在客户端完成（无新 HTML 请求），SPA 体验
- **部署简单**：纯静态文件，任何 CDN / 静态托管都能跑
- **交互响应即时**：水合完成后所有交互本地处理

**缺点**

- **首屏慢**：必须等 `bundle.js` 下载 + 解析 + 执行后才有内容；TBT 容易恶化
- **SEO 差**：爬虫拿到的 HTML 是空壳，依赖爬虫执行 JS（Google 能、百度/微信内置浏览器较弱）
- **无 JS 不可用**：禁用 JS 或 JS 加载失败时页面完全空白
- **TTFB 快但 FCP 慢**：HTML 字节立刻到（TTFB 极短），但首屏内容必须等 JS

### 适用场景

- **后台管理系统**：内网、登录后访问、SEO 无关
- **在线编辑器 / IDE 类**：Figma、Notion 编辑态、CodeSandbox——交互密度极高、首屏可接受 loading
- **私有 SaaS 控制台**：用户已登录、对首屏容忍度高
- **Web App 类应用**：地图、邮件客户端、聊天

> Astro 官方称纯 SPA「对大多数项目是过重选择（heavy-handed）」——除非真的是「应用」而非「页面」，否则别默认 CSR。

### 反模式

- **用纯 SPA 做内容型/SEO 关键站点**：博客、电商详情页、营销页走 CSR = 自废 SEO + 拖累首屏

## SSR（Server-Side Rendering，服务端渲染）

### 原理

每次浏览器请求 URL，服务端**当场**运行 React 应用并生成**完整 HTML 字符串**返回。浏览器拿到 HTML 后立刻显示内容（FCP 早），同时下载 `bundle.js` 进行 **Hydration**（水合：把 HTML 与 React 树连接、附加事件监听）。

React 提供两套 API：

```ts
// 遗留同步 API（React 17-）：不支持 Suspense 流式、单线程阻塞
import { renderToString } from "react-dom/server";
const html = renderToString(<App />);

// React 18+ 流式 API（推荐生产）：
import { renderToPipeableStream } from "react-dom/server"; // Node
import { renderToReadableStream } from "react-dom/server"; // Web Streams / Edge
renderToPipeableStream(<App />, {
  onShellReady() { /* 整体框架就绪，可以开始 pipe 到 res */ },
  onAllReady() { /* 所有 Suspense 边界完成 */ },
  onShellError() { /* 框架级错误 */ },
  bootstrapModules: ["/dist/client.js"],
}).pipe(res);

// 客户端水合入口（注意是 hydrateRoot 不是 createRoot）
import { hydrateRoot } from "react-dom/client";
hydrateRoot(document.getElementById("root")!, <App />);
```

### Trade-off

**优点**

- **SEO 好**：爬虫拿到完整 HTML，可读取所有内容
- **首屏内容快**：HTML 一返回立刻显示，FCP 比 CSR 早
- **支持个性化/实时数据**：每次请求都重新生成，反映最新数据

**缺点**

- **服务器成本**：每次请求都要执行 React 渲染、消耗 CPU
- **TTFB 比 SSG 慢**：必须等数据 + 渲染完成才能返回首字节
- **全量 Rehydration 反模式**（web.dev 明确「rarely the best option」）：
  - HTML 与 bundle 双传输「一个应用两倍代价」
  - 移动端可「页面看起来加载完实际几分钟不可用」（hydration 长任务阻塞主线程）
- **同步 `renderToString` 的痛点**：必须取完所有数据才能显示、必须加载完所有代码才能水合、必须水合完所有组件才能交互

### 适用场景

- **个性化页面**：用户仪表盘、社交时间线、推荐 feed
- **实时数据页**：股票行情、比赛直播、库存查询
- **受保护内容**：登录后才能看的页面（SSR 时校验 cookie）
- **大量动态 URL**：商品详情、用户主页，URL 数量无法在 build 时枚举

### 反模式

- **React 18 仍用 `renderToString` 做生产 SSR**：等于放弃 React 18 三大 SSR 改进
- **全量 Rehydration**：对整个 SSR 应用一次性 hydration，长任务阻塞主线程

## SSG（Static Site Generation，静态站点生成）

### 原理

在 **build 时**为每个 URL 生成独立的 HTML 文件，构建产物是纯静态文件，部署到 CDN 边缘节点，每次请求都是「CDN 直接返回缓存」——**没有任何服务器计算**。

```ts
// Next.js Pages Router 示例
export async function getStaticProps() {
  const posts = await fetchPosts(); // build 时执行
  return { props: { posts } };
}

// Astro 默认就是 SSG
// src/pages/index.astro → dist/index.html
```

### Trade-off

**优点**

- **三项核心指标全优**：web.dev 实测 SSG 在 TTFB / FCP / TBT 三项都接近最优
- **服务器零成本**：纯静态文件，CDN / GitHub Pages / Netlify 免费托管
- **CDN 边缘缓存友好**：HTML 直接放离用户最近的节点
- **SEO 极好**：完整 HTML + 极快首屏
- **高可用**：CDN 缓存兜底，源站宕机也不影响

**缺点**

- **内容变更需 rebuild**：每次内容更新都要重新 build + 部署
- **构建时间爆炸**：百万级 URL 时 build 几小时、产物几十 GB
- **不支持个性化**：build 时不知道是哪个用户
- **无法处理动态 URL**：URL 必须在 build 时可枚举

### 适用场景

- **博客 / 文档站**：内容更新频率低、URL 数量可控
- **营销页 / 官网首页**：相对静态、追求极致首屏
- **电商分类/类目页**：相对稳定，可定期 rebuild
- **个人作品集 / 简历**

> VitePress、Astro 默认、Hexo、Next.js `getStaticProps` 都是 SSG。本网站（illegalscreed.cn 的 VitePress 笔记）就是 SSG。

### 反模式

- **SSG 用于百万级 URL 或不可预测 URL**：构建时间与产物量爆炸，应换 ISR

### Static Rendering vs Prerendering（关键区别）

| 维度 | Static Rendering | Prerendering |
| --- | --- | --- |
| 输出 | 完整可用 HTML | 客户端应用的初始 HTML 快照 |
| 禁用 JS 测试 | 大部分功能仍可用 | 基本惰性（必须 JS 启动才能交互） |
| 典型 | Astro / VitePress / Next.js SSG | `react-snapshot`、`prerender-spa-plugin` |

> 禁用 JS 测试法：浏览器 DevTools → Settings → Disable JavaScript → 刷新。静态渲染页面大部分仍可用，预渲染页面基本惰性。

## ISR（Incremental Static Regeneration，增量静态再生）

### 原理

**Next.js 专属**机制——SSG 的「构建一次永远不变」太死板，SSR 的「每次请求都重渲染」太昂贵，ISR 折中：**build 时生成静态 HTML，但允许在后台按规则重新生成**。

两种触发方式：

```ts
// 1. 时间触发：每隔 N 秒后台重建（Pages Router）
export async function getStaticProps() {
  return {
    props: { product },
    revalidate: 60, // 60 秒后下次请求触发后台重建
  };
}

// App Router 在 fetch 或路由段配置
export const revalidate = 60;
await fetch(url, { next: { revalidate: 60 } });

// 2. 按需触发（on-demand）：业务事件主动调用
import { revalidatePath, revalidateTag } from "next/cache";
revalidatePath("/products/123");       // 失效某路径
revalidateTag("products");              // 失效所有带该 tag 的 fetch
```

### stale-while-revalidate 三态工作机制

| 请求时刻 | 行为 |
| --- | --- |
| **首次请求** | 返回 build 产物（与 SSG 相同） |
| **缓存命中**（revalidate 窗口内） | 返回缓存，**SSG 速度** |
| **失效后首次请求** | 立刻返回**陈旧版本**（stale），同时后台重建（revalidate）；下次请求拿到新版本——**SSR 速度 + 用户无感** |

### Trade-off

**优点**

- **SSG 的速度 + SSR 的新鲜度**：缓存命中接近 SSG 速度，又能保持数据更新
- **可扩展到百万级页面**：不需要一次性 build 全部，按需生成 + 后台重建
- **服务器成本远低于 SSR**：仅在 revalidate 触发时计算

**缺点**

- **不真实时**：默认返回陈旧版本，秒级延迟
- **仅 Next.js 原生支持**：其他框架需手动实现（CDN + 后台重建队列）
- **`revalidate: N` 定时器模式有浪费**：内容几乎总有业务原因才变，定时触发常做无用功

### 适用场景

- **电商商品详情**：价格库存几分钟变一次，可接受秒级陈旧
- **新闻 / 资讯**：发布后内容相对稳定，按需 revalidate 即可
- **大流量内容站**：百万级 URL + 中等更新频率
- **带 CDN 缓存的内容 API**

### 反模式

- **把 ISR 当 SSR 用于实时数据**：股票、聊天、库存秒级场景，ISR 会返回陈旧版本

### on-demand 优先于定时

Vercel 官方建议：**内容变化几乎总有业务原因（发布、编辑、上架）而非定时器**，按需验证（`revalidatePath` / `revalidateTag`）既避免陈旧数据又避免无效重建。优先用 on-demand，仅在确实有自然时间窗口（如汇率每小时更新）时才用 `revalidate: N`。

## Streaming SSR（流式服务端渲染）

### 原理

React 18 引入的新一代 SSR 架构。传统 SSR 用 `renderToString` 必须等所有数据 + 所有组件渲染完成才能返回首字节 HTML；Streaming SSR 配合 `<Suspense>` 边界**把 HTML 拆成多个 chunk 流式发送**：先发已就绪的外壳（shell），各 Suspense 边界内的内容就绪后再异步插入。

```tsx
// Server: renderToPipeableStream 配合 Suspense
import { renderToPipeableStream } from "react-dom/server";
import { Suspense } from "react";

function ServerApp() {
  return (
    <html>
      <body>
        <Shell />
        <Suspense fallback={<Spinner />}>
          <Comments /> {/* 数据慢的部分，先发 Spinner，就绪后再插 */}
        </Suspense>
      </body>
    </html>
  );
}

renderToPipeableStream(<ServerApp />, {
  onShellReady() {
    // 外壳就绪，开始流式返回（headers + shell HTML）
    res.writeHead(200);
    stream.pipe(res);
  },
  onAllReady() { /* 所有 Suspense 边界完成 */ },
});
```

### React 18 SSR 三大改进

| 痛点 | React 17（renderToString） | React 18（Streaming + Suspense） |
| --- | --- | --- |
| 必须取完所有数据才能显示 | 整页阻塞 | 各 Suspense 边界独立就绪，先发 fallback 再插内容 |
| 必须加载完所有代码才能水合 | 必须等整个 bundle | `React.lazy` 可与 SSR 配合（之前不行），代码分割友好 |
| 必须水合完所有组件才能交互 | 整页 hydration 阻塞 | **Selective Hydration**：多边界并行水合，点击优先 |

### Selective Hydration（选择性水合）

React 18 的核心创新——多个 Suspense 边界**并行水合**，且支持**优先级水合**：

- 用户点击某个尚未水合的按钮时，React 在事件 capture 阶段**同步**水合其父级 Suspense 边界
- 同时跳过兄弟组件的水合（让出主线程）
- 创造「点击立刻响应」的错觉，即使整页还在水合

### renderToPipeableStream vs renderToString 四项能力对比

| 能力 | renderToString | renderToPipeableStream |
| --- | --- | --- |
| Suspense 边界流式 | 不支持 | 支持 |
| 流式 HTML chunk | 不支持（同步整体返回） | 支持（onShellReady / onAllReady） |
| 选择性水合 | 不支持 | 支持（多 Suspense 边界并行） |
| 背压处理（backpressure） | 无 | 有（pipe 自带） |

### Trade-off

**优点**

- **解决 SSR 三大痛点**：数据并行 + 代码分割友好 + 选择性水合
- **TTFB 大幅改善**：外壳就绪就立刻发，不等慢数据
- **支持 React.lazy**：之前 SSR 用不了，现在能配合代码分割
- **优先级水合**：用户实际交互的部分先活，移动端体验大幅改善

**缺点**

- **必须 React 18+**：旧项目要升级
- **需要正确划分 Suspense 边界**：边界过粗等于没用，过细调试复杂
- **hydration mismatch 仍可能发生**：服务端与客户端渲染结果不一致时报错

### 适用场景

- **所有 React 18+ 的 SSR 生产环境**：默认选这个，不要再回 `renderToString`
- **首屏有慢数据但想快显示骨架**：评论区、推荐栏、个性化数据
- **大型应用代码分割多**：可配合 `React.lazy`

### 反模式

- **React 18 仍用 `renderToString`**：不支持 Suspense、同步阻塞、无选择性水合，等于自废 React 18 的 SSR 升级

## Islands Architecture（群岛架构）

### 原理

**Astro 提出并发扬光大**的范式（同类的还有 Fresh，基于 Preact）。核心理念：

- 默认输出**零 JavaScript** 的静态 HTML——比 SSG 还激进，连 hydration 都没有
- 页面上的「交互组件」（按钮、轮播、表单）作为**独立的「岛屿」**
- 每个岛屿**独立水合**，互不影响（run in isolation）
- 用 `client:*` 指令精确控制每个岛屿**何时/是否**水合

```astro
---
// src/pages/index.astro
import Button from "../components/Button.astro";
import Carousel from "../components/Carousel.jsx";
---

<!-- 静态 HTML，零 JS -->
<h1>产品介绍</h1>
<p>这是产品说明...</p>

<!-- 岛屿 1：立即水合 -->
<Button client:load>立即购买</Button>

<!-- 岛屿 2：浏览器空闲时水合（非关键交互） -->
<Comments client:idle />

<!-- 岛屿 3：进入视口才水合（不视达不下载） -->
<HeavyCarousel client:visible />
```

### client:* 指令矩阵

| 指令 | 何时水合 | 适用场景 |
| --- | --- | --- |
| `client:load` | 页面加载立即 | 首屏即需交互的组件（导航、CTA 按钮） |
| `client:idle` | 浏览器空闲 | 非关键交互（页面底部表单） |
| `client:visible` | 进入视口（IntersectionObserver） | 轮播、评论区（不视达不下载 JS） |
| `client:only` | 仅客户端渲染（跳过 SSR） | 依赖 window/localStorage 的组件 |
| `client:media` | 媒体查询匹配 | 仅移动/仅桌面展示的交互 |

### Server Islands（Astro 4+）

`server:defer` 指令把**昂贵的服务端代码**移出主渲染流——占位内容先显示，再异步替换为真实服务端内容：

```astro
---
import Avatar from "../components/Avatar.astro";
---
<Header />
<!-- 占位骨架先发，服务端慢查询完成后异步替换 -->
<Avatar server:defer />
<Article />
```

适用：用户头像（要查 DB）、个性化优惠（要后端计算）等。

### Trade-off

**优点**

- **极小 JS payload**：默认零 JS，仅交互组件加水合——按字节计 JS 是最慢的资产
- **首屏极快**：FCP/TTI 都接近静态 HTML
- **岛屿隔离**：一个岛屿的 bug 不影响其他
- **可渐进增强**：禁用 JS 仍能阅读内容
- **Server Islands**：服务端慢查询不再阻塞整个页面

**缺点**

- **交互密度高的应用不适用**：仪表盘、编辑器等比 SPA 还重
- **岛屿间通信复杂**：没有「父组件 state」，需用 CustomEvent / Shared Store
- **生态偏内容站**：表单库、动画库的集成不如 Next.js 完整

### 适用场景

- **内容主导站点**：博客、文档、营销页、新闻站
- **电商展示页**：商品介绍、活动落地页
- **官网 / 落地页**：交互少但首屏要极致快

### 反模式

- **给所有组件都加 `client:load`**：等于退化成传统 SPA 全量水合，丢失 Islands 的核心价值
- **把 Islands 用作 SPA**：仪表盘类应用应该用 CSR

### Client Islands vs Server Islands 角色分工

| 类型 | 处理 | 典型 |
| --- | --- | --- |
| **Client Islands** | 客户端交互性 | 轮播、表单、菜单、Tab 切换 |
| **Server Islands** | 动态服务端内容 | 用户头像、个性化优惠、实时库存 |

## RSC（React Server Components，React 服务端组件）

### 原理

**React 19 + Next.js App Router 的默认范式**——React 团队对「React 应用该在哪里渲染」的根本性重新设计。RSC 在**服务端**（请求时或构建时）执行组件逻辑，输出 **RSC Payload**（一种二进制组件树格式，不是 HTML 字符串），由 Client Component 在浏览器中**直接渲染为已完成的 React 树**——无需再次 hydration。

```tsx
// app/products/page.tsx —— 默认就是 Server Component，无需任何指令
import { db } from "@/lib/db";
import LikeButton from "./LikeButton";

// 可以是 async 函数（RSC 独有能力）
export default async function ProductsPage() {
  const products = await db.product.findMany(); // 直接读 DB
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>
          {p.name}
          {/* Server Component 可作 children 传给 Client Component */}
          <LikeButton productId={p.id} />
        </li>
      ))}
    </ul>
  );
}

// app/products/LikeButton.tsx —— 加购、点赞等需客户端能力，标 'use client'
"use client";
import { useState } from "react";
export default function LikeButton({ productId }: { productId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? "❤" : "♡"}</button>;
}
```

### RSC vs SSR 三根本区别

| 维度 | SSR | RSC |
| --- | --- | --- |
| 输出形态 | HTML 字符串 | RSC Payload（二进制组件树） |
| 组件代码是否发到浏览器 | 是（hydration 需要） | **否**（Server Component 不发到浏览器） |
| 是否进 client bundle | 是 | **否**（重型库可挡在 client bundle 之外） |
| 是否水合 | 是（hydrateRoot） | 否（已是服务端结果） |
| async 组件 | 不支持 | 支持 |

### RSC 能做 / 不能做

**能做**

- `async function Component()` —— 直接 await 数据
- 直接读 DB、文件系统、内部 API（带密钥）
- 把重型库（markdown 解析器、Markdown 渲染器、语法高亮）导入但**不发到浏览器**
- 把 JSX / Server Component 作 children 传给 Client Component

**不能做**

- `useState` / `useReducer` / `useEffect` / `useLayoutEffect` —— 无客户端状态/生命周期
- `onClick` / `onChange` / 任何事件处理 —— 无浏览器事件
- `window` / `document` / `localStorage` —— 无浏览器 API
- 用 React Context 直接穿透 —— Context 必须包在 Client Component 里通过 children 传 Server Component
- 跨边界 props 必须可序列化（不可传函数实例、Class 实例、含函数的 Map）

### 'use client' 边界规则

```tsx
// ❌ 反模式：use client 放根 Layout
"use client";
import { useState } from "react";
export default function RootLayout({ children }) {
  const [x] = useState(0);
  return <html><body>{children}</body></html>;
}
// 后果：所有子树（含大量可静态部分）全部进 client bundle

// ✅ 正确：边界下沉到最小交互叶子
// app/layout.tsx（Server Component，无指令）
import ThemeProvider from "./ThemeProvider";
export default function RootLayout({ children }) {
  return <html><body><ThemeProvider>{children}</ThemeProvider></body></html>;
}
// app/ThemeProvider.tsx
"use client"; // 仅这个文件及 imports 进 client bundle
import { useState } from "react";
export default function ThemeProvider({ children }) { /* ... */ }
```

> Server Component 作 children 传入 Client Component 时，**不会**进入 client module graph——它仍在服务端渲染，结果作为 React 元素以可序列化形式传过去。

### Server Functions（'use server'，注意区分）

```tsx
// app/actions.ts
"use server";
import { revalidatePath } from "next/cache";
export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get("title") } });
  revalidatePath("/posts");
}
```

`'use server'` 标记的是**可从客户端调用的服务端函数**（Server Functions / Server Actions），发到客户端的是 RPC 引用而非源码。**不是 RSC 标记**——RSC 本身无需任何指令。

### use() + Suspense 跨边界流式

React 官方推荐范式：

```tsx
// Server Component：服务端 await 关键数据 + 创建低优先级 Promise
export default async function Page() {
  const critical = await db.getCritical(); // 等待，阻塞首屏
  const slowPromise = db.getSlow(); // 不 await，传给 client
  return (
    <main>
      <Critical data={critical} />
      <Suspense fallback={<Spinner />}>
        <SlowData promise={slowPromise} />
      </Suspense>
    </main>
  );
}

// Client Component：用 use() 恢复服务端传入的 Promise
"use client";
import { use } from "react";
export default function SlowData({ promise }: { promise: Promise<Slow> }) {
  const data = use(promise); // 关键内容先返回 HTML，slow 数据流式填充
  return <div>{data.name}</div>;
}
```

### Trade-off

**优点**

- **大幅减少 client bundle**：Server Component 不发到浏览器，重型库挡在外面
- **直接访问后端**：DB / 文件系统 / 内部 API，无中间 API 层
- **首屏快 + 流式友好**：关键数据 await、次要数据流式
- **DX 现代**：写组件像写后端，无需 getServerSideProps 这种特殊函数

**缺点**

- **心智模型复杂**：Server / Client 边界、Context 限制、可序列化约束
- **生态绑定 Next.js / Waku 等少数框架**：纯 React + Vite 用不了 RSC
- **`'use client'` 边界放错就废**：根 Layout 加了等于退化成 CSR
- **调试链路长**：服务端错误 + 客户端水合 + Payload 序列化，三层

### 适用场景

- **Next.js App Router 项目**：默认就是 RSC，享受所有收益
- **内容站 + 交互混合**：内容部分 RSC、交互部分 Client Component
- **重型库使用**：markdown 渲染、语法高亮、图表库——RSC 让它们不出现在 bundle 里

### 反模式

- **`'use client'` 放根 Layout**：所有子树全部进 client bundle，丧失 RSC 减少 JS 的核心收益
- **在 Server Component 里写 `useState` / `useEffect` / `onClick` / `window`**：直接报错
- **跨边界传非可序列化值**：函数实例、Class 实例、React Context 直接穿透
- **混淆 `'use server'` 与 RSC**：`'use server'` 标 Server Functions，不是 RSC 标记

## 选型决策矩阵

按「数据新鲜度 × SEO 需求 × 服务器成本」三轴选型：

| 场景 | 推荐模式 | 备选 |
| --- | --- | --- |
| 博客 / 文档（永不变） | **SSG** | Islands |
| 营销页 / 官网首页 | **SSG** | Islands |
| 内容站 + 偶尔更新 | **ISR**（on-demand） | SSG + 重建 |
| 电商商品详情 | **ISR**（on-demand） | Streaming SSR |
| 新闻 / 资讯站 | **ISR** | SSR |
| 个性化仪表盘 | **SSR** | Streaming SSR |
| 实时数据（股票、聊天） | **SSR + WebSocket** | Streaming SSR |
| 后台管理系统 | **CSR** | SSR（如需首屏） |
| 文档 + 内嵌交互 demo | **Islands** | RSC |
| React 18+ 内容站 | **RSC + Streaming SSR** | Next.js App Router |
| Vue/Svelte 内容站 | **SSG**（Nuxt/SvelteKit） | SSR |
| 百万级 URL 商品库 | **ISR** | Streaming SSR |

## 混合渲染（同一页多种模式）

**复杂应用几乎都需要混合渲染**——同一页不同部位按「变更频率 × 个性化程度」切分。经典案例：**电商产品页**：

| 部位 | 变更频率 | 个性化 | 推荐模式 |
| --- | --- | --- | --- |
| 页面布局、商品描述、图片 | 几乎不变 | 否 | **SSG** |
| 价格、库存、销量 | 分钟级 | 否 | **ISR**（on-demand `revalidatePath`） |
| 「猜你喜欢」推荐 | 用户相关 | 是 | **SSR**（请求时计算） |
| 加入购物车按钮 | 立即响应 | 是 | **CSR**（水合后本地状态） |

Next.js App Router 实现示例：

```tsx
// app/product/[id]/page.tsx
import { Suspense } from "react";
import ProductInfo from "./ProductInfo";         // SSG（静态）
import PriceStock from "./PriceStock";           // ISR
import Recommendations from "./Recommendations"; // SSR
import AddToCart from "./AddToCart";             // CSR (Client Component)

export const revalidate = 60; // 路由段 ISR 默认

export default async function Page({ params }) {
  return (
    <>
      <ProductInfo id={params.id} />
      <PriceStock id={params.id} />
      <Suspense fallback={<Spinner />}>
        <Recommendations userId={getCookie()} />
      </Suspense>
      <AddToCart id={params.id} />
    </>
  );
}
```

Astro 实现示例（Server Islands + Client Islands）：

```astro
---
import ProductInfo from "../components/ProductInfo.astro";
import PriceStock from "../components/PriceStock.astro";
import Recommendations from "../components/Recommendations.astro";
import AddToCart from "../components/AddToCart.jsx";
---
<ProductInfo />          <!-- SSG -->
<PriceStock server:defer /> <!-- Server Island：异步服务端 -->
<Recommendations server:defer /> <!-- Server Island -->
<AddToCart client:load /> <!-- Client Island：客户端交互 -->
```

> 混合渲染是性能/新鲜度/成本三角的最优解——不要执着于「全站用一种模式」。

## 跨边界 props 与 server-only / client-only

**跨 Server/Client 边界 props 必须可序列化**：

```ts
// ❌ 反模式：传函数实例
<Chart data={data} renderTooltip={(item) => <div>{item.name}</div>} />

// ✅ 正确：传可序列化标识符
<Chart data={data} tooltipKey="name" />
```

**`server-only` / `client-only` 包**：构建期防止越界 import

```ts
// lib/db.ts（含 API key）
import "server-only"; // 误导入 Client Component 时构建期直接报错，防 API key 泄露
export const db = ...;

// lib/window-helpers.ts
import "client-only"; // 误导入 Server Component 时报错
export const isMobile = () => window.innerWidth < 768;
```

## 反模式汇总

- **全量 Rehydration**：web.dev 明确「rarely the best option」——「一个应用两倍代价」+ 移动端「表面就绪实际几分钟不可用」
- **React 18 仍用 `renderToString`**：不支持 Suspense、同步阻塞、无选择性水合
- **`'use client'` 放根 Layout / 顶层组件**：所有子树全部进 client bundle
- **在 Server Component 里写 `useState` / `useEffect` / `onClick` / `window.localStorage`**：直接报错
- **纯 SPA（CSR）做内容型 / SEO 关键站点**：TBT/INP 恶化、爬虫读取困难
- **SSG 用于百万级 URL 或不可预测 URL**：构建时间与产物量爆炸，应换 ISR
- **把 ISR 当 SSR 用于高频实时数据**：缓存命中返回陈旧版本
- **在 Astro 给所有组件都加 `client:load`**：等同退化成传统 SPA 全量水合
- **混淆 Prerendering 与 Static Rendering**：预渲染产物仍需 JS 启动才能交互
- **跨 Server/Client 边界传非可序列化值**：函数实例、Class 实例、React Context 直接穿透
- **在 Server Component 中误用 `'use server'` 当作 RSC 标记**：`'use server'` 标 Server Functions，不是 RSC
- **LHCI 把 ISR 缓存的页面和 SSR 比指标**：ISR 命中是 SSG 速度、失效首次是 SSR 速度，对比前固定状态

## 下一步

- [参考](./reference.md)：完整 7 模式对比表、选型矩阵、版本状态、官方资源
