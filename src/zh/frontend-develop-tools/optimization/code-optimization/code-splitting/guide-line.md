---
layout: doc
outline: [2, 3]
---

# 分割策略与构建配置

> 基于 MDN / Vue Router / Webpack / Vite & Rolldown / React Router 官方文档 + web.dev 资源提示规范编写，对照 Vite 8 / Webpack 5.108+ / Vue Router 4 / React Router v7.5

## 速查

- **分割原语**：动态 `import('./X')` —— 唯一被所有打包器识别的分割点，返回 `Promise<模块命名空间对象>`，模块仅求值一次并被缓存
- **路由级分割**：Vue Router `component: () => import('./X.vue')`；React Router v6.4+ `lazy: () => import('./X')`，v7.5 对象式 `lazy: { Component, loader, action }` 逐属性并行下载
- **Webpack splitChunks 默认**：`chunks: 'async'`、`minSize: 20000`、`maxAsyncRequests: 30`、`maxInitialRequests: 30`；内置 `defaultVendors`（`test: node_modules`，`priority: -10`）+ `default`（`minChunks: 2`，`priority: -20`）
- **cacheGroups**：`test`（RegExp | 函数）、`priority`（默认 -20，高者胜出）、`reuseExistingChunk: true`、`enforce`、`name`（生产推荐 `false`）
- **chunks 三档**：`'async'`（默认，仅异步）/ `'initial'`（仅入口）/ `'all'`（同步 + 异步都可共享，最强但需谨慎）
- **Vite 8 / Rolldown**：用 `build.rolldownOptions.output.codeSplitting.groups: [{ test, name, minSize?, priority? }]`，Rollup 的 `manualChunks` 已不再支持
- **魔法注释**（Webpack）：`/* webpackChunkName: "x" */`、`/* webpackMode: "lazy" | "eager" | "lazy-once" | "weak" */`、`/* webpackPrefetch: true */`、`/* webpackPreload: true */`、`/* webpackExports: ["x"] */`
- **preload vs prefetch**：preload = 当前导航必用 + 高优先级（须带 `as`）；prefetch = 未来导航投机 + 低优先级（浏览器空闲）
- **vendor 切分原则**：库低频变 → 单独拆 + 按体量再细分（react 核心 / UI 库 / 巨型库各一组），配合 HTTP/2 并行
- **部署兜底三件套**：HTML `Cache-Control: no-cache` + 资源带 hash + Vite 监听 `vite:preloadError` 调 `preventDefault` 后 `location.reload()`
- **反模式**：路由组件包 `defineAsyncComponent` / `manualChunks` 制造循环依赖 / 过度拆分单 chunk < 20kb / `splitChunks.name` 写死字符串 / preload 当 prefetch 用 / 旧 chunk 失效不兜底

## 动态 import() 语义深挖

动态 `import()` 是 ES2020 操作符（不是函数），返回 `Promise<模块命名空间对象>`。它的几个关键性质决定了它为什么能成为「分割原语」：

```ts
// 1. 模块只求值一次，结果被缓存
import("./heavy").then((m1) => {
  console.log(m1 === cachedNamespace); // 第二次 import() 返回同一个命名空间
});
import("./heavy").then((m2) => {
  console.log(m2 === m1); // true —— 缓存命中
});

// 2. 永不抛同步错误 —— 失败走 reject
try {
  import("./non-exists"); // 不会同步抛
} catch (e) {
  // 永远不会进这里
}
import("./non-exists").catch((err) => {
  console.error("加载失败", err); // 错误走这里
});

// 3. 第二参数（ES2025）—— 带导入选项
import("./x", { with: { type: "json" } }); // JSON 模块导入
```

**静态 vs 动态求值时机的关键差异**

