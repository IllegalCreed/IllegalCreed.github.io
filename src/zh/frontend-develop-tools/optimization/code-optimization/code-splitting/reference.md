---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 MDN / Vue Router / Webpack / Vite & Rolldown / React Router 官方文档编写，对照 Vite 8 / Webpack 5.108+ / Vue Router 4 / React Router v7.5

## 速查

- **分割原语**：动态 `import('./X')` 返回 `Promise<模块命名空间对象>`，ES2020 标准、Baseline Widely Available
- **Vue Router**：`component: () => import('./X.vue')`（路由组件不要包 `defineAsyncComponent`）
- **React Router v7**：v6.4+ `lazy: () => import('./X')`，v7.5 对象式 `lazy: { Component, loader, action }` 逐属性并行加载
- **Webpack splitChunks 默认**：`chunks: 'async'`、`minSize: 20000`、`maxAsyncRequests: 30`、`maxInitialRequests: 30`
- **cacheGroups 内置**：`defaultVendors`（`test: node_modules`，`priority: -10`）+ `default`（`minChunks: 2`，`priority: -20`）
- **Vite 8 / Rolldown**：`build.rolldownOptions.output.codeSplitting.groups` 替代 Rollup 的 `manualChunks`
- **魔法注释**（Webpack）：`webpackChunkName` / `webpackMode` / `webpackPrefetch` / `webpackPreload` / `webpackExports`
- **preload vs prefetch**：preload 当前导航必用 + 高优先级（须带 `as`）；prefetch 未来导航投机 + 低优先级
- **部署兜底**：HTML `no-cache` + 资源带 hash + 监听 `vite:preloadError` → `preventDefault` → `location.reload`
- **版本**：Vite 8（2026-03）、Webpack 5.108+、Vue Router 4.x、React Router v7.5（2025-04）
- 完整说明见 [入门](./getting-started.md) / [分割策略与构建配置](./guide-line.md)

## 动态 import() 语义速查

| 维度 | 静态 `import` | 动态 `import()` |
| --- | --- | --- |
| 求值时机 | 加载期 | 调用时（按需） |
| 是否产生分割点 | 否 | 是（所有打包器） |
| 返回值 | 命名空间对象（同步） | `Promise<模块命名空间对象>` |
| 求值次数 | 一次 | 一次（缓存命中） |
| 错误处理 | 抛同步错误 | Promise reject（永不抛同步错误） |
| 模块标识 | 字符串字面量 | 表达式（须用 `webpackInclude` 收口） |
| 标准 | ES2015 | ES2020（Baseline Widely Available） |

## 路由级分割写法速查

### Vue Router

```ts
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ✓ 路由组件就是返回 Promise 的函数
    { path: "/", component: () => import("./views/Home.vue") },
    // 用 webpackChunkName 聚合同路由的嵌套组件到同一 chunk
    {
      path: "/dashboard",
      component: () => import(/* webpackChunkName: "group-dashboard" */ "./views/Dashboard.vue"),
      children: [
        {
          path: "stats",
          component: () => import(/* webpackChunkName: "group-dashboard" */ "./views/Stats.vue"),
        },
      ],
    },
  ],
});
```

### React Router v7

```ts
// v6.4+ 函数式
export default [
  { path: "/projects/:id", lazy: () => import("./routes/project") },
];
// routes/project.ts 具名导出 Component/loader/action/ErrorBoundary

// v7.5+ 对象式（逐属性并行加载）
export default [
  {
    path: "/projects/:id",
    lazy: {
      Component: () => import("./routes/project/component").then(m => m.default),
      loader: () => import("./routes/project/loader").then(m => m.default),
      action: () => import("./routes/project/action").then(m => m.default),
      ErrorBoundary: () => import("./routes/project/error-boundary").then(m => m.default),
      unstable_middleware: () => import("./routes/project/middleware").then(m => m.default),
    },
  },
];
```

## Webpack splitChunks 配置速查

### 顶层选项

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `chunks` | `'async'` | `'async'` / `'initial'` / `'all'` / function / RegExp |
| `minSize` | `20000`（20kb） | 新 chunk 最小体积 |
| `minRemainingSize` | `0` | 与 `minSize` 配合确保剩余 chunk 不太小 |
| `minChunks` | `1` | 至少被几个 chunk 共享 |
| `maxSize` | - | 提示上限，超过则尽量拆分（HTTP/2 + 长缓存用） |
| `maxAsyncSize` | - | 异步 chunk 的 `maxSize` |
| `maxInitialSize` | - | 入口 chunk 的 `maxSize` |
| `maxAsyncRequests` | `30` | 按需加载时最大并行请求数 |
| `maxInitialRequests` | `30` | 入口最大并行请求数 |
| `enforceSizeThreshold` | `50000` | 强制分割的体积阈值 |
| `name` | `false`（生产推荐） | chunk 名；固定字符串会合并所有公共模块，**别用** |
| `automaticNameDelimiter` | `'~'` | 自动命名时的分隔符 |
| `cacheGroups` | 见下 | 自定义分组 |

