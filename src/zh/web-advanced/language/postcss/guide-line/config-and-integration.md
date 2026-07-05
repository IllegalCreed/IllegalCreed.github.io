---
layout: doc
outline: [2, 3]
---

# 配置与构建集成：postcss.config、Browserslist、Vite/webpack

> 基于 PostCSS 8.5.16 · 核于 2026-07

## 速查

- **配置文件名**（`postcss-load-config` 支持）：`postcss.config.js` / `.cjs` / `.mjs`、`.postcssrc` / `.postcssrc.json` / `.postcssrc.yml` / `.postcssrc.js`、`package.json` 的 `postcss` 键。
- **两种 plugins 写法**：数组 `plugins: [autoprefixer(), cssnano()]`；对象 `plugins: { autoprefixer: {}, cssnano: {} }`（键=插件名、值=选项）。
- **执行顺序**：按声明**自上而下**。
- **函数式配置**：`export default (ctx) => ({ plugins: {...} })`，用 `ctx.env` 区分开发/生产（如生产才挂 cssnano）。
- **Browserslist**：目标写 `.browserslistrc` 或 `package.json` 的 `browserslist`；被 autoprefixer / preset-env / cssnano / Babel **共享**（单一事实来源）。常用 query：`> 0.5%`、`last 2 versions`、`not dead`。
- **Vite**：**自动发现**根目录 PostCSS 配置并应用到所有导入的 CSS；内置 `@import` 内联 + url() 重写；也可用 `vite.config` 的 `css.postcss` 内联配置。
- **webpack**：经 `postcss-loader`（放 `css-loader` 之前）读取同一份 `postcss.config.js`。
- **无需运行时引入**：PostCSS 是**构建期**工具，不通过浏览器 `<script>`。

## 一、配置文件：叫什么、放哪里

PostCSS 通过 `postcss-load-config` 自动发现配置，支持的文件名（放项目根目录）：

| 文件 | 说明 |
| --- | --- |
| `postcss.config.js` | 最常用（ESM 或 CJS 取决于 `package.json` 的 `type`） |
| `postcss.config.cjs` / `.mjs` | 显式指定 CommonJS / ESM |
| `.postcssrc` / `.postcssrc.json` / `.postcssrc.yml` | 纯配置格式 |
| `.postcssrc.js` / `.cjs` / `.mjs` | 脚本格式 |
| `package.json` 的 `postcss` 键 | 内联进 package.json |

## 二、plugins 的两种写法

配置导出一个对象，核心是 `plugins` 字段。**数组**与**对象**两种形式都合法：

```js
// 数组形式：显式 require/import 并调用，传选项更直观
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default {
  plugins: [
    autoprefixer(),
    cssnano({ preset: 'default' }),
  ],
};
```

```js
// 对象形式：键是插件名（字符串），值是选项对象；由 postcss-load-config 解析
export default {
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': { stage: 2 },
    cssnano: {},
  },
};
```

- 两种写法都**按声明顺序自上而下执行**。
- 对象形式里，把值设为 `false` 可**关闭**某个插件（配合函数式配置做环境区分很方便）。

## 三、函数式配置：区分开发 / 生产

导出一个**函数**（接收上下文 `ctx`）就能按环境动态返回配置——最常见的用法是「**只在生产环境压缩**」：

```js
// postcss.config.js
export default (ctx) => ({
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': { stage: 2 },
    // 生产才启用 cssnano，开发环境设 false 跳过
    cssnano: ctx.env === 'production' ? {} : false,
  },
});
```

- `ctx.env` 通常来自 `NODE_ENV`；构建工具会把环境信息传进来。
- 开发环境跳过压缩能加快构建、便于调试；生产环境再压到最小。

## 四、Browserslist：一处声明，多工具共享

Autoprefixer、postcss-preset-env、cssnano（乃至 Babel 的 preset-env）都读同一份 **Browserslist** 目标。你只在一处声明「要兼容哪些浏览器」，整条流水线统一遵循——**单一事实来源**。

```jsonc
// package.json —— 写法之一
{
  "browserslist": [
    "> 0.5%",
    "last 2 versions",
    "not dead"
  ]
}
```

```
# .browserslistrc —— 写法之二（等价）
> 0.5%
last 2 versions
not dead
```

- 常用 query：`> 0.5%`（市占率）、`last 2 versions`（每个浏览器最近 2 版）、`not dead`（排除停止维护的）、`Chrome > 100` 等。
- 改一次目标浏览器，**加前缀 / 未来 CSS 降级 / 安全压缩**的策略同步调整，不会各说各话。
- `npx browserslist` 可查看当前配置命中的具体浏览器列表。

::: warning 别把 Browserslist 写进 CSS 注释
Browserslist 只从 `.browserslistrc` / `package.json` 等读取，**不会**从 CSS 注释或 HTML meta 读目标浏览器。
:::

## 五、Vite 集成：零配置自动加载

Vite **内置** PostCSS 支持。官方原文：只要项目里存在有效的 PostCSS 配置（`postcss-load-config` 支持的任意格式），**它就会被自动应用到所有被导入的 CSS**，无需额外接线。

```js
// 方式一（推荐）：直接放一个 postcss.config.js，Vite 自动发现
// 方式二：在 vite.config 里内联（此时不再读外部 postcss.config）
import { defineConfig } from 'vite';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
});
```

- Vite 还**预置**了 `@import` 内联（postcss-import）与 `url()` 重写，并尊重 Vite 路径别名。
- CSS 压缩在 PostCSS 处理**之后**由 Vite 自己按 `build.cssTarget` 完成（也可再挂 cssnano）。

::: tip 本项目是 UnoCSS + Vite
本仓库（quiz-monorepo）用的是 **UnoCSS**（独立原子化引擎，走 Vite 插件，**不基于 PostCSS**），因此仓库里**没有** `postcss.config.js`。这正好印证下一页的澄清：UnoCSS 与 PostCSS 是两条独立路线。
:::

## 六、webpack 集成：postcss-loader

webpack 侧通过 `postcss-loader` 接入，它会自动发现并加载同一份 `postcss.config.js`：

```js
// webpack.config.js（loader 顺序从右到左执行：postcss 在 css 之前）
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader', // 读取 postcss.config.js
        ],
      },
    ],
  },
};
```

- `postcss-loader` 要放在 `css-loader` **之前**（webpack loader 从右向左执行，PostCSS 先处理原始 CSS，再交给 css-loader）。
- 插件仍写在 `postcss.config.js`——loader 只是「把 PostCSS 接进 webpack」的桥。

---

配置与集成打通后，最后一页 [与预处理器/原子化的关系](./vs-preprocessors)：澄清 PostCSS 与 Sass/Less、Tailwind/UnoCSS、Lightning CSS 的边界与常见误区。
