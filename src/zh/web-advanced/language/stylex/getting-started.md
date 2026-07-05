---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与第一个组件

> 基于 StyleX 0.19 · 核于 2026-07

## 速查

- **定位**：StyleX 是 Meta 出品的**编译期原子化 CSS-in-JS**——用 JS 对象写样式（人体工学 + 类型安全），构建期编译成静态原子类（零运行时 + 高性能）。
- **谁在用**：Facebook / Instagram / WhatsApp / Messenger / Threads（Meta 全家桶）+ Figma / Snowflake 等外部公司；2023 年底开源，MIT。
- **核心两步**：`stylex.create(...)` 定义样式 → `stylex.props(...)` 应用，返回 `className` + 按需的 `style`，展开到元素上。
- **框架无关**：`props()` 产出中立的 `className`/`style`，凡接受二者的框架都能用（React/Preact/Solid/lit-html/Angular）；非 React 用 `stylex.attrs()` 拿 HTML 属性。
- **零运行时**：样式在 **build 时**由编译器提取成静态 CSS，浏览器运行时只做类名合并——区别于 styled-components/Emotion 的运行时注入。
- **原子化 + 去重**：每个「属性-值对」编译成一个原子类、全局复用，CSS 体积随代码库增长趋于**平台化**（plateau）。
- **安装**：`npm install @stylexjs/stylex` + 编译插件（`@stylexjs/babel-plugin` 或 `@stylexjs/postcss-plugin` / `@stylexjs/unplugin`）。
- **构建集成**：官方覆盖 Next.js / Vite / webpack / rspack / esbuild / PostCSS / Bun / CLI；核心是一个 Babel 变换。
- **后者胜**：`props(a, b)` 冲突属性以 **b** 为准，只看应用顺序，与定义顺序/特异性无关。
- **条件样式**：`props()` 忽略 `null`/`undefined`/`false`，故 `cond && styles.x`、`cond ? a : b` 是标准写法。
- **选型速记**：要类型安全 + 零运行时 + 大规模可维护 → StyleX；只想标签里堆工具类 → Tailwind；要运行时动态派生 → Emotion；要语义作用域类 → vanilla-extract / CSS Modules；要配置驱动 recipe → Panda CSS。
- ⚠️ **主题跨文件**：`defineVars`/`createTheme` 需在插件里开 `unstable_moduleResolution`，变量还必须放 `.stylex.js`/`.ts` 专用文件并具名导出。
- **进阶顺序**：本页 → [定义与应用样式](./guide-line/defining-styles) → [变量与主题](./guide-line/theming) → [类型安全与现代 API](./guide-line/types-and-modern-apis) → [选型对比与集成](./guide-line/comparison-and-integration) → [参考](./reference)。

## 一、StyleX 是什么：定位与心智

StyleX 是 **Meta 开源的编译期原子化 CSS-in-JS**。名字里有「CSS-in-JS」，但它和 styled-components / Emotion 那种「运行时」CSS-in-JS 走的是相反的路：

- **运行时 CSS-in-JS**：在浏览器里把样式序列化成 CSS 字符串、动态注入 `<style>` 标签，灵活但有运行时开销、对 RSC 不友好。
- **StyleX（编译期）**：构建时由 Babel 编译器静态分析样式对象，把每个「属性-值对」编译成一个**原子类**、全局去重，产出一份**静态 CSS**；源码里的样式引用被替换成类名。浏览器运行时只剩极小的「按属性合并类名」逻辑。

这套设计让 StyleX 同时拿到两边的好处：**CSS-in-JS 的人体工学**（用 JS 对象写样式、可组合、类型安全、就近共置）+ **静态 CSS 的性能**（零运行时注入、体积可控、SSR/RSC 友好）。官网把它概括为「富表达力、类型安全、可组合、可预测、可主题化」。

