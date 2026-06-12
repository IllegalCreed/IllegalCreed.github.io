---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **unbuild 3.6.1**。本篇把入门篇的「能构建」展开成「懂构建」：entries 的两种形态与 builder 选择规则、自动推断的完整链路、双格式输出、externals 策略、配置加载与合并。

## 一、安装与脚本约定

```bash
npm i -D unbuild
```

```jsonc
// package.json —— UnJS 系包的典型三件套
{
  "scripts": {
    "build": "unbuild",        // 真实构建
    "dev": "unbuild --stub",   // 开发：桩化一次，改 src 即时生效
    "prepack": "unbuild"       // 发布兜底：npm pack/publish 前强制真实构建
  }
}
```

`prepack` 这条不是装饰：stub 模式会往 dist 写**不可发布**的 jiti 加载器，prepack 确保发布物永远来自真实构建。

## 二、entries：两种形态与 builder 选择规则

```ts
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    // 1. string 形态：rollup 打包入口（可省略 .ts 后缀）
    "./src/index",
    // 2. 对象形态：完整控制 builder / input / outDir
    { builder: "mkdist", input: "./src/components/", outDir: "./dist/components" },
  ],
});
```

不写 `builder` 字段时的**自动选择规则**：

- `input` 以 `/` 结尾（目录型入口）→ **mkdist**（bundleless 逐文件转译）；
- 否则 → **rollup**（默认，bundle）。

所以 `entries: ["./src/components/"]` 一个斜杠就切换了构建模式。四种 builder（rollup / mkdist / copy / untyped）可以在同一个 entries 数组里混用，默认按 **untyped → mkdist → rollup → copy** 串行执行，`parallel: true`（或 `--parallel`）时四类任务并行。

## 三、自动推断：从 package.json 到 entries 的完整链路

不写 entries 时由内置 **autoPreset** 接管（日志可见 `Automatically detected entries: ...`）：

1. **收集输出**：读 package.json 的 `exports`（递归提取所有条件导出）、`main`、`module`、`types`/`typings`、`bin`（string 或对象均可）字段指向的文件；
2. **反向映射**：扫描 `src/`，把 `./dist/index.mjs` 这类输出路径匹配回 `src/index.ts` 作为入口；目录型导出（以 `/` 结尾）映射成 mkdist 入口；
3. **顺带定格式**：推断出 CJS 输出 → 自动开 `rollup.emitCJS`；推断出声明输出 → `declaration: 'compatible'`。

**格式判定规则**（决定要不要 emitCJS）：

| 输出文件后缀 | 判定                                          |
| ------------ | ---------------------------------------------- |
| `.mjs`       | 恒为 ESM                                       |
| `.cjs`       | 恒为 CJS                                       |
| `.js`        | 包有 `"type": "module"` → ESM；否则 → CJS      |

所以 `"type": "module"` + `"main": "./dist/index.js"` 会按 ESM 理解，**不会**触发 emitCJS。输出文件找不到对应源文件且磁盘上也不存在时，警告 `Could not find entrypoint for ...`。

## 四、双格式输出：ESM 恒出，CJS 可选

- rollup 构建**始终输出 ESM**，入口文件名固定 `[name].mjs`；
- `rollup: { emitCJS: true }` 追加一组 `[name].cjs` 输出（autoPreset 推断出 CJS 时自动打开）；
- 后缀固定 `.mjs`/`.cjs`，格式在构建期就确定，与 package.json `type` 字段无歧义纠缠（要改文件名走 `rollup.output`）；
- **不支持 UMD/IIFE**——unbuild 定位 npm 库的 ESM/CJS 双格式，浏览器 `<script>` 直引场景请换工具。

配套的 package.json 写法（同时也是自动推断的「事实源」）：

```jsonc
{
  "exports": {
    ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" }
  },
  "main": "./dist/index.cjs",
  "types": "./dist/index.d.ts"
}
```

## 五、externals：哪些依赖不打进产物

默认 external 名单（源码 `inferPkgExternals`）：

- **Node 内置模块**（`fs` 与 `node:fs` 两套写法都算）；
- **dependencies、peerDependencies** 声明的所有包。

语义：运行时依赖会随 `npm install` 到位，库产物没必要也不应该内联它们。两个推论：

- **devDependencies 不在名单**：源码 import 了 devDeps（或未声明的包）会被**内联**进产物，并触发 `Implicitly bundling "xxx"` 警告，收尾汇总 `Potential implicit dependencies found`——默认 `failOnWarn: true` 下退出码 1；
- 处理方式二选一：把它**声明进 dependencies**（external 化），或用 `rollup.inlineDependencies` 明确表态内联（`true` 全内联，数组按 string/RegExp 名单）。

追加 external 走顶层 `externals: ['some-pkg', /^@scope\//]`。

## 六、配置加载与合并

- 配置文件后缀族 `build.config.{js,cjs,mjs,ts,mts,cts,json}` 全支持——由 **jiti** 加载，TS 配置开箱即用；
- 也可写在 package.json 的 `unbuild` 字段（JSON，无类型提示）；
- `defineBuildConfig` 可传**数组**：多份独立构建依次执行（如常规版 + `name: 'minified'` 压缩版各占一个 outDir），数组成员之间互不合并；
- 合并策略：build.config 文件、package.json `unbuild` 字段、preset、内置默认值之间用 **defu 深合并**，左侧优先。

---

进入[指南 · 进阶](./advanced)：rollup 与 mkdist 双模式实战、stub mode 原理与开发工作流、declaration 三取值、hooks 体系。
