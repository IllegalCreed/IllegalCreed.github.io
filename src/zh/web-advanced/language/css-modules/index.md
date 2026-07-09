---
layout: doc
---

# CSS Modules

**构建期把类名局部作用域化的样式方案**——一个「所有类名和动画名默认被局部作用域化的 CSS 文件」。你按 `.module.css` 后缀命名，写的仍是**标准 CSS**，构建工具在编译期把每个 `.foo` 改写成全局唯一的哈希名（如 `_foo_x1y2`），同时导出一份 `{ foo: '_foo_x1y2' }` 映射对象供 JS `import`，你在组件里用 `styles.foo` 引用真实类名。它的心智一句话：**把 CSS「默认全局」翻转为「默认局部」**，从根上消灭跨文件类名冲突。CSS Modules 不是单一版本的库，而是一份**约定 / 规范**（[css-modules/css-modules](https://github.com/css-modules/css-modules)）加上各构建工具的**编译期实现**：Vite（当前 8.1，内建 `.module.css`，底层走 [postcss-modules](https://github.com/css-modules/postcss-modules) 9.x 或 Lightning CSS）、webpack（`css-loader` 7.x 的 `modules` 选项）、Next.js（16.x 内建）、CRA（内建）都开箱支持。它是**零运行时**的——产物是普通 CSS + 类名映射，浏览器端没有样式引擎在跑，性能贴近手写 CSS。放进「样式方案」谱系里，CSS Modules 是**作用域基线**：只解决作用域、写标准 CSS 文件；而 StyleX / Panda CSS / vanilla-extract 那类**真·CSS-in-JS** 则在 JS/TS 里写样式，提供类型安全、设计令牌、动态变体等更丰富能力。

## 评价

**优点**

- **零运行时、性能贴近手写 CSS**：作用域化全在构建期完成，产物是静态 CSS + 类名映射，浏览器端没有运行时样式库开销，比传统运行时 CSS-in-JS 更轻
- **写的是标准 CSS**：不用学新 DSL、不改 CSS 语法，团队既有 CSS 技能直接复用；样式与逻辑天然分离，`.css` 文件可被 Stylelint、预处理器（`.module.scss`）等既有工具链正常处理
- **默认局部、根治命名冲突**：编译期唯一哈希名让跨文件同名类（`.button`/`.title`）互不干扰，告别 BEM 式冗长命名和全局污染
- **框架无关、生态成熟**：Vite / webpack / Next.js / CRA 等主流工具内建支持，React / Vue / Svelte / 原生皆可用，无框架绑定
- **`composes` 组合复用 + `@value` 值变量**：提供轻量的样式复用与共享令牌机制，覆盖大部分工程复用需求

**缺点**

- **只做作用域，不是完整样式方案**：产物是静态 CSS，无法按 props 在运行时动态生成样式（动态只能切换预定义类或叠原生 `var()`），也不提供类型安全的样式 API、设计令牌系统
- **TypeScript 默认无类型**：`import styles from './x.module.css'` 默认是 `any` 或报「找不到模块」，写错类名不报错，需额外加环境声明 / `typed-css-modules` 生成 `.d.ts` / LSP 插件补类型
- **类名映射的间接层**：调试时 DevTools 里看到的是哈希名而非源码类名（生产环境尤甚），需靠 `localIdentName`/`generateScopedName` 配置保留可读片段
- **`composes` 有约束与坑**：只能组合单个局部类、跨文件对同一属性给不同值属于未定义行为、CSS 输出顺序不由书写位置决定
- **各实现选项不完全一致**：postcss-modules 与 Lightning CSS、css-loader 的配置项集合、默认值有差异，跨工具迁移需对照

## 文档地址

[CSS Modules 规范 README](https://github.com/css-modules/css-modules) ｜ [Vite CSS Modules](https://vite.dev/guide/features#css-modules) ｜ [webpack css-loader modules](https://webpack.js.org/loaders/css-loader/#modules) ｜ [Next.js CSS](https://nextjs.org/docs/app/getting-started/css) ｜ [postcss-modules](https://github.com/css-modules/postcss-modules)

## GitHub 地址

[css-modules/css-modules](https://github.com/css-modules/css-modules) ｜ [css-modules/postcss-modules](https://github.com/css-modules/postcss-modules) ｜ [webpack-contrib/css-loader](https://github.com/webpack-contrib/css-loader)

## 幻灯片地址

<a href="/SlideStack/css-modules-slide/" target="_blank">CSS Modules</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=css-modules" target="_blank" rel="noopener noreferrer">CSS Modules 测试题</a>
