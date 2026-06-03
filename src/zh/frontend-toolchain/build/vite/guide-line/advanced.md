---
layout: doc
outline: [2, 3]
---

# 指南 · 进阶

> 基于 **Vite 8.x**。本篇覆盖批量导入、Worker / Wasm、依赖预构建、CLI、生产构建、多页与库模式——把 Vite 从「能跑」用到「会用」。

## 一、`import.meta.glob` 批量导入

Vite 提供 `import.meta.glob` 从文件系统**批量导入**多个模块：

```ts
const modules = import.meta.glob("./dir/*.js");
// 默认是「懒加载」：每个值是一个返回 Promise 的动态 import 函数
// {
//   './dir/foo.js': () => import('./dir/foo.js'),
//   './dir/bar.js': () => import('./dir/bar.js'),
// }
```

常用选项：

```ts
// eager: true —— 直接静态导入（无代码分割），值就是模块本身
const eager = import.meta.glob("./dir/*.js", { eager: true });

// 只取某个命名导出
const setups = import.meta.glob("./dir/*.js", { import: "setup" });

// 以字符串形式导入
const raws = import.meta.glob("./dir/*.md", { query: "?raw", import: "default" });

// 多模式 + 负向匹配
const some = import.meta.glob(["./dir/*.js", "!**/bar.js"]);
```

::: warning 两个硬约束
1. **所有参数必须是字面量（literal）**——模式、`eager`、`import` 等都不能用变量拼接，因为 Vite 在构建期静态分析它们（底层用 `tinyglobby` 匹配）。
2. **模式必须相对（`./`）、绝对（`/`）或 alias 开头**。
:::

与之相关的「**带变量的动态 import**」也有约束：`import(\`./dir/${file}.js\`)` 中变量只能表示**一层深**的文件名，且必须 `./` 或 `../` 开头并**带扩展名**。

## 二、Web Worker 与 WebAssembly

### Web Worker

推荐用 `new URL` + `import.meta.url` 的标准写法：

```ts
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});
```

> ⚠️ `new URL('./worker.js', import.meta.url)` **必须直接内联**在 `new Worker(...)` 里才能被 Vite 检测到；若先赋值给变量再传入会失效。

也可用查询后缀导入，三者产物不同：

| 写法 | 产物 |
|---|---|
| `import W from './w.js?worker'` | 独立 chunk 的 Worker 构造器 |
| `import W from './w.js?worker&inline'` | 内联为 base64 的 Worker |
| `import url from './w.js?worker&url'` | Worker 的 URL 字符串 |

Worker 内部支持 ESM `import`（而非传统的 `importScripts()`）。

### WebAssembly

```ts
// ?init 返回一个初始化函数
import init from "./example.wasm?init";

const { exports } = await init({
  // importObject，会传给 WebAssembly.instantiate
  imports: { imported_func: (arg) => console.log(arg) },
});
```

- 小于 `assetInlineLimit` 的 `.wasm` 会内联为 base64。
- 多次实例化用 `?url` + `WebAssembly.instantiateStreaming`。
- Vite **不支持** Wasm ESM Integration Proposal，需要它请用 `vite-plugin-wasm`。

## 三、依赖预构建

首次启动 dev server 时，Vite 会对依赖做「预构建（pre-bundling）」，**两大动因**：

1. **CommonJS / UMD → ESM**：浏览器原生不支持裸模块导入与 CJS，预构建把它们转成 ESM。
2. **合并请求**：把含大量内部模块的 ESM 依赖合并为单文件——如 `lodash-es` 有 600+ 内部模块，不合并会产生 600+ 个 HTTP 请求。

> **版本差异**：Vite 8 的预构建由 **Rolldown** 执行（很快）；Vite ≤7 用 **esbuild**。

### 缓存与失效

预构建产物缓存在 `node_modules/.vite`，URL 形如 `/node_modules/.vite/deps/my-dep.js?v=hash`，强缓存（`max-age=31536000,immutable`）。**缓存失效来源**只有这几项：

- lockfile 内容（`package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` / `bun.lock`）
- `patches` 文件夹的 mtime
- `vite.config.js` 中的相关字段
- `NODE_ENV` 的值

```bash
# 强制重新预构建
vite --force
# 或直接删缓存
rm -rf node_modules/.vite
```

::: warning `pnpm link` 的坑
改了 `pnpm link` 进来的本地依赖源码，**不会**触发重新预构建（因为它只看 lockfile / patches / config / NODE_ENV），必须 `vite --force`。常用 `optimizeDeps.include` 把 linked 依赖强制纳入预构建。
:::

常用配置：`optimizeDeps.include`（强制预构建，如深层导入）、`optimizeDeps.exclude`（排除）、`optimizeDeps.entries`（默认爬所有 `.html`）。

## 四、CLI 命令与选项

四类命令：

