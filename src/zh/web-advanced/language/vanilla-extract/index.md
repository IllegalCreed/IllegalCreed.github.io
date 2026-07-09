---
layout: doc
---

# vanilla-extract

**TypeScript-first 的零运行时（zero-runtime）样式方案**——官方标语「Zero-runtime Stylesheets-in-TypeScript」。当前版本 **`@vanilla-extract/css` 1.21.1**（MIT）。它的核心模型是把样式写进独立的 `.css.ts` 文件：用 `style()`、`createTheme()`、`keyframes()` 等 API 以 TypeScript 对象声明样式，构建期由打包器插件执行这些文件、抽取并生成**静态 CSS 文件 + 局部作用域化的类名/变量名**，运行时零样式生成开销。它和 Sass/Less 一样「样式在构建期就固化」，却又拥有 TypeScript 的**类型安全**——设计令牌、主题契约（theme contract）都带类型，改名/漏值编译期即报错。围绕核心包还生长出一整套官方生态：`@vanilla-extract/recipes`（多变体组件样式，类似 cva/Stitches）、`@vanilla-extract/sprinkles`（零运行时、类型安全的原子化工具类，可自建 Tailwind/Styled System）、`@vanilla-extract/dynamic`（`assignInlineVars` 运行时改 CSS 变量值实现动态主题），以及 Vite/webpack/esbuild/Next/Rollup/Parcel/Gatsby/Astro 各打包器插件。放进「CSS-in-JS」谱系里，它与 StyleX、Panda CSS 同为零运行时，差异在于**它是 TS-first 的 `.css.ts` 文件模型**——样式与组件分离、更贴近手写 CSS 的心智，而非 Babel 就地共置或配置驱动 codegen。

## 评价

**优点**

- **真·零运行时 + 静态 CSS**：样式在构建期编译成静态 CSS，浏览器运行时不注入样式，包体更小、可被 CDN/HTTP 缓存，天然对 SSR 与 React Server Components 友好，避开 styled-components/Emotion 运行时注入与注水（hydration）开销
- **端到端类型安全**：用 TS 写样式，属性由 csstype 校验；`createTheme`/`createThemeContract` 让设计令牌成为**类型化契约**，主题结构变更、漏赋值都在编译期暴露，杜绝令牌漂移
- **作用域化彻底**：类名、动画名（`keyframes`）、字体名（`fontFace`）、变量名（`createVar`）、容器名（`createContainer`）全部自动哈希、局部作用域，从根上消除全局命名冲突
- **`.css.ts` 文件模型清爽**：样式与组件分离、无标签模板 DSL，`style([base, ...])` 数组组合、`selectors`/`@media`/`@supports`/`@container`/`@layer` 一应俱全，接近手写 CSS 的直觉
- **生态完整**：recipes 管多变体、sprinkles 管原子化、dynamic 管运行时动态变量，三者可组合，覆盖从设计系统到运行时主题的全链路
- **框架 & 打包器无关**：产出的是中立的类名字符串，React/Vue/Solid/Svelte 皆可用；官方覆盖 Vite/webpack/esbuild/Next/Rollup/Parcel/Gatsby/Astro

**缺点**

- **必须走构建期编译**：依赖打包器插件处理 `.css.ts`，无法像运行时 CSS-in-JS 那样「零配置直接跑」，也不能在浏览器里裸引入
- **静态求值约束**：`.css.ts` 在构建期执行，值必须能静态求值——不能直接用组件 props、`window`、请求数据算样式，运行时动态只能走 CSS 变量占位 + `assignInlineVars`，心智需转变
- **复杂选择器有规则**：`selectors` 里选择器的目标必须是当前元素（`&` 在主语位），给后代上样式得改用 `globalStyle`，循环引用要用 getter，初学易踩
- **样板与概念偏多**：主题契约、sprinkles 的 `defineProperties`/`createSprinkles`、recipes 的四段配置等 API 面较大，小项目可能觉得重
- **社区体量小于头部方案**：相比 Tailwind、styled-components 生态与教程数量偏少，遇到边缘问题多需读官方文档

## 文档地址

[vanilla-extract 官网](https://vanilla-extract.style) ｜ [Styling](https://vanilla-extract.style/documentation/styling/) ｜ [Theming](https://vanilla-extract.style/documentation/theming/) ｜ [Sprinkles](https://vanilla-extract.style/documentation/packages/sprinkles/) ｜ [Recipes](https://vanilla-extract.style/documentation/packages/recipes/)

## GitHub 地址

[vanilla-extract-css/vanilla-extract](https://github.com/vanilla-extract-css/vanilla-extract)

## 幻灯片地址

<a href="/SlideStack/vanilla-extract-slide/" target="_blank">vanilla-extract</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=vanilla-extract" target="_blank" rel="noopener noreferrer">vanilla-extract 测试题</a>