```ts
// 静态 import —— main.ts 加载期就把 heavy-lib 求值，无论是否调用 heavy()
import { heavy } from "./heavy-lib";

// 动态 import() —— 只有调用时才求值，不调用就永远不下载
document.querySelector("#btn").addEventListener("click", async () => {
  const { heavy } = await import("./heavy-lib");
  heavy();
});
```

> 「为什么不直接静态 import 全部」——静态 import 在加载期全求值，意味着用户必须为「可能用不到的代码」付下载 + 解析 + 编译成本。动态 import() 把「下载」延迟到真正调用时，是分割能降低首屏体积的根本机制。

## 路由级分割

### Vue Router 路由懒加载

```ts
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // 路由组件必须是个「返回 Promise 的函数」
  { path: "/", component: () => import("./views/Home.vue") },
  { path: "/user/:id", component: () => import("./views/User.vue") },
];

// 把同一路由的嵌套组件聚到同一 chunk（用 webpackChunkName 或 manualChunks）
const groupedRoutes = [
  {
    path: "/dashboard",
    component: () =>
      import(/* webpackChunkName: "group-dashboard" */ "./views/Dashboard.vue"),
    children: [
      {
        path: "stats",
        component: () =>
          import(/* webpackChunkName: "group-dashboard" */ "./views/Stats.vue"),
      },
      {
        path: "settings",
        component: () =>
          import(/* webpackChunkName: "group-dashboard" */ "./views/Settings.vue"),
      },
    ],
  },
];
```

**官方反模式**：不要把路由组件包进 `defineAsyncComponent`：

```ts
// ❌ 反模式：路由组件包 defineAsyncComponent
import { defineAsyncComponent } from "vue";
{ path: "/x", component: defineAsyncComponent(() => import("./X.vue")) }

// ✓ 正确：路由组件就是个返回 Promise 的函数
{ path: "/x", component: () => import("./X.vue") }
```

Vue Router 官方原话：「do NOT use async components as route components」。两者底层都是动态 `import()`，但路由懒加载由 router 调度，异步组件由组件树调度，混用会破坏路由的预取 / 加载流程。

### React Router v7：函数式 vs 对象式 lazy

```ts
// v6.4+ 函数式 —— 模块需具名导出 Component / loader / action / ErrorBoundary
export default [
  {
    path: "/projects/:id",
    lazy: () => import("./routes/project"),
  },
];

// routes/project.ts —— 具名导出
export function Component() { /* ... */ }
export async function loader({ params }) { /* ... */ }
export async function action({ request }) { /* ... */ }
export function ErrorBoundary() { /* ... */ }

// v7.5+ 对象式 —— 逐属性并行加载
export default [
  {
    path: "/projects/:id",
    lazy: {
      Component: () => import("./routes/project/component").then(m => m.default),
      loader: () => import("./routes/project/loader").then(m => m.default),
      action: () => import("./routes/project/action").then(m => m.default),
      ErrorBoundary: () => import("./routes/project/error-boundary").then(m => m.default),
      // 服务端中间件也可懒加载
      unstable_middleware: () => import("./routes/project/middleware").then(m => m.default),
    },
  },
];
```

对象式 `lazy` 的核心收益：

- **逐属性拆文件**：Component / loader / action 各自独立 chunk，不必打包到同一文件
- **并行下载**：浏览器同时拉多个 chunk，比单个大 chunk 更快
- **服务端 middleware 懒加载**：服务端入口也能按需加载中间件代码

> Remix 团队在 v7.5 发布博客（Faster Lazy Loading）专门讲过对象式 lazy 的动机：函数式 `lazy` 把整个路由的全部导出打包成一个 chunk，浏览器拉完才能开始下载具体的 loader / Component 等，造成串行等待。

## Webpack splitChunks：默认行为

Webpack 4+ 用 `SplitChunksPlugin` 替代了 `CommonsChunkPlugin`，默认配置已经能处理大部分场景：

