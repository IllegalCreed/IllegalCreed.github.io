---
layout: doc
outline: [2, 3]
---

# dynamic 运行时变量与构建集成

> 基于 vanilla-extract 1.21.1 · 核于 2026-07

## 速查

- **`@vanilla-extract/dynamic`**：< 1kB 运行时，用于**运行时改 scoped CSS 变量值**——不新增 CSS，仍零运行时。
- **`assignInlineVars(vars, values)`**：**声明式**，返回对象放进元素 `style` 属性（React/JSX 友好）；`null`/`undefined` 的项被省略。
- **`setElementVars(element, vars, values)`**：**命令式**，直接把变量写到某个 DOM 元素上（框架无关）。
- 都可传主题契约：传契约时**所有变量必须赋值**（类型强制）。
- **动态套路**：`.css.ts` 里 `createVar()`/契约占位 + 组件运行时 `assignInlineVars` 改内联值。
- **打包器插件**：Vite `@vanilla-extract/vite-plugin`、webpack `@vanilla-extract/webpack-plugin`、esbuild `@vanilla-extract/esbuild-plugin`、Next `@vanilla-extract/next-plugin`；Rollup/Parcel/Gatsby 各有包，Astro/Remix 复用 Vite 插件。
- **Vite `identifiers` 选项**：`'short'`（短哈希，生产）/`'debug'`（带文件名规则名，开发）/自定义函数。
- **Next**：`createVanillaExtractPlugin()` 包裹 config；第三方含 ve 样式的库要加进 `transpilePackages`；Next 16+ 支持 Turbopack 与 Webpack。
- **SSR/RSC 友好**：零运行时 → 静态 CSS、无运行时收集/注水，天然可用于 Server Components、无样式闪烁。

## 一、为什么需要 dynamic

回顾编译模型：`.css.ts` 在构建期执行、值须静态求值，**拿不到运行时数据**。但真实应用常需要「运行时才知道的值」——用户自定义的主题色、拖拽出的坐标、图表数据映射的尺寸。

vanilla-extract 的解法是**分层**：

1. 构建期：用 `createVar()` 或主题契约声明变量，样式引用 `var()`（值待定）；
2. 运行时：用 `@vanilla-extract/dynamic` 把变量的**内联值**设到元素上。

关键——这**不新增任何 CSS 规则**，只是改内联的 CSS 变量值，因此仍是零运行时 CSS。安装：

```bash
npm install @vanilla-extract/dynamic
```

## 二、`assignInlineVars`：声明式

`assignInlineVars(vars, values)` 返回一个可直接放进 `style` 属性的对象（内部 `toString()` 成内联样式）：

```ts
// slider.css.ts
import { createVar, style } from '@vanilla-extract/css';

export const progress = createVar();
export const bar = style({
  width: progress,               // 引用变量，值待运行时注入
  height: 8,
  background: 'blue',
});
```

```tsx
// Slider.tsx
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { progress, bar } from './slider.css';

export function Bar({ percent }: { percent: number }) {
  return (
    <div
      className={bar}
      style={assignInlineVars({ [progress]: `${percent}%` })}
    />
  );
}
```

也能传**主题契约**一次性赋一组变量（此时**契约里所有变量都必须给值**，否则类型报错）：

```tsx
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { vars } from './contract.css';

<div style={assignInlineVars(vars.color, { bg: userBg, text: userText })} />;
```

::: tip null / undefined 会被省略
`assignInlineVars` 里值为 `null` / `undefined` 的变量会从结果内联样式中省略，便于条件式赋值。
:::

## 三、`setElementVars`：命令式

`setElementVars(element, vars, values)` 直接把 CSS 变量写到一个**已存在的 DOM 元素**上，适合非声明式/框架无关场景（如原生 JS、动画循环里逐帧更新）：

```ts
import { setElementVars } from '@vanilla-extract/dynamic';
import { vars } from './theme.css';

const el = document.getElementById('app')!;
setElementVars(el, vars.color, { bg: '#111', text: '#eee' });
```

