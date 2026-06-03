---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **Vite 8.x** 编写（npm `latest` = 8.x）；凡涉及 Vite 7 的差异均显式标注，便于仍在 7.x 的项目对照。

## 速查

- 系统要求：Node.js **20.19+** / **22.12+**（精确小版本，不是简单的 Node 20+）
- 安装：`pnpm add -D vite`（脚手架：`pnpm create vite@latest`）
- 创建项目：`pnpm create vite@latest my-app --template vue`（npm 需写成 `npm create vite@latest my-app -- --template vue`）
- 官方模板（8 类，各含 JS 与 `-ts` 变体）：`vanilla` / `vue` / `react` / `preact` / `lit` / `svelte` / `solid` / `qwik`
- 启动开发：`pnpm dev`（即 `vite`，默认 `http://localhost:5173`）
- 生产构建：`pnpm build`（即 `vite build`，默认输出 `dist/`）
- 本地预览构建产物：`pnpm preview`（即 `vite preview`，默认 `http://localhost:4173`，**仅本地预览，不可作生产服务器**）
- 应用入口：项目根目录的 `index.html`（被当源码处理，解析其中的 `<script type="module">`）
- 配置文件：`vite.config.ts`（`export default defineConfig({ ... })`）
- 打包内核：**Vite 8 = 单一 Rolldown**（dev + prod + 依赖预构建）；**Vite ≤7 = esbuild（dev 转译）+ Rollup（prod 打包）**
- 类型检查：Vite **只转译不检查**，需另跑 `tsc --noEmit`

## 一、Vite 是什么

Vite 由两部分组成：