**为什么原子化能让 CSS 体积平台化？** 因为 `color: red` 这样的属性-值对在全应用范围内只生成一个类、被所有用到它的地方复用。应用越大，新写的样式越多地命中已有原子类，CSS 增长曲线逐渐走平而非线性膨胀——这正是 Meta 支撑数十亿用户界面时最看重的特性。

## 二、安装与构建配置

StyleX 由「核心库 + 编译插件」两部分组成：

```bash
# 核心运行时 / 类型
npm install @stylexjs/stylex

# 编译插件（按你的构建工具二选一/多选）
npm install --save-dev @stylexjs/babel-plugin      # 基于 Babel
# 或经打包器集成：
npm install --save-dev @stylexjs/postcss-plugin    # PostCSS
npm install --save-dev @stylexjs/unplugin          # Vite / webpack / rspack / esbuild 通用
```

以 Babel 为例，核心是把 StyleX 变换加入 `babel.config.js`：

```js
// babel.config.js
import styleXPlugin from '@stylexjs/babel-plugin';

export default {
  plugins: [
    [
      styleXPlugin,
      {
        dev: process.env.NODE_ENV === 'development',
        // 主题（defineVars/createTheme）跨文件解析必须开启
        unstable_moduleResolution: { type: 'commonJS', rootDir: __dirname },
      },
    ],
  ],
};
```

官方还提供 Next.js、Vite（含 React / RSC / SvelteKit / react-router 等模板）、webpack、rspack、esbuild、PostCSS、Bun 以及独立 CLI 的集成，本质都是把这个 Babel 变换接进对应构建管线。

## 三、第一个组件：create + props

StyleX 的用法就两步——`create` 定义、`props` 应用：

```tsx
import * as stylex from '@stylexjs/stylex';

// 1. 定义样式：顶层键是「命名空间」，其下是 CSS 属性-值对
const styles = stylex.create({
  base: {
    fontSize: 16,
    lineHeight: 1.5,
    color: 'rgb(60,60,60)',
  },
  highlighted: {
    color: 'rebeccapurple',
  },
});

// 2. 应用样式：props 返回 { className, style }，展开到元素上
function Text({ isHighlighted }: { isHighlighted: boolean }) {
  return (
    <p {...stylex.props(styles.base, isHighlighted && styles.highlighted)}>
      Hello StyleX
    </p>
  );
}
```

三个要点：

- **命名空间**：`base`、`highlighted` 各是一组可独立引用、独立应用的样式；属性名用驼峰式 CSS 属性。
- **后者胜**：`props(styles.base, styles.highlighted)` 里 `highlighted` 在后，冲突的 `color` 以它为准；调换顺序则 `base` 胜。这只看应用顺序，与定义顺序无关。
- **条件样式**：`props()` 忽略 `false`/`null`/`undefined`，所以 `isHighlighted && styles.highlighted` 是最地道的条件写法，无需手拼类名。

## 四、框架无关：props 与 attrs

StyleX 不绑定任何框架，秘密就在 `props()` 的返回值——它是一个**框架中立的普通对象**：

```tsx
// React：props() 返回 { className, style }
<div {...stylex.props(styles.base)} />

// 非 React（lit-html / 服务端模板 / 直接操作 DOM）：attrs() 返回 HTML 属性
const { class: className, style } = stylex.attrs(styles.base);
el.setAttribute('class', className);
```

只要框架能接受 `className`（或 `class`）和 `style`，就能用 StyleX——React、Preact、Solid、lit-html、Angular 皆可。`props`（React 风格 `className`）与 `attrs`（HTML 属性 `class`/`style` 字符串）是同一能力的两个出口，共同支撑了 StyleX 的框架无关性。

---

有了 `create` + `props` 的基本盘，下一步进入 [定义与应用样式](./guide-line/defining-styles)：伪类/伪元素/媒体查询的条件写法、合并优先级、变体 recipe、动态样式与 `keyframes`/`firstThatWorks`。