`assignInlineVars`（声明式，返回对象给 `style`）与 `setElementVars`（命令式，直接操作元素）是同一能力的两种风格，按你的渲染范式选用。

## 四、构建集成：各打包器插件

vanilla-extract 靠打包器插件在构建期抽取 `.css.ts`。常用集成：

| 打包器 | 包 | 入口 |
| --- | --- | --- |
| Vite | `@vanilla-extract/vite-plugin` | `vanillaExtractPlugin()` |
| webpack | `@vanilla-extract/webpack-plugin` | `new VanillaExtractPlugin()` |
| esbuild | `@vanilla-extract/esbuild-plugin` | `vanillaExtractPlugin()` |
| Next.js | `@vanilla-extract/next-plugin` | `createVanillaExtractPlugin()` |
| Rollup / Parcel / Gatsby | 各有对应包 | 见官方 Integrations |
| Astro / Remix | 复用 Vite 插件 | `vanillaExtractPlugin()` |

### Vite

```ts
import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  plugins: [
    vanillaExtractPlugin({
      // identifiers 控制生成的类名/变量标识符格式
      identifiers: 'short',   // 'short' | 'debug' | (info) => string
    }),
  ],
});
```

`identifiers` 决定标识符的**可读性与体积**取舍：

- `'short'`：短哈希（如 `hnw5tz3`），产物更小，适合生产。
- `'debug'`：带文件名与规则名（如 `myfile_mystyle_hnw5tz3`），便于调试定位，适合开发。
- **自定义函数**：接收 `{ hash, filePath, debugId, packageName }`，返回自定义标识符。

### Next.js

```js
// next.config.js
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withVanillaExtract = createVanillaExtractPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 引用了「第三方发布的含 vanilla-extract 样式的库」时，加进 transpilePackages
  transpilePackages: ['some-ve-styled-lib'],
};

module.exports = withVanillaExtract(nextConfig);
```

Next 16+ 同时支持 Turbopack 与 Webpack；更早版本仅 Webpack。第三方库的 `.css.ts` 需要被编译，故要列入 `transpilePackages`。

## 五、SSR 与 React Server Components 友好性

vanilla-extract 对 SSR/RSC 特别友好，根因还是**零运行时**：

- 样式是构建期生成的**静态 CSS 文件**，服务端渲染时无需「收集运行时生成的样式再注水」，也不需要在客户端注入 `<style>`；
- 因此**没有** styled-components/Emotion 那类运行时 CSS-in-JS 的 SSR 样式闪烁（FOUC）与注水成本；
- 因为不依赖运行时状态/上下文，样式可以**直接用在 React Server Components** 里（RSC 不能带运行时 JS 状态）；
- 需要运行时动态的部分，用 `assignInlineVars` 走内联 CSS 变量——它只改变量值，不破坏静态 CSS 的可缓存性。

## 六、与邻近方案的一句话对比

同处「样式方案 / CSS-in-JS」谱系，本组邻叶都零运行时，差异在模型：

- **vs StyleX**：都零运行时；StyleX 走 Babel、样式对象与组件**就地共置**、主打原子化合并；vanilla-extract 是 TS-first 的**独立 `.css.ts` 文件模型**，更贴近手写 CSS。
- **vs Panda CSS**：Panda 是**配置驱动 + codegen**（style props/patterns）；vanilla-extract 直接在 `.css.ts` 调 API 生成作用域样式，无独立 codegen。
- **vs CSS Modules**：都做作用域 + 零运行时，但 CSS Modules 只是标准 CSS + 作用域；vanilla-extract 多出**类型安全令牌/主题契约**与 recipes/sprinkles 生态。
- **vs styled-components / Emotion**：那些是**运行时**注入的 CSS-in-JS；vanilla-extract 构建期出静态 CSS，性能与 SSR/RSC 更优（衰退期的运行时方案本组不单列，此处带过）。

详见 [参考页对比表](../reference)。

---

至此核心链路走完。回到 [参考](../reference) 查 API 速查表、完整对比与资源链接。
