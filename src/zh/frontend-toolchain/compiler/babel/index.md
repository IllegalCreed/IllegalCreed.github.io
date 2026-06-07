---
layout: doc
---

# Babel

JavaScript 编译器（**Babel is a JavaScript compiler**），官方定位为「一套主要用于把 ECMAScript 2015+ 代码转换成当前与较旧浏览器/环境都能运行的、向后兼容版本 JavaScript 的工具链」。它把编译拆成 **parse（`@babel/parser` 产出 Babel AST）→ transform（`@babel/traverse` 的 visitor 改写 AST）→ generate（`@babel/generator` 输出代码）** 三阶段，由 `@babel/core` 编排，用 **preset（预设套餐）+ plugin（单点转换）** 组合能力。最常用的是 `@babel/preset-env`——按 `targets`/browserslist 智能决定要降级哪些语法、是否注入 polyfill。关键边界：**Babel 只做语法转换与 polyfill 注入，不做类型检查**（`@babel/preset-typescript` 只是「剥掉类型」，类型错了照样产出，需另跑 `tsc --noEmit`）。**2026 年它处在生态分水岭**：`@babel/core` 的 `latest` 仍是 **7.29.x**，而 **Babel 8（8.0.0-rc.x）仍是 RC、尚未 GA**；与此同时新栈（Vite + Rolldown + Oxc、`@vitejs/plugin-react` v6 已弃用 Babel）正绕开它，但凭着**最大的插件 / codemod 生态**与 **TC39 提案试验场**地位，Babel 依旧是工具链里绕不开的一环。

## 评价

**优点**

- **最成熟的语法转换**：把 ES2015+ 乃至 Stage 提案语法降级到目标环境能跑的 JS，是这类需求事实上的参考实现
- **`@babel/preset-env` 智能降级**：按 `targets`/browserslist 自动决定降级哪些语法、注入哪些 polyfill，不必手工堆插件
- **polyfill 策略灵活**：`useBuiltIns: "usage"`（按用到的 API 注入）/`"entry"`（按 targets 全量入口注入）/`false`，配 `core-js` 精确补齐运行时 API
- **TypeScript / JSX 一把梭**：`@babel/preset-typescript` 剥类型、`@babel/preset-react` 转 JSX，单条 Babel 管线即可处理混合代码
- **插件 / codemod 生态最大**：基于 visitor + `@babel/types` 可写自定义转换与大规模 codemod，社区插件极其丰富
- **TC39 提案的试验场**：新语法提案常先以 Babel 插件落地，让开发者在标准定稿前就能试用
- **几乎所有工具的底座**：Jest、ESLint（旧 parser）、各类打包器 loader 长期以 Babel 为转换/解析基础，集成无处不在

**缺点**

- **不做类型检查**：`@babel/preset-typescript` 只剥类型不校验，类型错的代码照样产出，必须另跑 `tsc --noEmit` 把关
- **慢**：纯 JavaScript 实现 + 通用 visitor 管线，相比 Rust 的 SWC（单线程约 18×、多核 60×+）、Oxc（20~50×）明显偏慢
- **配置概念多、易踩坑**：`babel.config` 与 `.babelrc` 作用域不同、preset 逆序 / plugin 正序、polyfill 三策略，配错就「不生效」或「臃肿/污染全局」
- **只转语法不补运行时是默认认知盲区**：`target` 降了语法却没 polyfill，旧环境仍缺 `Promise`/`includes` 等内置 API
- **正被新栈绕开**：`@vitejs/plugin-react` v6 已弃用 Babel，Vite/Rolldown/Oxc 等新一代工具链尽量不再依赖它
- **Babel 8 迁移有破坏性**：ESM-only、抬高 Node 最低版本、移除 `loose`/`spec` 与 `corejs` 选项、preset-react 默认改 automatic 等，升级需要迁移成本

## 文档地址

[Babel](https://babeljs.io/)

## GitHub 地址

[babel/babel](https://github.com/babel/babel)

## 幻灯片地址

<a href="/SlideStack/babel-slide/" target="_blank">Babel</a>
