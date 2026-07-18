---
layout: doc
---

# 代码分割

代码分割（Code Splitting）是前端构建优化的核心手段之一：把单一的、首屏全量下载的主 bundle，按「路由 / 依赖 / 业务模块」拆成多个独立 chunk，让浏览器只在真正需要某段代码时才去拉它。它的底层原语只有一个——**动态 `import()`**（ES2020 标准、Baseline Widely Available）：所有现代打包器（Webpack、Rollup、Rolldown、esbuild）都把它识别为「分割点」，凡是用 `import()` 包起来的模块都会从主 bundle 里剥离，单独产出一个 JS 文件。围绕这个原语，构建器在「切多碎、怎么命名、谁跟谁合并、什么时候预取」这四件事上各自提供了配置面：Webpack 是 `optimization.splitChunks` + `cacheGroups` + 魔法注释（`webpackChunkName` / `webpackPrefetch` / `webpackPreload` / `webpackMode`），Vite 8 起随 Rolldown 切换到 `build.rolldownOptions.output.codeSplitting.groups`（Rollup 的 `manualChunks` 已不再支持）；路由层面，Vue Router 用 `component: () => import('./X.vue')` 一行就能让某个路由独立成 chunk，React Router v6.4+ 的 `lazy: () => import()` 在 v7.5 又升级为对象式 `lazy: { Component, loader, action }` 逐属性并行加载。配套还有两类「资源提示」让浏览器在合适时机拉 chunk：`preload`（当前导航必用、高优先级）与 `prefetch`（未来导航投机、低优先级），以及部署侧的兜底——HTML 设 `Cache-Control: no-cache`、资源带 hash、监听 `vite:preloadError` 在新部署让旧 chunk 失效时自动 reload，否则用户会卡在 `ChunkLoadError` / `Failed to fetch dynamically imported module` 白屏。本叶专讲分割策略与 chunk 治理；组件级懒加载 API（`defineAsyncComponent` / `React.lazy` + `Suspense` 选项）归【异步组件】叶，本叶只点到「底层是动态 `import()`」不展开。

> 待回填：本叶 quiz 入库后，把下面的 `PENDING` 替换为真实 category id（生产库 `技术方向 / 代码分割` 的 id）；笔记 sidebar 与幻灯片 / 测试题链接待在父目录索引页接入。

## 评价

**优点**

- **首屏体积直接降一个数量级**：只下当前路由代码，其余 chunk 访问时才拉，首屏 JS 从「全量」降到「必需」
- **长缓存命中率最大化**：vendor（`node_modules`）变动频率远低于业务代码，单独拆 chunk 后业务改动不会让 vendor hash 失效
- **并行下载提吞吐**：HTTP/2 下多个小 chunk 并行拉取，比单个大 bundle 更快填满带宽
- **按需付费**：低频 / 条件性代码（设置面板、可视化大库）只在真正用到时下载，不污染首屏
- **构建器原生支持**：动态 `import()` 是语言标准，Webpack / Vite / Rollup 全部识别，无需额外插件
- **资源提示可控**：`preload` / `prefetch` 精细调度下一跳 chunk 的拉取时机

**缺点**

- **请求数暴涨的陷阱**：过度拆分（atomize）会让单 chunk 远小于 `minSize`（默认 20kb），HTTP/1.1 下尤其致命
- **循环依赖致 build 失败**：手工 `manualChunks` / `codeSplitting.groups` 把运行时模块强行拆出易产生循环引用（Vite issue #12209）
- **ChunkLoadError 兜底负担**：新部署后旧 hash chunk 被删，老用户持有旧 HTML 会请求失败，必须配 HTML no-cache + `vite:preloadError` reload
- **配置面分散**：Webpack `splitChunks` / Vite `codeSplitting.groups` / Vue Router / React Router 各有一套，迁移成本不低
- **魔法注释易被编译器剥掉**：Babel / TS 插件若不保留注释，`webpackChunkName` 等会全部失效
- **preload / prefetch 易误用**：误把 prefetch 当 preload 抢当前页关键资源带宽，移动端滥用 prefetch 白烧流量

## 文档地址

- [MDN：动态 import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Vue Router：路由懒加载](https://router.vuejs.org/guide/advanced/lazy-loading.html)
- [Webpack：SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)
- [Webpack：模块方法 / 魔法注释](https://webpack.js.org/api/module-methods/)
- [Vite：构建产物 chunk 策略](https://vite.dev/guide/build)
- [Rolldown：codeSplitting.groups](https://rolldown.rs/in-depth/manual-code-splitting)
- [React Router：route.lazy](https://reactrouter.com/start/data/route-object)

## GitHub 地址

[webpack/webpack](https://github.com/webpack/webpack) · [vitejs/vite](https://github.com/vitejs/vite) · [vuejs/router](https://github.com/vuejs/router) · [remix-run/react-router](https://github.com/remix-run/react-router)

## 幻灯片地址

<a href="/SlideStack/code-splitting-slide/" target="_blank">代码分割</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=675" target="_blank" rel="noopener noreferrer">代码分割测试题</a>
