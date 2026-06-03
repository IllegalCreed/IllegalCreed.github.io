---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 基于 **Rsbuild 2.x**。本篇覆盖配置分层、框架与 CSS、`tools` 透传底层、Environments 多环境与迁移要点。

## 一、配置分层（`rsbuild.config.ts`）

顶层字段按职责分层：

| 段 | 职责 |
|---|---|
| `source` | 入口、`define`、`transformImport`、`decorators`、`tsconfigPath` |
| `output` | `distPath`、`target`、`sourceMap`、`minify`、`polyfill`、`cssModules`、`dataUriLimit` |
| `html` | `template`、`title`、`meta`、`mountId`、`inject` |
| **`server`** | **dev + preview 都生效**：`port`、`host`、`proxy`、`base`、`historyApiFallback` |
| **`dev`** | **仅开发态生效**：`hmr`、`liveReload`、`lazyCompilation`、`writeToDisk` |
| `tools` | 透传底层：`rspack`、`swc`、`bundlerChain`、`postcss`、`cssLoader`、`lightningcssLoader` |
| `resolve` | `alias`、`extensions`、`dedupe` |
| `performance` | `buildCache`、`removeConsole`、`printFileSize`、`preload` |

::: warning `dev` 段 vs `server` 段（高频混淆）
- **`server` 段**：dev 与 preview 服务器**都生效**（`port` / `host` / `proxy`）。
- **`dev` 段**：**仅开发态**（`hmr` / `liveReload` / `writeToDisk`）。
:::

### source 与 output 要点

```ts
export default defineConfig({
  source: {
    // 字符串值当【代码片段】，传字符串常量必须 JSON.stringify
    define: { VERSION: JSON.stringify("1.0.0"), TWO: "1 + 1" },
  },
  output: {
    target: "web", // 'web' | 'node' | 'web-worker'
    dataUriLimit: 4096, // 小资源内联阈值默认 4KiB（不是常见 8KB）
    cleanDistPath: "auto", // 'auto' 不无脑清空：dev+writeToDisk:false 或 root 在项目外则跳过
  },
  resolve: {
    alias: { "@": "./src" }, // 2.0 在 resolve.alias（pre-1.0 是 source.alias）
  },
});
```

> ⚠️ `source.define` 的字符串值会被当**代码片段**，传字符串常量必须 `JSON.stringify` 包裹（否则被当变量名）。`output.target: 'node'/'web-worker'` 会**静默关闭** HMR、HTML 生成、代码分割。

## 二、开发服务器

```ts
export default defineConfig({
  server: {
    port: 3000, // 默认 3000，占用时自动 +1 递增（strictPort 则报错）
    host: "localhost", // ⚠️ 2.0 默认 localhost（v1 是 0.0.0.0）
    proxy: { "/api": "http://localhost:8080" }, // changeOrigin 自动 true
  },
  dev: {
    hmr: true, // 关闭会 fallback 到 liveReload 并禁用 React Fast Refresh
  },
});
```

> ⚠️ **`server.host` 2.0 默认 `localhost`**：局域网/容器访问会失败，需显式设 `'0.0.0.0'` 或 `--host`。这是 secure-by-default 的破坏性变更，高频踩坑。

## 三、框架插件

框架支持**全走插件**（核心包不内置）：

```ts
import { pluginReact } from "@rsbuild/plugin-react";
export default defineConfig({ plugins: [pluginReact()] });
```

| 框架 | 插件 | 备注 |
|---|---|---|
| React | `@rsbuild/plugin-react` | SWC 编译 JSX，`swcReactOptions.runtime` 默认 `'automatic'` |
| Vue 3 SFC | `@rsbuild/plugin-vue` | **JSX 需额外** `@rsbuild/plugin-vue-jsx` |
| Preact | `@rsbuild/plugin-preact` | react 别名指向 preact/compat |
| Svelte | `@rsbuild/plugin-svelte` | — |
| Solid | `@rsbuild/plugin-solid` | **必须同时装 `@rsbuild/plugin-babel`**（走 Babel 编译） |

> ⚠️ **React Fast Refresh 要求组件是具名函数**，匿名导出更新时会丢 state。**Solid 不走 SWC 走 Babel**，忘记加 `pluginBabel` 会编译失败。

## 四、CSS 与静态资源