```js
// webpack.config.js —— 等价于 splitChunks 默认值
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "async",        // 仅作用于异步（按需）chunk
      minSize: 20000,         // 新 chunk 至少 20kb（防过度拆分）
      minRemainingSize: 0,
      minChunks: 1,           // 至少被 1 个 chunk 共享
      maxAsyncRequests: 30,   // 按需加载时最大并行请求数
      maxInitialRequests: 30, // 入口最大并行请求数
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,                  // 低于自定义组（默认 0）
          reuseExistingChunk: true,       // 已存在的 chunk 复用
        },
        default: {
          minChunks: 2,                   // 至少被 2 个 chunk 共享
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

**默认行为只有满足以下条件才会产生分割**：

1. 新 chunk 来自 `node_modules`，**或**被 ≥2 个 chunk 共享
2. 新 chunk 体积 > `minSize`（20kb）
3. 并行请求数 ≤ `maxAsyncRequests` / `maxInitialRequests`（默认各 30）

### chunks 三档语义

| 取值 | 含义 | 适用 |
| --- | --- | --- |
| `'async'`（默认） | 仅按需（动态 `import()`）chunk 参与分割 | 兼顾首屏与按需，最安全 |
| `'initial'` | 仅入口 chunk 参与分割 | 只想拆入口共享、不动异步 |
| `'all'` | 同步 + 异步 chunk 都参与分割 | 最强（消除跨入口重复），但需谨慎配置 |

> `chunks: 'all'` 是消除「同一份 lodash 在多个入口各打包一次」的标配，代价仅是多几个并行 HTTP/2 请求。

### cacheGroups 自定义组

```js
// 自定义 vendor 分组：按体量切分
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // 1. react 核心库（低频变，长缓存）
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react-vendor",
          chunks: "all",
          priority: 10,           // 高于默认 vendor 组
        },
        // 2. UI 库（中等频次）
        ui: {
          test: /[\\/]node_modules[\\/](element-plus|ant-design-vue)[\\/]/,
          name: "ui-vendor",
          chunks: "all",
          priority: 8,
        },
        // 3. 巨型可视化库（独立 chunk）
        viz: {
          test: /[\\/]node_modules[\\/](echarts|monaco-editor|d3)[\\/]/,
          name: "viz-vendor",
          chunks: "all",
          priority: 9,
        },
      },
    },
  },
};
```

**cacheGroups 关键属性**

| 属性 | 作用 |
| --- | --- |
| `test` | RegExp 或函数，匹配模块路径 |
| `priority` | 一个模块可能命中多组，**高者胜出**（默认 -20） |
| `reuseExistingChunk` | 已有 chunk 复用，避免重复创建 |
| `enforce` | `true` 时忽略 `minSize` / `minChunks` 等阈值，强制创建 |
| `name` | chunk 名（生产推荐 `false`，让 Webpack 自动生成 hash 名） |
| `chunks` / `minSize` / `minChunks` | 可在组级覆盖顶层 |
| `type` / `layer` | 按模块类型 / layer 过滤 |
| `usedExports` | 配合 tree-shaking |

**内置两组**：`defaultVendors`（`test: node_modules`，`priority: -10`）+ `default`（`minChunks: 2`，`priority: -20`）。两者均可置 `false` 禁用。

> priority 的作用：默认组用负值（-10 / -20）让自定义组（默认 0）默认占优；自定义组之间按数值大者胜。这是「为什么我的 vendor 配置没生效」最常见的解法——priority 没写或写低了，被默认 `defaultVendors` 抢了。

### maxSize：切超大 chunk

`maxSize`（以及 `maxAsyncSize` / `maxInitialSize`）是「提示」而非硬限——单个模块本身超过 `maxSize` 不会被切（无法切），它只为 HTTP/2 + 长缓存设计，把大 chunk 拆成更小可并行下载的块、提高缓存粒度：

```js
splitChunks: {
  maxSize: 244 * 1024,  // 单 chunk 提示上限 244kb
  // 会被切成多个 [name]-[index].[hash].js
}
```

## Vite 8 / Rolldown：codeSplitting.groups

Vite 8（2026-03）已将 Rolldown 作为唯一默认打包器，构建提速 10-30x。关键迁移点：**Rollup 的 `build.rollupOptions.output.manualChunks` 在 Rolldown 下不再支持**，需迁移到 `build.rolldownOptions.output.codeSplitting.groups`：

```ts
// ❌ Vite 7 / Rollup 写法（Vite 8 下报错或被忽略）
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          echarts: ["echarts"],
        },
      },
    },
  },
});

