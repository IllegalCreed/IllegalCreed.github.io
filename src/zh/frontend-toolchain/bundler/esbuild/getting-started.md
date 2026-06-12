---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **esbuild 0.28.x**（npm `latest`，2026-06 为 0.28.1，要求 Node ≥ 18）。esbuild 仍是 **0.x**：官方约定 **patch 向后兼容、minor 承载破坏性变更**，因此安装命令统一带 `--save-exact`。

## 速查

- 安装：`npm install --save-exact --save-dev esbuild`（按平台拉取原生二进制，**node_modules 不可跨系统复制**）
- 第一条命令：`esbuild app.jsx --bundle --outfile=out.js`（**`--bundle` 默认关闭**，不开则只转换单文件、import 原样保留）
- 两个 API：**build**（打包、读写文件、可用插件）｜ **transform**（内存字符串单文件转换、无文件系统、不能打包/插件）
- 核心认知：esbuild 做**打包 + 转译 + 压缩**，**不做类型检查 / 不降级 ES5 / 不做 HMR / 不注入 polyfill**
- 输出三格式：`iife`（browser 默认）/ `cjs`（node 默认）/ `esm`（neutral 默认；splitting 与顶层 await 仅此格式）
- 开发体验：`--watch`（轮询增量重建）+ `--serve --servedir=www`（按请求构建，永远最新产物）
- ⚠️ TS 只剥类型：类型把关另跑 `tsc --noEmit`；`.d.ts` 也要交给 tsc
- ⚠️ `--target=es5` 不是降级开关：遇到需要降到 ES5 的语法会**直接报错**

## 一、esbuild 是什么

官方定义：「**An extremely fast bundler for the web.**」它是用 **Go 编写、编译为原生代码**的打包器兼压缩器，口号是「**Extreme speed without needing a cache**」。官网首页基准（打包 10 份 three.js 的生产构建，含 minify + sourcemap、无缓存）：

| 工具 | 耗时 |
|---|---|
| **esbuild** | **0.39s** |
| Parcel 2 | 14.91s |
| Rollup 4 + terser | 34.10s |
| webpack 5 | 41.21s |

主要能力：内置 **JS / CSS / TS / JSX**、bundle、tree shaking、minify、source map、watch、本地服务器、插件。**CLI / JS / Go 三套 API** 形态一致。

> 关键边界：**不做类型检查**（TS 只剥类型）、**不支持 ES6+ → ES5 降级**、**不做 HMR**（live reload 是整页刷新）、**不注入 polyfill**（target 只管语法）。这些是官方 FAQ 明确「有意不做」或文档划定的硬边界。

## 二、安装

```bash
npm install --save-exact --save-dev esbuild
./node_modules/.bin/esbuild --version   # 0.28.1
```

- `--save-exact` 的原因：esbuild 的 **minor 版本就是破坏性变更**（0.27 → 0.28 可能不兼容），必须锁精确版本。
- npm 包按当前平台拉取**原生二进制**（`@esbuild/darwin-arm64` 等 optionalDependencies）——所以不要在 macOS 装好后把 `node_modules` 拷给 Linux 用。
- 其他安装方式：`esbuild-wasm`（浏览器/无原生支持平台可用，**慢约 10 倍**）、`curl -fsSL https://esbuild.github.io/dl/v0.28.1 | sh` 直接下载二进制、Go 源码构建。

## 三、第一次打包

官网 Getting Started 的 React 示例，新建 `app.jsx`：

```jsx
import * as React from 'react'
import * as Server from 'react-dom/server'

let Greet = () => <h1>Hello, world!</h1>
console.log(Server.renderToString(<Greet />))
```

```bash
npm install react react-dom
npx esbuild app.jsx --bundle --outfile=out.js
node out.js   # <h1 data-reactroot="">Hello, world!</h1>
```

三个要点：

1. **`--bundle` 必须显式开启**——默认 esbuild 只转换入口文件本身，import 原样保留、依赖不被打包；
2. `.jsx` 扩展名**自动启用 JSX 解析**（`.js` 里写 JSX 需 `--loader:.js=jsx`）；
3. `--outfile` 单文件输出；多入口或开 splitting 时改用 `--outdir`。

## 四、build 与 transform 两个 API

```js
// build：打包 + 文件系统 + 插件
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.jsx'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
  outfile: 'out.js',
})
```

```js
// transform：内存字符串单文件转换（Vite 转 TS/JSX 用的就是它）
const result = await esbuild.transform('let x: number = 1', { loader: 'ts' })
console.log(result.code)   // let x = 1;
```

官方定位：transform 是「**build 的受限特例**——在隔离环境中转换一段表示内存文件的代码字符串」，**不能打包、不能用插件、不碰文件系统**。另有 `buildSync`/`transformSync` 同步版：仅 Node 可用、阻塞线程、**不能用插件**，非必要不用。

## 五、浏览器与 Node 两种打包

```bash
# 浏览器：默认 platform=browser，bundle 时 format 默认 iife
esbuild app.jsx --bundle --minify --sourcemap \
  --target=chrome58,firefox57,safari11,edge16 --outfile=out.js

# Node：format 默认 cjs，Node 内置模块自动 external
esbuild app.js --bundle --platform=node --target=node18 --outfile=out.js

# Node 且依赖全部外置（只打包自己的源码）
esbuild app.js --bundle --platform=node --packages=external --outfile=out.js
```

`platform` 的联动默认值是理解 esbuild 行为的关键：

| | `browser`（默认） | `node` | `neutral` |
|---|---|---|---|
| 默认 format | `iife` | `cjs` | `esm` |
| Node 内置模块 | 不特殊处理 | **自动 external** | 不特殊处理 |
| exports 条件 | `browser` | `node` | 无 |
| 附加行为 | 自动 define `process.env.NODE_ENV` | mainFields 含 `main` | mainFields 为空 |

## 六、开发模式：watch + serve

```bash
esbuild app.jsx --bundle --outdir=www/js --watch --servedir=www
```

- **watch**：监听文件自动重建（实现是**可移植的轮询**：每轮扫随机子集、约 2 秒全量覆盖、近期变更路径每轮必查）；
- **serve**：本地开发服务器，**每个请求到来时若无构建进行则先重建再响应**——浏览器永远拿到最新产物，没有缓存失效问题；产物存内存不落盘；
- live reload 一行接入：`new EventSource('/esbuild').addEventListener('change', () => location.reload())`。

JS API 里这套能力统一挂在 **context API**（v0.17+）上：`esbuild.context()` → `ctx.watch()` / `ctx.serve()` / `ctx.rebuild()` / `ctx.dispose()`，详见[进阶篇](./guide-line/advanced)。

---

掌握第一次打包后，进入 [指南 · 基础](./guide-line/base)：bundle 语义、format × platform、loader 与内容类型、target 与 ES5 边界。
