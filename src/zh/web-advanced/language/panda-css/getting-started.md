---
layout: doc
outline: [2, 3]
---

# 入门：定位、安装与核心 API

> 基于 Panda CSS 1.11.4 · 核于 2026-07

## 速查

- **定位**：Panda 是**构建期** CSS-in-JS 样式引擎——静态分析源码里的样式对象，经 PostCSS 生成**原子 CSS**，并 codegen 出类型安全的样式工具。Chakra 团队出品，包名 `@pandacss/dev`（实测 `1.11.4`，MIT）。
- **零/轻运行时**：运行时**不在浏览器生成样式、不注入 `<head>`**，只有一小段拼类名的轻量函数；样式构建期定稿为静态 CSS，兼容 RSC / SSR。
- **安装（PostCSS 路线）**：`npm install -D @pandacss/dev postcss` → `npx panda init -p`（生成 `panda.config.ts` + `postcss.config.cjs`）。
- **PostCSS 插件**：`postcss.config.cjs` 里 `plugins: { '@pandacss/dev/postcss': {} }`。
- **入口 CSS 层声明**：入口 CSS 顶部写 `@layer reset, base, tokens, recipes, utilities;`（声明级联层顺序）。
- **codegen**：`panda codegen` 生成 `styled-system` 目录（含 `css`/`tokens`/`recipes`/`patterns`/`jsx`/`types`）；常挂 `package.json` 的 `prepare` 脚本，目录进 `.gitignore`；开发用 `panda --watch`。
- **核心 API 导入**：运行期工具来自**生成目录**——`css`/`cva`/`cx` 从 `styled-system/css`；配置期 API（`defineConfig`/`defineRecipe`/`defineTokens`）从 `@pandacss/dev`。
- **`css()`**：接样式对象、返回 **className 字符串**（一串原子类），赋给 `className` 用；落在 `@layer utilities`。
- **简写属性**：`bg`=backgroundColor、`p`=padding、`m`=margin、`rounded`=borderRadius、`w`/`h`=width/height……简写与全称等价。
- **伪状态**：下划线前缀条件 `_hover`/`_focus`/`_active`/`_disabled`/`_before`……比手写 `&:hover` 简洁。
- **响应式**：条件对象 `{ base, sm, md, lg, xl, 2xl }`，`base` 为默认值。
- ⚠️ **静态分析约束**：值须可被静态分析——运行时才算出的动态值传给 `css()` 会**漏提**，改用 token / CSS 变量 / recipe 变体。
- **配置字段**：`preflight`（CSS reset）/ `include`（扫描哪些文件）/ `exclude` / `outdir`（默认 `styled-system`）/ `jsxFramework`（启用 JSX 组件）。
- **进阶顺序**：本页 → [写样式：css() 与条件样式](./guide-line/writing-styles) → [Recipes 配方与 Patterns 布局](./guide-line/recipes-and-patterns) → [Tokens 与主题](./guide-line/tokens-and-theming) → [静态提取原理与配置](./guide-line/static-extraction-and-config) → [生态与选型](./guide-line/ecosystem-and-selection) → [参考](./reference)。

## 一、Panda CSS 是什么：定位与机制

Panda CSS 是一个**构建期的 CSS-in-JS 样式引擎**：你在 JS/TS 里用「样式对象」写样式，Panda 在**构建阶段**把它们静态分析出来、经 PostCSS 管线生成**原子 CSS**，同时 codegen 出一套类型安全的样式工具。它由 **Chakra 团队**打造，可以理解成「Chakra 把多年沉淀的样式系统，抽成一个独立于组件、构建期提取的引擎」。

它和传统运行时 CSS-in-JS（Emotion / styled-components）最本质的区别，是**样式的落地时机**：

| 维度 | 传统运行时 CSS-in-JS | Panda CSS |
| --- | --- | --- |
| 样式生成 | 浏览器运行时动态生成样式字符串 | 构建期静态提取成 CSS 文件 |
| 样式注入 | 运行时注入 `<head>` 的 `<style>` | 不注入，直接引入静态 CSS |
| 运行时开销 | 有（生成 + 注入 + 序列化） | 极小（只剩拼类名的轻量函数） |
| Server Components | 依赖运行时/上下文，不兼容 | 天然兼容（样式已构建期定稿） |