1. **一个开发服务器**：基于浏览器原生 ESM 提供源文件，内置极快的 [HMR](https://vite.dev/guide/features.html#hot-module-replacement)（热模块替换）。
2. **一条构建命令**：用 [Rolldown](https://rolldown.rs/) 把代码打包成高度优化的静态资源，开箱即用于生产。

它本质上是「**框架无关的现代前端构建工具**」——你既可以用它起一个纯 vanilla 项目，也可以作为 Vue / React / Svelte 等框架的底层（这些框架的官方脚手架都基于 Vite），还能作为 Nuxt / SvelteKit / Astro 等元框架的构建引擎。

## 二、为什么这么快

Vite 的速度来自一个核心洞察：**把模块分成「依赖」和「源码」两类，区别对待**。

| | 依赖（dependencies） | 源码（source code） |
|---|---|---|
| 特点 | 很少变动，但数量大（如 `lodash-es` 有 600+ 内部模块） | 频繁编辑，但单文件小 |
| Vite 的做法 | **预构建一次**：用原生工具（Vite 8 是 Rolldown）转成 ESM 并合并为少量文件，强缓存 | **按需提供**：经原生 ESM 交给浏览器，浏览器请求哪个就即时转换哪个 |
| 收益 | 避免成百上千个 HTTP 请求 | 启动无需打包整个应用，时间与项目大小**解耦** |

传统打包式 dev server 必须**先打包整个应用**才能开始服务，应用越大启动越慢；Vite 把这一步省掉了，所以「冷启动几乎瞬时」。改文件时，HMR 也只沿原生 ESM 更新**变动的那个模块**，不整页刷新。

::: tip 为什么生产环境还要打包？
开发态可以用未打包的原生 ESM，但生产环境若直接用，嵌套的 `import` 会产生大量额外网络往返（network round trips），仍然低效。所以 `vite build` 仍会打包 + tree-shaking + 代码分割 + 懒加载优化。「原生 ESM 仅适用于开发」是常见误解点。
:::

## 三、版本基线：Vite 8 vs Vite 7

Vite 8 最大的变化是**打包内核统一**。这是当前最高频的版本考点，务必分清：

| 维度 | Vite ≤7 | **Vite 8（当前）** |
|---|---|---|
| 开发态转译 | esbuild | **Oxc Transformer** |
| 生产打包 | Rollup | **Rolldown**（Rust） |
| 依赖预构建 | esbuild | **Rolldown** |
| JS 压缩（`build.minify`） | `'esbuild'` | **`'oxc'`** |
| CSS 压缩（`build.cssMinify`） | `'esbuild'` | **`'lightningcss'`** |
| 构建配置项 | `build.rollupOptions` | **`build.rolldownOptions`**（旧名仍兼容） |
| `build.target` 默认 | `'modules'` | **`'baseline-widely-available'`** |

> ⚠️ **本项目** 实际安装的是 Vite 7.3.3，仍用 `rollupOptions` / esbuild。本文以官方文档当前的 Vite 8 为准；当你在 7.x 项目里看到 `rollupOptions`、esbuild 默认压缩，那是正常的版本差异，不是错误。

在 Vite 6 / 7 中也可**手动 opt-in** Rolldown：安装 `rolldown-vite` 并在 `package.json` 用包别名 `"vite": "npm:rolldown-vite@latest"` 覆盖（建议 pin 版本，因为 `rolldown-vite` 的 patch 版本也可能含破坏性变化）。

## 四、环境要求

- **Node.js 20.19+ 或 22.12+**（注意是精确的小版本，部分模板要求更高）。
- 开发态的转译目标是 `esnext`；生产态默认目标是 `baseline-widely-available`（约 2.5 年前发布的浏览器，对齐 Baseline）。

## 五、创建第一个项目

用官方脚手架 `create-vite` 是最快的起点：

::: code-group

```bash [pnpm]
pnpm create vite@latest my-app
# 指定模板：
pnpm create vite@latest my-app --template vue
```

```bash [npm]
npm create vite@latest my-app
# 注意：npm 传模板参数必须用 -- 分隔
npm create vite@latest my-app -- --template vue
```

```bash [yarn]
yarn create vite my-app
yarn create vite my-app --template vue
```

```bash [bun]
bun create vite my-app
bun create vite my-app --template vue
```

:::

> ⚠️ **`--` 分隔陷阱**：只有 **npm** 需要 `--` 把参数透传给脚手架（`npm create vite@latest my-app -- --template vue`）；yarn / pnpm / bun 直接写 `--template vue` 即可。

**8 类官方模板**（每类都有 JS 和 `-ts` 两个变体，如 `react` 与 `react-ts`）：

`vanilla` · `vue` · `react` · `preact` · `lit` · `svelte` · `solid` · `qwik`

加 `--no-interactive` 可抑制交互式提问；更多社区模板见 [Awesome Vite](https://github.com/vitejs/awesome-vite)。

创建后：

```bash
cd my-app
pnpm install
pnpm dev
```

## 六、手动安装与启动

不用脚手架，也可以把 Vite 加进已有项目：

```bash
pnpm add -D vite
```

新建入口 `index.html`（**Vite 以 `index.html` 作为应用入口**，而不是像传统打包器那样从 JS 入口开始）：

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <title>My App</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- index.html 被当源码处理，解析其中的 module 脚本 -->
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

启动开发服务器：

```bash
npx vite           # 默认 http://localhost:5173
npx vite serve some/sub/dir   # 指定其它目录作为 root
```

> ⚠️ Vite 开发服务器默认端口是 **5173**（不是 3000 / 8080）；`vite preview` 是 **4173**。

## 七、标准脚本与开发循环

脚手架生成的 `package.json` 标准三脚本：

```json
{
  "scripts": {
    "dev": "vite",          // 启动开发服务器（别名 vite dev / vite serve）
    "build": "vite build",  // 生产构建到 dist/
    "preview": "vite preview" // 本地静态服务器预览 dist/（仅本地）
  }
}
```

最小配置文件 `vite.config.ts`：

```ts
import { defineConfig } from "vite";

// defineConfig 提供类型提示与智能补全
export default defineConfig({
  // 框架插件、别名、server、build 等都写在这里
});
```

> 💡 想试 Vite 仓库里某个**未发布的提交**？可以装 `pkg.pr.new` 的预览包：`pnpm add -D https://pkg.pr.new/vite@<SHA>`（过去一个月内任意 commit）。

## 八、第一段 HMR 体验

Vite 的 HMR 对框架是「自动」的——Vue SFC、React（Fast Refresh）、Preact（`@prefresh/vite`）在脚手架模板里都已预配置，改组件即时更新、保留状态。

如果你写**框架无关的原生模块**，可以用 `import.meta.hot` API 手动接受热更新。关键是用 `if (import.meta.hot)` 守卫包裹（生产构建中 `import.meta.hot` 为 `undefined`，守卫能让这段代码被 tree-shake 掉）：

```ts
// counter.ts
export function setupCounter(el: HTMLElement) {
  let count = 0;
  el.textContent = `count is ${count}`;
  el.addEventListener("click", () => {
    el.textContent = `count is ${++count}`;
  });
}

// 接受自身的热更新，避免整页刷新
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // newModule 在语法错误时可能为 undefined，需判空
    if (newModule) newModule.setupCounter(document.querySelector("#app")!);
  });
}
```

到这里你已经能跑通「创建 → 开发（HMR）→ 构建 → 预览」的完整循环。更深入的内置特性、配置、生产构建、SSR、插件与编程式 API，见 [指南](./guide-line/base.md)。
