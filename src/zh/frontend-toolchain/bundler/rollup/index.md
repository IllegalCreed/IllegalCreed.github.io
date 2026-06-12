---
layout: doc
---

# Rollup

JavaScript 模块打包器（**The JavaScript module bundler**），官方定义为「把小块代码编译合并成更大更复杂产物（库或应用）的模块打包器」。它是 **ESM 优先**设计的代表与 **tree-shaking（live code inclusion）的鼻祖**——基于 ES 模块的静态结构把所有模块视作一棵共享绑定的大 AST，只把真正用到的代码纳入产物；配合 **scope hoisting**（所有模块提升进同一作用域），产出几乎**没有运行时包装代码的干净扁平 bundle**，一份配置即可输出 **es / cjs / umd / iife / system / amd** 多种格式，因此长期是**库打包的事实标准**。它的插件 API（resolveId / load / transform 等钩子体系）简洁易学，被 Vite、WMR 等工具直接采用，成为行业通用接口。**2026 年它处在传承节点**：本体 **4.x（4.61.x）仍在持续维护**（Node ≥ 18，解析器已换成基于 SWC 的 Rust 原生实现）；而 VoidZero 主导的 **Rolldown**（Rust 全量重写、保持 Rollup 兼容 API）已发布 **1.x** 并成为 **Vite 8+ 的统一打包内核**，承接了这套设计与插件生态——Rollup 进入维护/传承期，但海量库构建链仍跑在它上面。

## 评价

**优点**

- **tree-shaking 深度业界标杆**：基于 ESM 静态结构的 live code inclusion + `/*@__PURE__*/` 注解 + `sideEffects` 字段支持，死代码剔除最彻底
- **产物干净无运行时**：scope hoisting 把模块平铺进单一作用域，没有 webpack 式的 runtime 与模块包装函数，库产物可读且体积小
- **多格式输出一把梭**：一份配置同时产出 es / cjs / umd / iife / system / amd，配合 `external` + `output.globals` 精确控制打包边界
- **代码分割零运行时**：动态 `import()` 与多入口共享依赖自动拆 chunk，「无需自定义加载器代码」
- **插件 API 成为行业标准**：钩子体系（build / output 两阶段）简洁清晰，Vite 插件直接兼容其大部分接口
- **库打包利器**：`preserveModules` 保留模块结构、`output.exports` 控制 CJS 互操作、`@rollup/plugin-babel` 的 `babelHelpers: 'runtime'` 等专为库场景设计

**缺点**

- **不内置 dev server / HMR**：核心刻意精简，应用开发体验需要 Vite 等上层工具补齐
- **CJS 依赖要插件组合**：原生只认 ESM 输入，打包 npm 老依赖必须 `node-resolve` + `commonjs` 插件配合，配置心智成本高于「开箱即用」型工具
- **应用级工程化弱于 webpack**：没有 Module Federation、资产管线、丰富 loader 生态，重工程化中后台不占优
- **速度不及 Rust/Go 系**：虽然 4.x 把解析器换成了 SWC 原生实现，打包主逻辑仍是 JavaScript，整体速度落后 esbuild / Rolldown
- **生态重心向 Rolldown 转移**：Vite 8 默认内核已是 Rolldown，新特性投入与社区注意力正在迁移，本体进入维护态

## 文档地址

[Rollup](https://rollupjs.org/)

## GitHub 地址

[rollup/rollup](https://github.com/rollup/rollup)

## 幻灯片地址

<a href="/SlideStack/rollup-slide/" target="_blank">Rollup</a>
