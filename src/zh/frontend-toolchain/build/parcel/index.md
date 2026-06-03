---
layout: doc
---

# Parcel

口号是 **「The zero configuration build tool for the web」**（面向 Web 的零配置构建工具）。Parcel 的核心卖点是**真·零配置**：从一个 HTML 文件起步，加 `<script>`、加点 CSS，TypeScript、JSX、Sass、图片、SVG 全部**开箱即用**，遇到未内置的语言还会**自动安装**（autoinstall）所需插件。它以 **HTML 为入口**，从 `<link>` / `<script type="module">` 出发发现整张依赖图。当前主版本 **v2（latest 2.16）**，编译器用 **Rust** 编写——JS/TS 底层是 **SWC**、CSS 是 **Lightning CSS**（Firefox 的浏览器级 CSS 引擎，前身 parcel-css），官方称比基于 JavaScript 的工具快 10–100×。开发态有内置 dev server（含 HMR、HTTPS、API proxy）、一切结果都进 `.parcel-cache` 缓存；生产态 `parcel build` **默认开启全套优化**（压缩、tree shaking、scope hoisting、content hashing），无需任何配置。它定位介于「webpack 的高度可配置」与「框架专用工具」之间，特别适合中小项目、demo、库与教学场景。

## 评价

**优点**

- **真零配置开箱即用**：HTML / JS / TS / JSX / CSS / CSS Modules / Sass / Less / 图片 / SVG / Vue 自动支持，无需写配置
- **autoinstall**：遇到未内置的语言/插件自动安装依赖（包管理器检测顺序 Yarn → Pnpm → Npm）
- **极快**：Rust 编译器（JS=SWC、CSS=Lightning CSS），官方称比 JS 工具快 10–100×
- **缓存默认开**：一切结果写入 `.parcel-cache`，追踪文件/配置/插件细粒度失效
- **HMR**：集成 React Fast Refresh 与 Vue Hot Reload，CSS 变更自动应用
- **生产默认全套优化**：`parcel build` 自动 minify + tree shaking + scope hoisting + content hashing
- **零配置代码分割**：动态 `import()` 自动分包，多入口共享模块自动拆 shared bundle
- **命名 targets 与库模式开箱**：`main` / `module` / `browser` / `types` 字段自动识别为构建目标
- **可扩展**：`.parcelrc` 八类插件体系（transformer / resolver / bundler / namer / packager / optimizer / reporter / compressor）

**缺点**

- **默认不做任何转译**：源码用什么现代语法就输出什么，需在 `package.json` 配 **`browserslist`** 才降级，否则旧浏览器可能报错
- **默认不做 TS 类型检查**：SWC 只剥离类型，需自行跑 `tsc --noEmit` 或 `@parcel/validator-typescript`
- **隐式 `isolatedModules`**：逐文件处理，`const enum` 等需跨文件分析的特性不可用
- **生态/社区规模**：插件与社区资源不及 webpack / Vite，复杂定制场景选择少
- **部分插件槽实验性**：`bundler` / `runtimes` 插件槽实验性，可能在 minor 版本间变动
- **边角陷阱**：CSS 自定义属性里的 `url()` 必须用绝对路径；压缩器配置文件名（`.terserrc` / `svgo.config.json` / `.htmlnanorc`）与实际底层引擎（SWC / oxvg / 内置）分离，容易混
- **v1 → v2 破坏性变化**：包名 `parcel-bundler`→`parcel`、缓存 `.cache`→`.parcel-cache`、插件迁 `.parcelrc`、默认不再转译

## 文档地址

[Parcel](https://parceljs.org/)

## GitHub 地址

[parcel-bundler/parcel](https://github.com/parcel-bundler/parcel)

## 幻灯片地址

<a href="/SlideStack/parcel-slide/" target="_blank">Parcel</a>
