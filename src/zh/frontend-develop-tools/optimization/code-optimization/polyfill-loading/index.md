---
layout: doc
---

# Polyfill 按需加载

Polyfill 按需加载是前端兼容性工程的核心抓手：在「**给老浏览器补齐缺失的运行时 API**」与「**不把全量 polyfill 砸到每个用户头上**」之间找到平衡。它由三件事拼出来——`@babel/preset-env` 的 `useBuiltIns` 选项（决定**怎么注入**）、`core-js` 的版本与入口（决定**注入什么**）、`browserslist` 的 targets（决定**为谁注入**）。三者协作的最终产物是一份按你声明的目标浏览器精确裁剪过的 polyfill 集合，配合 `@vitejs/plugin-legacy` 或 module/nomodule 双产物机制，还能让现代浏览器与老浏览器各取所需。

`useBuiltIns` 有三个取值：`'usage'`（每文件按实际使用注入 import，最精细，**应用项目默认**）、`'entry'`（替换入口处 `import "core-js/stable"` 为按 targets 拆解的模块）、`false`（不自动注入，适合库）。配合 `corejs` 选项（必须显式写明 minor 版本如 `'3.33'`，否则按 core-js@2 处理并告警）和 `targets`（来自 `.browserslistrc`），构成完整的按需加载流水线。`@babel/polyfill` 自 Babel 7.4（2019）起弃用，新项目统一用 `import "core-js/stable"` + `import "regenerator-runtime/runtime"`；构建库时用 `@babel/plugin-transform-runtime + corejs:3`（走 `core-js-pure`，不污染消费者全局）；`polyfill.io` 域名在 2024-02 被 Funnull 收购后发生供应链攻击事件，**生产环境不再引用该域名**，改自托管 core-js 或用 cdnjs/fastly 镜像。

## 评价

**优点**

- **体积可控**：相比全量 `import "core-js"`（动辄几百 KB），按 targets 裁剪后通常只剩几十 KB，老浏览器才需要的大头 polyfill 不会发到现代浏览器
- **单一事实源**：`browserslist` 一份配置同时驱动 Babel / Autoprefixer / eslint-plugin-compat 等多工具，避免 preset-env targets 与 CSS 前缀不一致
- **静态分析 + 兜底可控**：`usage` 模式靠 Babel 静态扫描出实际用到的 API，配合 `include` 数组兜底处理第三方依赖的隐式需求
- **库/应用差异化方案成熟**：应用走 `usage`，库走 `transform-runtime` + `core-js-pure`，避免把 polyfill 打进库产物污染消费者全局
- **构建产物可差异化**：`@vitejs/plugin-legacy` 的 modern+legacy 双产物让现代浏览器不下载 IE11 才需要的 polyfill
- **可观测**：`debug: true` 直接打印实际注入的 polyfill 清单 + 触发它的 target，核对结果很直观

**缺点**

- **静态分析有边界**：动态 `import()`、字符串动态属性访问、第三方依赖内部的 API 使用等场景可能漏注入，需要靠 `debug` 核对 + `include` 兜底
- **版本配置陷阱**：`corejs` 选项漏写或写错（如装 core-js@3.33 却写 `'3'`）会按默认 core-js@2 处理并告警，且漏掉后续 minor 新增的 polyfill
- **混装风险**：core-js@2 与 core-js@3 混装会注入重复或错误版本，需统一升到 core-js@3
- **第三方 polyfill CDN 有供应链风险**：polyfill.io 事件后，引用任何第三方 polyfill 服务都需谨慎，长期建议自托管
- **module/nomodule 双产物有边界**：Safari 10.1 / Edge < 17 等有历史 bug，`@vitejs/plugin-legacy` 已处理但要靠它而非手写
- **`shippedProposals` / `proposals` 体积风险**：开启会引入未稳定提案，体积与 spec 变更风险增大，仅在确实需要时开

## 文档地址

- [Babel @babel/preset-env 文档](https://babeljs.io/docs/babel-preset-env)（`useBuiltIns` / `corejs` / `targets` / `shippedProposals` 一手定义）
- [core-js 3 与 Babel 集成说明](https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md)（`@babel/polyfill` 弃用、`core-js-pure` / `transform-runtime` 一手出处）
- [Vite 浏览器兼容性指南](https://vite.dev/guide/build.html#browser-compatibility) + [@vitejs/plugin-legacy 源码](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)
- [Vue CLI @vue/babel-preset-app README](https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/babel-preset-app/README.md)

## GitHub 地址

[babel/babel](https://github.com/babel/babel) · [zloirock/core-js](https://github.com/zloirock/core-js) · [vitejs/vite](https://github.com/vitejs/vite)

## 幻灯片地址

<a href="/SlideStack/polyfill-loading-slide/" target="_blank">Polyfill 按需加载</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=680" target="_blank" rel="noopener noreferrer">Polyfill 按需加载测试题</a>

