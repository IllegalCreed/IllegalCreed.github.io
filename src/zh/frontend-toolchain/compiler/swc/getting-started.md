---
layout: doc
outline: [2, 3]
---

# 入门

> 基于 **@swc/core 1.15.x**（与 `@swc/cli 0.8.x`）。SWC 用 Rust 编写，做**转译 + 压缩**但**不做类型检查**；`@swc/core` 长期处于 1.x。涉及与 Babel / tsc 分工处均显式标注。

## 速查

- 安装：`npm i -D @swc/core @swc/cli`（核心 + 命令行）；按需 `@swc/helpers`（externalHelpers 运行时）、`swc-loader`（Webpack）、`@swc/jest`（Jest）
- 配置文件：`.swcrc`（项目根，JSON）；可加 `"$schema": "https://swc.rs/schema.json"` 获得编辑器补全
- 编译目录：`npx swc src -d dist`（输出到 `dist/`）｜ 监听：`npx swc src -d dist -w`
- 编程调用：`require("@swc/core").transform(code, options)` / `transformSync` / `transformFile`
- 核心认知：**SWC 只转译、不做类型检查**——「SWC only transpiles the code and doesn't perform type checking」，类型把关仍交 `tsc --noEmit`
- 定位：CLI 是 **Babel 的 drop-in replacement**；逐文件（file-by-file）转译，与 Babel / esbuild 同模型
- ⚠️ `jsc.target` 与 `env` **互斥**：配了 `env` 就不要再配 `jsc.target`（官方：env 方案「does not work with jsc.target」）
- ⚠️ `jsc.target` **默认 `es5`**：不写会一路降级到 ES5，按目标环境显式设 `es2020`/`es2022` 更稳

## 一、SWC 是什么

SWC（Speedy Web Compiler）是用 **Rust** 写的编译平台，对 `.js` / `.ts` / `.jsx` / `.tsx` 干三类事：

1. **转译（transpile）**：抹掉 TS 类型标注、把新语法（可选链、装饰器、JSX……）**降级**到 `jsc.target` 指定的 ECMAScript 版本，并按 `module.type` 转换模块格式。
2. **压缩（minify）**：内置一套 **Terser 兼容**的压缩器（compress / mangle / format）。
3. **打包（bundle / spack）**：实验性的打包能力（成熟度不足，生产打包通常仍交打包器）。

> 关键区别：**SWC 不做类型检查**。官方明确「SWC works on file-by-file, so any code transforms that depend on understanding the full type system will not work」——它和 Babel、esbuild 一样逐文件剥类型，语法对就放行。所以工程里常见组合是 **「SWC 负责极速 emit + `tsc --noEmit` 负责把关类型」**。

## 二、为什么需要 SWC

Babel 是 JS 写的、单线程，大项目转译慢；而直接写 `.ts` / JSX 浏览器和旧环境都不认。SWC 用 Rust 重写了这条「剥类型 + 降级」的链路：

- **快**：官方称「20x faster than Babel on a single thread and 70x faster on four cores」，原生并行充分利用多核；
- **省配置**：一份 `.swcrc` 覆盖语法、目标、模块、压缩，「works out of the box」；
- **可平滑替换 Babel**：CLI「designed to be a drop-in replacement for Babel」，Jest（`@swc/jest`）、Webpack（`swc-loader`）都有对应集成。

它解决的是「**emit 太慢**」，而非「类型安全」——后者仍归 tsc。

## 三、安装与第一次编译

```bash
mkdir my-swc && cd my-swc
npm init -y
npm i -D @swc/core @swc/cli   # 核心(napi) + 命令行
```

新建 `src/index.ts`：

```ts
const greet = (name: string): string => `Hello, ${name}`;
console.log(greet("SWC"));
```

最小可用 `.swcrc`：

```jsonc
{
  "$schema": "https://swc.rs/schema.json",
  "jsc": {
    "parser": { "syntax": "typescript", "tsx": true }, // 解析 TS/TSX
    "target": "es2022" // 降级目标（默认是 es5，建议显式设）
  },
  "module": { "type": "es6" } // 输出 ESM（默认）
}
```

```bash
npx swc src -d dist     # 把 src 转译到 dist/
node dist/index.js      # Hello, SWC
```

## 四、.swcrc 核心

> 官方：「Compilation works out of the box with SWC and does not require customization.」最小配置就能跑，按需再调。常用的几组：

| 字段 | 作用 | 常用值 |
|---|---|---|
| `jsc.parser.syntax` | 解析 JS 还是 TS | `"ecmascript"` / `"typescript"` |
| `jsc.parser.jsx` / `tsx` | 是否解析 JSX/TSX | `true`（React 项目） |
| `jsc.target` | 语法**降级**到哪代 ES | `es2020` / `es2022`（**默认 `es5`**） |
| `jsc.transform.react.runtime` | JSX 运行时 | `"automatic"`（React 17+）/ `"classic"` |
| `jsc.externalHelpers` | 助手函数外置到 `@swc/helpers` | `true`（减小体积） |
| `module.type` | 输出模块格式 | `es6`（默认）/ `commonjs` |
| `minify` | 是否压缩（顶层布尔） | `false`（构建期常交打包器） |

> ⚠️ **`jsc.parser` 必填语法类型**：TS 文件用 `{ syntax: "typescript", tsx?: true }`，普通 JS 用 `{ syntax: "ecmascript", jsx?: true }`——`tsx` 与 `jsx` 分属两种 parser，不要混。

## 五、CLI 与编程 API

**CLI**（`@swc/cli` 提供 `swc` 命令，是 Babel CLI 的替代）：

```bash
npx swc src -d dist        # 编译目录到 dist/
npx swc src -d dist -w     # 监听增量
npx swc file.ts -o out.js  # 单文件输出
npx swc src -d dist --source-maps   # 产出 source map
```

**编程 API**（`@swc/core`）——构建脚本 / loader 内部常用：

```js
const swc = require("@swc/core");

// 异步转译单段源码（最常用）
const out = await swc.transform(src, {
  filename: "input.ts",
  jsc: { parser: { syntax: "typescript" }, target: "es2020" },
  sourceMaps: true,
});
// out.code / out.map

// 同步版本：transformSync；按路径：transformFile / transformFileSync
// 压缩：minify / minifySync
```

> `transform*` 是「单文件、无类型检查」的快速路径；`@swc/jest`、`swc-loader` 内部都走它。

## 六、与 Babel、tsc 的关系

| 任务 | 谁来做 |
|---|---|
| 类型检查 | **只有 tsc**（`tsc --noEmit`）——SWC 不做 |
| 快速 emit `.js`（剥类型 + 降级） | **SWC** / esbuild / Babel（SWC 最快之一） |
| 压缩 minify | SWC（Terser 兼容）/ Terser / esbuild |
| 打包 / polyfill 注入 | 打包器 + core-js（SWC 的 `env` 可配 core-js，打包仍交打包器） |

- **vs Babel**：SWC 是 Babel 的 drop-in 替代，快得多、配置更省；代价是插件生态弱、且 Wasm 插件有版本耦合痛。
- **vs tsc**：互补不竞争——SWC 极速 emit，tsc 做权威类型检查与 `.d.ts`。标准组合是「SWC emit + `tsc --noEmit`」。

---

掌握基本编译后，进入 [指南 · 基础](./guide-line/base)：`.swcrc` 结构、`jsc.parser` / `jsc.target` / `module.type` 与 `minify` 的细节。
