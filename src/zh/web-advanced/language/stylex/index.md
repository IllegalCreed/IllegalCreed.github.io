---
layout: doc
---

# StyleX

Meta 出品的**编译期原子化 CSS-in-JS** 样式系统。当前版本 **`@stylexjs/stylex` 0.19.0**（2026-06 发布）。它把「用 JavaScript 对象写样式」的人体工学，与「静态 CSS」的性能合二为一：样式以 JS/TS 对象就近共置在组件旁（享受类型检查与补全），构建期由 Babel 编译器把每个「属性-值对」编译成单一**原子类**并**全局去重**，产出一份静态 CSS，运行时只保留极小的类名合并逻辑。因此它**零运行时注入**、对 React Server Components 友好，且 CSS 体积随代码库增长趋于「平台化」（plateau）而非线性膨胀。StyleX 于 2023 年底开源（MIT），如今已是 Facebook、Instagram、WhatsApp、Messenger、Threads 等 Meta 产品的标准样式系统，也被 Figma、Snowflake 等外部公司采用。它**框架无关**——`stylex.props()` 产出的是中立的 `className` + `style`，凡能接受二者的框架（React / Preact / Solid / lit-html / Angular 等）都能用，非 React 场景另有 `stylex.attrs()`。

## 评价

**优点**

- **零运行时 + 静态 CSS**：样式在构建期编译成原子类，浏览器运行时不注入 CSS，包体更小、SSR/RSC 友好，避开了 styled-components/Emotion 这类运行时 CSS-in-JS 的注入开销
- **可预测的优先级**：合并规则是「后应用者胜」（the last style applied always wins），只看 `stylex.props()` 的应用顺序，与定义顺序、样式表书写顺序、选择器特异性都无关——彻底摆脱 CSS 特异性大战
- **类型安全 + 就近共置**：样式是真正的 JS/TS 对象，有编辑器补全、类型检查、跳转；`StyleXStyles` / `StaticStyles` / `StyleXStylesWithout` 等类型还能约束组件能接收哪些样式属性甚至取值
- **原子化 + 全局去重**：相同属性-值对只生成一个类并全应用复用，大型代码库 CSS 体积趋于平台化；Meta 工程博客称原子化让 CSS 显著瘦身
- **主题化能力完整**：`defineVars` 生成真正的 CSS 自定义属性、支持条件值（深浅模式）与派生变量，`createTheme` 可为任意子树差量覆盖变量，主题切换零运行时
- **框架无关**：产出 `className` + `style`（或 `attrs` 的 HTML 属性），不绑定任何框架，覆盖 Next.js / Vite / webpack / rspack / esbuild / PostCSS / Bun 等主流工具链

**缺点**

- **必须走构建期编译**：依赖 Babel 插件（或 unplugin/postcss 集成），无法像运行时 CSS-in-JS 那样「零配置直接跑」；主题跨文件解析还需开启 `unstable_moduleResolution`
- **AOT 静态约束较严**：`stylex.create()` 内只允许字面量/常量/StyleX 函数，禁止任意函数调用、对象展开、导入值（CSS 变量除外），动态样式的函数体也必须是纯对象字面量，灵活度不如运行时方案
- **TypeScript 约束有边界**：因 TS 结构性子类型，属性白名单对「多出的属性」不总报错（Flow 更严），类型约束不能 100% 兜底
- **心智需转变**：伪类/媒体查询要写成「属性内的条件对象」、变量必须放 `.stylex.js` 专用文件并具名导出，与传统 CSS/SCSS 的书写直觉不同，上手有学习成本
- **强约束换灵活**：刻意限制运行时动态能力换取可静态分析与零运行时，对需要大量运行时派生样式的场景不如 Emotion 顺手

## 文档地址

[StyleX 官网](https://stylexjs.com) ｜ [Learn 文档](https://stylexjs.com/docs/learn/) ｜ [API 参考](https://stylexjs.com/docs/api/)

## GitHub 地址

[facebook/stylex](https://github.com/facebook/stylex)

## 幻灯片地址

<a href="/SlideStack/stylex-slide/" target="_blank">StyleX</a>

## 测试题

<a href="https://quiz.illegalscreed.cn/?category=stylex" target="_blank" rel="noopener noreferrer">StyleX 测试题</a>