官方对「零运行时」有个更精确的说法：Panda **并非完全零运行时**——它会生成一小段轻量运行时 JS（本质是把样式对象键值拼成类名的优化函数），但关键在于它**不在浏览器生成样式、也不向 `<head>` 注入样式**。所以「零/轻运行时」是就『不在浏览器产出 CSS』而言，而非『一行 JS 都不带』。

Panda 的样式提取管线本身是一个 **PostCSS 插件**（`@pandacss/dev/postcss`），因此「兼容任何支持 PostCSS 的框架」——Next.js / Vite / Astro / Remix / Solid / Qwik / Vue 等都能集成，对不走 PostCSS 的场景还有 CLI 方案兜底。

## 二、安装与初始化（PostCSS 路线）

以最常见的 PostCSS 集成为例：

```bash
# 1. 安装开发依赖
npm install -D @pandacss/dev postcss

# 2. 初始化（-p 同时生成 postcss.config.cjs）
npx panda init -p
```

`panda init` 会生成两份配置。PostCSS 插件配置：

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {},
  },
};
```

Panda 主配置（声明扫描范围、输出目录、是否 reset）：

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true, // 启用 CSS reset
  include: ['./src/**/*.{ts,tsx,js,jsx}', './pages/**/*.{ts,tsx,js,jsx}'],
  exclude: [],
  outdir: 'styled-system', // 生成目录，默认就是它
});
```

入口 CSS 顶部声明**级联层顺序**（Panda 会把生成的规则填进这几层）：

```css
/* 入口 index.css */
@layer reset, base, tokens, recipes, utilities;
```

## 三、codegen 与 styled-system 目录

`panda codegen` 会扫描源码、生成 `styled-system` 目录，里面是你日常导入的所有工具：

```bash
panda codegen        # 生成 styled-system
panda codegen --watch # 或 panda --watch，开发时持续生成
```

生成目录的主要子模块：

| 子路径 | 内容 |
| --- | --- |
| `styled-system/css` | `css()`、`cva()`、`cx()`、`sva()` 等核心函数 |
| `styled-system/tokens` | `token()` 函数与 token 类型 |
| `styled-system/recipes` | 配置配方生成的函数（如 `button()`） |
| `styled-system/patterns` | 布局原语函数（`stack()`/`grid()`/`flex()`……） |
| `styled-system/jsx` | JSX 组件与 `styled` 工厂（需设 `jsxFramework`） |
| `styled-system/types` | `HTMLStyledProps`、`RecipeVariantProps` 等类型 |

由于 `styled-system` 是构建产物，通常把它加进 `.gitignore`，并在 `package.json` 里挂个 `prepare` 脚本让它装完依赖自动重生：

```json
{
  "scripts": {
    "prepare": "panda codegen"
  }
}
```

## 四、第一段样式：`css()`

有了 `styled-system` 之后，写样式最基础的入口是 `css()`——接一个样式对象，返回一串**原子类名字符串**：

```tsx
import { css } from '../styled-system/css';

export function App() {
  return (
    <div
      className={css({
        bg: 'red.400', // backgroundColor 的简写
        rounded: '9999px', // borderRadius
        fontSize: '13px',
        p: '10px 15px', // padding
        _hover: { bg: 'red.700' }, // 伪状态用下划线前缀
      })}
    >
      Hello Panda
    </div>
  );
}
```

几个日常必备的表达：

- **简写属性**：`bg`/`p`/`m`/`rounded`/`w`/`h` 等与全称等价，按团队习惯选用。
- **伪状态**：`_hover`/`_focus`/`_active`/`_disabled` 等下划线前缀条件，等价于对应伪类。
- **响应式**：给属性传条件对象 `{ base, md, lg }`——`base` 是无断点默认值，其余键对应断点：

```tsx
css({ fontSize: { base: 'sm', md: 'lg', lg: 'xl' } });
```

- **重要声明**：值末尾加 `!`（`css({ color: 'red!' })`）表示 `!important`。

⚠️ **静态分析约束要牢记**：Panda 靠构建期静态分析读出样式，所以**值必须可被静态分析**。`css({ color: getColorFromApi() })` 这种运行时才知道结果的动态值提取不到——要动态切换请改用 token / CSS 变量，或把有限取值做成 recipe 变体（可枚举即可静态穷举）。

---

写样式的完整武器库（`css()` 深入、条件样式、样式合并、`cx`）见下一页：[写样式：css() 与条件样式](./guide-line/writing-styles)。
