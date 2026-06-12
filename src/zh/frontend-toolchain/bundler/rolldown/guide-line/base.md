---
layout: doc
outline: [2, 3]
---

# 指南 · 基础

> 版本基线 **rolldown 1.1.x**。本篇讲清三件事：Rolldown 为何存在（Vite 双引擎问题）、Oxc 底座是什么、platform/format 与内置功能的确切语义。

## 一、定位与动机：一个引擎替两个

Vite 7 及以前的架构是「**dev 用 esbuild，build 用 Rollup**」：

- esbuild 快但功能取向极简，产物控制（分包、HMR 协作、插件表达力）不满足生产打包需求；
- Rollup 产物质量高、插件生态好，但纯 JS 实现，大项目构建慢；
- 两套引擎语义有差异 → **开发与生产行为不一致**，且同一特性要维护两遍。

Rolldown 的答案是「**取两者之长的单一 Rust 引擎**」：

| 继承自 Rollup | 继承自 esbuild | 自己新增 |
|---|---|---|
| 配置形态 / JS API / 插件钩子 | 内置 TS/JSX/define/inject/minify | `codeSplitting` 手动分包 |
| 产物质量取向 | CJS 互操作语义 | hook filter、builtin Rust 插件 |

官方动机原文有三条：性能、与现有 Vite 生态的兼容、以及「实现其他工具不太可能加入的特性」。

## 二、Oxc 体系：Rolldown 的零件库

Oxc（The JavaScript Oxidation Compiler）是 VoidZero 体系的 Rust 编译器工具集，Rolldown 的各环节直接复用其组件：

| 环节 | Oxc 组件 | 在 Rolldown 中的角色 |
|---|---|---|
| 解析 | oxc parser | 源码 → AST（所有模块的入口处理） |
| 转换 | oxc transformer | TS 剥类型、JSX、`target` 语法降级、define/inject |
| 解析模块 | oxc-resolver | 裸导入 / alias / tsconfig paths 解析 |
| 压缩 | oxc minifier | `output.minify` 的实现 |

这正是 Rolldown「内置功能多还快」的结构性原因：不是把 Babel/terser 翻译成 Rust，而是整条管线原生协作、避免重复 parse。Vite 8 同样把 Oxc 作为编译层（如 `@vitejs/plugin-react` v6 用 Oxc 跑 React Refresh）。

## 三、platform 与输出格式

```js
export default defineConfig({
  platform: "browser", // 'browser' | 'node' | 'neutral'
  output: { format: "esm" }, // 'esm' | 'cjs' | 'iife' | 'umd'
});
```

- **platform 默认规则**：输出格式为 cjs 时默认 `'node'`，其余默认 `'browser'`；影响模块解析条件（如 exports 的 browser/node 条件）与 `process.env.NODE_ENV` 处理。
- **format 默认恒为 `esm`**——官方专门强调这是与 esbuild 的差异（esbuild 在 node 平台默认 cjs）。
- `neutral` 给跨环境通用库：不预设宿主、主要依赖 package.json `exports`。

::: warning browser 平台不会 polyfill Node 内置模块
`platform: 'browser'` 只影响解析与少量语义，**不会**像某些工具那样自动 shim `fs`/`path` 等 Node 内置模块。需要时用社区插件 `rolldown-plugin-node-polyfills`。
:::

## 四、内置功能全景（不用装插件的部分）

对比 Rollup 时代的「插件全家桶」，下面这些在 Rolldown 全部开箱：

| 能力 | Rollup 的做法 | Rolldown |
|---|---|---|
| TypeScript | @rollup/plugin-typescript | **内置**（Oxc，配 `tsconfig` 选项尊重 paths 等） |
| JSX | @rollup/plugin-babel | **内置** `transform.jsx` |
| node_modules 解析 | @rollup/plugin-node-resolve | **内置**（oxc-resolver） |
| CJS 互操作 | @rollup/plugin-commonjs | **内置**（esbuild 语义） |
| 常量替换 | @rollup/plugin-replace | **内置** `transform.define` + builtin:replace |
| 全局 shim | @rollup/plugin-inject | **内置** `transform.inject` |
| 压缩 | terser / esbuild 插件 | **内置** `output.minify`（Oxc minifier） |

> 边界再强调一次：TS 是「剥类型」不是「查类型」——CI 里保留 `tsc --noEmit`；`transform.target` 只降语法不补 polyfill。

一个覆盖常见需求的真实配置：

```js
import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/main.tsx",
  platform: "browser",
  tsconfig: "./tsconfig.json", // 启用 paths 别名等
  transform: {
    jsx: "react-jsx", // React 17+ automatic 运行时
    target: "es2020", // 语法降级（最低 es2015）
    define: { "process.env.NODE_ENV": "'production'" },
  },
  output: { dir: "dist", format: "esm", minify: true, sourcemap: true },
});
```

## 五、性能特征：数字与边界

- **合成基准**（官网，约 1.9 万模块）：Rolldown 1.61s ≈ esbuild 1.70s，**比 Rollup 快 10~30 倍**；
- **真实端到端案例**（Vite 8 / 1.0 公告）：Linear 46s → 6s，Ramp -57%，Mercedes-Benz.io -38%，Beehiiv -64%；
- 真实数字比合成基准保守是正常的：整条构建还有插件、压缩、I/O 等不可省环节；
- 预编译二进制覆盖 Linux x64/arm64、macOS、Windows；不支持的平台有 **Wasm 构建**兜底；
- 性能反面教材：**未配 filter 的重型 JS 插件**会把瓶颈拉回 JS 侧（见[进阶篇](./advanced)的 hook filter）。

---

进入 [指南 · 进阶](./advanced)：transform 全家桶、minify、codeSplitting 分包、插件系统与 hook filter、watch 与 tsdown。
