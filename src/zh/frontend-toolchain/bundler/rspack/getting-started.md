---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **Rspack 2.0**（2026-04 发布）。要求 **Node.js 20.19+ / 22.12+**，核心包纯 ESM 发布。1.x 仍维护关键修复，涉及 1.x → 2.0 差异处均显式标注，详见[专家篇](./guide-line/expert)。

## 速查

- 安装：`npm add @rspack/core @rspack/cli -D`（需要本地开发服务器再加 `@rspack/dev-server`）
- 创建项目：`npm create rspack@latest`；想要开箱体验用上层 `npm create rsbuild@latest`
- 配置文件：默认读取 `rspack.config.js`（支持 `.mjs`/`.cjs`/`.ts`），结构对齐 **webpack 5**
- 命令：`rspack dev`（开发）｜ `rspack build`（构建）｜ `rspack preview`（预览产物）
- 核心认知：Rspack 是**底层打包器**（对位 webpack）；Rsbuild 是其上的一体化工具（对位 Vite）
- 转译：内置 SWC（`builtin:swc-loader`），**不再需要 babel-loader**；SWC 只剥类型**不做类型检查**
- CSS：原生支持，`type: 'css/auto'` 自动分流 CSS / CSS Modules，**不需要 css-loader**
- ⚠️ 2.0 纯 ESM：依赖 Node 20+ 的 `require(esm)`，CJS 工程通常无需改代码
- ⚠️ 自定义 `optimization.minimizer` 会让默认压缩器**整体失效**，JS 与 CSS 压缩器要一起配

## 一、Rspack 是什么

官方定义：「**Rspack is a fast Rust-based bundler for the web. It modernizes the webpack API to enable seamless replacement of webpack while delivering lightning-fast build speeds.**」

它诞生于字节跳动的真实痛点：内部大型单体应用**生产构建动辄 10~30 分钟、dev 冷启动数分钟**。由此立项的四点诉求——dev 启动够快、CI 构建够快、保留 webpack 式灵活配置、具备生产优化能力——决定了它的形态：**不另起炉灶发明新范式，而是用 Rust 重写 webpack 这一套**。

性能来源四件事：

1. **Rust 语言**：无 GC 停顿、内存安全、贴近硬件；
2. **高度并行化**：模块解析、转译、生成充分吃满多核；
3. **增量编译**：rebuild/HMR 只重算受影响部分（1.4 起默认开启）；
4. **内置关键能力**：SWC 转译、CSS 处理、压缩等在 Rust 侧实现，避免 JS 第三方包的通信开销。

## 二、与 webpack / Vite 的关系

| 维度 | webpack | **Rspack** | Vite |
|---|---|---|---|
| 实现语言 | JavaScript | **Rust** | JS + esbuild/Rolldown |
| dev 策略 | 打包 | **打包（但够快）** | 原生 ESM 免打包 |
| 配置模型 | webpack 配置 | **同 webpack 5** | 自有配置 + 插件 |
| 生态复用 | — | **loader/插件直接复用** | Rollup 插件体系 |
| 对位关系 | 被替换者 | **drop-in 替代** | 另一条路线 |

- 对 webpack 项目：Rspack 是**迁移成本最低**的提速路径——改包名、换少量插件即可（详见[进阶篇](./guide-line/advanced)）。
- 对比 Vite：Vite 靠「开发期不打包」起速，生产仍要 Rollup/Rolldown 打包，存在 dev/prod 行为差；Rspack dev/prod 走**同一条打包管线**，行为一致，靠 Rust 把打包本身做快。

## 三、安装与第一次构建

```bash
mkdir my-rspack && cd my-rspack
npm init -y
npm add @rspack/core @rspack/cli -D
```

新建 `rspack.config.mjs`：

```js
import { defineConfig } from '@rspack/core';

export default defineConfig({
  entry: { main: './src/index.js' },
  output: { filename: '[name].js' },
});
```

新建 `src/index.js`，然后在 `package.json` 加脚本并构建：

```jsonc
{
  "scripts": {
    "dev": "rspack dev",      // 需要安装 @rspack/dev-server
    "build": "rspack build",
    "preview": "rspack preview"
  }
}
```

> ⚠️ 2.0 起 `@rspack/cli` 零依赖、**不再捆绑开发服务器**：要跑 `rspack dev` 需手动 `npm add @rspack/dev-server -D`。

## 四、配置文件：对齐 webpack 5

Rspack 默认读取项目根的 `rspack.config.js`（亦支持 `.mjs`/`.cjs`/`.ts`）。配置结构与 webpack 5 高度对齐，老 webpack 手几乎零学习成本：

```js
export default defineConfig({
  entry: { main: './src/index.tsx' },
  output: { path: 'dist', filename: '[name].[contenthash].js', clean: true },
  resolve: { extensions: ['...', '.ts', '.tsx'] }, // '...' 代表保留默认扩展名
  module: { rules: [/* loader 规则，语义同 webpack */] },
  plugins: [/* webpack 风格插件 */],
  optimization: { splitChunks: { chunks: 'all' } },
});
```

这正是「drop-in 替代」的含义：**概念、字段、插件 hooks 都是 webpack 5 的**，差异集中在「内置能力换更快的实现」。

## 五、转译：builtin:swc-loader 一瞥

Rspack 内置 SWC（Rust 实现的转译器，官方引用数据：单线程比 Babel 快 20 倍、四核快 70 倍）。处理 TS/JSX 用 `builtin:swc-loader`——`builtin:` 前缀表示内置，**无需安装**：

```js
module: {
  rules: [
    {
      test: /\.(?:js|mjs|jsx|ts|tsx)$/,
      exclude: [/node_modules/],
      loader: 'builtin:swc-loader',
      options: { detectSyntax: 'auto' }, // 2.0：按扩展名自动推断语法
      type: 'javascript/auto',
    },
  ],
},
```

> 关键边界：SWC **只转译不做类型检查**——类型把关需另跑 `tsc --noEmit` 或 `ts-checker-rspack-plugin`。降级目标、polyfill、React Fast Refresh 详见[进阶篇](./guide-line/advanced)。

## 六、CSS：原生支持一瞥

Rspack 原生处理 CSS，常规场景**不需要 css-loader/style-loader**：

```js
module: {
  rules: [
    { test: /\.css$/, type: 'css/auto' },                          // *.module.css 自动走 CSS Modules
    { test: /\.scss$/, use: ['sass-loader'], type: 'css/auto' },   // 预处理器编译后交原生管线
  ],
},
```

`css/auto` 按文件名分流：`*.module.css` 按 CSS Modules 处理，其余按普通 CSS；产物默认输出独立 CSS 文件。与 `CssExtractRspackPlugin` 管线的取舍见[基础篇](./guide-line/base)。

---

跑通第一次构建后，进入 [指南 · 基础](./guide-line/base)：entry/output/resolve、module.rules 与资源模块、原生 CSS 的四种 type、devServer 与 HMR。