### cacheGroups 内置两组

```js
cacheGroups: {
  defaultVendors: {
    test: /[\\/]node_modules[\\/]/,
    priority: -10,
    reuseExistingChunk: true,
  },
  default: {
    minChunks: 2,
    priority: -20,
    reuseExistingChunk: true,
  },
}
```

### cacheGroups 组级属性

| 属性 | 作用 |
| --- | --- |
| `test` | RegExp 或函数，匹配模块路径 |
| `priority` | 多组命中时高者胜出（默认 -20） |
| `reuseExistingChunk` | `true` 复用已有 chunk |
| `enforce` | `true` 忽略 `minSize` / `minChunks`，强制创建 |
| `name` | chunk 名 |
| `filename` | 产出文件名 |
| `idHint` | chunk id 提示 |
| `type` | 按模块类型（`css/mini-extract` 等）过滤 |
| `layer` | 按 layer 过滤 |
| `usedExports` | 配合 tree-shaking |
| `chunks` / `minSize` / `minChunks` | 组级覆盖顶层 |

### 默认触发条件

满足以下才分割：

1. 新 chunk 来自 `node_modules`，**或**被 ≥2 个 chunk 共享
2. 体积 > `minSize`（20kb）
3. 并行请求数 ≤ `maxAsyncRequests` / `maxInitialRequests`（各 30）

### chunks 三档语义

| 取值 | 含义 |
| --- | --- |
| `'async'` | 仅按需（动态 `import()`）chunk 参与分割（默认） |
| `'initial'` | 仅入口 chunk |
| `'all'` | 同步 + 异步都参与（最强，消除跨入口重复） |

## Webpack 魔法注释速查

| 注释 | 作用 |
| --- | --- |
| `/* webpackChunkName: "name" */` | 命名 chunk |
| `/* webpackMode: "lazy" */` | 默认，按需下载 + 求值 |
| `/* webpackMode: "lazy-once" */` | 单个 chunk，首次下载后缓存 |
| `/* webpackMode: "eager" */` | 不产出独立 chunk，同步打进主 bundle（仍是 Promise） |
| `/* webpackMode: "weak" */` | 已加载才 resolve，否则 reject |
| `/* webpackPrefetch: true */` | 浏览器空闲时低优先级预取（未来导航） |
| `/* webpackPreload: true */` | 与当前导航并行高优先级预加载（当前导航必用） |
| `/* webpackExports: ["a", "b"] */` | 裁剪导出助 tree-shaking |
| `/* webpackInclude: /re/ */` | 动态路径收口（必填） |
| `/* webpackExclude: /re/ */` | 动态路径排除 |

> 魔法注释易被 Babel / TS 编译剥掉，需显式保留 comments（`@babel/preset-env` 的 `comments: true`）。

## Vite 8 / Rolldown 配置速查

### Rolldown codeSplitting.groups

```ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // 单项属性：test / name / minSize / minChunks / priority
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom)[\\/]/ },
            { name: "viz-vendor", test: /node_modules[\\/](echarts|monaco-editor)[\\/]/ },
            { name: "common", minChunks: 2, test: /src[\\/]shared[\\/]/, minSize: 20000 },
          ],
        },
      },
    },
  },
});
```

**迁移要点**：Rollup 的 `build.rollupOptions.output.manualChunks` 在 Rolldown 下不再支持，强行写会报错或被忽略；手工列模块 ID 易产生循环依赖（Vite issue #12209），改用 `test` 正则匹配业务路径。

### Vite 其他相关配置

| 配置 | 默认 | 作用 |
| --- | --- | --- |
| `build.modulePreload` | `true` | 为动态 `import()` 注入 `<link rel="modulepreload">` |
| `build.cssCodeSplit` | `true` | 是否按 chunk 分割 CSS |
| `build.assetsInlineLimit` | `4096` | 小于此体积的资源内联为 base64 |
| `build.target` | `'modules'` | 等价于 Chrome≥111 / Edge≥111 / Firefox≥114 / Safari≥16.4 |
| `build.minDynamicImports` | `true`（生产） | 是否对动态 import 进行 minify |

### Vite 部署兜底：vite:preloadError

```ts
// main.ts —— 必须在路由懒加载触发前注册
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  location.reload();
});
```

## 资源提示速查

