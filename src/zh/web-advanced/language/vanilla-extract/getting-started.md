---
layout: doc
outline: [2, 3]
---

# 入门：定位、`.css.ts` 模型与编译原理

> 基于 vanilla-extract 1.21.1 · 核于 2026-07

## 速查

- **定位**：TypeScript-first 的**零运行时**样式方案，标语「Zero-runtime Stylesheets-in-TypeScript」。样式写在 `.css.ts` 里，构建期出**静态 CSS + 作用域类名**，运行时零样式开销。
- **核心包**：`@vanilla-extract/css`；子包 `@vanilla-extract/recipes`、`@vanilla-extract/sprinkles`、`@vanilla-extract/dynamic`，各打包器插件独立。
- **文件模型**：所有样式声明放进 `.css.ts`（或 `.css.js`）文件；打包器识别该后缀，在构建期执行文件、抽取 CSS。
- **依赖打包器**：必须配好 Vite/webpack/esbuild/Next 等插件，**不能脱离构建器裸跑**。
- **核心 API**：`style(obj)` → 返回**作用域化 class 名字符串**；属性 **camelCase**；数字默认补 `px`（`flexGrow`/`opacity` 等无单位属性除外）；前缀属性 PascalCase（`WebkitTapHighlightColor`）。
- **编译模型**：`.css.ts` 在**构建期由打包器在 Node 里执行**，导出的 class 名/变量引用留下、CSS 被抽取。**值必须能静态求值**——不能用组件 props、`window`、请求数据。
- **动态样式**：运行时要变的值 → 用 `createVar()`/主题契约占位 + `@vanilla-extract/dynamic` 的 `assignInlineVars` 只改**内联变量值**（不新增 CSS，仍零运行时）。
- **样式组合**：`style([base, { color: 'red' }])` 传数组合并。
- ⚠️ **vanilla-extract ≠ 运行时 CSS-in-JS**：不像 styled-components 在运行时拼接注入 `<style>`；它更像「用 TS 写、编译成静态 CSS 的 Sass」，但带类型安全。
- **进阶顺序**：本页 → [Styling：style 深入](./guide-line/styling) → [主题系统](./guide-line/theming) → [recipes 与 sprinkles](./guide-line/recipes-and-sprinkles) → [dynamic 与构建集成](./guide-line/dynamic-and-build) → [参考](./reference)。

## 一、vanilla-extract 是什么：定位与心智

vanilla-extract 是一个 **TypeScript-first 的零运行时样式方案**。它把「用 JS/TS 对象写样式」的人体工学，与「静态 CSS」的性能合二为一：

- 你在名为 `styles.css.ts` 的文件里，用 `style()` 等 API 以 **TypeScript 对象**声明样式；
- 打包器插件在**构建期**执行这个文件，把样式**抽取成静态 CSS 文件**，并为每条规则生成**局部作用域、唯一哈希的类名**；
- 文件导出的是**类名字符串**，你在组件里当作 `className` / `class` 使用。

一句话心智：**它像「用 TypeScript 写、编译成静态 CSS 的 Sass」——但带端到端类型安全**。这与 styled-components / Emotion 这类**运行时** CSS-in-JS 截然不同：后者在浏览器运行时用标签模板拼 CSS 并动态注入 `<style>`，vanilla-extract 则在构建期就把一切固化好，运行时零样式生成开销。

| 维度 | vanilla-extract | 运行时 CSS-in-JS（styled-components/Emotion） |
| --- | --- | --- |
| CSS 生成时机 | 构建期（静态） | 运行时（动态注入） |
| 运行时开销 | 零样式生成 | 有拼接/注入/注水成本 |
| 写法 | TS 对象，独立 `.css.ts` | 标签模板，与组件共置 |
| SSR/RSC | 天然友好 | 需额外样式收集/注水 |
| 类型安全令牌 | ✅ 主题契约 | 一般无 |

## 二、安装与打包器集成

核心包 + 对应打包器插件（以 Vite 为例）：

```bash
npm install @vanilla-extract/css
npm install --save-dev @vanilla-extract/vite-plugin
```

在 `vite.config.ts` 里注册插件：

```ts
import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [vanillaExtractPlugin()],
});
```

