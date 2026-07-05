---
layout: doc
outline: [2, 3]
---

# 参考：vanilla-extract API 速查

> 基于 vanilla-extract 1.21.1 · 核于 2026-07

## 速查

- **定位**：TypeScript-first 零运行时样式；`.css.ts` 构建期出静态 CSS + 作用域类名。核心包 `@vanilla-extract/css`（MIT）。
- **核心链路**：写 `.css.ts` → `style()`/`createTheme()` 等声明 → 打包器插件构建期抽取 → import 类名用。
- **样式**：`style` / `globalStyle` / `styleVariants` / `keyframes`+`globalKeyframes` / `fontFace`+`globalFontFace` / `createVar`+`fallbackVar` / `createContainer` / `layer`+`globalLayer`。
- **主题**：`createTheme`（`[class, vars]`）/ `createThemeContract` / `createGlobalTheme` / `createGlobalThemeContract` / `assignVars`。
- **生态**：`recipes` 的 `recipe()`+`RecipeVariants`；`sprinkles` 的 `defineProperties`+`createSprinkles`；`dynamic` 的 `assignInlineVars`+`setElementVars`。
- **选择器**：简单伪类写顶层；复杂选择器进 `selectors`（`&` 须在主语位）；后代样式用 `globalStyle`；循环依赖用 getter。
- **值规则**：camelCase；数字补 `px`（无单位属性除外）；前缀 PascalCase；回退用数组；令牌是字符串。
- **动态**：`.css.ts` 静态求值 → 运行时用 CSS 变量占位 + `assignInlineVars`。
- **集成**：Vite/webpack/esbuild/Next/Rollup/Parcel/Gatsby 各插件，Astro/Remix 走 Vite；Vite `identifiers` 选 `short`/`debug`/函数。

## 一、核心 API（@vanilla-extract/css）

| API | 作用 | 返回 |
| --- | --- | --- |
| `style(obj \| obj[])` | 定义一条作用域样式规则 | 类名字符串 |
| `globalStyle(selector, styles)` | 定义全局（不作用域化）规则 | 无 |
| `styleVariants(map[, mapper])` | 一组命名样式 | `{ 键: 类名 }` |
| `createVar([property])` | 造 CSS 变量引用（可选 `@property` 类型化） | 变量引用 |
| `fallbackVar(v, ...fallbacks)` | 变量回退值 | 变量表达式 |
| `keyframes(steps)` / `globalKeyframes(name, steps)` | 定义动画 | 作用域/全局动画名 |
| `fontFace(cfg \| cfg[])` / `globalFontFace(name, cfg)` | 定义 `@font-face` | 作用域/全局字体名 |
| `createContainer()` | 造作用域容器名（配 `@container`） | 容器名 |
| `layer([opts])` / `globalLayer(name)` | 造级联层引用（配 `@layer`） | 层引用/名 |

## 二、主题 API

| API | 作用 | 生成 CSS? | 返回 |
| --- | --- | --- | --- |
| `createTheme(tokens)` | 主题 class + 令牌契约 | ✅ | `[themeClass, vars]` |
| `createTheme(vars, tokens)` | 复用契约、新 class 赋新值（多主题） | ✅ | `themeClass` |
| `createThemeContract(shape)` | 契约先行、不产 CSS | ❌ | `vars` |
| `createGlobalTheme(selector, tokens)` | 令牌赋到全局选择器 | ✅ | `vars` |
| `createGlobalTheme(selector, vars, tokens)` | 全局实现既有契约 | ✅ | 无 |
| `createGlobalThemeContract(map, mapFn)` | 契约映射到全局变量名 | ❌ | `vars` |
| `assignVars(contract, values)` | 在 style/选择器/媒体查询里整组赋值 | —（在宿主 style 内） | vars 赋值对象 |

## 三、生态子包

| 包 | 关键 API | 一句话 |
| --- | --- | --- |
| `@vanilla-extract/recipes` | `recipe({ base, variants, compoundVariants, defaultVariants })`、`RecipeVariants<T>` | 多变体组件样式（类 cva/Stitches），返回可调用函数 |
| `@vanilla-extract/sprinkles` | `defineProperties(...)`、`createSprinkles(...)`、`sprinkles(...)` | 零运行时、类型安全的原子化工具类（自建 Tailwind） |
| `@vanilla-extract/dynamic` | `assignInlineVars(vars, values)`、`setElementVars(el, vars, values)` | < 1kB 运行时改内联 CSS 变量值，动态主题不新增 CSS |

## 四、选择器与 at-rule 速记

