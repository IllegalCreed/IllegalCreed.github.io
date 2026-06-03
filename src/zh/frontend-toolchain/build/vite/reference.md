---
layout: doc
outline: [2, 3]
---

# 参考

> 基于 **Vite 8.x**。配置项默认值、JS API、HMR API 速查。配置文档官方分为 Shared / Server / Build / Preview / Dep Optimization / SSR / Worker 七组。

## 配置文件

Vite 自动从项目根解析 `vite.config.{js,ts,mjs,cjs,mts,cts}`（即使项目非原生 ESM 也支持 ESM 语法）。

```ts
import { defineConfig } from "vite";

// 条件配置：导出函数
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  // command 在 dev + preview 为 'serve'，生产构建（含 SSR）为 'build'
  return {
    /* ... */
  };
});
```

- 三种类型提示：JSDoc `/** @type {import('vite').UserConfig} */`、`defineConfig({})`、`satisfies UserConfig`。
- `--configLoader`：`bundle`（默认，Rolldown 打包临时文件）/ `runner`（即时转换，**不支持 CJS 配置**）/ `native`（原生 runtime，**不自动检测模块更新**）。
- `.env` **不会**在 `vite.config.*` 运行期自动进 `process.env`，须手动 `loadEnv(mode, process.cwd(), '')`。

## 共享选项（shared）

| 选项 | 默认值 |
|---|---|
| `root` | `process.cwd()` |
| `base` | `'/'` |
| `mode` | serve=`'development'` / build=`'production'` |
| `publicDir` | `'public'`（`false` 禁用） |
| `cacheDir` | `'node_modules/.vite'` |
| `resolve.conditions` | `['module','browser','development\|production']` |
| `resolve.mainFields` | `['browser','module','jsnext:main','jsnext']` |
| `resolve.extensions` | `['.mjs','.js','.mts','.ts','.jsx','.tsx','.json']` |
| `json.namedExports` | `true` |
| `json.stringify` | `'auto'`（>10kB 才 stringify） |
| `envPrefix` | `'VITE_'`（**不能设空串**） |
| `appType` | `'spa'`（`'mpa'` / `'custom'`） |
| `clearScreen` | `true` |

> ⚠️ Vite 8：顶层 `esbuild` 选项已废弃，改用 `oxc`。

## 开发服务器（server）

| 选项 | 默认值 / 说明 |
|---|---|
| `server.host` | `'localhost'`（设 `true`/`'0.0.0.0'` 才监听所有地址） |
| `server.port` | `5173`（占用自动 +1） |
| `server.strictPort` | `false`（`true` 占用直接退出） |
| `server.fs.strict` | `true`（限制工作区根外文件，需 `fs.allow` 放行） |
| `server.fs.deny` | 默认屏蔽 `.env` / `.env.*` / `*.pem` / `.git/` |
| `server.allowedHosts` | `[]`（**部署/反代需显式配置或设 `true`**） |
| `server.proxy` | 字符串简写 / 对象 + `rewrite` / `RegExp` / `configure` / `ws` |
| `server.forwardConsole` | Vite 8 新增：转发浏览器运行时事件到服务端控制台 |

## 构建 / 预览 / Worker（Vite 8 默认）

```ts
build: {
  target: "baseline-widely-available", // ≤7 是 'modules'
  outDir: "dist",
  assetsDir: "assets",
  assetsInlineLimit: 4096, // 0 禁用内联
  minify: "oxc",           // 客户端默认（≤7 esbuild）；SSR 为 false
  cssMinify: "lightningcss", // ≤7 'esbuild'
  rolldownOptions: {},     // rollupOptions 为废弃别名
  sourcemap: false,        // 可 'inline' / 'hidden'
  manifest: false,         // → .vite/manifest.json
  modulePreload: { polyfill: true },
  chunkSizeWarningLimit: 500, // kB
}
```

- `preview.port` 默认 **4173**（唯一独立默认值），其余 `host`/`strictPort`/`https`/`cors`/`allowedHosts` 继承对应 `server.*`。
- `worker.format` 默认 `'iife'`（用 `import` 的 worker 须设 `'es'`）；`worker.plugins` **必须是返回新实例的函数**（并行构建复用，传共享实例出错）。

## 依赖预构建 / SSR 选项

```ts
optimizeDeps: {
  entries: undefined,      // 默认爬所有 .html
  include: [], exclude: [],
  rolldownOptions: {},     // esbuildOptions 为废弃别名
  force: false,
  noDiscovery: false,      // 取代已废弃的 disabled
  holdUntilCrawlEnd: true, // 实验
}
ssr: {
  external: undefined,     // 默认全外部化除 linked
  noExternal: undefined,
  target: "node",          // 或 'webworker'
  resolve: { conditions: [], externalConditions: ["node"] },
}
```

## JavaScript API

```ts
import { createServer, build, preview, resolveConfig, mergeConfig, loadEnv } from "vite";

// 开发服务器
const server = await createServer({ configFile: false, root, server: { port: 5173 } });
await server.listen();
server.printUrls();
// ViteDevServer 关键成员：config / middlewares(Connect) / httpServer(中间件模式为 null)
//   / watcher / ws / moduleGraph / transformRequest / ssrLoadModule / ssrFixStacktrace

// 构建（watch 模式返 watcher；JS API 抛 BundleError，用 .errors 取单错）
await build({ root, build: { rolldownOptions: {} } });

// 预览
const previewServer = await preview({ preview: { port: 8080 } });
previewServer.printUrls();

// 工具
const merged = mergeConfig(defaults, overrides); // 深合并，跳过 null/undefined
const env = loadEnv(mode, process.cwd(), "");    // 第三参前缀，'' = 全部
```

- `transformWithOxc` 取代已废弃的 `transformWithEsbuild`。
- 常量 `version` / `rolldownVersion`；`esbuildVersion` / `rollupVersion` 仅向后兼容保留，不代表实际引擎。
- 同进程同时用 `createServer` 和 `build` 时须把 `NODE_ENV`/mode 设 `'development'` 避免冲突。

## HMR API（`import.meta.hot`）

```ts
if (import.meta.hot) {
  // 生产为 undefined，必须守卫以 tree-shake
  import.meta.hot.accept();              // 标记自接受边界
  import.meta.hot.accept((mod) => {});   // 接受自身（mod 失败时 undefined）
  import.meta.hot.accept("./dep.js", (mod) => {});       // 单依赖
  import.meta.hot.accept(["./a.js", "./b.js"], ([a, b]) => {}); // 多依赖

  import.meta.hot.dispose((data) => {}); // 更新前清理副作用
  import.meta.hot.prune((data) => {});   // 模块不再被导入时清理
  import.meta.hot.data;                  // 跨更新持久化（只能 mutate 不能整体重赋值）
  import.meta.hot.invalidate("reason");  // 向上游 importers 传播，强制 full reload
}
```

::: warning 关键约束
- `accept(` 必须以**字面形式**出现在源码（whitespace-sensitive）才能被静态分析；不能用变量包装/解构后调用。
- 只有自接受或被接受的模块才 HMR，否则回溯到最近边界，找不到则 full reload。
- 内置事件：`vite:beforeUpdate` / `afterUpdate` / `beforeFullReload` / `beforePrune` / `invalidate` / `error` / `ws:disconnect` / `ws:connect`（`hot.on` 监听）。
- `hot.decline` 已是 no-op，迁移换 `hot.invalidate`；`import.meta.hot.accept` 传 URL 在 Vite 8 已移除。
:::
