---
layout: doc
outline: [2, 3]
---

# 框架集成与 TypeScript 类型

> 基于 CSS Modules 规范 + Vite/webpack 实现 · 核于 2026-07

## 速查

- **Vite（8.1）**：内建。`.module.css` / `.module.scss` 等自动识别；`css.modules` 选项透传给 **postcss-modules**；用 Lightning CSS 时改走 `css.lightningcss.cssModules`。
- **Next.js（16.x）**：内建。建 `.module.css` 直接 `import`，官方推荐用于「组件级私有样式」。
- **webpack**：靠 `css-loader` 的 `modules` 选项。`modules` 可取 `true`/`'local'`/`'global'`/`'pure'`/`'icss'` 或对象。
- **css-loader `auto`**：默认按正则 `/\.module\.\w+$/i` 匹配文件名，自动对 `.module.css` 启用——这就是后缀约定「自动生效」的底层。
- **css-loader `modules` 模式**：`'local'`（默认局部）/`'global'`（默认全局）/`'pure'`（选择器须含局部 class/id）/`'icss'`（只启 `:import`/`:export`）。
- **CRA**：内建，`[name].module.css` 开箱即用，无需 eject。
- **TS 默认无类型**：`import styles from './x.module.css'` 默认 `any`/报找不到模块，写错类名不报错。
- **补类型三条路**：① 通配环境声明 `declare module '*.module.css'`（最省事，只保证是字符串字典）；② `typed-css-modules`（`tcm`）生成逐类名的 `.module.css.d.ts`（可编译期校验）；③ `typescript-plugin-css-modules`（LSP 编辑器补全，**编译期不报错**）。
- **`namedExport`**：css-loader 选项，开启后可 `import { foo } from`；保留字类名如 `default` 会变 `_default`。
- **Vite 内置声明**：`vite/client` 已为 `.module.css` 提供 `CSSModuleClasses` 类型，Vite 项目常无需手写通配声明。

## 一、Vite

Vite 内建 CSS Modules，无需任何插件。约定：任何 `.module.css`（及 `.module.scss` / `.module.less` / `.module.styl`）都被当模块处理：

```js
// vite.config.js
export default {
  css: {
    modules: {
      // 这些选项会透传给 postcss-modules
      localsConvention: 'camelCaseOnly',
      scopeBehaviour: 'local',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
};
```

- Vite 文档明确：`css.modules` 的选项**透传给 [postcss-modules](https://github.com/css-modules/postcss-modules)**，所以选项语义与它一致。
- 若改用 **Lightning CSS**（更快的 Rust 实现）：`css.modules` 不生效，要改用 `css.lightningcss.cssModules`（选项集不完全相同，迁移需对照）。

## 二、Next.js

Next.js（当前 16.x）内建支持，官方把 CSS Modules 列为「组件私有样式」的推荐方案：

```css
/* app/blog/blog.module.css */
.blog {
  padding: 24px;
}
```

```jsx
// app/blog/page.jsx
import styles from './blog.module.css';

export default function Page() {
  return <main className={styles.blog} />;
}
```

> Next.js 建议：全局重置/Tailwind 基础样式用全局 CSS，**组件自定义样式用 CSS Modules**。它还会在生产构建自动做 CSS 分块与压缩。

## 三、webpack（css-loader）

原生 webpack 里由 `css-loader` 负责，核心是 `modules` 选项：

```js
// webpack.config.js
{
  test: /\.css$/i,
  use: [
    'style-loader',   // 把 CSS 注入 DOM
    {
      loader: 'css-loader',
      options: {
        modules: {
          auto: true,              // 默认对 /\.module\.\w+$/i 自动启用
          mode: 'local',           // 'local'|'global'|'pure'|'icss'
          localIdentName: '[path][name]__[local]', // 开发可读；生产用 [hash:base64]
          exportLocalsConvention: 'camel-case-only',
          namedExport: true,       // 允许 import { foo } from
        },
      },
    },
  ],
}
```

`modules` 的四种模式：

| 值 | 行为 |
| --- | --- |
| `'local'`（默认） | 默认局部作用域 |
| `'global'` | 默认全局，局部要显式 `:local()` |
| `'pure'` | 每个选择器**至少含一个局部 class/id**，否则报错（强制局部纪律） |
| `'icss'` | 只启用最底层 `:import`/`:export`，不做完整模块化 |

> `auto` 默认正则 `/\.module\.\w+$/i` 就是 `.module.css` 后缀能「自动生效」的原因；它也可传自定义正则或函数。

## 四、CRA 与其他

- **Create React App**：内建，文件名符合 `[name].module.css` 约定即可，无需 eject 或改配置。
- **Parcel / Rspack / esbuild 插件**等也各有 CSS Modules 支持，约定大同小异（`.module.css` 后缀）。

## 五、TypeScript：默认无类型的坑

默认情况下，TS **不认识** `.module.css` 这种资源导入：

```ts
import styles from './x.module.css';
// styles 是 any（或直接报「找不到模块 './x.module.css'」）
// 写错类名 styles.tilte 也不会报错 —— 失去类型检查与补全
```

补类型有**三条路**，按精度与成本排列：

### 路一：通配环境声明（最省事）

加一段全局声明，让所有 `.module.css` 至少是「字符串字典」：

```ts
// css-modules.d.ts
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
// .scss / .less / .styl 同理各加一段
```

成本最低，但**只保证「是字符串字典」**，不校验具体类名是否存在。Vite 项目通常无需手写——`vite/client` 已内置 `CSSModuleClasses` 声明。

### 路二：typed-css-modules（精确校验）

`typed-css-modules`（`tcm` CLI，当前 0.9.x）为每个 `.module.css` **生成对应的 `.module.css.d.ts`**，把实际存在的类名逐个声明成属性：

```bash
# 为 src 下所有 module.css 生成 .d.ts（可接 --watch）
tcm src
```

这样 `styles.tilte`（拼错）会被 TS **直接报错**。代价：要把生成步骤接进构建/watch 流程，且产物是磁盘上的 `.d.ts` 文件。

### 路三：typescript-plugin-css-modules（编辑器补全）

它是 **TS 语言服务插件**，在编辑器里实时提供类名补全与提示，**不生成文件**：

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [{ "name": "typescript-plugin-css-modules" }]
  }
}
```

⚠️ 关键限制：**TS 编译期不加载语言服务插件**，所以它**无法在 `tsc` 编译时报错**——只管编辑体验。实践中常「路三（编辑器补全）+ 路二（编译期校验）」互补使用。

---

框架与类型打通后，进入 [对照 CSS-in-JS 与选型](./vs-css-in-js)：CSS Modules 与 StyleX / Panda / vanilla-extract 的根本差异，以及和 Tailwind、传统 CSS-in-JS 的选型决策。
