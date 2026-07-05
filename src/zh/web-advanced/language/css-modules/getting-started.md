---
layout: doc
outline: [2, 3]
---

# 入门：定位、工作原理与基本用法

> 基于 CSS Modules 规范 + Vite/webpack 实现 · 核于 2026-07

## 速查

- **定位**：CSS Modules 是**构建期把类名局部作用域化**的方案——「一个所有类名和动画名默认局部作用域的 CSS 文件」。写的是**标准 CSS**，不是运行时 CSS-in-JS，是**作用域基线**。
- **不是单一库**：它是**约定/规范**（css-modules/css-modules）+ 各构建工具的**编译期实现**（Vite 8.1 / webpack css-loader 7.x / Next.js 16.x / CRA / postcss-modules 9.x）。
- **文件约定**：`.module.css` 后缀触发模块化；普通 `.css` 仍是全局样式。预处理器可叠加：`.module.scss` / `.module.less`。
- **工作原理**：编译期把 `.foo` 改写成全局唯一哈希名（如 `_foo_x1y2`），并导出映射对象 `{ foo: '_foo_x1y2' }`；底层先编译到 **ICSS**（Interoperable CSS）。
- **基本用法**：`import styles from './x.module.css'` 拿到映射对象 → `className={styles.foo}` 用真实类名。默认导出的是**映射对象**（default import）。
- **默认局部**：CSS Modules 默认把类名局部化，与普通 CSS「默认全局」**相反**；想全局要显式 `:global`。
- **零运行时**：作用域化全在构建期，产物是普通 CSS + 类名映射，浏览器端无样式引擎开销，性能贴近手写 CSS。
- **命名**：官方推荐 **camelCase** 局部类名，好让 JS 用点号 `styles.className`（kebab-case 只能 `styles['class-name']`）。
- ⚠️ **原始类名已被哈希**：直接写 `className="foo"` 命不中，必须走 `styles.foo`。
- ⚠️ **TypeScript 默认无类型**：`styles` 默认是 `any`/报找不到模块，写错类名不报错，需补类型（见[框架与 TS 页](./guide-line/framework-and-typescript)）。
- **边界**：原生 CSS 语法本身归 Web 基础章；CSS Modules 只负责**类名作用域**这一层。
- **进阶顺序**：本页 → [局部作用域与命名](./guide-line/local-scope-and-naming) → [组合复用 composes 与 @value](./guide-line/composition-and-values) → [框架集成与 TypeScript](./guide-line/framework-and-typescript) → [对照 CSS-in-JS 与选型](./guide-line/vs-css-in-js) → [参考](./reference)。

## 一、CSS Modules 是什么：定位

CSS Modules 官方定义原文只有一句：**「A CSS Module is a CSS file where all class names and animation names are scoped locally by default.」**（一个所有类名和动画名默认被局部作用域化的 CSS 文件）。

拆开看三个关键词：

- **CSS file**：你写的仍是**标准 CSS 文件**，不是在 JS 里写样式。这把它和 styled-components 那类「在 JS 里写样式」的真·CSS-in-JS 明确区分开。
- **scoped locally**：类名被限定在导入它的模块内，跨文件互不干扰。
- **by default**：**默认**就是局部——这与普通 CSS「默认全局」正好相反。

一句话心智：**它把 CSS 的「默认全局」翻转成「默认局部」**，只解决作用域这一件事，所以常被称为**作用域基线**。它是**零运行时**的：作用域化全在构建期完成，产物是普通 CSS + 一份类名映射，浏览器里没有额外的样式库在跑。

::: tip 它不是单一版本的库
CSS Modules 是一份**约定 / 规范**（[css-modules/css-modules](https://github.com/css-modules/css-modules)）加上**构建期实现**的组合，没有「CSS Modules 3.0」这种版本号。真正带版本的是各实现：Vite（8.1）、webpack `css-loader`（7.x）、`postcss-modules`（9.x，参考实现）、Next.js（16.x 内建）等。
:::

## 二、工作原理：改写类名 + 导出映射

给一个最小的 `Button.module.css`：

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 6px;
}
```

构建工具在**编译期**做两件事：

1. **改写类名**：把 `.button` 换成一个全局唯一的哈希名，比如 `_button_x1y2` 或 `Button__button___2xhGs`（具体格式由 `generateScopedName` / `localIdentName` 配置决定）。
2. **导出映射**：生成一个「原始类名 → 唯一类名」的对象：

```js
// 编译产物（示意）：CSS Modules 导出的映射对象
export default {
  button: '_button_x1y2',
};
```

底层它先编译到 **ICSS（Interoperable CSS）**——一种用 `:import` / `:export` 描述绑定的低层交换格式，各工具（webpack、postcss）在 ICSS 之上生成最终映射。**唯一化类名**正是避免冲突的手段：两个文件都写 `.button`，编译后是两个不同的哈希名，互不覆盖。

> `@keyframes` 的动画名同样默认被作用域化——不同模块定义同名动画也不会互相污染。

## 三、基本用法：import styles 然后 styles.foo

在组件里，标准三步：默认导入映射对象 → 用属性访问取真实类名 → 赋给 `className`。

```jsx
// Button.jsx
import styles from './Button.module.css';

export function Button() {
  // styles.button 在运行时就是 '_button_x1y2' 这个真实哈希类名
  return <button className={styles.button}>点我</button>;
}
```

- `import styles from ...` 是**默认导入**——CSS Modules 默认把整份映射作为 default export 导出。
- ⚠️ 因为原始类名已被哈希，**直接写 `className="button"` 命不中样式**，必须走 `styles.button`。
- 多个类拼接就用模板字符串或 `clsx`：`` className={`${styles.button} ${styles.primary}`} ``。

## 四、默认局部 vs 普通 CSS 默认全局

这是理解 CSS Modules 的关键对照：

| 维度 | 普通 CSS | CSS Modules |
| --- | --- | --- |
| 默认作用域 | **全局**（到处生效，易冲突） | **局部**（限定在导入模块内） |
| 类名 | 原样输出 | 编译期改写成唯一哈希名 |
| 引用方式 | `class="button"` 字面名 | `className={styles.button}` 走映射 |
| 冲突风险 | 高（同名互相覆盖） | 无（哈希唯一） |
| 触发条件 | 普通 `.css` | `.module.css` 后缀 |

## 五、叠加预处理器与边界

CSS Modules 只负责「类名作用域」这一层，**和预处理器正交、可叠加**：想要嵌套、mixin、变量等语法糖，把后缀换成 `.module.scss` / `.module.less` / `.module.styl` 即可——构建工具会**先跑预处理器、再按 CSS Modules 处理**。

```scss
// Card.module.scss —— 预处理器 + CSS Modules 叠加
.card {
  padding: 16px;
  &__title {           // Sass 嵌套语法照常用
    font-weight: 600;
  }
}
```

::: warning 边界划分
**原生 CSS 语法本身**（选择器、盒模型、Flex/Grid 等）归 **Web 基础章**，不在 CSS Modules 的范畴；CSS Modules 加的只是**类名作用域 + `composes`/`@value` 少量扩展点**。别把「CSS 怎么写」和「CSS Modules 做什么」混为一谈。
:::

---

打好地基后，下一步进入 [局部作用域与命名](./guide-line/local-scope-and-naming)：`:local` / `:global` 的函数式与块级切换、camelCase 命名约定与 `localsConvention`、哈希名格式配置。