// ✓ Vite 8 / Rolldown 写法
export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // 按正则匹配模块路径，name 是 chunk 名
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom)[\\/]/ },
            { name: "vue-vendor", test: /node_modules[\\/]@?vue[\\/]/ },
            { name: "viz-vendor", test: /node_modules[\\/](echarts|monaco-editor|d3)[\\/]/ },
            // 公共业务模块（被多个路由共享）
            { name: "common", minChunks: 2, test: /src[\\/]shared[\\/]/, minSize: 20000 },
          ],
        },
      },
    },
  },
});
```

**codeSplitting.groups 单项属性**

| 属性 | 作用 |
| --- | --- |
| `test` | RegExp，匹配模块路径 |
| `name` | chunk 名（占位符 `[name]` 等） |
| `minSize` | 该组最小体积（字节，默认沿用顶层 `minSize`） |
| `minChunks` | 至少被几个 chunk 引用 |
| `priority` | 多组命中时的优先级（同 Webpack） |

**Vite 默认 modulepreload 注入**

Vite 默认会为动态 `import()` 注入 `<link rel="modulepreload">`，把当前路由依赖的 chunk 提前拉好。可用 `build.modulePreload` 关闭：

```ts
export default defineConfig({
  build: {
    modulePreload: false, // 或 { polyfill: true } 仅控制 polyfill
  },
});
```

`build.cssCodeSplit`（默认 `true`）控制 CSS 是否按 chunk 分割——关闭后所有 CSS 合并成单个文件。

> Rolldown 下强行写 `manualChunks` 会触发循环依赖导致 build 失败（Vite issue #12209），把 `commonjsHelpers` 等运行时模块强行拆出是常见诱因。迁移到 `codeSplitting.groups` 时优先用正则 `test` 匹配业务路径，不要手工列模块 ID。

## 魔法注释（Webpack 专属）

动态 `import()` 旁的块注释能向 Webpack 传递打包 / 加载指令：

```ts
// 1. 命名 chunk（产出 users.[hash].js 而非数字 id）
import(/* webpackChunkName: "users" */ "./views/Users");

// 2. 同名 chunk 聚合（多个 import 落到同一 chunk）
import(/* webpackChunkName: "group-dashboard" */ "./views/Dashboard");
import(/* webpackChunkName: "group-dashboard" */ "./views/Stats");

// 3. webpackMode 控制打包与加载策略
import(/* webpackMode: "lazy" */ "./x");        // 默认，按需下载 + 求值
import(/* webpackMode: "lazy-once" */ "./x");   // 只生成一个 chunk，首次下载后缓存
import(/* webpackMode: "eager" */ "./x");       // 不产出独立 chunk，同步打到主 bundle（但仍是 Promise）
import(/* webpackMode: "weak" */ "./x");        // 仅在已加载时 resolve，否则 reject

// 4. webpackExports 助 tree-shaking
import(/* webpackExports: ["forEach", "map"] */ "lodash");

// 5. webpackInclude / webpackExclude 收口动态路径
import(`./locales/${lang}.json`);  // 不收口会把整个目录全打进来
import(/* webpackInclude: /^(en|zh|ja)\.json$/ */ `./locales/${lang}.json`);
```

**webpackPrefetch / webpackPreload**（资源提示）：

```ts
// prefetch：低优先级，浏览器空闲时拉，给「可能访问的下一页」用
import(/* webpackPrefetch: true */ "./views/NextPage");

