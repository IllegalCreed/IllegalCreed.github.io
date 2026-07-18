---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 MDN（动态 import()）、Vue Router、Webpack、Vite / Rolldown、React Router 官方文档编写，对照 Vite 8 / Webpack 5.108+ / Vue Router 4 / React Router v7.5 行为

## 速查

- **唯一的分割原语**：动态 `import('./X')`，返回 `Promise<模块命名空间对象>`，模块仅求值一次并被缓存，是所有打包器（Webpack/Rollup/Rolldown/esbuild）共同识别的分割点
- **静态 vs 动态**：`import X from './X'`（加载期全求值，不产生分割点）vs `import('./X').then(m => ...)`（按需求值，产生分割点）
- **路由级分割（Vue Router）**：`component: () => import('./X.vue')` ——「always use dynamic imports for all your routes」（官方建议）
- **路由级分割（React Router v7）**：`lazy: () => import('./X')`（v6.4+ 函数式）→ v7.5 对象式 `lazy: { Component, loader, action }` 逐属性并行下载
- **Webpack 配置面**：`optimization.splitChunks`（顶层 `chunks`、`minSize: 20000`、`maxAsyncRequests: 30`）+ `cacheGroups.{name}`（`test`、`priority`、`reuseExistingChunk`）
- **Vite 8 配置面**：`build.rolldownOptions.output.codeSplitting.groups: [{ test, name, minSize?, priority? }]`，Rollup 的 `manualChunks` 已不再支持
- **魔法注释**（Webpack）：`/* webpackChunkName: "x" */`、`/* webpackPrefetch: true */`、`/* webpackPreload: true */`、`/* webpackMode: "lazy" */`
- **资源提示语义**：`preload` = 当前导航必用 + 高优先级（须带 `as`）；`prefetch` = 未来导航投机 + 低优先级 + 浏览器空闲
- **部署兜底三件套**：HTML `Cache-Control: no-cache` + 资源文件名带 hash + 监听 `vite:preloadError` 调 `preventDefault` 后 `location.reload()`
- **最小分割单元**：Webpack `minSize: 20000`（20kb），低于此不单独成 chunk（防过度拆分）

## 为什么需要代码分割

现代 SPA 的主 bundle 通常以 MB 计：路由组件、第三方库、字体子集、polyfill、国际化文案、可视化大库（monaco / echarts / antv）…… 全部塞进主 bundle，等于让用户在打开首屏时下载整站代码。问题分两类：

- **下载体积爆炸**：首屏 JS 越大，TTI（Time to Interactive）越长，移动端 / 弱网尤其敏感
- **缓存命中率低**：业务代码任何一处改动都会让主 bundle 的 hash 失效，用户重新下载整包（含没变的第三方库）

代码分割对症下药：

| 问题 | 分割手段 | 效果 |
| --- | --- | --- |
| 首屏下整站 | 路由级 `import()` | 首屏只下当前路由代码 |
| 第三方库随业务失效 | vendor 单独拆 chunk | 库不变则 vendor hash 不变 |
| 低频代码污染首屏 | 条件性 `import()` | 设置面板 / 大库按需加载 |
| 大 chunk 拖慢首屏 | `maxSize` + HTTP/2 | 切成更小块并行下载 |

> 代码分割治「下太多」；tree-shaking 治「下了没用」。两者正交，先用 `sideEffects: false` + `usedExports` 收口死代码，再谈分割。

## 动态 import()：唯一的分割原语

ES2020 标准的动态 `import()` 是所有现代打包器共同识别的分割点。它不是函数而是操作符，返回 `Promise<模块命名空间对象>`。

```ts
// 静态 import —— 加载期全求值，不产生分割点
import { heavy } from "./heavy-lib";
heavy();

// 动态 import() —— 按需求值，产生分割点
import("./heavy-lib").then((mod) => {
  mod.heavy();
});

// 配合 async/await
async function onClick() {
  const mod = await import("./heavy-lib");
  mod.heavy();
}
```

**核心语义**（与静态 `import` 的对照）

| 维度 | 静态 `import` | 动态 `import()` |
| --- | --- | --- |
| 求值时机 | 模块加载期 | 调用时（按需） |
| 是否产生分割点 | 否 | 是（所有打包器都剥离成独立 chunk） |
| 返回值 | 命名空间对象（同步绑定） | `Promise<模块命名空间对象>` |
| 模块求值次数 | 每次加载一次 | 每次加载一次（**结果被缓存**） |
| 错误处理 | 抛同步 `SyntaxError` / 加载错误 | 走 Promise reject（**永不抛同步错误**） |
| 是否支持表达式作为模块标识 | 否（必须是字符串字面量） | 是（`import(variable)` 可动态解析，但打包器需 `webpackInclude` / `webpackExclude` 收口） |

> 模块只求值一次并被缓存——后续 `import()` 命中缓存直接返回同一个命名空间对象。这意味着首次访问某路由会下载并解析 chunk，第二次访问几乎零成本。

## 路由级分割：最小代价的最大收益

把整站代码从「首屏全量」降到「首屏只下当前路由」，最低成本的手段是让每个路由组件都懒加载。

### Vue Router

Vue Router 官方建议「always use dynamic imports for all your routes」——把 `component` 写成一个返回 Promise 的函数即可：

