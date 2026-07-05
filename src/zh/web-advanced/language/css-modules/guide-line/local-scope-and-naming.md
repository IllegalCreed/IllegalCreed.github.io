---
layout: doc
outline: [2, 3]
---

# 局部作用域与命名：:local / :global 与哈希名

> 基于 CSS Modules 规范 + Vite/webpack 实现 · 核于 2026-07

## 速查

- **默认局部**：CSS Modules 里类名默认被作用域化（哈希改写），想全局要显式 `:global`。
- **`:global(.x)`**：**全局例外**——让 `x` 保持原名、不被哈希，用于对接第三方全局类或稳定钩子。
- **`:local(.x)`**：在全局模式下把某个类切回局部（当 `scopeBehaviour: 'global'` 时才常用）。
- **块级切换**：`:global { .a { } .b { } }` 把整块当全局；`:local { ... }` 反之，省去逐个包裹。
- **`scopeBehaviour`**：默认 `'local'`；设 `'global'` 则默认不作用域化，局部需显式 `:local()`。
- **命名推荐 camelCase**：好让 JS 用 `styles.className`；kebab-case 只能 `styles['class-name']`。官方推荐而**非强制**。
- **`localsConvention`**：控制导出映射**键名风格**——`camelCase`（原名+驼峰都导出）/ `camelCaseOnly`（只驼峰）/ `dashes` / `dashesOnly`。让你 CSS 写 kebab、JS 用驼峰点号。
- **哈希名格式**：`generateScopedName`（postcss-modules，默认 `[name]__[local]___[hash:base64:5]`）/ `localIdentName`（css-loader，默认 `[hash:base64]`）。
- **开发 vs 生产**：开发用可读 `[path][name]__[local]`（便于 DevTools 定位），生产用精简 `[hash:base64]`（更短/不泄露路径）。
- **`hashPrefix`**：给哈希加盐，规避不同项目哈希碰撞。
- ⚠️ **id 选择器一般不作用域化**：CSS Modules 面向类，不推荐用 id 做钩子。

## 一、默认局部与 :global 例外

CSS Modules 里你写的每个类默认被哈希、只在本模块生效。但有时你**需要一个全局类**——比如对接第三方库约定的 `.swiper-slide`、给 E2E 测试留稳定钩子、或写一段真正全站生效的样式。这时用 **`:global()`** 包裹：

```css
/* 局部（默认）：被哈希 */
.title {
  font-size: 20px;
}

/* 全局例外：保持原名 .app-header，不被哈希 */
:global(.app-header) {
  position: sticky;
}

/* 局部类内引用全局祖先：常见于对接第三方 */
.title :global(.icon) {
  margin-right: 4px;
}
```

`:global(.app-header)` 编译后仍是 `.app-header`，全局可命中。

## 二、:local、块级切换与 scopeBehaviour

三种控制作用域的手段，按粒度从小到大：

```css
/* 1) 函数式：精确到单个选择器 */
:global(.a) { color: red; }
:local(.b)  { color: blue; }

/* 2) 块级切换：一段范围内改默认作用域 */
:global {
  .legacy-a { }   /* 整块都当全局 */
  .legacy-b { }
}
```

```js
// 3) 配置级：改整个文件/项目的默认作用域
// vite.config.js
export default {
  css: {
    modules: {
      scopeBehaviour: 'local', // 默认；设 'global' 则默认不哈希，局部需显式 :local()
    },
  },
};
```

`scopeBehaviour: 'global'` 会把默认行为整体翻转（通常只在迁移旧全局样式时用）。块级 `:global { }` 适合**批量**声明多个全局类，免去逐个 `:global()` 包裹。

::: tip :global 在选择器中间
`:global` 可以出现在选择器任意位置，只影响其后的部分。例如 `.local :global .globalChild` 表示「局部 `.local` 后代里的全局 `.globalChild`」——前半局部、后半全局，粒度很细。
:::

## 三、命名约定：为什么推荐 camelCase

官方在 naming 文档里明确：**「We recommend camelCase for local class names.」**（推荐局部类名用 camelCase）。原因纯粹是 JS 访问便利：

```jsx
// ✅ camelCase：JS 点号访问顺手
import styles from './x.module.css';
<div className={styles.pullQuote} />

// ⚠️ kebab-case：JS 点号非法，只能方括号
// styles.pull-quote 会被当成「styles.pull 减 quote」
<div className={styles['pull-quote']} />
```

- kebab-case 在 **CSS 里完全合法**，问题只出在 **JS 点号访问**——`styles.pull-quote` 会被解析成减法。
- 这是**推荐而非强制**：你想在 CSS 里写 kebab-case，也可以靠 `localsConvention` 自动转驼峰导出。

## 四、localsConvention：让 CSS 写 kebab、JS 用驼峰

`localsConvention` 控制**导出映射里键的命名风格**。以源类 `.apply-color` 为例：

| 取值 | 导出的键 |
| --- | --- |
| `camelCase` | `apply-color` **和** `applyColor` 都导出（原名 + 驼峰） |
| `camelCaseOnly` | 只导出 `applyColor` |
| `dashes` | 只把连字符转驼峰，原名保留 |
| `dashesOnly` | 只转连字符版本 |

```js
// vite.config.js —— CSS 里写 kebab，JS 里用 styles.applyColor
export default {
  css: { modules: { localsConvention: 'camelCaseOnly' } },
};
```

> 在 webpack css-loader 里，对应选项名是 `exportLocalsConvention`，取值用连字符风格（`camel-case-only` 等），语义一致。

## 五、哈希名格式：generateScopedName / localIdentName

哈希名怎么长，由生成模板控制——这是**可读性 vs 精简/隐私**的取舍：

```js
// postcss-modules（Vite 底层）：generateScopedName
// 默认：[name]__[local]___[hash:base64:5]  →  Button__title___2xhGs
css: {
  modules: {
    generateScopedName: '[name]__[local]___[hash:base64:5]',
    hashPrefix: 'my-app',   // 加盐，避免跨项目哈希碰撞
  },
}
```

```js
// webpack css-loader：localIdentName（默认 [hash:base64]）
{
  loader: 'css-loader',
  options: {
    modules: {
      // 开发：可读，便于 DevTools 对照源码
      localIdentName: '[path][name]__[local]',
      // 生产：换成 '[hash:base64]' —— 更短、不泄露目录结构
    },
  },
}
```

常用占位符：`[name]`（文件名）、`[local]`（原类名）、`[hash:base64:5]`（5 位哈希）、`[path]`（相对路径）。`generateScopedName` / `localIdentName` 也都支持传**函数**完全自定义。

---

作用域与命名掌握后，进入 [组合复用 composes 与 @value](./composition-and-values)：同文件 / 跨文件 / from global 的样式组合，以及 `@value` 值变量与它和原生 `var()` 的区别。