::: tip 必须有打包器
vanilla-extract 依赖打包器在构建期处理 `.css.ts`，**不能在浏览器里裸引入**。官方为 Vite、webpack、esbuild、Next.js、Rollup、Parcel、Gatsby、Astro 等提供插件，详见 [dynamic 与构建集成](./guide-line/dynamic-and-build)。
:::

## 三、第一个 `.css.ts`：`style()`

新建 `styles.css.ts`：

```ts
// styles.css.ts
import { style } from '@vanilla-extract/css';

export const container = style({
  padding: 10,
  display: 'flex',
  ':hover': {
    background: '#fafafa',
  },
});
```

构建期它会被抽取成类似这样的静态 CSS（类名带文件名与哈希）：

```css
.styles_container__1hiof570 {
  padding: 10px;
  display: flex;
}
.styles_container__1hiof570:hover {
  background: #fafafa;
}
```

在组件里 import 并使用返回的**类名字符串**：

```tsx
// App.tsx（框架无关，这里用 React 举例）
import { container } from './styles.css';

export function App() {
  return <section className={container}>Hello</section>;
}
```

几个入门要点：

- **属性用 camelCase**：`paddingTop`、`backgroundColor`，由 csstype 提供类型补全。
- **数字默认补 `px`**：`padding: 10` → `10px`；无单位属性（`flexGrow`、`opacity`、`zIndex` 等）保持原值。
- **前缀属性 PascalCase**：`WebkitTapHighlightColor`（去掉前导连字符、首字母大写）。
- **简单伪类可写顶层**：`:hover`、`::before` 直接作为键；复杂选择器要进 `selectors`（见 [Styling](./guide-line/styling)）。

## 四、编译模型：为什么样式要能「静态求值」

这是理解 vanilla-extract 一切约束的关键。`.css.ts` 文件**不是**发给浏览器执行的，而是**在构建期由打包器插件在 Node 环境里执行**——执行的产物（导出的类名、变量引用）被留下，其中 `style()` 等调用产生的 CSS 被抽取到静态 `.css` 文件。

因此文件里的样式值**必须能在构建期静态求值**：

```ts
// ✅ 可以：常量、模块内计算、其他 vanilla-extract API 的返回值
const spacing = 8;
export const box = style({ padding: spacing * 2 });

// ❌ 不行：构建期根本不存在这些运行时信息
export const bad = style({
  width: window.innerWidth,     // window 在构建期不存在
  color: props.color,           // 组件 props 在构建期不存在
});
```

组件 props、`window`、用户交互、请求数据都是**运行时**才有的，构建期拿不到。想让样式随运行时数据变化，正确姿势是**用 CSS 变量占位**：

```ts
// theme.css.ts
import { createVar, style } from '@vanilla-extract/css';

export const accent = createVar();          // 只是一个变量引用，不生成 CSS
export const button = style({
  background: accent,                        // 引用 var()，值待运行时注入
});
```

```tsx
// Button.tsx
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { accent, button } from './theme.css';

export function Button({ color }: { color: string }) {
  // 运行时只改「内联变量值」，不新增任何 CSS 规则 → 仍是零运行时 CSS
  return <button className={button} style={assignInlineVars({ [accent]: color })} />;
}
```

::: warning 一句话记牢
`.css.ts` = 构建期执行、静态求值；运行时动态 = CSS 变量占位 + `assignInlineVars` 改内联值。二者分工清晰，别想在 `.css.ts` 里读运行时数据。
:::

## 五、生态一览

vanilla-extract 是「核心 + 官方子包」的结构：

| 包 | 作用 |
| --- | --- |
| `@vanilla-extract/css` | 核心：`style`/`globalStyle`/`createTheme`/`keyframes`/`fontFace`/`createVar` 等 |
| `@vanilla-extract/recipes` | 多变体组件样式 `recipe()`（类似 cva/Stitches） |
| `@vanilla-extract/sprinkles` | 零运行时、类型安全的原子化工具类（自建 Tailwind/Styled System） |
| `@vanilla-extract/dynamic` | 运行时改 CSS 变量值：`assignInlineVars`/`setElementVars` |
| `@vanilla-extract/*-plugin` | Vite/webpack/esbuild/Next 等打包器集成 |

---

地基打好后，下一步进入 [Styling：style 深入](./guide-line/styling)：选择器规则、`@media`/`@supports`/`@container`、`vars`、`globalStyle`、`styleVariants`、`keyframes`、`fontFace` 与样式组合。