| 命令 | 作用 |
|---|---|
| `vite` / `vite dev` / `vite serve` | 启动开发服务器（三者别名） |
| `vite build` | 生产构建 |
| `vite preview` | 本地预览构建产物（**不可作生产服务器**） |
| `vite optimize` | 已废弃（自动运行） |

**开发 / 预览网络选项**：`--host [host]`、`--port <port>`、`--open [path]`、`--strictPort`（占用则退出）、`--force`（忽略缓存重新预构建）。

**build 选项**（Vite 8 默认值已变）：

```bash
vite build \
  --target baseline-widely-available \  # Vite 8 默认（≤7 是 'modules'）
  --outDir dist \
  --minify oxc \                        # Vite 8 默认 oxc（≤7 是 esbuild）
  --sourcemap \
  --ssr src/entry-server.js \
  --watch                               # 监听重建
```

**全局短别名**（高频考点）：`-c/--config`、`-l/--logLevel`、`-m/--mode`、`-d/--debug`、`-f/--filter`、`-v/--version`、`-h/--help`。还有 `--base`、`--configLoader`（`bundle` 默认 / `runner` / `native`）。

## 五、生产构建与浏览器目标

`vite build` 默认入口是 `<root>/index.html`，产出可直接托管的静态资源。

### `build.target` 与浏览器目标

```ts
export default defineConfig({
  build: {
    // Vite 8 默认 'baseline-widely-available'：
    //   对应 chrome111 / edge111 / firefox114 / safari16.4（约 2.5 年前浏览器）
    // Vite 7 默认对应 chrome107 / edge107 / firefox104 / safari16.0
    target: "baseline-widely-available",
  },
});
```

特殊值：`esnext`、`modules`；最低可设到 `es2015`（再低 Vite 依赖原生 ESM 动态导入 + `import.meta` 无法支撑）。

> ⚠️ Vite **只做语法转换，不提供 polyfill**。要支持老旧浏览器请用 `@vitejs/plugin-legacy`。

### 压缩与代码分割

- `build.minify`：Vite 8 默认客户端 `'oxc'`（SSR 为 `false`）。**Oxc Minifier 比 terser 快 30~90 倍**，压缩率只差 0.5~2%。
- CSS 代码分割默认开启（`build.cssCodeSplit`），异步 chunk 的 CSS 自动抽独立文件并加 `<link>`。
- 自动为入口与直接 import 生成 `<link rel="modulepreload">` 消除深 import 链的多次往返。

### Vite 8 构建迁移要点

| Vite ≤7 | **Vite 8** |
|---|---|
| `build.rollupOptions` | `build.rolldownOptions`（旧名废弃保留） |
| `output.manualChunks` | `advancedChunks` / `codeSplitting`（对象形式不再支持） |
| `output.format: 'system' / 'amd'` | 不再支持 |
| 顶层 `esbuild` 选项 | 顶层 `oxc` 选项 |

## 六、base 与多页应用

### `base` 公共基础路径

```ts
export default defineConfig({
  base: "/my-app/", // 部署到子路径
});
```

- 根域：`'/'`（默认）；子路径：`'/<REPO>/'`；相对：`'./'`。
- `base` 会自动调整 JS 导入资源 URL、CSS `url()`、HTML 资源引用。
- 运行时访问基础路径用 `import.meta.env.BASE_URL`——**构建时静态替换，必须原样写，不能字符串拼接**。

### 多页应用（MPA）

通过 `build.rolldownOptions.input` 指定多个 HTML 入口：

```ts
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        nested: resolve(__dirname, "nested/index.html"),
      },
    },
  },
});
```

> Vite 忽略 `input` 对象的键名，用文件解析后的 id 生成 dist HTML。

## 七、库模式

打包一个 npm 库用 `build.lib`：

```ts
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MyLib", // UMD/IIFE 全局变量名（必需）
      fileName: "my-lib", // → my-lib.js / my-lib.umd.cjs
    },
    rolldownOptions: {
      // 不内联 peer 依赖
      external: ["vue"],
      output: { globals: { vue: "Vue" } }, // UMD 全局名映射
    },
  },
});
```

- **默认格式**：单入口 → `['es', 'umd']`；多入口 → `['es', 'cjs']`（UMD 不支持多入口）。
- 当 `package.json` 无 `"type": "module"` 时，`.js`→`.mjs`、`.cjs`→`.js` 以兼容 Node。
- `package.json` 需配 `exports` 区分 `import` / `require`（及 `./style.css`）。

::: warning 库构建中的 env 差异
`import.meta.env.*` 在生产构建会静态替换，但 `process.env.*` **不替换**。若要让使用方通过 `process.env.NODE_ENV` 控制行为，用 `define` 覆盖或改用 `esm-env`。
:::

---

接下来是 [高级篇](./expert)：SSR、后端集成、Environment API、插件系统与 Rolldown 内核。
