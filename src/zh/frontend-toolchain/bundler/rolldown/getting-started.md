---
layout: doc
outline: [2, 3]
---

# 入门

> 版本基线 **rolldown 1.1.x**（2026-06 `latest`）。**1.0 stable 于 2026-05-07 发布**（1 月起为 1.0 RC）；**Vite 8（2026-03-12）起 Rolldown 是 Vite 默认打包器**。

## 速查

- 安装：`npm i -D rolldown`（单包内含 CLI + JS API，预编译二进制，无需 Rust 环境）
- 命令：`npx rolldown src/main.js --file bundle.js`｜目录输出 `-d dist`｜格式 `--format cjs`
- 配置：`rolldown.config.js` + `defineConfig`（支持 `.ts`/`.mjs` 等，导出数组可跑多份配置）
- 定位：**Rollup 兼容 API + esbuild 内置功能**，底座 Oxc，首要使命是 Vite 统一打包器
- 内置：TS/JSX 转换、语法降级（最低 ES2015）、define/inject、CJS 互操作、oxc-resolver 解析、Oxc minify
- 默认输出格式**恒为 `esm`**（与 esbuild「node 平台默认 cjs」不同）
- ⚠️ 只转语法**不做类型检查**（配 `tsc --noEmit`），target 降级**不注入 polyfill**
- ⚠️ `manualChunks` 已废弃 → 用 `output.codeSplitting`

## 一、Rolldown 是什么

官方定义：用 Rust 编写的 JavaScript 打包器，「**primarily designed to serve as the underlying bundler in Vite, with the goal to replace esbuild and Rollup**」。三个创建动机：

1. **性能**：Rust + 多核并行，与 esbuild 同量级，比纯 JS 实现的 Rollup 快 10~30 倍；
2. **生态兼容**：API 与插件接口对齐 Rollup，让 Vite/Rollup 插件生态平滑迁移；
3. **补齐别人不做的特性**：如 webpack 式手动分包（`codeSplitting`）——esbuild 与 Rollup 都没有。

它同时是**通用打包器**：脱离 Vite 也能用 CLI/JS API 独立打包应用与库（库场景官方推荐上层工具 [tsdown](https://tsdown.dev/)）。

> 关键边界：与 esbuild/SWC 一样，Rolldown **只转换不做类型检查**——TS 类型把关仍需 `tsc --noEmit`。

## 二、为什么要「统一 Vite 双引擎」

Vite 7 及以前是双引擎架构：**dev 用 esbuild**（依赖预构建 + TS/JSX 转换）、**build 用 Rollup**（生产打包）。两套实现导致：

| 痛点 | 说明 |
|---|---|
| 行为不一致 | 解析、CJS 互操作、输出细节两套语义，「dev 正常、build 才暴露」 |
| 性能天花板 | Rollup 是纯 JS 实现，大项目生产构建慢，成为整条链路瓶颈 |
| 双倍维护 | 同一特性要在两个引擎各对齐一遍 |

Rolldown 用单一 Rust 引擎统一两端。落地节奏：2025 年通过临时包 `rolldown-vite` 公测 → **2026-03-12 Vite 8 stable 直接内置**，升级 Vite 8 即默认使用 Rolldown。

## 三、安装与第一次打包

```bash
mkdir my-rolldown && cd my-rolldown
npm init -y
npm i -D rolldown
```

写一个入口 `src/main.ts`（直接用 TS + 新语法，无需任何插件）：

```ts
const greet = (name: string): string => `Hello, ${name}`;
console.log(greet("Rolldown"));
```

打包：

```bash
npx rolldown src/main.ts --file bundle.js   # 单文件输出
npx rolldown src/main.ts -d dist            # 目录输出
npx rolldown src/main.ts -d dist --format cjs --minify  # CJS + 压缩
```

TS 转换、模块解析、压缩全是内置能力——对比 Rollup 需要 `@rollup/plugin-typescript` + `@rollup/plugin-node-resolve` + `@rollup/plugin-commonjs` + terser 插件的「全家桶」，这是体感差异最大的地方。

## 四、配置文件

推荐 `rolldown.config.js`（也支持 `.cjs`/`.mjs`/`.ts`/`.mts`/`.cts`），用 `defineConfig` 获得类型提示：

```js
// rolldown.config.js
import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/main.ts",
  platform: "browser", // browser | node | neutral
  output: {
    dir: "dist",
    format: "esm", // esm | cjs | iife | umd（默认恒为 esm）
    minify: true, // 内置 Oxc minifier
  },
});
```

```bash
npx rolldown -c                      # 读取 rolldown.config.js
npx rolldown -c rolldown.prod.ts     # 指定配置文件
```

导出**数组**即可一次跑多份构建（如同时出 esm + cjs）。

## 五、JavaScript API

与 Rollup 同构的两步式 API，另有一步式 `build()` 与 `watch()`：

```js
import { rolldown, build, watch } from "rolldown";

// 两步式：构建 → 输出（同一 bundle 可多次 generate/write）
const bundle = await rolldown({ input: "src/main.ts" });
await bundle.write({ dir: "dist", format: "esm" });
await bundle.close();

// 一步式
await build({ input: "src/main.ts", output: { dir: "dist" } });

// 监听模式（Rollup 兼容的事件模型）
const watcher = watch({ input: "src/main.ts", output: { dir: "dist" } });
watcher.on("event", (e) => console.log(e.code));
```

## 六、与 Rollup / esbuild 的关系速记

| 维度 | Rollup | esbuild | **Rolldown** |
|---|---|---|---|
| 实现语言 | JavaScript | Go | **Rust（Oxc 底座）** |
| API/插件 | 基准 | 自有体系 | **兼容 Rollup** |
| TS/JSX/minify | 靠插件 | 内置 | **内置（Oxc）** |
| CJS 互操作 | 靠 commonjs 插件 | 内置 | **内置（esbuild 语义）** |
| 手动分包 | manualChunks（弱） | 无 | **codeSplitting（splitChunks 式）** |
| 速度 | 1×（基线） | ~Rolldown 同级 | **10~30×于 Rollup** |

---

掌握安装与基本打包后，进入 [指南 · 基础](./guide-line/base)：双引擎动机细节、Oxc 体系、platform/format 语义与内置功能全景。