| 需求 | 写法 |
| --- | --- |
| 简单伪类 | 顶层键 `':hover': {...}` |
| 复杂选择器（针对自身） | `selectors: { '&:not(:first-child)': {...} }`，`&` 在主语位 |
| 引用别的 class | `` selectors: { [`${other} &`]: {} } `` |
| 给后代上样式 | `` globalStyle(`${parent} a`, {}) `` （不能写在 selectors） |
| 循环选择器依赖 | `get selectors() { return {...} }` getter |
| 媒体查询 | `'@media': { 'screen and (min-width: 768px)': {...} }` |
| 特性查询 | `'@supports': { '(display: grid)': {...} }` |
| 容器查询 | `createContainer()` + `containerName` + `'@container': {...}` |
| 级联层 | `layer()` + `'@layer': { [层]: {...} }` |
| 属性回退 | `overflow: ['auto', 'overlay']` |
| 样式组合 | `style([a, b, { ':hover': {...} }])` |

## 五、选型对比：CSS-in-JS / 样式方案

| 维度 | vanilla-extract | StyleX | Panda CSS | CSS Modules | styled-components / Emotion |
| --- | --- | --- | --- | --- | --- |
| 运行时 | 零运行时 | 零运行时 | 零运行时 | 零运行时 | **运行时注入** |
| 样式生成 | 构建期静态 CSS | 构建期原子 CSS（Babel） | 构建期 codegen | 构建期作用域 CSS | 运行时拼接 |
| 写法 | 独立 `.css.ts`（TS 对象） | 组件旁 JS 对象（就地共置） | 配置 + style props/patterns | 标准 `.css` 文件 | 标签模板 |
| 心智 | 像带类型的 Sass | 原子化 + 合并后者胜 | 设计系统 codegen | 默认局部的 CSS | 组件即样式 |
| 类型安全令牌 | ✅ 主题契约 | ✅ `defineVars` | ✅ tokens | ❌（需额外 d.ts） | 一般无 |
| 原子化 | 靠 sprinkles | ✅ 内建 | ✅ 内建 | ❌ | ❌ |
| SSR/RSC | 友好 | 友好 | 友好 | 友好 | 需样式收集/注水 |
| 典型场景 | 设计系统 + 组件库，重类型安全 | Meta 系大型 React 应用 | 设计系统优先、想要 style props | 只想要作用域的标准 CSS | 快速迭代、重运行时动态 |

**选型速记**：想要「TS 写样式 + 类型安全令牌 + 独立样式文件 + 零运行时」→ vanilla-extract；要「原子化 + 就地共置 + 可预测优先级」→ StyleX；要「配置驱动的设计系统 + style props」→ Panda CSS；只想给标准 CSS 加作用域 → CSS Modules；要「运行时按 props 大量派生样式、不在意运行时开销」→ Emotion（但 SSR/RSC 场景应优先零运行时方案）。

## 六、常见坑

| 现象 | 原因 / 解法 |
| --- | --- |
| `.css.ts` 里读 `props`/`window` 报错或值不对 | 构建期无运行时数据 → 用 `createVar` 占位 + `assignInlineVars` |
| `selectors` 里写 `'& .child'` 不生效/报错 | 目标必须是当前元素 → 后代用 `globalStyle` |
| 两个 class 选择器互相引用报「未初始化」 | 循环依赖 → 用 `get selectors()` getter |
| 多主题切换后组件读到的值没变 | 用 `createTheme(vars, {...})` 复用契约，别重新 `createTheme({...})` |
| 实现契约时提示缺值 | 契约要求**完整赋值**，补齐所有令牌 |
| Next 里第三方 ve 库样式不生效 | 把该库加进 `transpilePackages` |
| 生产类名太长/太短不便调试 | Vite `identifiers: 'debug' / 'short'` 切换 |
| 数字没补 px 或补错 | 无单位属性（`flexGrow`/`opacity` 等）本就不补 px |

## 七、权威链接

- [vanilla-extract 官网](https://vanilla-extract.style) —— 文档入口
- [Getting Started](https://vanilla-extract.style/documentation/getting-started/) —— 安装与第一个 `.css.ts`
- [Styling](https://vanilla-extract.style/documentation/styling/) —— `style`/选择器/at-rule/变量
- [Theming](https://vanilla-extract.style/documentation/theming/) —— 主题与契约
- [API](https://vanilla-extract.style/documentation/api/style/) —— 逐个 API 参考
- [Sprinkles](https://vanilla-extract.style/documentation/packages/sprinkles/) ｜ [Recipes](https://vanilla-extract.style/documentation/packages/recipes/) ｜ [Dynamic](https://vanilla-extract.style/documentation/packages/dynamic/)
- [Integrations](https://vanilla-extract.style/documentation/integrations/vite/) —— Vite/webpack/esbuild/Next 等
- [GitHub · vanilla-extract-css/vanilla-extract](https://github.com/vanilla-extract-css/vanilla-extract) —— 源码与 Issue
- [npm · @vanilla-extract/css](https://www.npmjs.com/package/@vanilla-extract/css) —— 版本实测：`1.21.1`