- **CSS Modules**：默认识别 `*.module.*`；`import styles from './x.module.css'` 用 `styles.red`；具名导入需 `output.cssModules.namedExport: true`；全局样式用 `:global()`。
- **预处理器**：Sass = `@rsbuild/plugin-sass`、Less = `@rsbuild/plugin-less`（官方）；Stylus = `rsbuild-plugin-stylus`（社区）；Tailwind = `@rsbuild/plugin-tailwindcss`（v4）。
- **降级**：默认 **Lightning CSS** 自动加厂商前缀 + 按 browserslist 降级（不再默认依赖 autoprefixer）。
- **CSS 查询**：`?inline`（返回字符串，≥1.3.0）、`?raw`（原文）、`?url`（文件 URL，**不支持 CSS Modules**，≥2.0.2）。
- **SVGR**：`@rsbuild/plugin-svgr`，默认 `?react` 后缀转 React 组件（`import Logo from './logo.svg?react'`）；无后缀仍是 URL/base64。
- **public 目录**：放不需处理的资源，**用绝对路径引用、不要 import**。

> ⚠️ **HTML 模板引擎语义反直觉**：`<%= %>` 是**不转义**输出、`<%- %>` 是**转义**输出（与原生 EJS 相反）。

## 五、`tools` 透传底层

`tools.rspack` 是接入 Rspack 原生能力的逃生舱：

```ts
export default defineConfig({
  tools: {
    rspack: {
      plugins: [new SomeRspackPlugin()], // Rspack/webpack 原生插件
    },
    // 或函数式（可用 utils）
    // rspack: (config, { appendPlugins, removePlugin, mergeConfig }) => {
    //   removePlugin("ProgressPlugin");
    //   appendPlugins(new PluginA());
    // },
  },
});
```

> ⚠️ `tools.rspack` 传**对象**会与默认配置**深合并**；传**函数**且直接返回配置则**整体替换**、不再合并（保留默认要用 `utils.mergeConfig`）。`tools.bundlerChain` 执行**早于** `tools.rspack`，同项以 `tools.rspack` 为准。`removePlugin` 按**构造函数名**删除。

## 六、Code Splitting 与 Environments

### 代码分割

动态 `import()` 自动拆 chunk。**2.0 用顶层 `splitChunks`**（对齐 Rspack 原生，带 `per-package` 等 preset），**取代已废弃的 `performance.chunkSplit`**（旧配置仍兼容）。

### Environments 多环境

在单次执行中为多运行目标（web/node/worker）**并行构建**（底层 Rspack MultiCompiler），常用于 SSR / RSC / 多端：

```ts
export default defineConfig({
  environments: {
    web: { output: { target: "web" } },
    node: { output: { target: "node", distPath: { root: "dist/server" } } },
  },
});
```

> ⚠️ 多环境**必须为各环境设不同 `output.distPath.root`** 防文件名冲突；默认**并行**构建，需顺序（如 SSR）要用 `tools.rspack` 的 `name` + `dependencies`。`rsbuild --environment web` 可只构建指定环境。

## 七、TypeScript 与迁移

- **TS**：SWC 转译**不做类型检查**。需类型安全：① `@rsbuild/plugin-type-check`（独立进程，支持 dev/build）；② 脚本 `rsbuild build && tsc --noEmit`。须开 `isolatedModules`（TS<5）或 `verbatimModuleSyntax`（TS≥5），否则类型 re-export 报错。
- **从 webpack 迁移**（最省力）：卸 webpack 全家桶、装 `@rsbuild/core`；`entry`→`source.entry`；loader/plugin 多数内置可删（css-loader/babel-loader/style-loader/autoprefixer…）；原生插件搬到 `tools.rspack.plugins`。
- **从 CRA 迁移**：`react-scripts`→`@rsbuild/core` + `pluginReact`；`REACT_APP_`→`PUBLIC_` 前缀（或 `loadEnv({ prefixes: ['REACT_APP_'] })`）；输出 `build`→`dist`。
- **从 Vite 迁移**（最难）：端口 `5173`→`3000`；`index.html` 入口改造为 `html.template` + `source.entry`；`VITE_`→`PUBLIC_`；`build.lib` 无等价（改用 **Rslib**）。

> ⚠️ 迁移难度：**webpack → Rsbuild 最易**（配置模型刻意对齐），**Vite → Rsbuild 最难**（入口、env 前缀、worker query、`import.meta` 都要改）。