```ts
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("./views/Home.vue"), // 路由访问时才拉 chunk
  },
  {
    path: "/about",
    component: () => import("./views/About.vue"),
  },
];

const router = createRouter({ history: createWebHistory(), routes });
```

**反模式警告**：不要把路由组件包进 `defineAsyncComponent`——Vue Router 官方明确「do NOT use async components as route components」。路由懒加载应直接用动态 `import()`；异步组件可用于路由组件内部（如一个仪表盘组件懒加载子 widget），但路由组件本身必须是个返回 Promise 的函数。

### React Router v7

React Router v6.4+ 起，`lazy` 字段直接接 `import()`；v7.5（2025-04）引入对象式语法，可逐属性拆文件并行下载：

```ts
// v6.4+ 函数式（模块需具名导出 Component/loader/action/ErrorBoundary）
export default [
  {
    path: "/projects",
    lazy: () => import("./routes/projects"),
  },
];

// routes/projects.ts
export function Component() { /* ... */ }
export function loader() { /* ... */ }
export function action() { /* ... */ }
export function ErrorBoundary() { /* ... */ }

// v7.5+ 对象式 —— 逐属性并行加载
export default [
  {
    path: "/projects",
    lazy: {
      Component: () => import("./routes/projects/component").then(m => m.default),
      loader: () => import("./routes/projects/loader").then(m => m.default),
      action: () => import("./routes/projects/action").then(m => m.default),
      ErrorBoundary: () => import("./routes/projects/error-boundary").then(m => m.default),
    },
  },
];
```

对象式的核心收益：路由的 UI / loader / action / ErrorBoundary 各自一个 chunk，浏览器并行拉取，避免「单个大 chunk 卡住整条流水线」。

> 路由懒加载的底层都是动态 `import()`，组件级懒加载 API（`defineAsyncComponent` 的 loadingComponent / errorComponent / delay、`React.lazy` + `Suspense` 的 fallback）归【异步组件】叶。

## 一张图看懂分割全景

```text
┌─ 主 bundle（首屏必需）
│   ├ 入口 + 路由表 + 框架运行时
│   └ 当前路由组件 chunk（动态 import）
│
├─ vendor chunk（node_modules，长缓存）
│   ├ react / vue 核心（低频变）
│   ├ UI 库（中等频次）
│   └ 巨型库（monaco / echarts，独立 chunk）
│
├─ 路由 chunk（按路由拆）
│   ├ /home      → home.[hash].js
│   ├ /about     → about.[hash].js
│   └ /dashboard → dashboard.[hash].js（含嵌套子组件，可聚合）
│
└─ 异步资源（条件性 import）
    ├ 设置面板（用户点开才下）
    ├ 可视化大库（图表渲染才下）
    └ 国际化文案（切语言才下）
```

**资源提示在哪一层做什么**

| 提示 | 时机 | 优先级 | 典型用法 |
| --- | --- | --- | --- |
| `preload` | 当前导航**必用** | 高（与 document 同级） | hero 字体、关键 CSS、首屏 LCP 图像 |
| `prefetch` | 未来导航**投机** | 低（浏览器空闲时） | 用户大概率下一步要访问的路由 chunk |
| `modulepreload` | 当前路由依赖的 JS 模块 | 高 | Vite 默认注入，加速路由 chunk 解析 |

> Vite 默认会为动态 `import()` 注入 `<link rel="modulepreload">`，把当前路由要用的 chunk 提前拉好；`build.modulePreload` 可关闭。

## 第一个可上手的例子

下面是最小可运行的 Vite 项目结构，演示路由分割 + vendor 分离：

```bash
# 项目结构
src/
├ main.ts            # 入口
├ router.ts          # 路由表（路由级 import()）
├ views/
│   ├ Home.vue       # 首页
│   ├ About.vue      # 关于（懒加载）
│   └ Settings.vue   # 设置（懒加载 + 内部条件 import）
└ vite.config.ts
```

```ts
// router.ts
import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("./views/Home.vue") },
    { path: "/about", component: () => import("./views/About.vue") },
    { path: "/settings", component: () => import("./views/Settings.vue") },
  ],
});
```

```ts
// vite.config.ts —— Vite 8 / Rolldown 下用 codeSplitting.groups 分离 vendor
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom)[\\/]/ },
            { name: "vue-vendor", test: /node_modules[\\/]@?vue[\\/]/ },
          ],
        },
      },
    },
  },
});
```

> 跑 `vite build` 后看 `dist/assets/` 目录，应当能看到 `Home-[hash].js` / `About-[hash].js` / `Settings-[hash].js` 各自独立的路由 chunk + `react-vendor-[hash].js` / `vue-vendor-[hash].js` 两个 vendor chunk + 一个 `index-[hash].js` 主 bundle。

## 下一步

- [分割策略与构建配置](./guide-line.md)：动态 `import()` 语义深挖、路由级分割（Vue/React）、Webpack `splitChunks` / `cacheGroups`、Vite 8 `codeSplitting.groups` 迁移、魔法注释、preload / prefetch、vendor 切分、部署兜底、反模式
- [参考](./reference.md)：构建器配置表（Webpack/Vite）、版本状态、官方资源