// preload：高优先级，与当前导航并行拉，给「当前导航一定会用」的代码用
import(/* webpackPreload: true */ "./CriticalLib");
```

**preload vs prefetch 对照**

| 维度 | `preload` | `prefetch` |
| --- | --- | --- |
| 语义 | 当前导航**必用** | 未来导航**投机** |
| 优先级 | 高（与 document 同级） | 低（浏览器空闲时） |
| 强制要求 | 必须带 `as`（如 `as="script"` / `as="font"`） | 不强制 |
| 对应 webpack 魔法注释 | `webpackPreload: true` | `webpackPrefetch: true` |
| 滥用代价 | 抢当前页关键资源带宽 | 移动端 / 弱网白烧流量 |

> web.dev 明确：preload 是「这页一定要用」的高优先级声明，对非当前导航的资源用 preload 会抢关键资源；对当前导航必用的资源用 prefetch 又因低优先级而迟到。误用最常见症状是「LCP 反而变慢了」。

**魔法注释被剥掉的坑**：Babel / TS 编译时若不保留注释，所有 `/* webpackChunkName */` 会被当成普通注释清除，导致 chunk 命名失效、全变数字 id。需在 Babel / TS 配置里显式保留 comments（如 `@babel/preset-env` 的 `comments: true`，或用专为保留注释的插件）。

## vendor 切分最佳实践

把第三方依赖（`node_modules`）单独拆 vendor chunk 是分割最经典的实践，原理：库代码变动频率远低于业务代码，分离后业务改动不会让 vendor hash 失效，最大化长缓存命中率。

**「合理」而非「一坨」**

```ts
// ❌ 反模式：所有依赖塞一个 vendor
{
  cacheGroups: {
    vendors: {
      test: /node_modules/,
      name: "vendors",       // 固定 name 合并所有依赖
      chunks: "all",
    },
  },
}
// 后果：react 和巨型可视化库同生死，hash 一动全失效
```

```ts
// ✓ 正确：按变动节奏 / 体量细分
{
  cacheGroups: {
    // react 核心 —— 低频变，单独一组
    reactVendor: { test: /node_modules[\\/](react|react-dom)/, name: "react-vendor", chunks: "all", priority: 10 },
    // UI 库 —— 中等频次
    uiVendor: { test: /node_modules[\\/](element-plus|ant-design-vue)/, name: "ui-vendor", chunks: "all", priority: 8 },
    // 巨型可视化库 —— 单独拆出，避免污染主 vendor
    vizVendor: { test: /node_modules[\\/](echarts|monaco-editor)/, name: "viz-vendor", chunks: "all", priority: 9 },
  },
}
```

**配合 HTTP/2 并行下载**：HTTP/2 多路复用让多个小 chunk 并行拉取，比单个大 bundle 更快填满带宽，所以「细分 vendor」在现代协议下基本无单连接开销成本。

**`chunks: 'all'` 共享去重**：开启后同步 + 异步 chunk 都能共享 `node_modules` 与公共模块，消除「同一份 lodash 在多个入口各打包一次」的重复，代价仅是多几个并行请求。

## 部署兜底：ChunkLoadError 与 vite:preloadError

**问题场景**：用户开着你的页面，你部署了新版本——CDN / 托管把旧 hash chunk 删了，用户持有的旧 HTML 仍然引用着旧 chunk。用户点开「下一页」触发 `import('./NextPage-[old-hash].js')` → 404 → 抛 `ChunkLoadError`（Webpack）/ `Failed to fetch dynamically imported module`（Vite）→ 白屏。

**解法三件套**：

```ts
// 1. HTML 设 Cache-Control: no-cache —— 用户每次都拿最新 HTML（含最新 chunk 清单）
//    Nginx / 阿里云 OSS / Vercel 等都需要对 .html 单独配
// location / {
//   if ($request_filename ~* \.html$) {
//     add_header Cache-Control "no-cache";
//   }
// }

