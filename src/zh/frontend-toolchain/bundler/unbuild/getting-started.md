---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **unbuild 3.6.1**（npm `latest`，2026-06 核实）。底座：rollup ^4.50 + esbuild（转译/压缩）+ rollup-plugin-dts（声明）+ jiti ^2.5（stub 与配置加载）+ mkdist ^2.3（bundleless）。

## 速查

- 安装：`npm i -D unbuild`；构建：`npx unbuild`（package.json 配 `"build": "unbuild"`、`"prepack": "unbuild"`）
- 配置：`build.config.ts` + `defineBuildConfig`（后缀族 `{js,cjs,mjs,ts,mts,cts,json}` 全支持，也可写 package.json 的 `unbuild` 字段）
- 零配置：entries 从 package.json 的 `exports`/`main`/`module`/`types`/`bin` 反向推断到 `src/`
- 产物：ESM（`.mjs`）始终输出；CJS（`.cjs`）由 `rollup.emitCJS` 开启（可被推断自动打开）；默认 `outDir: 'dist'`
- 声明：`declaration: true ≡ 'compatible'`（d.ts + d.mts + d.cts）｜`'node16'`（仅 d.mts + d.cts）｜不写则按 `types` 字段自动探测
- ⚠️ 开发期主推 `unbuild --stub`（stub mode），`--watch` 是 experimental
- ⚠️ `failOnWarn` 默认 `true`：unused/implicit 依赖警告会让进程**退出码 1**

## 一、unbuild 是什么

官方一句话：「**A unified JavaScript build system**」。它是 UnJS 生态面向 **npm 库构建**的统一方案，一次构建里可以混用四种 builder：

| builder | 干什么 |
|---|---|
| **rollup**（默认） | Rollup 打包：TS/JS → ESM/CJS bundle + 类型声明 |
| **mkdist** | bundleless：逐文件转译、保留目录结构（组件库向） |
| **copy** | 原样复制资源目录 |
| **untyped** | 从配置对象生成类型与 Markdown 文档（集成 unjs/untyped） |

它**不是**应用打包器：没有 dev server、没有 HMR。Nuxt/Nitro 体系与 ofetch、defu、h3 等 UnJS 包的 `build` 脚本就是一条 `unbuild`。

## 二、安装与第一次构建

```bash
mkdir my-lib && cd my-lib && npm init -y
npm i -D unbuild typescript
```

写源码 `src/index.ts`：

```ts
export const log = (...args: unknown[]): void => {
  console.log(...args);
};
```

在 package.json 里**描述产物**（这同时就是构建配置）：

```json
{
  "type": "module",
  "scripts": { "build": "unbuild", "prepack": "unbuild" },
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" }
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"]
}
```

构建：

```bash
npx unbuild
# ℹ Automatically detected entries: src/index.ts [esm] [cjs] [dts]
# ✔ Build succeeded for my-lib
#   dist/index.mjs (total size: 110 B, exports: log)
```

CLI 输出直接列出**产物体积与导出名**，方便快速核对。

## 三、零配置的原理：从 package.json 推断

上面没写任何配置文件，unbuild 做了三件事：

1. **收集输出**：读 `exports`、`main`、`module`、`types`/`typings`、`bin` 字段指向的文件；
2. **反向映射**：把 `./dist/index.mjs` 这类输出路径匹配回 `src/index.ts` 作为入口；
3. **决定格式**：发现 `require`/`.cjs` 输出 → 自动开 `rollup.emitCJS`；发现 `types` → `declaration: 'compatible'`。

所以「**包怎么声明，就怎么构建**」——package.json 是唯一事实源，避免配置与发布字段两边漂移。找不到对应源文件时会警告 `Could not find entrypoint for ...`。

## 四、build.config.ts：需要更多控制时

```ts
// build.config.ts
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  // 不写 entries 则仍走自动推断
  entries: ["./src/index"],
  declaration: "compatible", // d.ts + d.mts + d.cts
  rollup: {
    emitCJS: true, // 追加 .cjs 输出
  },
});
```

要点：

- 配置由 **jiti** 加载，TS 配置开箱即用；
- `defineBuildConfig` 也接受**数组**——多份独立构建（如常规版 + minified 版）依次执行；
- Rollup 细节都收在 `rollup` 字段下（`esbuild`、`output`、`dts`、`inlineDependencies` 等），不读 `rollup.config.js`。

## 五、stub mode 初体验

开发一个被别的包引用的库时，传统做法是开 `--watch` 反复重建。unbuild 的答案是**桩化**：

```bash
npx unbuild --stub   # 只需执行这一次
```

之后 `dist/index.mjs` 里不是构建产物，而是一段 **jiti 即时加载器**——运行时现场转译并执行 `src/index.ts`。效果：**改 src 即时生效，无需重建、无需任何 watch 进程**，README 称之为 *passive watcher*。日常工作流：

```jsonc
// package.json
{ "scripts": { "dev": "unbuild --stub", "build": "unbuild" } }
```

> ⚠️ stub 产物依赖 jiti 做运行时转译，**只用于开发**；发布前必须真实构建（这正是 `prepack: unbuild` 的意义）。

---

继续 [指南 · 基础](./guide-line/base)：entries 与 builder 选择规则、推断细节、双格式输出与 declaration 全解、配置加载与合并。