| 提示 | 语义 | 优先级 | 必带属性 | 典型用法 |
| --- | --- | --- | --- | --- |
| `<link rel="preload">` | 当前导航必用 | 高（与 document 同级） | `as`（`script` / `font` / `style` / `image`） | 关键字体 / 关键 CSS / hero 图 |
| `<link rel="prefetch">` | 未来导航投机 | 低（浏览器空闲时） | 无强制 | 下一页路由 chunk |
| `<link rel="modulepreload">` | 当前路由依赖的 JS 模块 | 高 | 无强制 | Vite 默认注入 |
| `/* webpackPreload: true */` | 同 preload | 高 | - | 当前导航必用的 chunk |
| `/* webpackPrefetch: true */` | 同 prefetch | 低 | - | 下一页 chunk |

> Vite 生产构建默认假定浏览器原生 ESM 动态 import + `import.meta`（最低 Chrome 64 / Firefox 67 / Safari 11.1），构建目标等价于 Chrome ≥ 111 / Edge ≥ 111 / Firefox ≥ 114 / Safari ≥ 16.4。

## 部署兜底速查

| 措施 | 配置 | 作用 |
| --- | --- | --- |
| HTML no-cache | `Cache-Control: no-cache` | 每次拿最新 HTML（含最新 chunk 清单） |
| 资源带 hash | `Cache-Control: public, max-age=31536000, immutable` | chunk 不变则永久缓存 |
| vite:preloadError 兜底 | `addEventListener('vite:preloadError', e => { e.preventDefault(); location.reload() })` | 旧 chunk 失效时自动 reload |
| CDN 保留历史版本 | 至少保留 1-2 个历史部署的 chunk | 老用户撞 404 概率降到接近 0 |
| Webpack ChunkLoadError | 在 `import().catch()` 里 reload 或重试 | 同 vite:preloadError |

## 版本状态（截至 2026-07）

| 库 / 标准 | 当前 | 关键变化 |
| --- | --- | --- |
| **Vite** | 8.x（2026-03） | Rolldown 成唯一默认打包器，提速 10-30x；`manualChunks` → `codeSplitting.groups` |
| **Webpack** | 5.x（5.108+） | `SplitChunksPlugin` 自 v4 替代 `CommonsChunkPlugin`，默认 `chunks: 'async'`、`minSize: 20000` |
| **Vue Router** | 4.x（Vue 3） | `component: () => import()` 为标准路由懒加载 |
| **React Router** | v7.5（2025-04） | 对象式 `route.lazy` API 逐属性懒加载 + 中间件懒加载；函数式自 v6.4 起 |
| **动态 import()** | ES2020 标准 | Baseline Widely Available，全主流浏览器原生支持 |
| **modulepreload** | 标准 | Chrome 66+ / Firefox 75+ / Safari 16+ |

> Vite 7（2025）通过 `rolldown-vite` 作为过渡包引入 Rolldown；2026-06 Cloudflare 收购 VoidZero（Vite / Rolldown / Oxc / Vitest 母公司）。

## 官方资源

- MDN 动态 import()：[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- Vue Router 路由懒加载：[https://router.vuejs.org/guide/advanced/lazy-loading.html](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- Webpack SplitChunksPlugin：[https://webpack.js.org/plugins/split-chunks-plugin/](https://webpack.js.org/plugins/split-chunks-plugin/)
- Webpack 模块方法（魔法注释）：[https://webpack.js.org/api/module-methods/](https://webpack.js.org/api/module-methods/)
- Vite 构建产物 chunk 策略：[https://vite.dev/guide/build](https://vite.dev/guide/build)
- Rolldown codeSplitting.groups：[https://rolldown.rs/in-depth/manual-code-splitting](https://rolldown.rs/in-depth/manual-code-splitting)
- React Router route.lazy：[https://reactrouter.com/start/data/route-object](https://reactrouter.com/start/data/route-object)
- Remix Faster Lazy Loading（v7.5）：[https://remix.run/blog/faster-lazy-loading](https://remix.run/blog/faster-lazy-loading)
- web.dev preload / prefetch：[https://web.dev/articles/preload-critical-resources](https://web.dev/articles/preload-critical-resources) · [https://web.dev/articles/link-prefetch](https://web.dev/articles/link-prefetch)
- Vite GitHub：[https://github.com/vitejs/vite](https://github.com/vitejs/vite)
- Webpack GitHub：[https://github.com/webpack/webpack](https://github.com/webpack/webpack)
- Vue Router GitHub：[https://github.com/vuejs/router](https://github.com/vuejs/router)
- React Router GitHub：[https://github.com/remix-run/react-router](https://github.com/remix-run/react-router)
