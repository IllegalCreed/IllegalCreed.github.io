---
layout: doc
---

# Webpack

诞生于 2012 年、至今仍统治存量市场的**静态模块打包器（static module bundler）**。Webpack 从一个或多个入口（entry）出发，递归解析 `import` / `require` 自动构建**依赖图（dependency graph）**，再把所有模块（JS、CSS、图片、字体……）打包成浏览器可加载的 bundle。它的核心抽象是六件套——**Entry / Output / Loaders / Plugins / Mode / 浏览器兼容**：loaders 把非 JS 资源转换成模块，plugins 通过 tapable 钩子接入整个编译生命周期做优化与产物管理。**Webpack 5**（当前 5.x）带来了 Asset Modules（取代 file/url/raw-loader）、持久化文件系统缓存、`output.clean`、`deterministic` moduleIds，以及微前端的事实标准方案 **Module Federation（模块联邦）**。虽然新项目逐渐转向 Vite / Rsbuild 等更快的工具，但 Webpack 凭借无与伦比的生态深度、可配置性与 Module Federation，仍是大量企业项目和框架底层（Next.js、Angular CLI 等）的基石。

## 评价

**优点**

- **生态最成熟最大**：loaders / plugins 数量与覆盖面无人能及，几乎任何构建需求都有现成、经过大规模验证的方案
- **可配置性天花板**：entry / output / module.rules / resolve / optimization / experiments 几乎每个环节都可精细控制，能拧出任何想要的产物形态
- **代码分割一流**：SplitChunksPlugin + 动态 `import()` + magic comments（`webpackChunkName` / `webpackPrefetch` / `webpackPreload`）覆盖从 vendor 抽取到按需懒加载的全部场景
- **Module Federation**：Webpack 5 独有，多个独立构建在运行时组成单一应用，是微前端 / 跨团队共享模块的事实标准
- **长效缓存方案成熟**：`[contenthash]` + `runtimeChunk: 'single'` + `moduleIds: 'deterministic'` 三件套把缓存命中率做到极致
- **Webpack 5 内置增强**：Asset Modules、持久化 filesystem 缓存、`output.clean` 让很多过去依赖插件的能力变成开箱即用
- **存量统治力**：海量企业项目、众多框架脚手架底层仍是 Webpack，迁移成本高也意味着护城河深

**缺点**

- **配置复杂、学习曲线陡**：loader 链从右到左执行、optimization、splitChunks、各类 hash 占位符……概念多，新手容易被劝退
- **构建慢**：JS 实现，相比 esbuild（Go）、Rolldown / Rspack（Rust）等原生工具，冷启动与构建明显更慢
- **dev server 需先打包**：开发态要先打包整个应用才能服务，与 Vite 的原生 ESM 按需相反，大项目启动钝
- **升级成本高**：Webpack 4→5 破坏性变化多（Asset Modules 取代旧 loader、Node core polyfill 移除需 `resolve.fallback`、`devServer.contentBase`→`static`、`output.clean`）
- **暗坑繁多**：`output.hashFunction` 仍默认 `md4`、`sideEffects: false` 误删 CSS、`DefinePlugin` 值忘加 `JSON.stringify`、`mode` 与 `NODE_ENV` 混淆……都是经典翻车点
- **新项目份额下滑**：Vite / Rsbuild 在新项目上更受青睐，Webpack 的增长主要靠存量与 Module Federation 维系

## 文档地址

[Webpack](https://webpack.js.org/)

## GitHub 地址

[webpack/webpack](https://github.com/webpack/webpack)

## 幻灯片地址

<a href="/SlideStack/webpack-slide/" target="_blank">Webpack</a>
