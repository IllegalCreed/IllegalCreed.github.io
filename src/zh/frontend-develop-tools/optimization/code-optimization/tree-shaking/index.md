---
layout: doc
---

# Tree Shaking

Tree Shaking 是**构建期死代码消除**（dead code elimination）的工程实践，由打包器（Webpack / Rollup / Rolldown / esbuild）在编译期对**静态依赖图**做剪枝：扫一遍 `import` / `export` 关系，把「打包进来但没被引用」的导出标记为 unused，再在压缩阶段（Terser / esbuild）真正删除，从而缩小最终 bundle 体积。它的根本前提是 **ESM（ES Modules）**——顶层 `import` / `export` 是**静态**、可分析的；CommonJS 的 `require()` / `module.exports` 是运行期值，动态结构无法被静态分析，因此 CJS 包整体被保留、不能被 shake（这是 lodash（CJS）vs lodash-es、moment vs date-fns 的根本差别）。Webpack 4 引入的 `package.json` `"sideEffects"` 字段把判定粒度从「单导出」提升到「整模块」：标 `false` 即整包可 shake、白名单数组保留 CSS / polyfill 等真实副作用文件、缺省保守保留整模块——这一字段现已是 Webpack / Rollup / Vite / esbuild 跨工具的行业标准。Webpack 5 起 `optimization.usedExports` / `optimization.sideEffects` / `optimization.innerGraph` 在所有 mode 下默认启用，`mode: 'production'` 额外开启 `concatenateModules`（Scope Hoisting）/ `mangleExports`（短名压缩）/ `minimize`（Terser / esbuild）——其中 `minimize` 才是真正执行死代码删除的环节，只标 `usedExports` 不开 `minify` 死代码仍在 bundle 里。Rollup 提供 `treeshake: 'smallest' | 'safest' | 'recommended'` 三预设及 `moduleSideEffects` / `annotations` / `manualPureFunctions` / `tryCatchDeoptimization` 等子选项；Vite 8（2026）起 Rolldown（Rust 实现，比 Rollup 快 10–30×）成为唯一打包器，`build.rollupOptions` 迁移到 `build.rolldownOptions`、`output.manualChunks` 迁移到 `output.codeSplitting`。CSS 侧 Tailwind v4 默认开启 tree-shaking 并配 `@source` 指令按需扫描类名，v3 用 `content` 数组、PurgeCSS 是独立工具。注解方面 `/*#__PURE__*/` 标记单次调用 / 构造为无副作用（Rollup / Webpack / Terser 通用），`/*@__NO_SIDE_EFFECTS__*/` 是 Rollup 专属、可一次注解整函数声明覆盖所有调用点。Tree Shaking 与代码分割正交：shaking 决定「哪些死代码不进 bundle」（静态图剪枝），代码分割决定「哪些活代码延迟加载」（运行期分块）——两者配合是先 shaking 收口、再分割切 chunk。

## 评价

**优点**

- **体积立竿见影**：库作者声明 `"sideEffects": false` 后，未引用导出整段消失，典型 UI 库可瘦身 60–90%
- **零运行期开销**：所有分析在编译期完成，不引入运行时检查、不影响首屏执行路径
- **生态一致**：`sideEffects` 字段已是 Webpack / Rollup / Vite / esbuild 跨工具标准，库作者一次声明多工具通用
- **与代码分割正交组合**：先 shaking 消除死代码、再分割切 chunk，是性能优化的标准两段式
- **可观测**：Webpack stats 的 `providedExports` / `usedExports` 字段、Rollup `--treeshake` 日志直接展示剪枝结果
- **注解可控**：`#__PURE__` / `@__NO_SIDE_EFFECTS__` 让库作者精确声明副作用边界，覆盖打包器静态分析的保守判定

**缺点**

- **强依赖 ESM**：CJS 不可 shake，老库（lodash / moment / classnames 等）必须迁移到 ESM 等价物或深路径 import 才能受益
- **副作用判定偏保守**：模块顶层的 `console.log`、IIFE、全局补丁、`class extends` 等都被默认「可能副作用」，整模块被保留；要靠 `sideEffects: false` + `#__PURE__` 显式解锁
- **CSS / polyfill 易误伤**：`"sideEffects": false` 设过头会删 polyfill（core-js / regenerator / whatwg-fetch）、CSS-in-JS 运行时、`Array.prototype` 扩展，导致运行时崩溃；应改白名单 `["*.css", "./src/polyfills.js"]`
- **dev 模式验证无效**：开发模式不删代码以便调试，要看真实剪枝效果必须 `production` build 后看 stats / bundle 体积
- **barrel 文件反向放大**：`index.ts` re-export 全部时打包器为安全保留整张依赖图，组件库典型症状是只引一个 Button 却打入全部组件
- **静态分析有边界**：动态 `require`、try/catch 内 polyfill 特性检测、运行期常量分支（`const isDev = ...`）都会破坏可分析性， shaking 失效

## 文档地址

- [Webpack Tree Shaking 官方指南](https://webpack.js.org/guides/tree-shaking/)
- [Webpack optimization 全选项](https://webpack.js.org/configuration/optimization/)
- [Rollup treeshake 配置选项](https://rollupjs.org/configuration-options/)
- [Vite 8 发布公告（Rolldown 成为唯一打包器）](https://vite.dev/blog/announcing-vite8)
- [Tailwind CSS v4 优化与按需生成](https://tailwindcss.com/docs/optimizing-for-production)

## GitHub 地址

[webpack/webpack](https://github.com/webpack/webpack) · [rollup/rollup](https://github.com/rollup/rollup) · [rolldown/rolldown](https://github.com/rolldown/rolldown) · [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) · [FullHuman/purgecss](https://github.com/FullHuman/purgecss)

## 幻灯片地址

<a href="/SlideStack/tree-shaking-slide/" target="_blank">Tree Shaking</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=676" target="_blank" rel="noopener noreferrer">Tree Shaking 测试题</a>