// 2. 资源文件名带 hash —— chunk 不变则 hash 不变，可永久缓存
//    dist/assets/index-[hash].js  ← Webpack/Vite 默认行为，别关

// 3. 监听 vite:preloadError —— 旧 chunk 失效时自动 reload 拿最新 HTML
//    Vite 专属事件，对应 Webpack 用 chunkLoadFailed 重试逻辑
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();        // 阻止默认报错
  location.reload();         // 重载页面 → 拿最新 HTML → 新 chunk 清单
});
```

**部署侧最佳实践**

- HTML：`Cache-Control: no-cache`（每次都校验）
- 静态 chunk：`Cache-Control: public, max-age=31536000, immutable`（一年 + 永不校验）
- CDN / 托管：保留历史部署的 chunk 至少 1-2 个版本（或用「灰度 + 软删除」策略），降低老用户撞 404 概率

> 监听 `vite:preloadError` 兜底后，用户的体感是「卡一下又好了」，而不是「白屏只能硬刷」。它是 Vite 生产构建的标配兜底，部署长生命周期的 SPA 必加。

## 反模式（避坑）

- **把路由组件包进 `defineAsyncComponent`**：Vue Router 官方明确禁止，路由懒加载应直接用动态 `import()`；异步组件可用于路由组件内部，但路由组件本身必须是个返回 Promise 的函数
- **`manualChunks` 手工分组致循环依赖**（Vite issue #12209）：把 `commonjsHelpers` 等运行时模块强行拆出易产生循环引用；Rolldown 下 `manualChunks` 已不被支持，强行写会报错或被忽略，应迁移到 `codeSplitting.groups`
- **过度拆分（atomize）**：把每个组件 / 模块切成独立 chunk，单 chunk 远小于 `minSize`（20kb）时请求数暴涨，HTTP/1.1 下尤其致命；Webpack 默认 `minSize` / `maxAsyncRequests` 就是为防此而设
- **`splitChunks.name` 写成固定字符串**：Webpack 官方警告，固定 `name` 会把所有公共 / vendor 模块合并成单个 chunk，导致初始下载变大、加载变慢；生产构建推荐 `name: false`
- **`import.meta.webpackPrefetch` 滥用**：对「可能访问」的页面无差别 prefetch，移动端 / 弱网白烧流量与电量，且会挤占当前下载带宽；只对高概率下一跳 prefetch
- **拿 preload 当 prefetch 用（或反之）**：preload 是高优先级「必用」声明，对非当前导航资源用 preload 会抢关键资源；对当前导航必用的资源用 prefetch 又因低优先级而迟到
- **部署后旧 chunk 失效未处理**：CDN / 托管删除历史部署文件，老用户持有旧 HTML 请求已删 chunk 报 `ChunkLoadError` / `Failed to fetch dynamically imported module`；不设 HTML no-cache、不监听 `vite:preloadError` 兜底，用户卡在白屏直到硬刷
- **Babel / TS 编译时剥掉了魔法注释**：动态 `import()` 旁的 `/* webpackChunkName */` 等被插件当成普通注释清除，导致 chunk 命名失效 / 全变数字 id；需保留 comments 或用专为保留注释的插件配置
- **对条件性 / 低频使用的代码用静态 import**：全量塞进主 bundle，首屏白白下载；这类代码应改成 `import()` 按需加载
- **给 cacheGroups 同时设 `name` 又不区分 `chunks`**：常见 vendor 配置写成 `test: node_modules + name: 'vendors' + chunks: 'all'` 把所有依赖塞一个文件，react 和巨型可视化库同生死，hash 一动全失效

## 下一步

- [参考](./reference.md)：构建器配置表（Webpack / Vite）完整速查、版本状态、官方资源
